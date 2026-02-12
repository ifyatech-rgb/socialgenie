/**
 * Clean script content by removing visual directions and formatting.
 * Ensures only pure spoken/narration text is used for video generation.
 */

export function cleanScript(script: string): string {
  if (!script || typeof script !== 'string') {
    return '';
  }

  let cleaned = script;

  // Remove all bracketed content (visual directions: [CUT TO:], [VISUAL:], etc.)
  cleaned = cleaned.replace(/\[.*?\]/g, '');

  // Replace em dash (—) with regular hyphen (-)
  cleaned = cleaned.replace(/—/g, '-');

  // Remove parenthetical stage directions (e.g. (PAUSE), (whispers))
  cleaned = cleaned.replace(/\(.*?\)/g, '');

  // Remove common visual cue patterns (standalone lines)
  const visualPatterns = [
    /CUT TO:.*?(?:\n|$)/gi,
    /VISUAL:.*?(?:\n|$)/gi,
    /SCENE:.*?(?:\n|$)/gi,
    /CAMERA:.*?(?:\n|$)/gi,
    /SHOT:.*?(?:\n|$)/gi,
    /ANGLE:.*?(?:\n|$)/gi,
    /FADE IN:.*?(?:\n|$)/gi,
    /FADE OUT:.*?(?:\n|$)/gi,
    /DISSOLVE TO:.*?(?:\n|$)/gi,
    /TRANSITION:.*?(?:\n|$)/gi,
    /TEXT ON SCREEN:.*?(?:\n|$)/gi,
    /EMPHASIS:.*?(?:\n|$)/gi,
    /INT\.\s+/gi,
    /EXT\.\s+/gi,
  ];

  visualPatterns.forEach((pattern) => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Collapse multiple spaces within each line (preserve newlines for structure)
  cleaned = cleaned
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => line.length > 0)
    .join('\n\n');

  return cleaned.trim();
}

/**
 * Check if script contains visual directions (brackets, em dashes, cue keywords).
 */
export function hasVisualDirections(script: string): boolean {
  if (!script) return false;
  return (
    script.includes('[') ||
    (script.includes('(') && /\([A-Z\s]+\)/.test(script)) ||
    script.includes('—') ||
    /CUT TO:|VISUAL:|SCENE:|CAMERA:|TEXT ON SCREEN:/i.test(script)
  );
}

/**
 * Get cleaning stats (for logging or UI).
 */
export function getCleaningStats(
  originalScript: string,
  cleanedScript: string
): {
  bracketsRemoved: number;
  parenthesesRemoved: number;
  emDashesRemoved: number;
  charactersRemoved: number;
  reductionPercentage: string;
} {
  const bracketsRemoved = (originalScript.match(/\[.*?\]/g) || []).length;
  const parenthesesRemoved = (originalScript.match(/\(.*?\)/g) || []).length;
  const emDashesRemoved = (originalScript.match(/—/g) || []).length;
  const charactersRemoved = originalScript.length - cleanedScript.length;
  const reductionPercentage =
    originalScript.length > 0
      ? ((charactersRemoved / originalScript.length) * 100).toFixed(1)
      : '0';

  return {
    bracketsRemoved,
    parenthesesRemoved,
    emDashesRemoved,
    charactersRemoved,
    reductionPercentage,
  };
}
