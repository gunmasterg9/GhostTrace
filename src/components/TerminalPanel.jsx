import React from 'react';
import {
  Terminal,
  ShieldCheck,
  Skull,
  Clock,
  FileCode,
  Upload,
  ChevronRight,
} from 'lucide-react';
import { Tooltip } from './Tooltip';

export function TerminalPanel({
  terminalData,
  rawContent,
  onImportTerminal,
  onLoadSampleTerminal,
  onLineClick,
  onSelectNav,
}) {
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* Top Banner: Guaranteed Inert Text */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-[#0a141e] border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-fira text-emerald-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-sm font-cinzel">
              <span>Inert Text Forensics Guarantee</span>
              <Tooltip text="Terminal histories and console dumps are read purely as inert strings. No child processes or shells are ever spawned." />
            </div>
            <p className="text-slate-300 text-xs">
              GhostTrace performs read-only static text analysis. Commands are <strong>never executed</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onImportTerminal}
            className="px-3 py-1.5 rounded-lg bg-[#0e1622] hover:bg-[#162334] border border-cyan-800/40 text-cyan-300 text-xs font-fira transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Log</span>
          </button>
        </div>
      </div>

      {/* When no terminal log is loaded */}
      {!terminalData ? (
        <div className="p-8 rounded-xl bg-[#080d14] border border-slate-800 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-purple-950/40 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto">
            <Terminal className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-cinzel text-lg font-bold text-slate-100">
              No Terminal History Currently Loaded
            </h3>
            <p className="text-xs font-fira text-slate-400 leading-relaxed">
              Upload a `.bash_history`, `.zsh_history`, PowerShell dump, or terminal console output to inspect
              destructive commands, abnormal exit codes, and frantic midnight loops.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onImportTerminal}
              className="px-4 py-2 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 border border-purple-500/40 text-purple-200 text-xs font-fira font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Terminal File</span>
            </button>
            <button
              onClick={onLoadSampleTerminal}
              className="px-4 py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 text-xs font-fira font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Load Sample Terminal Incident</span>
            </button>
          </div>
        </div>
      ) : (
        /* Terminal Metrics & Analysis */
        <div className="space-y-5">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-fira">
            <div className="p-3.5 rounded-xl bg-[#09111b] border border-cyan-900/40">
              <div className="text-[11px] text-slate-400 uppercase font-medium">Total Commands</div>
              <div className="text-xl font-bold text-cyan-300 font-orbitron mt-1">
                {terminalData.totalCommands}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Parsed static lines</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#09111b] border border-cyan-900/40">
              <div className="text-[11px] text-slate-400 uppercase font-medium">Unique Commands</div>
              <div className="text-xl font-bold text-slate-200 font-orbitron mt-1">
                {terminalData.uniqueCommands}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Distinct invocations</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#140c11] border border-rose-900/40">
              <div className="text-[11px] text-rose-400 uppercase font-medium flex items-center gap-1">
                <Skull className="w-3 h-3 text-rose-400" />
                <span>High-Risk Ops</span>
              </div>
              <div className="text-xl font-bold text-rose-300 font-orbitron mt-1">
                {terminalData.dangerousCommands.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Deletions, drops, force pushes</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#110e1a] border border-purple-900/40">
              <div className="text-[11px] text-purple-400 uppercase font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Frantic Loops</span>
              </div>
              <div className="text-xl font-bold text-purple-300 font-orbitron mt-1">
                {terminalData.repeatedLoops.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Commands repeated ≥3x</div>
            </div>
          </div>

          {/* Destructive / Dangerous Operations Table */}
          {terminalData.dangerousCommands.length > 0 && (
            <div className="p-4 rounded-xl bg-[#09111b] border border-rose-900/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-cinzel text-sm font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                  <Skull className="w-4 h-4 text-rose-400" />
                  <span>High-Risk Destructive Operations (Static Detection)</span>
                  <Tooltip text="Commands flagged by static regex for dangerous deletion, forced process kill, raw disk write, or database purge." />
                </h3>
                <span className="text-xs font-fira text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded">
                  {terminalData.dangerousCommands.length} Flagged
                </span>
              </div>

              <div className="space-y-2 font-fira text-xs">
                {terminalData.dangerousCommands.map((dc, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (onLineClick) onLineClick(dc.line);
                      if (onSelectNav) onSelectNav('memory');
                    }}
                    className="p-3 rounded-lg bg-[#140c11] border border-rose-900/50 hover:border-rose-400/50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                    title="Click to view this line in Memory Explorer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-[11px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40 shrink-0">
                        Line {dc.line}
                      </span>
                      <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                        {dc.label}:
                      </span>
                      <code className="text-rose-200 font-mono text-xs truncate">
                        {dc.command}
                      </code>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-rose-400 opacity-80 group-hover:opacity-100 shrink-0">
                      <span>Inspect line</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frantic Command Loops */}
          {terminalData.repeatedLoops.length > 0 && (
            <div className="p-4 rounded-xl bg-[#09111b] border border-amber-900/40 shadow-lg space-y-3">
              <h3 className="font-cinzel text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Frantic Command Loops (Repeated ≥3x)</span>
                <Tooltip text="Commands repeated successively without changes, indicating panic or troubleshooting distress." />
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-fira text-xs">
                {terminalData.repeatedLoops.map((loop, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#0e1622] border border-amber-900/30 flex items-center justify-between gap-2"
                  >
                    <code className="text-amber-200 font-mono truncate">{loop.command}</code>
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold text-[10px] border border-amber-500/40 shrink-0">
                      {loop.count}× repeated
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Terminal Stream View */}
          <div className="p-4 rounded-xl bg-[#060a0f] border border-cyan-900/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-cyan-900/30 pb-2">
              <h3 className="font-cinzel text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Raw Terminal Stream</span>
              </h3>
              <span className="text-[11px] font-fira text-slate-500">
                Read-only display • Click line to inspect
              </span>
            </div>

            <div className="font-mono text-xs max-h-96 overflow-y-auto divide-y divide-slate-900/80 bg-[#04070a] p-3 rounded-lg">
              {rawContent.split('\n').map((line, idx) => {
                const lineNum = idx + 1;
                const isDangerous = terminalData.dangerousCommands.some((d) => d.line === lineNum);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (onLineClick) onLineClick(lineNum);
                      if (onSelectNav) onSelectNav('memory');
                    }}
                    className={`flex items-start gap-3 py-1 px-2 hover:bg-[#0d1622] cursor-pointer transition-colors ${
                      isDangerous ? 'bg-rose-950/30 border-l-2 border-rose-400 text-rose-200' : 'text-slate-300'
                    }`}
                  >
                    <span className="w-8 shrink-0 text-right text-slate-600 select-none text-[11px]">
                      {lineNum}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-all">{line || ' '}</span>
                    {isDangerous && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/30 shrink-0">
                        ⚠ Danger
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
