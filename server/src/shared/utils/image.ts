import sharp from 'sharp';

/**
 * Resize an image buffer to fit within `width` (preserving aspect ratio,
 * never upscaling) and re-encode as compressed JPEG. Used to keep avatar/
 * cover/thumbnail uploads from being served at full original resolution.
 */
export async function resizeImageBuffer(
  buffer: Buffer,
  { width, quality = 80 }: { width: number; quality?: number },
): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // apply EXIF orientation before resizing
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();
}
