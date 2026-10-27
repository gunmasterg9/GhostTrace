import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { ArcheologyBar } from './components/ArcheologyBar';
import { EvidencePanel } from './components/EvidencePanel';
import { ManifestationPanel } from './components/ManifestationPanel';
import { SAMPLE_ARCHIVES } from './data/sampleArchives';
import { GHOST_PERSONAS } from './data/personas';
import { redactSensitiveData } from './utils/redactor';
import { analyzeEvidence } from './utils/forensics';
import { checkOllamaStatus, streamGhostStory } from './utils/ollama';
import { spectralAudio } from './utils/audio';
import { parseManifestationTiers } from './utils/manifestationParser';

const initialArchive = SAMPLE_ARCHIVES.find((a) => a.id === 'vault_cipher') || SAMPLE_ARCHIVES[0];
const initialRedacted = redactSensitiveData(initialArchive.content);
const initialForensics = analyzeEvidence(initialRedacted.sanitized, initialArchive.filename);
const initialPersona = GHOST_PERSONAS.find((item) => item.id === initialArchive.defaultPersona) || GHOST_PERSONAS[0];

export default function App() {
  const [currentArchiveId, setCurrentArchiveId] = useState(initialArchive.id);
  const [activeFilename, setActiveFilename] = useState(initialArchive.filename);
  const [rawContent, setRawContent] = useState(initialArchive.content);
  const [isCustomFile, setIsCustomFile] = useState(false);

  const [redactedData, setRedactedData] = useState(initialRedacted);
  const [forensicData, setForensicData] = useState(initialForensics);
  const [selectedPersona, setSelectedPersona] = useState(initialPersona);

  const [ollamaStatus, setOllamaStatus] = useState({ online: false, models: [], activeModel: 'gemma4:e4b', isGemma: false });
  const [selectedModel, setSelectedModel] = useState('gemma4:e4b');

  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isCrtOn, setIsCrtOn] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [manifestationText, setManifestationText] = useState('');
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [storySource, setStorySource] = useState(null);
  const [citationNotice, setCitationNotice] = useState(null);

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

    processContent(archive.content, archive.filename);

    if (archive.defaultPersona) {
      const p = GHOST_PERSONAS.find((item) => item.id === archive.defaultPersona);
      if (p) setSelectedPersona(p);
    }
  };

  const checkOllama = async () => {
    const status = await checkOllamaStatus();
    setOllamaStatus(status);
    if (status.activeModel) {
      setSelectedModel(status.activeModel);
    }
  };

  // Check Ollama status on mount
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
    processContent(content, filename);
  };

  const handlePasteSnippet = (filename, content) => {
    setIsCustomFile(true);
    setActiveFilename(filename);
    setManifestationText('');
    setHighlightedLine(null);
    setStorySource(null);
    setCitationNotice(null);
    processContent(content, filename);
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

    let targetLine = lineNum;

    // Multi-file resolution if the rawContent contains concatenated files
    if (filePrefix && rawContent.includes('===== FILE:')) {
      const rawLines = rawContent.split('\n');
      for (let i = 0; i < rawLines.length; i++) {
        if (rawLines[i].includes('===== FILE:') && rawLines[i].toLowerCase().includes(filePrefix.toLowerCase())) {
          targetLine = i + 1 + lineNum; // offset by header line
          break;
        }
      }
    }

    // Check for invalid or non-existent line (spectral anomaly fallback)
    if (targetLine < 1 || targetLine > forensicData.lineCount) {
      const clamped = Math.max(1, Math.min(targetLine, forensicData.lineCount));
      setHighlightedLine(clamped);
      setCitationNotice({
        requested: filePrefix ? `${filePrefix}:Line ${lineNum}` : `Line ${lineNum}`,
        clamped,
        maxLines: forensicData.lineCount,
      });
      const element = document.getElementById(`evidence-line-${clamped}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setCitationNotice(null);
    setHighlightedLine(targetLine);
    const element = document.getElementById(`evidence-line-${targetLine}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleStartSéance = async () => {
    if (isGenerating || !forensicData) return;

    spectralAudio.playSéanceChime();
    setIsGenerating(true);
    setManifestationText('');
    setStorySource(null);
    setCitationNotice(null);
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
        onToken: (fullText) => {
          setManifestationText(fullText);
        },
      });

      // Ectoplasmic confetti celebration
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00ff88', '#22d3ee', '#c084fc', '#ffffff'],
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Séance error:', err);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopSéance = () => {
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
    a.download = `ghosttrace_dossier.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isCrtOn ? 'crt-active crt-vignette' : ''}`}>
      {/* Header with Navigation and Toggles */}
      <Header
        ollamaStatus={ollamaStatus}
        onRefreshOllama={checkOllama}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        isAudioOn={isAudioOn}
        onToggleAudio={handleToggleAudio}
        isCrtOn={isCrtOn}
        onToggleCrt={handleToggleCrt}
      />

      {/* Archeology Bar */}
      <ArcheologyBar
        currentArchiveId={currentArchiveId}
        onSelectArchive={loadArchive}
        onCustomFileUpload={handleCustomFileUpload}
        onPasteSnippet={handlePasteSnippet}
        isCustomFile={isCustomFile}
        activeFilename={activeFilename}
      />

      {/* Main Split Séance Interface */}
      <main className="flex-1 p-3 sm:p-5 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto lg:h-[calc(100vh-128px)] min-h-0 lg:min-h-[640px]">
        {/* Left Pane: Evidence Crypt */}
        {forensicData && (
          <EvidencePanel
            rawContent={rawContent}
            forensics={forensicData}
            redactions={redactedData}
            highlightedLine={highlightedLine}
            onLineClick={handleLineClick}
            citationNotice={citationNotice}
            onDismissNotice={() => setCitationNotice(null)}
          />
        )}

        {/* Right Pane: Spectral Manifestation */}
        <ManifestationPanel
          selectedPersona={selectedPersona}
          onSelectPersona={setSelectedPersona}
          onStartSéance={handleStartSéance}
          onStopSéance={handleStopSéance}
          isGenerating={isGenerating}
          manifestationText={manifestationText}
          activeModel={selectedModel}
          isOllamaOnline={ollamaStatus.online}
          storySource={storySource}
          onSelectCitation={handleSelectCitation}
          onExportDossier={handleExportDossier}
        />
      </main>
    </div>
  );
}
