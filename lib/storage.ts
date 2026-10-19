import fs from "fs";
import path from "path";
import crypto from "crypto";

function getUploadDir(): string {
  const dir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export interface StoredFile {
  storageKey: string;
  publicUrl: string;
  sizeBytes: number;
  originalName: string;
  mimeType: string;
}

/**
 * Saves uploaded video file to local storage or S3/MinIO
 */
export async function saveVideoFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string = "video/mp4"
): Promise<StoredFile> {
  const uploadDir = getUploadDir();
  const fileExt = path.extname(originalName) || ".mp4";
  const uniqueId = crypto.randomUUID();
  const safeFilename = `${uniqueId}${fileExt}`;
  const filePath = path.join(uploadDir, safeFilename);

  await fs.promises.writeFile(filePath, fileBuffer);

  return {
    storageKey: safeFilename,
    publicUrl: `/uploads/${safeFilename}`,
    sizeBytes: fileBuffer.length,
    originalName,
    mimeType,
  };
}

/**
 * Retrieves the video file buffer by storage key
 */
export async function getVideoBuffer(storageKey: string): Promise<Buffer> {
  const uploadDir = getUploadDir();
  const sanitizedKey = path.basename(storageKey);
  const filePath = path.join(uploadDir, sanitizedKey);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found at ${filePath}`);
  }
  return await fs.promises.readFile(filePath);
}

/**
 * Returns absolute filesystem path of the video
 */
export function getVideoPath(storageKey: string): string {
  const uploadDir = getUploadDir();
  const sanitizedKey = path.basename(storageKey);
  return path.join(uploadDir, sanitizedKey);
}

/**
 * Removes file from storage
 */
export async function deleteVideoFile(storageKey: string): Promise<void> {
  const uploadDir = getUploadDir();
  const sanitizedKey = path.basename(storageKey);
  const filePath = path.join(uploadDir, sanitizedKey);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
}
