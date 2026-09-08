import { z } from "zod";

export const CreateSuggestionSchema = z.object({
  questionText: z.string().trim().min(5, "Descreva sua dúvida com pelo menos 5 caracteres."),
  sectorId: z.string().min(1).optional().or(z.literal("")),
  context: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const EditSuggestionSchema = z.object({
  id: z.string().min(1),
  questionText: z.string().trim().min(5),
  sectorId: z.string().min(1).optional().or(z.literal("")),
  context: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const UpdateSuggestionStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["EM_ANALISE", "APROVADA", "REJEITADA"]),
});

export const ConvertSuggestionSchema = z.object({
  id: z.string().min(1),
  finalQuestion: z.string().trim().min(5, "Informe a pergunta definitiva."),
  finalAnswerHtml: z.string().trim().min(1, "Informe a resposta oficial."),
  sectorId: z.string().min(1, "Selecione um setor."),
  keywords: z.array(z.string().trim().min(1)).max(20).default([]),
});

export type CreateSuggestionInput = z.infer<typeof CreateSuggestionSchema>;
export type EditSuggestionInput = z.infer<typeof EditSuggestionSchema>;
export type UpdateSuggestionStatusInput = z.infer<typeof UpdateSuggestionStatusSchema>;
export type ConvertSuggestionInput = z.infer<typeof ConvertSuggestionSchema>;
