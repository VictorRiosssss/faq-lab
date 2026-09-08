import { test, expect } from "@playwright/test";
import { TEST_ADMIN, TEST_COLLABORATOR } from "../fixtures/test-users";

async function login(
  page: import("@playwright/test").Page,
  user: { login: string; password: string },
) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill(user.login);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function logout(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login/);
}

test.describe("Fluxo de sugestões", () => {
  test("colaborador sugere, admin aprova e converte em pergunta oficial", async ({
    page,
  }) => {
    const uniqueTerm = `sugestaoe2e${Date.now()}`;
    const suggestionText = `Como funciona o processo de ${uniqueTerm}?`;

    // 1. Collaborator searches for something that doesn't exist and sends a suggestion.
    await login(page, TEST_COLLABORATOR);
    await expect(page).toHaveURL("/");

    await page.goto(`/buscar?q=${encodeURIComponent(uniqueTerm)}`);
    await expect(page.getByText(/nenhum resultado encontrado/i)).toBeVisible();
    await page.getByRole("button", { name: "Enviar sugestão" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/sua dúvida/i).fill(suggestionText);
    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog).not.toBeVisible();

    // 2. Admin sees the suggestion and converts it into an official question.
    await logout(page);
    await login(page, TEST_ADMIN);
    await expect(page).toHaveURL("/admin");

    await page.goto("/admin/sugestoes");
    await page.getByText(suggestionText).click();

    await expect(page.getByRole("heading", { name: suggestionText })).toBeVisible();
    await page.getByRole("button", { name: "Aprovar" }).click();
    await expect(page.getByText("Aprovada")).toBeVisible();

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Comercial" }).click();
    await page.locator(".ProseMirror").click();
    await page.locator(".ProseMirror").type("Resposta oficial gerada no e2e.");
    await page.getByRole("button", { name: "Converter em pergunta oficial" }).click();

    await expect(page).toHaveURL("/admin/sugestoes");

    // 3. The converted question is now findable in search.
    await logout(page);
    await login(page, TEST_COLLABORATOR);
    await expect(page).toHaveURL("/");

    await page.goto(`/buscar?q=${encodeURIComponent(uniqueTerm)}`);
    await expect(page.getByText(suggestionText)).toBeVisible();
  });
});
