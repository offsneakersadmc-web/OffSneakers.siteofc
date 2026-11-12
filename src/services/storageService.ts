import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { MediaItem } from '../types';
import { storeService } from './storeService';

export interface UploadedImageResult {
  url: string;
  dimensions: string;
  sizeLabel: string;
  storageProvider: 'firebase_storage' | 'optimized_local';
  warning?: string;
}

function readImageDimensionsAndCompress(
  file: File,
  maxDimension = 1280,
  quality = 0.84
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem.'));
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo não é uma imagem válida.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponível para otimização de imagem.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Não foi possível processar a imagem.'));
              return;
            }
            resolve({ blob, dataUrl, width, height });
          },
          mimeType,
          quality
        );
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadVersionImageFile(
  productId: string,
  versionId: string,
  file: File
): Promise<UploadedImageResult> {
  // 1. Optimize image client-side for crisp fast storefront loading
  const { blob, dataUrl, width, height } = await readImageDimensionsAndCompress(file, 1280, 0.85);
  const dimensions = `${width}x${height}`;
  const sizeLabel = `${Math.max(1, Math.round(blob.size / 1024))} KB`;

  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
  const storagePath = `products/${productId}/versions/${versionId}/${Date.now()}-${safeName}`;

  let finalUrl = '';
  let storageProvider: 'firebase_storage' | 'optimized_local' = 'firebase_storage';
  let warning: string | undefined;

  try {
    const storageRef = ref(storage, storagePath);
    const uploadPromise = uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: 'public,max-age=31536000',
    }).then((snap) => getDownloadURL(snap.ref));

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout')), 8000)
    );

    finalUrl = await Promise.race([uploadPromise, timeoutPromise]);
  } catch (err) {
    // Graceful compressed fallback if Firebase Storage bucket rules/CORS are restricted
    console.warn('[OFF.SNEAKERSOFC Storage] Fallback para imagem otimizada:', err);
    const compact = await readImageDimensionsAndCompress(file, 820, 0.76);
    finalUrl = compact.dataUrl;
    storageProvider = 'optimized_local';
    warning = 'Firebase Storage indisponível no momento; imagem otimizada e salva na biblioteca local.';
  }

  // Register in Media Library for reuse across versions/banners
  const mediaItem: MediaItem = {
    id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name.replace(/\.[^/.]+$/, ''),
    url: finalUrl,
    category: 'products',
    dimensions,
    size: sizeLabel,
    uploadedAt: new Date().toISOString(),
  };
  storeService.saveMediaItem(mediaItem).catch(() => {});

  return {
    url: finalUrl,
    dimensions,
    sizeLabel,
    storageProvider,
    warning,
  };
}
