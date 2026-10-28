# 👻 GhostTrace AI: The Ghost That Remembers (Release Candidate v1.0.0-rc.1)

> *"The machine remembers. Now it has a story to tell."*

**GhostTrace AI** is a local-first digital archaeology experience that turns forgotten source code, terminal crash logs, abandoned TODOs, and software errors into eerie, interactive, evidence-based ghost stories.

Powered by open-weight AI (**Gemma** running locally via **Ollama**), GhostTrace bridges forensic ground-truth and spectral fiction—keeping selected artifacts and inference on your machine. The app no longer imports Google Fonts from the internet.

---

> [!IMPORTANT]
> **Security & Privacy Advisory:** While `npm audit` reports 0 known package vulnerabilities, automated dependency auditing is not a substitute for a full application security review. GhostTrace's client-side Redaction Shield strips known credential formats (OpenAI/GitHub keys, JWTs, Bearer tokens, private keys, database connection strings, and local directory paths) via deterministic heuristic regexes. However, custom-formatted, obfuscated, or base64-encoded secrets may evade pattern matching. **Never upload or paste files containing active production credentials, root keys, or sensitive infrastructure passwords.**

---

## 💡 Why Open Innovation Matters

GhostTrace AI explores what becomes possible when AI runs on your own machine. Local inference gives users complete control over their data, removes the need for hosted inference services, eliminates subscription costs, and makes rapid experimentation with open-weight models possible.

The project unites open-weight AI, local-first computing, software archaeology, and creative storytelling:
**The ghost is local. The evidence is real. The haunting is generated.**

---

## 🌟 Core Pillars

- 🧠 **Local Gemma Inference:** Powered by local Gemma models running via Ollama (`http://localhost:11434`), auto-detecting models like `gemma4:e4b`, `gemma2:9b`, etc.
- 🔒 **Privacy-First Redaction Shield:** Sensitive tokens, Bearer auth, private keys, passwords, and local Windows user paths are automatically stripped on the client before inference.
- 📴 **Offline By Design:** Works with zero internet connection once dependencies and the model are installed. Features an atmospheric offline fallback simulation engine.
- 📜 **Evidence vs. Imagination:** The séance presents three strictly separated sections: `VERIFIED EVIDENCE` (deterministic, parser-derived source facts), `AI INTERPRETATION` (uncertain technical inferences), and `FICTIONAL NARRATIVE` / `SPECTRAL MANIFESTATION` (the spooky story). Verified evidence is always generated from parser results, not trusted from model text. Click valid `[Line XX]` or `[relative/path.ext:Line XX]` citations to inspect the source.
- 🏛️ **Digital Memory Explorer:** Choose a folder in the browser's folder picker to inspect up to 30 supported text/source files, with a 2MB combined limit (max 500KB per file). Pre-redacts all files and maintains an exact line-level manifest for file-relative citation resolution; no recursive disk access occurs outside the folder the user explicitly selects.
- 👻 **Haunted Terminal Import:** Import selected terminal history or log files as read-only, inert text. Explicit terminal forensic state analyzes desperation command loops, exit failures (`137`, `139`), and destructive commands (`rm -rf`, `drop database`). GhostTrace never executes imported commands (zero eval, shell, or subprocess execution). Multi-file terminal imports are limited to 10 files and 2MB total.
- 🕯️ **Séance Terminal & EVP Audio:** Retro CRT phosphor styling, scanline curvature, and Web Audio API synthesized EVP radio static and sub-bass drone. EVP effects are sound design, not speech synthesis.
- 📁 **Forensic Necronomicon Dossier:** One-click export of complete `ghosttrace_dossier.md` files combining code forensics, decay metrics, and channeled narratives.

---

## 🧪 New Analysis Workflows

### Evidence vs. Imagination
Each generated séance is structured into three labeled sections:
- **Verified Evidence:** Strictly derived from local parser findings and direct artifact observations. Model text is never trusted for ground truth.
- **AI Interpretation:** Uncertain explanations that are explicitly labeled as probabilistic AI deductions.
- **Fictional Narrative:** Atmospheric gothic horror storytelling, clearly marked as creative fiction.

The offline simulation uses the same section structure and avoids inventing evidence citations when no matching marker exists.

### Digital Memory Explorer
Click **Explore Folder** and select a project folder in the browser picker. GhostTrace reads only supported text/source files that the user explicitly selected:
- Up to 30 supported files per scan.
- 2MB combined size limit (500KB per file).
- Supported formats include source code, README/Markdown, JSON, configuration, shell, and log/text files.
- Each file is redacted client-side before inference.
- Files are combined into a single forensic artifact with an exact line-level manifest, enabling accurate file-relative citations (`[relative/path.ext:Line N]`) with boundary clamping.

### Haunted Terminal
Click **Import Terminal** and select terminal history or log files. Imports are read-only text analysis:
- Up to 10 files and 2MB total.
- Commands are analyzed as inert text strings; no shell, eval, or execution pathway exists.
- Extracts repeated command desperation loops (≥3x streaks), flags destructive operations (`rm -rf`, `drop database`, `dd`, `git reset --hard`), and catches abnormal exit codes (`137`, `139`).
- Sensitive passwords, tokens, and paths are redacted before any text reaches the local Gemma model.

These workflows operate in the browser. They do not recursively scan your disk without a user-selected folder, and they do not require a cloud inference API.

---

## 🏛️ Ghost Personas

1. ☕ **The Midnight Committer:** The sleepless specter bound to late-night commits between 01:00 AM and 05:00 AM.
2. 🪦 **The Deprecated Dependency:** An obsolete module discarded by modern framework updates, harboring legacy salts.
3. ⚡ **The Panic Core:** Born from fatal crashes, segfaults at `0xDEADBEEF`, and silent `catch (e) {}` blocks.
4. 📜 **The Digital Archaeologist:** A forensic scholar excavating the ruins and lost civilizations of extinct codebases.

---

## 🚀 Quickstart

### 1. Ensure Ollama is running with Gemma
```bash
# In your terminal:
ollama run gemma4:e4b
# or:
ollama run gemma2:2b
```

### 2. Launch GhostTrace AI
**On Windows (1-Click):**
- Double-click `start.bat` to launch the server and automatically open the app in your browser.
- Double-click `stop.bat` to terminate the server.

**Or from terminal:**
```bash
npm run dev
```

Visit **[http://localhost:5173/](http://localhost:5173/)** in your browser.

---

## 📂 Project Architecture

```
GhostTrace/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx            # Main navigation sidebar: Dashboard, Memory, Terminal, Results, Settings
│   │   ├── Header.jsx             # Top bar with section title, model status, CRT & Audio quick controls
│   │   ├── Dashboard.jsx          # Primary actions (Explore Files, Import Terminal, Paste Trace) & 5-step stepper
│   │   ├── EvidencePanel.jsx      # Source Code & Evidence Crypt: syntax, TODOs, panics, jump-to-line, resizable
│   │   ├── ManifestationPanel.jsx # 3-Tier investigation results (Verified Facts, AI Deductions, Fiction)
│   │   ├── TerminalPanel.jsx      # Dedicated terminal forensics screen with inert command safety guarantees
│   │   ├── SettingsPanel.jsx      # Ollama configuration, CRT filter, EVP audio drone & reader font size
│   │   ├── PrivacyModal.jsx       # Investigation Step 2: Client-side secret redaction audit
│   │   ├── PasteModal.jsx         # In-memory code / backtrace paste modal
│   │   └── Tooltip.jsx            # Plain English tooltips for technical forensics terms
│   ├── data/
│   │   ├── personas.js            # Spectral persona prompts and system instructions
│   │   └── sampleArchives.js      # Curated artifacts (vault_cipher.rs, incident_0411.log, .bash_history)
│   ├── utils/
│   │   ├── audio.js               # Web Audio API ambient drone & chime synthesizer
│   │   ├── forensics.js           # Archaeological parser for TODOs, panics, and timestamps
│   │   ├── manifestationParser.js # 3-Tier epistemic parser & baseline ground truth formatter
│   │   ├── memoryExplorer.js      # Bounded recursive multi-file parser & binary filter
│   │   ├── ollama.js              # Ollama proxy client, token streamer & fallback simulator
│   │   ├── redactor.js            # Client-side privacy shield redacting secrets, paths & keys
│   │   └── terminalForensics.js   # Inert text-only terminal history & failure loop analyzer
│   ├── App.jsx                    # Core application orchestrator, navigation & dossier exporter
│   └── index.css                  # Cyber-gothic accessible dark design system
├── tests/                         # Node.js native automated test suite (36 tests)
│   ├── evidence_vs_imagination.test.js
│   ├── haunted_terminal.test.js
│   ├── memory_explorer.test.js
│   ├── redactor.test.js
│   ├── ollama_reliability.test.js
│   └── audit_reliability_deep.test.js
├── vite.config.js                 # Vite dev server with /ollama reverse proxy
└── package.json
```

---

## 🧪 Automated Test Suite & Release Verification

GhostTrace includes a complete native automated test suite with zero extra test-runner dependencies:

```bash
# On Windows PowerShell:
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

Verifies all **36 test cases** across the core pillars:
- **Evidence vs. Imagination:** Validates epistemic tier separation, fallback handling, multi-file citation regex, citation boundary clamping, and strict enforcement of parser-derived ground-truth over model hallucinations.
- **Ollama Reliability & Chunk Buffering:** Validates split JSONL records across network stream chunks, final unclosed buffered records, timeout handling, missing-model errors (404), empty streams, user abort, custom endpoints, and duplicate-fallback prevention.
- **Haunted Terminal:** Validates inert text parsing without shell execution, detection of dangerous commands (`rm -rf`, `drop database`, `dd`, `git reset --hard`), failure exit codes (`137`, `139`), command repetition loops, and client-side credential redaction before inference.
- **Digital Memory Explorer:** Validates file-count limits (max 30), total size bounds (2MB aggregate, 500KB per file), binary file rejection (null-byte inspection), line-level manifest arithmetic, and pre-inference privacy redaction.
- **Multi-File Citations & Unverified Warnings:** Validates `resolveCitationTarget()` mapping for relative paths, first and later files, duplicate basenames, Windows/Unix path separators, line 1, last line, out-of-bounds line clamping, and explicit `Unverified Citation Warning` generation when citations point to missing files or out-of-bounds lines.
- **Redaction Shield:** Validates client-side sanitization of API keys, passwords, Bearer tokens, OpenAI keys, GitHub tokens, database connection URIs, private keys, JWTs, and Windows/Unix file paths, ensuring zero secret fragments appear in metadata previews.

---

## ⚠️ Known Issues & Operational Guidance

1. **Cold LLM Weights**: Loading 7B+ open-weight models cold into VRAM on lower-tier hardware may take 20–40 seconds. GhostTrace employs a 60-second inactivity timer to prevent premature aborts while tokens are loading.
2. **Regex-Based Redaction Boundaries**: Heuristic pattern matching detects standard token prefixes and assignments. Highly obfuscated or proprietary credential strings may evade detection; do not load active production credentials.
3. **Local-First Model Connectivity**: To enable local inference, ensure Ollama is running (`ollama serve`). If Ollama is offline or unavailable, GhostTrace automatically switches to its grounded offline simulation engine with transparent UI indicators and a one-click Retry button.

---

## 📋 Release Notes & Changelog

See [`CHANGELOG.md`](file:///c:/Users/RAHUL/Desktop/gautam/GhostTrace/CHANGELOG.md) for the complete list of additions, fixes, security enhancements, and validation metrics for `v1.0.0-rc.1` in English and Gujarati (ગુજરાતી સારાંશ).

---

## 📜 License
MIT — Run it locally, preserve your digital history, and let the machine remember.
