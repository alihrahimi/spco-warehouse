import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk `StorageProvider` (Frontend Architecture §2's planned
 * abstraction, first implemented here for product images — Phase 12 is
 * the first phase actually needing file storage). Files land under
 * `public/uploads/<subdirectory>/`, which Next.js serves as static assets
 * automatically; the DB only ever stores the returned public path.
 *
 * Every filename is a fresh random UUID, never the original filename or
 * an overwrite of an existing path — the same immutable-file-path rule
 * DESIGN-SYSTEM.md fixed for the company logo, extended here to product
 * images: replacing a product's photo must never silently corrupt a
 * reference some other code (or a cached browser tab) still holds.
 *
 * Swapping this for an S3-backed provider later means adding a second
 * module with the same two function signatures and changing one import —
 * nothing here is Next.js- or Vercel-specific enough to block that.
 */

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type SaveImageResult = { success: true; publicPath: string } | { success: false; error: string };

export async function saveUploadedImage(file: File, subdirectory: string): Promise<SaveImageResult> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { success: false, error: "فرمت فایل باید JPG، PNG یا WebP باشد" };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: "حجم فایل نباید بیشتر از ۵ مگابایت باشد" };
  }

  const extension = EXTENSION_BY_MIME[file.type];
  const filename = `${randomUUID()}.${extension}`;
  const targetDirectory = path.join(UPLOADS_ROOT, subdirectory);
  await mkdir(targetDirectory, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(targetDirectory, filename), buffer);

  return { success: true, publicPath: `/uploads/${subdirectory}/${filename}` };
}

/** `publicPath` is the exact string returned by `saveUploadedImage` (e.g. `/uploads/products/<uuid>.jpg`) — never a caller-constructed path. */
export async function deleteUploadedImage(publicPath: string): Promise<void> {
  const relativePath = publicPath.replace(/^\/uploads\//, "");
  const absolutePath = path.join(UPLOADS_ROOT, relativePath);

  // Defensive: never delete outside the uploads root, even if a caller
  // somehow passed a path containing `..` segments.
  if (!absolutePath.startsWith(UPLOADS_ROOT)) {
    throw new Error("مسیر فایل نامعتبر است");
  }

  try {
    await unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
