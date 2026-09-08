// Diacritics (Unicode combining marks, U+0300-U+036F) left behind after NFD
// normalization — stripped by code point range to avoid relying on literal
// accented characters in source.
const COMBINING_MARKS_START = 0x0300;
const COMBINING_MARKS_END = 0x036f;

function stripDiacritics(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code < COMBINING_MARKS_START || code > COMBINING_MARKS_END) {
      result += char;
    }
  }
  return result;
}

export function slugify(value: string): string {
  return stripDiacritics(value.normalize("NFD"))
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
