import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions, getOrCreateActiveUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  BUILTIN_GHOSTREADER_PROMPTS,
  DEFAULT_SHORTCUTS,
  DEFAULT_USER_SETTINGS,
  SUGGESTED_FEEDS,
} from '@/lib/default-data';

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = await getOrCreateActiveUser(session?.user?.email);
    const body = await req.json();

    const action = body.action || body.events?.[0]?.name || 'noop';
    const payload = body.payload || body;

    let resultData: any = { ok: true, action };

    switch (action) {
      case 'triage-document': {
        const { documentId, triageStatus, isShortlisted, isSeen, readingProgress } = payload;
        const prev = await prisma.document.findFirst({
          where: { id: documentId, userId: user.id },
        });
        if (!prev) {
          return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        const updateData: any = { lastStatusUpdate: new Date() };
        if (triageStatus !== undefined) updateData.triageStatus = triageStatus;
        if (isShortlisted !== undefined) updateData.isShortlisted = isShortlisted;
        if (isSeen !== undefined) updateData.isSeen = isSeen;
        if (readingProgress !== undefined) {
          updateData.readingProgress = readingProgress;
          updateData.lastOpenedAt = new Date();
        }

        // If shortlist toggled, also sync 'shortlist' tag
        if (isShortlisted !== undefined) {
          const tags = safeParseJson<string[]>(prev.tagsJson, []);
          const nextTags = isShortlisted
            ? Array.from(new Set([...tags, 'shortlist']))
            : tags.filter((t) => t !== 'shortlist');
          updateData.tagsJson = JSON.stringify(nextTags);
        }

        const updated = await prisma.document.update({
          where: { id: prev.id },
          data: updateData,
        });

        await prisma.stateMutationEvent.create({
          data: {
            userId: user.id,
            correlationId: `corr-${Date.now()}`,
            name: 'triage-document',
            forwardPatchJson: JSON.stringify([
              { op: 'replace', path: `/documents/${prev.id}/triage_status`, value: updated.triageStatus },
              { op: 'replace', path: `/documents/${prev.id}/isShortlisted`, value: updated.isShortlisted },
            ]),
            reversePatchJson: JSON.stringify({
              documentId: prev.id,
              triageStatus: prev.triageStatus,
              isShortlisted: prev.isShortlisted,
              isSeen: prev.isSeen,
              tagsJson: prev.tagsJson,
            }),
            itemsUpdatedJson: JSON.stringify([{ type: 'document', id: prev.id }]),
          },
        });

        resultData.document = updated;
        break;
      }

      case 'bulk-triage': {
        const { documentIds, bulkOp, tag } = payload;
        if (Array.isArray(documentIds) && documentIds.length > 0) {
          if (bulkOp === 'mark_seen') {
            await prisma.document.updateMany({
              where: { id: { in: documentIds }, userId: user.id },
              data: { isSeen: true, lastStatusUpdate: new Date() },
            });
          } else if (bulkOp === 'archive') {
            await prisma.document.updateMany({
              where: { id: { in: documentIds }, userId: user.id },
              data: { triageStatus: 'archive', lastStatusUpdate: new Date() },
            });
          } else if (bulkOp === 'later') {
            await prisma.document.updateMany({
              where: { id: { in: documentIds }, userId: user.id },
              data: { triageStatus: 'later', lastStatusUpdate: new Date() },
            });
          } else if (bulkOp === 'inbox') {
            await prisma.document.updateMany({
              where: { id: { in: documentIds }, userId: user.id },
              data: { triageStatus: 'new', lastStatusUpdate: new Date() },
            });
          } else if (bulkOp === 'shortlist') {
            await prisma.document.updateMany({
              where: { id: { in: documentIds }, userId: user.id },
              data: { isShortlisted: true, lastStatusUpdate: new Date() },
            });
          } else if (bulkOp === 'delete') {
            await prisma.document.updateMany({
              where: { id: { in: documentIds }, userId: user.id },
              data: { triageStatus: 'trash', lastStatusUpdate: new Date() },
            });
          } else if ((bulkOp === 'add_tag' || bulkOp === 'remove_tag') && tag) {
            const docs = await prisma.document.findMany({
              where: { id: { in: documentIds }, userId: user.id },
            });
            for (const d of docs) {
              const tags = safeParseJson<string[]>(d.tagsJson, []);
              const nextTags =
                bulkOp === 'add_tag'
                  ? Array.from(new Set([...tags, tag]))
                  : tags.filter((t) => t !== tag);
              await prisma.document.update({
                where: { id: d.id },
                data: { tagsJson: JSON.stringify(nextTags) },
              });
            }
          }
        }
        break;
      }

      case 'update-document-metadata': {
        const { documentId, title, author, url, category, publishedDate, documentNote, summary, generatedSummary, readingProgress } = payload;
        const data: any = {};
        if (title !== undefined) data.title = title;
        if (author !== undefined) data.author = author;
        if (url !== undefined) data.url = url;
        if (category !== undefined) data.category = category;
        if (publishedDate !== undefined) data.publishedDate = publishedDate ? new Date(publishedDate) : null;
        if (documentNote !== undefined) data.documentNote = documentNote;
        if (summary !== undefined) data.summary = summary;
        if (generatedSummary !== undefined) data.generatedSummary = generatedSummary;
        if (readingProgress !== undefined) {
          data.readingProgress = Number(readingProgress);
          data.lastOpenedAt = new Date();
        }

        const updated = await prisma.document.update({
          where: { id: documentId },
          data,
        });
        resultData.document = updated;
        break;
      }

      case 'add-document-url': {
        const { url, title, category: explicitCategory, tags = [] } = payload;
        const cleanUrl = (url || 'https://example.com/article').trim();
        let domain = 'web.app';
        try {
          domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
        } catch {}

        const isYoutube = cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be');
        const isPdf = cleanUrl.toLowerCase().endsWith('.pdf');
        const isEpub = cleanUrl.toLowerCase().endsWith('.epub');
        const isTweet = cleanUrl.includes('twitter.com') || cleanUrl.includes('x.com');

        const category =
          explicitCategory ||
          (isYoutube ? 'video' : isPdf ? 'pdf' : isEpub ? 'epub' : isTweet ? 'tweet' : 'article');

        let youtubeVideoId = 'eJBtvfbcic0';
        if (isYoutube) {
          const m = cleanUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
          if (m) youtubeVideoId = m[1];
        }

        const derivedTitle =
          title?.trim() ||
          (isYoutube
            ? `YouTube Video (${youtubeVideoId}): Deep Dive & Transcript`
            : isPdf
            ? `PDF Research Paper from ${domain}`
            : `Saved Article from ${domain}: ${cleanUrl.split('/').filter(Boolean).pop() || 'Overview'}`);

        const created = await prisma.document.create({
          data: {
            userId: user.id,
            url: cleanUrl,
            title: derivedTitle,
            author: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
            source: 'web clipper',
            siteName: domain,
            domain,
            faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            category,
            triageStatus: 'new',
            wordCount: 1240,
            readingMinutes: 5,
            readingProgress: 0,
            tagsJson: JSON.stringify(tags),
            summary: `Saved from ${cleanUrl}. Ready for keyboard-driven reading, highlighting (h), margin notes (n), and Ghostreader AI synthesis (Shift+G).`,
            generatedSummary: `Ghostreader auto-summary for "${derivedTitle}": This document explores core concepts from ${domain}, formatted for distraction-free reading and structured annotation in Readwise Reader.`,
            publishedDate: new Date(),
            savedAt: new Date(),
            sourceSpecificJson: isYoutube
              ? JSON.stringify({ youtubeVideoId, durationSeconds: 300 })
              : isPdf
              ? JSON.stringify({
                  pdfPageCount: 2,
                  pages: [
                    {
                      pageNumber: 1,
                      title: 'Page 1 — Executive Summary',
                      heading: derivedTitle,
                      authors: domain,
                      paragraphs: [
                        `Imported PDF document from ${cleanUrl}. Use the toolbar above to switch between PDF Canvas view, Enhanced Text reflow mode, and Rectangular Area Snapshot highlighting.`,
                        'Every highlight or region snapshot you capture is automatically synced into your right-hand Notebook panel.',
                      ],
                      diagramCaption: 'Figure 1: Document Structure & Annotation Pipeline',
                    },
                  ],
                })
              : '{}',
            transcriptJson: isYoutube
              ? JSON.stringify([
                  { start: 0, duration: 15, text: `Welcome to this video from ${domain}. Click any sentence in the synchronized transcript to jump the video player to that timestamp.` },
                  { start: 15, duration: 18, text: 'Press H on any focused transcript paragraph to highlight it and save the timestamped quote to your Notebook.' },
                  { start: 33, duration: 20, text: 'Use Shift+G to ask Ghostreader questions grounded in the full video transcript.' },
                ])
              : '[]',
            htmlContent: `
              <h2 id="sec-intro">1. Overview & Context</h2>
              <p data-paragraph-index="0">This document was saved from <code>${cleanUrl}</code> into your Readwise Reader Inbox. Use <code>j</code> and <code>k</code> to move focus between paragraphs.</p>
              <h2 id="sec-core">2. Core Insights & Analysis</h2>
              <p data-paragraph-index="1">Press <code>h</code> to highlight any key passage, <code>n</code> to attach an inline margin note, or select any phrase to invoke Ghostreader AI definitions and simplifications.</p>
              <p data-paragraph-index="2">When finished, press <code>e</code> to Archive or <code>l</code> to move to Later.</p>
            `,
          },
        });

        resultData.document = created;
        break;
      }

      case 'upload-document-file': {
        const { filename, contentPreview, fileType } = payload;
        const name = filename || 'Uploaded-Document.pdf';
        const lower = name.toLowerCase();
        const category =
          fileType || (lower.endsWith('.epub') ? 'epub' : lower.endsWith('.pdf') ? 'pdf' : 'article');
        const cleanTitle = name.replace(/\.(pdf|epub|html|txt|md)$/i, '').replace(/[-_]+/g, ' ');

        const created = await prisma.document.create({
          data: {
            userId: user.id,
            url: `file://${name}`,
            title: cleanTitle,
            author: 'Uploaded File',
            source: 'upload',
            siteName: category.toUpperCase() + ' Upload',
            domain: 'local.upload',
            category,
            triageStatus: 'new',
            wordCount: 2450,
            readingMinutes: 10,
            readingProgress: 0,
            tagsJson: JSON.stringify([]),
            summary: contentPreview || `Uploaded ${category.toUpperCase()} file (${name}). Supports full highlighting, margin notes, and Ghostreader AI.`,
            generatedSummary: `Uploaded ${category.toUpperCase()} document "${cleanTitle}". Parsed for multi-format reading, table of contents navigation, and Notebook Markdown export.`,
            publishedDate: new Date(),
            savedAt: new Date(),
            sourceSpecificJson:
              category === 'pdf'
                ? JSON.stringify({
                    pdfPageCount: 2,
                    pages: [
                      {
                        pageNumber: 1,
                        title: `Page 1 — ${cleanTitle}`,
                        heading: cleanTitle,
                        authors: 'Uploaded PDF Document',
                        paragraphs: [
                          contentPreview || `Primary text extracted from ${name}. You can highlight text directly, switch to Enhanced Text View, or use the Area Snapshot tool to crop diagrams into your Notebook.`,
                          'All annotations are stored locally and synchronized via RFC 6902 JSON Patch events.',
                        ],
                        diagramCaption: `Figure 1: Visual diagram in ${name}`,
                      },
                      {
                        pageNumber: 2,
                        title: `Page 2 — Detailed Analysis`,
                        heading: 'Section 2: Architecture & Findings',
                        authors: name,
                        paragraphs: [
                          'Second page of the uploaded PDF document demonstrating multi-page navigation, zoom controls, and area snapshot annotations.',
                        ],
                        diagramCaption: 'Table 1: Key Metrics & Evaluation Summary',
                      },
                    ],
                  })
                : category === 'epub'
                ? JSON.stringify({
                    chapters: [
                      { id: 'up-ch-1', title: 'Chapter 1: Introduction' },
                      { id: 'up-ch-2', title: 'Chapter 2: Deep Dive' },
                    ],
                  })
                : '{}',
            htmlContent: `
              <h2 id="up-ch-1">Chapter 1: Introduction to ${cleanTitle}</h2>
              <p data-paragraph-index="0">${contentPreview || `This ${category.toUpperCase()} document (${name}) was uploaded directly to your Readwise Reader library.`}</p>
              <h2 id="up-ch-2">Chapter 2: Deep Dive & Notes</h2>
              <p data-paragraph-index="1">Navigate paragraphs with <code>j</code> / <code>k</code>, press <code>h</code> to highlight, or press <code>n</code> to add an inline margin note.</p>
            `,
          },
        });

        resultData.document = created;
        break;
      }

      case 'delete-document': {
        const { documentId, permanent } = payload;
        if (permanent) {
          await prisma.document.deleteMany({
            where: { id: documentId, userId: user.id },
          });
        } else {
          await prisma.document.updateMany({
            where: { id: documentId, userId: user.id },
            data: { triageStatus: 'trash', lastStatusUpdate: new Date() },
          });
        }
        break;
      }

      case 'empty-trash': {
        await prisma.document.deleteMany({
          where: { userId: user.id, triageStatus: 'trash' },
        });
        break;
      }

      case 'add-annotation': {
        const {
          documentId,
          type = 'highlight',
          paragraphIndex,
          selectedText,
          note = '',
          color = 'yellow',
          tags = [],
          boundingBox = {},
          timestampSeconds,
        } = payload;

        const created = await prisma.annotation.create({
          data: {
            userId: user.id,
            documentId,
            type,
            paragraphIndex: paragraphIndex ?? null,
            selectedText: selectedText || 'Highlighted passage',
            note,
            color,
            tagsJson: JSON.stringify(tags),
            boundingBoxJson: JSON.stringify(boundingBox),
            timestampSeconds: timestampSeconds ?? null,
          },
        });

        // Ensure any new tags exist in Tag table
        for (const tagName of tags) {
          await prisma.tag.upsert({
            where: { userId_name: { userId: user.id, name: tagName } },
            update: {},
            create: { userId: user.id, name: tagName },
          });
        }

        resultData.annotation = created;
        break;
      }

      case 'update-annotation': {
        const { annotationId, note, color, tags } = payload;
        const data: any = {};
        if (note !== undefined) data.note = note;
        if (color !== undefined) data.color = color;
        if (tags !== undefined) {
          data.tagsJson = JSON.stringify(tags);
          for (const tagName of tags) {
            await prisma.tag.upsert({
              where: { userId_name: { userId: user.id, name: tagName } },
              update: {},
              create: { userId: user.id, name: tagName },
            });
          }
        }

        const updated = await prisma.annotation.update({
          where: { id: annotationId },
          data,
        });
        resultData.annotation = updated;
        break;
      }

      case 'delete-annotation': {
        const { annotationId } = payload;
        await prisma.annotation.deleteMany({
          where: { id: annotationId, userId: user.id },
        });
        break;
      }

      case 'toggle-document-tag': {
        const { documentId, tagName } = payload;
        const cleanTag = (tagName || '').trim();
        if (!cleanTag) break;

        await prisma.tag.upsert({
          where: { userId_name: { userId: user.id, name: cleanTag } },
          update: {},
          create: { userId: user.id, name: cleanTag },
        });

        const doc = await prisma.document.findFirst({
          where: { id: documentId, userId: user.id },
        });
        if (doc) {
          const currentTags = safeParseJson<string[]>(doc.tagsJson, []);
          const exists = currentTags.some((t) => t.toLowerCase() === cleanTag.toLowerCase());
          const nextTags = exists
            ? currentTags.filter((t) => t.toLowerCase() !== cleanTag.toLowerCase())
            : [...currentTags, cleanTag];

          await prisma.document.update({
            where: { id: doc.id },
            data: {
              tagsJson: JSON.stringify(nextTags),
              isShortlisted: nextTags.some((t) => t.toLowerCase() === 'shortlist'),
            },
          });
        }
        break;
      }

      case 'create-tag': {
        const { name, description = '', color = '#3b82f6' } = payload;
        const cleanName = (name || '').trim();
        if (cleanName) {
          const tag = await prisma.tag.upsert({
            where: { userId_name: { userId: user.id, name: cleanName } },
            update: { description, color },
            create: { userId: user.id, name: cleanName, description, color },
          });
          resultData.tag = tag;
        }
        break;
      }

      case 'rename-tag': {
        const { tagId, oldName, newName } = payload;
        const cleanNew = (newName || '').trim();
        if (tagId && cleanNew) {
          await prisma.tag.update({
            where: { id: tagId },
            data: { name: cleanNew },
          });
          // Update documents containing oldName
          const docs = await prisma.document.findMany({ where: { userId: user.id } });
          for (const d of docs) {
            const tags = safeParseJson<string[]>(d.tagsJson, []);
            if (tags.includes(oldName)) {
              const updatedTags = tags.map((t) => (t === oldName ? cleanNew : t));
              await prisma.document.update({
                where: { id: d.id },
                data: { tagsJson: JSON.stringify(updatedTags) },
              });
            }
          }
        }
        break;
      }

      case 'delete-tag': {
        const { tagId, name } = payload;
        if (tagId) {
          await prisma.tag.deleteMany({ where: { id: tagId, userId: user.id } });
        }
        if (name) {
          const docs = await prisma.document.findMany({ where: { userId: user.id } });
          for (const d of docs) {
            const tags = safeParseJson<string[]>(d.tagsJson, []);
            if (tags.includes(name)) {
              await prisma.document.update({
                where: { id: d.id },
                data: { tagsJson: JSON.stringify(tags.filter((t) => t !== name)) },
              });
            }
          }
        }
        break;
      }

      case 'create-filtered-view': {
        const { name, query, isPinned = true } = payload;
        const key =
          (name || 'custom-view')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '') +
          '_' +
          Math.floor(100 + Math.random() * 900);

        const fv = await prisma.filteredView.create({
          data: {
            userId: user.id,
            key,
            name: name || 'Custom View',
            query: query || 'in:inbox',
            isPinned,
            isBuiltIn: false,
          },
        });
        resultData.filteredView = fv;
        break;
      }

      case 'update-filtered-view': {
        const { viewId, key, isPinned, name, query, sortBy, layoutMode, groupBy } = payload;
        const whereClause = viewId
          ? { id: viewId }
          : { userId_key: { userId: user.id, key: key || 'articles' } };

        const data: any = {};
        if (isPinned !== undefined) data.isPinned = isPinned;
        if (name !== undefined) data.name = name;
        if (query !== undefined) data.query = query;
        if (sortBy !== undefined) data.sortBy = sortBy;
        if (layoutMode !== undefined) data.layoutMode = layoutMode;
        if (groupBy !== undefined) data.groupBy = groupBy;

        const fv = await prisma.filteredView.update({
          where: whereClause as any,
          data,
        });
        resultData.filteredView = fv;
        break;
      }

      case 'delete-filtered-view': {
        const { viewId } = payload;
        await prisma.filteredView.deleteMany({
          where: { id: viewId, userId: user.id },
        });
        break;
      }

      case 'subscribe-feed': {
        const { url, title, folder = 'General', description = '' } = payload;
        const cleanUrl = (url || '').trim();
        if (!cleanUrl) break;

        const suggestedMatch = SUGGESTED_FEEDS.find(
          (sf) => sf.url.toLowerCase() === cleanUrl.toLowerCase() || sf.siteUrl.toLowerCase() === cleanUrl.toLowerCase()
        );

        let domain = 'rss.feed';
        try {
          domain = new URL(cleanUrl).hostname.replace(/^www\./, '');
        } catch {}

        const feedTitle = suggestedMatch?.title || title || `${domain} RSS Feed`;
        const feed = await prisma.rssFeed.upsert({
          where: { userId_url: { userId: user.id, url: cleanUrl } },
          update: { isMuted: false, lastFetchedAt: new Date() },
          create: {
            userId: user.id,
            title: feedTitle,
            url: cleanUrl,
            siteUrl: suggestedMatch?.siteUrl || `https://${domain}`,
            faviconUrl: suggestedMatch?.faviconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
            description: suggestedMatch?.description || description || `Subscribed RSS feed from ${domain}`,
            folder: suggestedMatch?.folder || folder,
            subscriberCount: suggestedMatch?.subscriberCount || 450,
            lastFetchedAt: new Date(),
          },
        });

        // Also create a sample unseen feed article from this newly subscribed feed
        await prisma.document.create({
          data: {
            userId: user.id,
            url: `${cleanUrl}#latest-${Date.now()}`,
            title: `Latest Dispatch from ${feedTitle}: Designing Resilient Systems`,
            author: feedTitle,
            source: feedTitle,
            siteName: feedTitle,
            domain,
            faviconUrl: feed.faviconUrl,
            category: 'article',
            triageStatus: 'feed',
            inFeed: true,
            isSeen: false,
            wordCount: 1100,
            readingMinutes: 5,
            summary: `Automatically ingested from ${feedTitle} (${cleanUrl}) into your Unseen Feed stream.`,
            generatedSummary: `Latest RSS post from ${feedTitle} discussing practical system architecture, reading workflows, and high-signal synthesis.`,
            publishedDate: new Date(),
            savedAt: new Date(),
            htmlContent: `
              <h2>Latest Dispatch from ${feedTitle}</h2>
              <p data-paragraph-index="0">This article was automatically ingested from your RSS subscription to <strong>${feedTitle}</strong> (<code>${cleanUrl}</code>).</p>
              <p data-paragraph-index="1">Press <code>l</code> to promote this feed item to your Library Later queue, or <code>e</code> to Archive it.</p>
            `,
          },
        });

        resultData.feed = feed;
        break;
      }

      case 'unsubscribe-feed': {
        const { feedId } = payload;
        await prisma.rssFeed.deleteMany({
          where: { id: feedId, userId: user.id },
        });
        break;
      }

      case 'update-settings': {
        const currentSettings = {
          ...DEFAULT_USER_SETTINGS,
          ...safeParseJson<any>(user.settingsJson, {}),
        };
        const merged = {
          ...currentSettings,
          ...payload.settings,
          readerTypography: {
            ...currentSettings.readerTypography,
            ...(payload.settings?.readerTypography || {}),
          },
          digest: {
            ...currentSettings.digest,
            ...(payload.settings?.digest || {}),
          },
          emailPreferences: {
            ...currentSettings.emailPreferences,
            ...(payload.settings?.emailPreferences || {}),
          },
          twitter: {
            ...currentSettings.twitter,
            ...(payload.settings?.twitter || {}),
          },
          shortcuts:
            payload.settings?.resetShortcuts === true
              ? DEFAULT_SHORTCUTS
              : {
                  ...currentSettings.shortcuts,
                  ...(payload.settings?.shortcuts || {}),
                },
        };

        await prisma.user.update({
          where: { id: user.id },
          data: { settingsJson: JSON.stringify(merged) },
        });
        resultData.settings = merged;
        break;
      }

      case 'update-profile': {
        const { firstName, lastName, username, email, newPassword, customEmailPrefix } = payload;
        const data: any = {};
        if (firstName !== undefined) data.firstName = firstName;
        if (lastName !== undefined) data.lastName = lastName;
        if (username !== undefined) data.username = username;
        if (email !== undefined) data.email = email;
        if (customEmailPrefix) {
          const cleanPrefix = customEmailPrefix.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
          if (cleanPrefix) {
            data.customLibraryEmail = `${cleanPrefix}@library.readwise.io`;
            data.customFeedEmail = `${cleanPrefix}@feed.readwise.io`;
          }
        }
        if (newPassword && newPassword.length >= 6) {
          data.passwordHash = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data,
        });
        resultData.user = updatedUser;
        break;
      }

      case 'update-onboarding-step': {
        const { onboardingStep, workflow, enableFeed } = payload;
        const data: any = {};
        if (onboardingStep) {
          data.onboardingStep = onboardingStep;
          if (onboardingStep === '/new' || onboardingStep === 'completed') {
            data.onboardedAt = new Date();
          }
        }
        if (workflow || enableFeed !== undefined) {
          const currentSettings = {
            ...DEFAULT_USER_SETTINGS,
            ...safeParseJson<any>(user.settingsJson, {}),
          };
          if (workflow) currentSettings.workflow = workflow;
          if (enableFeed !== undefined) {
            currentSettings.documentLocations = enableFeed
              ? ['feed', 'new', 'later', 'archive']
              : ['new', 'later', 'archive'];
          }
          data.settingsJson = JSON.stringify(currentSettings);
        }

        await prisma.user.update({
          where: { id: user.id },
          data,
        });
        break;
      }

      case 'save-ghostreader-prompt': {
        const { promptId, actionKey, promptType, title, emoji, description, template, isEnabled } = payload;
        if (promptId) {
          const updated = await prisma.ghostreaderPrompt.update({
            where: { id: promptId },
            data: {
              ...(title !== undefined ? { title } : {}),
              ...(emoji !== undefined ? { emoji } : {}),
              ...(description !== undefined ? { description } : {}),
              ...(template !== undefined ? { template } : {}),
              ...(isEnabled !== undefined ? { isEnabled } : {}),
            },
          });
          resultData.prompt = updated;
        } else {
          const key = actionKey || `CUSTOM_${Date.now()}`;
          const created = await prisma.ghostreaderPrompt.create({
            data: {
              userId: user.id,
              promptType: promptType || 'DOCUMENT',
              actionKey: key,
              title: title || 'Custom Prompt',
              emoji: emoji || '✨',
              description: description || 'User-defined custom Jinja2 prompt',
              template:
                template ||
                `Summarize the key insights in "{{ document.title }}" by {{ document.author }}:\n\n{{ document.content | central_sentences }}`,
            },
          });
          resultData.prompt = created;
        }
        break;
      }

      case 'reset-ghostreader-prompt': {
        const { actionKey } = payload;
        const builtIn = BUILTIN_GHOSTREADER_PROMPTS.find((p) => p.actionKey === actionKey);
        if (builtIn) {
          await prisma.ghostreaderPrompt.update({
            where: { userId_actionKey: { userId: user.id, actionKey } },
            data: {
              title: builtIn.title,
              template: builtIn.template,
            },
          });
        }
        break;
      }

      case 'toggle-integration': {
        const { provider, connected, accountName } = payload;
        const updated = await prisma.integrationConnection.update({
          where: { userId_provider: { userId: user.id, provider } },
          data: {
            connected: Boolean(connected),
            accountName: connected ? accountName || user.email : '',
            importedCount: connected ? Math.floor(12 + Math.random() * 45) : 0,
            lastSyncedAt: connected ? new Date() : null,
          },
        });
        resultData.integration = updated;
        break;
      }

      case 'undo-last-mutation': {
        const lastEvent = await prisma.stateMutationEvent.findFirst({
          where: { userId: user.id, undone: false },
          orderBy: { timestamp: 'desc' },
        });
        if (lastEvent) {
          const rev = safeParseJson<any>(lastEvent.reversePatchJson, null);
          if (rev && rev.documentId) {
            await prisma.document.updateMany({
              where: { id: rev.documentId, userId: user.id },
              data: {
                triageStatus: rev.triageStatus,
                isShortlisted: rev.isShortlisted,
                isSeen: rev.isSeen,
                tagsJson: rev.tagsJson,
              },
            });
          }
          await prisma.stateMutationEvent.update({
            where: { id: lastEvent.id },
            data: { undone: true },
          });
          resultData.undoneEvent = lastEvent.name;
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json(resultData);
  } catch (err: any) {
    console.error('POST /api/reader/state/update error:', err);
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 500 });
  }
}
