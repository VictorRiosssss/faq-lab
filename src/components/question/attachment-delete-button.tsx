"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteAttachment } from "@/server/actions/questions.actions";

export function AttachmentDeleteButton({ attachmentId }: { attachmentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Excluir este anexo?")) return;
    startTransition(async () => {
      await deleteAttachment(attachmentId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      aria-label="Excluir anexo"
      disabled={isPending}
      onClick={handleDelete}
      className="shrink-0 cursor-pointer rounded-sm p-1 text-muted-foreground transition hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
