import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { checkOllamaStatus, streamGhostStory, simulateGhostStream } from '../src/utils/ollama.js';
import { parseManifestationTiers } from '../src/utils/manifestationParser.js';

const dummyPersona = {
  id: 'digital_archaeologist',
  name: 'Digital Archaeologist',
  systemInstruction: 'You are an archaeologist.',
};

const dummyForensics = {
  filename: 'kernel_panic.c',
  lineCount: 120,
  hauntingScore: 78,
  riskLevel: 'Class III',
  markers: [{ line: 12, type: 'FIXME', text: 'Race condition here' }],
  panics: [{ line: 88, type: 'panic!', snippet: 'kernel memory corruption' }],
  timestamps: [{ line: 5, time: '03:15 AM', snippet: '03:15:22' }],
};

test('Ollama Reliability - returns offline status when all endpoints are unreachable', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Connection refused: ECONNREFUSED');
  };

  try {
    const status = await checkOllamaStatus();
    assert.equal(status.online, false);
    assert.deepEqual(status.models, []);
    assert.equal(status.endpoint, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Ollama Reliability - recognizes custom endpoint and discovers models', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (url.includes('192.168.1.100')) {
      return {
        ok: true,
        json: async () => ({
          models: [{ name: 'gemma2:9b' }, { name: 'codellama:7b' }],
        }),
      };
    }
    throw new Error('Endpoint not matched');
  };

  try {
    const status = await checkOllamaStatus('http://192.168.1.100:11434');
    assert.equal(status.online, true);
    assert.equal(status.activeModel, 'gemma2:9b');
    assert.equal(status.isGemma, true);
    assert.equal(status.endpoint, 'http://192.168.1.100:11434');
    assert.equal(status.models.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Ollama Reliability - successful streaming inference triggers callbacks and returns complete output', async () => {
  const originalFetch = globalThis.fetch;
  const chunks = [
    JSON.stringify({ response: '## VERIFIED EVIDENCE\n- [Line 12] FIXME detected.\n' }) + '\n',
    JSON.stringify({ response: '## AI INTERPRETATION\n- Probable dead lock.\n' }) + '\n',
    JSON.stringify({ response: '## FICTIONAL NARRATIVE\nThe kernel sleeps forever.\n*Epitaph: "Silent bus."*' }) + '\n',
  ];

  let readIdx = 0;
  const mockStream = {
    getReader() {
      return {
        async read() {
          if (readIdx < chunks.length) {
            const encoder = new TextEncoder();
            const chunkValue = encoder.encode(chunks[readIdx++]);
            return { done: false, value: chunkValue };
          }
          return { done: true, value: undefined };
        },
      };
    },
  };

  globalThis.fetch = async () => ({
    ok: true,
    body: mockStream,
  });

  const tokensReceived = [];
  let sourceDetected = null;

  try {
    const result = await streamGhostStory({
      endpoint: '/ollama',
      model: 'gemma4:e4b',
      persona: dummyPersona,
      codeSnippet: 'int main() { return 0; }',
      forensics: dummyForensics,
      onToken: (fullText, token) => {
        tokensReceived.push(token);
      },
      onSourceChange: (type, model) => {
        sourceDetected = { type, model };
      },
    });

    assert.equal(sourceDetected?.type, 'ollama');
    assert.equal(sourceDetected?.model, 'gemma4:e4b');
    assert.ok(tokensReceived.length > 0);
    assert.ok(result.includes('Silent bus'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Ollama Reliability - missing model error (404) triggers onError and simulation fallback', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    json: async () => ({ error: 'model "gemma-missing" not found' }),
  });

  let capturedError = null;
  let sourceChanged = null;

  try {
    const result = await streamGhostStory({
      endpoint: '/ollama',
      model: 'gemma-missing',
      persona: dummyPersona,
      codeSnippet: 'int main() { return 0; }',
      forensics: dummyForensics,
      onError: (errMsg) => {
        capturedError = errMsg;
      },
      onSourceChange: (type) => {
        sourceChanged = type;
      },
      onToken: () => {},
    });

    assert.ok(capturedError.includes('model "gemma-missing" not found'));
    assert.equal(sourceChanged, 'simulation');
    // Result is the grounded 3-tier fallback simulation
    assert.ok(result.includes('## VERIFIED EVIDENCE'));
    assert.ok(result.includes('## AI INTERPRETATION'));
    assert.ok(result.includes('## FICTIONAL NARRATIVE'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Ollama Reliability - stream chunk with error JSON triggers onError and simulation fallback', async () => {
  const originalFetch = globalThis.fetch;
  const chunks = [
    JSON.stringify({ error: 'CUDA out of memory error during inference' }) + '\n',
  ];

  let readIdx = 0;
  const mockStream = {
    getReader() {
      return {
        async read() {
          if (readIdx < chunks.length) {
            const encoder = new TextEncoder();
            return { done: false, value: encoder.encode(chunks[readIdx++]) };
          }
          return { done: true, value: undefined };
        },
      };
    },
  };

  globalThis.fetch = async () => ({
    ok: true,
    body: mockStream,
  });

  let capturedError = null;
  let sourceChanged = null;

  try {
    const result = await streamGhostStory({
      endpoint: '/ollama',
      model: 'gemma4:e4b',
      persona: dummyPersona,
      codeSnippet: 'int main() { return 0; }',
      forensics: dummyForensics,
      onError: (errMsg) => {
        capturedError = errMsg;
      },
      onSourceChange: (type) => {
        sourceChanged = type;
      },
      onToken: () => {},
    });

    assert.ok(capturedError.includes('CUDA out of memory'));
    assert.equal(sourceChanged, 'simulation');
    assert.ok(result.includes('## VERIFIED EVIDENCE'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Ollama Reliability - empty stream triggers onError and simulation fallback', async () => {
  const originalFetch = globalThis.fetch;
  const mockStream = {
    getReader() {
      return {
        async read() {
          return { done: true, value: undefined };
        },
      };
    },
  };

  globalThis.fetch = async () => ({
    ok: true,
    body: mockStream,
  });

  let capturedError = null;
  let sourceChanged = null;

  try {
    const result = await streamGhostStory({
      endpoint: '/ollama',
      model: 'gemma4:e4b',
      persona: dummyPersona,
      codeSnippet: 'int main() { return 0; }',
      forensics: dummyForensics,
      onError: (errMsg) => {
        capturedError = errMsg;
      },
      onSourceChange: (type) => {
        sourceChanged = type;
      },
      onToken: () => {},
    });

    assert.ok(capturedError.includes('empty'));
    assert.equal(sourceChanged, 'simulation');
    assert.ok(result.includes('## VERIFIED EVIDENCE'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Ollama Reliability - timeout aborts stalled request and triggers simulation fallback', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        reject(new Error('Request aborted due to timeout'));
      });
    });
  };

  let capturedError = null;
  let sourceChanged = null;

  try {
    const result = await streamGhostStory({
      endpoint: '/ollama',
      model: 'gemma4:e4b',
      persona: dummyPersona,
      codeSnippet: 'int main() { return 0; }',
      forensics: dummyForensics,
      timeoutMs: 50, // Short timeout for test
      onError: (errMsg) => {
        capturedError = errMsg;
      },
      onSourceChange: (type) => {
        sourceChanged = type;
      },
      onToken: () => {},
    });

    assert.ok(capturedError.includes('timed out') || capturedError.includes('aborted'));
    assert.equal(sourceChanged, 'simulation');
    assert.ok(result.includes('## VERIFIED EVIDENCE'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Ollama Reliability - user abort cancels cleanly without triggering simulation fallback', async () => {
  const originalFetch = globalThis.fetch;
  const userController = new AbortController();

  globalThis.fetch = async (url, options) => {
    return new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => {
        const err = new Error('User cancelled');
        err.name = 'AbortError';
        reject(err);
      });
    });
  };

  let fallbackTriggered = false;

  try {
    const storyPromise = streamGhostStory({
      endpoint: '/ollama',
      model: 'gemma4:e4b',
      persona: dummyPersona,
      codeSnippet: 'int main() { return 0; }',
      forensics: dummyForensics,
      signal: userController.signal,
      onSourceChange: () => {
        fallbackTriggered = true;
      },
      onToken: () => {},
    });

    // Trigger abort immediately
    userController.abort();

    await assert.rejects(storyPromise, (err) => {
      return err.name === 'AbortError' || err.message.includes('User cancelled') || err.message.includes('Aborted');
    });

    assert.equal(fallbackTriggered, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Ollama Reliability - simulation fallback produces authentic 3-tier structure matching parser expectations', async () => {
  const result = await simulateGhostStream({
    persona: dummyPersona,
    forensics: dummyForensics,
    onToken: () => {},
  });

  const parsed = parseManifestationTiers(result, dummyForensics);
  assert.equal(parsed.hasStructuredTiers, true);
  assert.ok(parsed.evidenceText.includes('kernel_panic.c'));
  assert.ok(parsed.evidenceText.includes('[Line 12]'));
  assert.ok(parsed.evidenceText.includes('Race condition here'));
  assert.ok(parsed.evidenceText.includes('[Line 88]'));
  assert.ok(parsed.evidenceText.includes('kernel memory corruption'));
  assert.ok(parsed.interpretation.includes('pattern-based interpretation'));
  assert.ok(parsed.narrative.includes('Epitaph'));
});
