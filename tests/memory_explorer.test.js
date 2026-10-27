import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMemoryArchive, isTextArtifact, EXPLORER_LIMITS } from '../src/utils/memoryExplorer.js';

test('Digital Memory Explorer - enforces file-count limit (max 30 files)', () => {
  const mockFiles = [];
  for (let i = 0; i < 40; i++) {
    mockFiles.push({
      name: `script_${i}.js`,
      content: `// TODO: Task ${i}\nconsole.log(${i});`,
      size: 50,
    });
  }

  const result = analyzeMemoryArchive(mockFiles);

  assert.equal(result.totalFiles, EXPLORER_LIMITS.MAX_FILE_COUNT);
  assert.equal(result.files.length, 30);
  assert.ok(result.warnings.some((w) => w.includes('File count exceeded')));
});

test('Digital Memory Explorer - enforces total-size limit and single-file size limit', () => {
  const hugeFile = {
    name: 'huge_dump.log',
    content: 'A'.repeat(600 * 1024), // 600KB (exceeds single file 500KB limit)
    size: 600 * 1024,
  };
  const normalFile = {
    name: 'normal.py',
    content: '# TODO: refactor\nprint("hello")',
    size: 50,
  };

  const result = analyzeMemoryArchive([hugeFile, normalFile]);

  assert.equal(result.totalFiles, 1);
  assert.equal(result.files[0].filename, 'normal.py');
  assert.ok(result.warnings.some((w) => w.includes('exceeds single file limit')));
});

test('Digital Memory Explorer - rejects binary files with null bytes and empty files', () => {
  const binaryFile = {
    name: 'compiled.wasm',
    content: 'WASM\x00\x00\x00\x01\x00\x00',
    size: 10,
  };
  const emptyFile = {
    name: 'empty.rs',
    content: '   \n  \t ',
    size: 6,
  };
  const validFile = {
    name: 'valid.rs',
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
      content: 'const token = "secret_token_12345678";\n// TODO: rotate',
      size: 60,
    },
    {
      name: 'env_backup.env',
      content: 'API_KEY="sk-live-abcdef123456"\nAWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"',
      size: 80,
    },
  ];

  const result = analyzeMemoryArchive(filesWithSecrets);

  assert.equal(result.totalFiles, 2);
  assert.ok(result.totalRedactions > 0);
  // Ensure the sanitized content was passed into forensicData
  assert.ok(!result.files[0].redactedData.sanitized.includes('secret_token_12345678'));
  assert.ok(result.files[0].redactedData.sanitized.includes('REDACTED_ECTOPLASM'));
});
