'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Radio,
  Globe,
  RefreshCw,
  Check,
  Trash2,
  Layers,
  Zap,
} from 'lucide-react';

interface ProviderConfigInfo {
  id: string;
  name: string;
  envVar: string;
  hasCustomKey: boolean;
  isStreaming: boolean;
  requiresKey: boolean;
  streamSource: string;
  docsUrl: string;
  description: string;
  tier: 'EXPANSION_WIRE' | 'OPEN_ZERO_KEY' | 'AI_ENGINE';
}

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
  const [activeTab, setActiveTab] = useState<'PIPELINES' | 'AI_ANALYST'>('PIPELINES');
  const [providers, setProviders] = useState<ProviderConfigInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveMessages, setSaveMessages] = useState<Record<string, { success: boolean; text: string }>>({});

  // Gemini specific
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [isSavingGemini, setIsSavingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<string | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  const loadProviderConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/config/providers');
      if (res.ok) {
        const data = await res.json();
        if (data.providers) {
          setProviders(data.providers);
        }
      }
    } catch (err) {
      console.error('Failed to load provider configs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadProviderConfig();
      const localGemini = localStorage.getItem('warroom_gemini_key') || '';
      setGeminiKeyInput(localGemini);
    }
  }, [isOpen, loadProviderConfig]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveProviderKey = async (envVar: string, remove = false) => {
    const keyVal = remove ? '' : keyInputs[envVar] || '';
    if (!remove && !keyVal.trim()) {
      setSaveMessages((prev) => ({
        ...prev,
        [envVar]: { success: false, text: 'Please paste an API key.' },
      }));
      return;
    }

    setSavingKey(envVar);
    setSaveMessages((prev) => {
      const copy = { ...prev };
      delete copy[envVar];
      return copy;
    });

    try {
      const res = await fetch('/api/config/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envVar, apiKey: keyVal.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update key');
      }

      setSaveMessages((prev) => ({
        ...prev,
        [envVar]: {
          success: true,
          text: remove ? 'Reverted to hardcoded live stream.' : 'Custom API key saved & activated!',
        },
      }));

      if (remove) {
        setKeyInputs((prev) => ({ ...prev, [envVar]: '' }));
      }

      await loadProviderConfig();
      onKeyConfigured?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setSaveMessages((prev) => ({
        ...prev,
        [envVar]: { success: false, text: msg },
      }));
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveGeminiKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!geminiKeyInput.trim()) {
      setGeminiError('Please paste a valid Gemini API key.');
      return;
    }

    setIsSavingGemini(true);
    setGeminiError(null);
    setGeminiStatus(null);

    try {
      const res = await fetch('/api/config/key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to validate API key.');
      }

      localStorage.setItem('warroom_gemini_key', geminiKeyInput.trim());
      await fetch('/api/config/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envVar: 'GEMINI_API_KEY', apiKey: geminiKeyInput.trim() }),
      });

      setGeminiStatus('Gemini API key validated and activated!');
      onKeyConfigured?.();
      await loadProviderConfig();
    } catch (err: unknown) {
      setGeminiError(err instanceof Error ? err.message : 'Failed to save Gemini key');
    } finally {
      setIsSavingGemini(false);
    }
  };

  const openZeroKeyProviders = providers.filter((p) => p.tier === 'OPEN_ZERO_KEY');
  const configurableKeyProviders = providers.filter((p) => p.tier === 'EXPANSION_WIRE');
  const newsPipelines = providers.filter((p) => p.tier !== 'AI_ENGINE');
  const activeCount = newsPipelines.filter((p) => p.isStreaming).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 font-mono select-none cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-[#090d12] border border-border w-full max-w-3xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] cursor-default overflow-hidden rounded-[2px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 py-3 bg-panel-subtle border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-accent-cyan animate-pulse" />
            <span className="text-accent-cyan font-bold text-xs sm:text-sm tracking-wider">
              INTELLIGENCE PIPELINES &amp; API CONNECTORS TERMINAL
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-accent-cyan transition-colors p-1"
            title="Close Setup Terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border/80 bg-black/50 px-3 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('PIPELINES')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'PIPELINES'
                ? 'border-accent-cyan text-accent-cyan bg-cyan-950/30'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.02]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>GLOBAL NEWS &amp; CONFLICT PIPELINES</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 border border-emerald-600 text-accent-green font-bold rounded-[2px]">
              {activeCount}/12 ACTIVE &amp; STREAMING
            </span>
          </button>

          <button
            onClick={() => setActiveTab('AI_ANALYST')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'AI_ANALYST'
                ? 'border-accent-cyan text-accent-cyan bg-cyan-950/30'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.02]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI DEFENSE ANALYST (GEMINI)</span>
            {isConfigured && (
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 border border-emerald-600 text-accent-green rounded-[2px]">
                ACTIVE
              </span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === 'PIPELINES' ? (
            <div className="space-y-4">
              {/* Overview Metric Banner */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/50 to-blue-950/30 border border-emerald-700/60 p-3 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-accent-green font-bold text-xs flex items-center gap-2">
                    <Globe className="w-4 h-4 text-accent-cyan" />
                    <span>ALL 12 PIPELINES ACTIVE // HARDCODED ZERO-KEY STREAMING</span>
                  </div>
                  <p className="text-[11px] text-cyan-200/80 leading-relaxed">
                    All 12 news pipelines stream real-time conflict news automatically out-of-the-box. Entering a custom API key for any source is purely optional and unlocks direct search API endpoints.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2 bg-black/60 border border-emerald-600/70 px-3 py-2 rounded-[2px]">
                  <div className="text-right">
                    <div className="text-[10px] text-text-muted">ACTIVE PIPELINES</div>
                    <div className="text-sm font-bold text-accent-green font-mono">
                      12 / 12 STREAMING
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Always-On Open Data Sources */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-text-muted font-bold tracking-wider">
                  <span>// OPEN REST &amp; KNOWLEDGE GRAPH SOURCES</span>
                  <span className="text-accent-green text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> OPEN PUBLIC APIS
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {openZeroKeyProviders.map((p) => (
                    <div
                      key={p.id}
                      className="bg-panel-subtle border border-emerald-900/50 p-2.5 rounded-[2px] flex flex-col justify-between space-y-1.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-text-primary text-[11.5px] truncate">
                            {p.name}
                          </span>
                          <span className="text-[8.5px] px-1 py-0.2 bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 font-bold rounded-[1px]">
                            LIVE
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                      <a
                        href={p.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9.5px] text-accent-cyan hover:underline inline-flex items-center gap-1 mt-1 pt-1 border-t border-border/40"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* 9 Expansion Wire Streams */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-text-muted font-bold tracking-wider pt-2 border-t border-border/60">
                  <span>// 9 EXPANSION NEWS &amp; CONFLICT WIRE STREAMS</span>
                  <span className="text-accent-cyan text-[10px]">
                    100% STREAMING · CUSTOM KEYS OPTIONAL
                  </span>
                </div>

                <div className="space-y-2.5">
                  {configurableKeyProviders.map((p, idx) => {
                    const hasKey = p.hasCustomKey;
                    const message = saveMessages[p.envVar];
                    const isSaving = savingKey === p.envVar;

                    return (
                      <div
                        key={p.id}
                        className="p-3 border rounded-[2px] bg-panel-subtle border-border/90 hover:border-border-glow/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-text-muted font-mono">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-text-primary text-xs">
                              {p.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasKey ? (
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950/80 text-accent-green border border-emerald-700 font-bold flex items-center gap-1 rounded-[2px]">
                                <CheckCircle2 className="w-3 h-3" /> CUSTOM API KEY ACTIVE
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 bg-cyan-950/60 text-accent-cyan border border-cyan-700 font-bold flex items-center gap-1 rounded-[2px]">
                                <Zap className="w-3 h-3" /> LIVE (HARDCODED STREAM)
                              </span>
                            )}

                            <a
                              href={p.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-accent-cyan hover:underline inline-flex items-center gap-1 px-1.5 py-0.5 bg-black/40 border border-border hover:border-accent-cyan transition-colors rounded-[2px]"
                            >
                              <span>Official Site</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        <div className="text-[10.5px] text-accent-cyan/90 font-mono mb-1">
                          Feed Stream: {p.streamSource}
                        </div>

                        <p className="text-[11px] text-text-secondary mb-2 leading-relaxed">
                          {p.description}
                        </p>

                        {/* Optional Key Input & Action Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="password"
                              placeholder={
                                hasKey
                                  ? '•••••••••••••••••••• (Custom Key Active — paste new key to replace)'
                                  : `Optional: Paste custom ${p.name} API key to upgrade...`
                              }
                              value={keyInputs[p.envVar] || ''}
                              onChange={(e) =>
                                setKeyInputs({ ...keyInputs, [p.envVar]: e.target.value })
                              }
                              className="w-full bg-black/60 border border-border focus:border-accent-cyan px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted outline-none font-mono rounded-[2px]"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleSaveProviderKey(p.envVar, false)}
                              className="px-3 py-1.5 bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/70 text-xs font-bold rounded-[2px] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              {isSaving ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>SAVE CUSTOM KEY</span>
                            </button>

                            {hasKey && (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleSaveProviderKey(p.envVar, true)}
                                className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-severity-critical border border-red-800/80 text-xs rounded-[2px] transition-colors cursor-pointer"
                                title="Remove Custom Key & Revert to Hardcoded Stream"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {message && (
                          <div
                            className={`mt-1.5 text-[10.5px] font-mono ${
                              message.success ? 'text-accent-green' : 'text-severity-critical'
                            }`}
                          >
                            {message.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* AI Defense Analyst (Gemini) Tab */
            <div className="space-y-4">
              {isConfigured ? (
                <div className="bg-emerald-950/40 border border-emerald-800/50 p-3 text-emerald-300 flex items-center gap-2.5 rounded-[2px]">
                  <CheckCircle2 className="w-4 h-4 text-accent-green flex-shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-accent-green">
                      STATUS: AI DEFENSE ANALYST ACTIVE
                    </div>
                    <div className="text-[11px] text-emerald-300/80">
                      Gemini 2.0 Flash is enabled for the interactive terminal SitRep generation, strategic threat evaluations, and actor profiling.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-cyan-950/40 border border-cyan-800/50 p-3 text-cyan-300 space-y-1 rounded-[2px]">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-accent-cyan">
                    <Sparkles className="w-4 h-4 text-accent-cyan" />
                    <span>ENABLE AI DEFENSE ANALYST &amp; SITREP GENERATOR</span>
                  </div>
                  <p className="text-[11px] text-cyan-200/90 leading-relaxed">
                    WarRoom includes an autonomous AI military analyst powered by Google Gemini 2.0. Adding a free key unlocks automated theatre briefing synthesis, tactical doctrine analysis, and incident correlation.
                  </p>
                </div>
              )}

              <div className="bg-panel-subtle p-3 border border-border space-y-1.5 text-[11px] text-text-secondary rounded-[2px]">
                <div className="text-text-primary font-bold">How to obtain your Free Gemini Key:</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Visit{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-cyan hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      aistudio.google.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </li>
                  <li>Click &ldquo;Create API key&rdquo; (Free tier provides 1,500 requests per day).</li>
                  <li>Paste the key into the input field below.</li>
                </ol>
              </div>

              <form onSubmit={handleSaveGeminiKey} className="space-y-3">
                <div>
                  <label className="text-[10px] text-text-muted font-bold block mb-1">
                    GOOGLE GEMINI API KEY (starts with &ldquo;AIzaSy...&rdquo;)
                  </label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="w-full bg-black/60 border border-border focus:border-accent-cyan px-3 py-2 text-xs text-text-primary placeholder:text-text-muted outline-none font-mono rounded-[2px]"
                  />
                </div>

                {geminiError && (
                  <div className="p-2 bg-red-950/40 border border-red-800 text-severity-critical text-[11px] rounded-[2px]">
                    {geminiError}
                  </div>
                )}

                {geminiStatus && (
                  <div className="p-2 bg-emerald-950/40 border border-emerald-800 text-accent-green text-[11px] rounded-[2px]">
                    {geminiStatus}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 border border-border text-text-secondary hover:text-text-primary text-xs rounded-[2px] transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingGemini}
                    className="px-4 py-1.5 bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan border border-accent-cyan text-xs font-bold rounded-[2px] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingGemini ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>VALIDATE &amp; ACTIVATE GEMINI</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-panel-subtle/80 border-t border-border flex items-center justify-between text-[10.5px] text-text-muted shrink-0">
          <span>WarRoom Intelligence Operating System // v0.1.0</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-panel border border-border hover:border-accent-cyan text-text-secondary hover:text-text-primary rounded-[2px] transition-colors cursor-pointer"
          >
            CLOSE TERMINAL [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
