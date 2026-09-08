import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SuggestionStatusBadge } from "@/components/suggestions/suggestion-status-badge";

describe("SuggestionStatusBadge", () => {
  it("renders the Portuguese label for each status", () => {
    render(<SuggestionStatusBadge status="PENDENTE" />);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("renders CONVERTIDA with its full label", () => {
    render(<SuggestionStatusBadge status="CONVERTIDA" />);
    expect(screen.getByText("Convertida em pergunta")).toBeInTheDocument();
  });

  it("falls back to the raw status for an unknown value", () => {
    render(<SuggestionStatusBadge status="ALGO_DESCONHECIDO" />);
    expect(screen.getByText("ALGO_DESCONHECIDO")).toBeInTheDocument();
  });
});
