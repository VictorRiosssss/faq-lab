import { describe, expect, it } from "vitest";
import { CreateQuestionSchema } from "@/server/validation/question.schema";

describe("CreateQuestionSchema", () => {
  it("accepts a valid question", () => {
    const result = CreateQuestionSchema.safeParse({
      question: "Como solicitar reembolso de despesas?",
      answerHtml: "<p>Acesse o sistema financeiro.</p>",
      sectorId: "sector-1",
      keywords: ["reembolso", "despesa"],
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a question that is too short", () => {
    const result = CreateQuestionSchema.safeParse({
      question: "Oi?",
      answerHtml: "<p>Resposta</p>",
      sectorId: "sector-1",
      keywords: [],
      isActive: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires a sector", () => {
    const result = CreateQuestionSchema.safeParse({
      question: "Como funciona o processo de aprovação?",
      answerHtml: "<p>Resposta</p>",
      sectorId: "",
      keywords: [],
      isActive: true,
    });
    expect(result.success).toBe(false);
  });
});
