import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLocalDateISO, parseLocalDate } from '../lib/dateUtils';
import { generateVerificationQRDataURL } from '../lib/qrcode';

export async function buildMonthlySchedulePosterDoc(
  monthDate: Date,
  bookings: any[],
  config: any
): Promise<{ doc: jsPDF; filename: string }> {
  const year = monthDate.getFullYear();
  const monthIdx = monthDate.getMonth();
  const monthPrefix = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
  const monthTitle = monthDate
    .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    .toUpperCase();

  const confirmedEvents = bookings
    .filter(
      (b) =>
        (b.status === 'approved' || b.status === 'completed') &&
        typeof b.startDate === 'string' &&
        b.startDate.startsWith(monthPrefix)
    )
    .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  // Navy Header Banner
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 46, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('JADWAL KEGIATAN RESMI', margin, 17);

  doc.setFontSize(11);
  doc.setTextColor(226, 232, 240);
  doc.text('GEDUNG SERBAGUNA HUNTAP TONDO 2 — KOTA PALU', margin, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Dicetak untuk Papan Pengumuman Warga • ${getLocalDateISO()}`, margin, 36);

  // Month Badge on Right
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 54, 10, 54, 24, 3, 3, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PERIODE JADWAL', pageWidth - margin - 27, 17, { align: 'center' });
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(11);
  doc.text(monthTitle, pageWidth - margin - 27, 27, { align: 'center' });

  // Summary Info Strip
  const adminPhone = config?.contactPhone || '+62 822-9157-8809';
  const contactHours = config?.contactHours || 'Setiap Hari, 08:00 - 22:00 WITA';

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 53, pageWidth - margin * 2, 16, 2.5, 2.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Total Agenda Terjadwal: ${confirmedEvents.length} Kegiatan`, margin + 4, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Layanan Informasi & Reservasi: WhatsApp Admin ${adminPhone} (${contactHours})`,
    margin + 4,
    65.5
  );

  // Events Table
  const tableRows =
    confirmedEvents.length > 0
      ? confirmedEvents.map((evt, idx) => {
          const d = parseLocalDate(evt.startDate);
          const dateLabel = d.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          });
          const eventTitle =
            evt.isPublic !== false ? evt.purpose || 'Kegiatan Warga' : 'Acara Warga (Privat)';
          const organizer =
            evt.isPublic !== false
              ? evt.organizerName || evt.organization || evt.customerName || '-'
              : 'Warga Huntap 2';
          const pkg = evt.packageTitle || evt.packageName || 'Standar';

          return [
            String(idx + 1),
            dateLabel,
            `${evt.startTime || '08:00'} - ${evt.endTime || '17:00'}`,
            eventTitle,
            `${organizer}\n(${pkg})`,
          ];
        })
      : [
          [
            '-',
            '-',
            '-',
            'Belum ada jadwal terisi — Seluruh tanggal tersedia untuk reservasi',
            'Hubungi Admin untuk pemesanan',
          ],
        ];

  autoTable(doc, {
    startY: 75,
    margin: { left: margin, right: margin, bottom: 52 },
    head: [['No', 'Hari & Tanggal', 'Jam (WITA)', 'Nama Acara / Kegiatan', 'Penyelenggara / Paket']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9.5, halign: 'center' },
    bodyStyles: { fontSize: 9, cellPadding: 3, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 11, fontStyle: 'bold' },
      1: { cellWidth: 36, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 26 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 46 },
    },
  });

  // Bottom QR Box (on last page)
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://gsg-huntap-tondo-2.web.app';
  const qrDataUrl = await generateVerificationQRDataURL(`${origin}/#jadwal`);

  const footerBoxY = pageHeight - 44;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, footerBoxY, pageWidth - margin * 2, 32, 3, 3, 'FD');

  doc.addImage(qrDataUrl, 'PNG', margin + 4, footerBoxY + 3, 26, 26);

  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Cek Ketersediaan Live & Ajukan Sewa Online', margin + 35, footerBoxY + 10);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `1. Scan QR Code di samping dengan kamera HP Anda untuk melihat jadwal real-time.\n` +
      `2. Alamat Portal Resmi: ${origin}\n` +
      `3. Tanggal yang tidak tercantum pada tabel di atas masih dapat diajukan sewanya.`,
    margin + 35,
    footerBoxY + 16
  );

  const filename = `Poster_Jadwal_GSG_${monthPrefix}.pdf`;
  return { doc, filename };
}
