"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function UserRoleSelect({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: "ADMIN" | "COLLABORATOR";
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="COLLABORATOR">Colaborador</SelectItem>
        <SelectItem value="ADMIN">Administrador</SelectItem>
      </SelectContent>
    </Select>
  );
}
