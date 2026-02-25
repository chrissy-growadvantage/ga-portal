import { uploadImage } from './image-upload';

type UploadFn = (file: File, operatorId: string, proposalId: string) => Promise<string>;

type ImageUploadHandlerOptions = {
  operatorId: string;
  proposalId: string;
  uploadFn?: UploadFn;
  onUploadStart?: () => void;
  onUploadEnd?: (error: Error | null) => void;
};

export function createImageUploadHandler(
  options: ImageUploadHandlerOptions,
): (file: File) => Promise<string> {
  const { operatorId, proposalId, uploadFn = uploadImage, onUploadStart, onUploadEnd } = options;

  return async (file: File): Promise<string> => {
    onUploadStart?.();

    try {
      const url = await uploadFn(file, operatorId, proposalId);
      onUploadEnd?.(null);
      return url;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      onUploadEnd?.(err);
      throw err;
    }
  };
}
