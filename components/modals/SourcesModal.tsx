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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-mono select-none cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-2.5 bg-panel-subtle border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent-cyan" />
            <span className="text-accent-cyan font-bold text-xs tracking-wider">
              DATA SOURCES & ATTRIBUTION SPECIFICATION
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
              <span className="text-accent-cyan font-bold text-sm">CONFLICT INTELLIGENCE ENGINE</span>
              <span className="text-[10px] bg-emerald-950/60 text-accent-green border border-emerald-700/60 px-2 py-0.5 font-bold">
                GEMINI + GOOGLE SEARCH GROUNDED
              </span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              <strong className="text-text-primary">Gemini 1.5/2.0 API with Google Search Grounding</strong> operates as the automated real-time conflict discovery and geocoding engine. It actively searches verified international news publications (Reuters, AP News, BBC, Al Jazeera, etc.) for armed conflict, military operations, and political violence, automatically geocoding coordinates and casualty reports.
            </p>
            <div className="pt-1">
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-cyan hover:underline flex items-center gap-1.5 text-[11px]"
              >
                <span>GOOGLE AI STUDIO DEVELOPER PORTAL (aistudio.google.com)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Secondary & Architecture */}
          <div className="bg-panel-subtle p-3 border border-border space-y-1.5">
            <div className="text-[10px] text-text-muted">// SECONDARY PROVIDER EXTENSIONS</div>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              The WARROOM data ingestion layer is decoupled through the <code className="text-accent-cyan">ConflictDataProvider</code> abstraction, prepared for GDELT, wire services (Reuters/BBC), UN OCHA reports, and verified government releases.
            </p>
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
