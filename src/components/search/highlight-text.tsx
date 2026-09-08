function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Best-effort highlight: wraps occurrences of any query word (3+ chars) in
 * <mark>. The underlying search is full-text/trigram based, so an exact
 * substring match isn't guaranteed for every result — this is a visual aid,
 * not a claim that the term appears verbatim.
 */
export function HighlightText({ text, query }: { text: string; query: string }) {
  const words = Array.from(
    new Set(
      query
        .trim()
        .split(/\s+/)
        .filter((word) => word.length >= 3),
    ),
  );

  if (words.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  // `String.split` with a capturing group places matched groups at odd
  // indices — checking parity avoids re-testing a stateful global regex.
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded-[2px] bg-warning-soft text-foreground">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
