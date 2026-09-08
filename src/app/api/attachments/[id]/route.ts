import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/server/db/prisma";
import { requireSession } from "@/server/auth/session";
import { ATTACHMENTS_DIR } from "@/lib/attachments";

// Types the browser can render natively — served as "inline" so they open in
// a tab instead of forcing a download. Word/Excel-family types have no useful
// in-browser preview, so those still force a download.
function isInlineViewable(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType === "text/plain" ||
    mimeType === "text/csv"
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    return NextResponse.json({ error: "Anexo não encontrado." }, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(ATTACHMENTS_DIR, attachment.storedName));
    const dispositionType = isInlineViewable(attachment.mimeType) ? "inline" : "attachment";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(attachment.filename)}"`,
        "Content-Length": String(attachment.size),
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado no servidor." }, { status: 404 });
  }
}
