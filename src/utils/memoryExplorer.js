// Digital Memory Explorer Engine for GhostTrace AI
// Recursively analyzes multiple user-selected files within explicit file-count and total-size bounds.
import { redactSensitiveData } from './redactor.js';
import { analyzeEvidence } from './forensics.js';

export const EXPLORER_LIMITS = {
  MAX_FILE_COUNT: 30,
  MAX_TOTAL_SIZE_BYTES: 2 * 1024 * 1024, // 2MB
  MAX_SINGLE_FILE_SIZE: 500 * 1024,      // 500KB
  ALLOWED_EXTENSIONS: [
    '.rs', '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.cpp', '.c', '.h',
    '.java', '.log', '.txt', '.json', '.md', '.sh', '.env', '.yml', '.yaml',
    '.sql', '.toml', '.bash_history', '.zsh_history', '.cfg', '.ini'
  ],
};

export function isTextArtifact(filename, content) {
  if (!filename || typeof filename !== 'string') return false;
  if (!content || typeof content !== 'string') return false;

  // Check null bytes (binary indicator)
  if (content.includes('\0')) return false;

  // Check extension
  const lower = filename.toLowerCase();
  const hasAllowedExt = EXPLORER_LIMITS.ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  
  // Extensionless or dotfiles (e.g. .bash_history)
  const isHistoryOrDotfile = lower.includes('history') || lower.startsWith('.');

  return hasAllowedExt || isHistoryOrDotfile;
}

/**
 * Analyzes an array of raw file entries: [{ name, path, content, size }]
 * Enforces explicit file-count and total-size limits.
 */
export function analyzeMemoryArchive(rawFiles) {
  if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
    return {
      files: [],
      totalFiles: 0,
      totalLines: 0,
      totalSizeBytes: 0,
      totalRedactions: 0,
      averageDecayScore: 0,
      warnings: ['No files provided to Digital Memory Explorer.'],
    };
  }

  const warnings = [];
  const processedFiles = [];
  let aggregateSize = 0;
  let totalRedactions = 0;
  let totalLines = 0;

  for (let i = 0; i < rawFiles.length; i++) {
    const file = rawFiles[i];

    // Enforce file count limit
    if (processedFiles.length >= EXPLORER_LIMITS.MAX_FILE_COUNT) {
      warnings.push(`File count exceeded maximum limit (${EXPLORER_LIMITS.MAX_FILE_COUNT}). Remaining files were omitted.`);
      break;
    }

    // Check single file size
    const fileSize = file.size || (file.content ? file.content.length : 0);
    if (fileSize > EXPLORER_LIMITS.MAX_SINGLE_FILE_SIZE) {
      warnings.push(`Skipped "${file.name}": exceeds single file limit (${Math.round(EXPLORER_LIMITS.MAX_SINGLE_FILE_SIZE / 1024)}KB).`);
      continue;
    }

    // Check aggregate size limit
    if (aggregateSize + fileSize > EXPLORER_LIMITS.MAX_TOTAL_SIZE_BYTES) {
      warnings.push(`Total memory quota exceeded (${Math.round(EXPLORER_LIMITS.MAX_TOTAL_SIZE_BYTES / (1024 * 1024))}MB). Truncated explorer ingestion.`);
      break;
    }

    // Check text artifact validity
    if (!isTextArtifact(file.name, file.content)) {
      warnings.push(`Skipped non-text or binary artifact: "${file.name}".`);
      continue;
    }

    // Check empty content
    if (!file.content || !file.content.trim()) {
      warnings.push(`Skipped empty artifact: "${file.name}".`);
      continue;
    }

    // Redact sensitive patterns BEFORE passing to forensic engine or LLM
    const redacted = redactSensitiveData(file.content);
    totalRedactions += redacted.redactionCount;

    // Run archaeological forensics
    const forensics = analyzeEvidence(redacted.sanitized, file.name);
    totalLines += forensics.lineCount;
    aggregateSize += fileSize;

    processedFiles.push({
      id: `mem-${processedFiles.length}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      filename: file.name,
      path: file.path || file.name,
      size: fileSize,
      lineCount: forensics.lineCount,
      hauntingScore: forensics.hauntingScore,
      riskLevel: forensics.riskLevel,
      rawContent: file.content,
      redactedData: redacted,
      forensicData: forensics,
    });
  }

  const averageDecayScore = processedFiles.length > 0
    ? Math.round(processedFiles.reduce((acc, f) => acc + f.hauntingScore, 0) / processedFiles.length)
    : 0;

  return {
    files: processedFiles,
    totalFiles: processedFiles.length,
    totalLines,
    totalSizeBytes: aggregateSize,
    totalRedactions,
    averageDecayScore,
    warnings,
  };
}
