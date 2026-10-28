# GhostTrace AI test samples

Synthetic fixtures for local testing. All credentials are fake placeholders.

## Suggested test sequence
1. Open `01_sample_source_code.rs` with Memory Explorer.
2. Import `02_sample_terminal_history.txt` with Terminal Forensics. Confirm commands remain inert text.
3. Load `03_sample_crash_log.log` and inspect crash signatures, exit codes, and redaction.
4. Use `04_sample_incident_notes.md` to test evidence/hypothesis/narrative separation and report export.
5. To test Ollama failure handling, stop Ollama only when safe, then confirm the fallback banner and retry option appear.

## Expected results
- Fake keys and database URI should be redacted before inference.
- Panic/abort signatures and TODO/FIXME markers should be detected where supported.
- Repeated and potentially destructive terminal commands should be flagged as text.
- Verified evidence should only contain facts supported by the fixture.
- Hypotheses and fictional narrative must remain separately labeled.

**Safety:** Never execute commands copied from these fixtures.
