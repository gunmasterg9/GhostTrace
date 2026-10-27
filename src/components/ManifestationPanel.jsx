import React, { useRef, useEffect } from 'react';
import { Sparkles, StopCircle, Download, Copy, Check, Radio, BookOpen } from 'lucide-react';
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
  onSelectCitation,
  onExportDossier,
  forensicData,
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

  // Convert "line 42", "Line 12", "[Line 12]", and "[filename:Line 12]" into clickable citation spans
  const renderInteractiveStory = (text) => {
    if (!text) return null;

    const parts = [];
    const citationRegex = /(?:\[|\b)(?:([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+):)?([Ll]ine\s+(\d+))\]?/g;
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      // text before citation
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
          className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded text-[11px] font-fira font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-900 transition-all cursor-pointer shadow-[0_0_8px_rgba(34,211,238,0.3)]"
          title={`Click to inspect ${displayText} in the Evidence Crypt`}
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
        subtitle: 'Source-derived ground truth facts • Deterministic parser output',
        tone: 'emerald',
        icon: '📜',
        body: tiers.evidenceText,
      },
      {
        key: 'AI INTERPRETATION',
        title: '2. Forensic Interpretation',
        subtitle: 'Probabilistic AI deduction • Pattern-based, uncertain analysis',
        tone: 'amber',
        icon: '🔬',
        body: tiers.interpretation || (isGenerating ? 'Synthesizing technical deductions…' : 'No interpretation generated.'),
      },
      {
        key: 'SPECTRAL MANIFESTATION',
        title: '3. Spectral Manifestation',
        subtitle: 'Explicitly creative fiction • Gothic horror storytelling',
        tone: 'purple',
        icon: '🕯️',
        body: tiers.narrative || (isGenerating ? 'Channeling spectral narrative…' : text),
      },
    ];

    return (
      <div className="space-y-4">
        {sections.map((section) => {
          const toneClasses = section.tone === 'emerald'
            ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
            : section.tone === 'amber'
              ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
              : 'border-purple-500/40 bg-purple-950/20 text-purple-200';
          return (
            <section key={section.key} className={`rounded-lg border p-3.5 ${toneClasses}`}>
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-white/10 pb-2 mb-2.5">
                <h4 className="text-xs font-bold tracking-wider uppercase font-cinzel text-white flex items-center gap-1.5">
                  <span>{section.icon}</span> {section.title}
                </h4>
                <span className="text-[10px] font-fira text-slate-400 italic">
                  {section.subtitle}
                </span>
              </div>
              <div className="text-xs sm:text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-fira">
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
      {/* Top Bar: Persona Selection */}
      <div className="p-3 border-b border-cyan-900/40 bg-[#080d14] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
          <h2 className="font-cinzel text-sm font-bold tracking-wider text-slate-100 uppercase">
            The Séance Chamber
          </h2>
          <span className="text-[11px] font-fira text-purple-300 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30">
            {isOllamaOnline ? activeModel : 'Offline Simulation Engine'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isGenerating ? (
            <button
              onClick={onStopSéance}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-fira bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 transition-all cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Banish Spirit (Halt)</span>
            </button>
          ) : (
            <button
              onClick={onStartSéance}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-fira font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black shadow-[0_0_15px_rgba(0,255,136,0.4)] transition-all cursor-pointer animate-pulse"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Begin Séance</span>
            </button>
          )}

          {manifestationText && !isGenerating && (
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-[#0e1620] hover:bg-[#162232] text-slate-300 border border-slate-700 transition-colors"
                title="Copy Séance Reading"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={onExportDossier}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0e1620] hover:bg-[#162232] text-slate-300 border border-slate-700 text-xs font-fira transition-colors cursor-pointer"
                title="Download Evidence & Necronomicon Dossier"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Export Dossier</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Persona Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-2 bg-[#090f17] border-b border-cyan-900/30 text-xs font-fira">
        {GHOST_PERSONAS.map((persona) => {
          const isSelected = selectedPersona.id === persona.id;
          return (
            <button
              key={persona.id}
              onClick={() => onSelectPersona(persona)}
              className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all border ${
                isSelected
                  ? 'bg-[#101b27] border-cyan-500/50 text-white shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                  : 'bg-[#0b1118] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span className="text-base">{persona.symbol}</span>
              <div className="truncate">
                <div className="font-semibold truncate text-[11px]">{persona.name}</div>
                <div className="text-[9px] text-slate-500 truncate">{persona.title}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Manifestation Display Screen */}
      <div className="flex-1 overflow-y-auto p-5 font-fira bg-[#04070a] relative select-text flex flex-col justify-between">
        {manifestationText ? (
          <div className="space-y-4">
            {/* Header info of the manifesting spirit */}
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900/30">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedPersona.symbol}</span>
                <div>
                  <h3 className="text-sm font-bold font-cinzel text-cyan-200">
                    Transmission from {selectedPersona.name}
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
                  >
                    {storySource.type === 'ollama' ? `🟢 Real Ollama (${storySource.model})` : '🟡 Offline Simulation Engine'}
                  </span>
                )}

                {isGenerating && (
                  <div className="flex items-center gap-1.5 text-[11px] font-fira text-emerald-400 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#00ff88]" />
                    <span>{isOllamaOnline ? `Channeling Gemma (${activeModel})...` : 'Channeling Spectral Simulation...'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* The Manifested Gothic Story */}
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
                The Séance Chamber Awaits
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The machine holds memories of {selectedPersona.name.toLowerCase()}. 
                Click <span className="text-emerald-400 font-semibold">"Begin Séance"</span> to evoke 
                the open-weight Gemma model locally. Real code evidence will be cited verbatim.
              </p>
            </div>

            <button
              onClick={onStartSéance}
              className="px-5 py-2 rounded-lg text-xs font-fira font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all cursor-pointer flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>Awaken The Ghost</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Info / Grounding Notice */}
      <div className="p-2.5 bg-[#080d14] border-t border-cyan-900/30 flex items-center justify-between text-[11px] font-fira text-slate-400">
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>Evidence is separated from interpretation and fiction. Click any <strong>[Line XX]</strong> badge to inspect the source.</span>
        </div>
        <span className="text-emerald-400/80 hidden sm:inline">100% Offline • Local Gemma</span>
      </div>
    </div>
  );
}
