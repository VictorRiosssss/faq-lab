"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KeywordsInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string[];
}) {
  const [text, setText] = useState(defaultValue?.join(", ") ?? "");

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>Palavras-chave (separadas por vírgula)</Label>
      <Input id={name} value={text} onChange={(event) => setText(event.target.value)} />
      {text
        .split(",")
        .map((word) => word.trim())
        .filter(Boolean)
        .map((word) => (
          <input key={word} type="hidden" name={name} value={word} />
        ))}
    </div>
  );
}
