import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeywordsInput } from "@/components/question/keywords-input";

describe("KeywordsInput", () => {
  it("splits comma-separated text into hidden inputs", async () => {
    const user = userEvent.setup();
    const { container } = render(<KeywordsInput name="keywords" />);

    const field = screen.getByLabelText(/palavras-chave/i);
    await user.type(field, "contrato, assinatura");

    const hiddenInputs = container.querySelectorAll('input[type="hidden"][name="keywords"]');
    const values = Array.from(hiddenInputs).map((el) => (el as HTMLInputElement).value);
    expect(values).toEqual(["contrato", "assinatura"]);
  });

  it("pre-fills from defaultValue", () => {
    render(<KeywordsInput name="keywords" defaultValue={["reembolso", "viagem"]} />);
    expect(screen.getByDisplayValue("reembolso, viagem")).toBeInTheDocument();
  });
});
