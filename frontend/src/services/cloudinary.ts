/**
 * AgroAI — Cloudinary Image Storage Service
 * Handles direct browser uploads to Cloudinary for field & leaf images.
 */

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
};

export const getCloudinaryStatus = () => ({
  isConfigured: isCloudinaryConfigured(),
  cloudName: CLOUD_NAME || 'Not Configured',
  preset: UPLOAD_PRESET ? 'Configured' : 'Missing',
});

/**
 * Uploads a field or leaf image to Cloudinary using an unsigned upload preset.
 * Fallback: Converts image to base64 data URL if Cloudinary is not configured.
 */
export async function uploadToCloudinary(
  file: File,
  folder = 'agroai_fields'
): Promise<CloudinaryUploadResult> {
  // Client-side file type and size validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    return {
      success: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, or WEBP image.',
    };
  }

  const maxSizeMb = 10;
  if (file.size > maxSizeMb * 1024 * 1024) {
    return {
      success: false,
      error: `File size exceeds ${maxSizeMb}MB limit.`,
    };
  }

  // If Cloudinary environment variables are missing, use base64 data URL fallback
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          success: true,
          url: reader.result as string,
          publicId: `fallback_${Date.now()}`,
        });
      };
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read image file locally.',
        });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', folder);

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error?.message || 'Cloudinary upload request failed.',
      };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.secure_url || data.url,
      publicId: data.public_id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error uploading to Cloudinary.',
    };
  }
}
