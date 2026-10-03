import QRCode from 'qrcode';

/**
 * Generates an official QR Code Data URL for public document authenticity verification.
 */
export async function generateVerificationQRDataURL(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 140,
      color: {
        dark: '#1e3a8a', // GSG Navy
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    // Fallback: return standard black & white QR
    return await QRCode.toDataURL(text, { margin: 1, width: 140 });
  }
}

/**
 * Builds the absolute verification URL that the QR Code points to.
 */
export function getDocumentVerificationUrl(id: string, type: 'receipt' | 'booking' | 'contract' = 'receipt'): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://gsg-huntap-tondo-2.web.app';
  return `${origin}/verifikasi?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`;
}
