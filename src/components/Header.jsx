import React from 'react';
import {
  Menu,
  Volume2,
  VolumeX,
  Monitor,
  Cpu,
  RefreshCw,
  Radio,
  StopCircle,
  FileCode,
} from 'lucide-react';

export function Header({
  activeNav,
  onOpenMobile,
  ollamaStatus,
  onRefreshOllama,
  selectedModel,
  onSelectModel,
  isAudioOn,
  onToggleAudio,
  isCrtOn,
  onToggleCrt,
  activeFilename,
  isGenerating,
  onStartInvestigation,
  onStopInvestigation,
  onSelectNav,
}) {
  const sectionTitles = {
    dashboard: 'Dashboard',
    memory: 'Memory Explorer',
    terminal: 'Terminal Forensics',
    results: 'Investigation Results',
    settings: 'Settings & Privacy',
  };

  return (
    <header className="border-b border-cyan-900/30 bg-[#060a0f]/90 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-950/40 border border-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cinzel text-base sm:text-lg font-bold tracking-wide text-slate-100 flex items-center gap-2">
                {sectionTitles[activeNav] || 'GhostTrace AI'}
              </h2>
              {activeFilename && (
                <button
                  onClick={() => onSelectNav('memory')}
                  className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0e1622] hover:bg-[#162334] border border-cyan-900/50 text-cyan-300 text-xs font-fira transition-colors cursor-pointer"
                  title="Click to view file in Memory Explorer"
                >
                  <FileCode className="w-3 h-3 text-cyan-400" />
                  <span className="truncate max-w-[180px]">{activeFilename}</span>
                </button>
              )}
            </div>
            <p className="hidden sm:flex items-center gap-1.5 text-[11px] font-fira text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Local-First Forensics • Zero Cloud Ingestion</span>
            </p>
          </div>
        </div>

        {/* Right: Quick Controls & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-fira">
          {/* Ollama Status Pill & Model Selector */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0a111a] border border-cyan-900/40">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus.online ? 'bg-emerald-400 shadow-[0_0_8px_#00ff88]' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-medium hidden md:inline">
                {ollamaStatus.online ? 'Ollama' : 'Simulation'}
              </span>
            </div>

            {ollamaStatus.online && ollamaStatus.models.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => onSelectModel(e.target.value)}
                className="bg-[#05080c] text-cyan-300 border border-cyan-900/60 rounded px-2 py-0.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 cursor-pointer max-w-[130px] truncate"
                aria-label="Select Ollama Model"
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
              title="Refresh local Ollama status"
              className="p-1 hover:text-cyan-300 text-slate-400 transition-colors focus-visible:ring-1 focus-visible:ring-cyan-400 rounded"
              aria-label="Refresh Ollama status"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* CRT Mode Toggle */}
          <button
            onClick={onToggleCrt}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              isCrtOn
                ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                : 'bg-[#0a111a] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Retro CRT Scanlines & Phosphor Glow"
            aria-pressed={isCrtOn}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CRT Mode</span>
          </button>

          {/* EVP Audio Drone Toggle */}
          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              isAudioOn
                ? 'bg-purple-950/60 border-purple-400/50 text-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                : 'bg-[#0a111a] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Ambient Audio Drone"
            aria-pressed={isAudioOn}
          >
            {isAudioOn ? (
              <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">Ambient Audio</span>
          </button>

          {/* Primary Investigation Action Button */}
          {isGenerating ? (
            <button
              onClick={onStopInvestigation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-fira font-semibold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Halt</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onSelectNav('results');
                onStartInvestigation();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-fira font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
              title="Launch AI investigation on the active artifact"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Investigate</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
