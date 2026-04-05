import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100);
  return `${Date.now()}_${base}${ext}`;
}

export interface UploadResult {
  file: {
    savedPath: string;
    relativePath: string;
    originalName: string;
    mimeType: string;
    size: number;
  } | null;
  fields: Record<string, string>;
  error?: string;
}

export async function handleFileUpload(
  request: NextRequest,
  uploadSubdir: string
): Promise<UploadResult> {
  const formData = await request.formData();
  const fields: Record<string, string> = {};
  let file: UploadResult['file'] = null;

  for (const [key, value] of formData.entries()) {
    if (value instanceof File && key === 'file') {
      if (value.size > MAX_FILE_SIZE) {
        return { file: null, fields, error: 'File size exceeds 10MB limit' };
      }
      if (!ALLOWED_MIMES.includes(value.type)) {
        return { file: null, fields, error: 'File type not allowed. Accepted: images (jpg, png, gif, webp), PDF, Word, Excel' };
      }

      const uploadDir = path.join(process.cwd(), 'uploads', uploadSubdir);
      fs.mkdirSync(uploadDir, { recursive: true });

      const filename = sanitizeFilename(value.name);
      const savedPath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await value.arrayBuffer());
      fs.writeFileSync(savedPath, buffer);

      const relativePath = path.join('uploads', uploadSubdir, filename).replace(/\\/g, '/');

      file = {
        savedPath,
        relativePath,
        originalName: value.name,
        mimeType: value.type,
        size: value.size,
      };
    } else {
      fields[key] = value.toString();
    }
  }

  return { file, fields };
}

/** Clean up an uploaded file (e.g. on error) */
export function cleanupFile(filePath: string | null | undefined): void {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
