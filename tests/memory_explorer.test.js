import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeMemoryArchive,
  resolveCitationTarget,
  isTextArtifact,
  EXPLORER_LIMITS,
} from '../src/utils/memoryExplorer.js';

test('Digital Memory Explorer - enforces file-count limit (max 30 files)', () => {
  const mockFiles = [];
  for (let i = 0; i < 40; i++) {
    mockFiles.push({
      name: `script_${i}.js`,
      path: `src/scripts/script_${i}.js`,
      content: `// TODO: Task ${i}\nconsole.log(${i});`,
      size: 50,
    });
  }

  const result = analyzeMemoryArchive(mockFiles);

  assert.equal(result.totalFiles, EXPLORER_LIMITS.MAX_FILE_COUNT);
  assert.equal(result.files.length, 30);
  assert.equal(result.manifest.length, 30);
  assert.ok(result.warnings.some((w) => w.includes('File count exceeded')));
});

test('Digital Memory Explorer - enforces total-size limit and single-file size limit', () => {
  const hugeFile = {
    name: 'huge_dump.log',
    path: 'logs/huge_dump.log',
    content: 'A'.repeat(600 * 1024), // 600KB (exceeds single file 500KB limit)
    size: 600 * 1024,
  };
  const normalFile = {
    name: 'normal.py',
    path: 'src/normal.py',
    content: '# TODO: refactor\nprint("hello")',
    size: 50,
  };

  const result = analyzeMemoryArchive([hugeFile, normalFile]);

  assert.equal(result.totalFiles, 1);
  assert.equal(result.files[0].filename, 'normal.py');
  assert.equal(result.manifest[0].path, 'src/normal.py');
  assert.ok(result.warnings.some((w) => w.includes('exceeds single file limit')));
});

test('Digital Memory Explorer - rejects binary files with null bytes and empty files', () => {
  const binaryFile = {
    name: 'compiled.wasm',
    path: 'bin/compiled.wasm',
    content: 'WASM\x00\x00\x00\x01\x00\x00',
    size: 10,
  };
  const emptyFile = {
    name: 'empty.rs',
    path: 'src/empty.rs',
    content: '   \n  \t ',
    size: 6,
  };
  const validFile = {
    name: 'valid.rs',
    path: 'src/valid.rs',
    content: '// FIXME: handle error\nfn main() { panic!("stop"); }',
    size: 55,
  };

  const result = analyzeMemoryArchive([binaryFile, emptyFile, validFile]);

  assert.equal(isTextArtifact('compiled.wasm', 'WASM\x00'), false);
  assert.equal(isTextArtifact('valid.rs', 'fn main() {}'), true);
  assert.equal(result.totalFiles, 1);
  assert.equal(result.files[0].filename, 'valid.rs');
  assert.ok(result.warnings.some((w) => w.includes('non-text or binary')));
  assert.ok(result.warnings.some((w) => w.includes('empty artifact')));
});

test('Digital Memory Explorer - automatically redacts credentials across all ingested files', () => {
  const filesWithSecrets = [
    {
      name: 'auth_config.js',
      path: 'src/config/auth_config.js',
      content: 'const token = "secret_token_12345678";\n// TODO: rotate',
      size: 60,
    },
    {
      name: 'env_backup.env',
      path: 'env_backup.env',
      content: 'API_KEY="sk-live-abcdef123456"\nAWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"',
      size: 80,
    },
  ];

  const result = analyzeMemoryArchive(filesWithSecrets);

  assert.equal(result.totalFiles, 2);
  assert.ok(result.totalRedactions > 0);
  assert.ok(!result.files[0].redactedData.sanitized.includes('secret_token_12345678'));
  assert.ok(result.files[0].redactedData.sanitized.includes('REDACTED_ECTOPLASM'));
  assert.ok(result.combinedRedacted.includes('REDACTED_ECTOPLASM'));
  assert.ok(!result.combinedRedacted.includes('sk-live-abcdef123456'));
});

test('Digital Memory Explorer - builds combined artifact with exact manifest line arithmetic', () => {
  const rawFiles = [
    {
      name: 'first.js',
      path: 'src/first.js',
      content: 'line 1\nline 2\nline 3', // 3 lines
      size: 25,
    },
    {
      name: 'second.js',
      path: 'src/utils/second.js',
      content: 'line A\nline B', // 2 lines
      size: 20,
    },
  ];

  const result = analyzeMemoryArchive(rawFiles);
  assert.equal(result.totalFiles, 2);
  assert.equal(result.manifest.length, 2);

  // File 1 Manifest Verification
  const m1 = result.manifest[0];
  assert.equal(m1.path, 'src/first.js');
  assert.equal(m1.headerLine, 1);
  assert.equal(m1.contentStartLine, 2);
  assert.equal(m1.contentEndLine, 4);
  assert.equal(m1.lineCount, 3);

  // File 2 Manifest Verification:
  // Line 5 is blank separator between files
  // Line 6 is "===== FILE: src/utils/second.js ====="
  const m2 = result.manifest[1];
  assert.equal(m2.path, 'src/utils/second.js');
  assert.equal(m2.headerLine, 6);
  assert.equal(m2.contentStartLine, 7);
  assert.equal(m2.contentEndLine, 8);
  assert.equal(m2.lineCount, 2);

  const lines = result.combinedRedacted.split('\n');
  assert.equal(lines[0], '===== FILE: src/first.js =====');
  assert.equal(lines[1], 'line 1');
  assert.equal(lines[2], 'line 2');
  assert.equal(lines[3], 'line 3');
  assert.equal(lines[4], ''); // blank line separator
  assert.equal(lines[5], '===== FILE: src/utils/second.js =====');
  assert.equal(lines[6], 'line A');
  assert.equal(lines[7], 'line B');
});

test('Digital Memory Explorer - resolveCitationTarget correctly maps file-relative citations', () => {
  const manifest = [
    {
      path: 'src/controllers/auth.js',
      filename: 'auth.js',
      headerLine: 1,
      contentStartLine: 2,
      contentEndLine: 11,
      lineCount: 10,
    },
    {
      path: 'tests/controllers/auth.js', // duplicate basename!
      filename: 'auth.js',
      headerLine: 13,
      contentStartLine: 14,
      contentEndLine: 23,
      lineCount: 10,
    },
    {
      path: 'src/utils/cipher.rs',
      filename: 'cipher.rs',
      headerLine: 25,
      contentStartLine: 26,
      contentEndLine: 45,
      lineCount: 20,
    },
  ];
  const totalCombinedLines = 45;

  // 1. First file: Line 1 should map to contentStartLine (line 2)
  const res1 = resolveCitationTarget(
    { lineNum: 1, filePrefix: 'src/controllers/auth.js' },
    manifest,
    totalCombinedLines
  );
  assert.equal(res1.targetLine, 2);
  assert.equal(res1.isClamped, false);

  // 2. First file: Line 5 should map to 2 + 4 = 6
  const res2 = resolveCitationTarget(
    { lineNum: 5, filePrefix: 'src/controllers/auth.js' },
    manifest,
    totalCombinedLines
  );
  assert.equal(res2.targetLine, 6);
  assert.equal(res2.isClamped, false);

  // 3. Later file in manifest: cipher.rs Line 1 should map to 26
  const res3 = resolveCitationTarget(
    { lineNum: 1, filePrefix: 'src/utils/cipher.rs' },
    manifest,
    totalCombinedLines
  );
  assert.equal(res3.targetLine, 26);
  assert.equal(res3.isClamped, false);

  // 4. Later file: cipher.rs Line 20 should map to contentEndLine (line 45)
  const res4 = resolveCitationTarget(
    { lineNum: 20, filePrefix: 'src/utils/cipher.rs' },
    manifest,
    totalCombinedLines
  );
  assert.equal(res4.targetLine, 45);
  assert.equal(res4.isClamped, false);

  // 5. Duplicate basename resolution with full relative path
  const resTestAuth = resolveCitationTarget(
    { lineNum: 3, filePrefix: 'tests/controllers/auth.js' },
    manifest,
    totalCombinedLines
  );
  assert.equal(resTestAuth.targetLine, 14 + 2); // line 16

  // 6. Path separators: Windows backslashes normalized to forward slashes
  const resWinSlash = resolveCitationTarget(
    { lineNum: 4, filePrefix: 'src\\utils\\cipher.rs' },
    manifest,
    totalCombinedLines
  );
  assert.equal(resWinSlash.targetLine, 26 + 3); // line 29
  assert.equal(resWinSlash.isClamped, false);

  // 7. Out-of-bounds line in file (e.g. line 99 in 10-line file) clamps to contentEndLine
  const resOOB = resolveCitationTarget(
    { lineNum: 99, filePrefix: 'src/controllers/auth.js' },
    manifest,
    totalCombinedLines
  );
  assert.equal(resOOB.targetLine, 11); // clamped to contentEndLine
  assert.equal(resOOB.isClamped, true);

  // 8. Line < 1 clamps to contentStartLine
  const resNegative = resolveCitationTarget(
    { lineNum: 0, filePrefix: 'src/controllers/auth.js' },
    manifest,
    totalCombinedLines
  );
  assert.equal(resNegative.targetLine, 2);
  assert.equal(resNegative.isClamped, true);

  // 9. Missing file gracefully falls back and sets notFound
  const resMissing = resolveCitationTarget(
    { lineNum: 10, filePrefix: 'non_existent.js' },
    manifest,
    totalCombinedLines
  );
  assert.equal(resMissing.targetLine, 10);
  assert.equal(resMissing.notFound, true);

  // 10. No file prefix [Line 15]: "Do not add offsets to a line number that already refers to the combined artifact"
  const resNoPrefix = resolveCitationTarget(
    { lineNum: 15, filePrefix: null },
    manifest,
    totalCombinedLines
  );
  assert.equal(resNoPrefix.targetLine, 15); // Exactly 15, NO offset added!
  assert.equal(resNoPrefix.isClamped, false);
});
