# 👻 GhostTrace AI: The Ghost That Remembers

> *"The machine remembers. Now it has a story to tell."*

**GhostTrace AI** is a local-first digital archaeology experience that turns forgotten source code, terminal crash logs, abandoned TODOs, and software errors into eerie, interactive, evidence-based ghost stories.

Powered by open-weight AI (**Gemma** running locally via **Ollama**), GhostTrace bridges forensic ground-truth and spectral fiction—keeping selected artifacts and inference on your machine. The app no longer imports Google Fonts from the internet.

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
- 📜 **Evidence vs. Imagination:** The séance requests three clearly separated sections: `VERIFIED EVIDENCE` (directly detected facts), `AI INTERPRETATION` (uncertain inferences), and `FICTIONAL NARRATIVE` (the spooky story). Click valid `[Line XX]` citations to inspect the source.
- 🏛️ **Digital Memory Explorer:** Choose a folder in the browser's folder picker to inspect up to 30 supported text/source files, with a 4MB combined limit. Files are read in the browser and combined into one evidence artifact; no recursive disk access occurs outside the folder the user explicitly selects.
- 👻 **Haunted Terminal Import:** Import selected terminal history or log files as read-only text. GhostTrace never executes imported commands. Multi-file terminal imports are limited to 10 files and 4MB total.
- 🕯️ **Séance Terminal & EVP Audio:** Retro CRT phosphor styling, scanline curvature, and Web Audio API synthesized EVP radio static and sub-bass drone. EVP effects are sound design, not speech synthesis.
- 📁 **Forensic Necronomicon Dossier:** One-click export of complete `ghosttrace_dossier.md` files combining code forensics, decay metrics, and channeled narratives.

---

## 🧪 New Analysis Workflows

### Evidence vs. Imagination
Each generated séance is structured into three labeled sections:
- **Verified Evidence:** parser findings and direct artifact observations.
- **AI Interpretation:** uncertain explanations that are explicitly not treated as proven facts.
- **Fictional Narrative:** the horror story, clearly marked as creative fiction.

The offline simulation uses the same section structure and avoids inventing evidence citations when no matching marker exists.

### Digital Memory Explorer
Click **Explore Folder** and select a project folder in the browser picker. GhostTrace reads only supported text/source files that the user explicitly selected:
- Up to 30 supported files per scan.
- 4MB combined size limit.
- Supported formats include source code, README/Markdown, JSON, configuration, and log/text files.
- Files are combined into a single forensic artifact with file-name separators. Citation line numbers refer to that combined artifact.

### Haunted Terminal
Click **Import Terminal** and select terminal history or log files. Imports are read-only text analysis:
- Up to 10 files and 4MB total.
- Imported commands are never executed.
- Use only history/log files you intentionally select. Redaction runs before the text is sent to local inference.

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
│   │   ├── Header.jsx             # Status, model selector, CRT and EVP audio toggles
│   │   ├── ArcheologyBar.jsx      # Archive selector, file upload, folder scan, terminal import & paste
│   │   ├── EvidencePanel.jsx      # The Digital Crypt: syntax, TODOs, panics, redactions
│   │   └── ManifestationPanel.jsx # The Séance Chamber: persona selector, story streaming & citations
│   ├── data/
│   │   ├── personas.js            # Spectral persona prompts and system instructions
│   │   └── sampleArchives.js      # Curated artifacts (vault_cipher.rs, incident_0411.log, etc.)
│   ├── utils/
│   │   ├── audio.js               # Web Audio API ambient drone & keystroke synthesizer
│   │   ├── forensics.js           # Archaeological parser for TODOs, panics, and timestamps
│   │   ├── ollama.js              # Ollama proxy client, token streamer & fallback simulator
│   │   └── redactor.js            # Client-side privacy shield redacting secrets & keys
│   ├── App.jsx                    # Core application orchestrator
│   └── index.css                  # Cyber-gothic CRT design system
├── vite.config.js                 # Vite dev server with /ollama reverse proxy
└── package.json
```

---

## 📜 License
MIT — Run it locally, preserve your digital history, and let the machine remember.
