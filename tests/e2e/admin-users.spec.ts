import { test, expect } from "@playwright/test";
import { TEST_ADMIN } from "../fixtures/test-users";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill(TEST_ADMIN.login);
  await page.getByLabel("Senha").fill(TEST_ADMIN.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/admin");
}

test.describe("Administração de usuários", () => {
  test("admin cria, edita e desativa um usuário", async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/usuarios/novo");
    const login = `usuario.e2e.${Date.now()}`;
    await page.getByLabel("Nome").fill("Usuário E2E");
    await page.getByLabel("Login").fill(login);
    await page.getByLabel("Senha").fill("SenhaForte123!");
    await page.getByRole("button", { name: "Criar usuário" }).click();

    await expect(page).toHaveURL("/admin/usuarios");
    await expect(page.getByText(login)).toBeVisible();

    await page.getByText(login).locator("..").getByText("Editar").click();
    await expect(page.getByLabel("Nome")).toHaveValue("Usuário E2E");
    await page.getByLabel("Nome").fill("Usuário E2E Editado");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Dados salvos.")).toBeVisible();

    await page.getByRole("button", { name: "Desativar usuário" }).click();
    await expect(page.getByRole("button", { name: "Ativar usuário" })).toBeVisible();
  });

  test("usuário desativado não consegue fazer login", async ({ page, browser }) => {
    await loginAsAdmin(page);

    const login = `usuario.inativo.${Date.now()}`;
    await page.goto("/admin/usuarios/novo");
    await page.getByLabel("Nome").fill("Usuário Inativo");
    await page.getByLabel("Login").fill(login);
    await page.getByLabel("Senha").fill("SenhaForte123!");
    await page.getByRole("button", { name: "Criar usuário" }).click();
    await expect(page).toHaveURL("/admin/usuarios");

    await page.getByText(login).locator("..").getByText("Editar").click();
    await page.getByRole("button", { name: "Desativar usuário" }).click();
    await expect(page.getByRole("button", { name: "Ativar usuário" })).toBeVisible();

    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await otherPage.goto("/login");
    await otherPage.getByLabel("Usuário").fill(login);
    await otherPage.getByLabel("Senha").fill("SenhaForte123!");
    await otherPage.getByRole("button", { name: "Entrar" }).click();

    await expect(otherPage.getByText("Usuário ou senha inválidos.")).toBeVisible();
    await otherContext.close();
  });
});
