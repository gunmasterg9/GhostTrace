# GhostTrace AI: Feature Update

## 1. Evidence vs. Imagination
- Local Gemma prompt now requests `VERIFIED EVIDENCE`, `AI INTERPRETATION`, and `FICTIONAL NARRATIVE`.
- Séance UI renders these as separate labeled panels.
- Fallback simulation uses the same sections.
- Exported dossier includes an evidence-integrity note.
- The prompt includes source-line excerpts around detected markers and limits each marker category to 12 entries to keep multi-file prompts bounded.

## 2. Digital Memory Explorer
- Use **Explore Folder** to choose a folder in the browser's native picker.
- Reads supported text/source files only; no background disk scan.
- Limits: 30 supported files, 4MB combined.
- Files are combined with file-name separators. Citations refer to line numbers in this combined artifact.

## 3. Haunted Terminal
- Use **Import Terminal** to select terminal history or log files.
- Limits: 10 files, 4MB combined.
- Read-only analysis; imported commands are never executed.

## Offline adjustment
- Removed the Google Fonts network import so the app's stylesheet does not request fonts from an external host. System fallback fonts are used if the named fonts are not installed.

## Validation note
- `node --check src/utils/ollama.js` and `node --check src/utils/redactor.js` passed.
- A full Vite production build could not be run in this environment because the uploaded `node_modules` contain Windows-specific native binaries and lack the Linux Rolldown binding. On the Windows development machine, run `npm install` if needed, then `npm run build` and `npm run lint`.
