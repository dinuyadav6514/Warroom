'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldAlert, BookOpen, Database } from 'lucide-react';

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-sans select-none cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-panel-subtle/80 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-cyan" />
            <span className="text-text-primary font-semibold text-xs tracking-wide">
              Data Sources &amp; Attribution
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-accent-cyan transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Primary Source Attribution */}
          <div className="bg-panel-subtle p-3 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-accent-cyan font-bold text-sm">CONFLICT INTELLIGENCE PIPELINE</span>
              <span className="text-[10px] bg-sky-950/60 text-sky-400 border border-sky-700/60 px-2 py-0.5 font-bold">
                LIVE · NO API KEY REQUIRED
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Conflict data is discovered and ingested automatically via two open, key-free pipelines:{' '}
              <strong className="text-text-primary">GDELT 2.0</strong> (global media knowledge graph) and{' '}
              <strong className="text-text-primary">UN OCHA ReliefWeb</strong> (humanitarian reports). No Gemini or AI model is involved in event discovery — events are fetched directly from these public APIs.
            </p>
          </div>

          {/* GDELT 2.0 */}
          <div className="bg-panel-subtle p-3 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-accent-cyan font-bold text-sm">GDELT 2.0</span>
              <span className="text-[10px] bg-sky-950/60 text-sky-400 border border-sky-700/60 px-2 py-0.5 font-bold">LIVE NEWS</span>
            </div>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              <strong className="text-text-primary">GDELT Project Global Media Knowledge Graph</strong> — monitors print, broadcast, and online news worldwide in real time. Provides conflict articles, geolocation, and tone analysis sourced from thousands of media outlets.
            </p>
            <a
              href="https://www.gdeltproject.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-cyan hover:underline flex items-center gap-1.5 text-[11px]"
            >
              <span>gdeltproject.org</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* UN ReliefWeb */}
          <div className="bg-panel-subtle p-3 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-accent-cyan font-bold text-sm">UN OCHA ReliefWeb</span>
              <span className="text-[10px] bg-sky-950/60 text-sky-400 border border-sky-700/60 px-2 py-0.5 font-bold">HUMANITARIAN</span>
            </div>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              <strong className="text-text-primary">UN Office for the Coordination of Humanitarian Affairs ReliefWeb</strong> — authoritative source for verified humanitarian situation reports, crisis updates, and conflict assessments from UN agencies and NGOs.
            </p>
            <a
              href="https://reliefweb.int"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-cyan hover:underline flex items-center gap-1.5 text-[11px]"
            >
              <span>reliefweb.int</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* 10 Connected News & Conflict Intelligence Providers */}
          <div className="bg-panel-subtle p-3 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-accent-cyan font-bold text-sm">CONNECTED NEWS &amp; CONFLICT PIPELINES</span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 font-bold">
                12 ACTIVE PROVIDERS
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">1. FreeNewsApi</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">freenewsapi.io</span>
                </div>
                <p className="text-text-secondary text-[10px]">Real-time global news API querying conflict and military keywords.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">2. Currents News API</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">currentsapi.services</span>
                </div>
                <p className="text-text-secondary text-[10px]">Live news dispatches with keyword search across international outlets.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">3. NewsAPI.org</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">newsapi.org</span>
                </div>
                <p className="text-text-secondary text-[10px]">Over 150,000 news sources and blogs worldwide queried in real time.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">4. GNews API</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">gnews.io</span>
                </div>
                <p className="text-text-secondary text-[10px]">Global news search API indexing articles from 60,000+ publishers.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">5. NewsData.io</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">newsdata.io</span>
                </div>
                <p className="text-text-secondary text-[10px]">Breaking news API covering 150+ countries and multiple languages.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">6. World News API</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">worldnewsapi.com</span>
                </div>
                <p className="text-text-secondary text-[10px]">Geocoded news aggregator providing global sentiment and event data.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">7. NewsAPI.ai</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">eventregistry.org</span>
                </div>
                <p className="text-text-secondary text-[10px]">Event Registry AI intelligence engine tracking global events.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">8. Mediastack</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">mediastack.com</span>
                </div>
                <p className="text-text-secondary text-[10px]">REST news API delivering real-time worldwide news coverage.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">9. The Guardian</span>
                  <span className="text-[9px] text-accent-cyan border border-accent-cyan/40 px-1">theguardian.com</span>
                </div>
                <p className="text-text-secondary text-[10px]">The Guardian Open Platform API for verified investigative reporting.</p>
              </div>

              <div className="border border-border/70 p-2 bg-black/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary">10. Hacker News API</span>
                  <span className="text-[9px] text-emerald-400 border border-emerald-500/40 px-1">100% FREE / NO KEY</span>
                </div>
                <p className="text-text-secondary text-[10px]">Algolia HN API tracking defense tech, cyber warfare, and geopolitical posts.</p>
              </div>
            </div>
          </div>

          {/* Wire Feed Fallbacks */}
          <div className="bg-panel-subtle p-3 border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-accent-cyan font-bold text-sm">RSS Wire Fallbacks</span>
              <span className="text-[10px] bg-amber-950/60 text-amber-400 border border-amber-700/60 px-2 py-0.5 font-bold">FALLBACK ONLY</span>
            </div>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              If the ReliefWeb API is unavailable, the pipeline falls back to these RSS feeds for conflict reporting:
            </p>
            <ul className="space-y-1 text-text-secondary text-[10px]">
              <li className="flex items-center gap-1.5"><span className="text-accent-cyan">•</span><span>BBC World News</span></li>
              <li className="flex items-center gap-1.5"><span className="text-accent-cyan">•</span><span>Al Jazeera World</span></li>
              <li className="flex items-center gap-1.5"><span className="text-accent-cyan">•</span><span>The New York Times — World</span></li>
              <li className="flex items-center gap-1.5"><span className="text-accent-cyan">•</span><span>Sky News — World</span></li>
            </ul>
          </div>

          {/* Data Freshness & Constraints */}
          <div className="bg-panel-subtle p-3 border border-border space-y-2">
            <div className="text-[10px] text-text-muted">// TEMPORAL WINDOW ENFORCEMENT</div>
            <ul className="space-y-1 text-text-secondary text-[11px]">
              <li className="flex items-start gap-1.5">
                <span className="text-accent-cyan">&bull;</span>
                <span>The operational terminal strictly enforces a rolling recent-data window (3D, 7D, or 10D).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-accent-cyan">&bull;</span>
                <span>Historical events older than 10 days are excluded from the main active workspace.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-accent-cyan">&bull;</span>
                <span>Current dates and time deltas are calculated dynamically in UTC relative to runtime.</span>
              </li>
            </ul>
          </div>

          {/* Critical Analytical Disclaimers */}
          <div className="bg-panel-subtle p-3 border border-severity-high/40 space-y-2">
            <div className="text-severity-high font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>DATA LIMITATIONS & ANALYTICAL BOUNDARIES</span>
            </div>
            <ul className="space-y-1 text-text-secondary text-[10px] leading-relaxed">
              <li>&bull; Reporting delays: Geopolitical incident verification can involve lags of hours to several days depending on local communications and conflict theater severity.</li>
              <li>&bull; Non-predictive: The Escalation Index measures observed historical and 24h event velocity; it does NOT make predictive declarations of future military actions.</li>
              <li>&bull; AI synthesis: Summaries generated by AI models are informational aids constrained strictly to retrieved evidence and do not constitute classified intelligence assessments.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-panel-subtle border-t border-border flex items-center justify-between text-[10px] text-text-muted">
          <span>WARROOM v0.1 // GLOBAL CONFLICT INTELLIGENCE</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-panel hover:bg-panel-hover border border-border text-text-primary"
          >
            CLOSE [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
