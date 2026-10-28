import React, { useState } from 'react';
import { ClipboardPaste, X } from 'lucide-react';

export function PasteModal({ isOpen, onClose, onPasteSubmit }) {
  const [filename, setFilename] = useState('pasted_trace.txt');
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please paste code, terminal error logs, or backtraces.');
      return;
    }
    setError(null);
    onPasteSubmit(filename || 'pasted_trace.txt', content);
    setContent('');
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-modal-title"
    >
      <div className="bg-[#09111b] border border-cyan-500/40 rounded-xl p-6 max-w-2xl w-full shadow-[0_0_40px_rgba(0,0,0,0.9)] text-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <div>
              <h3 id="paste-modal-title" className="font-cinzel text-lg font-bold text-slate-100">
                Paste Code or Trace
              </h3>
              <p className="text-xs font-fira text-slate-400">
                Instant client-side ingestion and redaction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Close Paste Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-xs font-fira text-rose-300">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="artifact-filename-input" className="block text-xs font-fira text-slate-300 mb-1.5 font-medium">
              Artifact Filename or Identifier:
            </label>
            <input
              id="artifact-filename-input"
              name="artifactFilename"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. fatal_crash.log or auth_service.js"
              className="w-full bg-[#060b10] border border-cyan-900/50 rounded-lg px-3 py-2 text-xs font-fira text-cyan-300 focus:outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </div>

          <div>
            <label htmlFor="artifact-content-textarea" className="block text-xs font-fira text-slate-300 mb-1.5 font-medium">
              Source Code, Terminal Output, or Panic Backtrace:
            </label>
            <textarea
              id="artifact-content-textarea"
              name="artifactContent"
              rows={11}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="// Paste your code, crash log, or shell history here..."
              className="w-full bg-[#060b10] border border-cyan-900/50 rounded-lg p-3 text-xs font-fira text-emerald-300 focus:outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 font-mono resize-y"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-fira text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-fira font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Analyze Trace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

