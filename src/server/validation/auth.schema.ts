import { z } from "zod";

export const LoginSchema = z.object({
  login: z.string().trim().min(1, "Informe o usuário."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof LoginSchema>;
