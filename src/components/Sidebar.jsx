import React from 'react';
import {
  Ghost,
  LayoutDashboard,
  Files,
  Terminal,
  Sparkles,
  Settings,
  ShieldCheck,
  Cpu,
  ChevronLeft,
  ChevronRight,
  X,
  Radio,
} from 'lucide-react';

export function Sidebar({
  activeNav,
  onSelectNav,
  ollamaStatus,
  selectedModel,
  isGenerating,
  activeFilename,
  terminalData,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  isMobileOpen,
  onCloseMobile,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      tooltip: 'Investigation hub and primary actions',
    },
    {
      id: 'memory',
      label: 'Memory Explorer',
      icon: Files,
      badge: activeFilename ? (activeFilename.length > 14 ? activeFilename.slice(0, 12) + '…' : activeFilename) : null,
      tooltip: 'Inspect source code, logs, and deterministic markers',
    },
    {
      id: 'terminal',
      label: 'Terminal Forensics',
      icon: Terminal,
      badge: terminalData?.dangerousCommands?.length ? `${terminalData.dangerousCommands.length} alerts` : null,
      badgeColor: 'rose',
      tooltip: 'Static analysis of command histories without execution',
    },
    {
      id: 'results',
      label: 'Investigation Results',
      icon: Sparkles,
      badge: isGenerating ? 'Running…' : null,
      badgeColor: 'emerald',
      tooltip: '3-tier analysis: verified evidence, AI interpretation, and narrative',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
      tooltip: 'Model selection, audio, display, and privacy settings',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#05090e] border-r border-cyan-900/30 transition-all duration-300
          lg:static lg:z-30 lg:h-screen lg:shrink-0
          ${isSidebarCollapsed ? 'lg:w-[72px] lg:min-w-[72px]' : 'lg:w-[270px] lg:min-w-[270px]'}
          ${isMobileOpen ? 'translate-x-0 w-[270px]' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Main Navigation"
      >
        {/* Brand / Logo Area */}
        <div className={`p-4 border-b border-cyan-900/30 flex items-center min-h-[65px] ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(0,255,136,0.25)] shrink-0 animate-ghost-pulse">
              <Ghost className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-cinzel text-base font-bold tracking-wider text-slate-100">
                    GhostTrace
                  </span>
                  <span className="text-[10px] font-orbitron font-semibold text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/40 bg-emerald-950/40">
                    AI
                  </span>
                </div>
                <p className="text-[11px] font-fira text-cyan-400/80 truncate">
                  Digital Archaeology
                </p>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md focus-visible:ring-2 focus-visible:ring-cyan-400"
            aria-label="Close Navigation Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectNav(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={item.tooltip}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                  isSidebarCollapsed ? 'justify-center px-2' : ''
                } ${
                  isActive
                    ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)] font-semibold'
                    : 'text-slate-400 hover:bg-[#0a121c] hover:text-slate-200 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isSidebarCollapsed && (
                  <span className="truncate text-left flex-1 font-fira text-xs sm:text-sm">
                    {item.label}
                  </span>
                )}
                {!isSidebarCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-fira px-1.5 py-0.5 rounded border shrink-0 ${
                      item.badgeColor === 'rose'
                        ? 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                        : item.badgeColor === 'emerald'
                        ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 animate-pulse'
                        : 'bg-black/50 border-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status / Local Guarantee Footer */}
        <div className="p-3 border-t border-cyan-900/30 bg-[#04070b]/60 space-y-2">
          {/* Active Generation State */}
          {isGenerating && (
            <div className={`p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs font-fira ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              {!isSidebarCollapsed && <span className="truncate">Analyzing artifact…</span>}
            </div>
          )}

          {/* Ollama Status Pill */}
          <div
            className={`p-2 rounded-lg bg-[#080e15] border border-cyan-900/30 flex items-center gap-2 text-xs font-fira text-slate-300 ${
              isSidebarCollapsed ? 'justify-center' : ''
            }`}
            title={
              ollamaStatus.online
                ? `Ollama Connected • Using ${selectedModel}`
                : 'Ollama Offline • Local Simulation Fallback Active'
            }
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            {!isSidebarCollapsed && (
              <div className="truncate text-left">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ollamaStatus.online
                        ? 'bg-emerald-400 shadow-[0_0_6px_#00ff88]'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-semibold text-[11px]">
                    {ollamaStatus.online ? 'Ollama Online' : 'Simulation Mode'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {ollamaStatus.online ? selectedModel : 'Offline Fallback'}
                </div>
              </div>
            )}
          </div>

          {/* Local Security Shield */}
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-fira text-emerald-400/80">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>100% Local • 0 Cloud Uploads</span>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <div className="hidden lg:flex justify-end pt-1">
            <button
              onClick={onToggleSidebarCollapse}
              className="p-1.5 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-[#0e1622] transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

