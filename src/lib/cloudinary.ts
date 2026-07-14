/**
 * Compresses an image file on the client-side using the HTML5 Canvas API.
 * Keeps non-image files intact, and preserves original file if compression does not reduce size.
 * Targets maximum width/height of 1600px with 82% quality to stay under 4.5MB (Vercel payload limit).
 */
export async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.82): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Apply max dimensions preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // fallback if context fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to highly-compressed JPEG (highly optimized for photos/receipts)
        // Except if it's png and we specifically want to preserve transparency, but for receipts, jpeg is ideal.
        const isPng = file.type === 'image/png';
        const outputType = isPng ? 'image/png' : 'image/jpeg';
        const fileExtension = isPng ? '.png' : '.jpg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + fileExtension, {
                type: outputType,
                lastModified: Date.now(),
              });
              
              // Only use compressed file if it actually reduces size
              if (compressedFile.size < file.size) {
                console.log(`[Compression] Succeeded: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(compressedFile);
              } else {
                console.log(`[Compression] Ignored: Compressed was larger or equal. Original used: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                resolve(file);
              }
            } else {
              resolve(file); // fallback
            }
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Uploads a file to the backend API, which proxys it to Cloudinary.
 * @param file The file object to upload
 */
export async function uploadToCloudinary(file: File): Promise<{ url: string; public_id: string }> {
  // Compress the file if it's an image before sending to prevent Vercel's 4.5MB request limit
  let processedFile = file;
  if (file.type.startsWith('image/')) {
    try {
      console.log(`[Upload] Processing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      processedFile = await compressImage(file);
    } catch (err) {
      console.warn('[Upload] Image compression failed, uploading original', err);
    }
  }

  const formData = new FormData();
  formData.append('file', processedFile);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  if (!response.ok) {
    let errorMessage = 'Gagal mengupload file ke Cloudinary.';
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } else {
      const textError = await response.text();
      console.error('Non-JSON error response:', textError.substring(0, 200));
      errorMessage = `Server Error (${response.status}): Endpoint API tidak ditemukan atau sedang bermasalah.`;
    }
    throw new Error(errorMessage);
  }

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  const text = await response.text();
  console.error('Expected JSON but got:', contentType, text.substring(0, 500));
  
  if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html>')) {
    throw new Error('Server mengembalikan halaman HTML. Kemungkinan terjadi redirect atau endpoint API tidak ditemukan.');
  }

  throw new Error('Server mengembalikan format response yang tidak valid (bukan JSON).');
}

/**
 * Loads any image URL (remote or local/data URL) and converts it to a transparent PNG Base64 data URL.
 * This guarantees jsPDF renders it with perfect transparency and avoids CORS or black background issues.
 */
export function getTransparentPNG(url: string | null | undefined): Promise<string> {
  return new Promise((resolve) => {
    if (!url) {
      resolve('');
      return;
    }
    // If it's already a transparent base64 PNG, return it directly
    if (url.startsWith('data:image/png;base64,')) {
      resolve(url);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(url);
          return;
        }
        // Ensure background is fully transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        console.error('[imageUtils] Failed to convert image to transparent PNG:', err);
        resolve(url); // Fallback to raw URL
      }
    };
    img.onerror = (err) => {
      console.error('[imageUtils] Failed to load image:', url, err);
      resolve(url); // Fallback to raw URL
    };
    img.src = url;
  });
}

