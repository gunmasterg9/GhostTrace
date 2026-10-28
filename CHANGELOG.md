# Changelog

All notable changes to GhostTrace AI are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-rc.1] — 2026-10-28 (Release Candidate)

### Added
- Three-tier output separation: Verified Evidence, Forensic Interpretation, and Fictional Narrative.
- Unverified citation warnings for missing files and out-of-range line references.
- Explicit Ollama failure messages and Retry Ollama action.
- Offline Simulation Engine status indicator.
- Redaction metadata previews that use static redacted placeholders.
- Digital Memory Explorer file-count and size limits.
- Markdown investigation dossier export.
- Regression tests for streaming, redaction, citations, terminal parsing, and artifact limits.

### Fixed
- Secret fragments exposed through redaction metadata previews.
- JSONL records split across network chunks.
- Final buffered JSONL records without a trailing newline.
- Premature timeout during continuous Ollama streaming by using an inactivity timeout.
- Duplicate simulation fallback on streaming errors.
- Citation highlighting for missing or out-of-range source locations.
- Forensic panic-pattern matching for punctuation-terminated calls.

### Security
- Expanded pattern-based detection for common credentials, API keys, tokens, database URIs, private keys, and local user paths.
- Documented limitations of heuristic redaction.
- Clarified that imported terminal commands are parsed as inert text and never executed.

### Validation
- Automated tests: 36 passed, 0 failed (as reported).
- Lint: 0 warnings, 0 errors (as reported).
- Production build: successful (as reported).
- Dependency audit: 0 vulnerabilities reported (as reported).
- Local Ollama streaming: manual verification reported.

### Known Limitations
- Pattern-based redaction may miss custom, encoded, or obfuscated secrets.
- Model cold-start time depends on available hardware and model size.
- AI interpretations are hypotheses; fictional narratives are not factual evidence.
- This release candidate requires further real-world testing before stable release.

---

## ગુજરાતી સારાંશ (Gujarati Summary)

### ઉમેર્યું
- Verified Evidence, Forensic Interpretation અને Fictional Narrative માટે ત્રણ અલગ output tiers.
- ખોટા અથવા ગાયબ citations માટે unverified warnings.
- Ollama error messages, Retry Ollama વિકલ્પ અને offline simulation status.
- Digital Memory Explorer ની file-count અને size limits.
- Markdown investigation report export.
- Streaming, redaction, citations અને terminal parsing માટે વધારાના regression tests.

### સુધાર્યું
- Redaction metadata માં secret fragments દેખાઈ જવાની સમસ્યા.
- Network chunks માં વહેંચાયેલા JSONL records ની parsing.
- છેલ્લે newline વગર આવતા JSONL record નું processing.
- સતત Ollama streaming દરમિયાન premature timeout.
- Duplicate simulation fallback.
- ખોટા citation પર verified source line highlight થવાની સમસ્યા.
- Punctuation સાથે સમાપ્ત થતા forensic panic patterns ની matching.

### સુરક્ષા
- સામાન્ય credentials, API keys, tokens, database URIs, private keys અને local paths માટે redaction coverage વિસ્તૃત કરી.
- Heuristic redaction ની મર્યાદાઓ દસ્તાવેજીકૃત કરી.
- Imported terminal commands execute થતા નથી; માત્ર text તરીકે parse થાય છે.

### ચકાસણી
- Automated tests: 36 પાસ, 0 નિષ્ફળ (રિપોર્ટ મુજબ).
- Lint: 0 warnings, 0 errors (રિપોર્ટ મુજબ).
- Production build: સફળ (રિપોર્ટ મુજબ).
- Dependency audit: 0 vulnerabilities નોંધાઈ (રિપોર્ટ મુજબ).
- Local Ollama streaming: manually verified હોવાનું રિપોર્ટમાં દર્શાવાયું છે.

### જાણીતી મર્યાદાઓ
- Custom, encoded અથવા obfuscated secrets redaction માંથી છૂટી શકે છે.
- Model શરૂ થવાનો સમય hardware અને model size પર આધારિત છે.
- AI interpretation hypothesis છે અને fictional narrative વાસ્તવિક પુરાવો નથી.
- Stable release પહેલાં વાસ્તવિક પરિસ્થિતિમાં વધુ testing જરૂરી છે.
