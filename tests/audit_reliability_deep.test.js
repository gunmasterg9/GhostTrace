import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeEvidence } from '../src/utils/forensics.js';
import { redactSensitiveData } from '../src/utils/redactor.js';
import { parseManifestationTiers, formatGroundTruthEvidence } from '../src/utils/manifestationParser.js';
import { resolveCitationTarget } from '../src/utils/memoryExplorer.js';
import { analyzeTerminalHistory } from '../src/utils/terminalForensics.js';

test('Workflow & Reliability - complete end-to-end trace processing lifecycle', () => {
  // Step 1: Input raw trace containing secrets, panics, and directives
  const rawInput = `
// config loader
const DB_CONN = "postgres://admin:SuperSecretPass123@prod-db.internal:5432/corp";
// TODO: Refactor connection retry loop
// FIXME: Memory leak in worker pool
panic!("Fatal connection exhaustion at 03:30 AM");
  `.trim();

  // Step 2: Client-side privacy redaction before any inference
  const { sanitized, redactionCount, redactions } = redactSensitiveData(rawInput);
  assert.ok(redactionCount >= 1);
  assert.ok(!sanitized.includes('SuperSecretPass123'));
  assert.ok(sanitized.includes('⟦REDACTED_ECTOPLASM⟧'));
  assert.ok(redactions.length >= 1);

  // Step 3: Deterministic Forensic Analysis on sanitized text
  const forensics = analyzeEvidence(sanitized, 'config_loader.js');
  assert.equal(forensics.filename, 'config_loader.js');
  assert.equal(forensics.lineCount, 5);
  assert.ok(forensics.hauntingScore > 30);
  assert.ok(forensics.markers.length >= 2);
  assert.ok(forensics.panics.length >= 1);
  assert.ok(forensics.timestamps.length >= 1);

  // Step 4: Verify Ground-truth formatting matches parser output
  const groundTruth = formatGroundTruthEvidence(forensics);
  assert.ok(groundTruth.includes('config_loader.js (5 lines)'));
  assert.ok(groundTruth.includes('TODO'));
  assert.ok(groundTruth.includes('FIXME'));
  assert.ok(groundTruth.includes('panic!'));

  // Step 5: Verify 3-tier separation
  const mockModelOutput = `
## VERIFIED EVIDENCE
- [Line 4] TODO: Refactor connection retry loop
- [Line 5] FIXME: Memory leak in worker pool
- [Line 6] panic!: Fatal connection exhaustion

## AI INTERPRETATION
- The system suffered from unmanaged database connection pooling exhaustion.

## FICTIONAL NARRATIVE
In the darkened server room at 03:30 AM, phantom threads kept hammering the closed socket.
*Epitaph: "The pool drained dry."*
  `.trim();

  const tiers = parseManifestationTiers(mockModelOutput, forensics);
  assert.equal(tiers.hasStructuredTiers, true);
  // Ground truth strictly uses parser evidence
  assert.ok(tiers.evidenceText.includes('config_loader.js'));
  assert.ok(tiers.interpretation.includes('connection pooling exhaustion'));
  assert.ok(tiers.narrative.includes('phantom threads'));
  assert.ok(tiers.narrative.includes('Epitaph'));

  // Step 6: Verify Citation Resolution
  const citation = resolveCitationTarget({ lineNum: 5, filePrefix: null }, [], forensics.lineCount);
  assert.equal(citation.targetLine, 5);
  assert.equal(citation.isClamped, false);
});

test('Forensics Edge Cases - handles empty, null, undefined, and non-ASCII gracefully', () => {
  const emptyRes = analyzeEvidence('', 'empty.txt');
  assert.equal(emptyRes.lineCount, 0);
  assert.equal(emptyRes.hauntingScore, 0);
  assert.equal(emptyRes.markers.length, 0);

  const nullRes = analyzeEvidence(null, 'null.txt');
  assert.equal(nullRes.lineCount, 0);
  assert.equal(nullRes.hauntingScore, 0);

  const undefRes = analyzeEvidence(undefined, 'undef.txt');
  assert.equal(undefRes.lineCount, 0);

  // Non-ASCII, emojis, unicode corruption
  const corruptedContent = '💀\u0000\u0007\uFFFF // TODO: Fix corrupted stream\npanic!("Null byte leak");';
  const corruptRes = analyzeEvidence(corruptedContent, 'corrupt.bin');
  assert.equal(corruptRes.lineCount, 2);
  assert.equal(corruptRes.markers.length, 1);
  assert.equal(corruptRes.panics.length, 1);
});

test('Forensics Edge Cases - handles very large line counts without degradation', () => {
  const largeArray = [];
  for (let i = 1; i <= 3000; i++) {
    if (i === 1500) {
      largeArray.push('// FIXME: Race condition in batch scheduler');
    } else if (i === 2800) {
      largeArray.push('panic!("OOM killed at 04:00 AM");');
    } else {
      largeArray.push(`const item_${i} = ${i};`);
    }
  }
  const largeContent = largeArray.join('\n');
  const result = analyzeEvidence(largeContent, 'large_file.js');

  assert.equal(result.lineCount, 3000);
  assert.equal(result.markers.length, 1);
  assert.equal(result.markers[0].line, 1500);
  assert.equal(result.panics.length, 1);
  assert.equal(result.panics[0].line, 2800);
  assert.equal(result.timestamps.length, 1);
});

test('Security & Privacy - Redaction Shield wipes high-entropy secrets and private keys', () => {
  const secretsLog = `
AWS_SECRET_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE"
GITHUB_TOKEN="ghp_1234567890abcdefghijklmnopqrstuvwxyz"
OPENAI_KEY="sk-proj-abc1234567890defghijklmnopqrstuvwxyz"
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeak"
DATABASE_URL="mongodb+srv://admin:P@ssw0rd99!@cluster0.abc.mongodb.net/test"
USER_WIN="C:\\Users\\Administrator\\AppData\\Local\\Temp\\key.pem"
USER_UNIX="/home/developer/.ssh/id_rsa"
  `;

  const { sanitized, redactions, redactionCount } = redactSensitiveData(secretsLog);
  assert.ok(redactionCount >= 5);
  assert.ok(!sanitized.includes('AKIAIOSFODNN7EXAMPLE'));
  assert.ok(!sanitized.includes('ghp_1234567890abcdefghijklmnopqrstuvwxyz'));
  assert.ok(!sanitized.includes('sk-proj-abc1234567890defghijklmnopqrstuvwxyz'));
  assert.ok(!sanitized.includes('P@ssw0rd99!'));
  assert.ok(!sanitized.includes('C:\\Users\\Administrator'));
  assert.ok(!sanitized.includes('/home/developer'));
  assert.ok(redactions.length >= 5);
});

test('Security & Privacy - Terminal commands are inert and strictly parsed without execution', () => {
  const dangerousCommands = `
# Developer session log
$ rm -rf / --no-preserve-root
$ DROP DATABASE customers_production;
$ git push origin main --force
$ dd if=/dev/zero of=/dev/sda bs=1M
$ :(){ :|:& };:
$ chmod -R 777 /etc/ssl
  `;

  const termData = analyzeTerminalHistory(dangerousCommands, 'bash_history.log');
  assert.equal(termData.filename, 'bash_history.log');
  assert.ok(termData.totalCommands >= 5);
  assert.ok(termData.dangerousCommands.length >= 3);

  // Verify dangerous signatures are identified safely as text
  assert.equal(typeof termData.dangerousCommands[0].command, 'string');
  assert.ok(termData.dangerousCommands.some((c) => c.label.includes('Destructive Deletion')));
  assert.ok(termData.dangerousCommands.some((c) => c.label.includes('Database Purge')));
  assert.ok(termData.dangerousCommands.some((c) => c.label.includes('Raw Disk Write')));
});
