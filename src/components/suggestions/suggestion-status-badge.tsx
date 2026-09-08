import { Badge } from "@/components/ui/badge";
import { SUGGESTION_STATUS_LABELS } from "@/lib/constants";

const VARIANT_BY_STATUS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  PENDENTE: "secondary",
  EM_ANALISE: "warning",
  APROVADA: "default",
  REJEITADA: "destructive",
  CONVERTIDA: "success",
};

export function SuggestionStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={VARIANT_BY_STATUS[status] ?? "secondary"}>
      {SUGGESTION_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
