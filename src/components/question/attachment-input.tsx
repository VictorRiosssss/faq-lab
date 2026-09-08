"use client";

import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ALLOWED_ATTACHMENT_TYPES, formatFileSize } from "@/lib/attachments";

export function AttachmentInput({ name }: { name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        name={name}
        multiple
        accept={Object.keys(ALLOWED_ATTACHMENT_TYPES).join(",")}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="h-4 w-4" />
        Adicionar arquivo
      </Button>
      {files.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {files.map((file) => (
            <li key={file.name} className="text-sm text-muted-foreground">
              {file.name} · {formatFileSize(file.size)}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-xs text-muted-foreground">
        PDF, Word, Excel, CSV, texto ou imagem — até 10MB por arquivo.
      </p>
    </div>
  );
}
