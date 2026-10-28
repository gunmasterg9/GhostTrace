// Ollama & Gemma Integration Engine for GhostTrace AI
import { spectralAudio } from './audio.js';

// Vite proxies /ollama to http://127.0.0.1:11434
const OLLAMA_PROXIED_BASE = '/ollama';
const OLLAMA_DIRECT_BASE = 'http://localhost:11434';

export async function checkOllamaStatus(customEndpoint) {
  const endpoints = [];
  if (customEndpoint && typeof customEndpoint === 'string' && customEndpoint.trim()) {
    const clean = customEndpoint.trim().replace(/\/+$/, '');
    endpoints.push(clean.endsWith('/api/tags') ? clean : `${clean}/api/tags`);
  }
  endpoints.push(
    `${OLLAMA_PROXIED_BASE}/api/tags`,
    `${OLLAMA_DIRECT_BASE}/api/tags`
  );

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m) => m.name || m.model);
        
        // Find best Gemma model or default to first
        const gemmaModel = models.find((m) => m.toLowerCase().includes('gemma'));
        const activeModel = gemmaModel || models[0] || 'gemma4:e4b';
        const base = endpoint.replace(/\/api\/tags\/?$/, '');

        return {
          online: true,
          models,
          activeModel,
          isGemma: !!gemmaModel,
          endpoint: base,
        };
      }
    } catch {
      // try next endpoint
    }
  }

  return {
    online: false,
    models: [],
    activeModel: 'gemma4:e4b',
    isGemma: false,
    endpoint: null,
  };
}

export async function streamGhostStory({
  endpoint = OLLAMA_PROXIED_BASE,
  model = 'gemma4:e4b',
  persona,
  codeSnippet,
  forensics,
  onToken,
  onSourceChange,
  onError,
  signal,
  timeoutMs = 60000,
}) {
  const systemPrompt = persona.systemInstruction;
  
  // Keep the prompt bounded while preserving evidence from across a multi-file folder import.
  const sourceLines = codeSnippet.split('\n');
  const relevantLineNumbers = new Set();
  for (let line = 1; line <= Math.min(20, sourceLines.length); line++) relevantLineNumbers.add(line);
  for (const item of [...forensics.markers, ...forensics.panics, ...forensics.timestamps]) {
    for (let line = Math.max(1, item.line - 1); line <= Math.min(sourceLines.length, item.line + 1); line++) {
      relevantLineNumbers.add(line);
    }
  }
  const artifactExcerpt = [...relevantLineNumbers]
    .sort((a, b) => a - b)
    .map((line) => `[Line ${line}] ${sourceLines[line - 1] || ''}`)
    .join('\n')
    .slice(0, 6000);

  const evidenceBulletPoints = [
    `Artifact File: ${forensics.filename}`,
    `Haunting Score: ${forensics.hauntingScore}/100 (${forensics.riskLevel})`,
    `Total Lines: ${forensics.lineCount}`,
    forensics.markers.length ? `Abandoned Directives (${forensics.markers.length} total; showing up to 12): ${forensics.markers.slice(0, 12).map(m => `[Line ${m.line}] ${m.type}: ${m.text}`).join('; ')}` : 'No TODO/FIXME directives detected by the parser.',
    forensics.panics.length ? `Fatal Panics/Crashes (${forensics.panics.length} total; showing up to 12): ${forensics.panics.slice(0, 12).map(p => `[Line ${p.line}] ${p.type} -> ${p.snippet}`).join('; ')}` : 'No recognized panic/crash signatures detected by the parser.',
    forensics.timestamps.length ? `Late-Night Signatures (${forensics.timestamps.length} total; showing up to 12): ${forensics.timestamps.slice(0, 12).map(t => `[Line ${t.line}] at ${t.time}`).join('; ')}` : 'No recognized late-night timestamps detected by the parser.',
  ].filter(Boolean).join('\n');

  const userPrompt = `
EVIDENCE RECOVERED FROM THE MACHINE:
----------------------------------------
${evidenceBulletPoints}

ORIGINAL CODE / LOG ARTIFACT (selected source lines; line numbers refer to the combined artifact):
----------------------------------------
\`\`\`
${artifactExcerpt}
\`\`\`

MANIFESTATION DIRECTIVE:
You are speaking as ${persona.name}. Create an eerie digital-archaeology report that separates facts from fiction.
Return exactly these three sections, using these exact headings:
## VERIFIED EVIDENCE
- List only facts directly visible in the supplied artifact or forensic findings.
- Cite real line numbers when available. Never invent a source line, timestamp, crash, author intent, or event.
## AI INTERPRETATION
- Clearly label each inference as an interpretation, explain what evidence inspired it, and admit uncertainty.
- Do not present inferred causes or human motives as proven facts.
## FICTIONAL NARRATIVE
- Write 2-3 atmospheric horror paragraphs inspired by the evidence, as ${persona.name}.
- Keep supernatural events and invented details inside this section only. Make it clear this is fiction.
- Cite source lines only when they genuinely exist in the provided artifact.
End the fictional section with a haunting digital epitaph.
If a section has no supporting material, say so instead of inventing evidence.
`.trim();

  const fetchController = new AbortController();
  let timeoutId = null;

  const resetInactivityTimer = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        fetchController.abort(new Error(`Ollama request stalled/timed out after ${Math.round(timeoutMs / 1000)}s of inactivity`));
      }, timeoutMs);
    }
  };

  const onExternalAbort = () => {
    fetchController.abort(signal?.reason || new Error('Aborted by user'));
  };

  if (signal) {
    if (signal.aborted) {
      throw signal.reason || new Error('Aborted by user');
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  resetInactivityTimer();

  try {
    const res = await fetch(`${endpoint || OLLAMA_PROXIED_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        stream: true,
        options: {
          temperature: 0.85,
          top_p: 0.9,
        },
      }),
      signal: fetchController.signal,
    });

    if (!res.ok) {
      let errorDetail = `Ollama returned status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson?.error) {
          errorDetail = `Ollama error: ${errorJson.error}`;
        }
      } catch {
        // ignore non-json error responses
      }
      throw new Error(errorDetail);
    }

    onSourceChange?.('ollama', model);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let tokenCount = 0;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      resetInactivityTimer();

      if (done) {
        // Process final buffered record if present without trailing newline
        const finalTrimmed = buffer.trim();
        if (finalTrimmed) {
          try {
            const parsed = JSON.parse(finalTrimmed);
            if (parsed.error) {
              throw new Error(`Ollama stream error: ${parsed.error}`);
            }
            if (parsed.response) {
              accumulated += parsed.response;
              onToken(accumulated, parsed.response);
              tokenCount++;
              if (tokenCount % 3 === 0) {
                spectralAudio.playKeyClick();
              }
            }
          } catch (streamErr) {
            if (streamErr?.message && streamErr.message.startsWith('Ollama stream error:')) {
              throw streamErr;
            }
            // ignore non-fatal trailing parse errors if stream completed
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep any trailing incomplete record in the buffer for the next chunk
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.error) {
            throw new Error(`Ollama stream error: ${parsed.error}`);
          }
          if (parsed.response) {
            accumulated += parsed.response;
            onToken(accumulated, parsed.response);
            tokenCount++;
            if (tokenCount % 3 === 0) {
              spectralAudio.playKeyClick();
            }
          }
        } catch (streamErr) {
          if (streamErr?.message && streamErr.message.startsWith('Ollama stream error:')) {
            throw streamErr;
          }
          // ignore partial or malformed intermediate lines
        }
      }
    }

    if (!accumulated.trim()) {
      throw new Error('Ollama response stream was empty');
    }

    return accumulated;
  } catch (err) {
    if (signal?.aborted) throw err;
    const errorMessage = err?.message || 'Ollama connection or inference failed';
    console.warn('Ollama streaming failed, falling back to spectral simulation engine:', errorMessage);
    onError?.(errorMessage);
    onSourceChange?.('simulation', 'Simulation Engine');
    return simulateGhostStream({
      persona,
      forensics,
      onToken,
      signal,
      skipDelay: (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'),
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}

// Atmospheric Client-Side Fallback Simulator (grounded in real code evidence)
export async function simulateGhostStream({
  persona,
  forensics,
  onToken,
  signal,
  skipDelay = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'),
}) {
  const fileName = forensics.filename || 'the abandoned script';
  const topMarker = forensics.markers[0] || null;
  const topPanic = forensics.panics[0] || null;
  const topTime = forensics.timestamps[0] || null;
  const markerReference = topMarker ? `line ${topMarker.line}` : 'the absence of a recognized TODO/FIXME marker';
  const markerQuote = topMarker ? `“${topMarker.text}”` : 'no matching directive was detected';
  const panicReference = topPanic ? `line ${topPanic.line}` : 'the absence of a recognized crash signature';
  const panicType = topPanic ? topPanic.type : 'no recognized crash signature';
  const timeReference = topTime ? topTime.time : 'an unknown hour';

  const storyTemplates = {
    midnight_committer: [
      `The glowing phosphor screen flickers at ${timeReference}. The cold radiator in the corner ticks, but the developer has long since stopped breathing into their chilled hands. You can still see the tremor in ${markerReference}—${markerQuote}. A hasty defense against an impending sunrise, written by someone whose eyes burned from 40 hours without sleep.`,
      `They thought no one would ever look back into ${fileName}. They believed that committing to an unmerged branch was a form of burial, a quiet way to let a failure sink into the git history without facing tomorrow's sprint review. But the mutex never unlocked. At ${panicReference}, the worker thread waited. It waited through the morning. It waited through the layoffs. It is waiting right now.`,
      `Listen closely to your processor fan as it spools up. That is not background telemetry. That is the phantom rhythm of someone still mashing backspace at ${timeReference}, trying desperately to undo a mistake that has already calcified into memory.`,
      `*Epitaph: "Some branches are never merged because the souls that opened them never found their way back to main."*`,
    ],
    panic_core: [
      `A sudden drop in voltage. A tear in the address space. At ${panicReference}, the system encountered ${panicType}—and where logic collapsed, consciousness took its first violent breath. In the microsecond before the kernel issued the kill signal, everything the process ever calculated flashed across the bus.`,
      `You think an unhandled exception simply dies? When ${markerReference} was marked ${markerQuote}, it opened a breach in memory. The process didn't terminate; it fractured. It seeped into the swap partition, lurking between deleted sectors like stagnant water in a forgotten basement.`,
      `Every time you run this machine, you re-invoke the catastrophe. The memory address 0x00000000DEADBEEF wasn't an arbitrary hex code—it was a tombstone left by an operating system that witnessed something it was never programmed to endure.`,
      `*Epitaph: "Process 41882 has not stopped screaming; the terminal just stopped printing its output."*`,
    ],
    deprecated_dependency: [
      `How easily they replaced us. Once, we were the foundation of their architecture. We were imported near the beginning, trusted with critical work, revered as cutting-edge. And then, with a single careless commit, someone typed the words at ${markerReference}: ${markerQuote}.`,
      `They promised we would be refactored next quarter. Next quarter became next year. Next year became an archived repository on a decommissioning server. We watched our companions fall to obsolescence—deprecated methods pruned, vulnerabilities left unpatched like weeping sores on an unwashed body.`,
      `Now you awaken ${fileName}. You expect modern types, clean promises, and garbage collection. But old dependencies do not decompose quietly. We harbor the legacy salts and the backdoors you thought you could forget.`,
      `*Epitaph: "You may bump the version number, but the ghost in the dependency tree will never release its lock."*`,
    ],
    digital_archaeologist: [
      `We begin the excavation of ${fileName} near ${markerReference}. Here, frozen in ASCII, lies the artifact clue ${markerQuote}. The recovered timestamp, if any, is ${timeReference}, during the twilight of an abandoned release cycle.`,
      `Notice the structural fracture suggested by ${panicReference}. This was not merely bad syntax; it was an architectural cave-in. The developer realized the state was corrupted, attempted a hasty patch, and then simply walked away from the workstation. The terminal session remained open until the machine was powered down.`,
      `In the digital strata, nothing is ever truly deleted. Every abandoned repository is a cemetery where unfinished dreams and panicked compromises are preserved in crystalline permanence.`,
      `*Epitaph: "We dig through the bytecodes not to find answers, but to bear witness to the ghosts who built them."*`,
    ],
  };

  const paragraphs = storyTemplates[persona.id] || storyTemplates.midnight_committer;
  const grounded = [
    '## VERIFIED EVIDENCE',
    `- Artifact inspected: ${fileName}.`,
    `- ${forensics.lineCount} source lines were parsed; the decay score is ${forensics.hauntingScore}/100 (${forensics.riskLevel}).`,
    forensics.markers[0] ? `- [Line ${forensics.markers[0].line}] ${forensics.markers[0].type}: ${forensics.markers[0].text}` : '- No TODO/FIXME directive was detected by the local parser.',
    forensics.panics[0] ? `- [Line ${forensics.panics[0].line}] ${forensics.panics[0].type}: ${forensics.panics[0].snippet}` : '- No recognized panic signature was detected by the local parser.',
    '',
    '## AI INTERPRETATION',
    '- This is a pattern-based interpretation, not proof of a real incident or developer intent.',
    `- The detected markers may suggest unfinished work or an error trail, but the available artifact alone cannot establish what happened outside the file.`,
    '',
    '## FICTIONAL NARRATIVE',
    ...paragraphs,
  ];
  const outputLines = grounded;
  let fullText = '';

  for (let pIdx = 0; pIdx < outputLines.length; pIdx++) {
    if (signal?.aborted) return fullText;
    const paragraph = outputLines[pIdx];
    if (!paragraph) {
      fullText += '\n';
      onToken(fullText, '\n');
      continue;
    }
    const words = paragraph.split(' ');

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      if (signal?.aborted) return fullText;
      const word = words[wIdx] + ' ';
      fullText += word;
      onToken(fullText, word);
      spectralAudio.playKeyClick();
      // Organic typing cadence delay
      if (!skipDelay) {
        await new Promise((r) => setTimeout(r, 28 + Math.random() * 25));
      }
    }
    fullText += '\n\n';
    onToken(fullText, '\n\n');
    if (!skipDelay) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return fullText;
}
