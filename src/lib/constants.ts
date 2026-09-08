export const ROLES = {
  ADMIN: "ADMIN",
  COLLABORATOR: "COLLABORATOR",
} as const;

export const SUGGESTION_STATUS = {
  PENDENTE: "PENDENTE",
  EM_ANALISE: "EM_ANALISE",
  APROVADA: "APROVADA",
  REJEITADA: "REJEITADA",
  CONVERTIDA: "CONVERTIDA",
} as const;

export const SUGGESTION_STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANALISE: "Em análise",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  CONVERTIDA: "Convertida em pergunta",
};

export const DEFAULT_PAGE_SIZE = 20;
export const DASHBOARD_DEFAULT_WINDOW_DAYS = 30;
