/**
 * Detects the language of a given text based on keywords and accent patterns.
 * @param text - The text to analyze
 * @returns A language code: 'de', 'fr', 'es', 'pt', 'it', 'nl', or 'unknown'
 */
export function detectLanguage(text: string): string {
  text = text.toLowerCase();

  const deKeywords = [
    "bett", "lattenrost", "verstellbar", "mit", "dunkel", "holz",
    "dunkles", "stoff", "sessel", "stuhl", "schrank", "kommode",
    "couchtisch", "ecksofa", "sofa", "farbe", "umwandelbar"
  ];

  const frAccents = /[àâäéèêëîïôöùûüç]/i;
  const esAccents = /[áéíóúüñ]/i;
  const ptAccents = /[áâãàéêíóôõúç]/i;
  const itAccents = /[àèéìòóù]/i;

  // 1️⃣ Detect German by vocabulary first (most reliable)
  for (const kw of deKeywords) {
    if (text.includes(kw)) return "de";
  }

  // 2️⃣ Then detect romantic languages by accents
  if (frAccents.test(text)) return "fr";
  if (esAccents.test(text)) return "es";
  if (ptAccents.test(text)) return "pt";
  if (itAccents.test(text)) return "it";

  // 3️⃣ Detect Dutch by patterns
  if (/ij|aa|ee|oo|uu|stoel|tafel|bed|kast/.test(text)) return "nl";

  return "unknown";
}