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
  SUPPLEMENTAL_BOOKS_CATALOG,
} from '@/lib/default-data';
import {
  extractUrlDocument,
  fetchAndParseRssFeed,
  parseHighlightsImport,
  parseOpmlFeeds,
  parseUploadedFile,
} from '@/lib/ingestion-engine';

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
        const extracted = await extractUrlDocument(url || 'https://example.com/article', title);

        const created = await prisma.document.create({
          data: {
            userId: user.id,
            url: extracted.url,
            title: extracted.title,
            author: extracted.author,
            source: extracted.source,
            siteName: extracted.siteName,
            domain: extracted.domain,
            faviconUrl: extracted.faviconUrl,
            imageUrl: extracted.imageUrl,
            category: explicitCategory || extracted.category,
            triageStatus: 'new',
            wordCount: extracted.wordCount,
            readingMinutes: extracted.readingMinutes,
            readingProgress: 0,
            tagsJson: JSON.stringify(tags),
            summary: extracted.summary,
            generatedSummary: extracted.generatedSummary,
            publishedDate: extracted.publishedDate,
            savedAt: new Date(),
            sourceSpecificJson: extracted.sourceSpecificJson,
            transcriptJson: extracted.transcriptJson,
            ttsJson: extracted.ttsJson,
            htmlContent: extracted.htmlContent,
          },
        });

        resultData.document = created;
        break;
      }

      case 'upload-document-file': {
        const { filename, contentPreview, fileType, base64Data, textContent } = payload;
        const name = filename || 'Uploaded-Document.pdf';
        const lower = name.toLowerCase();

        // 1. Handle OPML Feed Subscription Upload
        if (lower.endsWith('.opml') || lower.endsWith('.xml')) {
          const xmlStr =
            textContent ||
            (base64Data
              ? Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64').toString('utf8')
              : '') ||
            contentPreview ||
            '';
          const opmlFeeds = parseOpmlFeeds(xmlStr);
          const importedFeeds = [];
          for (const f of opmlFeeds.slice(0, 15)) {
            const feed = await prisma.rssFeed.upsert({
              where: { userId_url: { userId: user.id, url: f.url } },
              update: { title: f.title, folder: f.folder },
              create: {
                userId: user.id,
                title: f.title,
                url: f.url,
                siteUrl: f.siteUrl,
                folder: f.folder,
                description: `Imported from OPML (${name})`,
                lastFetchedAt: new Date(),
              },
            });
            importedFeeds.push(feed);
          }
          resultData.importedFeedsCount = importedFeeds.length;
          break;
        }

        // 2. Handle Kindle "My Clippings.txt" or Readwise CSV Highlights Upload
        if (
          lower.includes('clippings') ||
          lower.endsWith('.csv') ||
          (textContent && textContent.includes('=========='))
        ) {
          const rawStr =
            textContent ||
            (base64Data
              ? Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64').toString('utf8')
              : '') ||
            contentPreview ||
            '';
          const importedBooks = parseHighlightsImport(name, rawStr);
          let createdHighlights = 0;
          let lastDoc: any = null;
          for (const book of importedBooks) {
            const htmlParas = book.highlights
              .map(
                (h, idx) =>
                  `<p data-paragraph-index="${idx}">${h.text.replace(/</g, '&lt;')}</p>`
              )
              .join('\n');
            const doc = await prisma.document.create({
              data: {
                userId: user.id,
                url: `kindle://${encodeURIComponent(book.title)}`,
                title: book.title,
                author: book.author,
                source: lower.endsWith('.csv') ? 'csv import' : 'kindle',
                siteName: 'Kindle Highlights',
                domain: 'kindle.amazon.com',
                category: book.category,
                triageStatus: 'archive',
                wordCount: Math.max(100, book.highlights.map((x) => x.text).join(' ').split(/\s+/).length),
                readingMinutes: Math.max(1, book.highlights.length),
                readingProgress: 100,
                summary: book.highlights[0]?.text || `Imported ${book.highlights.length} highlights`,
                generatedSummary: `Imported ${book.highlights.length} highlights from ${book.title} by ${book.author}.`,
                htmlContent: `<h2 id="sec-1">${book.title} — Highlights</h2>\n${htmlParas}`,
              },
            });
            lastDoc = doc;
            for (let i = 0; i < book.highlights.length; i++) {
              const hl = book.highlights[i];
              await prisma.annotation.create({
                data: {
                  userId: user.id,
                  documentId: doc.id,
                  type: 'highlight',
                  paragraphIndex: i,
                  selectedText: hl.text,
                  note: hl.note,
                  color: 'yellow',
                  tagsJson: JSON.stringify(hl.tags),
                },
              });
              createdHighlights++;
            }
          }
          resultData.document = lastDoc;
          resultData.importedHighlightsCount = createdHighlights;
          break;
        }

        // 3. Handle PDF, EPUB, HTML, Markdown, TXT file upload with real binary/text extraction
        const parsed = parseUploadedFile({
          filename: name,
          fileType,
          base64Data,
          textContent,
          contentPreview,
        });

        const created = await prisma.document.create({
          data: {
            userId: user.id,
            url: parsed.url,
            title: parsed.title,
            author: parsed.author,
            source: parsed.source,
            siteName: parsed.siteName,
            domain: parsed.domain,
            category: parsed.category,
            triageStatus: 'new',
            wordCount: parsed.wordCount,
            readingMinutes: parsed.readingMinutes,
            readingProgress: 0,
            tagsJson: JSON.stringify([]),
            summary: parsed.summary,
            generatedSummary: parsed.generatedSummary,
            publishedDate: parsed.publishedDate,
            savedAt: new Date(),
            sourceSpecificJson: parsed.sourceSpecificJson,
            ttsJson: parsed.ttsJson,
            htmlContent: parsed.htmlContent,
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
          (sf) =>
            sf.url.toLowerCase() === cleanUrl.toLowerCase() ||
            sf.siteUrl.toLowerCase() === cleanUrl.toLowerCase()
        );

        const parsedFeed = await fetchAndParseRssFeed(
          cleanUrl,
          suggestedMatch?.title || title
        );

        let domain = 'rss.feed';
        try {
          domain = new URL(parsedFeed.siteUrl || cleanUrl).hostname.replace(/^www\./, '');
        } catch {}

        const feed = await prisma.rssFeed.upsert({
          where: { userId_url: { userId: user.id, url: cleanUrl } },
          update: { isMuted: false, lastFetchedAt: new Date() },
          create: {
            userId: user.id,
            title: suggestedMatch?.title || parsedFeed.title,
            url: cleanUrl,
            siteUrl: suggestedMatch?.siteUrl || parsedFeed.siteUrl,
            faviconUrl: suggestedMatch?.faviconUrl || parsedFeed.faviconUrl,
            description: suggestedMatch?.description || description || parsedFeed.description,
            folder: suggestedMatch?.folder || folder,
            subscriberCount: suggestedMatch?.subscriberCount || 450,
            lastFetchedAt: new Date(),
          },
        });

        // Ingest up to 3 real articles from the parsed RSS feed
        for (const item of parsedFeed.items.slice(0, 3)) {
          const existing = await prisma.document.findFirst({
            where: { userId: user.id, url: item.url },
          });
          if (!existing) {
            await prisma.document.create({
              data: {
                userId: user.id,
                url: item.url,
                title: item.title,
                author: item.author || feed.title,
                source: feed.title,
                siteName: feed.title,
                domain,
                faviconUrl: feed.faviconUrl,
                category: 'article',
                triageStatus: 'feed',
                inFeed: true,
                isSeen: false,
                wordCount: item.wordCount,
                readingMinutes: item.readingMinutes,
                summary: item.summary,
                generatedSummary: `${feed.title}: ${item.summary}`,
                publishedDate: item.publishedDate,
                savedAt: new Date(),
                htmlContent: item.htmlContent,
              },
            });
          }
        }

        resultData.feed = feed;
        break;
      }

      case 'refresh-feeds': {
        const feeds = await prisma.rssFeed.findMany({
          where: { userId: user.id, isMuted: false },
        });
        let addedCount = 0;
        for (const feed of feeds.slice(0, 5)) {
          const parsedFeed = await fetchAndParseRssFeed(feed.url, feed.title);
          await prisma.rssFeed.update({
            where: { id: feed.id },
            data: { lastFetchedAt: new Date() },
          });
          let domain = 'rss.feed';
          try {
            domain = new URL(feed.siteUrl || feed.url).hostname.replace(/^www\./, '');
          } catch {}
          for (const item of parsedFeed.items.slice(0, 3)) {
            const existing = await prisma.document.findFirst({
              where: { userId: user.id, title: item.title },
            });
            if (!existing) {
              await prisma.document.create({
                data: {
                  userId: user.id,
                  url: item.url,
                  title: item.title,
                  author: item.author || feed.title,
                  source: feed.title,
                  siteName: feed.title,
                  domain,
                  faviconUrl: feed.faviconUrl,
                  category: 'article',
                  triageStatus: 'feed',
                  inFeed: true,
                  isSeen: false,
                  wordCount: item.wordCount,
                  readingMinutes: item.readingMinutes,
                  summary: item.summary,
                  generatedSummary: `${feed.title}: ${item.summary}`,
                  publishedDate: item.publishedDate,
                  savedAt: new Date(),
                  htmlContent: item.htmlContent,
                },
              });
              addedCount++;
            }
          }
        }
        resultData.addedCount = addedCount;
        break;
      }

      case 'review-annotation': {
        const { annotationId, rating } = payload;
        const ann = await prisma.annotation.findFirst({
          where: { id: annotationId, userId: user.id },
        });
        if (!ann) break;

        let intervalDays = ann.intervalDays || 1;
        let easeFactor = ann.easeFactor || 2.5;
        let isDiscarded = ann.isDiscarded;

        if (rating === 'never' || rating === 'discard') {
          isDiscarded = true;
        } else if (rating === 'soon' || rating === 'again') {
          intervalDays = 1;
          easeFactor = Math.max(1.3, easeFactor - 0.2);
          isDiscarded = false;
        } else if (rating === 'later' || rating === 'hard') {
          intervalDays = Math.max(3, Math.round(intervalDays * 1.5));
          easeFactor = Math.max(1.3, easeFactor - 0.1);
          isDiscarded = false;
        } else if (rating === 'eventually' || rating === 'good') {
          intervalDays = Math.max(7, Math.round(intervalDays * easeFactor));
          isDiscarded = false;
        } else if (rating === 'easy') {
          intervalDays = Math.max(14, Math.round(intervalDays * easeFactor * 1.3));
          easeFactor = Math.min(3.2, easeFactor + 0.15);
          isDiscarded = false;
        }

        const nextReviewAt = new Date(Date.now() + intervalDays * 86400000);
        const updatedAnn = await prisma.annotation.update({
          where: { id: ann.id },
          data: {
            reviewCount: (ann.reviewCount || 0) + 1,
            intervalDays,
            easeFactor,
            isDiscarded,
            lastReviewedAt: new Date(),
            nextReviewAt,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastReviewedAt: new Date(),
          },
        });

        resultData.annotation = updatedAnn;
        break;
      }

      case 'complete-daily-review': {
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            dailyReviewStreak: (user.dailyReviewStreak || 1) + 1,
            lastReviewedAt: new Date(),
          },
        });
        resultData.user = updatedUser;
        break;
      }

      case 'toggle-favorite-annotation': {
        const { annotationId } = payload;
        const ann = await prisma.annotation.findFirst({
          where: { id: annotationId, userId: user.id },
        });
        if (ann) {
          const updated = await prisma.annotation.update({
            where: { id: ann.id },
            data: { isFavorite: !ann.isFavorite },
          });
          resultData.annotation = updated;
        }
        break;
      }

      case 'update-flashcard': {
        const { annotationId, flashcardQuestion, flashcardAnswer, clozeText, selectedText, note } =
          payload;
        const data: any = {};
        if (flashcardQuestion !== undefined) data.flashcardQuestion = flashcardQuestion;
        if (flashcardAnswer !== undefined) data.flashcardAnswer = flashcardAnswer;
        if (clozeText !== undefined) data.clozeText = clozeText;
        if (selectedText !== undefined) data.selectedText = selectedText;
        if (note !== undefined) data.note = note;

        const updated = await prisma.annotation.update({
          where: { id: annotationId },
          data,
        });
        resultData.annotation = updated;
        break;
      }

      case 'toggle-public-share': {
        const { documentId, isPublic } = payload;
        const doc = await prisma.document.findFirst({
          where: { id: documentId, userId: user.id },
        });
        if (doc) {
          const updated = await prisma.document.update({
            where: { id: doc.id },
            data: { isPublic: isPublic !== undefined ? Boolean(isPublic) : !doc.isPublic },
          });
          resultData.document = updated;
        }
        break;
      }

      case 'update-review-frequency': {
        const { documentId, reviewFrequency } = payload;
        const updated = await prisma.document.update({
          where: { id: documentId },
          data: { reviewFrequency: reviewFrequency || 'normal' },
        });
        resultData.document = updated;
        break;
      }

      case 'add-supplemental-book': {
        const { bookKey } = payload;
        const item = SUPPLEMENTAL_BOOKS_CATALOG.find((b) => b.key === bookKey);
        if (item) {
          const htmlParas = item.highlights
            .map(
              (h, idx) =>
                `<p data-paragraph-index="${idx}">${h.text.replace(/</g, '&lt;')}</p>`
            )
            .join('\n');
          const doc = await prisma.document.create({
            data: {
              userId: user.id,
              url: `supplemental://${item.key}`,
              title: item.title,
              author: item.author,
              source: 'supplemental',
              siteName: 'Readwise Supplemental',
              domain: 'readwise.io',
              imageUrl: item.imageUrl,
              category: item.category,
              triageStatus: 'archive',
              isSupplemental: true,
              reviewFrequency: 'more',
              wordCount: 450,
              readingMinutes: 3,
              readingProgress: 100,
              summary: item.highlights[0]?.text || item.title,
              generatedSummary: `Supplemental book highlights for ${item.title} by ${item.author}.`,
              htmlContent: `<h2 id="sec-1">${item.title} — Supplemental Highlights</h2>\n${htmlParas}`,
            },
          });

          for (let i = 0; i < item.highlights.length; i++) {
            const hl = item.highlights[i];
            await prisma.annotation.create({
              data: {
                userId: user.id,
                documentId: doc.id,
                type: 'highlight',
                paragraphIndex: i,
                selectedText: hl.text,
                note: hl.note,
                color: 'yellow',
                isFavorite: i === 0,
                flashcardQuestion: hl.question || '',
                flashcardAnswer: hl.answer || '',
                clozeText: hl.cloze || '',
                tagsJson: JSON.stringify(['supplemental']),
              },
            });
          }
          resultData.document = doc;
        }
        break;
      }

      case 'import-highlights-text': {
        const { filename = 'My Clippings.txt', textContent = '' } = payload;
        const importedBooks = parseHighlightsImport(filename, textContent);
        let createdHighlights = 0;
        for (const book of importedBooks) {
          const htmlParas = book.highlights
            .map(
              (h, idx) =>
                `<p data-paragraph-index="${idx}">${h.text.replace(/</g, '&lt;')}</p>`
            )
            .join('\n');
          const doc = await prisma.document.create({
            data: {
              userId: user.id,
              url: `kindle://${encodeURIComponent(book.title)}`,
              title: book.title,
              author: book.author,
              source: 'kindle',
              siteName: 'Kindle Highlights',
              domain: 'kindle.amazon.com',
              category: book.category,
              triageStatus: 'archive',
              wordCount: 300,
              readingMinutes: 2,
              readingProgress: 100,
              summary: book.highlights[0]?.text || book.title,
              generatedSummary: `Imported ${book.highlights.length} highlights from ${book.title}.`,
              htmlContent: `<h2 id="sec-1">${book.title}</h2>\n${htmlParas}`,
            },
          });
          for (let i = 0; i < book.highlights.length; i++) {
            const hl = book.highlights[i];
            await prisma.annotation.create({
              data: {
                userId: user.id,
                documentId: doc.id,
                type: 'highlight',
                paragraphIndex: i,
                selectedText: hl.text,
                note: hl.note,
                color: 'yellow',
                tagsJson: JSON.stringify(hl.tags),
              },
            });
            createdHighlights++;
          }
        }
        resultData.importedHighlightsCount = createdHighlights;
        break;
      }

      case 'regenerate-api-token': {
        const randomHex = Array.from({ length: 24 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');
        const newToken = `rw_live_${randomHex}`;
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { apiToken: newToken },
        });
        resultData.apiToken = updatedUser.apiToken;
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
