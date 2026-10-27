import React, { useState, useMemo } from 'react';
import { Skull, AlertTriangle, Clock, ShieldCheck, Flame, Binary, ChevronRight, Terminal, Files } from 'lucide-react';
import { isTerminalHistoryFile, analyzeTerminalHistory } from '../utils/terminalForensics';

export function EvidencePanel({
  rawContent,
  forensics,
  redactions,
  highlightedLine,
  onLineClick,
  citationNotice,
  onDismissNotice,
}) {
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'markers' | 'terminal'
  const [prevHighlightedLine, setPrevHighlightedLine] = useState(highlightedLine);
  const lines = rawContent.split('\n');

  // Detect terminal history format
  const terminalData = useMemo(() => {
    if (isTerminalHistoryFile(forensics.filename, rawContent)) {
      return analyzeTerminalHistory(rawContent, forensics.filename);
    }
    return null;
  }, [rawContent, forensics.filename]);

  // Detect multi-file boundaries from Digital Memory Explorer
  const excavatedSubFiles = useMemo(() => {
    const list = [];
    lines.forEach((line, idx) => {
      if (line.startsWith('===== FILE: ') && line.endsWith(' =====')) {
        const name = line.replace('===== FILE: ', '').replace(' =====', '').trim();
        list.push({ line: idx + 1, name });
      }
    });
    return list;
  }, [lines]);

  if (highlightedLine !== prevHighlightedLine) {
    setPrevHighlightedLine(highlightedLine);
    if (highlightedLine !== null && highlightedLine !== undefined) {
      setActiveTab('code');
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#070c12] border border-cyan-900/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Bar: Forensic Metrics */}
      <div className="p-3.5 border-b border-cyan-900/40 bg-[#0a111a] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-emerald-400" />
          <h2 className="font-cinzel text-sm font-bold tracking-wider text-slate-100 uppercase">
            The Digital Crypt
          </h2>
          <span className="text-[11px] font-fira text-slate-400 px-2 py-0.5 rounded bg-black/40 border border-slate-800">
            {forensics.filename} • {forensics.lineCount} lines
          </span>
        </div>

        {/* Haunting Score Badge */}
        <div className="flex items-center gap-2 font-fira">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 border border-slate-800">
            <Flame className="w-3.5 h-3.5" style={{ color: forensics.riskColor }} />
            <span className="text-xs text-slate-300">Decay Index:</span>
            <span className="text-xs font-bold font-orbitron" style={{ color: forensics.riskColor }}>
              {forensics.hauntingScore}%
            </span>
          </div>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: `${forensics.riskColor}15`,
              color: forensics.riskColor,
              borderColor: `${forensics.riskColor}40`,
            }}
          >
            {forensics.riskLevel}
          </span>
        </div>
      </div>

      {/* Redaction Shield Banner */}
      <div className="px-3.5 py-2 bg-emerald-950/20 border-b border-emerald-900/30 flex items-center justify-between text-xs font-fira text-emerald-300">
        <div className="flex items-center gap-2 flex-wrap">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Redaction Shield: {redactions.redactionCount > 0 
              ? `${redactions.redactionCount} secrets wiped locally` 
              : '0 credentials detected (clean trace)'}
          </span>
          {redactions.redactions?.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {[...new Set(redactions.redactions.map((r) => r.type))].map((type, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-[10px] text-emerald-300 border border-emerald-500/30"
                >
                  ✓ {type}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-emerald-400/70 uppercase tracking-widest hidden sm:inline">
          Client-Side Safe
        </span>
      </div>

      {/* Citation Anomaly / Out-of-Bounds Fallback Alert */}
      {citationNotice && (
        <div className="px-3.5 py-2 bg-amber-950/50 border-b border-amber-500/40 flex items-center justify-between text-xs font-fira text-amber-300 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Spectral Anomaly:</strong> Cited Line {citationNotice.requested} exceeds crypt bounds (1-{citationNotice.maxLines}). Fallback clamped to Line {citationNotice.clamped}.
            </span>
          </div>
          <button
            onClick={onDismissNotice}
            className="text-amber-400 hover:text-amber-200 ml-2 px-1 text-sm font-bold cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Forensic Findings Bar */}
      <div className="p-2.5 bg-[#090f17] border-b border-cyan-900/30 flex flex-wrap items-center justify-between gap-2 text-xs font-fira">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'code' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Syntax
          </button>

          <button
            onClick={() => setActiveTab('markers')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
              activeTab === 'markers' ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Directives ({forensics.markers.length})</span>
          </button>

          {terminalData && (
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'terminal' ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Haunted Terminal</span>
            </button>
          )}

          {forensics.panics.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px]">
              <Skull className="w-3 h-3 text-rose-400" />
              <span>{forensics.panics.length} Panics</span>
            </div>
          )}

          {forensics.timestamps.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px]">
              <Clock className="w-3 h-3 text-purple-400" />
              <span>{forensics.timestamps.length} 3AM Markers</span>
            </div>
          )}
        </div>

        {/* Multi-File Excavation Navigation Dropdown */}
        {excavatedSubFiles.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <Files className="w-3.5 h-3.5 text-cyan-400" />
            <select
              onChange={(e) => {
                const line = parseInt(e.target.value, 10);
                if (line) {
                  setActiveTab('code');
                  onLineClick(line);
                  const el = document.getElementById(`evidence-line-${line}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="bg-[#0b1219] text-cyan-300 border border-cyan-800/50 rounded px-2 py-0.5 text-xs outline-none cursor-pointer"
            >
              <option value="">Jump to File ({excavatedSubFiles.length})...</option>
              {excavatedSubFiles.map((sf, idx) => (
                <option key={idx} value={sf.line}>
                  {sf.name} (Line {sf.line})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto font-fira text-xs p-3 select-text bg-[#05080c]">
        {activeTab === 'code' ? (
          <div className="divide-y divide-slate-900/60 font-fira">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = highlightedLine === lineNum;
              
              const lineMarker = forensics.markers.find((m) => m.line === lineNum);
              const linePanic = forensics.panics.find((p) => p.line === lineNum);
              const lineTime = forensics.timestamps.find((t) => t.line === lineNum);

              return (
                <div
                  key={idx}
                  id={`evidence-line-${lineNum}`}
                  onClick={() => onLineClick(lineNum)}
                  className={`flex items-start gap-3 py-0.5 px-2 hover:bg-[#121c27] transition-colors cursor-pointer group ${
                    isHighlighted ? 'bg-cyan-950/80 border-l-2 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : ''
                  }`}
                >
                  {/* Line Number */}
                  <span className={`w-8 shrink-0 text-right select-none ${isHighlighted ? 'text-cyan-300 font-bold' : 'text-slate-600 group-hover:text-slate-400'}`}>
                    {lineNum}
                  </span>

                  {/* Code Line Text */}
                  <div className="flex-1 overflow-x-auto whitespace-pre">
                    <span className={isHighlighted ? 'text-cyan-100' : 'text-slate-300'}>
                      {line || ' '}
                    </span>

                    {/* Creepy Inline Badges */}
                    {lineMarker && (
                      <span className="ml-2 evidence-tag evidence-tag-todo">
                        ⚠ {lineMarker.type}
                      </span>
                    )}
                    {linePanic && (
                      <span className="ml-2 evidence-tag evidence-tag-panic">
                        💀 {linePanic.type}
                      </span>
                    )}
                    {lineTime && (
                      <span className="ml-2 evidence-tag evidence-tag-time">
                        ⏳ {lineTime.time}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'markers' ? (
          /* Forensic Markers Breakdown List */
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Abandoned Directives & Promises
              </h3>
              {forensics.markers.length === 0 ? (
                <p className="text-slate-500 italic">No TODO or FIXME comments found in this artifact.</p>
              ) : (
                <div className="space-y-2">
                  {forensics.markers.map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTab('code');
                        onLineClick(m.line);
                      }}
                      className="p-2.5 rounded-lg bg-[#0e1622] border border-amber-900/30 hover:border-amber-400/50 cursor-pointer transition-all flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="evidence-tag evidence-tag-todo font-bold">{m.type}</span>
                          <span className="text-slate-400 text-[11px]">Line {m.line}</span>
                        </div>
                        <p className="text-slate-200 text-xs">{m.text}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 self-center" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {forensics.panics.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5" /> Fatal Exceptions & Kernel Panics
                </h3>
                <div className="space-y-2">
                  {forensics.panics.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTab('code');
                        onLineClick(p.line);
                      }}
                      className="p-2.5 rounded-lg bg-[#140c11] border border-rose-900/40 hover:border-rose-400/50 cursor-pointer transition-all flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="evidence-tag evidence-tag-panic font-bold">{p.type}</span>
                          <span className="text-rose-300 text-[11px]">Line {p.line}</span>
                        </div>
                        <p className="text-slate-300 text-xs">{p.snippet}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 self-center" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Haunted Terminal Static Forensics Screen */
          <div className="space-y-4">
            {/* Safe Execution Guarantee Banner */}
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Inert Text Guarantee:</strong> Terminal history is analyzed exclusively via static text parsing. GhostTrace <em>never</em> executes imported commands or spawns shell processes.
              </span>
            </div>

            {/* Terminal Metrics Tiles */}
            {terminalData && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-fira">
                  <div className="p-2.5 rounded-lg bg-[#0e1622] border border-cyan-900/40">
                    <div className="text-[10px] text-slate-400 uppercase">Total Commands</div>
                    <div className="text-base font-bold text-cyan-300 font-orbitron">{terminalData.totalCommands}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e1622] border border-cyan-900/40">
                    <div className="text-[10px] text-slate-400 uppercase">Unique Commands</div>
                    <div className="text-base font-bold text-slate-200 font-orbitron">{terminalData.uniqueCommands}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#140c11] border border-rose-900/40">
                    <div className="text-[10px] text-rose-400 uppercase">Dangerous Ops</div>
                    <div className="text-base font-bold text-rose-300 font-orbitron">{terminalData.dangerousCommands.length}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#110e1a] border border-purple-900/40">
                    <div className="text-[10px] text-purple-400 uppercase">Repeated Loops</div>
                    <div className="text-base font-bold text-purple-300 font-orbitron">{terminalData.repeatedLoops.length}</div>
                  </div>
                </div>

                {/* Destructive / Dangerous Commands */}
                {terminalData.dangerousCommands.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Skull className="w-3.5 h-3.5" /> High-Risk / Destructive Commands (Static Inspection)
                    </h3>
                    <div className="space-y-2">
                      {terminalData.dangerousCommands.map((dc, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveTab('code');
                            onLineClick(dc.line);
                          }}
                          className="p-2.5 rounded-lg bg-[#140c11] border border-rose-900/50 hover:border-rose-400/50 cursor-pointer transition-all flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                {dc.label}
                              </span>
                              <span className="text-rose-400 text-[11px]">Line {dc.line}</span>
                            </div>
                            <code className="text-rose-200 text-xs font-mono">{dc.command}</code>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 self-center" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Repeated Frantic Loops */}
                {terminalData.repeatedLoops.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Frantic Command Loops (Repeated ≥3x)
                    </h3>
                    <div className="space-y-2">
                      {terminalData.repeatedLoops.map((loop, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-[#0e1622] border border-amber-900/30 flex items-center justify-between text-xs"
                        >
                          <code className="text-amber-200 font-mono truncate mr-2">{loop.command}</code>
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold text-[10px] shrink-0">
                            {loop.count}× repeated
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
