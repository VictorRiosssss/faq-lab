import { test, expect } from "@playwright/test";
import { TEST_ADMIN } from "../fixtures/test-users";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill(TEST_ADMIN.login);
  await page.getByLabel("Senha").fill(TEST_ADMIN.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/admin");
}

test.describe("Administração de setores", () => {
  test("admin cria e edita um setor", async ({ page }) => {
    await loginAsAdmin(page);

    const name = `Setor E2E ${Date.now()}`;
    await page.goto("/admin/setores/novo");
    await page.getByLabel("Nome").fill(name);
    await page.getByLabel("Descrição").fill("Descrição de teste");
    await page.getByRole("button", { name: "Criar setor" }).click();

    await expect(page).toHaveURL("/admin/setores");
    await expect(page.getByText(name)).toBeVisible();
  });

  test("exclusão é bloqueada quando o setor tem perguntas dependentes", async ({ page }) => {
    await loginAsAdmin(page);
    // "Comercial" is seeded with at least one question by the fixture reset.
    await page.goto("/admin/setores");
    const row = page.getByRole("row", { name: /comercial/i });

    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByText(/não é possível excluir/i)).toBeVisible();
  });

  test("setor sem perguntas pode ser excluído", async ({ page }) => {
    await loginAsAdmin(page);

    const name = `Setor Vazio ${Date.now()}`;
    await page.goto("/admin/setores/novo");
    await page.getByLabel("Nome").fill(name);
    await page.getByRole("button", { name: "Criar setor" }).click();
    await expect(page).toHaveURL("/admin/setores");

    const row = page.getByRole("row", { name: new RegExp(name) });
    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: "Excluir" }).click();

    await expect(page.getByText(name)).not.toBeVisible();
  });
});
