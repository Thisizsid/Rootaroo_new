import { UploadApiResponse, UploadApiOptions } from 'cloudinary';
export type { UploadApiResponse };
/**
 * Upload a file buffer to Cloudinary.
 *
 * @param buffer  Raw file bytes
 * @param options Overrides (e.g. `{ folder: 'rootaru/avatars', public_id: '...' }`)
 * @returns Upload result with `secure_url`, `public_id`, `bytes`, etc.
 */
export declare function uploadBuffer(buffer: Buffer, options?: UploadApiOptions): Promise<UploadApiResponse>;
/**
 * Delete a resource by its Cloudinary public_id.
 */
export declare function deleteResource(publicId: string): Promise<void>;
//# sourceMappingURL=cloudinary.d.ts.map