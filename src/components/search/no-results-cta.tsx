import { SuggestionModal } from "@/components/search/suggestion-modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Sector = { id: string; name: string };

export function NoResultsCta({
  sectors,
  query,
}: {
  sectors: Sector[];
  query: string;
}) {
  return (
    <EmptyState
      title="Nenhum resultado encontrado"
      description="Tente usar outras palavras ou procure pelo setor correspondente. Você também pode ajudar a melhorar nossa base enviando sua dúvida."
      action={
        <SuggestionModal
          sectors={sectors}
          defaultQuestionText={query}
          trigger={<Button className="mt-1">Enviar sugestão</Button>}
        />
      }
    />
  );
}
