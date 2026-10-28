import React, { useRef } from 'react';
import {
  FolderSearch,
  Upload,
  Terminal,
  ClipboardPaste,
  ShieldCheck,
  Flame,
  Binary,
  AlertTriangle,
  Skull,
  ArrowRight,
  FolderArchive,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { SAMPLE_ARCHIVES } from '../data/sampleArchives';
import { EXPLORER_LIMITS, analyzeMemoryArchive } from '../utils/memoryExplorer';
import { Tooltip, InfoBadge } from './Tooltip';

export function Dashboard({
  onSelectNav,
  onCustomFileUpload,
  onFolderAnalysis,
  onTerminalImport,
  onOpenPasteModal,
  onOpenPrivacyModal,
  onStartInvestigation,
  onExportDossier,
  currentArchiveId,
  onSelectArchive,
  activeFilename,
  forensicData,
  redactedData,
  isCustomFile,
  ollamaStatus,
  selectedModel,
  isGenerating,
  manifestationText,
  currentStep,
  setCurrentStep,
  setUploadError,
}) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const terminalInputRef = useRef(null);

  const handleSingleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size === 0) {
      setUploadError('The selected file is empty (0 bytes). Cannot analyze an empty file.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setUploadError('File exceeds 4MB. Please provide logs or code snippets under 4MB for fast in-browser analysis.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        if (content.includes('\0')) {
          setUploadError('Binary file detected. GhostTrace operates exclusively on text files, code, and logs.');
          return;
        }
        if (!content.trim()) {
          setUploadError('The selected file contains only blank whitespace.');
          return;
        }
        setUploadError(null);
        onCustomFileUpload(file.name, content);
        setCurrentStep(2); // Advance to Step 2: Review privacy
      };
    };
    reader.onerror = () => {
      setUploadError('Failed to read file from disk. Check file permissions.');
    };
    reader.readAsText(file);
  };

  const readTextFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result;
        if (typeof content !== 'string' || content.includes('\0')) {
          reject(new Error(`${file.name}: binary or unreadable file`));
          return;
        }
        resolve(content);
      };
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.readAsText(file);
    });

  const handleFolderChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const eligible = files.filter((file) => !file.name.startsWith('.') && !file.name.endsWith('.lock'));
    const candidates = eligible.filter((file) => {
      const lower = file.name.toLowerCase();
      return EXPLORER_LIMITS.ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext)) || lower.includes('history');
    });

    if (!candidates.length) {
      setUploadError('No supported text or source code files found in the chosen folder.');
      return;
    }

    if (candidates.length > EXPLORER_LIMITS.MAX_FILE_COUNT) {
      setUploadError(`Folder scan is limited to ${EXPLORER_LIMITS.MAX_FILE_COUNT} text files at a time. Select a smaller folder or subfolder.`);
      return;
    }

    const totalBytes = candidates.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > EXPLORER_LIMITS.MAX_TOTAL_SIZE_BYTES) {
      setUploadError(`Selected files exceed the ${Math.round(EXPLORER_LIMITS.MAX_TOTAL_SIZE_BYTES / (1024 * 1024))}MB total limit.`);
      return;
    }

    try {
      const fileObjects = await Promise.all(
        candidates.map(async (file) => {
          if (file.size === 0) return null;
          try {
            const content = await readTextFile(file);
            return {
              name: file.name,
              path: file.webkitRelativePath || file.name,
              content,
              size: file.size,
            };
          } catch {
            return null;
          }
        })
      );

      const usableFiles = fileObjects.filter(Boolean);
      if (!usableFiles.length) {
        setUploadError('The selected folder contains no non-empty readable text files.');
        return;
      }

      const analysisResult = analyzeMemoryArchive(usableFiles);
      if (analysisResult.files.length === 0) {
        setUploadError(analysisResult.warnings[0] || 'No eligible text files could be ingested.');
        return;
      }

      setUploadError(null);
      onFolderAnalysis(analysisResult);
      setCurrentStep(2); // Advance to Step 2: Review privacy
    } catch (err) {
      setUploadError(`Folder exploration stopped safely: ${err.message}`);
    }
  };

  const handleTerminalHistoryChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    if (files.length > 10) {
      setUploadError('Select up to 10 terminal log files at a time.');
      return;
    }

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes === 0) {
      setUploadError('The selected terminal history file is empty.');
      return;
    }
    if (totalBytes > EXPLORER_LIMITS.MAX_TOTAL_SIZE_BYTES) {
      setUploadError(`Terminal history exceeds the ${Math.round(EXPLORER_LIMITS.MAX_TOTAL_SIZE_BYTES / (1024 * 1024))}MB limit.`);
      return;
    }

    try {
      const sections = await Promise.all(
        files.map(async (file) => {
          if (file.size === 0) return null;
          const content = await readTextFile(file);
          return `===== IMPORTED TERMINAL ARTIFACT: ${file.name} =====\n${content}`;
        })
      );
      const combined = sections.filter(Boolean).join('\n\n');
      if (!combined.trim()) throw new Error('No non-empty terminal text found.');

      setUploadError(null);
      const filename = `terminal-history-${files.length}-files.txt`;
      const fullText = `SOURCE TYPE: USER-SELECTED TERMINAL HISTORY / LOGS (READ-ONLY INERT TEXT IMPORT)\nNo commands were executed. Analyze this imported text only.\n\n${combined}`;
      onTerminalImport(filename, fullText);
      setCurrentStep(2); // Advance to Step 2: Review privacy
    } catch (err) {
      setUploadError(`Terminal import stopped safely: ${err.message}`);
    }
  };

  const handleStepClick = (stepNum) => {
    if (stepNum === 1) {
      fileInputRef.current?.click();
    } else if (stepNum === 2) {
      onOpenPrivacyModal();
    } else if (stepNum === 3) {
      onSelectNav('results');
      onStartInvestigation();
    } else if (stepNum === 4) {
      onSelectNav('results');
    } else if (stepNum === 5) {
      onExportDossier();
    }
  };

  const workflowSteps = [
    {
      num: 1,
      title: 'Select Files',
      desc: activeFilename || 'Choose code, logs, or folder',
      status: activeFilename ? 'completed' : 'active',
    },
    {
      num: 2,
      title: 'Review Privacy',
      desc: redactedData ? `${redactedData.redactionCount} secrets sanitized` : 'Inspect redacted tokens',
      status: currentStep >= 2 ? (redactedData ? 'completed' : 'active') : 'upcoming',
    },
    {
      num: 3,
      title: 'Start Investigation',
      desc: isGenerating ? 'AI analyzing…' : 'Trigger local Gemma inference',
      status: isGenerating ? 'active' : manifestationText ? 'completed' : currentStep >= 3 ? 'active' : 'upcoming',
    },
    {
      num: 4,
      title: 'Review Evidence',
      desc: manifestationText ? 'Ground truth & deductions ready' : '3 tiers of verified evidence',
      status: manifestationText ? 'completed' : currentStep >= 4 ? 'active' : 'upcoming',
    },
    {
      num: 5,
      title: 'Export Report',
      desc: 'Download Markdown autopsy dossier',
      status: currentStep === 5 ? 'completed' : 'upcoming',
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-7xl mx-auto pb-12">
      {/* Hidden file inputs */}
      <input
        type="file"
        id="single-file-upload-input"
        name="singleFile"
        ref={fileInputRef}
        onChange={handleSingleFileChange}
        accept=".rs,.js,.jsx,.ts,.tsx,.py,.go,.cpp,.c,.java,.log,.txt,.json,.md,.sh,.env,.yml,.yaml,.sql"
        className="hidden"
        aria-label="Upload single code or log file"
      />
      <input
        type="file"
        id="folder-upload-input"
        name="projectFolder"
        ref={folderInputRef}
        onChange={handleFolderChange}
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        aria-label="Upload project directory"
      />
      <input
        type="file"
        id="terminal-history-upload-input"
        name="terminalHistory"
        ref={terminalInputRef}
        onChange={handleTerminalHistoryChange}
        accept=".log,.txt,.json,.out,.err,.csv,.sh,.ps1,.bash_history"
        multiple
        className="hidden"
        aria-label="Import terminal history files as inert text"
      />

      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#09111b] via-[#0d1624] to-[#0a1019] border border-cyan-900/40 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-fira">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Client-Side • Local Gemma Inference • Zero Cloud Uploads</span>
          </div>

          <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold tracking-wide text-slate-100">
            Digital Archaeology & AI Forensics
          </h1>

          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            GhostTrace AI analyzes abandoned codebases, crash dumps, and terminal histories.
            Extract verifiable ground-truth evidence, synthesize AI hypotheses, and channel gothic
            narratives entirely on your device.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm font-fira text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${ollamaStatus.online ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>Engine: <strong className="text-slate-200">{ollamaStatus.online ? `Ollama (${selectedModel})` : 'Offline Simulation Engine'}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inert Terminal Parsing (Never executes commands)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Prominent Main Action Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-cinzel text-lg sm:text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>Primary Actions</span>
            <Tooltip text="Start an investigation by exploring a folder, importing shell logs, or pasting a snippet." />
          </h2>
          <span className="text-xs sm:text-sm font-fira text-cyan-400/90 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-0.5 rounded">
            Step 1 of 5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {/* Action 1: Explore Files */}
          <div className="p-6 rounded-xl bg-[#080e16] border border-cyan-900/40 hover:border-cyan-500/40 transition-all flex flex-col justify-between group shadow-lg min-w-0">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <FolderSearch className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Explore Files</span>
                </h3>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Examine individual source code files or an entire project directory up to 30 files ({Math.round(EXPLORER_LIMITS.MAX_TOTAL_SIZE_BYTES / (1024 * 1024))}MB).
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => folderInputRef.current?.click()}
                className="w-full py-2.5 px-3.5 rounded-lg bg-cyan-950 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 text-xs sm:text-sm font-fira font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[40px]"
              >
                <FolderSearch className="w-4 h-4 text-cyan-400" />
                <span>Select Project Folder</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3.5 rounded-lg bg-[#0c1420] hover:bg-[#121c2d] border border-slate-800 text-slate-300 text-xs sm:text-sm font-fira transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[40px]"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Single File</span>
              </button>
            </div>
          </div>

          {/* Action 2: Import Terminal Logs */}
          <div className="p-6 rounded-xl bg-[#080e16] border border-purple-900/40 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-lg min-w-0">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-lg bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Import Terminal Logs</span>
                </h3>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Analyze shell history (`.bash_history`, `.log`, PowerShell dumps) strictly as inert text to detect destructive commands and loops.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => terminalInputRef.current?.click()}
                className="w-full py-2.5 px-3.5 rounded-lg bg-purple-950 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 text-xs sm:text-sm font-fira font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 min-h-[40px]"
              >
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Import Terminal History</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 text-xs font-fira text-emerald-400/90 py-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Never executes commands</span>
              </div>
            </div>
          </div>

          {/* Action 3: Paste Trace */}
          <div className="p-6 rounded-xl bg-[#080e16] border border-emerald-900/40 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg min-w-0 md:col-span-2 xl:col-span-1">
            <div className="space-y-3.5">
              <div className="w-12 h-12 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <ClipboardPaste className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-cinzel text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Paste Trace</span>
                </h3>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Paste a fatal panic backtrace, stack trace, git diff, or snippet directly for instant client-side analysis and redaction.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={onOpenPasteModal}
                className="w-full py-2.5 px-3.5 rounded-lg bg-emerald-950 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-fira font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 min-h-[40px]"
              >
                <ClipboardPaste className="w-4 h-4 text-emerald-400" />
                <span>Paste Code or Trace</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 text-xs font-fira text-slate-400 py-1">
                <span>Fast in-memory triage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Investigation Workflow Guide */}
      <div className="p-6 rounded-xl bg-[#070c13] border border-cyan-900/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Investigation Workflow</span>
              <Tooltip text="Follow these 5 steps from artifact selection through privacy review, AI investigation, and final report export." />
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Guided path for first-time digital archaeologists</p>
          </div>
          <span className="text-xs sm:text-sm font-fira text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded font-medium">
            Step {currentStep} of 5 Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {workflowSteps.map((step) => {
            const isCurrent = currentStep === step.num;
            const isDone = step.status === 'completed';

            return (
              <div
                key={step.num}
                onClick={() => handleStepClick(step.num)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-w-0 ${
                  isCurrent
                    ? 'bg-cyan-950/50 border-cyan-500/60 shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/30'
                    : isDone
                    ? 'bg-[#0a121c] border-emerald-500/30 text-slate-300'
                    : 'bg-[#080d14] border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-orbitron font-bold ${
                        isDone
                          ? 'bg-emerald-500 text-black'
                          : isCurrent
                          ? 'bg-cyan-400 text-black font-extrabold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : step.num}
                    </span>
                    <span className="text-[11px] font-fira text-slate-500 uppercase font-medium">
                      Step {step.num}
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold font-cinzel ${isCurrent ? 'text-cyan-200' : 'text-slate-200'}`}>
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-snug line-clamp-2 font-fira">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-3.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-fira text-cyan-400">
                  <span>Open step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Artifact Summary Card (if file loaded) */}
      {forensicData && (
        <div className="p-6 rounded-xl bg-[#09111b] border border-cyan-900/40 shadow-xl space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-900/30 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                <Binary className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-cinzel text-base sm:text-lg font-bold text-slate-100 truncate">
                    Active Artifact: {forensicData.filename}
                  </h3>
                  {isCustomFile && (
                    <span className="text-[10px] font-fira bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded shrink-0">
                      User File
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-fira text-slate-400">
                  {forensicData.lineCount} total lines parsed • Client-side analysis ready
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onSelectNav('memory')}
                className="px-3.5 py-2 rounded-lg bg-[#0e1622] hover:bg-[#152233] border border-cyan-900/50 text-cyan-300 text-xs sm:text-sm font-fira transition-colors cursor-pointer"
              >
                Inspect in Memory Explorer
              </button>
              <button
                onClick={() => {
                  onSelectNav('results');
                  onStartInvestigation();
                }}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-fira font-bold transition-all shadow-[0_0_12px_rgba(0,255,136,0.3)] cursor-pointer flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Run Investigation</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-xs font-fira">
            {/* Risk Decay Score */}
            <div className="p-3.5 rounded-lg bg-[#060b10] border border-slate-800">
              <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
                <InfoBadge label="Decay Index" tooltipText="Risk score calculated from fatal exceptions, abandoned directives, and timestamp anomalies." />
                <Flame className="w-3.5 h-3.5" style={{ color: forensicData.riskColor }} />
              </div>
              <div className="text-xl font-bold font-orbitron" style={{ color: forensicData.riskColor }}>
                {forensicData.hauntingScore}%
              </div>
              <div className="text-xs text-slate-400">{forensicData.riskLevel}</div>
            </div>

            {/* Directives */}
            <div className="p-3.5 rounded-lg bg-[#060b10] border border-slate-800">
              <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
                <span>Directives</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-300 font-orbitron">
                {forensicData.markers.length}
              </div>
              <div className="text-xs text-slate-400">TODO / FIXME tags</div>
            </div>

            {/* Panics */}
            <div className="p-3.5 rounded-lg bg-[#060b10] border border-slate-800">
              <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
                <span>Fatal Panics</span>
                <Skull className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-bold text-rose-300 font-orbitron">
                {forensicData.panics.length}
              </div>
              <div className="text-xs text-slate-400">Crash & panic signatures</div>
            </div>

            {/* Redacted Secrets */}
            <div
              onClick={onOpenPrivacyModal}
              className="p-3.5 rounded-lg bg-[#060b10] border border-emerald-900/30 hover:border-emerald-500/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
                <span>Privacy Shield</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-300 font-orbitron">
                {redactedData?.redactionCount || 0}
              </div>
              <div className="text-xs text-slate-400">Secrets wiped • Click to review</div>
            </div>
          </div>
        </div>
      )}

      {/* Sample Archives Catalog (One-click quick testing) */}
      <div className="p-6 rounded-xl bg-[#080d14] border border-cyan-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-cinzel text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <FolderArchive className="w-4 h-4 text-emerald-400" />
              <span>Sample Archives Catalog</span>
              <Tooltip text="Curated test scenarios with realistic deadlocks, crash logs, legacy authentication, and terminal dumps." />
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-fira mt-0.5">
              Test GhostTrace instantly with pre-configured archaeological cases
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {SAMPLE_ARCHIVES.map((arch) => {
            const isSelected = !isCustomFile && currentArchiveId === arch.id;

            return (
              <div
                key={arch.id}
                onClick={() => {
                  onSelectArchive(arch.id);
                  setCurrentStep(2);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-w-0 ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-400/60 shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                    : 'bg-[#0b1219] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-fira px-2 py-0.5 rounded bg-black/40 border border-slate-800 text-slate-300 font-medium">
                      {arch.category}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-xs font-fira text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Loaded
                      </span>
                    )}
                  </div>
                  <h4 className="font-cinzel text-sm sm:text-base font-bold text-slate-100 truncate">
                    {arch.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1.5 line-clamp-2 font-fira leading-relaxed">
                    {arch.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs sm:text-sm font-fira">
                  <span className="text-slate-400 text-xs font-mono">{arch.filename}</span>
                  <span className={`font-semibold ${isSelected ? 'text-emerald-400 font-bold' : 'text-cyan-400'}`}>
                    {isSelected ? 'Active' : 'Load →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
