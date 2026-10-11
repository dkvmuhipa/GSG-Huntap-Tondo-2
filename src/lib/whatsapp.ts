/**
 * WhatsApp Generator & Automation Utility for GSG Huntap Tondo 2
 */

export function formatWhatsAppPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return `62${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('62')) {
    return cleaned;
  }
  return `62${cleaned}`;
}

export function createWhatsAppUrl(phone: string, text: string): string {
  const formattedPhone = formatWhatsAppPhoneNumber(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

export function generateBookingApprovalMessage(booking: any, config?: any): string {
  const customerName = booking.customerName || 'Bapak/Ibu';
  const purpose = booking.purpose || 'Acara Warga';
  const dateStr = booking.startDate 
    ? new Date(booking.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '-';
  const totalAmount = Number(booking.amount || 0).toLocaleString('id-ID');
  const contactName = config?.reportBendaharaName || 'Pengurus GSG';

  return `*KONFIRMASI PERSETUJUAN RESERVASI GEDUNG*
*Gedung Serbaguna Huntap Tondo 2*
----------------------------------------
Yth. *${customerName}*,

Permohonan sewa Gedung Serbaguna Huntap Tondo 2 telah *DISETUJUI* oleh pengurus.

📋 *Rincian Reservasi:*
• No. Registrasi: #${booking.id?.substring(0, 8).toUpperCase()}
• Keperluan: ${purpose}
• Tanggal Pelaksanaan: *${dateStr}*
• Paket / Fasilitas: ${booking.packageTitle || booking.packageName || 'Paket Standar'}
• Total Biaya Sewa: *Rp ${totalAmount}*
• Status Pembayaran: *${booking.paymentStatus === 'paid' ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}*

Silakan simpan konfirmasi ini sebagai bukti reservasi resmi Anda. Untuk informasi teknis atau koordinasi kebersihan/tata ruang, silakan hubungi pengurus.

Terima kasih,
*Pengurus GSG Huntap Tondo 2*
_${contactName}_`;
}

export function generatePaymentReminderMessage(booking: any, config?: any): string {
  const customerName = booking.customerName || 'Bapak/Ibu';
  const dateStr = booking.startDate 
    ? new Date(booking.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '-';
  const totalAmount = Number(booking.amount || 0).toLocaleString('id-ID');
  const bankAccount = config?.bankAccountInfo || 'Bank BSI / Mandiri a.n Pengurus Gedung Serbaguna';

  return `*PENGINGAT PEMBAYARAN SEWA GEDUNG*
*Gedung Serbaguna Huntap Tondo 2*
----------------------------------------
Halo *${customerName}*,

Semoga sehat selalu. Kami menginformasikan perihal jadwal acara Anda di GSG Huntap Tondo 2:

📅 *Tanggal Acara:* ${dateStr}
🎯 *Keperluan:* ${booking.purpose || '-'}
💰 *Nominal Tagihan:* *Rp ${totalAmount}*

Pembayaran dapat disalurkan melalui transfer ke rekening resmi pengurus:
🏦 *${bankAccount}*

Mohon kirimkan bukti transfer setelah pembayaran dilakukan agar status reservasi Anda dapat segera diperbarui menjadi *Lunas*.

Terima kasih atas kerja samanya,
*Administrasi Keuangan GSG Huntap Tondo 2*`;
}

export function generatePaymentReceiptMessage(booking: any, config?: any): string {
  const customerName = booking.customerName || 'Bapak/Ibu';
  const totalAmount = Number(booking.amount || 0).toLocaleString('id-ID');
  const dateStr = booking.startDate 
    ? new Date(booking.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '-';
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return `*BUKTI PEMBAYARAN SEWA RESMI*
*Gedung Serbaguna Huntap Tondo 2*
----------------------------------------
Yth. *${customerName}*,

Pembayaran sewa Gedung Serbaguna Huntap Tondo 2 telah *KAMI TERIMA & DIVERIFIKASI*.

🧾 *Tanda Terima Digital:*
• No. Registrasi: #${booking.id?.substring(0, 8).toUpperCase()}
• Tanggal Bayar: ${todayStr}
• Tanggal Acara: *${dateStr}*
• Jumlah Pembayaran: *Rp ${totalAmount}*
• Status: *LUNAS (SAH)*

Jadwal Anda telah terkunci 100% di sistem kalender pengurus. Terima kasih telah mempercayakan acara Anda di Gedung Serbaguna Huntap Tondo 2.

Salam hangat,
*Bendahara & Pengurus GSG Huntap Tondo 2*`;
}

export function generateHMinus1ReminderMessage(booking: any, config?: any): string {
  const customerName = booking.customerName || 'Bapak/Ibu';
  const purpose = booking.purpose || 'Acara';
  const dateStr = booking.startDate 
    ? new Date(booking.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'Besok';
  const contactName = config?.reportBendaharaName || 'Pengurus GSG Huntap Tondo 2';
  const contactPhone = config?.contactPhone || '0859-6119-4622';
  const isPaid = booking.paymentStatus === 'paid';
  const totalAmount = Number(booking.amount || 0).toLocaleString('id-ID');

  return `🔔 *PENGINGAT H-1 PELAKSANAAN ACARA*
*Gedung Serbaguna Huntap Tondo 2*
----------------------------------------
Yth. *${customerName}*,

Mengingatkan kembali bahwa jadwal penggunaan Gedung Serbaguna Huntap Tondo 2 untuk acara Anda adalah *BESOK*:

📋 *Detail Acara:*
• Keperluan: *${purpose}*
• Tanggal: *${dateStr}*
• Waktu: ${booking.startTime || '08:00'} - ${booking.endTime || 'Selesai'} WITA
• Paket: ${booking.packageTitle || booking.packageName || 'Standar'}
• Status Pembayaran: *${isPaid ? 'LUNAS (SAH) ✅' : `BELUM LUNAS (Rp ${totalAmount}) ⚠️`}*

🔑 *Instruksi Serah Terima & Ketertiban:*
1. Serah terima kunci dan pengecekan kelistrikan dapat dilakukan mulai pagi hari via pengurus.
2. Dilarang merusak dinding/fasilitas dan harap menjaga kebersihan selama & setelah acara.
3. Narahubung Pengurus Lapangan: *${contactName}* (${contactPhone}).

Semoga acara Anda besok berjalan lancar, tertib, dan berkah.

Terima kasih,
*Pengurus GSG Huntap Tondo 2*`;
}

