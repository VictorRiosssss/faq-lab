import "dotenv/config";
import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/server/db/prisma";
import { hashPassword } from "../src/lib/password";
import { slugify } from "../src/lib/slug";
import { sanitizeAnswerHtml, stripHtmlToText } from "../src/lib/sanitize";
import { ATTACHMENTS_DIR, generateStoredName } from "../src/lib/attachments";

const SEED_ASSETS_DIR = path.join(__dirname, "seed", "assets");

const SECTORS = [
  {
    name: "Técnica",
    description: "Processos relacionados à área técnica.",
  },
  {
    name: "Comercial",
    description: "Processos relacionados à área comercial.",
  },
  {
    name: "Financeiro",
    description: "Processos relacionados ao setor financeiro.",
  },
];

type SeedAttachment = {
  /** Name of a static test image checked into prisma/seed/assets/ — copied
   * as-is, nothing generates it. */
  imageFilename: string;
  textFilename: string;
  textContent: string;
};

type SeedQuestion = {
  sector: string;
  question: string;
  answerHtml: string;
  keywords: string[];
  attachment: SeedAttachment;
};

const QUESTIONS: SeedQuestion[] = [
  {
    sector: "Comercial",
    question: "O que fazer quando o cliente não aceita assinar o contrato?",
    answerHtml:
      "<p>Exemplo de resposta que poderá ser substituída pelo administrador.</p>" +
      "<ul><li>Reforce os benefícios da proposta.</li><li>Ofereça esclarecer dúvidas com o time comercial.</li><li>Registre a objeção no CRM.</li></ul>",
    keywords: ["contrato", "assinatura", "cliente"],
    attachment: {
      imageFilename: "imagem-objecao-contrato.png",
      textFilename: "fluxo-objecao-contrato.txt",
      textContent:
        "Roteiro de apoio — cliente não assina o contrato\n" +
        "==================================================\n\n" +
        "Este texto detalha o passo a passo para esta situação, complementando a " +
        "imagem anexa (imagem-objecao-contrato.png).\n\n" +
        "1. Reforçar os benefícios da proposta\n" +
        "   Retome com o cliente os principais ganhos da proposta (prazo, condições, " +
        "diferenciais frente à concorrência) antes de assumir que a objeção é definitiva.\n\n" +
        "2. Oferecer esclarecimento com o time comercial\n" +
        "   Ofereça uma conversa com o gestor comercial ou especialista técnico para " +
        "esclarecer pontos específicos que possam estar gerando insegurança.\n\n" +
        "3. Registrar a objeção no CRM\n" +
        "   Toda recusa ou hesitação deve ser registrada no CRM, com o motivo relatado " +
        "pelo cliente. Isso alimenta o histórico da conta e evita retrabalho em contatos " +
        "futuros.\n\n" +
        "4. Encaminhar ao gestor comercial\n" +
        "   Se o impasse persistir após as etapas anteriores, encaminhe o caso ao gestor " +
        "comercial responsável pela conta para decidir os próximos passos (renegociação, " +
        "novo prazo, ou encerramento da oportunidade).\n\n" +
        "Ver também: a pergunta \"Como funciona o processo de aprovação de uma proposta " +
        "comercial?\" no setor Comercial.\n",
    },
  },
  {
    sector: "Comercial",
    question: "Como funciona o processo de aprovação de uma proposta comercial?",
    answerHtml:
      "<p>Exemplo de resposta que poderá ser substituída pelo administrador.</p>" +
      "<p>A proposta passa por validação do gestor comercial antes de ser enviada ao cliente.</p>",
    keywords: ["proposta", "aprovação"],
    attachment: {
      imageFilename: "imagem-aprovacao-proposta.png",
      textFilename: "fluxo-aprovacao-proposta.txt",
      textContent:
        "Roteiro de apoio — aprovação de proposta comercial\n" +
        "====================================================\n\n" +
        "Este texto detalha o passo a passo, complementando a imagem anexa " +
        "(imagem-aprovacao-proposta.png).\n\n" +
        "1. Elaborar a proposta comercial\n" +
        "   O vendedor monta a proposta com condições, prazos e escopo conforme o " +
        "levantamento feito com o cliente.\n\n" +
        "2. Validação do gestor comercial\n" +
        "   Toda proposta passa pela validação do gestor comercial antes de seguir, que " +
        "confere margens, condições especiais e alçada de desconto.\n\n" +
        "3. Ajustes, se necessário\n" +
        "   Caso o gestor identifique algo fora da política comercial, a proposta volta " +
        "para ajuste antes de nova validação.\n\n" +
        "4. Envio da proposta ao cliente\n" +
        "   Após aprovada, a proposta é formalizada e enviada ao cliente.\n\n" +
        "Ver também: a pergunta \"O que fazer quando o cliente não aceita assinar o " +
        "contrato?\" no setor Comercial, para os próximos passos em caso de objeção.\n",
    },
  },
  {
    sector: "Técnica",
    question: "Quem deve autorizar uma alteração em um processo técnico já homologado?",
    answerHtml:
      "<p>Exemplo de resposta que poderá ser substituída pelo administrador.</p>" +
      "<p>Alterações precisam de aprovação do responsável técnico da área.</p>",
    keywords: ["homologação", "autorização", "processo técnico"],
    attachment: {
      imageFilename: "imagem-alteracao-processo-tecnico.png",
      textFilename: "fluxo-alteracao-processo-tecnico.txt",
      textContent:
        "Roteiro de apoio — alteração de processo técnico homologado\n" +
        "===============================================================\n\n" +
        "Este texto detalha o passo a passo, complementando a imagem anexa " +
        "(imagem-alteracao-processo-tecnico.png).\n\n" +
        "1. Solicitação de alteração\n" +
        "   Qualquer colaborador pode propor uma alteração, descrevendo o motivo e o " +
        "impacto esperado no processo já homologado.\n\n" +
        "2. Análise do responsável técnico\n" +
        "   O responsável técnico da área avalia a viabilidade e o impacto da mudança " +
        "sobre o processo homologado.\n\n" +
        "3. Aprovação formal\n" +
        "   Somente o responsável técnico da área pode autorizar formalmente a alteração " +
        "— não é uma decisão que outros papéis (comercial, financeiro) podem tomar " +
        "isoladamente.\n\n" +
        "4. Atualização da documentação homologada\n" +
        "   Após aprovada, a documentação do processo é atualizada e a versão anterior é " +
        "arquivada para histórico.\n",
    },
  },
  {
    sector: "Financeiro",
    question: "Como solicitar o reembolso de uma despesa corporativa?",
    answerHtml:
      "<p>Exemplo de resposta que poderá ser substituída pelo administrador.</p>" +
      "<ol><li>Acesse o sistema financeiro interno.</li><li>Anexe a nota fiscal.</li><li>Aguarde a aprovação do gestor.</li></ol>",
    keywords: ["reembolso", "despesa"],
    attachment: {
      imageFilename: "imagem-reembolso-despesa.png",
      textFilename: "fluxo-reembolso-despesa.txt",
      textContent:
        "Roteiro de apoio — reembolso de despesa corporativa\n" +
        "=======================================================\n\n" +
        "Este texto detalha o passo a passo, complementando a imagem anexa " +
        "(imagem-reembolso-despesa.png).\n\n" +
        "1. Acessar o sistema financeiro interno\n" +
        "   Abra o módulo de reembolsos no sistema financeiro interno com seu login " +
        "corporativo.\n\n" +
        "2. Anexar a nota fiscal\n" +
        "   Anexe a nota fiscal ou recibo da despesa, com data e valor legíveis. Despesas " +
        "sem comprovante não são reembolsadas.\n\n" +
        "3. Aguardar aprovação do gestor\n" +
        "   O gestor direto recebe a solicitação e aprova ou solicita mais informações.\n\n" +
        "4. Reembolso creditado em folha\n" +
        "   Após aprovado, o valor é creditado no próximo ciclo de folha de pagamento.\n",
    },
  },
];

async function upsertSectors() {
  const sectorsBySlug = new Map<string, { id: string }>();

  for (const sector of SECTORS) {
    const slug = slugify(sector.name);
    const record = await prisma.sector.upsert({
      where: { name: sector.name },
      update: { description: sector.description, slug },
      create: { name: sector.name, slug, description: sector.description },
    });
    sectorsBySlug.set(sector.name, record);
  }

  return sectorsBySlug;
}

async function upsertAdminUser() {
  const login = process.env.SEED_ADMIN_LOGIN?.trim() || "admin";
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrador";
  const explicitPassword = process.env.SEED_ADMIN_PASSWORD?.trim();

  const existing = await prisma.user.findUnique({ where: { login } });

  // SEED_ADMIN_PASSWORD, quando definida, é a fonte da verdade: vale na criação
  // e também redefine a senha de um admin já existente. É o único caminho de
  // recuperação de acesso que não exige mexer no banco à mão — em compensação,
  // se ela ficar definida, todo deploy volta a senha para esse valor.
  if (explicitPassword) {
    const passwordHash = await hashPassword(explicitPassword);

    if (existing) {
      await prisma.user.update({ where: { login }, data: { passwordHash } });
      console.log(`Senha de "${login}" redefinida a partir de SEED_ADMIN_PASSWORD.`);
    } else {
      await prisma.user.create({
        data: { login, name, passwordHash, role: "ADMIN", isActive: true },
      });
      console.log(`Administrador "${login}" criado com a senha de SEED_ADMIN_PASSWORD.`);
    }

    return prisma.user.findUniqueOrThrow({ where: { login } });
  }

  // Sem senha explícita e o admin já existe: não há o que fazer. Gerar e
  // imprimir uma senha aqui seria mentira — ela não é aplicada a um usuário
  // existente, e o log daria a entender que sim.
  if (existing) {
    console.log(`Administrador "${login}" já existe — senha inalterada.`);
    return existing;
  }

  const password = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: { login, name, passwordHash, role: "ADMIN", isActive: true },
  });

  console.log("\n=== Usuário administrador inicial criado ===");
  console.log(`Login: ${login}`);
  console.log(`Senha: ${password}`);
  console.log("Anote agora — ela não será exibida de novo. Troque após o primeiro login.\n");

  return prisma.user.findUniqueOrThrow({ where: { login } });
}

async function seedAttachmentsForQuestion(
  questionId: string,
  uploadedById: string,
  attachment: SeedAttachment,
) {
  const existingCount = await prisma.attachment.count({ where: { questionId } });
  if (existingCount > 0) return;

  await mkdir(ATTACHMENTS_DIR, { recursive: true });

  const imageBuffer = await readFile(path.join(SEED_ASSETS_DIR, attachment.imageFilename));
  const imageStoredName = generateStoredName(attachment.imageFilename);
  await writeFile(path.join(ATTACHMENTS_DIR, imageStoredName), imageBuffer);

  const textBuffer = Buffer.from(attachment.textContent, "utf-8");
  const textStoredName = generateStoredName(attachment.textFilename);
  await writeFile(path.join(ATTACHMENTS_DIR, textStoredName), textBuffer);

  await prisma.attachment.createMany({
    data: [
      {
        filename: attachment.imageFilename,
        storedName: imageStoredName,
        mimeType: "image/png",
        size: imageBuffer.byteLength,
        questionId,
        uploadedById,
      },
      {
        filename: attachment.textFilename,
        storedName: textStoredName,
        mimeType: "text/plain",
        size: textBuffer.byteLength,
        questionId,
        uploadedById,
      },
    ],
  });
}

async function upsertQuestions(
  sectors: Map<string, { id: string }>,
  createdById: string,
) {
  for (const item of QUESTIONS) {
    const sector = sectors.get(item.sector);
    if (!sector) continue;

    const answerHtml = sanitizeAnswerHtml(item.answerHtml);
    const answerText = stripHtmlToText(answerHtml);

    const existing = await prisma.question.findFirst({
      where: { question: item.question, sectorId: sector.id },
    });

    let questionId: string;
    if (existing) {
      await prisma.question.update({
        where: { id: existing.id },
        data: { answerHtml, answerText, keywords: item.keywords },
      });
      questionId = existing.id;
    } else {
      const created = await prisma.question.create({
        data: {
          question: item.question,
          answerHtml,
          answerText,
          keywords: item.keywords,
          sectorId: sector.id,
          createdById,
        },
      });
      questionId = created.id;
    }

    await seedAttachmentsForQuestion(questionId, createdById, item.attachment);
  }
}

// Sample sectors/questions/attachments are dev-only fixtures (fake content,
// including a real test photo) — never seed them into production by default.
// Set SEED_SAMPLE_DATA=true to force them on, or =false to force them off.
const seedSampleData = process.env.SEED_SAMPLE_DATA
  ? process.env.SEED_SAMPLE_DATA === "true"
  : process.env.NODE_ENV !== "production";

async function main() {
  const admin = await upsertAdminUser();

  if (!seedSampleData) {
    console.log("SEED_SAMPLE_DATA is off — skipping sample sectors/questions/attachments.");
    return;
  }

  const sectors = await upsertSectors();
  await upsertQuestions(sectors, admin.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
