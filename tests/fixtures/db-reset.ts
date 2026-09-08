import "dotenv/config";
import { prisma } from "../../src/server/db/prisma";
import { hashPassword } from "../../src/lib/password";
import { TEST_ADMIN, TEST_COLLABORATOR } from "./test-users";

/**
 * Truncates the mutable tables and re-creates the two e2e test users.
 * Run before the Playwright suite against a disposable test database —
 * never against a database with real data.
 */
export async function resetTestDatabase() {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.questionView.deleteMany(),
    prisma.searchLog.deleteMany(),
    prisma.suggestion.deleteMany(),
    prisma.question.deleteMany(),
    prisma.sector.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const [adminHash, collaboratorHash] = await Promise.all([
    hashPassword(TEST_ADMIN.password),
    hashPassword(TEST_COLLABORATOR.password),
  ]);

  await prisma.user.createMany({
    data: [
      { login: TEST_ADMIN.login, name: TEST_ADMIN.name, passwordHash: adminHash, role: "ADMIN" },
      {
        login: TEST_COLLABORATOR.login,
        name: TEST_COLLABORATOR.name,
        passwordHash: collaboratorHash,
        role: "COLLABORATOR",
      },
    ],
  });

  const sector = await prisma.sector.create({
    data: { name: "Comercial", slug: "comercial", description: "Processos comerciais." },
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { login: TEST_ADMIN.login } });

  await prisma.question.create({
    data: {
      question: "O que fazer quando o cliente não aceita assinar o contrato?",
      answerHtml: "<p>Reforce os benefícios e registre a objeção no CRM.</p>",
      answerText: "Reforce os benefícios e registre a objeção no CRM.",
      keywords: ["contrato", "assinatura"],
      sectorId: sector.id,
      createdById: admin.id,
    },
  });
}

if (require.main === module) {
  resetTestDatabase()
    .then(() => {
      console.log("Test database reset.");
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
