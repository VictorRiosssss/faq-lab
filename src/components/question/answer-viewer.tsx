export function AnswerViewer({ html }: { html: string }) {
  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-foreground prose-a:underline prose-a:underline-offset-2"
      // Content is sanitized with DOMPurify (allow-list of tags/attrs) at write
      // time in every action that creates/updates a question — see lib/sanitize.ts.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
