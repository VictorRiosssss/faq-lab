import { test, expect } from "@playwright/test";
import { TEST_ADMIN } from "../fixtures/test-users";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill(TEST_ADMIN.login);
  await page.getByLabel("Senha").fill(TEST_ADMIN.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/admin");
}

test.describe("Administração de perguntas", () => {
  test("admin cria uma pergunta com resposta rica e ela aparece publicamente", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    const questionText = `Pergunta E2E ${Date.now()}?`;
    await page.goto("/admin/perguntas/novo");

    await page.getByLabel("Pergunta", { exact: true }).fill(questionText);
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Comercial" }).click();

    const editor = page.locator(".ProseMirror");
    await editor.click();
    await editor.type("Resposta de teste com ");
    await page.getByRole("button", { name: "Negrito" }).click();
    await editor.type("negrito");

    await page.getByRole("button", { name: "Criar pergunta" }).click();
    await expect(page).toHaveURL("/admin/perguntas");
    await expect(page.getByText(questionText)).toBeVisible();

    // Follow through to the public detail page (via search — the admin list
    // links to the edit page, not the public one) and confirm the rich text
    // rendered.
    await page.goto(`/buscar?q=${encodeURIComponent(questionText)}`);
    await page.getByText(questionText).click();
    await expect(page.getByRole("heading", { name: questionText })).toBeVisible();
    await expect(page.locator("strong", { hasText: "negrito" })).toBeVisible();
  });

  test("desativar uma pergunta remove ela da busca", async ({ page }) => {
    await loginAsAdmin(page);

    // Create a dedicated question rather than touching seeded data other
    // specs (search.spec.ts, suggestions.spec.ts) depend on.
    const uniqueTerm = `zzzquestao${Date.now()}`;
    const questionText = `Pergunta temporária sobre ${uniqueTerm}?`;
    await page.goto("/admin/perguntas/novo");
    await page.getByLabel("Pergunta", { exact: true }).fill(questionText);
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Comercial" }).click();
    await page.locator(".ProseMirror").click();
    await page.locator(".ProseMirror").type("Resposta temporária.");
    await page.getByRole("button", { name: "Criar pergunta" }).click();
    await expect(page).toHaveURL("/admin/perguntas");

    const row = page.getByRole("row", { name: questionText });
    await row.getByText("Editar").click();
    await page.getByLabel(/pergunta ativa/i).uncheck();
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page).toHaveURL("/admin/perguntas");

    await page.goto(`/buscar?q=${encodeURIComponent(uniqueTerm)}`);
    await expect(page.getByText(/nenhum resultado encontrado/i)).toBeVisible();
  });
});
