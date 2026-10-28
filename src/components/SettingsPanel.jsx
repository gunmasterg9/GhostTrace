import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Monitor,
  Volume2,
  ShieldCheck,
  RefreshCw,
  Check,
  Lock,
  Type,
  FileCheck,
} from 'lucide-react';
import { spectralAudio } from '../utils/audio';
import { Tooltip } from './Tooltip';

export function SettingsPanel({
  ollamaStatus,
  onRefreshOllama,
  selectedModel,
  onSelectModel,
  isAudioOn,
  onToggleAudio,
  isCrtOn,
  onToggleCrt,
  fontSize,
  onChangeFontSize,
  redactedData: _redactedData,
}) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [testingAudio, setTestingAudio] = useState(false);

  const copyOllamaCmd = () => {
    navigator.clipboard.writeText('ollama run gemma');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleTestAudio = () => {
    setTestingAudio(true);
    spectralAudio.playSéanceChime();
    setTimeout(() => setTestingAudio(false), 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Settings Header */}
      <div>
        <h2 className="font-cinzel text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>Application Settings & Privacy Safeguards</span>
        </h2>
        <p className="text-xs font-fira text-slate-400 mt-1">
          Configure local AI inference, audiovisual preferences, and verify local security controls.
        </p>
      </div>

      {/* Ollama AI Inference Configuration */}
      <div className="p-5 rounded-xl bg-[#080d14] border border-cyan-900/40 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-900/30 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Ollama AI Model Engine</span>
                <Tooltip text="GhostTrace connects to your local Ollama instance on port 11434 to run Gemma models with complete privacy." />
              </h3>
              <p className="text-xs font-fira text-slate-400">
                Local-first inference • Zero prompts or code sent over the internet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-fira border ${
                ollamaStatus.online
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus.online ? 'bg-emerald-400 shadow-[0_0_8px_#00ff88]' : 'bg-amber-400'
                }`}
              />
              <span>{ollamaStatus.online ? 'Ollama Online' : 'Simulation Fallback Mode'}</span>
            </span>

            <button
              onClick={onRefreshOllama}
              className="p-1.5 rounded-lg bg-[#0e1622] hover:bg-[#152233] border border-cyan-800/40 text-cyan-300 text-xs font-fira transition-colors flex items-center gap-1 cursor-pointer"
              title="Re-test local connection to Ollama"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Model Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-fira">
          <div className="space-y-2">
            <label className="block text-slate-300 font-medium">
              Active Model Selection:
            </label>
            {ollamaStatus.online && ollamaStatus.models.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => onSelectModel(e.target.value)}
                className="w-full bg-[#05080c] text-cyan-300 border border-cyan-900/60 rounded-lg p-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer"
              >
                {ollamaStatus.models.map((m) => (
                  <option key={m} value={m}>
                    {m.includes('gemma') ? `✨ ${m} (Recommended Gemma)` : m}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#05080c] border border-slate-800 text-slate-400 text-xs">
                Offline Simulation Engine (Deterministic Fallback)
              </div>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              When Ollama is online, GhostTrace streams directly from local Gemma. When offline,
              it falls back seamlessly to the built-in deterministic simulation engine.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#05080c] border border-slate-800 space-y-2">
            <div className="text-slate-300 font-medium flex items-center justify-between">
              <span>Quick Terminal Setup:</span>
              <button
                onClick={copyOllamaCmd}
                className="text-[10px] text-cyan-400 hover:text-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>{copiedCmd ? 'Copied' : 'Copy Command'}</span>
              </button>
            </div>
            <code className="block p-2 rounded bg-black/60 border border-cyan-900/40 text-emerald-300 font-mono text-xs select-all">
              ollama run gemma
            </code>
            <p className="text-[11px] text-slate-400">
              Run this once in your terminal to download and start the local Gemma model.
            </p>
          </div>
        </div>
      </div>

      {/* Audiovisual Preferences */}
      <div className="p-5 rounded-xl bg-[#080d14] border border-cyan-900/40 shadow-lg space-y-4">
        <h3 className="font-cinzel text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 border-b border-cyan-900/30 pb-3">
          <Monitor className="w-4 h-4 text-purple-400" />
          <span>Audiovisual & Atmospheric Preferences</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-fira">
          {/* CRT Mode */}
          <div className="p-4 rounded-lg bg-[#05080c] border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-slate-200">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Retro CRT Filter</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Subtle vintage CRT scanlines, vignette, and phosphor bloom.
              </p>
            </div>

            <button
              onClick={onToggleCrt}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isCrtOn
                  ? 'bg-cyan-950/70 border-cyan-400/50 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'bg-[#0a111a] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {isCrtOn ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* EVP Audio Drone */}
          <div className="p-4 rounded-lg bg-[#05080c] border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-slate-200">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Ambient EVP Audio Drone</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Atmospheric synthesizer frequencies synthesized via Web Audio API.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestAudio}
                className="px-2 py-1.5 rounded-lg bg-[#0e1622] hover:bg-[#162334] border border-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                title="Play test chime"
              >
                {testingAudio ? 'Playing…' : 'Test Sound'}
              </button>
              <button
                onClick={onToggleAudio}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isAudioOn
                    ? 'bg-purple-950/70 border-purple-400/50 text-purple-300 shadow-[0_0_10px_rgba(192,132,252,0.2)]'
                    : 'bg-[#0a111a] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isAudioOn ? 'Active' : 'Muted'}
              </button>
            </div>
          </div>
        </div>

        {/* Text Size Control */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium font-fira text-slate-300 flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reader Text Size:</span>
            </span>
            <span className="text-xs font-fira text-slate-400 capitalize">{fontSize}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['compact', 'normal', 'large'].map((size) => (
              <button
                key={size}
                onClick={() => onChangeFontSize(size)}
                className={`py-2 px-3 rounded-lg text-xs font-fira capitalize transition-all border cursor-pointer ${
                  fontSize === size
                    ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-200 font-bold'
                    : 'bg-[#05080c] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {size} {size === 'normal' && '(Default)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy & Security Audit Safeguards */}
      <div className="p-5 rounded-xl bg-[#080d14] border border-emerald-900/30 shadow-lg space-y-4">
        <h3 className="font-cinzel text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 border-b border-emerald-900/30 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Local-First Privacy & Security Safeguards</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-fira">
          <div className="p-3.5 rounded-lg bg-[#05080c] border border-slate-800 space-y-1.5">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Offline Processing</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Zero outbound network requests for code or prompt tokens. No remote telemetry or cloud storage.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#05080c] border border-slate-800 space-y-1.5">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Client-Side Secret Redaction</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              API tokens, passwords, bearer headers, and user paths are sanitized before inference ingestion.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#05080c] border border-slate-800 space-y-1.5">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inert Command Guarantee</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Terminal histories and console dumps are parsed purely as static strings. No commands are executed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
