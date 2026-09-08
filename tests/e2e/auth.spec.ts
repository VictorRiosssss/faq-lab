import { test, expect } from "@playwright/test";
import { TEST_ADMIN, TEST_COLLABORATOR } from "../fixtures/test-users";

test.describe("Autenticação", () => {
  test("colaborador faz login e é redirecionado para a home", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Usuário").fill(TEST_COLLABORATOR.login);
    await page.getByLabel("Senha").fill(TEST_COLLABORATOR.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Qual a sua dúvida?" })).toBeVisible();
  });

  test("admin faz login e é redirecionado para o dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Usuário").fill(TEST_ADMIN.login);
    await page.getByLabel("Senha").fill(TEST_ADMIN.password);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/admin");
    await expect(page.getByRole("heading", { name: "Visão geral" })).toBeVisible();
  });

  test("credenciais inválidas mostram mensagem de erro", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Usuário").fill(TEST_COLLABORATOR.login);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByText("Usuário ou senha inválidos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("colaborador não acessa /admin diretamente", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Usuário").fill(TEST_COLLABORATOR.login);
    await page.getByLabel("Senha").fill(TEST_COLLABORATOR.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });

  test("logout encerra a sessão e bloqueia rotas protegidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Usuário").fill(TEST_COLLABORATOR.login);
    await page.getByLabel("Senha").fill(TEST_COLLABORATOR.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/login/);
  });
});
