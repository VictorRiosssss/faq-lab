export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = "APP_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Você não tem permissão para executar esta ação.") {
    super(message, "UNAUTHORIZED");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Registro não encontrado.") {
    super(message, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT");
  }
}

/**
 * Converts any thrown value into a safe, user-facing message.
 * Never leaks stack traces or internal details for unexpected errors.
 */
export function toSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  return "Ocorreu um erro inesperado. Tente novamente.";
}
