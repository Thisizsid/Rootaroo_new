import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { env } from '../../config/env';
import logger from './logger';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export type { UploadApiResponse };

const BASE_OPTIONS: UploadApiOptions = {
  folder: 'rootaru',
  resource_type: 'auto',
};

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param buffer  Raw file bytes
 * @param options Overrides (e.g. `{ folder: 'rootaru/avatars', public_id: '...' }`)
 * @returns Upload result with `secure_url`, `public_id`, `bytes`, etc.
 */
export async function uploadBuffer(
  buffer: Buffer,
  options?: UploadApiOptions,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { ...BASE_OPTIONS, ...options },
      (error, result) => {
        if (error) {
          logger.error('[Cloudinary] Upload failed:', error.message);
          reject(error);
        } else if (result) {
          resolve(result);
        } else {
          reject(new Error('Cloudinary upload returned no result'));
        }
      },
    );
    stream.end(buffer);
  });
}

/**
 * Delete a resource by its Cloudinary public_id.
 */
export async function deleteResource(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
