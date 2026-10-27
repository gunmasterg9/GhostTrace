// Haunted Terminal Archaeological Forensics
// Analyzes terminal command histories, crash sessions, and CLI dumps EXCLUSIVELY AS INERT TEXT.
// NEVER executes, evaluates, or passes imported commands to any shell or interpreter.

const DANGEROUS_COMMANDS = [
  { pattern: /\brm\s+(-[rfRfi]+\s+)?[/~.*]/i, label: 'Destructive Deletion (rm -rf /)' },
  { pattern: /\b(?:drop\s+database|drop\s+table|truncate\s+table)\b/i, label: 'Database Purge' },
  { pattern: /\b(?:kill\s+-9|killall|pkill\s+-9)\b/i, label: 'Forced Process Termination' },
  { pattern: /\bgit\s+reset\s+--hard\b/i, label: 'Unrecoverable Git History Discard' },
  { pattern: /\bgit\s+push\s+.*--force\b/i, label: 'Destructive Force Push' },
  { pattern: /\bdd\s+if=.*of=\/dev\b/i, label: 'Raw Disk Write (dd)' },
  { pattern: /\bchmod\s+(?:-R\s+)?777\b/i, label: 'Insecure World-Writable Permission' },
  { pattern: /\b(?:sudo\s+su|sudo\s+-i)\b/i, label: 'Root Escalation' },
];

const EXIT_CODE_PATTERNS = [
  { pattern: /\bexit\s+(?:code\s+)?([1-9]\d{0,2})\b/i, group: 1 },
  { pattern: /\bexited with status\s+([1-9]\d{0,2})\b/i, group: 1 },
  { pattern: /\bcode\s*[:=]\s*([1-9]\d{0,2})\b/i, group: 1 },
  { pattern: /\b(137|139|143|127|126)\b/, group: 1 }, // OOM, Segfault, Sigterm, NotFound
];

export function isTerminalHistoryFile(filename, content) {
  if (!filename || typeof filename !== 'string') return false;
  const name = filename.toLowerCase();

  if (
    name.endsWith('_history') ||
    name.endsWith('.history') ||
    name.includes('bash_history') ||
    name.includes('zsh_history') ||
    name.includes('powershell_history') ||
    name.includes('consolehost_history')
  ) {
    return true;
  }

  // Look for shell prompt characteristics in content
  if (content && typeof content === 'string') {
    const lines = content.slice(0, 1500).split('\n');
    const shellPrompts = lines.filter((l) => /^[$#%>]\s+\w+/.test(l.trim()));
    if (shellPrompts.length >= 3) return true;
  }

  return false;
}

/**
 * Safely analyzes a terminal history file or log text.
 * Guarantee: Zero command execution. String-inspection only.
 */
export function analyzeTerminalHistory(content, filename = 'terminal_history.txt') {
  if (!content || typeof content !== 'string') {
    return {
      isTerminal: false,
      totalCommands: 0,
      uniqueCommands: 0,
      dangerousCommands: [],
      repeatedLoops: [],
      exitFailures: [],
      midnightCommands: [],
      hauntingSignatures: [],
    };
  }

  const rawLines = content.split('\n');
  const commands = [];
  const commandCounts = new Map();
  const dangerousCommands = [];
  const exitFailures = [];
  const midnightCommands = [];

  const TIMESTAMP_PREFIX_REGEX = /^(?:#(\d{10})|\[(.*?)\]|(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}))\s*(.*)$/;
  const MIDNIGHT_HOUR_REGEX = /(?:0[0-5]:[0-5][0-9]|(?:1[0-2]|0?[1-5]):[0-5][0-9]\s*(?:AM|am))/;

  rawLines.forEach((line, idx) => {
    const lineNum = idx + 1;
    let cleanCmd = line.trim();
    if (!cleanCmd) return;

    // Strip timestamp prefixes commonly in zsh/bash extended history
    const tsMatch = cleanCmd.match(TIMESTAMP_PREFIX_REGEX);
    let lineTime = null;
    if (tsMatch) {
      if (tsMatch[1]) {
        // Unix epoch seconds
        const d = new Date(parseInt(tsMatch[1], 10) * 1000);
        lineTime = d.toLocaleTimeString();
      } else {
        lineTime = tsMatch[2] || tsMatch[3];
      }
      cleanCmd = (tsMatch[4] || '').trim();
    }

    if (!cleanCmd) return;

    commands.push({ line: lineNum, text: cleanCmd, time: lineTime });
    commandCounts.set(cleanCmd, (commandCounts.get(cleanCmd) || 0) + 1);

    // Check for destructive commands
    for (const danger of DANGEROUS_COMMANDS) {
      if (danger.pattern.test(cleanCmd)) {
        dangerousCommands.push({
          line: lineNum,
          label: danger.label,
          command: cleanCmd.slice(0, 80),
        });
        break;
      }
    }

    // Check for exit code anomalies
    for (const exitPattern of EXIT_CODE_PATTERNS) {
      const match = cleanCmd.match(exitPattern.pattern);
      if (match) {
        exitFailures.push({
          line: lineNum,
          code: match[exitPattern.group] || 'Non-zero',
          snippet: cleanCmd.slice(0, 80),
        });
        break;
      }
    }

    // Check for midnight hours
    if (lineTime && MIDNIGHT_HOUR_REGEX.test(lineTime)) {
      midnightCommands.push({
        line: lineNum,
        time: lineTime,
        command: cleanCmd.slice(0, 80),
      });
    }
  });

  // Identify desperate command loops (commands typed > 3 times)
  const repeatedLoops = [];
  for (const [cmd, count] of commandCounts.entries()) {
    if (count >= 3 && cmd.length > 3) {
      repeatedLoops.push({ command: cmd, count });
    }
  }

  // Sort loops by count descending
  repeatedLoops.sort((a, b) => b.count - a.count);

  return {
    isTerminal: true,
    filename,
    totalCommands: commands.length,
    uniqueCommands: commandCounts.size,
    dangerousCommands: dangerousCommands.slice(0, 15),
    repeatedLoops: repeatedLoops.slice(0, 10),
    exitFailures: exitFailures.slice(0, 15),
    midnightCommands: midnightCommands.slice(0, 15),
  };
}
