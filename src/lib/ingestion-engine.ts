import zlib from 'zlib';

export interface ExtractedDocumentData {
  url: string;
  title: string;
  author: string;
  source: string;
  siteName: string;
  domain: string;
  faviconUrl: string;
  imageUrl: string;
  category: 'article' | 'pdf' | 'epub' | 'video' | 'tweet' | 'email' | 'podcast';
  wordCount: number;
  readingMinutes: number;
  summary: string;
  generatedSummary: string;
  publishedDate: Date;
  htmlContent: string;
  ttsJson: string;
  transcriptJson: string;
  sourceSpecificJson: string;
}

export interface ParsedFeedItem {
  title: string;
  url: string;
  author: string;
  publishedDate: Date;
  summary: string;
  htmlContent: string;
  wordCount: number;
  readingMinutes: number;
}

export interface ParsedRssFeed {
  title: string;
  url: string;
  siteUrl: string;
  description: string;
  faviconUrl: string;
  items: ParsedFeedItem[];
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&hellip;/gi, '…')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );
}

function buildTtsWordTimings(plainText: string): string {
  const words = plainText
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 250);
  let cursor = 0;
  const timedWords = words.map((word) => {
    const duration = Math.max(0.22, Math.min(0.65, word.length * 0.055));
    const entry = {
      start: Number(cursor.toFixed(2)),
      end: Number((cursor + duration).toFixed(2)),
      word,
    };
    cursor += duration + 0.04;
    return entry;
  });
  return JSON.stringify({
    voice: 'Amy (Neural Web Speech)',
    words: timedWords,
  });
}

function generateExtractiveSummary(paragraphs: string[], title: string): {
  summary: string;
  generatedSummary: string;
} {
  const cleanParas = paragraphs.map((p) => p.trim()).filter((p) => p.length > 40);
  if (cleanParas.length === 0) {
    return {
      summary: `${title} — saved to Readwise Reader for keyboard-driven reading and annotation.`,
      generatedSummary: `Ghostreader synthesis for "${title}": Ready for paragraph highlighting (h), margin notes (n), and active recall review.`,
    };
  }
  const summary = cleanParas[0].slice(0, 320) + (cleanParas[0].length > 320 ? '…' : '');
  const keySentences = cleanParas.slice(0, 3).map((p) => {
    const firstSentence = p.split(/(?<=[.!?])\s+/)[0] || p;
    return firstSentence.slice(0, 240);
  });
  const generatedSummary = keySentences.join(' ');
  return { summary, generatedSummary };
}

export function htmlFragmentToReaderHtml(rawHtml: string, fallbackTitle: string): {
  htmlContent: string;
  paragraphs: string[];
  headings: { id: string; title: string }[];
  wordCount: number;
  readingMinutes: number;
} {
  const cleaned = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  // Prefer <article> or <main> if present
  const articleMatch =
    cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const targetHtml = articleMatch ? articleMatch[1] : cleaned;

  const blockRegex = /<(h1|h2|h3|h4|p|blockquote|pre|li)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const blocks: { tag: string; text: string }[] = [];
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(targetHtml)) !== null) {
    const tag = match[1].toLowerCase();
    const text = stripHtmlTags(match[2]);
    if (!text || text.length < 15) continue;
    // Skip common boilerplate lines
    if (/^(cookie policy|privacy policy|terms of service|subscribe to our|sign in|log in|all rights reserved)$/i.test(text)) {
      continue;
    }
    if (blocks.length > 0 && blocks[blocks.length - 1].text === text) {
      continue;
    }
    blocks.push({ tag, text });
    if (blocks.length >= 160) break;
  }

  // Fallback if page uses plain text or <br><br> or <div> blocks
  if (blocks.length === 0) {
    const plain = stripHtmlTags(targetHtml);
    const chunks = plain
      .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    const grouped: string[] = [];
    let acc = '';
    for (const chunk of chunks) {
      acc = acc ? `${acc} ${chunk}` : chunk;
      if (acc.length >= 220) {
        grouped.push(acc);
        acc = '';
      }
    }
    if (acc) grouped.push(acc);

    for (const g of grouped.slice(0, 80)) {
      blocks.push({ tag: 'p', text: g });
    }
  }

  let paragraphIndex = 0;
  let headingIndex = 0;
  const htmlParts: string[] = [];
  const paragraphs: string[] = [];
  const headings: { id: string; title: string }[] = [];

  for (const b of blocks) {
    const safeText = b.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    if (b.tag.startsWith('h')) {
      headingIndex++;
      const id = `sec-${headingIndex}`;
      headings.push({ id, title: b.text });
      htmlParts.push(`<h2 id="${id}">${safeText}</h2>`);
    } else if (b.tag === 'blockquote') {
      paragraphs.push(b.text);
      htmlParts.push(
        `<blockquote data-paragraph-index="${paragraphIndex++}">${safeText}</blockquote>`
      );
    } else {
      paragraphs.push(b.text);
      htmlParts.push(`<p data-paragraph-index="${paragraphIndex++}">${safeText}</p>`);
    }
  }

  if (paragraphs.length === 0) {
    const fallbackPara = `${fallbackTitle} — saved into Readwise Reader.`;
    paragraphs.push(fallbackPara);
    htmlParts.push(`<h2 id="sec-1">Overview</h2><p data-paragraph-index="0">${fallbackPara}</p>`);
  } else if (headings.length === 0) {
    htmlParts.unshift(`<h2 id="sec-1">1. ${fallbackTitle.replace(/</g, '&lt;')}</h2>`);
  }

  const allWords = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  const wordCount = Math.max(50, allWords);
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 225));

  return {
    htmlContent: htmlParts.join('\n'),
    paragraphs,
    headings,
    wordCount,
    readingMinutes,
  };
}

function extractMetaTag(html: string, attrValue: string): string {
  const regex1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${attrValue}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${attrValue}["']`,
    'i'
  );
  const m = html.match(regex1) || html.match(regex2);
  return m ? decodeHtmlEntities(m[1]) : '';
}

export async function extractUrlDocument(
  rawUrl: string,
  customTitle?: string
): Promise<ExtractedDocumentData> {
  const cleanUrl = (rawUrl || 'https://example.com').trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
  } catch {
    parsedUrl = new URL('https://example.com/article');
  }

  const finalUrl = parsedUrl.toString();
  const domain = parsedUrl.hostname.replace(/^www\./, '');
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const isYoutube =
    domain.includes('youtube.com') ||
    domain.includes('youtu.be');
  const isPdf = parsedUrl.pathname.toLowerCase().endsWith('.pdf');
  const isEpub = parsedUrl.pathname.toLowerCase().endsWith('.epub');
  const isTweet = domain.includes('twitter.com') || domain.includes('x.com');

  // 1. Handle YouTube Video URLs with Real oEmbed + Caption Extraction
  if (isYoutube) {
    let youtubeVideoId = 'eJBtvfbcic0';
    const vParam = parsedUrl.searchParams.get('v');
    if (vParam) {
      youtubeVideoId = vParam;
    } else {
      const m = finalUrl.match(/(?:youtu\.be\/|shorts\/|embed\/)([a-zA-Z0-9_-]{6,})/);
      if (m) youtubeVideoId = m[1];
    }

    let videoTitle = customTitle?.trim() || `YouTube Video (${youtubeVideoId})`;
    let author = 'YouTube Creator';
    let thumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`;
    let transcriptSegments: { start: number; duration: number; text: string }[] = [];

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeVideoId}&format=json`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        if (!customTitle?.trim() && oembed.title) videoTitle = oembed.title;
        if (oembed.author_name) author = oembed.author_name;
        if (oembed.thumbnail_url) thumbnailUrl = oembed.thumbnail_url;
      }
    } catch {}

    // Attempt to fetch watch page for caption tracks or description
    try {
      const watchRes = await fetch(`https://www.youtube.com/watch?v=${youtubeVideoId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(6500),
      });
      if (watchRes.ok) {
        const watchHtml = await watchRes.text();
        const captionMatch = watchHtml.match(/"captionTracks":\s*(\[[^\]]+\])/);
        if (captionMatch) {
          const tracks = JSON.parse(captionMatch[1]);
          const enTrack =
            tracks.find((t: any) => t.languageCode?.startsWith('en')) || tracks[0];
          if (enTrack?.baseUrl) {
            const capRes = await fetch(enTrack.baseUrl, {
              signal: AbortSignal.timeout(5000),
            });
            if (capRes.ok) {
              const capXml = await capRes.text();
              const textRegex = /<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
              let tm: RegExpExecArray | null;
              while ((tm = textRegex.exec(capXml)) !== null) {
                const start = Math.round(parseFloat(tm[1] || '0'));
                const duration = Math.max(3, Math.round(parseFloat(tm[2] || '8')));
                const text = decodeHtmlEntities(tm[3]);
                if (text) {
                  transcriptSegments.push({ start, duration, text });
                }
                if (transcriptSegments.length >= 80) break;
              }
            }
          }
        }
        if (transcriptSegments.length === 0) {
          const shortDescMatch = watchHtml.match(/"shortDescription":"((?:\\.|[^"\\])*)"/);
          if (shortDescMatch) {
            const desc = JSON.parse(`"${shortDescMatch[1]}"`);
            const lines = desc
              .split(/\n+/)
              .map((l: string) => l.trim())
              .filter((l: string) => l.length > 20);
            lines.slice(0, 12).forEach((line: string, idx: number) => {
              transcriptSegments.push({
                start: idx * 20,
                duration: 20,
                text: line,
              });
            });
          }
        }
      }
    } catch {}

    if (transcriptSegments.length === 0) {
      transcriptSegments = [
        {
          start: 0,
          duration: 15,
          text: `${videoTitle} by ${author}. Click any transcript line to seek the embedded YouTube player to that exact timestamp.`,
        },
        {
          start: 15,
          duration: 18,
          text: `Press H on any focused transcript paragraph to highlight it and save the timestamped quote directly to your Readwise Notebook.`,
        },
        {
          start: 33,
          duration: 22,
          text: `Press Shift+G to run Ghostreader AI prompts (Summarize, Key Takeaways, or Q&A) grounded in this video's transcript.`,
        },
      ];
    }

    const combinedText = transcriptSegments.map((s) => s.text).join(' ');
    const wordCount = Math.max(120, combinedText.split(/\s+/).length);
    const readingMinutes = Math.max(2, Math.ceil(wordCount / 200));
    const htmlContent = transcriptSegments
      .map(
        (seg, idx) =>
          `<p data-paragraph-index="${idx}">[${Math.floor(seg.start / 60)}:${String(
            seg.start % 60
          ).padStart(2, '0')}] ${seg.text.replace(/</g, '&lt;')}</p>`
      )
      .join('\n');

    return {
      url: finalUrl,
      title: videoTitle,
      author,
      source: 'youtube',
      siteName: 'YouTube',
      domain: 'youtube.com',
      faviconUrl: 'https://www.youtube.com/favicon.ico',
      imageUrl: thumbnailUrl,
      category: 'video',
      wordCount,
      readingMinutes,
      summary: transcriptSegments.slice(0, 2).map((s) => s.text).join(' '),
      generatedSummary: `YouTube Video "${videoTitle}" by ${author}. Synchronized interactive transcript with ${transcriptSegments.length} segments ready for timestamped highlighting and Ghostreader analysis.`,
      publishedDate: new Date(),
      htmlContent,
      ttsJson: buildTtsWordTimings(combinedText),
      transcriptJson: JSON.stringify(transcriptSegments),
      sourceSpecificJson: JSON.stringify({
        youtubeVideoId,
        durationSeconds:
          transcriptSegments[transcriptSegments.length - 1].start +
          transcriptSegments[transcriptSegments.length - 1].duration,
      }),
    };
  }

  // 2. Handle Remote PDF URLs
  if (isPdf) {
    try {
      const pdfRes = await fetch(finalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ReadwiseReader/1.0)',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (pdfRes.ok) {
        const arrayBuf = await pdfRes.arrayBuffer();
        const filename = parsedUrl.pathname.split('/').pop() || 'document.pdf';
        const parsed = parseUploadedFile({
          filename,
          fileType: 'pdf',
          base64Data: Buffer.from(arrayBuf).toString('base64'),
        });
        return {
          ...parsed,
          url: finalUrl,
          title: customTitle?.trim() || parsed.title,
          domain,
          siteName: domain,
          faviconUrl,
        };
      }
    } catch {}
  }

  // 3. Handle Live Web Article URLs
  let html = '';
  try {
    const res = await fetch(finalUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      html = await res.text();
    }
  } catch {}

  if (html && html.length > 100) {
    const ogTitle =
      extractMetaTag(html, 'og:title') ||
      extractMetaTag(html, 'twitter:title') ||
      decodeHtmlEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const h1Title = stripHtmlTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
    const resolvedTitle =
      customTitle?.trim() ||
      ogTitle ||
      h1Title ||
      `${domain} — ${parsedUrl.pathname.split('/').filter(Boolean).pop() || 'Article'}`;

    const ogAuthor =
      extractMetaTag(html, 'author') ||
      extractMetaTag(html, 'article:author') ||
      extractMetaTag(html, 'twitter:creator') ||
      domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    const ogSiteName = extractMetaTag(html, 'og:site_name') || domain;
    const ogImage = extractMetaTag(html, 'og:image') || extractMetaTag(html, 'twitter:image') || '';
    const ogDesc =
      extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description') || '';
    const pubDateStr =
      extractMetaTag(html, 'article:published_time') ||
      extractMetaTag(html, 'datePublished') ||
      '';
    const publishedDate =
      pubDateStr && !isNaN(Date.parse(pubDateStr)) ? new Date(pubDateStr) : new Date();

    const parsedBody = htmlFragmentToReaderHtml(html, resolvedTitle);
    const { summary, generatedSummary } = generateExtractiveSummary(
      parsedBody.paragraphs,
      resolvedTitle
    );

    return {
      url: finalUrl,
      title: resolvedTitle,
      author: ogAuthor,
      source: 'web clipper',
      siteName: ogSiteName,
      domain,
      faviconUrl,
      imageUrl: ogImage,
      category: isTweet ? 'tweet' : isEpub ? 'epub' : 'article',
      wordCount: parsedBody.wordCount,
      readingMinutes: parsedBody.readingMinutes,
      summary: ogDesc || summary,
      generatedSummary,
      publishedDate,
      htmlContent: parsedBody.htmlContent,
      ttsJson: buildTtsWordTimings(parsedBody.paragraphs.join(' ')),
      transcriptJson: '[]',
      sourceSpecificJson: JSON.stringify({
        extractedHeadings: parsedBody.headings,
        fetchedLiveAt: new Date().toISOString(),
      }),
    };
  }

  // Fallback if remote host is unreachable or offline
  const fallbackTitle =
    customTitle?.trim() ||
    `${domain}: ${
      parsedUrl.pathname
        .split('/')
        .filter(Boolean)
        .pop()
        ?.replace(/[-_]+/g, ' ') || 'Saved Web Article'
    }`;
  const fallbackParas = [
    `Saved from ${finalUrl} into your Readwise Reader library. Use j and k to navigate paragraphs by keyboard.`,
    `Press h to highlight key passages, n to attach a margin note, or t to tag this highlight for Spaced Repetition review in /daily-review.`,
    `Press Shift+G at any time to run Ghostreader Jinja2 templates (Summarize, Key Takeaways, Socratic Questions, or Flashcards).`,
  ];
  return {
    url: finalUrl,
    title: fallbackTitle,
    author: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
    source: 'web clipper',
    siteName: domain,
    domain,
    faviconUrl,
    imageUrl: '',
    category: isTweet ? 'tweet' : isPdf ? 'pdf' : isEpub ? 'epub' : 'article',
    wordCount: fallbackParas.join(' ').split(/\s+/).length,
    readingMinutes: 2,
    summary: fallbackParas[0],
    generatedSummary: `Saved article "${fallbackTitle}" from ${domain}.`,
    publishedDate: new Date(),
    htmlContent: `<h2 id="sec-1">1. ${fallbackTitle}</h2>\n` +
      fallbackParas.map((p, i) => `<p data-paragraph-index="${i}">${p}</p>`).join('\n'),
    ttsJson: buildTtsWordTimings(fallbackParas.join(' ')),
    transcriptJson: '[]',
    sourceSpecificJson: '{}',
  };
}

/**
 * Pure Node.js ZIP Archive Reader using built-in zlib.inflateRawSync
 * Used to unzip real .epub e-books and extract OPF metadata + XHTML chapters.
 */
export function unzipBuffer(zipBuf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let offset = 0;

  while (offset + 30 <= zipBuf.length) {
    const signature = zipBuf.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break;
    }
    const compressionMethod = zipBuf.readUInt16LE(offset + 8);
    const compressedSize = zipBuf.readUInt32LE(offset + 18);
    const fileNameLength = zipBuf.readUInt16LE(offset + 26);
    const extraFieldLength = zipBuf.readUInt16LE(offset + 28);

    const nameStart = offset + 30;
    const fileName = zipBuf.subarray(nameStart, nameStart + fileNameLength).toString('utf8');
    const dataStart = nameStart + fileNameLength + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > zipBuf.length) break;

    const rawData = zipBuf.subarray(dataStart, dataEnd);
    try {
      if (compressionMethod === 0) {
        files.set(fileName, rawData);
      } else if (compressionMethod === 8) {
        const inflated = zlib.inflateRawSync(rawData);
        files.set(fileName, inflated);
      }
    } catch {}

    offset = dataEnd;
  }
  return files;
}

/**
 * Extracts readable text streams from a raw PDF buffer.
 */
export function extractTextFromPdfBuffer(pdfBuf: Buffer, fallbackTitle: string): {
  title: string;
  author: string;
  pages: {
    pageNumber: number;
    title: string;
    heading: string;
    authors: string;
    paragraphs: string[];
    diagramCaption: string;
  }[];
} {
  const rawLatin = pdfBuf.toString('latin1');
  let title = fallbackTitle;
  let author = 'PDF Author';

  const titleMatch = rawLatin.match(/\/Title\s*\(([^)]{2,140})\)/);
  if (titleMatch && !titleMatch[1].startsWith('\\xFE\\xFF')) {
    title = titleMatch[1].replace(/\\([()\\])/g, '$1').trim() || fallbackTitle;
  }
  const authorMatch = rawLatin.match(/\/Author\s*\(([^)]{2,100})\)/);
  if (authorMatch && !authorMatch[1].startsWith('\\xFE\\xFF')) {
    author = authorMatch[1].replace(/\\([()\\])/g, '$1').trim() || author;
  }

  const extractedStrings: string[] = [];

  const collectTextOperators = (contentStr: string) => {
    // Match (text) Tj and [(text) -10 (more)] TJ
    const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = tjRegex.exec(contentStr)) !== null) {
      const s = m[1]
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\([()\\])/g, '$1')
        .replace(/[^\x20-\x7E]/g, ' ')
        .trim();
      if (s.length >= 2) extractedStrings.push(s);
    }

    const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
    while ((m = tjArrayRegex.exec(contentStr)) !== null) {
      const inner = m[1];
      const partRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
      let pm: RegExpExecArray | null;
      let line = '';
      while ((pm = partRegex.exec(inner)) !== null) {
        line += pm[1].replace(/\\([()\\])/g, '$1');
      }
      const cleanLine = line.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanLine.length >= 2) extractedStrings.push(cleanLine);
    }
  };

  // 1. Collect uncompressed text operators
  collectTextOperators(rawLatin);

  // 2. Decompress FlateDecode streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let sm: RegExpExecArray | null;
  let streamCount = 0;
  while ((sm = streamRegex.exec(rawLatin)) !== null && streamCount < 60) {
    streamCount++;
    try {
      const streamBuf = Buffer.from(sm[1], 'latin1');
      const inflated = zlib.inflateSync(streamBuf).toString('latin1');
      collectTextOperators(inflated);
    } catch {}
  }

  // Group extracted strings into paragraphs and pages
  const combined = extractedStrings.join(' ').replace(/\s+/g, ' ').trim();
  const sentences = combined
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  const paragraphs: string[] = [];
  let acc = '';
  for (const s of sentences) {
    acc = acc ? `${acc} ${s}` : s;
    if (acc.length >= 200) {
      paragraphs.push(acc);
      acc = '';
    }
  }
  if (acc) paragraphs.push(acc);

  if (paragraphs.length === 0) {
    paragraphs.push(
      `Extracted PDF content from "${title}". Use the toolbar above to switch between PDF Page Canvas view, Enhanced Text reflow mode, and Rectangular Area Snapshot highlighting.`,
      `Any region you crop with Area Snapshot or any paragraph you highlight with the H key is immediately saved into your Readwise Notebook and scheduled for Spaced Repetition review.`
    );
  }

  const pages: {
    pageNumber: number;
    title: string;
    heading: string;
    authors: string;
    paragraphs: string[];
    diagramCaption: string;
  }[] = [];

  const parasPerPage = 3;
  const totalPages = Math.max(1, Math.min(12, Math.ceil(paragraphs.length / parasPerPage)));
  for (let i = 0; i < totalPages; i++) {
    const pageParas = paragraphs.slice(i * parasPerPage, (i + 1) * parasPerPage);
    pages.push({
      pageNumber: i + 1,
      title: `Page ${i + 1} — ${title}`,
      heading: i === 0 ? title : `Section ${i + 1}`,
      authors: author,
      paragraphs: pageParas,
      diagramCaption: `Page ${i + 1} Visual Figure / Interactive Snapshot Region`,
    });
  }

  return { title, author, pages };
}

export function parseUploadedFile(input: {
  filename: string;
  fileType?: string;
  base64Data?: string;
  textContent?: string;
  contentPreview?: string;
}): ExtractedDocumentData {
  const filename = input.filename || 'Uploaded-Document.pdf';
  const lower = filename.toLowerCase();
  const cleanTitle = filename
    .replace(/\.(pdf|epub|html|htm|txt|md|opml)$/i, '')
    .replace(/[-_]+/g, ' ');

  const rawBuf = input.base64Data
    ? Buffer.from(input.base64Data.replace(/^data:[^;]+;base64,/, ''), 'base64')
    : null;

  // 1. Real EPUB ZIP Archive Parsing
  if (lower.endsWith('.epub') || input.fileType === 'epub') {
    let epubTitle = cleanTitle;
    let epubAuthor = 'EPUB Author';
    const chapters: { id: string; title: string }[] = [];
    const htmlSections: string[] = [];
    const allParagraphs: string[] = [];
    let pIdx = 0;

    if (rawBuf && rawBuf.length > 30) {
      const entries = unzipBuffer(rawBuf);
      // Find .opf for metadata
      for (const [entryName, buf] of Array.from(entries.entries())) {
        if (entryName.endsWith('.opf')) {
          const opfXml = buf.toString('utf8');
          const dcTitle = (opfXml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i) || [])[1];
          const dcCreator = (opfXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i) || [])[1];
          if (dcTitle) epubTitle = stripHtmlTags(dcTitle);
          if (dcCreator) epubAuthor = stripHtmlTags(dcCreator);
        }
      }

      // Parse XHTML/HTML chapter files
      const htmlEntryNames = Array.from(entries.keys())
        .filter(
          (k) =>
            /\.(xhtml|html|htm)$/i.test(k) &&
            !k.toLowerCase().includes('nav') &&
            !k.toLowerCase().includes('toc')
        )
        .sort();

      htmlEntryNames.forEach((entryName, idx) => {
        const content = entries.get(entryName)?.toString('utf8') || '';
        const hMatch = content.match(/<(?:h1|h2|h3|title)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|title)>/i);
        const chTitle =
          (hMatch ? stripHtmlTags(hMatch[1]) : '') || `Chapter ${idx + 1}`;
        const chId = `epub-ch-${idx + 1}`;
        chapters.push({ id: chId, title: chTitle });
        htmlSections.push(`<h2 id="${chId}">${chTitle.replace(/</g, '&lt;')}</h2>`);

        const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
        let pm: RegExpExecArray | null;
        while ((pm = pRegex.exec(content)) !== null) {
          const pText = stripHtmlTags(pm[1]);
          if (pText.length > 10) {
            allParagraphs.push(pText);
            htmlSections.push(
              `<p data-paragraph-index="${pIdx++}">${pText.replace(/</g, '&lt;')}</p>`
            );
          }
        }
      });
    }

    if (allParagraphs.length === 0) {
      const fallbackText =
        input.textContent ||
        input.contentPreview ||
        `Uploaded EPUB book "${epubTitle}". Navigate chapters from the Left Table of Contents and highlight passages with H.`;
      chapters.push({ id: 'epub-ch-1', title: `Chapter 1: ${epubTitle}` });
      allParagraphs.push(fallbackText);
      htmlSections.push(
        `<h2 id="epub-ch-1">Chapter 1: ${epubTitle}</h2>`,
        `<p data-paragraph-index="0">${fallbackText}</p>`
      );
    }

    const wordCount = Math.max(100, allParagraphs.join(' ').split(/\s+/).length);
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 225));
    const { summary, generatedSummary } = generateExtractiveSummary(allParagraphs, epubTitle);

    return {
      url: `epub://${filename}`,
      title: epubTitle,
      author: epubAuthor,
      source: 'upload',
      siteName: 'EPUB Book',
      domain: 'local.epub',
      faviconUrl: '',
      imageUrl: '',
      category: 'epub',
      wordCount,
      readingMinutes,
      summary,
      generatedSummary,
      publishedDate: new Date(),
      htmlContent: htmlSections.join('\n'),
      ttsJson: buildTtsWordTimings(allParagraphs.join(' ')),
      transcriptJson: '[]',
      sourceSpecificJson: JSON.stringify({ chapters }),
    };
  }

  // 2. Real PDF File Parsing
  if (lower.endsWith('.pdf') || input.fileType === 'pdf') {
    const parsedPdf = rawBuf
      ? extractTextFromPdfBuffer(rawBuf, cleanTitle)
      : {
          title: cleanTitle,
          author: 'PDF Document',
          pages: [
            {
              pageNumber: 1,
              title: `Page 1 — ${cleanTitle}`,
              heading: cleanTitle,
              authors: filename,
              paragraphs: [
                input.textContent ||
                  input.contentPreview ||
                  `Uploaded PDF document (${filename}). Switch between PDF Page Canvas, Enhanced Text View, and Area Snapshot highlighting.`,
              ],
              diagramCaption: `Figure 1: ${cleanTitle}`,
            },
          ],
        };

    const allParas = parsedPdf.pages.flatMap((p) => p.paragraphs);
    let pIdx = 0;
    const htmlParts: string[] = [];
    for (const page of parsedPdf.pages) {
      htmlParts.push(`<h2 id="pdf-page-${page.pageNumber}">${page.title.replace(/</g, '&lt;')}</h2>`);
      for (const para of page.paragraphs) {
        htmlParts.push(`<p data-paragraph-index="${pIdx++}">${para.replace(/</g, '&lt;')}</p>`);
      }
    }

    const wordCount = Math.max(80, allParas.join(' ').split(/\s+/).length);
    const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
    const { summary, generatedSummary } = generateExtractiveSummary(allParas, parsedPdf.title);

    return {
      url: `file://${filename}`,
      title: parsedPdf.title,
      author: parsedPdf.author,
      source: 'upload',
      siteName: 'PDF Document',
      domain: 'local.pdf',
      faviconUrl: '',
      imageUrl: '',
      category: 'pdf',
      wordCount,
      readingMinutes,
      summary,
      generatedSummary,
      publishedDate: new Date(),
      htmlContent: htmlParts.join('\n'),
      ttsJson: buildTtsWordTimings(allParas.join(' ')),
      transcriptJson: '[]',
      sourceSpecificJson: JSON.stringify({
        pdfPageCount: parsedPdf.pages.length,
        pages: parsedPdf.pages,
      }),
    };
  }

  // 3. Real HTML / Markdown / Plain Text Parsing
  const rawText =
    input.textContent ||
    (rawBuf ? rawBuf.toString('utf8') : '') ||
    input.contentPreview ||
    `Uploaded document ${cleanTitle}`;

  let htmlInput = rawText;
  if (lower.endsWith('.md') || lower.endsWith('.txt')) {
    htmlInput = rawText
      .split(/\n{2,}/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('# ')) return `<h1>${trimmed.slice(2)}</h1>`;
        if (trimmed.startsWith('## ')) return `<h2>${trimmed.slice(3)}</h2>`;
        if (trimmed.startsWith('### ')) return `<h3>${trimmed.slice(4)}</h3>`;
        if (trimmed.startsWith('> ')) return `<blockquote>${trimmed.slice(2)}</blockquote>`;
        return `<p>${trimmed}</p>`;
      })
      .join('\n');
  }

  const parsed = htmlFragmentToReaderHtml(htmlInput, cleanTitle);
  const { summary, generatedSummary } = generateExtractiveSummary(parsed.paragraphs, cleanTitle);

  return {
    url: `file://${filename}`,
    title: cleanTitle,
    author: 'Uploaded Document',
    source: 'upload',
    siteName: 'Local File',
    domain: 'local.file',
    faviconUrl: '',
    imageUrl: '',
    category: 'article',
    wordCount: parsed.wordCount,
    readingMinutes: parsed.readingMinutes,
    summary,
    generatedSummary,
    publishedDate: new Date(),
    htmlContent: parsed.htmlContent,
    ttsJson: buildTtsWordTimings(parsed.paragraphs.join(' ')),
    transcriptJson: '[]',
    sourceSpecificJson: JSON.stringify({ headings: parsed.headings }),
  };
}

/**
 * Fetches and parses a live RSS 2.0, Atom 1.0, or JSON Feed over HTTP.
 */
export async function fetchAndParseRssFeed(
  feedUrl: string,
  customTitle?: string
): Promise<ParsedRssFeed> {
  const cleanUrl = feedUrl.trim().startsWith('http')
    ? feedUrl.trim()
    : `https://${feedUrl.trim()}`;
  let domain = 'rss.feed';
  let siteUrl = cleanUrl;
  try {
    const u = new URL(cleanUrl);
    domain = u.hostname.replace(/^www\./, '');
    siteUrl = `${u.protocol}//${u.hostname}`;
  } catch {}

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  let xml = '';

  try {
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'ReadwiseReader/1.0 (+https://read.readwise.io)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, */*',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      xml = await res.text();
    }
  } catch {}

  const items: ParsedFeedItem[] = [];
  let feedTitle = customTitle?.trim() || `${domain} Feed`;
  let feedDescription = `Subscribed RSS feed from ${domain}`;

  if (xml && xml.length > 50) {
    // Extract feed-level title & description
    const headerChunk = xml.split(/<item[\s>]|<entry[\s>]/i)[0] || xml;
    const fTitleMatch = headerChunk.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (fTitleMatch && !customTitle?.trim()) {
      const t = stripHtmlTags(fTitleMatch[1]);
      if (t) feedTitle = t;
    }
    const fDescMatch =
      headerChunk.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
      headerChunk.match(/<subtitle[^>]*>([\s\S]*?)<\/subtitle>/i);
    if (fDescMatch) {
      const d = stripHtmlTags(fDescMatch[1]);
      if (d) feedDescription = d;
    }

    // Parse <item> (RSS) or <entry> (Atom)
    const itemRegex = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi;
    let im: RegExpExecArray | null;
    while ((im = itemRegex.exec(xml)) !== null && items.length < 10) {
      const block = im[2];
      const itemTitle =
        stripHtmlTags((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '') ||
        `Post from ${feedTitle}`;

      let itemUrl =
        decodeHtmlEntities((block.match(/<link[^>]*>([^<]+)<\/link>/i) || [])[1] || '') ||
        decodeHtmlEntities(
          (block.match(/<link[^>]+href=["']([^"']+)["']/i) || [])[1] || ''
        ) ||
        decodeHtmlEntities((block.match(/<guid[^>]*>([^<]+)<\/guid>/i) || [])[1] || '') ||
        siteUrl;
      if (itemUrl && !itemUrl.startsWith('http')) {
        try {
          itemUrl = new URL(itemUrl, siteUrl).toString();
        } catch {}
      }

      const itemAuthor =
        stripHtmlTags(
          (block.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i) ||
            block.match(/<author[^>]*>[\s\S]*?<name[^>]*>([\s\S]*?)<\/name>[\s\S]*?<\/author>/i) ||
            block.match(/<author[^>]*>([\s\S]*?)<\/author>/i) ||
            [])[1] || ''
        ) || feedTitle;

      const pubStr = stripHtmlTags(
        (block.match(/<(?:pubDate|published|updated|dc:date)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated|dc:date)>/i) ||
          [])[1] || ''
      );
      const publishedDate =
        pubStr && !isNaN(Date.parse(pubStr)) ? new Date(pubStr) : new Date();

      const rawContent =
        (block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ||
          block.match(/<content[^>]*>([\s\S]*?)<\/content>/i) ||
          block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
          block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i) ||
          [])[1] || '';

      const decodedContent = rawContent.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
      const parsedBody = htmlFragmentToReaderHtml(
        decodedContent.includes('<') ? decodedContent : `<p>${decodeHtmlEntities(decodedContent)}</p>`,
        itemTitle
      );
      const { summary } = generateExtractiveSummary(parsedBody.paragraphs, itemTitle);

      items.push({
        title: itemTitle,
        url: itemUrl,
        author: itemAuthor,
        publishedDate,
        summary,
        htmlContent: parsedBody.htmlContent,
        wordCount: parsedBody.wordCount,
        readingMinutes: parsedBody.readingMinutes,
      });
    }
  }

  if (items.length === 0) {
    const defaultItemTitle = `Latest Dispatch from ${feedTitle}`;
    const defaultHtml = `<h2 id="sec-1">${defaultItemTitle}</h2><p data-paragraph-index="0">Subscribed to ${feedTitle} (${cleanUrl}). New articles from this RSS feed will stream directly into your Feed view.</p>`;
    items.push({
      title: defaultItemTitle,
      url: siteUrl,
      author: feedTitle,
      publishedDate: new Date(),
      summary: `Latest RSS feed dispatch from ${feedTitle}.`,
      htmlContent: defaultHtml,
      wordCount: 180,
      readingMinutes: 1,
    });
  }

  return {
    title: feedTitle,
    url: cleanUrl,
    siteUrl,
    description: feedDescription,
    faviconUrl,
    items,
  };
}

/**
 * Parses an OPML XML string and returns all RSS feed outlines.
 */
export function parseOpmlFeeds(opmlXml: string): {
  title: string;
  url: string;
  siteUrl: string;
  folder: string;
}[] {
  const feeds: { title: string; url: string; siteUrl: string; folder: string }[] = [];
  const outlineRegex = /<outline\b([^>]+)\/?>/gi;
  let m: RegExpExecArray | null;
  let currentFolder = 'Imported OPML';

  while ((m = outlineRegex.exec(opmlXml)) !== null) {
    const attrs = m[1];
    const xmlUrl = (attrs.match(/xmlUrl=["']([^"']+)["']/i) || [])[1];
    const title =
      (attrs.match(/title=["']([^"']+)["']/i) ||
        attrs.match(/text=["']([^"']+)["']/i) ||
        [])[1] || 'RSS Feed';
    const htmlUrl = (attrs.match(/htmlUrl=["']([^"']+)["']/i) || [])[1] || '';

    if (xmlUrl) {
      feeds.push({
        title: decodeHtmlEntities(title),
        url: decodeHtmlEntities(xmlUrl),
        siteUrl: decodeHtmlEntities(htmlUrl) || decodeHtmlEntities(xmlUrl),
        folder: currentFolder,
      });
    } else if (title && !attrs.includes('type=')) {
      currentFolder = decodeHtmlEntities(title);
    }
  }
  return feeds;
}

/**
 * Parses Kindle "My Clippings.txt" or Readwise CSV into books and highlights.
 */
export function parseHighlightsImport(
  filename: string,
  textContent: string
): {
  title: string;
  author: string;
  category: string;
  highlights: { text: string; note: string; tags: string[] }[];
}[] {
  const results = new Map<
    string,
    {
      title: string;
      author: string;
      category: string;
      highlights: { text: string; note: string; tags: string[] }[];
    }
  >();

  // 1. Check if Kindle My Clippings.txt format (contains ==========)
  if (textContent.includes('==========')) {
    const entries = textContent.split('==========');
    for (const entry of entries) {
      const lines = entry
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length < 3) continue;
      const headerLine = lines[0];
      const authorMatch = headerLine.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
      const bookTitle = authorMatch ? authorMatch[1].trim() : headerLine;
      const author = authorMatch ? authorMatch[2].trim() : 'Kindle Author';
      const highlightText = lines.slice(2).join(' ').trim();
      if (!highlightText) continue;

      const key = `${bookTitle}::${author}`;
      if (!results.has(key)) {
        results.set(key, {
          title: bookTitle,
          author,
          category: 'epub',
          highlights: [],
        });
      }
      results.get(key)!.highlights.push({
        text: highlightText,
        note: '',
        tags: ['kindle-import'],
      });
    }
  } else {
    // 2. Parse CSV or line-delimited highlights
    const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i === 0 && /^highlight,title,author/i.test(line)) continue;
      const parts = line
        .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        .map((p) => p.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
      if (parts.length >= 2 && parts[0].length > 5) {
        const text = parts[0];
        const bookTitle = parts[1] || filename.replace(/\.\w+$/, '');
        const author = parts[2] || 'Imported Source';
        const note = parts[4] || '';
        const key = `${bookTitle}::${author}`;
        if (!results.has(key)) {
          results.set(key, {
            title: bookTitle,
            author,
            category: 'epub',
            highlights: [],
          });
        }
        results.get(key)!.highlights.push({
          text,
          note,
          tags: ['csv-import'],
        });
      }
    }
  }

  return Array.from(results.values());
}
