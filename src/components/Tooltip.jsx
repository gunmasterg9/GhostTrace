import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export function Tooltip({ text, children, side = 'top' }) {
  const [visible, setVisible] = useState(false);

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children || (
        <button
          type="button"
          aria-label={text}
          className="text-slate-400 hover:text-cyan-400 focus-visible:text-cyan-300 focus-visible:outline-none transition-colors p-0.5 cursor-help"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      )}

      {visible && text && (
        <span
          role="tooltip"
          className={`absolute ${sideClasses} z-50 w-max max-w-xs px-2.5 py-1.5 rounded-md bg-[#0a111a] border border-cyan-500/40 text-slate-200 text-xs font-fira shadow-[0_4px_20px_rgba(0,0,0,0.8)] pointer-events-none animate-fadeIn`}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function InfoBadge({ label, tooltipText }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      <Tooltip text={tooltipText} />
    </span>
  );
}

