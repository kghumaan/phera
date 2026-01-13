import { supabase } from '@/lib/supabase/client';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ImageSizes {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
}

/**
 * Compress and resize an image on the client side before upload
 * This reduces upload time and server load
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

/**
 * Upload an image to Supabase storage
 */
export async function uploadImage(
  file: File,
  path: string,
  bucket: string = 'wedding-images'
): Promise<UploadResult> {
  try {
    // First, compress the image
    const compressedFile = await compressImage(file);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  files: File[],
  path: string,
  bucket: string = 'wedding-images'
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadImage(file, path, bucket));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Supabase storage
 */
export async function deleteImage(
  url: string,
  bucket: string = 'wedding-images'
): Promise<boolean> {
  try {
    // Extract path from URL
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === bucket);
    if (bucketIndex === -1) {
      console.error('Invalid URL format');
      return false;
    }

    const path = urlParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds 10MB. Please choose a smaller image.',
    };
  }

  return { valid: true };
}

/**
 * Get wedding image path
 */
export function getWeddingImagePath(weddingId: string, category: 'couple' | 'events' | 'carousel' | 'backgrounds'): string {
  return `${weddingId}/${category}`;
}

