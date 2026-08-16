import { z } from 'zod';
import type { ValidationSchemas } from '../../shared/middleware/validate';

export const createVaultDocumentSchema: ValidationSchemas = {
  body: z.object({
    name: z.string().min(1).max(255),
    mimeType: z.string().regex(/^(image\/|application\/pdf)/, 'Only images and PDFs allowed'),
    sizeBytes: z.coerce.number().int().positive().max(20 * 1024 * 1024),
    encryptedKey: z.string().min(1),
    iv: z.string().min(1),
  }),
};

export const updateVaultDocumentSchema: ValidationSchemas = {
  body: z.object({
    name: z.string().min(1).max(255).optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
};

export const vaultDocumentQuerySchema: ValidationSchemas = {
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
};

export const storeUserKeySchema: ValidationSchemas = {
  body: z.object({
    publicKey: z.string().min(1),
    privateKeyEncrypted: z.string().min(1),
  }),
};