import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, ArrowRight, X } from 'lucide-react';

export function PrivacyModal({
  isOpen,
  onClose,
  redactedData,
  onProceedToInvestigation,
}) {
  if (!isOpen) return null;

  const redactions = redactedData?.redactions || [];
  const redactionCount = redactedData?.redactionCount || 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="bg-[#09111b] border border-cyan-500/40 rounded-xl p-6 max-w-2xl w-full shadow-[0_0_40px_rgba(0,0,0,0.9)] text-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 id="privacy-modal-title" className="font-cinzel text-lg font-bold text-slate-100">
                Privacy Redaction Review
              </h3>
              <p className="text-xs font-fira text-emerald-400">
                Investigation Workflow Step 2 of 5
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm font-fira p-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Close Privacy Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Local Security Shield Guarantee */}
        <div className="p-3.5 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs font-fira text-emerald-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-emerald-300">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Client-Side Zero-Cloud Guarantee</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            All code, logs, and files remain on your physical machine. GhostTrace scrubs passwords,
            authorization tokens, API keys, and local user directory paths using client-side regular expressions
            before inference.
          </p>
        </div>

        {/* Redaction Findings List */}
        <div>
          <h4 className="text-xs font-bold font-cinzel text-slate-200 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Redaction Audit Findings</span>
            <span className="text-xs font-fira font-semibold text-emerald-400">
              {redactionCount} patterns wiped
            </span>
          </h4>

          {redactionCount === 0 ? (
            <div className="p-4 rounded-lg bg-[#060b10] border border-slate-800 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-xs font-fira text-slate-300 font-semibold">
                Clean Trace Verified
              </p>
              <p className="text-[11px] font-fira text-slate-500">
                No passwords, bearer tokens, or sensitive home directories detected in this artifact.
              </p>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 font-fira text-xs">
              {redactions.map((red, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#060b10] border border-emerald-900/30 flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded mr-2">
                      {red.type}
                    </span>
                    <span className="text-slate-400 text-xs truncate">
                      Sanitized to <code className="text-cyan-300">[{red.type.toUpperCase()}_REDACTED]</code>
                    </span>
                  </div>
                  <span className="text-emerald-400 text-xs shrink-0 font-semibold">
                    ✓ Masked
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyan-900/40">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-fira text-slate-400 hover:text-slate-200 rounded-lg"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              if (onProceedToInvestigation) onProceedToInvestigation();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-fira font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>Confirm & Start Investigation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

