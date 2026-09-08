"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

type Sector = { id: string; name: string };

export function SectorSelect({
  name,
  sectors,
  defaultValue,
}: {
  name: string;
  sectors: Sector[];
  defaultValue?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um setor" />
      </SelectTrigger>
      <SelectContent>
        {sectors.map((sector) => (
          <SelectItem key={sector.id} value={sector.id}>
            {sector.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
