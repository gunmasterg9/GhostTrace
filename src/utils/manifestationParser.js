// Utility for separating Verified Evidence, AI Interpretations, and Spectral Fictional Narrative
// Ensures clear epistemic boundaries: raw ground truth vs. AI hypotheses vs. fictional storytelling.

export function parseManifestationTiers(manifestationText, forensicData) {
  if (!manifestationText || typeof manifestationText !== 'string') {
    return {
      evidence: [],
      interpretation: '',
      narrative: '',
      hasStructuredTiers: false,
    };
  }

  // Look for section markers if produced by structured Gemma prompt or fallback
  const evidenceRegex = /(?:#{1,4}\s*(?:📜\s*)?(?:1\.\s*)?VERIFIED EVIDENCE[\s\S]*?)(?=#{1,4}\s*(?:🔬\s*)?(?:2\.\s*)?(?:AI|FORENSIC) INTERPRETATION|$)/i;
  const interpretationRegex = /(?:#{1,4}\s*(?:🔬\s*)?(?:2\.\s*)?(?:AI|FORENSIC) INTERPRETATION[\s\S]*?)(?=#{1,4}\s*(?:🕯️\s*)?(?:3\.\s*)?(?:SPECTRAL MANIFESTATION|FICTIONAL NARRATIVE)|$)/i;
  const narrativeRegex = /(?:#{1,4}\s*(?:🕯️\s*)?(?:3\.\s*)?(?:SPECTRAL MANIFESTATION|FICTIONAL NARRATIVE)[\s\S]*)/i;

  const evidenceMatch = manifestationText.match(evidenceRegex);
  const interpretationMatch = manifestationText.match(interpretationRegex);
  const narrativeMatch = manifestationText.match(narrativeRegex);

  const cleanSection = (raw, headerPattern) => {
    if (!raw) return '';
    return raw.replace(headerPattern, '').trim();
  };

  const parserEvidence = formatGroundTruthEvidence(forensicData);

  if (evidenceMatch || interpretationMatch || narrativeMatch) {
    const parsedInterpretation = cleanSection(
      interpretationMatch ? interpretationMatch[0] : '',
      /^#{1,4}\s*.*(?:AI|FORENSIC) INTERPRETATION.*$/im
    );
    const parsedNarrative = cleanSection(
      narrativeMatch ? narrativeMatch[0] : '',
      /^#{1,4}\s*.*(?:SPECTRAL MANIFESTATION|FICTIONAL NARRATIVE).*$/im
    );

    return {
      evidenceText: parserEvidence, // Ground truth is strictly derived from parser facts
      interpretation: parsedInterpretation || generateBaselineForensicDeduction(forensicData),
      narrative: parsedNarrative || manifestationText.trim(),
      hasStructuredTiers: true,
      raw: manifestationText,
    };
  }

  // Unstructured stream fallback:
  // The full text is treated as the Spectral Narrative,
  // while verified facts are grounded directly in the forensic autopsy data.
  return {
    evidenceText: parserEvidence,
    interpretation: generateBaselineForensicDeduction(forensicData),
    narrative: manifestationText.trim(),
    hasStructuredTiers: false,
    raw: manifestationText,
  };
}

export function formatGroundTruthEvidence(forensics) {
  if (!forensics) return 'No ground-truth evidence available.';

  const facts = [];
  facts.push(`Artifact: ${forensics.filename} (${forensics.lineCount} lines)`);
  facts.push(`Haunting Decay Score: ${forensics.hauntingScore}/100 (${forensics.riskLevel})`);

  if (forensics.markers && forensics.markers.length > 0) {
    facts.push(`Discovered Directives (${forensics.markers.length}):`);
    forensics.markers.forEach((m) => {
      facts.push(`  • [Line ${m.line}] ${m.type}: "${m.text}"`);
    });
  }

  if (forensics.panics && forensics.panics.length > 0) {
    facts.push(`Fatal Panics/Exceptions (${forensics.panics.length}):`);
    forensics.panics.forEach((p) => {
      facts.push(`  • [Line ${p.line}] ${p.type}: "${p.snippet}"`);
    });
  }

  if (forensics.timestamps && forensics.timestamps.length > 0) {
    facts.push(`Midnight Signatures (${forensics.timestamps.length}):`);
    forensics.timestamps.forEach((t) => {
      facts.push(`  • [Line ${t.line}] at ${t.time}: "${t.snippet}"`);
    });
  }

  return facts.join('\n');
}

export function generateBaselineForensicDeduction(forensics) {
  if (!forensics) return 'Analysis pending artifact exhumation.';

  const deductions = [];
  if (forensics.panics && forensics.panics.length > 0) {
    deductions.push(`High probability of unhandled crash state triggered near Line ${forensics.panics[0].line} (${forensics.panics[0].type}).`);
  }
  if (forensics.markers && forensics.markers.length > 0) {
    deductions.push(`Code contains ${forensics.markers.length} abandoned technical debt markers, indicating rushed delivery or missed deadlines.`);
  }
  if (forensics.timestamps && forensics.timestamps.length > 0) {
    deductions.push(`Multiple modifications occurred during low-circadian hours (${forensics.timestamps[0].time}), strongly correlating with human fatigue and elevated defect density.`);
  }
  if (deductions.length === 0) {
    deductions.push('Artifact exhibits low anomaly frequency. Likely dormant legacy code or truncated snippet.');
  }

  return deductions.join('\n\n');
}
