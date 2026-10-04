import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  formatWhatsAppPhoneNumber, 
  generateBookingApprovalMessage, 
  generatePaymentReceiptMessage 
} from '../lib/whatsapp';

export interface WhatsAppGatewayConfig {
  enabled: boolean;
  provider: 'fonnte' | 'wablas' | 'custom_webhook';
  apiKey: string;
  senderNumber?: string;
  adminNotificationPhone?: string;
  autoNotifyAdminOnNewBooking: boolean;
  autoNotifyCitizenOnBookingApproval: boolean;
  autoNotifyCitizenOnPaymentReceipt: boolean;
  webhookUrl?: string;
  updatedAt?: any;
}

export const DEFAULT_WA_GATEWAY_CONFIG: WhatsAppGatewayConfig = {
  enabled: false,
  provider: 'fonnte',
  apiKey: '',
  senderNumber: '',
  adminNotificationPhone: '081234567890',
  autoNotifyAdminOnNewBooking: true,
  autoNotifyCitizenOnBookingApproval: true,
  autoNotifyCitizenOnPaymentReceipt: true,
  webhookUrl: ''
};

const CONFIG_DOC_PATH = 'config/whatsapp_gateway';

/**
 * Subscribe to WhatsApp Gateway configuration in real-time
 */
export function subscribeToWhatsAppGatewayConfig(callback: (config: WhatsAppGatewayConfig) => void) {
  const docRef = doc(db, 'config', 'whatsapp_gateway');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({
        ...DEFAULT_WA_GATEWAY_CONFIG,
        ...(docSnap.data() as Partial<WhatsAppGatewayConfig>)
      });
    } else {
      callback(DEFAULT_WA_GATEWAY_CONFIG);
    }
  }, (err) => {
    console.warn('Error reading WhatsApp Gateway config:', err);
    callback(DEFAULT_WA_GATEWAY_CONFIG);
  });
}

/**
 * Update WhatsApp Gateway configuration in Firestore
 */
export async function updateWhatsAppGatewayConfig(config: Partial<WhatsAppGatewayConfig>) {
  const docRef = doc(db, 'config', 'whatsapp_gateway');
  await setDoc(docRef, {
    ...config,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Fetch WhatsApp Gateway configuration once
 */
export async function getWhatsAppGatewayConfig(): Promise<WhatsAppGatewayConfig> {
  try {
    const docRef = doc(db, 'config', 'whatsapp_gateway');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return {
        ...DEFAULT_WA_GATEWAY_CONFIG,
        ...(docSnap.data() as Partial<WhatsAppGatewayConfig>)
      };
    }
  } catch (err) {
    console.warn('Could not fetch WhatsApp config, using default:', err);
  }
  return DEFAULT_WA_GATEWAY_CONFIG;
}

/**
 * Core function to send automated WhatsApp message via chosen provider
 */
export async function sendAutomatedWhatsAppMessage(
  targetPhone: string,
  message: string,
  customConfig?: WhatsAppGatewayConfig
): Promise<{ success: boolean; message: string }> {
  const config = customConfig || await getWhatsAppGatewayConfig();

  if (!config.enabled) {
    return {
      success: false,
      message: 'WhatsApp Gateway sedang dinonaktifkan dalam pengaturan sistem.'
    };
  }

  const formattedPhone = formatWhatsAppPhoneNumber(targetPhone);
  if (!formattedPhone) {
    return {
      success: false,
      message: 'Nomor telepon tujuan tidak valid.'
    };
  }

  try {
    // 1. Fonnte Provider (https://api.fonnte.com/send)
    if (config.provider === 'fonnte') {
      if (!config.apiKey) {
        return { success: false, message: 'API Token Fonnte belum diisi.' };
      }

      const formData = new FormData();
      formData.append('target', formattedPhone);
      formData.append('message', message);
      formData.append('countryCode', '62');

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: config.apiKey.trim()
        },
        body: formData
      });

      const resData = await response.json();
      if (resData.status === true || resData.status === 'true' || response.ok) {
        return {
          success: true,
          message: 'Pesan WhatsApp berhasil dikirim via Fonnte Gateway.'
        };
      } else {
        return {
          success: false,
          message: resData.reason || resData.message || 'Gagal mengirim pesan via Fonnte.'
        };
      }
    }

    // 2. Wablas Provider (https://api.wablas.com/api/send-message)
    if (config.provider === 'wablas') {
      if (!config.apiKey) {
        return { success: false, message: 'Security Token Wablas belum diisi.' };
      }

      const response = await fetch('https://api.wablas.com/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: config.apiKey.trim()
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message
        })
      });

      const resData = await response.json();
      if (resData.status === true || resData.status === 'true' || response.ok) {
        return {
          success: true,
          message: 'Pesan WhatsApp berhasil dikirim via Wablas.'
        };
      } else {
        return {
          success: false,
          message: resData.message || 'Gagal mengirim via Wablas.'
        };
      }
    }

    // 3. Custom Webhook
    if (config.provider === 'custom_webhook') {
      if (!config.webhookUrl) {
        return { success: false, message: 'URL Webhook belum diisi.' };
      }

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message: message,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        return { success: true, message: 'Pesan berhasil diteruskan ke Webhook kustom.' };
      } else {
        return { success: false, message: `Webhook merespon dengan status ${response.status}` };
      }
    }

    return { success: false, message: 'Provider tidak dikenali.' };
  } catch (error: any) {
    console.error('Error sending automated WhatsApp message:', error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan jaringan saat menghubungi gateway WhatsApp.'
    };
  }
}

/**
 * Send test WhatsApp message
 */
export async function testWhatsAppGatewayConnection(
  phone: string,
  config: WhatsAppGatewayConfig
): Promise<{ success: boolean; message: string }> {
  const testMessage = `*UJI COBA KONEKSI WHATSAPP GATEWAY*
Gedung Serbaguna Huntap Tondo 2
----------------------------------------
Halo! Ini adalah pesan uji coba otomatis dari Sistem Informasi GSG Huntap Tondo 2.

Waktu Kirim: ${new Date().toLocaleString('id-ID')}
Provider: ${config.provider.toUpperCase()}
Status: *BERHASIL TERHUBUNG* ✅`;

  return sendAutomatedWhatsAppMessage(phone, testMessage, config);
}

/**
 * Automated trigger: Notify GSG Admin when citizen submits a new booking
 */
export async function notifyAdminNewBooking(bookingData: any) {
  try {
    const config = await getWhatsAppGatewayConfig();
    if (!config.enabled || !config.autoNotifyAdminOnNewBooking || !config.adminNotificationPhone) {
      return;
    }

    const customerName = bookingData.customerName || 'Warga';
    const purpose = bookingData.purpose || 'Acara Warga';
    const dateStr = bookingData.startDate || '-';
    const amount = Number(bookingData.amount || 0).toLocaleString('id-ID');
    const phone = bookingData.phone || '-';

    const message = `🔔 *PENGAJUAN SEWA GEDUNG BARU*
*Gedung Serbaguna Huntap Tondo 2*
----------------------------------------
Ada permohonan reservasi baru yang memerlukan persetujuan:

• *Nama Pemohon:* ${customerName}
• *No. WhatsApp:* ${phone}
• *Keperluan:* ${purpose}
• *Tanggal Acara:* ${dateStr}
• *Estimasi Biaya:* Rp ${amount}

Silakan buka Dashboard Pengurus untuk memeriksa dan menyetujui jadwal:
👉 https://gsght2.vercel.app/admin/bookings`;

    await sendAutomatedWhatsAppMessage(config.adminNotificationPhone, message, config);
  } catch (err) {
    console.warn('Failed to send auto notification to admin:', err);
  }
}

/**
 * Automated trigger: Notify Citizen when their booking is approved
 */
export async function notifyCitizenOnApproval(booking: any, globalConfig?: any) {
  try {
    const config = await getWhatsAppGatewayConfig();
    if (!config.enabled || !config.autoNotifyCitizenOnBookingApproval || !booking.phone) {
      return { sent: false };
    }

    const message = generateBookingApprovalMessage(booking, globalConfig);
    const result = await sendAutomatedWhatsAppMessage(booking.phone, message, config);
    return { sent: result.success, message: result.message };
  } catch (err) {
    console.warn('Failed to auto notify citizen approval:', err);
    return { sent: false };
  }
}

/**
 * Automated trigger: Notify Citizen when payment is confirmed
 */
export async function notifyCitizenOnPayment(booking: any, globalConfig?: any) {
  try {
    const config = await getWhatsAppGatewayConfig();
    if (!config.enabled || !config.autoNotifyCitizenOnPaymentReceipt || !booking.phone) {
      return { sent: false };
    }

    const message = generatePaymentReceiptMessage(booking, globalConfig);
    const result = await sendAutomatedWhatsAppMessage(booking.phone, message, config);
    return { sent: result.success, message: result.message };
  } catch (err) {
    console.warn('Failed to auto notify citizen payment:', err);
    return { sent: false };
  }
}
