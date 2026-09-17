import { createDAVClient } from 'tsdav';
import { sync as icalSync, VEvent } from 'node-ical';
import { AppError } from './errors';

/**
 * Apple/iCloud Calendar (CalDAV) helpers. Genuinely different from Google/
 * Outlook: no OAuth — auth is an Apple ID + an app-specific password
 * (Basic auth), and there's no per-call access token to refresh, so this
 * file has no `getValidAccessToken` equivalent. `tsdav` handles iCloud's
 * account-discovery chain (`.well-known/caldav` → the account's actual
 * `pXX-caldav.icloud.com` partition, principal, calendar-home-set) via
 * `createDAVClient`, so this file never PROPFINDs that by hand.
 *
 * Sync strategy: a bounded full refetch (matching Google/Outlook's 90-day-
 * past window) rather than CalDAV's `sync-collection` REPORT — iCloud's
 * ctag/sync-token support is known to be inconsistent in practice, so a
 * bounded full diff-by-etag is the more robust choice for a first
 * implementation. True incremental sync is a possible later optimization,
 * not required for correctness.
 */

async function getClient(appleId: string, appSpecificPassword: string) {
  try {
    return await createDAVClient({
      serverUrl: 'https://caldav.icloud.com',
      credentials: { username: appleId, password: appSpecificPassword },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });
  } catch (error) {
    throw new AppError(401, `Apple Calendar connection failed: ${(error as Error).message}`);
  }
}

export interface AppleCalendarInfo {
  calendarUrl: string;
}

/** Validates the Apple ID + app-specific password and resolves the primary writable calendar. */
export async function discoverPrimaryCalendar(appleId: string, appSpecificPassword: string): Promise<AppleCalendarInfo> {
  const client = await getClient(appleId, appSpecificPassword);
  const calendars = await client.fetchCalendars();
  const writable = calendars.find((c) => {
    const components = (c as unknown as { components?: string[] }).components;
    return !components || components.includes('VEVENT');
  }) || calendars[0];
  if (!writable) throw new AppError(502, 'No Apple calendar found for this account');
  return { calendarUrl: writable.url };
}

export interface AppleCalendarObject {
  href: string;
  etag: string | null;
  uid: string;
  title: string;
  description: string | null;
  startIso: string;
  endIso: string;
  recurrenceFreq: string | null; // raw ICS FREQ value, e.g. 'DAILY'
}

export interface AppleEventsPage {
  objects: AppleCalendarObject[];
}

/** Bounded full fetch of the connected calendar's events (see file header for why not incremental). */
export async function listAppleEvents(
  appleId: string,
  appSpecificPassword: string,
  calendarUrl: string,
): Promise<AppleEventsPage> {
  const client = await getClient(appleId, appSpecificPassword);
  const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const rawObjects = await client.fetchCalendarObjects({
    calendar: { url: calendarUrl } as never,
    timeRange: { start, end },
  });

  const objects: AppleCalendarObject[] = [];
  for (const obj of rawObjects) {
    if (!obj.data) continue;
    let parsed;
    try {
      parsed = icalSync.parseICS(String(obj.data));
    } catch {
      continue; // malformed object, skip
    }
    const vevent = Object.values(parsed).find(
      (c): c is VEvent => !!c && c.type === 'VEVENT',
    );
    if (!vevent || !vevent.start) continue;

    // Same approach as the Google sync path — read FREQ off the raw ICS
    // text rather than trusting node-ical's parsed rrule wrapper shape.
    const recurrenceFreq = String(obj.data).match(/FREQ=([A-Z]+)/)?.[1] || null;

    objects.push({
      href: obj.url,
      etag: obj.etag || null,
      uid: vevent.uid,
      title: typeof vevent.summary === 'string' ? vevent.summary : 'Untitled event',
      description: typeof vevent.description === 'string' ? vevent.description : null,
      startIso: new Date(vevent.start).toISOString(),
      endIso: new Date(vevent.end || vevent.start).toISOString(),
      recurrenceFreq,
    });
  }

  return { objects };
}

export interface PushEventInput {
  uid: string; // stable iCalendar UID, reused across updates — use the local CalendarEvent's own id
  title: string;
  description: string | null;
  startIso: string;
  endIso: string;
  recurrenceRule: string | null; // 'daily' | 'weekly' | 'monthly'
}

function toIcsDateTime(iso: string): string {
  return iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function buildVEvent(input: PushEventInput): string {
  const freqMap: Record<string, string> = { daily: 'DAILY', weekly: 'WEEKLY', monthly: 'MONTHLY' };
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rootaroo//Calendar Sync//EN',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${toIcsDateTime(new Date().toISOString())}`,
    `DTSTART:${toIcsDateTime(input.startIso)}`,
    `DTEND:${toIcsDateTime(input.endIso)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
  ];
  if (input.description) lines.push(`DESCRIPTION:${escapeIcsText(input.description)}`);
  if (input.recurrenceRule) lines.push(`RRULE:FREQ=${freqMap[input.recurrenceRule] || 'DAILY'}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

/** Create or update an event on the user's connected Apple calendar. */
export async function upsertAppleEvent(
  appleId: string,
  appSpecificPassword: string,
  calendarUrl: string,
  input: PushEventInput,
  existing: { href: string; etag: string | null } | null,
): Promise<{ href: string; etag: string | null }> {
  const client = await getClient(appleId, appSpecificPassword);
  const iCalString = buildVEvent(input);

  if (existing) {
    const res = await client.updateCalendarObject({
      calendarObject: { url: existing.href, data: iCalString, etag: existing.etag || undefined } as never,
    });
    if (!res.ok) throw new AppError(502, `Apple Calendar event push failed: ${await res.text()}`);
    return { href: existing.href, etag: res.headers.get('etag') };
  }

  const filename = `${input.uid}.ics`;
  const res = await client.createCalendarObject({
    calendar: { url: calendarUrl } as never,
    iCalString,
    filename,
  });
  if (!res.ok) throw new AppError(502, `Apple Calendar event push failed: ${await res.text()}`);
  const href = `${calendarUrl.replace(/\/$/, '')}/${filename}`;
  return { href, etag: res.headers.get('etag') };
}

export async function deleteAppleEvent(
  appleId: string,
  appSpecificPassword: string,
  href: string,
  etag: string | null,
): Promise<void> {
  const client = await getClient(appleId, appSpecificPassword);
  const res = await client.deleteCalendarObject({
    calendarObject: { url: href, etag: etag || undefined } as never,
  });
  // 404 just means it's already gone on Apple's side — not an error for us.
  if (!res.ok && res.status !== 404) {
    throw new AppError(502, `Apple Calendar event delete failed: ${await res.text()}`);
  }
}
