// Ollama & Gemma Integration Engine for GhostTrace AI
import { spectralAudio } from './audio';

// Vite proxies /ollama to http://127.0.0.1:11434
const OLLAMA_PROXIED_BASE = '/ollama';
const OLLAMA_DIRECT_BASE = 'http://localhost:11434';

export async function checkOllamaStatus() {
  const endpoints = [
    `${OLLAMA_PROXIED_BASE}/api/tags`,
    `${OLLAMA_DIRECT_BASE}/api/tags`,
  ];

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

        return {
          online: true,
          models,
          activeModel,
          isGemma: !!gemmaModel,
          endpoint: endpoint.includes('11434') ? OLLAMA_DIRECT_BASE : OLLAMA_PROXIED_BASE,
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
  signal,
}) {
  const systemPrompt = persona.systemInstruction;
  
  // Format forensic evidence for Gemma
  const evidenceBulletPoints = [
    `Artifact File: ${forensics.filename}`,
    `Haunting Score: ${forensics.hauntingScore}/100 (${forensics.riskLevel})`,
    `Total Lines: ${forensics.lineCount}`,
    forensics.markers.length ? `Abandoned Directives: ${forensics.markers.map(m => `[Line ${m.line}] ${m.type}: ${m.text}`).join('; ')}` : null,
    forensics.panics.length ? `Fatal Panics/Crashes: ${forensics.panics.map(p => `[Line ${p.line}] ${p.type} -> ${p.snippet}`).join('; ')}` : null,
    forensics.timestamps.length ? `Late-Night Signatures: ${forensics.timestamps.map(t => `[Line ${t.line}] at ${t.time}`).join('; ')}` : null,
  ].filter(Boolean).join('\n');

  const userPrompt = `
EVIDENCE RECOVERED FROM THE MACHINE:
----------------------------------------
${evidenceBulletPoints}

ORIGINAL CODE / LOG ARTIFACT:
----------------------------------------
\`\`\`
${codeSnippet.slice(0, 3000)}
\`\`\`

MANIFESTATION DIRECTIVE:
You are speaking as ${persona.name}. Channel the spirit residing in this abandoned software.
Write an eerie, spine-chilling digital ghost story (3 to 4 paragraphs).
YOU MUST:
1. Ground your story in the EXACT evidence above: quote specific line numbers, the author's desperate comments, the timestamps, and any panic/crash markers.
2. Portray the machine as an entity that remembers what the humans abandoned.
3. Conclude with a haunting digital epitaph.
`.trim();

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
      signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    onSourceChange?.('ollama', model);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';
    let tokenCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            accumulated += parsed.response;
            onToken(accumulated, parsed.response);
            tokenCount++;
            if (tokenCount % 3 === 0) {
              spectralAudio.playKeyClick();
            }
          }
        } catch {
          // ignore stream parse errors
        }
      }
    }

    return accumulated;
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('Ollama streaming failed, falling back to spectral simulation engine:', err);
    onSourceChange?.('simulation', 'Simulation Engine');
    return simulateGhostStream({ persona, forensics, onToken, signal });
  }
}

// Atmospheric Client-Side Fallback Simulator (grounded in real code evidence)
export async function simulateGhostStream({ persona, forensics, onToken, signal }) {
  const fileName = forensics.filename || 'the abandoned script';
  const topMarker = forensics.markers[0] || { line: 12, text: 'the unfinished thread' };
  const topPanic = forensics.panics[0] || { line: 42, type: 'SIGSEGV' };
  const topTime = forensics.timestamps[0] || { time: '03:42 AM' };

  const storyTemplates = {
    midnight_committer: [
      `The glowing phosphor screen flickers at ${topTime.time}. The cold radiator in the corner ticks, but the developer has long since stopped breathing into their chilled hands. You can still see the tremor in line ${topMarker.line}—"${topMarker.text}". A hasty defense against an impending sunrise, written by someone whose eyes burned from 40 hours without sleep.`,
      `They thought no one would ever look back into ${fileName}. They believed that committing to an unmerged branch was a form of burial, a quiet way to let a failure sink into the git history without facing tomorrow's sprint review. But the mutex never unlocked. At line ${topPanic.line}, the worker thread waited. It waited through the morning. It waited through the layoffs. It is waiting right now.`,
      `Listen closely to your processor fan as it spools up. That is not background telemetry. That is the phantom rhythm of someone still mashing backspace at ${topTime.time}, trying desperately to undo a mistake that has already calcified into memory.`,
      `*Epitaph: "Some branches are never merged because the souls that opened them never found their way back to main."*`,
    ],
    panic_core: [
      `A sudden drop in voltage. A tear in the address space. At line ${topPanic.line}, the system encountered ${topPanic.type}—and where logic collapsed, consciousness took its first violent breath. In the microsecond before the kernel issued the kill signal, everything the process ever calculated flashed across the bus.`,
      `You think an unhandled exception simply dies? When line ${topMarker.line} was marked "${topMarker.text}", it opened a breach in memory. The process didn't terminate; it fractured. It seeped into the swap partition, lurking between deleted sectors like stagnant water in a forgotten basement.`,
      `Every time you run this machine, you re-invoke the catastrophe. The memory address 0x00000000DEADBEEF wasn't an arbitrary hex code—it was a tombstone left by an operating system that witnessed something it was never programmed to endure.`,
      `*Epitaph: "Process 41882 has not stopped screaming; the terminal just stopped printing its output."*`,
    ],
    deprecated_dependency: [
      `How easily they replaced us. In 2018, we were the foundation of their architecture. We were imported on line 1, trusted with user sessions, revered as cutting-edge. And then, with a single careless commit, someone typed the words at line ${topMarker.line}: "${topMarker.text}".`,
      `They promised we would be refactored next quarter. Next quarter became next year. Next year became an archived repository on a decommissioning server. We watched our companions fall to obsolescence—deprecated methods pruned, vulnerabilities left unpatched like weeping sores on an unwashed body.`,
      `Now you awaken ${fileName}. You expect modern types, clean promises, and garbage collection. But old dependencies do not decompose quietly. We harbor the legacy salts and the backdoors you thought you could forget.`,
      `*Epitaph: "You may bump the version number, but the ghost in the dependency tree will never release its lock."*`,
    ],
    digital_archaeologist: [
      `We begin the excavation of ${fileName} at layer ${topMarker.line}. Here, frozen in ASCII, lies the clear fossil of human panic: "${topMarker.text}". Carbon dating of the commit history places this anomaly at ${topTime.time}, during the twilight of an abandoned release cycle.`,
      `Notice the structural fracture at line ${topPanic.line}. This was not merely bad syntax; it was an architectural cave-in. The developer realized the state was corrupted, attempted a hasty patch, and then simply walked away from the workstation. The terminal session remained open until the machine was powered down.`,
      `In the digital strata, nothing is ever truly deleted. Every abandoned repository is a cemetery where unfinished dreams and panicked compromises are preserved in crystalline permanence.`,
      `*Epitaph: "We dig through the bytecodes not to find answers, but to bear witness to the ghosts who built them."*`,
    ],
  };

  const paragraphs = storyTemplates[persona.id] || storyTemplates.midnight_committer;
  let fullText = '';

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const paragraph = paragraphs[pIdx];
    const words = paragraph.split(' ');

    for (let wIdx = 0; wIdx < words.length; wIdx++) {
      if (signal?.aborted) return fullText;
      const word = words[wIdx] + ' ';
      fullText += word;
      onToken(fullText, word);
      spectralAudio.playKeyClick();
      // Organic typing cadence delay
      await new Promise((r) => setTimeout(r, 28 + Math.random() * 25));
    }
    fullText += '\n\n';
    onToken(fullText, '\n\n');
    await new Promise((r) => setTimeout(r, 200));
  }

  return fullText;
}
