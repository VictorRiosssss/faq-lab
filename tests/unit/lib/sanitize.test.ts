import { describe, expect, it } from "vitest";
import { sanitizeAnswerHtml, stripHtmlToText } from "@/lib/sanitize";

describe("sanitizeAnswerHtml", () => {
  it("strips script tags", () => {
    const dirty = "<p>Olá</p><script>alert(1)</script>";
    expect(sanitizeAnswerHtml(dirty)).toBe("<p>Olá</p>");
  });

  it("keeps allowed formatting tags", () => {
    const html = "<h2>Título</h2><p>Texto <b>importante</b></p><ul><li>Item</li></ul>";
    expect(sanitizeAnswerHtml(html)).toContain("<h2>Título</h2>");
    expect(sanitizeAnswerHtml(html)).toContain("<b>importante</b>");
    expect(sanitizeAnswerHtml(html)).toContain("<li>Item</li>");
  });

  it("strips disallowed attributes like onclick", () => {
    const dirty = '<a href="https://labplan.com" onclick="steal()">link</a>';
    const clean = sanitizeAnswerHtml(dirty);
    expect(clean).not.toContain("onclick");
    expect(clean).toContain('href="https://labplan.com"');
  });
});

describe("stripHtmlToText", () => {
  it("removes tags and collapses whitespace", () => {
    const html = "<p>Olá   <b>mundo</b></p>\n<p>Segunda linha</p>";
    expect(stripHtmlToText(html)).toBe("Olá mundo Segunda linha");
  });
});
