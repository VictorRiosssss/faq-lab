import { z } from "zod";

const loginField = z
  .string()
  .trim()
  .min(3, "O login deve ter pelo menos 3 caracteres.")
  .max(50, "O login deve ter no máximo 50 caracteres.")
  .regex(/^[a-zA-Z0-9._-]+$/, "Use apenas letras, números, ponto, hífen e underline.");

const passwordField = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.");

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo."),
  login: loginField,
  password: passwordField,
  role: z.enum(["ADMIN", "COLLABORATOR"]),
});

export const UpdateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "Informe o nome completo."),
  login: loginField,
  role: z.enum(["ADMIN", "COLLABORATOR"]),
  isActive: z.boolean(),
});

export const ResetPasswordSchema = z.object({
  id: z.string().min(1),
  password: passwordField,
});

export const ChangeOwnPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangeOwnPasswordInput = z.infer<typeof ChangeOwnPasswordSchema>;
