import { test, expect } from "@playwright/test";
import { TEST_COLLABORATOR } from "../fixtures/test-users";

async function loginAsCollaborator(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Usuário").fill(TEST_COLLABORATOR.login);
  await page.getByLabel("Senha").fill(TEST_COLLABORATOR.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}

test.describe("Busca", () => {
  test("busca com termo exato retorna a pergunta seedada", async ({ page }) => {
    await loginAsCollaborator(page);
    await page.getByPlaceholder(/pesquise um processo/i).fill("contrato");
    await page.getByPlaceholder(/pesquise um processo/i).press("Enter");

    await expect(page).toHaveURL(/\/buscar\?q=contrato/);
    await expect(page.getByText(/cliente não aceita assinar o contrato/i)).toBeVisible();
  });

  test("busca com paráfrase ainda encontra a pergunta (full-text + trigram)", async ({
    page,
  }) => {
    await loginAsCollaborator(page);
    await page.goto("/buscar?q=cliente não quer assinar contrato");

    await expect(page.getByText(/cliente não aceita assinar o contrato/i)).toBeVisible();
  });

  test("filtro por setor restringe os resultados", async ({ page }) => {
    await loginAsCollaborator(page);
    await page.goto("/buscar?q=contrato&sector=comercial");

    await expect(page.getByText(/cliente não aceita assinar o contrato/i)).toBeVisible();
  });

  test("termo sem correspondência mostra o CTA de sugestão", async ({ page }) => {
    await loginAsCollaborator(page);
    await page.goto("/buscar?q=xyzabc termo inexistente 12345");

    await expect(page.getByText(/nenhum resultado encontrado/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Enviar sugestão" })).toBeVisible();
  });

  test("abrir um resultado mostra a pergunta e a resposta completa", async ({ page }) => {
    await loginAsCollaborator(page);
    await page.goto("/buscar?q=contrato");
    await page.getByText(/cliente não aceita assinar o contrato/i).click();

    await expect(
      page.getByRole("heading", { name: /cliente não aceita assinar o contrato/i }),
    ).toBeVisible();
  });
});
