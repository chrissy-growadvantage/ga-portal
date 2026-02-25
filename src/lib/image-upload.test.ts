import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressImage, uploadImage, deleteProposalImages, MAX_FILE_SIZE_BYTES, COMPRESSION_THRESHOLD_BYTES } from './image-upload';

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn().mockImplementation(async (file: File) => {
    return new File(['compressed'], file.name, { type: file.type });
  }),
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'mock-nanoid-123',
}));

// Mock supabase
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockList = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        list: mockList,
        remove: mockRemove,
      })),
    },
  },
}));

function createMockFile(name: string, sizeBytes: number, type = 'image/png'): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe('image-upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compressImage', () => {
    it('returns original file if under compression threshold', async () => {
      const smallFile = createMockFile('small.png', 1_000_000); // 1MB
      const result = await compressImage(smallFile);
      expect(result).toBe(smallFile);
    });

    it('compresses file if over compression threshold', async () => {
      const largeFile = createMockFile('large.png', COMPRESSION_THRESHOLD_BYTES + 1);
      const result = await compressImage(largeFile);
      expect(result).not.toBe(largeFile);
      expect(result.name).toBe('large.png');
    });

    it('rejects files over max file size', async () => {
      const hugeFile = createMockFile('huge.png', MAX_FILE_SIZE_BYTES + 1);
      await expect(compressImage(hugeFile)).rejects.toThrow('File size exceeds 10MB limit');
    });

    it('rejects non-image files', async () => {
      const textFile = new File(['hello'], 'file.txt', { type: 'text/plain' });
      await expect(compressImage(textFile)).rejects.toThrow('Only image files are allowed');
    });

    it('accepts JPEG files', async () => {
      const jpegFile = createMockFile('photo.jpg', 500_000);
      const result = await compressImage(jpegFile);
      expect(result).toBe(jpegFile);
    });

    it('accepts WebP files', async () => {
      const webpFile = createMockFile('photo.webp', 500_000);
      webpFile.type; // File type is set in constructor
      const result = await compressImage(new File([new Uint8Array(500_000)], 'photo.webp', { type: 'image/webp' }));
      expect(result.name).toBe('photo.webp');
    });

    it('accepts GIF files', async () => {
      const gifFile = new File([new Uint8Array(500_000)], 'animation.gif', { type: 'image/gif' });
      const result = await compressImage(gifFile);
      expect(result.name).toBe('animation.gif');
    });
  });

  describe('uploadImage', () => {
    it('uploads file and returns public URL', async () => {
      const file = createMockFile('test.png', 100_000);
      mockUpload.mockResolvedValue({ data: { path: 'op1/prop1/mock-nanoid-123.png' }, error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://storage.example.com/proposal-assets/op1/prop1/mock-nanoid-123.png' },
      });

      const url = await uploadImage(file, 'op1', 'prop1');

      expect(url).toBe('https://storage.example.com/proposal-assets/op1/prop1/mock-nanoid-123.png');
      expect(mockUpload).toHaveBeenCalledWith(
        'op1/prop1/mock-nanoid-123.png',
        expect.any(File),
        { cacheControl: '3600', upsert: false },
      );
    });

    it('throws on upload error', async () => {
      const file = createMockFile('test.png', 100_000);
      mockUpload.mockResolvedValue({ data: null, error: { message: 'Quota exceeded' } });

      await expect(uploadImage(file, 'op1', 'prop1')).rejects.toThrow('Quota exceeded');
    });

    it('extracts file extension correctly', async () => {
      const file = createMockFile('photo.jpeg', 100_000);
      mockUpload.mockResolvedValue({ data: { path: 'op1/prop1/mock-nanoid-123.jpeg' }, error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/mock-nanoid-123.jpeg' },
      });

      await uploadImage(file, 'op1', 'prop1');

      expect(mockUpload).toHaveBeenCalledWith(
        'op1/prop1/mock-nanoid-123.jpeg',
        expect.any(File),
        expect.any(Object),
      );
    });

    it('compresses large files before upload', async () => {
      const largeFile = createMockFile('big.png', COMPRESSION_THRESHOLD_BYTES + 1);
      mockUpload.mockResolvedValue({ data: { path: 'op1/prop1/mock-nanoid-123.png' }, error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/mock-nanoid-123.png' },
      });

      const browserImageCompression = await import('browser-image-compression');
      await uploadImage(largeFile, 'op1', 'prop1');

      expect(browserImageCompression.default).toHaveBeenCalled();
    });
  });

  describe('deleteProposalImages', () => {
    it('lists and deletes all images for a proposal', async () => {
      mockList.mockResolvedValue({
        data: [
          { name: 'abc.png' },
          { name: 'def.jpg' },
        ],
        error: null,
      });
      mockRemove.mockResolvedValue({ error: null });

      await deleteProposalImages('op1', 'prop1');

      expect(mockList).toHaveBeenCalledWith('op1/prop1');
      expect(mockRemove).toHaveBeenCalledWith([
        'op1/prop1/abc.png',
        'op1/prop1/def.jpg',
      ]);
    });

    it('does nothing if folder is empty', async () => {
      mockList.mockResolvedValue({ data: [], error: null });

      await deleteProposalImages('op1', 'prop1');

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('does nothing if list returns null data', async () => {
      mockList.mockResolvedValue({ data: null, error: null });

      await deleteProposalImages('op1', 'prop1');

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('throws on list error', async () => {
      mockList.mockResolvedValue({ data: null, error: { message: 'Access denied' } });

      await expect(deleteProposalImages('op1', 'prop1')).rejects.toThrow('Access denied');
    });

    it('throws on remove error', async () => {
      mockList.mockResolvedValue({ data: [{ name: 'file.png' }], error: null });
      mockRemove.mockResolvedValue({ error: { message: 'Delete failed' } });

      await expect(deleteProposalImages('op1', 'prop1')).rejects.toThrow('Delete failed');
    });
  });
});
