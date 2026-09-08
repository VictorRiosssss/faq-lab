import { describe, expect, it } from "vitest";
import {
  CreateSuggestionSchema,
  ConvertSuggestionSchema,
} from "@/server/validation/suggestion.schema";

describe("CreateSuggestionSchema", () => {
  it("accepts a minimal valid suggestion", () => {
    const result = CreateSuggestionSchema.safeParse({
      questionText: "Como funciona o processo de reembolso de viagem?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a question that is too short", () => {
    const result = CreateSuggestionSchema.safeParse({ questionText: "Oi" });
    expect(result.success).toBe(false);
  });
});

describe("ConvertSuggestionSchema", () => {
  it("requires a sector and a final answer", () => {
    const result = ConvertSuggestionSchema.safeParse({
      id: "suggestion-1",
      finalQuestion: "Como solicitar reembolso de viagem corporativa?",
      finalAnswerHtml: "",
      sectorId: "",
      keywords: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete conversion payload", () => {
    const result = ConvertSuggestionSchema.safeParse({
      id: "suggestion-1",
      finalQuestion: "Como solicitar reembolso de viagem corporativa?",
      finalAnswerHtml: "<p>Acesse o sistema financeiro.</p>",
      sectorId: "sector-1",
      keywords: ["reembolso", "viagem"],
    });
    expect(result.success).toBe(true);
  });
});
