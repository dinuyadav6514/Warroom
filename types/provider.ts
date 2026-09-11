import { ConflictEvent, Conflict, FilterState } from './conflict';

export interface DateRangeQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  limit?: number;
}

export interface ProviderResult<T> {
  data: T;
  providerName: string;
  isLive: boolean;
  isCached: boolean;
  timestamp: string;
  error?: string;
}

export interface ConflictDataProvider {
  readonly name: string;
  isConfigured(): boolean;
  getRecentEvents(query: DateRangeQuery, filters?: Partial<FilterState>): Promise<ConflictEvent[]>;
  getEventDetails(id: string): Promise<ConflictEvent | null>;
}
