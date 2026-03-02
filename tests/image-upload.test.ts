import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing
const mockRemove = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        remove: mockRemove,
      })),
    },
  },
}));

import { deleteImage } from '@/lib/utils/image-upload';

describe('deleteImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract path and delete from storage', async () => {
    mockRemove.mockResolvedValue({ error: null });

    const url = 'https://supabase.co/storage/v1/object/public/wedding-images/uploads/photo.jpg';
    const result = await deleteImage(url);

    expect(result).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith(['uploads/photo.jpg']);
  });

  it('should return false for external URLs without bucket in path', async () => {
    const url = 'https://external-cdn.com/images/photo.jpg';
    const result = await deleteImage(url);

    expect(result).toBe(false);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('should return false when storage returns an error', async () => {
    mockRemove.mockResolvedValue({ error: { message: 'Not found' } });

    const url = 'https://supabase.co/storage/v1/object/public/wedding-images/uploads/photo.jpg';
    const result = await deleteImage(url);

    expect(result).toBe(false);
  });

  it('should return false on exception', async () => {
    mockRemove.mockRejectedValue(new Error('Network error'));

    const url = 'https://supabase.co/storage/v1/object/public/wedding-images/uploads/photo.jpg';
    const result = await deleteImage(url);

    expect(result).toBe(false);
  });

  it('should handle deeply nested paths', async () => {
    mockRemove.mockResolvedValue({ error: null });

    const url = 'https://supabase.co/storage/v1/object/public/wedding-images/weddings/abc-123/couple/photo.jpg';
    const result = await deleteImage(url);

    expect(result).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith(['weddings/abc-123/couple/photo.jpg']);
  });

  it('should work with custom bucket name', async () => {
    mockRemove.mockResolvedValue({ error: null });

    const url = 'https://supabase.co/storage/v1/object/public/custom-bucket/file.png';
    const result = await deleteImage(url, 'custom-bucket');

    expect(result).toBe(true);
    expect(mockRemove).toHaveBeenCalledWith(['file.png']);
  });

  it('should not log console.error for external URLs', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const url = 'https://external-cdn.com/images/photo.jpg';
    await deleteImage(url);

    // The fix removed console.error for bucket-not-found case
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
