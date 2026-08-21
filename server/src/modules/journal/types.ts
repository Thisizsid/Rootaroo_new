export interface CreateEntryBody {
  content?: string;
  media?: Array<{
    mediaUrl: string;
    mediaType: 'photo' | 'video';
    thumbnailUrl?: string;
    fileSizeBytes?: number;
  }>;
}

export interface UpdateEntryBody {
  content?: string;
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
