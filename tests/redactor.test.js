import test from 'node:test';
import assert from 'node:assert/strict';
import { redactSensitiveData } from '../src/utils/redactor.js';

test('Redaction Shield - wipes passwords, API keys, and Bearer tokens', () => {
  const sample = `
const apiKey = "sk-ant-api03-abcdefghijkl123456";
const password = "SuperSecretPassword123!";
const auth = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID";
  `;

  const { sanitized, redactionCount, redactions } = redactSensitiveData(sample);

  assert.ok(redactionCount >= 3);
  assert.ok(redactions.length > 0);
  assert.ok(!sanitized.includes('sk-ant-api03-abcdefghijkl123456'));
  assert.ok(!sanitized.includes('SuperSecretPassword123!'));
  assert.ok(!sanitized.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
  assert.ok(sanitized.includes('⟦REDACTED_ECTOPLASM⟧'));
});

test('Redaction Shield - sanitizes Windows and Unix user directory paths', () => {
  const log = `
Error: ENOENT: no such file or directory, open 'C:\\Users\\RAHUL\\Desktop\\secret_project\\config.json'
at Worker (/home/runner/work/secret_repo/src/index.js:42:15)
  `;

  const { sanitized, redactionCount } = redactSensitiveData(log);

  assert.ok(redactionCount >= 2);
  assert.ok(!sanitized.includes('C:\\Users\\RAHUL\\Desktop\\secret_project\\config.json'));
  assert.ok(!sanitized.includes('/home/runner/work/secret_repo/src/index.js'));
  assert.ok(sanitized.includes('⟦REDACTED_ECTOPLASM⟧'));
});

test('Redaction Shield - secret fragments never appear in redaction metadata or previews', () => {
  const secretSample = `
const fakeApiKey = "sk-ant-api03-abcdefghijkl123456789";
const myPasswd = "UltraSecretProductionPassword999!";
const dbUrl = "postgres://root:SuperClassifiedPass@localhost:5432/corp";
const userHome = "C:\\Users\\ConfidentialAdmin\\Desktop\\keys";
  `;

  const { redactions, redactionCount } = redactSensitiveData(secretSample);

  assert.ok(redactionCount >= 4);
  assert.ok(redactions.length > 0);

  // Strictly verify no raw secret substrings leaked into the metadata preview
  for (const item of redactions) {
    assert.equal(item.preview, '[REDACTED]');
    assert.ok(!item.preview.includes('sk-ant'));
    assert.ok(!item.preview.includes('UltraSecret'));
    assert.ok(!item.preview.includes('SuperClassified'));
    assert.ok(!item.preview.includes('ConfidentialAdmin'));
  }
});
