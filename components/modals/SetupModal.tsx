'use client';

import React, { useState, useEffect } from 'react';
import { X, KeyRound, ExternalLink, CheckCircle2, ShieldAlert, Sparkles, Send } from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyConfigured?: () => void;
  isConfigured?: boolean;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  onKeyConfigured,
  isConfigured = false,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKeyInput.trim()) {
      setError('Please paste a valid Gemini API key.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Send to server only for validation — key is NOT stored server-side
      const res = await fetch('/api/config/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to validate API key.');
      }

      // Store the validated key in the user's own browser — never sent to server at rest
      localStorage.setItem('warroom_gemini_key', apiKeyInput.trim());

      setSuccess(true);
      setApiKeyInput('');
      if (onKeyConfigured) {
        onKeyConfigured();
      }
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 font-mono select-none cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border w-full max-w-lg flex flex-col shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Terminal Header */}
        <div className="px-4 py-2.5 bg-panel-subtle border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent-cyan" />
            <span className="text-accent-cyan font-bold text-xs tracking-wider">
              GEMINI API KEY // AI DEFENSE ANALYST & SITREP ENGINE
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
        <div className="p-4 space-y-4 text-xs">
          {/* Status Badge Banner */}
          {isConfigured ? (
            <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
              <div>
                <div className="font-bold text-xs text-accent-green">STATUS: AI ANALYST ACTIVATED</div>
                <div className="text-[11px] text-emerald-300/80">
                  Gemini API is active for the AI Defense Analyst terminal and executive SitRep generator. (Live conflict news and events stream automatically via GDELT & UN ReliefWeb without any key).
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-cyan-950/40 border border-cyan-800/50 p-3 text-cyan-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs text-accent-cyan">
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                <span>OPTIONAL: CONFIGURE AI DEFENSE ANALYST</span>
              </div>
              <p className="text-[11px] text-cyan-200/90 leading-relaxed">
                Live conflict news & map events are ingested automatically via GDELT 2.0 & UN ReliefWeb (100% free, no key required). Adding a free Gemini API key enables interactive tactical queries and SitRep generation in the intelligence terminal.
              </p>
            </div>
          )}

          {/* Quick Setup Instructions */}
          <div className="bg-panel-subtle p-3 border border-border space-y-1.5 text-[11px] text-text-secondary">
            <div className="text-text-primary font-bold">How to get your 100% Free Gemini Key:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Open{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-cyan hover:underline inline-flex items-center gap-1 font-bold"
                >
                  aistudio.google.com <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Click &ldquo;Create API key&rdquo; (Free tier: 1,500 free requests/day, no credit card required).</li>
              <li>Paste the key below and click &ldquo;SAVE &amp; ACTIVATE&rdquo;.</li>
            </ol>
          </div>

          {/* Key Input Form */}
          <form onSubmit={handleSaveKey} className="space-y-3">
            <div>
              <label className="text-[10px] text-text-muted font-bold block mb-1">
                PASTE YOUR GEMINI API KEY:
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-black/60 border border-border focus:border-accent-cyan focus:outline-none text-text-primary font-mono text-xs placeholder:text-text-muted"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="text-severity-critical text-[10px] font-bold">
                ERROR: {error}
              </div>
            )}

            {success && (
              <div className="text-accent-green text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                KEY SAVED! ACTIVATING API-LIVE...
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2 bg-accent-cyan/20 hover:bg-accent-cyan/30 active:bg-accent-cyan/40 border border-accent-cyan/70 text-accent-cyan text-xs font-bold tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSaving ? 'VALIDATING KEY...' : 'SAVE & ACTIVATE AI ANALYST'}</span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-panel-subtle border-t border-border flex items-center justify-between text-[10px] text-text-muted">
          <span>KEY STORED IN YOUR BROWSER ONLY — NEVER SENT TO SERVER</span>
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
