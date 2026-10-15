export interface ReaderAnnotation {
  id: string;
  documentId: string;
  type: 'highlight' | 'note' | 'area_snapshot' | string;
  paragraphIndex: number | null;
  selectedText: string;
  note: string;
  color: 'yellow' | 'blue' | 'pink' | 'orange' | string;
  tags: string[];
  boundingBox: any;
  timestampSeconds?: number | null;
  createdAt: string;
}

export interface ReaderDocument extends QueryableDocument {
  faviconUrl?: string;
  imageUrl?: string;
  htmlContent: string;
  tts?: any;
  transcript?: any[];
  sourceSpecific?: any;
  annotations: ReaderAnnotation[];
}

export interface QueryableDocument {
  id: string;
  url: string;
  title: string;
  author: string;
  source: string;
  siteName: string;
  domain: string;
  category: string;
  triageStatus: string;
  isShortlisted: boolean;
  isSeen: boolean;
  inFeed: boolean;
  wordCount: number;
  readingMinutes: number;
  readingProgress: number;
  summary: string;
  generatedSummary: string;
  documentNote: string;
  tags: string[];
  annotationsCount: number;
  notesCount: number;
  highlightTags: string[];
  savedAt: string | Date;
  publishedDate?: string | Date | null;
  lastOpenedAt?: string | Date | null;
}

export const QUERY_DSL_SUGGESTIONS = [
  { token: 'category:', description: 'Filter by document type (article, pdf, epub, email, tweet, video, podcast)', examples: ['category:article', 'category:pdf', 'category:epub', 'category:video'] },
  { token: 'in:', description: 'Filter by triage location (inbox, later, archive, shortlist, feed)', examples: ['in:inbox', 'in:later', 'in:archive', 'in:shortlist', 'in:feed'] },
  { token: 'tag:', description: 'Filter by document tag name', examples: ['tag:shortlist', 'tag:reverse-engineering', 'tag:important-architecture', 'tag:ai-agents'] },
  { token: 'highlight_tags:', description: 'Filter by tag attached to a highlight', examples: ['highlight_tags:important-architecture'] },
  { token: 'has:', description: 'Check presence of highlights, notes, tags, or summary', examples: ['has:highlights', 'has:notes', 'has:tags', 'has:summary'] },
  { token: 'minutes__lt:', description: 'Reading time less than N minutes', examples: ['minutes__lt:10', 'minutes__lt:5'] },
  { token: 'minutes__gt:', description: 'Reading time greater than N minutes', examples: ['minutes__gt:15', 'minutes__gt:30'] },
  { token: 'progress__gt:', description: 'Reading progress percentage greater than N%', examples: ['progress__gt:5', 'progress__gt:50'] },
  { token: 'progress__lt:', description: 'Reading progress percentage less than N%', examples: ['progress__lt:100'] },
  { token: 'feed:', description: 'Filter RSS feed items (true/false)', examples: ['feed:true', 'feed:false'] },
  { token: 'seen:', description: 'Filter seen/unseen status (true/false)', examples: ['seen:true', 'seen:false'] },
  { token: 'author:', description: 'Match author name substring', examples: ['author:Vaswani', 'author:"Paul Graham"'] },
  { token: 'domain:', description: 'Match source domain', examples: ['domain:arxiv.org', 'domain:blog.readwise.io'] },
  { token: 'title:', description: 'Match document title substring', examples: ['title:Reader', 'title:Transformer'] },
  { token: 'saved__gt:', description: 'Saved after relative date', examples: ['saved__gt:"1 week ago"', 'saved__gt:"1 month ago"'] },
  { token: 'last_opened__after:', description: 'Opened after relative date', examples: ['last_opened__after:"1 week ago"'] },
];

function parseRelativeDate(val: string): number {
  const clean = val.replace(/^["']|["']$/g, '').trim().toLowerCase();
  const now = Date.now();
  const match = clean.match(/^(\d+)\s*(hour|day|week|month|year)s?\s*ago$/);
  if (match) {
    const count = parseInt(match[1], 10);
    const unit = match[2];
    const mult =
      unit === 'hour'
        ? 3600000
        : unit === 'day'
        ? 86400000
        : unit === 'week'
        ? 86400000 * 7
        : unit === 'month'
        ? 86400000 * 30
        : 86400000 * 365;
    return now - count * mult;
  }
  const parsed = Date.parse(clean);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function evaluateAtomicPredicate(doc: QueryableDocument, rawToken: string): boolean {
  const token = rawToken.trim();
  if (!token) return true;

  if (token.toUpperCase().startsWith('NOT ')) {
    return !evaluateAtomicPredicate(doc, token.slice(4));
  }
  if (token.startsWith('-')) {
    return !evaluateAtomicPredicate(doc, token.slice(1));
  }

  const colonIdx = token.indexOf(':');
  if (colonIdx === -1) {
    const q = token.replace(/^["']|["']$/g, '').toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.author.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.domain.toLowerCase().includes(q) ||
      doc.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const field = token.slice(0, colonIdx).trim().toLowerCase();
  const rawVal = token.slice(colonIdx + 1).trim();
  const val = rawVal.replace(/^["']|["']$/g, '').toLowerCase();

  switch (field) {
    case 'category':
    case 'type':
      return doc.category.toLowerCase() === val && doc.triageStatus !== 'trash';
    case 'in':
    case 'location':
      if (val === 'inbox' || val === 'new') return doc.triageStatus === 'new';
      if (val === 'later') return doc.triageStatus === 'later';
      if (val === 'archive') return doc.triageStatus === 'archive';
      if (val === 'shortlist') return doc.isShortlisted || doc.tags.includes('shortlist');
      if (val === 'feed') return doc.inFeed || doc.triageStatus === 'feed';
      if (val === 'trash') return doc.triageStatus === 'trash';
      return doc.triageStatus === val;
    case 'tag':
      if (val === 'shortlist') return doc.isShortlisted || doc.tags.some((t) => t.toLowerCase() === 'shortlist');
      return doc.tags.some((t) => t.toLowerCase() === val || t.toLowerCase().includes(val));
    case 'highlight_tags':
      return doc.highlightTags.some((t) => t.toLowerCase().includes(val));
    case 'has':
      if (val === 'highlights') return doc.annotationsCount > 0;
      if (val === 'notes' || val === 'document_note') return Boolean(doc.documentNote) || doc.notesCount > 0;
      if (val === 'tags') return doc.tags.length > 0;
      if (val === 'summary') return Boolean(doc.generatedSummary || doc.summary);
      return true;
    case 'feed':
      return (val === 'true') === Boolean(doc.inFeed || doc.triageStatus === 'feed');
    case 'seen':
      return (val === 'true') === Boolean(doc.isSeen);
    case 'minutes__lt':
    case 'minutes:<':
      return doc.readingMinutes < parseFloat(val.replace('<', ''));
    case 'minutes__gt':
    case 'minutes:>':
      return doc.readingMinutes > parseFloat(val.replace('>', ''));
    case 'minutes':
      if (val.startsWith('<')) return doc.readingMinutes < parseFloat(val.slice(1));
      if (val.startsWith('>')) return doc.readingMinutes > parseFloat(val.slice(1));
      return doc.readingMinutes === parseFloat(val);
    case 'progress__gt':
      return doc.readingProgress > parseFloat(val);
    case 'progress__lt':
      return doc.readingProgress < parseFloat(val);
    case 'author':
    case 'by':
      return doc.author.toLowerCase().includes(val);
    case 'domain':
      return doc.domain.toLowerCase().includes(val);
    case 'title':
      return doc.title.toLowerCase().includes(val);
    case 'document_note':
      return doc.documentNote.toLowerCase().includes(val);
    case 'saved__gt':
    case 'saved__after': {
      const ts = parseRelativeDate(rawVal);
      return new Date(doc.savedAt).getTime() >= ts;
    }
    case 'last_opened__gt':
    case 'last_opened__after': {
      if (!doc.lastOpenedAt) return false;
      const ts = parseRelativeDate(rawVal);
      return new Date(doc.lastOpenedAt).getTime() >= ts;
    }
    default:
      return true;
  }
}

export function evaluateFilteredViewQuery(doc: QueryableDocument, query: string): boolean {
  if (!query || !query.trim()) return doc.triageStatus !== 'trash';
  if (doc.triageStatus === 'trash' && !query.toLowerCase().includes('in:trash')) {
    return false;
  }

  // Evaluate parenthesized sub-expressions first
  let expr = query.trim();
  const parenRegex = /\(([^()]+)\)/;
  let safety = 0;
  while (parenRegex.test(expr) && safety < 20) {
    safety++;
    expr = expr.replace(parenRegex, (_, inner) => {
      return evaluateFilteredViewQuery(doc, inner) ? '__TRUE__' : '__FALSE__';
    });
  }

  // Split by top-level OR
  const orBranches = expr.split(/\s+OR\s+/i);
  return orBranches.some((branch) => {
    const andParts = branch.split(/\s+AND\s+/i);
    return andParts.every((part) => {
      const trimmed = part.trim();
      if (trimmed === '__TRUE__') return true;
      if (trimmed === '__FALSE__') return false;
      return evaluateAtomicPredicate(doc, trimmed);
    });
  });
}

export function evaluateQueryDsl(docs: ReaderDocument[], query: string): ReaderDocument[] {
  if (!Array.isArray(docs)) return [];
  return docs.filter((d) => {
    const qDoc: QueryableDocument = {
      ...d,
      annotationsCount: d.annotationsCount ?? d.annotations?.length ?? 0,
      notesCount:
        d.notesCount ??
        (d.annotations?.filter((a) => Boolean(a.note?.trim())).length || 0) +
          (d.documentNote?.trim() ? 1 : 0),
      highlightTags:
        d.highlightTags ??
        (d.annotations?.flatMap((a) => a.tags || []) || []),
    };
    return evaluateFilteredViewQuery(qDoc, query);
  });
}

