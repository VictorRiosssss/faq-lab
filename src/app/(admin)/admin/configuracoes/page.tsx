import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  SEARCH_RELEVANCE_THRESHOLD,
  SEARCH_FTS_WEIGHT,
  SEARCH_TRIGRAM_WEIGHT,
  SEARCH_TRIGRAM_MIN_SIMILARITY,
} from "@/lib/search/constants";

export const metadata: Metadata = { title: "Configurações" };

export default function AdminConfiguracoesPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Busca</CardTitle>
          <CardDescription>
            Parâmetros que controlam quando um resultado é considerado relevante.
            Ajustáveis apenas por código, em{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              src/lib/search/constants.ts
            </code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <SettingRow label="Limiar de relevância" value={SEARCH_RELEVANCE_THRESHOLD} />
          <SettingRow label="Peso da busca textual (full-text)" value={SEARCH_FTS_WEIGHT} />
          <SettingRow label="Peso da similaridade (trigram)" value={SEARCH_TRIGRAM_WEIGHT} />
          <SettingRow
            label="Similaridade mínima (trigram)"
            value={SEARCH_TRIGRAM_MIN_SIMILARITY}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
