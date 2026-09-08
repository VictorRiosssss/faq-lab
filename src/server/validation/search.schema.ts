import { z } from "zod";

export const SearchSchema = z.object({
  query: z.string().trim().min(2, "Digite pelo menos 2 caracteres."),
  sectorSlug: z.string().trim().min(1).optional(),
});

export type SearchInput = z.infer<typeof SearchSchema>;
