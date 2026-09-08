import type { NextConfig } from "next";
import { MAX_ATTACHMENT_SIZE_BYTES, MAX_ATTACHMENTS_PER_QUESTION } from "./src/lib/attachments";

// Next.js caps Server Action request bodies at 1MB by default. uploadAttachments()
// can receive up to MAX_ATTACHMENTS_PER_QUESTION files at MAX_ATTACHMENT_SIZE_BYTES
// each in one call, so the limit has to cover that (plus multipart/form-data overhead).
const attachmentsBodySizeLimit =
  MAX_ATTACHMENT_SIZE_BYTES * MAX_ATTACHMENTS_PER_QUESTION + 1024 * 1024;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: attachmentsBodySizeLimit,
    },
  },
};

export default nextConfig;
