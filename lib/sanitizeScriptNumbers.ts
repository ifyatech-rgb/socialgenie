/**
 * Post-processing filter to remove prompt-contamination numbers (e.g. 847) from generated scripts.
 * These numbers appear in system prompt examples and get repeated by the AI if not stripped.
 */

const BANNED_NUMBER_REPLACEMENTS: Record<string, () => string> = {
  "847": () => String(Math.floor(Math.random() * (1400 - 600 + 1) + 600)),
  "1,847": () => String(Math.floor(Math.random() * (1200 - 900 + 1) + 900)).replace(/\B(?=(\d{3})+(?!\d))/g, ","),
  "94%": () => `${Math.floor(Math.random() * 15) + 76}%`,
  "78%": () => `${Math.floor(Math.random() * 12) + 74}%`,
  "23%": () => `${Math.floor(Math.random() * 15) + 18}%`,
  "34%": () => `${Math.floor(Math.random() * 12) + 28}%`,
  "11%": () => `${Math.floor(Math.random() * 10) + 14}%`,
  "$4,200": () => "$" + (Math.floor(Math.random() * 2000) + 2800).toLocaleString(),
  "$9,100": () => "$" + (Math.floor(Math.random() * 4000) + 7000).toLocaleString(),
  "$47K": () => "$" + (Math.floor(Math.random() * 40) + 30) + "K",
  "$47k": () => "$" + (Math.floor(Math.random() * 40) + 30) + "K",
  "47K": () => String(Math.floor(Math.random() * 30) + 35) + "K",
  "8,217": () => (Math.floor(Math.random() * 3000) + 6000).toLocaleString(),
  "$8,217": () => "$" + (Math.floor(Math.random() * 3000) + 6000).toLocaleString(),
  "3,400": () => (Math.floor(Math.random() * 2000) + 2400).toLocaleString(),
  "$3,400": () => "$" + (Math.floor(Math.random() * 2000) + 2400).toLocaleString(),
  "2,800": () => (Math.floor(Math.random() * 1500) + 2200).toLocaleString(),
  "$2,800": () => "$" + (Math.floor(Math.random() * 1500) + 2200).toLocaleString(),
  "4.2K": () => (Math.random() * 2 + 3.5).toFixed(1) + "K",
  "9.1K": () => (Math.random() * 3 + 7.5).toFixed(1) + "K",
  "$4.2K": () => "$" + (Math.random() * 2 + 3.5).toFixed(1) + "K",
  "$9.1K": () => "$" + (Math.random() * 3 + 7.5).toFixed(1) + "K",
};

/** Order: longer strings first so e.g. "$4,200" is matched before "4,200" or "200" */
const BANNED_PATTERNS = Object.keys(BANNED_NUMBER_REPLACEMENTS).sort((a, b) => b.length - a.length);

/**
 * Replace any prompt-example numbers in script text with fresh random alternatives.
 * Run after AI generates script to guarantee 847 and other example numbers never reach the user.
 */
export function sanitizeScriptNumbers(scriptText: string): string {
  if (!scriptText || typeof scriptText !== "string") return scriptText;
  let clean = scriptText;
  for (const banned of BANNED_PATTERNS) {
    const replaceFn = BANNED_NUMBER_REPLACEMENTS[banned];
    if (!replaceFn) continue;
    while (clean.includes(banned)) {
      clean = clean.replace(banned, replaceFn());
    }
  }
  return clean;
}

/** Extract numbers (integers, percentages, $ amounts) from text for user-level banning. */
export function extractNumbersFromScript(scriptText: string): string[] {
  if (!scriptText || typeof scriptText !== "string") return [];
  const seen = new Set<string>();
  const add = (s: string) => {
    const t = s.trim();
    if (t.length > 0 && t.length <= 20) seen.add(t);
  };
  scriptText.replace(/\$[\d,]+(?:\.\d+)?[KkMm]?/g, (m) => {
    add(m);
    return m;
  });
  scriptText.replace(/\d{1,3}(?:,\d{3})*(?:\.\d+)?%?/g, (m) => {
    add(m);
    return m;
  });
  return Array.from(seen);
}
