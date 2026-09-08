import { describe, expect, it } from "vitest";
import { CreateUserSchema, ChangeOwnPasswordSchema } from "@/server/validation/user.schema";

describe("CreateUserSchema", () => {
  it("accepts a valid payload", () => {
    const result = CreateUserSchema.safeParse({
      name: "Maria Silva",
      login: "maria.silva",
      password: "senha1234",
      role: "COLLABORATOR",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a short password", () => {
    const result = CreateUserSchema.safeParse({
      name: "Maria Silva",
      login: "maria.silva",
      password: "123",
      role: "COLLABORATOR",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a login with invalid characters", () => {
    const result = CreateUserSchema.safeParse({
      name: "Maria Silva",
      login: "maria silva!",
      password: "senha1234",
      role: "COLLABORATOR",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid role", () => {
    const result = CreateUserSchema.safeParse({
      name: "Maria Silva",
      login: "maria.silva",
      password: "senha1234",
      role: "SUPERUSER",
    });
    expect(result.success).toBe(false);
  });
});

describe("ChangeOwnPasswordSchema", () => {
  it("rejects when confirmation does not match", () => {
    const result = ChangeOwnPasswordSchema.safeParse({
      currentPassword: "atual123",
      newPassword: "novaSenha123",
      confirmPassword: "outraSenha123",
    });
    expect(result.success).toBe(false);
  });
});
