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
    '.sql', '.toml', '.bash_history', '.zsh_history', '.cfg', '.ini', '.xml',
    '.html', '.css', '.ps1'
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
 * Enforces explicit file-count (30), total-size (2MB), and per-file (500KB) limits.
 * Pre-redacts all file contents and generates a line-level manifest for the combined artifact.
 */
export function analyzeMemoryArchive(rawFiles) {
  if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
    return {
      files: [],
      manifest: [],
      combinedArtifact: '',
      combinedRedacted: '',
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

    const normalizedPath = (file.path || file.name).replace(/\\/g, '/');

    processedFiles.push({
      id: `mem-${processedFiles.length}-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
      filename: file.name,
      path: normalizedPath,
      size: fileSize,
      lineCount: forensics.lineCount,
      hauntingScore: forensics.hauntingScore,
      riskLevel: forensics.riskLevel,
      rawContent: file.content,
      redactedData: redacted,
      forensicData: forensics,
    });
  }

  // Construct combined artifact and line-level file manifest
  let currentLine = 1;
  const manifest = [];
  const combinedRawBlocks = [];
  const combinedRedactedBlocks = [];

  for (const pf of processedFiles) {
    const headerLine = currentLine;
    const contentStartLine = headerLine + 1;
    const contentEndLine = headerLine + pf.lineCount;

    manifest.push({
      id: pf.id,
      path: pf.path,
      filename: pf.filename,
      headerLine,
      contentStartLine,
      contentEndLine,
      lineCount: pf.lineCount,
      size: pf.size,
      forensicData: pf.forensicData,
    });

    combinedRawBlocks.push(`===== FILE: ${pf.path} =====\n${pf.rawContent}`);
    combinedRedactedBlocks.push(`===== FILE: ${pf.path} =====\n${pf.redactedData.sanitized}`);

    // +1 for header line, +lineCount for content, +2 lines for "\n\n" separator
    currentLine = contentEndLine + 2;
  }

  const combinedArtifact = combinedRawBlocks.join('\n\n');
  const combinedRedacted = combinedRedactedBlocks.join('\n\n');

  const averageDecayScore = processedFiles.length > 0
    ? Math.round(processedFiles.reduce((acc, f) => acc + f.hauntingScore, 0) / processedFiles.length)
    : 0;

  return {
    files: processedFiles,
    manifest,
    combinedArtifact,
    combinedRedacted,
    totalFiles: processedFiles.length,
    totalLines: combinedRedacted ? combinedRedacted.split('\n').length : 0,
    totalSizeBytes: aggregateSize,
    totalRedactions,
    averageDecayScore,
    warnings,
  };
}

/**
 * Resolves a citation against the multi-file manifest or combined artifact.
 * Handles duplicate basenames, path separators, line 1, last line, out-of-bounds,
 * and preserves combined artifact line numbers when no file prefix is specified.
 *
 * @param {Object} citation - { lineNum: number, filePrefix?: string }
 * @param {Array} manifest - Array of file manifest items from analyzeMemoryArchive
 * @param {number} totalLines - Total line count in the combined artifact
 * @returns {Object} { targetLine, file, isClamped, requestedLine, originalPrefix, notFound }
 */
export function resolveCitationTarget(citation, manifest = [], totalLines = 1) {
  const { lineNum, filePrefix } = citation;
  const requestedLine = Number.isFinite(lineNum) ? lineNum : 1;

  // Case 1: filePrefix is present (e.g. [src/auth.js:Line 5] or [auth.js:Line 5])
  if (filePrefix && typeof filePrefix === 'string' && manifest && manifest.length > 0) {
    const cleanPrefix = filePrefix.trim().replace(/\\/g, '/').toLowerCase();

    // 1. Exact path match
    let match = manifest.find((m) => m.path.toLowerCase() === cleanPrefix);

    // 2. Relative path / suffix match (e.g. "auth/token.js" matches "src/auth/token.js")
    if (!match) {
      match = manifest.find((m) =>
        m.path.toLowerCase().endsWith('/' + cleanPrefix) ||
        m.path.toLowerCase() === cleanPrefix
      );
    }

    // 3. Basename match
    if (!match) {
      match = manifest.find((m) => m.filename.toLowerCase() === cleanPrefix);
    }

    if (match) {
      let targetLine = match.contentStartLine + (requestedLine - 1);
      let isClamped = false;

      if (requestedLine < 1) {
        targetLine = match.contentStartLine;
        isClamped = true;
      } else if (requestedLine > match.lineCount) {
        targetLine = match.contentEndLine;
        isClamped = true;
      }

      return {
        targetLine,
        file: match,
        isClamped,
        requestedLine,
        originalPrefix: filePrefix,
        notFound: false,
      };
    }

    // Prefix specified but file not found in manifest
    const clamped = Math.max(1, Math.min(requestedLine, totalLines));
    return {
      targetLine: clamped,
      file: null,
      isClamped: requestedLine < 1 || requestedLine > totalLines,
      requestedLine,
      originalPrefix: filePrefix,
      notFound: true,
    };
  }

  // Case 2: No filePrefix (e.g. [Line 42])
  // Do not add offsets to a line number that already refers to the combined artifact
  const isClamped = requestedLine < 1 || requestedLine > totalLines;
  const targetLine = Math.max(1, Math.min(requestedLine, totalLines));

  let matchedFile = null;
  if (manifest && manifest.length > 0) {
    matchedFile = manifest.find(
      (m) => targetLine >= m.contentStartLine && targetLine <= m.contentEndLine
    ) || null;
  }

  return {
    targetLine,
    file: matchedFile,
    isClamped,
    requestedLine,
    originalPrefix: null,
    notFound: false,
  };
}
