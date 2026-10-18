import type { ConflictEvent } from '@/types/conflict';
import { classifyEvent } from '../classification/event-classifier.ts';
import { cleanHtmlAndMarkup } from '../intelligence/event-summarizer.ts';

/**
 * Deduplicates conflict events by their unique ID or composite key.
 * Keeps the most informative/recent record if duplicate IDs are encountered.
 */
export function deduplicateEvents(events: ConflictEvent[]): ConflictEvent[] {
  const seen = new Map<string, ConflictEvent>();

  for (const event of events) {
    if (!event) continue;

    // Defensive sanitization: ensure notes are always 100% stripped of HTML tags
    if (event.notes) {
      event.notes = cleanHtmlAndMarkup(event.notes);
    }

    // Ensure event has primaryCategory and categoryConfidence
    if (!event.primaryCategory) {
      const text = `${event.location} ${event.subEventType || ''} ${event.eventType || ''} ${event.notes || ''} ${event.actor1 || ''} ${event.actor2 || ''}`;
      const cl = classifyEvent(text);
      event.primaryCategory = cl.category;
      event.categoryConfidence = cl.confidence;
      if (cl.category === 'Warfare & Combat') {
        event.isConflict = true;
      }
    }

    // Construct deterministic ID key and normalized content signature
    const idKey = event.id && event.id.trim() !== ''
      ? event.id.trim()
      : `${event.country}_${event.location}_${event.eventDate}_${event.eventType}_${event.actor1 || ''}`.replace(/\s+/g, '_');

    // Content signature: normalized title snippet + country + date
    const normTitle = (event.notes || event.eventType || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50);
    const contentKey = normTitle.length > 10 ? `SIG:${normTitle}_${event.country}_${event.eventDate}` : idKey;

    const existing = seen.get(idKey) || seen.get(contentKey);
    if (!existing) {
      seen.set(idKey, event);
      if (contentKey !== idKey) seen.set(contentKey, event);
    } else {
      // Merge sources and keep the more informative record
      if (event.source && existing.source && !existing.source.includes(event.source)) {
        existing.source = `${existing.source}, ${event.source}`;
      }
      const existingWeight = (existing.notes ? 1 : 0) + (existing.latitude ? 1 : 0) + (existing.fatalities || 0);
      const newWeight = (event.notes ? 1 : 0) + (event.latitude ? 1 : 0) + (event.fatalities || 0);
      const winner = newWeight > existingWeight ? event : existing;
      if (event.source && winner.source && !winner.source.includes(event.source)) {
        winner.source = `${winner.source}, ${event.source}`;
      }
      seen.set(idKey, winner);
      if (contentKey !== idKey) seen.set(contentKey, winner);
    }
  }

  return Array.from(new Set(seen.values())).sort((a, b) => {
    const timeA = new Date(a.timestamp || a.eventDate).getTime();
    const timeB = new Date(b.timestamp || b.eventDate).getTime();
    return timeB - timeA; // Descending (newest first)
  });
}
