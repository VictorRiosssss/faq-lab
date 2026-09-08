"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileSpreadsheet, FileText, Paperclip } from "lucide-react";
import { formatFileSize } from "@/lib/attachments";

export type AttachmentItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
};

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isInlinePreviewable(mimeType: string) {
  return (
    isImage(mimeType) ||
    mimeType === "application/pdf" ||
    mimeType === "text/plain" ||
    mimeType === "text/csv"
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf" || mimeType.includes("word")) {
    return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  if (mimeType.includes("spreadsheet") || mimeType === "text/csv") {
    return <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  return <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

function AttachmentPreviewModal({
  attachment,
  onClose,
}: {
  attachment: AttachmentItem;
  onClose: () => void;
}) {
  const url = `/api/attachments/${attachment.id}`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={attachment.filename}
      className="fixed inset-0 z-50 flex flex-col bg-black/85 animate-in fade-in-0 duration-150"
      onClick={onClose}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center gap-2.5 text-sm text-white">
          <FileIcon mimeType={attachment.mimeType} />
          <span className="truncate">{attachment.filename}</span>
          <span className="shrink-0 text-xs text-white/60">
            {formatFileSize(attachment.size)}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={url}
            download={attachment.filename}
            className="flex items-center gap-1.5 rounded-input bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Baixar
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex cursor-pointer items-center gap-1.5 rounded-input bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8" onClick={onClose}>
        {isImage(attachment.mimeType) ? (
          // eslint-disable-next-line @next/next/no-img-element -- authenticated route, not a static asset
          <img
            src={url}
            alt={attachment.filename}
            className="max-h-full max-w-full rounded-card object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        ) : isInlinePreviewable(attachment.mimeType) ? (
          <iframe
            src={url}
            title={attachment.filename}
            className="h-full w-full rounded-card bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="flex flex-col items-center gap-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-white/80">
              Pré-visualização não disponível para este tipo de arquivo.
            </p>
            <a
              href={url}
              download={attachment.filename}
              className="flex items-center gap-1.5 rounded-button bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              <Download className="h-4 w-4" />
              Baixar arquivo
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function AttachmentList({
  attachments,
  action,
}: {
  attachments: AttachmentItem[];
  action?: (attachment: AttachmentItem) => React.ReactNode;
}) {
  const [preview, setPreview] = useState<AttachmentItem | null>(null);

  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => isImage(a.mimeType));
  const files = attachments.filter((a) => !isImage(a.mimeType));

  return (
    <div className="flex flex-col gap-4">
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((attachment) => (
            <div
              key={attachment.id}
              className="flex flex-col overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-border-hover"
            >
              <button
                type="button"
                onClick={() => setPreview(attachment)}
                className="block aspect-video w-full cursor-pointer overflow-hidden bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- authenticated route, not a static asset */}
                <img
                  src={`/api/attachments/${attachment.id}`}
                  alt={attachment.filename}
                  className="h-full w-full object-cover transition duration-150 hover:scale-[1.03]"
                />
              </button>
              <div className="flex items-center justify-between gap-2 px-2.5 py-2">
                <span className="truncate text-xs text-foreground" title={attachment.filename}>
                  {attachment.filename}
                </span>
                {action ? action(attachment) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {files.length > 0 ? (
        <div className="flex flex-col gap-2">
          {files.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 rounded-input border border-border bg-card px-3.5 py-2.5 transition-colors hover:bg-background-subtle"
            >
              <button
                type="button"
                onClick={() => setPreview(attachment)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <FileIcon mimeType={attachment.mimeType} />
                <span className="truncate">{attachment.filename}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </span>
              </button>
              {action ? action(attachment) : null}
            </div>
          ))}
        </div>
      ) : null}

      {preview ? (
        <AttachmentPreviewModal attachment={preview} onClose={() => setPreview(null)} />
      ) : null}
    </div>
  );
}
