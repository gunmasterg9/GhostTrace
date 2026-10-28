import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EvidencePanel } from './components/EvidencePanel';
import { ManifestationPanel } from './components/ManifestationPanel';
import { TerminalPanel } from './components/TerminalPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { PrivacyModal } from './components/PrivacyModal';
import { PasteModal } from './components/PasteModal';

import { SAMPLE_ARCHIVES } from './data/sampleArchives';
import { GHOST_PERSONAS } from './data/personas';
import { redactSensitiveData } from './utils/redactor';
import { analyzeEvidence } from './utils/forensics';
import { checkOllamaStatus, streamGhostStory } from './utils/ollama';
import { spectralAudio } from './utils/audio';
import { parseManifestationTiers } from './utils/manifestationParser';
import { resolveCitationTarget } from './utils/memoryExplorer';
import { isTerminalHistoryFile, analyzeTerminalHistory } from './utils/terminalForensics';

const initialArchive = SAMPLE_ARCHIVES.find((a) => a.id === 'vault_cipher') || SAMPLE_ARCHIVES[0];
const initialRedacted = redactSensitiveData(initialArchive.content);
const initialForensics = analyzeEvidence(initialRedacted.sanitized, initialArchive.filename);
const initialPersona = GHOST_PERSONAS.find((item) => item.id === initialArchive.defaultPersona) || GHOST_PERSONAS[0];

export default function App() {
  // Navigation & Workflow state
  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'memory' | 'terminal' | 'results' | 'settings'
  const [currentStep, setCurrentStep] = useState(1); // 1: Select -> 2: Privacy -> 3: Investigate -> 4: Evidence -> 5: Export

  // Current artifact state
  const [currentArchiveId, setCurrentArchiveId] = useState(initialArchive.id);
  const [activeFilename, setActiveFilename] = useState(initialArchive.filename);
  const [rawContent, setRawContent] = useState(initialArchive.content);
  const [isCustomFile, setIsCustomFile] = useState(false);

  const [redactedData, setRedactedData] = useState(initialRedacted);
  const [forensicData, setForensicData] = useState(initialForensics);
  const [selectedPersona, setSelectedPersona] = useState(initialPersona);

  // Ollama & Model state
  const [ollamaStatus, setOllamaStatus] = useState({ online: false, models: [], activeModel: 'gemma4:e4b', isGemma: false });
  const [selectedModel, setSelectedModel] = useState('gemma4:e4b');

  // Display & Audio preferences
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isCrtOn, setIsCrtOn] = useState(false); // Optional setting rather than mandatory distraction
  const [fontSize, setFontSize] = useState('normal'); // 'compact' | 'normal' | 'large'
  const [layoutMode, setLayoutMode] = useState('split'); // 'split' | 'file-only' | 'results-only'

  // Sidebar responsive state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Modals state
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Inference state
  const [isGenerating, setIsGenerating] = useState(false);
  const [manifestationText, setManifestationText] = useState('');
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [storySource, setStorySource] = useState(null);
  const [citationNotice, setCitationNotice] = useState(null);
  const [inferenceError, setInferenceError] = useState(null);

  // Terminal Forensics State
  const [terminalData, setTerminalData] = useState(null);
  const [isTerminalMode, setIsTerminalMode] = useState(false);

  // Multi-file memory manifest
  const [memoryManifest, setMemoryManifest] = useState([]);

  const abortControllerRef = useRef(null);

  const processContent = (content, filename) => {
    setRawContent(content);
    const red = redactSensitiveData(content);
    setRedactedData(red);

    const forensics = analyzeEvidence(red.sanitized, filename);
    setForensicData(forensics);
  };

  const loadArchive = (id) => {
    const archive = SAMPLE_ARCHIVES.find((a) => a.id === id);
    if (!archive) return;

    setCurrentArchiveId(id);
    setActiveFilename(archive.filename);
    setIsCustomFile(false);
    setManifestationText('');
    setHighlightedLine(null);
    setStorySource(null);
    setCitationNotice(null);
    setInferenceError(null);
    setMemoryManifest([]);
    setUploadError(null);

    processContent(archive.content, archive.filename);

    if (isTerminalHistoryFile(archive.filename, archive.content)) {
      const term = analyzeTerminalHistory(archive.content, archive.filename);
      setTerminalData(term);
      setIsTerminalMode(true);
    } else {
      setTerminalData(null);
      setIsTerminalMode(false);
    }

    if (archive.defaultPersona) {
      const p = GHOST_PERSONAS.find((item) => item.id === archive.defaultPersona);
      if (p) setSelectedPersona(p);
    }

    setCurrentStep(2);
  };

  const checkOllama = async () => {
    const status = await checkOllamaStatus();
    setOllamaStatus(status);
    if (status.activeModel) {
      setSelectedModel(status.activeModel);
    }
  };

  useEffect(() => {
    let isMounted = true;
    checkOllamaStatus().then((status) => {
      if (isMounted) {
        setOllamaStatus(status);
        if (status.activeModel) {
          setSelectedModel(status.activeModel);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCustomFileUpload = (filename, content) => {
    setIsCustomFile(true);
    setActiveFilename(filename);
    setManifestationText('');
    setHighlightedLine(null);
    setStorySource(null);
    setCitationNotice(null);
    setInferenceError(null);
    setMemoryManifest([]);
    setUploadError(null);

    if (isTerminalHistoryFile(filename, content)) {
      const term = analyzeTerminalHistory(content, filename);
      setTerminalData(term);
      setIsTerminalMode(true);
    } else {
      setTerminalData(null);
      setIsTerminalMode(false);
    }

    processContent(content, filename);
    setCurrentStep(2);
  };

  const handleFolderAnalysis = (analysisResult) => {
    setIsCustomFile(true);
    const filename = `folder-excavation-${analysisResult.totalFiles}-files.txt`;
    setActiveFilename(filename);
    setManifestationText('');
    setHighlightedLine(null);
    setStorySource(null);
    setCitationNotice(null);
    setInferenceError(null);
    setIsTerminalMode(false);
    setTerminalData(null);
    setUploadError(null);

    setMemoryManifest(analysisResult.manifest || []);
    setRawContent(analysisResult.combinedArtifact);
    setRedactedData({
      sanitized: analysisResult.combinedRedacted,
      redactionCount: analysisResult.totalRedactions,
      redactions: [],
    });

    const forensics = analyzeEvidence(analysisResult.combinedRedacted, filename);
    setForensicData(forensics);
    setCurrentStep(2);
  };

  const handleTerminalImport = (filename, content) => {
    setIsCustomFile(true);
    setActiveFilename(filename);
    setManifestationText('');
    setHighlightedLine(null);
    setStorySource(null);
    setCitationNotice(null);
    setInferenceError(null);
    setMemoryManifest([]);
    setUploadError(null);

    // Guaranteed inert text parsing
    const term = analyzeTerminalHistory(content, filename);
    setTerminalData(term);
    setIsTerminalMode(true);

    processContent(content, filename);
    setCurrentStep(2);
  };

  const handlePasteSnippet = (filename, content) => {
    setIsCustomFile(true);
    setActiveFilename(filename);
    setManifestationText('');
    setHighlightedLine(null);
    setStorySource(null);
    setCitationNotice(null);
    setInferenceError(null);
    setMemoryManifest([]);
    setUploadError(null);

    if (isTerminalHistoryFile(filename, content)) {
      const term = analyzeTerminalHistory(content, filename);
      setTerminalData(term);
      setIsTerminalMode(true);
    } else {
      setTerminalData(null);
      setIsTerminalMode(false);
    }

    processContent(content, filename);
    setCurrentStep(2);
  };

  const handleToggleAudio = () => {
    const active = spectralAudio.toggleSound();
    setIsAudioOn(active);
  };

  const handleToggleCrt = () => {
    setIsCrtOn((prev) => !prev);
  };

  const handleLineClick = (lineNum) => {
    setHighlightedLine(lineNum);
    setCitationNotice(null);
  };

  const handleSelectCitation = (lineNum, filePrefix) => {
    if (!forensicData) return;

    const resolved = resolveCitationTarget(
      { lineNum, filePrefix },
      memoryManifest,
      forensicData.lineCount
    );

    const targetLine = resolved.targetLine;

    if (resolved.isClamped || resolved.notFound) {
      setCitationNotice({
        requested: filePrefix ? `${filePrefix}:Line ${lineNum}` : `Line ${lineNum}`,
        clamped: targetLine,
        maxLines: forensicData.lineCount,
        file: resolved.file?.path || filePrefix || null,
      });
    } else {
      setCitationNotice(null);
    }

    setHighlightedLine(targetLine);
    const element = document.getElementById(`evidence-line-${targetLine}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleStartInvestigation = async () => {
    if (isGenerating || !forensicData) return;

    spectralAudio.playSéanceChime();
    setIsGenerating(true);
    setManifestationText('');
    setStorySource(null);
    setCitationNotice(null);
    setInferenceError(null);
    setCurrentStep(3);
    abortControllerRef.current = new AbortController();

    try {
      await streamGhostStory({
        endpoint: ollamaStatus.endpoint,
        model: selectedModel,
        persona: selectedPersona,
        codeSnippet: redactedData.sanitized,
        forensics: forensicData,
        signal: abortControllerRef.current.signal,
        onSourceChange: (type, modelName) => {
          setStorySource({ type, model: modelName });
        },
        onError: (errMsg) => {
          setInferenceError(errMsg);
        },
        onToken: (fullText) => {
          setManifestationText(fullText);
          setCurrentStep(4);
        },
      });

      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00ff88', '#22d3ee', '#c084fc', '#ffffff'],
      });
      setCurrentStep(4);
    } catch (err) {
      if (err.name !== 'AbortError' && !abortControllerRef.current?.signal?.aborted) {
        console.error('Investigation error:', err);
        setInferenceError(err.message || 'Investigation failed');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopInvestigation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
  };

  const handleExportDossier = () => {
    if (!forensicData) return;

    const tiers = parseManifestationTiers(manifestationText, forensicData);

    const dossierMarkdown = `# 👻 GHOSTTRACE FORENSIC AUTOPSY DOSSIER
**Generated by GhostTrace AI (Powered by Gemma & Ollama)**
**Date of Exhumation:** ${new Date().toISOString()}

---

## 1. 📜 VERIFIED EVIDENCE (Ground-Truth Source Facts)
> **Integrity Guarantee:** The following entries represent exact, verifiable ground-truth facts parsed directly from the local artifact on disk. No AI hallucinations or creative interpolations are present in this section.

- **Artifact Filename:** \`${forensicData.filename}\`
- **Total Line Count:** ${forensicData.lineCount}
- **Haunting Decay Score:** ${forensicData.hauntingScore}/100 (${forensicData.riskLevel})
- **Redaction Shield Status:** ${redactedData.redactionCount} sensitive patterns sanitized client-side before analysis

### Directives & Comments:
${forensicData.markers.map((m) => `- **[Line ${m.line}]** \`${m.type}\`: ${m.text}`).join('\n') || '- None'}

### Fatal Panics & Crash Signatures:
${forensicData.panics.map((p) => `- **[Line ${p.line}]** \`${p.type}\`: ${p.snippet}`).join('\n') || '- None'}

### Circadian / Midnight Signatures:
${forensicData.timestamps.map((t) => `- **[Line ${t.line}]** \`${t.time}\`: ${t.snippet}`).join('\n') || '- None'}

---

## 2. 🔬 FORENSIC INTERPRETATION (AI-Generated Technical Deductions)
> **Epistemic Notice:** The following deductions are probabilistic inferences generated by the local language model (${selectedModel}). They represent plausible technical hypotheses regarding system degradation, race conditions, or unhandled errors. They must NOT be treated as proven facts or legal testimony.

${tiers.interpretation || '- Technical analysis indicates potential instability in error recovery paths.'}

---

## 3. 🕯️ SPECTRAL MANIFESTATION (Fictional Horror Storytelling)
> **Fiction Notice:** The narrative below is explicitly creative fiction and gothic entertainment, channeled through the '${selectedPersona.name}' persona. It does not reflect real-world individuals or actual paranormal occurrences.

**Channeling Spirit:** ${selectedPersona.name} (${selectedPersona.title})
**Model Engine:** ${selectedModel}
**Inference Engine Source:** ${storySource?.type === 'ollama' ? `Real Ollama (${storySource.model})` : 'Offline Simulation Engine'}

${tiers.narrative || manifestationText}

---
*Generated locally via GhostTrace AI — Privacy First • 0 Cloud Uploads.*
`;

    const blob = new Blob([dossierMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghosttrace_${forensicData.filename.replace(/[^a-zA-Z0-9_-]/g, '_')}_dossier.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCurrentStep(5);
  };

  const handleToggleLayout = () => {
    setLayoutMode((prev) => (prev === 'split' ? 'file-only' : prev === 'file-only' ? 'results-only' : 'split'));
  };

  return (
    <div className={`min-h-screen flex flex-row bg-[#030608] text-slate-100 overflow-x-hidden ${isCrtOn ? 'crt-active crt-vignette' : ''}`}>
      {/* Navigation Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        ollamaStatus={ollamaStatus}
        selectedModel={selectedModel}
        isGenerating={isGenerating}
        activeFilename={activeFilename}
        terminalData={terminalData}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <Header
          activeNav={activeNav}
          onOpenMobile={() => setIsMobileOpen(true)}
          ollamaStatus={ollamaStatus}
          onRefreshOllama={checkOllama}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          isAudioOn={isAudioOn}
          onToggleAudio={handleToggleAudio}
          isCrtOn={isCrtOn}
          onToggleCrt={handleToggleCrt}
          activeFilename={activeFilename}
          isGenerating={isGenerating}
          onStartInvestigation={handleStartInvestigation}
          onStopInvestigation={handleStopInvestigation}
          onSelectNav={setActiveNav}
        />

        {/* Global Error Banner */}
        {uploadError && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-between text-xs font-fira text-rose-300">
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

        {/* Active View Container */}
        <main className="flex-1 p-3 sm:p-5 overflow-y-auto">
          {activeNav === 'dashboard' && (
            <Dashboard
              onSelectNav={setActiveNav}
              onCustomFileUpload={handleCustomFileUpload}
              onFolderAnalysis={handleFolderAnalysis}
              onTerminalImport={handleTerminalImport}
              onOpenPasteModal={() => setIsPasteModalOpen(true)}
              onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
              onStartInvestigation={handleStartInvestigation}
              onExportDossier={handleExportDossier}
              currentArchiveId={currentArchiveId}
              onSelectArchive={loadArchive}
              activeFilename={activeFilename}
              forensicData={forensicData}
              redactedData={redactedData}
              isCustomFile={isCustomFile}
              ollamaStatus={ollamaStatus}
              selectedModel={selectedModel}
              isGenerating={isGenerating}
              manifestationText={manifestationText}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              setUploadError={setUploadError}
            />
          )}

          {activeNav === 'memory' && (
            <div className="h-[calc(100vh-100px)] min-h-[580px]">
              {layoutMode === 'split' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                  <EvidencePanel
                    rawContent={rawContent}
                    forensics={forensicData}
                    redactions={redactedData}
                    highlightedLine={highlightedLine}
                    onLineClick={handleLineClick}
                    citationNotice={citationNotice}
                    onDismissNotice={() => setCitationNotice(null)}
                    terminalData={terminalData}
                    isTerminalMode={isTerminalMode}
                    memoryManifest={memoryManifest}
                    fontSize={fontSize}
                    layoutMode={layoutMode}
                    onToggleLayout={handleToggleLayout}
                  />
                  <ManifestationPanel
                    selectedPersona={selectedPersona}
                    onSelectPersona={setSelectedPersona}
                    onStartSéance={handleStartInvestigation}
                    onStopSéance={handleStopInvestigation}
                    isGenerating={isGenerating}
                    manifestationText={manifestationText}
                    activeModel={selectedModel}
                    isOllamaOnline={ollamaStatus.online}
                    storySource={storySource}
                    onSelectCitation={handleSelectCitation}
                    onExportDossier={handleExportDossier}
                    forensicData={forensicData}
                    inferenceError={inferenceError}
                    onRetryInvestigation={handleStartInvestigation}
                    onDismissError={() => setInferenceError(null)}
                    fontSize={fontSize}
                    layoutMode={layoutMode}
                    onToggleLayout={handleToggleLayout}
                  />
                </div>
              ) : (
                <EvidencePanel
                  rawContent={rawContent}
                  forensics={forensicData}
                  redactions={redactedData}
                  highlightedLine={highlightedLine}
                  onLineClick={handleLineClick}
                  citationNotice={citationNotice}
                  onDismissNotice={() => setCitationNotice(null)}
                  terminalData={terminalData}
                  isTerminalMode={isTerminalMode}
                  memoryManifest={memoryManifest}
                  fontSize={fontSize}
                  layoutMode={layoutMode}
                  onToggleLayout={handleToggleLayout}
                />
              )}
            </div>
          )}

          {activeNav === 'terminal' && (
            <TerminalPanel
              terminalData={terminalData}
              rawContent={rawContent}
              onImportTerminal={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.log,.txt,.json,.out,.err,.csv,.sh,.ps1,.bash_history';
                input.onchange = (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (typeof ev.target?.result === 'string') {
                        handleTerminalImport(file.name, ev.target.result);
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
              onLoadSampleTerminal={() => loadArchive('terminal_incident')}
              onLineClick={handleLineClick}
              onSelectNav={setActiveNav}
            />
          )}

          {activeNav === 'results' && (
            <div className="h-[calc(100vh-100px)] min-h-[580px]">
              {layoutMode === 'split' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                  <EvidencePanel
                    rawContent={rawContent}
                    forensics={forensicData}
                    redactions={redactedData}
                    highlightedLine={highlightedLine}
                    onLineClick={handleLineClick}
                    citationNotice={citationNotice}
                    onDismissNotice={() => setCitationNotice(null)}
                    terminalData={terminalData}
                    isTerminalMode={isTerminalMode}
                    memoryManifest={memoryManifest}
                    fontSize={fontSize}
                    layoutMode={layoutMode}
                    onToggleLayout={handleToggleLayout}
                  />
                  <ManifestationPanel
                    selectedPersona={selectedPersona}
                    onSelectPersona={setSelectedPersona}
                    onStartSéance={handleStartInvestigation}
                    onStopSéance={handleStopInvestigation}
                    isGenerating={isGenerating}
                    manifestationText={manifestationText}
                    activeModel={selectedModel}
                    isOllamaOnline={ollamaStatus.online}
                    storySource={storySource}
                    onSelectCitation={handleSelectCitation}
                    onExportDossier={handleExportDossier}
                    forensicData={forensicData}
                    inferenceError={inferenceError}
                    onRetryInvestigation={handleStartInvestigation}
                    onDismissError={() => setInferenceError(null)}
                    fontSize={fontSize}
                    layoutMode={layoutMode}
                    onToggleLayout={handleToggleLayout}
                  />
                </div>
              ) : (
                <ManifestationPanel
                  selectedPersona={selectedPersona}
                  onSelectPersona={setSelectedPersona}
                  onStartSéance={handleStartInvestigation}
                  onStopSéance={handleStopInvestigation}
                  isGenerating={isGenerating}
                  manifestationText={manifestationText}
                  activeModel={selectedModel}
                  isOllamaOnline={ollamaStatus.online}
                  storySource={storySource}
                  onSelectCitation={handleSelectCitation}
                  onExportDossier={handleExportDossier}
                  forensicData={forensicData}
                  inferenceError={inferenceError}
                  onRetryInvestigation={handleStartInvestigation}
                  onDismissError={() => setInferenceError(null)}
                  fontSize={fontSize}
                  layoutMode={layoutMode}
                  onToggleLayout={handleToggleLayout}
                />
              )}
            </div>
          )}

          {activeNav === 'settings' && (
            <SettingsPanel
              ollamaStatus={ollamaStatus}
              onRefreshOllama={checkOllama}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              isAudioOn={isAudioOn}
              onToggleAudio={handleToggleAudio}
              isCrtOn={isCrtOn}
              onToggleCrt={handleToggleCrt}
              fontSize={fontSize}
              onChangeFontSize={setFontSize}
              redactedData={redactedData}
            />
          )}
        </main>
      </div>

      {/* Privacy Redaction Review Modal (Workflow Step 2) */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        redactedData={redactedData}
        onProceedToInvestigation={() => {
          setActiveNav('results');
          handleStartInvestigation();
        }}
      />

      {/* Paste Trace Modal */}
      <PasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onPasteSubmit={handlePasteSnippet}
      />
    </div>
  );
}
