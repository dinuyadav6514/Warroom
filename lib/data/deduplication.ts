import { ConflictEvent } from '@/types/conflict';
import { classifyEvent } from '@/lib/classification/event-classifier';

/**
 * Deduplicates conflict events by their unique ID or composite key.
 * Keeps the most informative/recent record if duplicate IDs are encountered.
 */
export function deduplicateEvents(events: ConflictEvent[]): ConflictEvent[] {
  const seen = new Map<string, ConflictEvent>();

  for (const event of events) {
    if (!event) continue;

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

    // Use provider event ID, or construct deterministic hash key
    const idKey = event.id && event.id.trim() !== ''
      ? event.id.trim()
      : `${event.country}_${event.location}_${event.eventDate}_${event.eventType}_${event.actor1 || ''}`.replace(/\s+/g, '_');

    const existing = seen.get(idKey);
    if (!existing) {
      seen.set(idKey, event);
    } else {
      // If duplicate exists, keep whichever has more data (e.g. notes, coordinates, higher timestamp)
      const existingWeight = (existing.notes ? 1 : 0) + (existing.latitude ? 1 : 0) + (existing.fatalities || 0);
      const newWeight = (event.notes ? 1 : 0) + (event.latitude ? 1 : 0) + (event.fatalities || 0);
      if (newWeight >= existingWeight) {
        seen.set(idKey, event);
      }
    }
  }

  return Array.from(seen.values()).sort((a, b) => {
    const timeA = new Date(a.timestamp || a.eventDate).getTime();
    const timeB = new Date(b.timestamp || b.eventDate).getTime();
    return timeB - timeA; // Descending (newest first)
  });
}
