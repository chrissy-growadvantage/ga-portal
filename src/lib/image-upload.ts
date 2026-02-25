import imageCompression from 'browser-image-compression';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const COMPRESSION_THRESHOLD_BYTES = 2 * 1024 * 1024; // 2MB

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

const BUCKET_NAME = 'proposal-assets';

function isAllowedImageType(type: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type);
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : 'png';
}

export async function compressImage(file: File): Promise<File> {
  if (!isAllowedImageType(file.type)) {
    throw new Error('Only image files are allowed');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File size exceeds 10MB limit');
  }

  if (file.size <= COMPRESSION_THRESHOLD_BYTES) {
    return file;
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type as string,
  });

  return compressed;
}

export async function uploadImage(
  file: File,
  operatorId: string,
  proposalId: string,
): Promise<string> {
  const compressed = await compressImage(file);
  const ext = getFileExtension(file.name);
  const filePath = `${operatorId}/${proposalId}/${nanoid()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, compressed, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteProposalImages(
  operatorId: string,
  proposalId: string,
): Promise<void> {
  const folderPath = `${operatorId}/${proposalId}`;

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath);

  if (listError) throw new Error(listError.message);

  if (!files || files.length === 0) return;

  const filePaths = files.map((f) => `${folderPath}/${f.name}`);

  const { error: removeError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (removeError) throw new Error(removeError.message);
}
