import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TopQuestionsTable({
  title,
  items,
}: {
  title: string;
  items: { questionId: string; question: string; count: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <ol className="flex flex-col gap-2 text-sm">
            {items.map((item, index) => (
              <li key={item.questionId} className="flex justify-between gap-4">
                <span className="text-foreground/80">
                  {index + 1}. {item.question}
                </span>
                <span className="shrink-0 text-muted-foreground">{item.count}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
