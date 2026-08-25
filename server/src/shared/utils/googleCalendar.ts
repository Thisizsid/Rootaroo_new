import { env } from '../../config/env';
import { CalendarSyncState } from '../../database/models';
import { AppError } from './errors';
import logger from './logger';

/**
 * Google Calendar API helpers — raw `fetch` calls (matches the style already
 * used for `googleAuth()` login and Auth0 passwordless in `auth/service.ts`;
 * this codebase doesn't use a Google SDK client). Handles the OAuth token
 * exchange for the calendar-scope "connect" flow, silent refresh of expired
 * access tokens, and the actual Calendar API reads/writes used by the sync
 * engine in `calendar/service.ts`.
 */

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
}

/**
 * Exchange an authorization code for tokens.
 *
 * `redirectUri` is optional: a `serverAuthCode` obtained from the native
 * Google Sign-In SDK (`GoogleSignin.signIn()` with `offlineAccess: true`)
 * isn't tied to a redirect URI the way a browser-based authorization-code
 * flow is — sending one that doesn't match what Google expects for that
 * code type can itself break the exchange, so it's only included when the
 * caller actually has one.
 */
export async function exchangeCodeForTokens(code: string, redirectUri?: string): Promise<GoogleTokens> {
  const params: Record<string, string> = {
    code,
    client_id: env.google.clientId,
    client_secret: env.google.clientSecret,
    grant_type: 'authorization_code',
  };
  if (redirectUri) params.redirect_uri = redirectUri;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(401, `Google Calendar token exchange failed: ${body}`);
  }

  const data = (await res.json()) as GoogleTokenResponse;
  if (!data.refresh_token) {
    // Google only returns a refresh token on the *first* consent (or with
    // prompt=consent forced) — the client is responsible for requesting
    // prompt=consent so this should always be present on connect.
    throw new AppError(400, 'Google did not grant offline access. Please reconnect and approve calendar access.');
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(401, `Google Calendar token refresh failed: ${body}`);
  }

  const data = (await res.json()) as GoogleTokenResponse;
  return { accessToken: data.access_token, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
}

/** Returns a valid access token for this sync state, refreshing (and persisting) it first if expired. */
export async function getValidAccessToken(state: CalendarSyncState): Promise<string> {
  const isExpired = !state.tokenExpiresAt || state.tokenExpiresAt.getTime() <= Date.now() + 60_000;
  if (!isExpired && state.accessToken) return state.accessToken;

  if (!state.refreshToken) {
    throw new AppError(401, 'Google Calendar connection lost its refresh token — please reconnect.');
  }

  const { accessToken, expiresAt } = await refreshAccessToken(state.refreshToken);
  state.accessToken = accessToken;
  state.tokenExpiresAt = expiresAt;
  await state.save();
  return accessToken;
}

/** Resolve the user's primary Google calendar ID right after connecting. */
export async function getPrimaryCalendarId(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=owner', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new AppError(502, 'Could not read the connected Google account\'s calendar list');

  const data = (await res.json()) as { items?: { id: string; primary?: boolean }[] };
  const primary = data.items?.find((c) => c.primary) || data.items?.[0];
  if (!primary) throw new AppError(502, 'No Google calendar found for this account');
  return primary.id;
}

export interface GoogleCalendarEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  recurrence?: string[];
}

export interface GoogleEventsPage {
  events: GoogleCalendarEvent[];
  nextSyncToken: string | null;
}

/**
 * Incremental sync read. Falls back to a full sync (no syncToken) when the
 * stored token is missing or Google returns 410 GONE (expired token), per
 * Google's documented incremental-sync contract.
 */
export async function listGoogleEvents(
  accessToken: string,
  calendarId: string,
  syncToken: string | null,
): Promise<GoogleEventsPage> {
  const events: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;
  let effectiveSyncToken = syncToken;

  for (;;) {
    const params = new URLSearchParams({ maxResults: '250', singleEvents: 'true' });
    if (effectiveSyncToken) params.set('syncToken', effectiveSyncToken);
    else params.set('timeMin', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (res.status === 410 && effectiveSyncToken) {
      // Sync token expired — restart as a full sync.
      logger.warn('[GoogleCalendar] Sync token expired, falling back to full sync');
      effectiveSyncToken = null;
      pageToken = undefined;
      events.length = 0;
      continue;
    }
    if (!res.ok) throw new AppError(502, `Google Calendar events fetch failed: ${await res.text()}`);

    const data = (await res.json()) as {
      items?: GoogleCalendarEvent[];
      nextPageToken?: string;
      nextSyncToken?: string;
    };
    events.push(...(data.items || []));

    if (data.nextPageToken) {
      pageToken = data.nextPageToken;
      continue;
    }
    nextSyncToken = data.nextSyncToken || null;
    break;
  }

  return { events, nextSyncToken };
}

export interface PushEventInput {
  title: string;
  description: string | null;
  startIso: string;
  endIso: string;
  recurrenceRule: string | null;
}

/** Create or update an event on the user's connected Google calendar. */
export async function upsertGoogleEvent(
  accessToken: string,
  calendarId: string,
  input: PushEventInput,
  existingGoogleEventId: string | null,
): Promise<string> {
  const body = {
    summary: input.title,
    description: input.description || undefined,
    start: { dateTime: input.startIso },
    end: { dateTime: input.endIso },
    recurrence: input.recurrenceRule ? [`RRULE:FREQ=${input.recurrenceRule.toUpperCase()}`] : undefined,
  };

  const url = existingGoogleEventId
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${existingGoogleEventId}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const res = await fetch(url, {
    method: existingGoogleEventId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new AppError(502, `Google Calendar event push failed: ${await res.text()}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function deleteGoogleEvent(accessToken: string, calendarId: string, googleEventId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } },
  );
  // 410/404 just means it's already gone on Google's side — not an error for us.
  if (!res.ok && res.status !== 410 && res.status !== 404) {
    throw new AppError(502, `Google Calendar event delete failed: ${await res.text()}`);
  }
}
