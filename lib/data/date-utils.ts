/**
 * Utilities for dynamic UTC date/time handling.
 * Never hardcodes current date/time. All ranges calculated relative to dynamic now.
 */

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startIso: string;
  endIso: string;
}

/**
 * Calculates a rolling dynamic UTC date range for the specified number of days (3, 7, 10).
 */
export function getRecentDateRange(days: number): DateRange {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const formatUtcYmd = (d: Date): string => {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatUtcYmd(past),
    endDate: formatUtcYmd(now),
    startIso: past.toISOString(),
    endIso: now.toISOString(),
  };
}

/**
 * Formats a date into Terminal-standard UTC format: "04 SEP 2026 23:41 UTC"
 */
export function formatTerminalUtc(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'UNKNOWN UTC';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'UNKNOWN UTC';

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');

  return `${day} ${month} ${year} ${hours}:${minutes} UTC`;
}

/**
 * Formats date into short display: "04 SEP"
 */
export function formatShortDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'N/A';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'N/A';

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = months[d.getUTCMonth()];
  return `${day} ${month}`;
}

/**
 * Formats relative time elapsed, e.g. "4 MIN AGO", "2H 15M AGO", "JUST NOW"
 */
export function formatRelativeTime(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'N/A';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return 'N/A';

  const now = Date.now();
  const diffMs = Math.max(0, now - d.getTime());
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) return 'JUST NOW';
  if (diffMinutes < 60) return `${diffMinutes} MIN AGO`;
  if (diffHours < 24) return `${diffHours}H ${diffMinutes % 60}M AGO`;
  return `${diffDays}D AGO`;
}

/**
 * Checks if an event is strictly within the allowed recent window (never older than window days).
 */
export function isWithinWindow(eventDateStr: string, windowDays: number): boolean {
  if (!eventDateStr) return false;
  const evtTime = new Date(eventDateStr).getTime();
  if (isNaN(evtTime)) return false;

  const now = Date.now();
  const minTime = now - windowDays * 24 * 60 * 60 * 1000;
  // allow 1 day buffer into the future for timezone reporting variations
  const maxTime = now + 24 * 60 * 60 * 1000;

  return evtTime >= minTime && evtTime <= maxTime;
}

/**
 * Detects if an incident report describes a historical, past-year, ceased, or non-war event.
 */
export function isHistoricalOrStaleConflict(item: {
  eventDate?: string;
  timestamp?: string;
  publishedAt?: string;
  location?: string;
  notes?: string;
}): boolean {
  // 1. Validate date strings against current rolling window
  if (item.eventDate && !isWithinWindow(item.eventDate, 10)) {
    return true;
  }
  if (item.timestamp && !isWithinWindow(item.timestamp, 10)) {
    return true;
  }
  if (item.publishedAt && !isWithinWindow(item.publishedAt, 10)) {
    return true;
  }

  const textToCheck = `${item.location || ''} ${item.notes || ''}`.toLowerCase();

  // 2. Check for explicit historical year references (19xx, 200x, 201x, 2020-2024)
  const pastYearRegex = /\b(19\d\d|200\d|201\d|202[0-4])\b/;
  if (pastYearRegex.test(textToCheck)) {
    return true;
  }

  // 3. Known resolved/historical battlefields or non-military events that commonly hallucinate as live
  const historicalOrCeasedTheaters = [
    /\bbakhmut\b/i,
    /\bartemivsk\b/i,
    /\bavdiivka\b/i,
    /\bavdeevka\b/i,
    /\bmariupol\b/i,
    /\bazovstal\b/i,
    /\bseverodonetsk\b/i,
    /\bsievierodonetsk\b/i,
    /\blysychansk\b/i,
    /\bkakhovka\b/i,
    /\bkrynky\b/i,
    /\bantonivsky bridge\b/i,
    /\brobotyne\b/i,
    /\bbucha\b/i,
    /\birpin\b/i,
    /\bnagorno-karabakh\b/i,
    /\bartsakh\b/i,
    /\bstepanakert\b/i,
    /\btigray\b/i,
    /\bmekelle\b/i,
    /\bmarawi\b/i,
    /\bpattani\b/i,
    /\byala deep south\b/i,
    /\bsingapore strait\b/i,
    /\bmalacca strait\b/i,
    /\bgulf of guinea\b/i,
    /\bbarmm\b/i,
  ];

  for (const theaterRegex of historicalOrCeasedTheaters) {
    if (theaterRegex.test(textToCheck)) {
      return true;
    }
  }

  // 4. Retrospective/archival phrasing
  if (
    textToCheck.includes('anniversary of') ||
    textToCheck.includes('commemorat') ||
    textToCheck.includes('retrospective') ||
    textToCheck.includes('years ago') ||
    textToCheck.includes('historical analysis') ||
    textToCheck.includes('archival report')
  ) {
    return true;
  }

  return false;
}

