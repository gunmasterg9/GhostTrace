import React from 'react';
import { Ghost, Volume2, VolumeX, Monitor, ShieldCheck, Cpu, RefreshCw } from 'lucide-react';

export function Header({
  ollamaStatus,
  onRefreshOllama,
  selectedModel,
  onSelectModel,
  isAudioOn,
  onToggleAudio,
  isCrtOn,
  onToggleCrt,
}) {
  return (
    <header className="border-b border-cyan-900/30 bg-[#060b10]/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(0,255,136,0.3)] animate-ghost-pulse">
            <Ghost className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel text-xl font-bold tracking-wider text-slate-100 flex items-center gap-2">
                GhostTrace <span className="text-emerald-400 font-orbitron text-xs px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/40">AI</span>
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-fira text-cyan-400/70 border-l border-cyan-800/40 pl-2">
                The Ghost That Remembers
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block"></span>
              Digital archaeology & cyber-gothic local forensics
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-fira">
          {/* Privacy Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950/30 border border-emerald-500/20 text-emerald-300/90" title="Selected files stay entirely on your local machine">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Local Inference • 0 Cloud Uploads</span>
          </div>

          {/* Ollama Status & Model Picker */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0e1620] border border-cyan-900/40">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus.online ? 'bg-emerald-400 shadow-[0_0_8px_#00ff88]' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {ollamaStatus.online ? 'Ollama Online' : 'Simulation Mode'}
              </span>
            </div>

            {ollamaStatus.online && ollamaStatus.models.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => onSelectModel(e.target.value)}
                className="bg-[#080d14] text-cyan-300 border border-cyan-900/60 rounded px-2 py-0.5 text-xs outline-none focus:border-cyan-400 cursor-pointer"
              >
                {ollamaStatus.models.map((m) => (
                  <option key={m} value={m}>
                    {m.includes('gemma') ? `✨ ${m}` : m}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onRefreshOllama}
              title="Re-check local Ollama service"
              className="p-1 hover:text-cyan-300 text-slate-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* CRT Toggle */}
          <button
            onClick={onToggleCrt}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border transition-all ${
              isCrtOn
                ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-[#0e1620] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Retro CRT Scanlines & Phosphor Glow"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CRT Mode</span>
          </button>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md border transition-all ${
              isAudioOn
                ? 'bg-purple-950/60 border-purple-400/50 text-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                : 'bg-[#0e1620] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Ambient Spectral EVP Audio Generator"
          >
            {isAudioOn ? <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">EVP Drone</span>
          </button>
        </div>
      </div>
    </header>
  );
}
