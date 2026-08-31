/**
 * The five moods the composer offers, ordered worst → best. The numeric
 * position IS the score the History chart plots, which is why the union is
 * ordinal rather than an unordered set of feelings: a bar chart of
 * `{happy, angry, calm}` has no meaningful height.
 */
export type Mood = 'rough' | 'low' | 'neutral' | 'calm' | 'happy';

export interface EntryMediaInput {
  mediaUrl: string;
  /** Photos only — see `newMediaSchema` in validation.ts. */
  mediaType: 'photo';
  thumbnailUrl?: string;
  fileSizeBytes?: number;
}

export interface CreateEntryBody {
  content?: string;
  mood?: Mood;
  tags?: string[];
  media?: EntryMediaInput[];
}

export interface UpdateEntryBody {
  content?: string;
  mood?: Mood | null;
  tags?: string[];
  /**
   * When present, REPLACES the entry's media set (an empty array clears it).
   * An item already on the entry is referenced by `{ id }`; a newly uploaded
   * one carries its full descriptor. See `updateMediaSchema`.
   */
  media?: Array<EntryMediaInput | { id: string }>;
}

export interface JournalMediaResponse {
  id: string;
  mediaUrl: string;
  mediaType: string;
  thumbnailUrl: string | null;
  fileSizeBytes: number | null;
}

export interface JournalEntryResponse {
  id: string;
  content: string | null;
  mood: Mood | null;
  tags: string[];
  wordCount: number;
  media: JournalMediaResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedJournalResponse {
  entries: JournalEntryResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface JournalEntryQuery {
  cursor?: string;
  limit?: number;
}

/** One calendar day in the last-7-days streak strip. */
export interface StreakDay {
  /** `yyyy-MM-dd`, in the household's timezone. */
  date: string;
  written: boolean;
  mood: Mood | null;
}

/** Powers the Journal home screen's streak card and prompt. */
export interface JournalStatsResponse {
  /** Consecutive days written up to and including today. A day missed today
   *  does NOT break the streak until tomorrow — see `computeStreak`. */
  streak: number;
  bestStreak: number;
  wroteToday: boolean;
  entriesThisMonth: number;
  wordsThisMonth: number;
  /** Oldest → newest, always exactly 7 entries ending with today. */
  last7Days: StreakDay[];
  /** Today's writing prompt — stable for the whole day. */
  prompt: string;
}

export interface MoodDay {
  date: string;
  mood: Mood;
  score: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

/** Powers the History screen. */
export interface JournalHistoryResponse {
  /** `yyyy-MM` the stats describe. */
  month: string;
  /** Every day of the month that has at least one entry, oldest first. */
  moodDays: MoodDay[];
  entryDates: string[];
  topTags: TagCount[];
  /** e.g. "Mostly calm" — the modal mood of the month, or null if no entries. */
  moodSummary: string | null;
  /** Days whose mood scored above neutral. */
  goodDays: number;
  /** Percent change in average mood score vs. the previous month; null when
   *  either month has no moods to compare. */
  moodDeltaPercent: number | null;
  daysInMonth: number;
  /** Weekday index (0 = Monday) the 1st falls on, so the client can lay out
   *  the calendar grid without re-deriving the household's week start. */
  firstWeekday: number;
}

/** One past entry written on the same month/day as the anchor date. */
export interface OnThisDayEntry {
  id: string;
  date: string;
  yearsAgo: number;
  snippet: string;
}
