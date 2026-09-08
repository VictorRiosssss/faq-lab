import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "@/components/search/search-bar";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));

const sectors = [
  { id: "s1", slug: "comercial", name: "Comercial" },
  { id: "s2", slug: "tecnica", name: "Técnica" },
];

describe("SearchBar", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("navigates to /buscar with the typed query", async () => {
    const user = userEvent.setup();
    render(<SearchBar sectors={sectors} defaultQuery="" />);

    const input = screen.getByPlaceholderText(/pesquise um processo/i);
    await user.type(input, "contrato{Enter}");

    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining("q=contrato"));
  });

  it("pre-fills the input with the default query", () => {
    render(<SearchBar sectors={sectors} defaultQuery="reembolso" />);
    expect(screen.getByDisplayValue("reembolso")).toBeInTheDocument();
  });
});
