import { z } from "zod";

export const CreateSectorSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do setor."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const UpdateSectorSchema = CreateSectorSchema.extend({
  id: z.string().min(1),
});

export type CreateSectorInput = z.infer<typeof CreateSectorSchema>;
export type UpdateSectorInput = z.infer<typeof UpdateSectorSchema>;
