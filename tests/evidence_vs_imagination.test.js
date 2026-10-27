import test from 'node:test';
import assert from 'node:assert/strict';
import { parseManifestationTiers, formatGroundTruthEvidence, generateBaselineForensicDeduction } from '../src/utils/manifestationParser.js';

test('Evidence vs. Imagination - separates three tiers cleanly from structured model output', () => {
  const sampleOutput = `
## VERIFIED EVIDENCE
- [Line 21] FIXME: DO NOT MERGE TO MAIN. The cipher state leaks memory under high load.
- [Line 44] panic!("Cryptographic entropy failure: zero-state reached");
- Timestamp 03:42 AM recorded in headers.

## AI INTERPRETATION
- The code appears to have been abandoned during an unmanaged memory leak emergency.
- Probabilistic deduction: Developer attempted a hasty XOR bypass instead of fixing key rotation.

## FICTIONAL NARRATIVE
The midnight screen blinks. A cold specter lingers over line 21, doomed to re-run the corrupted loop for eternity.
*Epitaph: "The cipher locks forever."*
  `.trim();

  const dummyForensics = {
    filename: 'vault_cipher.rs',
    lineCount: 65,
    hauntingScore: 88,
    riskLevel: 'Class IV',
    markers: [{ line: 21, type: 'FIXME', text: 'DO NOT MERGE' }],
    panics: [{ line: 44, type: 'panic!', snippet: 'Cryptographic entropy failure' }],
    timestamps: [{ line: 14, time: '03:42 AM', snippet: '03:42:19 UTC' }],
  };

  const tiers = parseManifestationTiers(sampleOutput, dummyForensics);

  assert.equal(tiers.hasStructuredTiers, true);
  assert.ok(tiers.evidenceText.includes('[Line 21]'));
  assert.ok(tiers.evidenceText.includes('[Line 44]'));
  assert.ok(tiers.interpretation.includes('Probabilistic deduction'));
  assert.ok(tiers.narrative.includes('cold specter'));
  assert.ok(tiers.narrative.includes('Epitaph'));
});

test('Evidence vs. Imagination - unformatted stream falls back safely without hallucinating ground-truth', () => {
  const rawStream = 'The ghost wanders through the corrupted heap.';
  const dummyForensics = {
    filename: 'unformatted.rs',
    lineCount: 30,
    hauntingScore: 40,
    riskLevel: 'Class II',
    markers: [{ line: 5, type: 'TODO', text: 'fix later' }],
    panics: [],
    timestamps: [],
  };

  const tiers = parseManifestationTiers(rawStream, dummyForensics);

  assert.equal(tiers.hasStructuredTiers, false);
  // Ground truth evidence is strictly derived from real forensic data
  assert.ok(tiers.evidenceText.includes('Artifact: unformatted.rs (30 lines)'));
  assert.ok(tiers.evidenceText.includes('[Line 5] TODO: "fix later"'));
  // Narrative retains the raw creative text
  assert.equal(tiers.narrative, rawStream);
  // Interpretation is clearly labeled as deduction
  assert.ok(tiers.interpretation.length > 0);
});

test('Evidence vs. Imagination - multi-file citation regex extracts both file and line', () => {
  const text = 'Notice the flaw at [vault_cipher.rs:Line 42] and also in [Line 15].';
  const citationRegex = /(?:\[|\b)(?:([a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+):)?([Ll]ine\s+(\d+))\]?/g;

  const matches = [...text.matchAll(citationRegex)];
  assert.equal(matches.length, 2);

  // First citation has file prefix
  assert.equal(matches[0][1], 'vault_cipher.rs');
  assert.equal(matches[0][3], '42');

  // Second citation has no file prefix
  assert.equal(matches[1][1], undefined);
  assert.equal(matches[1][3], '15');
});

test('Evidence vs. Imagination - formatGroundTruthEvidence and generateBaselineForensicDeduction format factual deductions', () => {
  const mockForensics = {
    filename: 'core.rs',
    lineCount: 120,
    hauntingScore: 85,
    riskLevel: 'SEVERE',
    markers: [{ line: 12, type: 'TODO', text: 'refactor lock' }],
    panics: [{ line: 99, type: 'panic!', snippet: 'deadlock' }],
    timestamps: [{ line: 3, time: '03:15 AM', snippet: 'late patch' }],
  };

  const evidence = formatGroundTruthEvidence(mockForensics);
  assert.ok(evidence.includes('Artifact: core.rs (120 lines)'));
  assert.ok(evidence.includes('[Line 12] TODO: "refactor lock"'));
  assert.ok(evidence.includes('[Line 99] panic!: "deadlock"'));

  const deduction = generateBaselineForensicDeduction(mockForensics);
  assert.ok(deduction.includes('Line 99'));
  assert.ok(deduction.includes('technical debt markers'));
});

