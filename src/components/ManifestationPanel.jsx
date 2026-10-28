import React, { useRef, useEffect } from 'react';
import {
  Sparkles,
  StopCircle,
  Download,
  Copy,
  Check,
  Radio,
  BookOpen,
  Columns,
  Maximize2,
  AlertTriangle,
  RotateCcw,
  X,
} from 'lucide-react';
import { GHOST_PERSONAS } from '../data/personas';
import { parseManifestationTiers } from '../utils/manifestationParser';

export function ManifestationPanel({
  selectedPersona,
  onSelectPersona,
  onStartSéance,
  onStopSéance,
  isGenerating,
  manifestationText,
  activeModel,
  isOllamaOnline,
  storySource,
  inferenceError,
  onRetryInvestigation,
  onDismissError,
  onSelectCitation,
  onExportDossier,
  forensicData,
  fontSize = 'normal',
  layoutMode = 'split',
  onToggleLayout,
}) {
  const terminalEndRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isGenerating && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [manifestationText, isGenerating]);

  const handleCopy = () => {
    if (!manifestationText) return;
    navigator.clipboard.writeText(manifestationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fontClasses = {
    compact: 'text-xs',
    normal: 'text-sm',
    large: 'text-base',
  }[fontSize] || 'text-sm';

  // Convert "line 42", "Line 12", "[Line 12]", and "[filename:Line 12]" into clickable citation buttons
  const renderInteractiveStory = (text) => {
    if (!text) return null;

    const parts = [];
    const citationRegex = /(?:\[|\b)(?:([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+):)?([Ll]ine\s+(\d+))\]?/g;
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const filePrefix = match[1];
      const fullMatch = match[2];
      const lineNum = parseInt(match[3], 10);
      const displayText = filePrefix ? `${filePrefix}:${fullMatch}` : fullMatch;

      parts.push(
        <button
          key={`cite-${match.index}`}
          onClick={() => onSelectCitation(lineNum, filePrefix)}
          className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[11px] font-fira font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-900 transition-all cursor-pointer shadow-[0_0_8px_rgba(34,211,238,0.3)] focus-visible:ring-2 focus-visible:ring-cyan-400"
          title={`Click to inspect ${displayText} in the Evidence Viewer`}
        >
          📍 {displayText}
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const renderNarrative = (text) => {
    if (!text) return null;
    const tiers = parseManifestationTiers(text, forensicData);

    const sections = [
      {
        key: 'VERIFIED EVIDENCE',
        title: '1. Verified Evidence',
        tierLabel: 'Ground Truth Facts',
        subtitle: 'Deterministic parser output • Guaranteed 0 AI hallucinations',
        tone: 'emerald',
        icon: '📜',
        body: tiers.evidenceText,
        notice: 'Integrity Guarantee: Exact facts extracted directly from the local file content.',
      },
      {
        key: 'AI INTERPRETATION',
        title: '2. Forensic Interpretation',
        tierLabel: 'Probabilistic AI Hypothesis',
        subtitle: 'Pattern deduction by local model • Plausible technical hypotheses (not legal proof)',
        tone: 'cyan',
        icon: '🔬',
        body: tiers.interpretation || (isGenerating ? 'Synthesizing technical deductions…' : 'No interpretation generated.'),
        notice: 'Epistemic Notice: AI-generated hypotheses regarding race conditions, memory leaks, and error paths.',
      },
      {
        key: 'SPECTRAL MANIFESTATION',
        title: '3. Fictional Narrative',
        tierLabel: 'Creative Fiction',
        subtitle: 'Explicitly fictional gothic storytelling • Gothic roleplay entertainment',
        tone: 'purple',
        icon: '🕯️',
        body: tiers.narrative || (isGenerating ? 'Channeling spectral narrative…' : text),
        notice: 'Fiction Notice: Creative narrative channeled through the persona. Not real-world facts.',
      },
    ];

    return (
      <div className="space-y-4">
        {sections.map((section) => {
          const toneClasses =
            section.tone === 'emerald'
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
              : section.tone === 'cyan'
              ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200'
              : 'border-purple-500/40 bg-purple-950/20 text-purple-200';

          const badgeClasses =
            section.tone === 'emerald'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : section.tone === 'cyan'
              ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
              : 'bg-purple-950/80 border-purple-500/40 text-purple-300';

          return (
            <section key={section.key} className={`rounded-xl border p-4 shadow-lg ${toneClasses}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{section.icon}</span>
                  <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase font-cinzel text-white">
                    {section.title}
                  </h4>
                  <span className={`text-[10px] font-fira px-2 py-0.5 rounded border uppercase font-semibold ${badgeClasses}`}>
                    {section.tierLabel}
                  </span>
                </div>
                <span className="text-[11px] font-fira text-slate-400 italic">
                  {section.subtitle}
                </span>
              </div>

              <div className="text-[11px] font-fira text-slate-400 mb-2 bg-black/30 px-2.5 py-1 rounded border border-white/5">
                ℹ️ {section.notice}
              </div>

              <div className={`leading-relaxed text-slate-200 whitespace-pre-wrap font-fira ${fontClasses}`}>
                {renderInteractiveStory(section.body)}
              </div>
            </section>
          );
        })}
        {isGenerating && <span className="terminal-cursor" />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#060a0f] border border-cyan-900/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Bar: Action Controls & Status */}
      <div className="p-3 border-b border-cyan-900/40 bg-[#080d14] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
          <h2 className="font-cinzel text-xs sm:text-sm font-bold tracking-wider text-slate-100 uppercase">
            Investigation Results
          </h2>
          <span className="text-[11px] font-fira text-purple-300 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30">
            {storySource
              ? storySource.type === 'ollama'
                ? `🟢 Ollama: ${storySource.model}`
                : '🟡 Offline Simulation Engine (Fallback)'
              : isOllamaOnline
              ? `Ready: ${activeModel}`
              : 'Offline Simulation Engine'}
          </span>
        </div>

        {/* Action Buttons & Layout Toggle */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isGenerating ? (
            <button
              onClick={onStopSéance}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-fira font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Stop Investigation</span>
            </button>
          ) : (
            <button
              onClick={onStartSéance}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-fira font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Start AI Investigation</span>
            </button>
          )}

          {manifestationText && !isGenerating && (
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-[#0e1620] hover:bg-[#162232] text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                title="Copy full reading to clipboard"
                aria-label="Copy report to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={onExportDossier}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e1622] hover:bg-[#162232] text-cyan-300 border border-cyan-800/50 text-xs font-fira transition-colors cursor-pointer"
                title="Download 3-tier Markdown Autopsy Dossier"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Export Report</span>
              </button>
            </>
          )}

          {/* Layout Toggle */}
          {onToggleLayout && (
            <button
              onClick={onToggleLayout}
              className="p-1.5 rounded-md bg-[#0e1622] hover:bg-[#152233] border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={layoutMode === 'results-only' ? 'Restore side-by-side split view' : 'Maximize investigation results panel'}
              aria-label="Toggle Panel Layout"
            >
              {layoutMode === 'results-only' ? (
                <Columns className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Persona Tabs with Plain English titles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-2 bg-[#090f17] border-b border-cyan-900/30 text-xs font-fira">
        {GHOST_PERSONAS.map((persona) => {
          const isSelected = selectedPersona.id === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => onSelectPersona(persona)}
              className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-[#101b27] border-cyan-500/50 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'bg-[#0b1118] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="text-base shrink-0">{persona.symbol}</span>
              <div className="truncate">
                <div className="font-semibold truncate text-[11px]">{persona.name}</div>
                <div className="text-[9px] text-slate-500 truncate">{persona.title}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress Bar (Visible while generating) */}
      {isGenerating && (
        <div className="bg-[#09111b] border-b border-emerald-500/30 p-2.5 flex items-center justify-between text-xs font-fira text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>
              {storySource?.type === 'simulation' || (!isOllamaOnline && !storySource)
                ? 'Synthesizing forensic autopsy via offline simulation engine…'
                : `Channeling Gemma (${activeModel}) via Ollama…`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Streaming tokens locally</span>
        </div>
      )}

      {/* Manifestation Display Screen */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-fira bg-[#04070a] relative select-text flex flex-col justify-between">
        {inferenceError && (
          <div className="mb-4 p-3 rounded-lg border border-amber-500/50 bg-amber-950/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold font-fira text-amber-300">
                  Ollama Inference Notice: Switched to Local Simulation Fallback
                </div>
                <div className="text-[11px] font-fira text-amber-400/90 mt-0.5">
                  {inferenceError}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onRetryInvestigation}
                disabled={isGenerating}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-fira font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Ollama</span>
              </button>
              {onDismissError && (
                <button
                  onClick={onDismissError}
                  className="p-1 rounded text-amber-400 hover:text-amber-200 hover:bg-amber-900/40 transition-colors cursor-pointer"
                  title="Dismiss notification"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {manifestationText ? (
          <div className="space-y-4">
            {/* Header info of the manifesting spirit */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900/30">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedPersona.symbol}</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold font-cinzel text-cyan-200">
                    Dossier by {selectedPersona.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">{selectedPersona.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {storySource && (
                  <span
                    className={`text-[10px] font-fira px-2 py-0.5 rounded border hidden sm:inline-block ${
                      storySource.type === 'ollama'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    }`}
                    title={
                      storySource.type === 'ollama'
                        ? `Live inference via Ollama (${storySource.model})`
                        : 'Grounded offline simulation fallback (not genuine model output)'
                    }
                  >
                    {storySource.type === 'ollama'
                      ? `🟢 Ollama (${storySource.model})`
                      : '🟡 Offline Simulation Engine (Fallback)'}
                  </span>
                )}
              </div>
            </div>

            {/* The 3 Tiers */}
            <div className="selection:bg-cyan-500/30 selection:text-cyan-200">
              {renderNarrative(manifestationText)}
            </div>

            <div ref={terminalEndRef} />
          </div>
        ) : (
          /* Empty / Waiting State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
            <div className="w-16 h-16 rounded-full bg-purple-950/30 border border-purple-500/30 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(192,132,252,0.2)] animate-ghost-pulse">
              {selectedPersona.symbol}
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="font-cinzel text-base font-bold text-slate-200">
                AI Investigation Ready
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-fira">
                Selected persona: <strong className="text-slate-200">{selectedPersona.name}</strong>.
                Click <span className="text-emerald-400 font-semibold">"Start AI Investigation"</span> to
                generate a 3-tier forensic autopsy with verifiable source code citations.
              </p>
            </div>

            <button
              onClick={onStartSéance}
              className="px-5 py-2.5 rounded-lg text-xs font-fira font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all cursor-pointer flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>Start AI Investigation</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info / Epistemic Grounding Notice */}
      <div className="p-2.5 bg-[#080d14] border-t border-cyan-900/30 flex items-center justify-between text-[11px] font-fira text-slate-400">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            Verified Evidence is separated from AI Interpretation and Fiction. Click any <strong>[Line XX]</strong> badge to jump to source.
          </span>
        </div>
        <span className="text-emerald-400/80 hidden md:inline shrink-0">100% Offline • Local Gemma</span>
      </div>
    </div>
  );
}
