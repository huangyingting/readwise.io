import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getOrCreateActiveUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DEFAULT_USER_SETTINGS, SUGGESTED_FEEDS, UserSettings } from '@/lib/default-data';

export const dynamic = 'force-dynamic';

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = await getOrCreateActiveUser(session?.user?.email);

    const [
      rawDocs,
      filteredViews,
      tags,
      rssFeeds,
      ghostreaderPrompts,
      ghostreaderThreads,
      integrations,
    ] = await Promise.all([
      prisma.document.findMany({
        where: { userId: user.id },
        include: {
          annotations: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { savedAt: 'desc' },
      }),
      prisma.filteredView.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.tag.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' },
      }),
      prisma.rssFeed.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.ghostreaderPrompt.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.ghostreaderThread.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.integrationConnection.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const settings: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      ...safeParseJson<Partial<UserSettings>>(user.settingsJson, {}),
      readerTypography: {
        ...DEFAULT_USER_SETTINGS.readerTypography,
        ...(safeParseJson<any>(user.settingsJson, {})?.readerTypography || {}),
      },
      digest: {
        ...DEFAULT_USER_SETTINGS.digest,
        ...(safeParseJson<any>(user.settingsJson, {})?.digest || {}),
      },
      emailPreferences: {
        ...DEFAULT_USER_SETTINGS.emailPreferences,
        ...(safeParseJson<any>(user.settingsJson, {})?.emailPreferences || {}),
      },
      twitter: {
        ...DEFAULT_USER_SETTINGS.twitter,
        ...(safeParseJson<any>(user.settingsJson, {})?.twitter || {}),
      },
      shortcuts: {
        ...DEFAULT_USER_SETTINGS.shortcuts,
        ...(safeParseJson<any>(user.settingsJson, {})?.shortcuts || {}),
      },
    };

    const documents = rawDocs.map((doc) => {
      const docTags = safeParseJson<string[]>(doc.tagsJson, []);
      const annotations = doc.annotations.map((a) => ({
        id: a.id,
        documentId: a.documentId,
        type: a.type,
        paragraphIndex: a.paragraphIndex,
        selectedText: a.selectedText,
        note: a.note,
        color: a.color,
        tags: safeParseJson<string[]>(a.tagsJson, []),
        boundingBox: safeParseJson<any>(a.boundingBoxJson, {}),
        timestampSeconds: a.timestampSeconds,
        createdAt: a.createdAt.toISOString(),
      }));
      const highlightTags = Array.from(new Set(annotations.flatMap((a) => a.tags)));

      return {
        id: doc.id,
        url: doc.url,
        title: doc.title,
        author: doc.author,
        source: doc.source,
        siteName: doc.siteName,
        domain: doc.domain,
        faviconUrl: doc.faviconUrl,
        imageUrl: doc.imageUrl,
        category: doc.category,
        triageStatus: doc.triageStatus,
        isShortlisted: doc.isShortlisted,
        isSeen: doc.isSeen,
        inFeed: doc.inFeed,
        wordCount: doc.wordCount,
        readingMinutes: doc.readingMinutes,
        readingProgress: doc.readingProgress,
        summary: doc.summary,
        generatedSummary: doc.generatedSummary,
        documentNote: doc.documentNote,
        htmlContent: doc.htmlContent,
        tts: safeParseJson<any>(doc.ttsJson, {}),
        transcript: safeParseJson<any[]>(doc.transcriptJson, []),
        sourceSpecific: safeParseJson<any>(doc.sourceSpecificJson, {}),
        tags: docTags,
        annotations,
        annotationsCount: annotations.length,
        notesCount: annotations.filter((a) => Boolean(a.note)).length,
        highlightTags,
        publishedDate: doc.publishedDate ? doc.publishedDate.toISOString() : null,
        savedAt: doc.savedAt.toISOString(),
        lastOpenedAt: doc.lastOpenedAt ? doc.lastOpenedAt.toISOString() : null,
        lastStatusUpdate: doc.lastStatusUpdate.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      };
    });

    // Compute counts for tags
    const enrichedTags = tags.map((t) => {
      const docCount = documents.filter(
        (d) => d.triageStatus !== 'trash' && d.tags.some((dt) => dt.toLowerCase() === t.name.toLowerCase())
      ).length;
      const highlightCount = documents
        .filter((d) => d.triageStatus !== 'trash')
        .reduce(
          (acc, d) =>
            acc +
            d.annotations.filter((a) =>
              a.tags.some((ht) => ht.toLowerCase() === t.name.toLowerCase())
            ).length,
          0
        );
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        color: t.color,
        documentCount: docCount,
        highlightCount,
        createdAt: t.createdAt.toISOString(),
      };
    });

    const parsedThreads = ghostreaderThreads.map((th) => ({
      id: th.id,
      documentId: th.documentId,
      title: th.title,
      mode: th.mode,
      messages: safeParseJson<any[]>(th.messagesJson, []),
      createdAt: th.createdAt.toISOString(),
      updatedAt: th.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      schemaVersion: 10,
      isChunkingEnabled: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        customLibraryEmail: user.customLibraryEmail,
        customFeedEmail: user.customFeedEmail,
        onboardingStep: user.onboardingStep,
        onboardedAt: user.onboardedAt ? user.onboardedAt.toISOString() : null,
        subscription: {
          product: user.subscriptionProduct,
          trialDaysLeft: user.trialDaysLeft,
        },
      },
      settings,
      home: {
        views: settings.homeViews,
      },
      documents,
      filteredViews,
      tags: enrichedTags,
      rssFeeds,
      suggestedFeeds: SUGGESTED_FEEDS,
      ghostreaderPrompts,
      ghostreaderThreads: parsedThreads,
      integrations,
      meta: {
        time_of_last_fetch: Date.now(),
        was_incremental_sync: Boolean(req.nextUrl.searchParams.get('updated_after')),
      },
    });
  } catch (err: any) {
    console.error('GET /api/reader/state error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load state' }, { status: 500 });
  }
}
