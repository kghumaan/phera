import { supabase } from './client';

const PASSPORT_BUCKET = 'passports';

/**
 * Upload a passport image to Supabase Storage
 * Returns the path of the uploaded file
 */
export async function uploadPassportImage(file: File, weddingId: string): Promise<{ path: string | null; error: Error | null }> {
  try {
    // 1. Validate file
    if (!file) {
      return { path: null, error: new Error('No file provided') };
    }

    // 2. Generate unique path: wedding_id/timestamp_random.ext
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${weddingId}/${fileName}`;

    console.log('[StorageService] Uploading passport to:', filePath);

    // 3. Upload to Supabase
    // Note: ensure 'passports' bucket exists and RLS allows uploads
    const { data, error } = await supabase.storage
      .from(PASSPORT_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[StorageService] Upload error:', error);
      return { path: null, error };
    }

    console.log('[StorageService] Upload success:', data);
    return { path: data.path, error: null };
  } catch (err: any) {
    console.error('[StorageService] Unexpected upload error:', err);
    return { path: null, error: err };
  }
}

/**
 * Get a signed URL for viewing the passport image (Admin only typically)
 */
export async function getPassportUrl(path: string): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from(PASSPORT_BUCKET)
      .createSignedUrl(path, 60 * 60); // 1 hour expiry

    if (error) {
      console.error('[StorageService] Signed URL error:', error);
      return { url: null, error };
    }

    return { url: data.signedUrl, error: null };
  } catch (err: any) {
    console.error('[StorageService] Unexpected signed URL error:', err);
    return { url: null, error: err };
  }
}
