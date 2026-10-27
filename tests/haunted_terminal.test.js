import test from 'node:test';
import assert from 'node:assert/strict';
import { isTerminalHistoryFile, analyzeTerminalHistory } from '../src/utils/terminalForensics.js';

test('Haunted Terminal - correctly identifies terminal history filenames and shell prompts', () => {
  assert.equal(isTerminalHistoryFile('.bash_history', ''), true);
  assert.equal(isTerminalHistoryFile('zsh_history', ''), true);
  assert.equal(isTerminalHistoryFile('ConsoleHost_history.txt', ''), true);
  assert.equal(isTerminalHistoryFile('regular_code.rs', 'fn main() {}'), false);

  const shellOutput = `
$ git status
$ git commit -m "fix"
$ npm test
  `;
  assert.equal(isTerminalHistoryFile('console_dump.txt', shellOutput), true);
});

test('Haunted Terminal - parses commands as inert text without executing them', () => {
  const terminalLog = `
#1635649339
git checkout main
#1635649350
git pull origin main
#1635649360
rm -rf /var/log/*
#1635649370
exit 137
#1635649380
sudo kill -9 4128
#1635649390
npm run dev
#1635649400
npm run dev
#1635649410
npm run dev
  `.trim();

  const forensics = analyzeTerminalHistory(terminalLog, '.bash_history');

  assert.equal(forensics.isTerminal, true);
  assert.ok(forensics.totalCommands >= 7);

  // Destructive commands safely flagged
  const dangerousLabels = forensics.dangerousCommands.map((d) => d.label);
  assert.ok(dangerousLabels.some((l) => l.includes('Destructive Deletion')));
  assert.ok(dangerousLabels.some((l) => l.includes('Forced Process Termination')));

  // Exit failures caught
  assert.ok(forensics.exitFailures.some((e) => e.code === '137'));

  // Frantic loops caught (npm run dev typed 3 times)
  const loop = forensics.repeatedLoops.find((l) => l.command === 'npm run dev');
  assert.ok(loop);
  assert.equal(loop.count, 3);
});
