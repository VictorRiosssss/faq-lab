import { randomUUID } from "node:crypto";
import path from "node:path";

export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENTS_PER_QUESTION = 8;

/**
 * Extension -> MIME type allow-list. Deliberately excludes anything
 * executable/script-like — this is a document portal, not a file drop.
 */
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export function isAllowedAttachmentExtension(filename: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    ALLOWED_ATTACHMENT_TYPES,
    path.extname(filename).toLowerCase(),
  );
}

/** Directory attachments are written to. Never inside `public/` — downloads
 * are only ever served through the authenticated route handler. */
export const ATTACHMENTS_DIR = path.resolve(process.cwd(), "storage", "attachments");

/** Generates a random on-disk filename, never derived from user input. */
export function generateStoredName(originalFilename: string): string {
  const ext = path.extname(originalFilename).toLowerCase();
  return `${randomUUID()}${ext}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
