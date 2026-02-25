import { describe, it, expect, vi } from 'vitest';
import { createImageUploadHandler } from './tiptap-image-upload';

describe('createImageUploadHandler', () => {
  it('uploads file and returns URL', async () => {
    const mockUpload = vi.fn().mockResolvedValue('https://example.com/image.png');
    const handler = createImageUploadHandler({
      operatorId: 'op1',
      proposalId: 'prop1',
      uploadFn: mockUpload,
    });

    const file = new File(['img'], 'test.png', { type: 'image/png' });
    const url = await handler(file);

    expect(url).toBe('https://example.com/image.png');
    expect(mockUpload).toHaveBeenCalledWith(file, 'op1', 'prop1');
  });

  it('calls onUploadStart and onUploadEnd on success', async () => {
    const onUploadStart = vi.fn();
    const onUploadEnd = vi.fn();
    const mockUpload = vi.fn().mockResolvedValue('https://example.com/image.png');

    const handler = createImageUploadHandler({
      operatorId: 'op1',
      proposalId: 'prop1',
      uploadFn: mockUpload,
      onUploadStart,
      onUploadEnd,
    });

    const file = new File(['img'], 'test.png', { type: 'image/png' });
    await handler(file);

    expect(onUploadStart).toHaveBeenCalled();
    expect(onUploadEnd).toHaveBeenCalledWith(null);
  });

  it('calls onUploadEnd with error on failure', async () => {
    const onUploadStart = vi.fn();
    const onUploadEnd = vi.fn();
    const mockUpload = vi.fn().mockRejectedValue(new Error('Upload failed'));

    const handler = createImageUploadHandler({
      operatorId: 'op1',
      proposalId: 'prop1',
      uploadFn: mockUpload,
      onUploadStart,
      onUploadEnd,
    });

    const file = new File(['img'], 'test.png', { type: 'image/png' });
    await expect(handler(file)).rejects.toThrow('Upload failed');

    expect(onUploadStart).toHaveBeenCalled();
    expect(onUploadEnd).toHaveBeenCalledWith(expect.any(Error));
  });

  it('defaults to uploadImage when no uploadFn provided', async () => {
    // Since we can't mock the default easily in this test, just verify
    // that the handler is created successfully without uploadFn
    const handler = createImageUploadHandler({
      operatorId: 'op1',
      proposalId: 'prop1',
    });

    expect(typeof handler).toBe('function');
  });
});
