// Archaeological Forensics Engine for GhostTrace AI
// Analyzes code, logs, and git snippets to extract ground-truth paranormal evidence

export function analyzeEvidence(content, filename = 'unknown_artifact') {
  if (!content) {
    return {
      markers: [],
      panics: [],
      timestamps: [],
      hauntingScore: 0,
      riskLevel: 'Dormant',
      riskColor: '#708c9e',
      lineCount: 0,
      decaySummary: 'No anomalies detected.',
    };
  }

  const lines = content.split('\n');
  const markers = [];
  const panics = [];
  const timestamps = [];

  const TODO_REGEX = /(?:\/\/|#|\/\*|\*|--)\s*(TODO|FIXME|HACK|BUG|XXX|OPTIMIZE|TEMP|WARNING)\b[:\s]*(.*)/i;
  const PANIC_REGEX = /\b(panic!|segfault|Segmentation fault|UnhandledPromiseRejection|NullPointerException|OOMKilled|SIGSEGV|SIGKILL|core dumped|Fatal error|abort\(\)|CRITICAL)\b/i;
  const TIMESTAMP_REGEX = /\b(0[0-5]:[0-5][0-9](?::[0-5][0-9])?|[1-4]:[0-5][0-9]\s*(?:AM|am)|(?:0[1-4]|00):[0-5][0-9])\b/;
  const ANCIENT_YEAR_REGEX = /\b(201[4-9]|202[0-3])\b/;

  let lateNightCount = 0;
  let ancientYearCount = 0;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();

    // Check for abandoned TODO/FIXME markers
    const todoMatch = trimmed.match(TODO_REGEX);
    if (todoMatch) {
      markers.push({
        line: lineNum,
        type: todoMatch[1].toUpperCase(),
        text: todoMatch[2] ? todoMatch[2].slice(0, 80) : '(empty comment)',
        raw: trimmed,
      });
    }

    // Check for fatal panic signatures
    const panicMatch = trimmed.match(PANIC_REGEX);
    if (panicMatch) {
      panics.push({
        line: lineNum,
        type: panicMatch[1],
        snippet: trimmed.slice(0, 90),
      });
    }

    // Check for midnight hour timestamps
    const timeMatch = trimmed.match(TIMESTAMP_REGEX);
    if (timeMatch) {
      lateNightCount++;
      timestamps.push({
        line: lineNum,
        time: timeMatch[1],
        snippet: trimmed.slice(0, 75),
      });
    }

    // Check for ancient years
    if (ANCIENT_YEAR_REGEX.test(trimmed)) {
      ancientYearCount++;
    }
  });

  // Calculate Haunting Score (0-100)
  let score = 15; // baseline digital residue
  score += markers.length * 9;
  score += panics.length * 18;
  score += lateNightCount * 12;
  score += Math.min(ancientYearCount * 7, 25);
  score = Math.min(Math.max(score, 12), 100);

  let riskLevel = 'Class I: Dormant Trace';
  let riskColor = '#34d399'; // green

  if (score > 85) {
    riskLevel = 'Class IV: Demon Core Exception';
    riskColor = '#ff3366'; // crimson
  } else if (score > 60) {
    riskLevel = 'Class III: Malignant Poltergeist';
    riskColor = '#fbbf24'; // amber
  } else if (score > 35) {
    riskLevel = 'Class II: Wandering Apparition';
    riskColor = '#22d3ee'; // cyan
  }

  const decaySummary = `Discovered ${markers.length} abandoned directives, ${panics.length} fatal exceptions, and ${lateNightCount} midnight hour signatures across ${lines.length} lines.`;

  return {
    markers,
    panics,
    timestamps,
    hauntingScore: score,
    riskLevel,
    riskColor,
    lineCount: lines.length,
    decaySummary,
    filename,
  };
}
