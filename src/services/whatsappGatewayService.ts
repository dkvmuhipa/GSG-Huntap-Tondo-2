import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  formatWhatsAppPhoneNumber, 
  generateBookingApprovalMessage, 
  generatePaymentReceiptMessage,
  generateHMinus1ReminderMessage 
} from '../lib/whatsapp';

export interface WhatsAppGatewayConfig {
  enabled: boolean;
  provider: 'sidobe' | 'fonnte' | 'wablas' | 'custom_webhook';
  apiKey: string;
  senderNumber?: string;
  adminNotificationPhone?: string;
  autoNotifyAdminOnNewBooking: boolean;
  autoNotifyCitizenOnBookingApproval: boolean;
  autoNotifyCitizenOnPaymentReceipt: boolean;
  autoNotifyCitizenOnHMinus1Reminder?: boolean;
  webhookUrl?: string;
  updatedAt?: any;
}

export const DEFAULT_WA_GATEWAY_CONFIG: WhatsAppGatewayConfig = {
  enabled: true,
  provider: 'sidobe',
  apiKey: (import.meta as any).env?.VITE_SIDOBE_SECRET_KEY || '',
  senderNumber: '6285961194622',
  adminNotificationPhone: '085961194622',
  autoNotifyAdminOnNewBooking: true,
  autoNotifyCitizenOnBookingApproval: true,
  autoNotifyCitizenOnPaymentReceipt: true,
  autoNotifyCitizenOnHMinus1Reminder: true,
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
    // 0. SIDOBE WA API Provider (https://api.sidobe.com/wa/v1/send-message)
    if (config.provider === 'sidobe') {
      const secretKey = (config.apiKey || (import.meta as any).env?.VITE_SIDOBE_SECRET_KEY || '').trim();
      if (!secretKey) {
        return { success: false, message: 'Secret Key SIDOBE WA API belum diisi.' };
      }

      const phoneE164 = formattedPhone.startsWith('+') ? formattedPhone : `+${formattedPhone}`;

      const response = await fetch('https://api.sidobe.com/wa/v1/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Key': secretKey
        },
        body: JSON.stringify({
          phone: phoneE164,
          message: message,
          is_async: true
        })
      });

      const resData = await response.json();
      if (resData.is_success === true || response.ok) {
        const deviceName = resData?.data?.whatsapp_device?.name || 'DKV INFO';
        return {
          success: true,
          message: `Pesan WhatsApp berhasil dikirim via SIDOBE (Device: ${deviceName}).`
        };
      } else {
        return {
          success: false,
          message: resData.message || resData.error_code || 'Gagal mengirim pesan via SIDOBE WA API.'
        };
      }
    }

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
    // 1. Try secure backend dispatch first (keeps gateway secrets off client)
    try {
      const serverRes = await fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new_booking', bookingData })
      });
      if (serverRes.ok) {
        const json = await serverRes.json();
        if (json.success) return;
      }
    } catch {
      // Server endpoint not reachable (e.g. pure static host); continue to client fallback
    }

    // 2. Client-side fallback
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

/**
 * Automated trigger: Notify Citizen with H-1 reminder before event day
 */
export async function notifyCitizenHMinus1Reminder(booking: any, globalConfig?: any) {
  try {
    const config = await getWhatsAppGatewayConfig();
    if (!config.enabled || !booking.phone) {
      return { sent: false, message: 'WhatsApp Gateway nonaktif.' };
    }

    const message = generateHMinus1ReminderMessage(booking, globalConfig);
    const result = await sendAutomatedWhatsAppMessage(booking.phone, message, config);
    return { sent: result.success, message: result.message };
  } catch (err) {
    console.warn('Failed to auto notify citizen H-1 reminder:', err);
    return { sent: false, message: (err as any)?.message || 'Terjadi kesalahan' };
  }
}

/**
 * Automated trigger: Notify GSG Admin via WhatsApp when citizen uploads payment proof
 */
export async function notifyAdminPaymentProofUploaded(bookingData: any, paymentProofUrl: string) {
  try {
    // 1. Try secure backend dispatch first (keeps gateway secrets off client)
    try {
      const serverRes = await fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'payment_proof', bookingData, paymentProofUrl })
      });
      if (serverRes.ok) {
        const json = await serverRes.json();
        if (json.success) return { sent: true, message: json.message };
      }
    } catch {
      // Server endpoint not reachable; continue to client fallback
    }

    // 2. Client-side fallback
    const config = await getWhatsAppGatewayConfig();
    if (!config.enabled || !config.adminNotificationPhone) {
      return { sent: false, message: 'WhatsApp Gateway nonaktif.' };
    }

    const customerName = bookingData.customerName || 'Warga';
    const purpose = bookingData.purpose || 'Acara Warga';
    const dateStr = bookingData.startDate || '-';
    const amount = Number(bookingData.amount || 0).toLocaleString('id-ID');
    const dpAmount = Math.round(Number(bookingData.amount || 0) * 0.3).toLocaleString('id-ID');
    const phone = bookingData.phone || '-';

    const message = `🔔 *BUKTI TRANSFER PEMBAYARAN MASUK*
*Gedung Serbaguna Huntap Tondo 2*
----------------------------------------
Penyewa telah mengunggah bukti pembayaran sewa gedung:

• *Nama Pemohon:* ${customerName}
• *No. WhatsApp:* ${phone}
• *Keperluan:* ${purpose}
• *Tanggal Acara:* ${dateStr}
• *Estimasi DP (30%):* Rp ${dpAmount} (Total: Rp ${amount})
• *Tautan Bukti Struk:* ${paymentProofUrl}

Silakan periksa mutasi rekening dan verifikasi status pembayaran:
👉 https://gsght2.vercel.app/admin/bookings`;

    const result = await sendAutomatedWhatsAppMessage(config.adminNotificationPhone, message, config);
    return { sent: result.success, message: result.message };
  } catch (err) {
    console.warn('Failed to auto notify admin on payment proof upload:', err);
    return { sent: false, message: (err as any)?.message || 'Terjadi kesalahan' };
  }
}


