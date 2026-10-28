// Privacy-First Redactor for GhostTrace AI
// Strips credentials, API keys, JWTs, and local sensitive data locally on the client
//
// KNOWN LIMITATIONS & THREAT MODEL:
// - Heuristic regex detection targets established credential patterns (API keys, JWTs,
//   OpenAI/GitHub tokens, AWS access keys, private keys, database connection strings,
//   Bearer headers, and local user home paths).
// - It cannot guarantee detection of arbitrary high-entropy custom secrets, obfuscated
//   or base64/hex-encoded payloads, or non-standard proprietary variables.
// - Users must never feed live root production infrastructure credentials into any AI tool.

const PATTERNS = [
  { name: 'API Key / Password', regex: /(?:[a-zA-Z0-9_-]*(?:api[_-]?key|secret|token|password|passwd|pwd|auth[_-]?token|credential)[a-zA-Z0-9_-]*)['"]?\s*[:=]\s*['"]?([^\s'",;\r\n]{4,})['"]?/gi, redactGroup: 1 },
  { name: 'OpenAI / Model Key', regex: /\b(sk-[a-zA-Z0-9_-]{20,})\b/g },
  { name: 'GitHub Token', regex: /\b(gh[pousr]_[A-Za-z0-9_]{20,})\b/g },
  { name: 'Database URI', regex: /\b(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s'",;\r\n]+/gi },
  { name: 'AWS Access Key', regex: /(A3T[A-Z0-9]|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16})/g },
  { name: 'Private Key', regex: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/g },
  { name: 'JWT Token', regex: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g },
  { name: 'Email Address', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { name: 'IPv4 Address (Private)', regex: /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/g },
  { name: 'Bearer Auth', regex: /Bearer\s+([A-Za-z0-9_.-]{10,})/gi, redactGroup: 1 },
  { name: 'Windows User Path', regex: /(?:[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/][a-zA-Z0-9_.-]+(?:[\\/][^\s"'<>:;,\r\n]+)*)/gi },
  { name: 'Unix User Path', regex: /(?:\/(?:home|Users)\/[a-zA-Z0-9_.-]+(?:\/[^\s"'<>:;,\r\n]+)*)/gi },
];

export function redactSensitiveData(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return { sanitized: '', redactionCount: 0, redactions: [] };
  }

  let sanitized = rawContent;
  const redactions = [];
  let totalCount = 0;

  for (const { name, regex, redactGroup } of PATTERNS) {
    sanitized = sanitized.replace(regex, (match, group1) => {
      totalCount++;
      // Safe preview: NEVER include raw matched secret fragments in metadata
      redactions.push({ type: name, preview: '[REDACTED]' });
      if (redactGroup && group1) {
        return match.replace(group1, '⟦REDACTED_ECTOPLASM⟧');
      }
      return '⟦REDACTED_ECTOPLASM⟧';
    });
  }

  return {
    sanitized,
    redactionCount: totalCount,
    redactions: redactions.slice(0, 10), // safe sample of caught categories
  };
}
