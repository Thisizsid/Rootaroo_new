import type { User } from '../../database/models';

export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

export interface CreateEventBody {
  title: string;
  startsAt: string; // ISO timestamp (e.g. "2026-08-03T18:00:00.000Z")
  endsAt: string;   // ISO timestamp
  inviteeIds?: string[];
  repeats?: RepeatRule;
  syncToGoogle?: boolean;
  description?: string | null;
}

export interface UpdateEventBody {
  title?: string;
  startsAt?: string;
  endsAt?: string;
  inviteeIds?: string[];
  repeats?: RepeatRule;
  syncToGoogle?: boolean;
  description?: string | null;
}

/** Response used for the iCalendar (.ics) export — flat, no invitee join needed. */
export interface IcsEventLine {
  uid: string;
  title: string;
  description: string | null;
  eventDate: string;   // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
  location: string | null;
}

export interface EventInviteeResponse {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
}

export interface CalendarEventResponse {
  id: string;
  householdId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  inviteeIds: string[];
  repeats: RepeatRule;
  syncToGoogle: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ListEventsQuery {
  month?: string; // "YYYY-MM"
}

export interface GoogleCalendarConnectBody {
  code: string;
  redirectUri?: string;
}

export interface GoogleCalendarStatusResponse {
  connected: boolean;
  googleCalendarId: string | null;
  lastSyncedAt: string | null;
}

export function toInviteeResponse(user: User): EventInviteeResponse {
  return {
    userId: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    avatarEmoji: user.avatarEmoji,
  };
}
