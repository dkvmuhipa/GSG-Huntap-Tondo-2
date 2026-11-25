import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateVerificationQRDataURL, getDocumentVerificationUrl } from '../lib/qrcode';

export interface ETicketPdfParams {
  bookingRefCode: string;
  submittedBookingId?: string;
  customerName: string;
  organizerType: string;
  organizerName?: string;
  phone: string;
  packageName: string;
  purpose: string;
  startDate: string;
  startTime: string;
  endTime: string;
  guests?: string;
  layout: {
    template: string;
    tableQuantity: number;
    chairQuantity: number;
  };
  grandTotal: number;
  contactPhone?: string;
}

export async function downloadBookingETicketPdf(params: ETicketPdfParams): Promise<void> {
  const {
    bookingRefCode,
    submittedBookingId,
    customerName,
    organizerType,
    organizerName,
    phone,
    packageName,
    purpose,
    startDate,
    startTime,
    endTime,
    guests,
    layout,
    grandTotal,
    contactPhone,
  } = params;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BUKTI PENGAJUAN SEWA GEDUNG (E-TICKET)', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(226, 232, 240);
  doc.text('GEDUNG SERBAGUNA HUNTAP TONDO 2 - KOTA PALU', margin, 25);
  doc.setFontSize(8);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, margin, 33);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 52, 10, 52, 22, 3, 3, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('KODE REFERENSI', pageWidth - margin - 26, 16, { align: 'center' });
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(11);
  doc.text(`#${bookingRefCode}`, pageWidth - margin - 26, 26, { align: 'center' });

  autoTable(doc, {
    startY: 52,
    margin: { left: margin, right: margin },
    head: [['Informasi Permohonan Sewa', 'Detail Tercatat']],
    body: [
      ['Kode Pengajuan', `#${bookingRefCode}`],
      ['Nama Pemohon', customerName || '-'],
      ['Kategori / Instansi', `${organizerType} - ${organizerName || customerName}`],
      ['Nomor WhatsApp (Pelacakan)', phone || '-'],
      ['Paket Fasilitas', packageName || '-'],
      ['Tujuan Kegiatan', purpose || '-'],
      ['Tanggal & Waktu Acara', `${startDate} (${startTime} - ${endTime} WITA)`],
      [
        'Estimasi Tamu & Denah',
        `${guests || '-'} Orang | Denah ${layout.template.toUpperCase()} (${layout.chairQuantity} Kursi, ${layout.tableQuantity} Meja)`,
      ],
      ['Status Saat Ini', 'PENDING (Menunggu Verifikasi & Pembayaran DP)'],
      ['Total Estimasi Biaya', `Rp ${grandTotal.toLocaleString('id-ID')}`],
      ['Minimal Uang Muka (DP 30%)', `Rp ${Math.ceil(grandTotal * 0.3).toLocaleString('id-ID')}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65, fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  if (submittedBookingId) {
    const verifyUrl = getDocumentVerificationUrl(submittedBookingId, 'booking');
    const qrDataUrl = await generateVerificationQRDataURL(verifyUrl);
    doc.addImage(qrDataUrl, 'PNG', margin, finalY, 32, 32);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Verifikasi Digital & Pelacakan Status:', margin + 37, finalY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '1. Scan QR Code di samping untuk memverifikasi keaslian pengajuan secara real-time.\n' +
        '2. Anda juga dapat mengecek status & mengunggah bukti transfer melalui menu "Lacak Booking"\n' +
        `   di website menggunakan Nomor WhatsApp (${phone}) atau Kode #${bookingRefCode}.\n` +
        `3. Konfirmasi WA Admin Resmi: ${contactPhone || '+62 822-9157-8809'}`,
      margin + 37,
      finalY + 14
    );
  }

  const safeName = (customerName || 'Warga').replace(/\s+/g, '_');
  doc.save(`ETicket_${bookingRefCode}_${safeName}.pdf`);
}
