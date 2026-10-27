import React, { useRef, useState } from 'react';
import { FileCode, Upload, FolderArchive, Terminal, CheckCircle2, Files, ShieldCheck } from 'lucide-react';
import { SAMPLE_ARCHIVES } from '../data/sampleArchives';

export function ArcheologyBar({
  currentArchiveId,
  onSelectArchive,
  onCustomFileUpload,
  onPasteSnippet,
  isCustomFile,
  activeFilename,
}) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const terminalInputRef = useRef(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedCode, setPastedCode] = useState('');
  const [pastedFilename, setPastedFilename] = useState('pasted_terminal_log.txt');
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    // Check empty file
    if (file.size === 0) {
      setUploadError('The selected file is empty (0 bytes). Cannot exhume a void artifact.');
      return;
    }

    // Check overly large file (> 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Large log file detected (>4MB). Please provide snippets or logs under 4MB for responsive client-side analysis.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        // Binary check
        if (content.includes('\0')) {
          setUploadError('Binary / compiled file detected. GhostTrace only analyzes text files, crash logs, and source code.');
          return;
        }

        // Empty whitespace check
        if (!content.trim()) {
          setUploadError('The selected file contains only blank whitespace.');
          return;
        }

        setUploadError(null);
        onCustomFileUpload(file.name, content);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file from disk. Please check file permissions.');
    };
    reader.readAsText(file);
  };

  const readTextFile = (file) => new Promise((resolve, reject) => {
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
    const allowed = /\.(rs|js|jsx|ts|tsx|py|go|cpp|c|h|java|log|txt|json|md|sh|ps1|bash_history|yml|yaml|sql|toml|ini|xml|html|css|env)$/i;
    const candidates = eligible.filter((file) => allowed.test(file.name));
    if (!candidates.length) {
      setUploadError('No supported text, source-code, README, or log files found in the selected folder.');
      return;
    }
    if (candidates.length > 30) {
      setUploadError('Folder scan limited to 30 supported text files at a time. Select a smaller folder or subfolder.');
      return;
    }
    const totalBytes = candidates.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 4 * 1024 * 1024) {
      setUploadError('Selected text files exceed the 4MB total limit. Choose a smaller folder or subfolder.');
      return;
    }

    try {
      const sections = await Promise.all(candidates.map(async (file) => {
        if (file.size === 0) return null;
        const content = await readTextFile(file);
        const relative = file.webkitRelativePath || file.name;
        return `===== FILE: ${relative} =====\n${content}`;
      }));
      const usable = sections.filter(Boolean);
      if (!usable.length) {
        setUploadError('The selected folder contains no non-empty text artifacts.');
        return;
      }
      const combined = usable.join('\n\n');
      if (!combined.trim()) {
        setUploadError('No readable text content was found.');
        return;
      }
      setUploadError(null);
      onCustomFileUpload(`folder-excavation-${candidates.length}-files.txt`, combined);
    } catch (error) {
      setUploadError(`Folder scan stopped safely: ${error.message}`);
    }
  };

  const handleTerminalHistoryChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    if (files.length > 10) {
      setUploadError('Select up to 10 terminal history or log files at a time.');
      return;
    }
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes === 0) {
      setUploadError('The selected terminal history is empty.');
      return;
    }
    if (totalBytes > 4 * 1024 * 1024) {
      setUploadError('Terminal history exceeds the 4MB limit. Export a smaller date range or paste a focused excerpt.');
      return;
    }
    try {
      const sections = await Promise.all(files.map(async (file) => {
        if (file.size === 0) return null;
        const content = await readTextFile(file);
        return `===== IMPORTED TERMINAL ARTIFACT: ${file.name} =====\n${content}`;
      }));
      const combined = sections.filter(Boolean).join('\n\n');
      if (!combined.trim()) throw new Error('No non-empty terminal text found.');
      setUploadError(null);
      onCustomFileUpload(`terminal-history-${files.length}-files.txt`,
        `SOURCE TYPE: USER-SELECTED TERMINAL HISTORY / LOGS (READ-ONLY IMPORT)\nNo commands were executed. Analyze this imported text only.\n\n${combined}`);
    } catch (error) {
      setUploadError(`Terminal import stopped safely: ${error.message}`);
    }
  };

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    if (!pastedCode.trim()) {
      setUploadError('Cannot deposit empty snippet. Please paste code or logs.');
      return;
    }
    setUploadError(null);
    onPasteSnippet(pastedFilename || 'pasted_artifact.txt', pastedCode);
    setShowPasteModal(false);
    setPastedCode('');
  };

  return (
    <div className="bg-[#080d14] border-b border-cyan-900/30 px-4 py-3">
      {/* Upload / Validation Error Notification */}
      {uploadError && (
        <div className="max-w-7xl mx-auto mb-2 p-2 rounded-lg bg-rose-950/80 border border-rose-500/50 flex items-center justify-between text-xs font-fira text-rose-300">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{uploadError}</span>
          </div>
          <button
            onClick={() => setUploadError(null)}
            className="text-rose-400 hover:text-white px-2 py-0.5 rounded text-xs font-bold cursor-pointer"
          >
            ✕ Dismiss
          </button>
        </div>
      )}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Sample Archive Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs font-cinzel text-cyan-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
            <FolderArchive className="w-4 h-4 text-emerald-400" />
            <span>Crypt Archives:</span>
          </div>

          {SAMPLE_ARCHIVES.map((arch) => {
            const isSelected = !isCustomFile && currentArchiveId === arch.id;
            return (
              <button
                key={arch.id}
                onClick={() => onSelectArchive(arch.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-fira transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-950/60 border-emerald-400/50 text-emerald-300 shadow-[0_0_12px_rgba(0,255,136,0.25)]'
                    : 'bg-[#0d151f] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="font-medium">{arch.filename}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Upload / Paste Custom Artifacts */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Custom File Active Indicator */}
          {isCustomFile && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-fira">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="truncate max-w-[140px]">{activeFilename}</span>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".rs,.js,.jsx,.ts,.tsx,.py,.go,.cpp,.c,.java,.log,.txt,.json,.md,.sh,.env,.yml,.yaml,.sql"
            className="hidden"
          />
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFolderChange}
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            aria-label="Select a project folder for local multi-file analysis"
          />
          <input
            type="file"
            ref={terminalInputRef}
            onChange={handleTerminalHistoryChange}
            accept=".log,.txt,.json,.out,.err,.csv,.sh,.ps1,.bash_history"
            multiple
            className="hidden"
            aria-label="Import terminal history and logs as read-only text"
          />

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-fira bg-[#101627] hover:bg-[#18233a] border border-purple-900/50 text-purple-200 transition-all cursor-pointer"
            title="Select a folder. Only supported text files are read; nothing is executed or uploaded to a cloud service."
          >
            <Files className="w-3.5 h-3.5 text-purple-300" />
            <span>Explore Folder</span>
          </button>

          <button
            onClick={() => terminalInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-fira bg-[#101627] hover:bg-[#18233a] border border-amber-900/50 text-amber-200 transition-all cursor-pointer"
            title="Import selected terminal history or logs as text only. GhostTrace never executes imported commands."
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Import Terminal</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-fira bg-[#0f1722] hover:bg-[#162334] border border-cyan-900/40 text-cyan-200 transition-all shadow-sm hover:border-cyan-500/40 cursor-pointer"
            title="Upload any code file, terminal crash log, or git snippet from your machine"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exhume Local File</span>
          </button>

          <button
            onClick={() => setShowPasteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-fira bg-[#0f1722] hover:bg-[#162334] border border-cyan-900/40 text-cyan-200 transition-all shadow-sm hover:border-cyan-500/40 cursor-pointer"
            title="Paste raw code or terminal output"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Paste Trace</span>
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-2 flex flex-wrap items-center gap-2 text-[10px] font-fira text-slate-500">
        <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Read-only imports</span>
        <span>• Folder scan: up to 30 text files / 4MB total</span>
        <span>• Terminal history is analyzed as text; commands are never executed</span>
      </div>

      {/* Paste Modal */}
      {showPasteModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPasteModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#0b1219] border border-cyan-500/40 rounded-xl p-5 max-w-2xl w-full shadow-[0_0_30px_rgba(0,0,0,0.9)] text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40 mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="font-cinzel text-lg font-bold text-slate-100">Deposit Digital Residue</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-white text-sm font-fira px-2 py-1 rounded"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-fira text-slate-400 mb-1">
                  Artifact Identifier / Filename:
                </label>
                <input
                  type="text"
                  value={pastedFilename}
                  onChange={(e) => setPastedFilename(e.target.value)}
                  placeholder="e.g. fatal_worker_crash.log or abandoned_auth.js"
                  className="w-full bg-[#060b10] border border-cyan-900/50 rounded-lg px-3 py-2 text-xs font-fira text-cyan-300 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-fira text-slate-400 mb-1">
                  Paste Code, Terminal Error Logs, or Git Diffs:
                </label>
                <textarea
                  rows={10}
                  value={pastedCode}
                  onChange={(e) => setPastedCode(e.target.value)}
                  placeholder="// Paste the code or terminal log you wish to exhume..."
                  className="w-full bg-[#060b10] border border-cyan-900/50 rounded-lg p-3 text-xs font-fira text-emerald-300 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 text-xs font-fira text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-fira rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all cursor-pointer"
                >
                  Exhume Artifact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
