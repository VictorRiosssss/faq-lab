import { z } from "zod";

const keywordsField = z
  .array(z.string().trim().min(1))
  .max(20, "No máximo 20 palavras-chave.")
  .default([]);

export const CreateQuestionSchema = z.object({
  question: z.string().trim().min(5, "A pergunta deve ter pelo menos 5 caracteres."),
  answerHtml: z.string().trim().min(1, "Informe a resposta."),
  sectorId: z.string().min(1, "Selecione um setor."),
  keywords: keywordsField,
  isActive: z.boolean().default(true),
});

export const UpdateQuestionSchema = CreateQuestionSchema.extend({
  id: z.string().min(1),
});

export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;
