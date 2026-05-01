/**
 * Uploads a file to the backend API, which proxys it to Cloudinary.
 * @param file The file object to upload
 */
export async function uploadToCloudinary(file: File): Promise<{ url: string; public_id: string }> {
  const formData = new FormData();
  formData.append('file', file);

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
  
  throw new Error('Server mengembalikan format response yang tidak valid (bukan JSON).');
}
