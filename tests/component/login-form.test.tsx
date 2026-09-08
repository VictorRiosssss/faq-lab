import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";

vi.mock("@/server/actions/auth.actions", () => ({
  loginAction: vi.fn(async (_prevState: unknown, formData: FormData) => {
    const login = formData.get("login");
    if (login === "invalido") {
      return { error: "Usuário ou senha inválidos." };
    }
    return {};
  }),
}));

describe("LoginForm", () => {
  it("renders the usuário and senha fields and a submit button", () => {
    render(<LoginForm callbackUrl="/" />);
    expect(screen.getByLabelText("Usuário")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("shows an error message when the action returns one", async () => {
    const user = userEvent.setup();
    render(<LoginForm callbackUrl="/" />);

    await user.type(screen.getByLabelText("Usuário"), "invalido");
    await user.type(screen.getByLabelText("Senha"), "senhaerrada");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Usuário ou senha inválidos.");
  });
});
