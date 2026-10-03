import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getGlobalConfig } from '../lib/db';
import { getTransparentPNG } from '../lib/cloudinary';
import { generateVerificationQRDataURL, getDocumentVerificationUrl } from '../lib/qrcode';

interface BookingData {
  id: string;
  customerName: string;
  phone: string;
  purpose: string;
  startDate: string;
  endDate?: string;
  amount: number;
  organization?: string;
  organizerType?: string;
  organizerName?: string;
  packageTitle?: string;
  packageName?: string; // fallback
  status: string;
  paymentStatus?: string;
  selectedInventory?: Record<string, number>;
  layoutDraft?: {
    template: string;
    stagePosition: string;
    tableQuantity: number;
    chairQuantity: number;
    selectedElementIds: string[];
  };
}

/**
 * Converts numbers into Indonesian formal spellings (e.g., "Satu Juta Dua Ratus Ribu")
 */
export function terbilang(angka: number): string {
  const bilas = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  let temp = "";
  angka = Math.floor(angka);
  if (angka < 12) {
    temp = " " + bilas[angka];
  } else if (angka < 20) {
    temp = terbilang(angka - 10) + " Belas";
  } else if (angka < 100) {
    temp = terbilang(angka / 10) + " Puluh" + terbilang(angka % 10);
  } else if (angka < 200) {
    temp = " Seratus" + terbilang(angka - 100);
  } else if (angka < 1000) {
    temp = terbilang(angka / 100) + " Ratus" + terbilang(angka % 100);
  } else if (angka < 2000) {
    temp = " Seribu" + terbilang(angka - 1000);
  } else if (angka < 1000000) {
    temp = terbilang(angka / 1000) + " Ribu" + terbilang(angka % 1000);
  } else if (angka < 1000000000) {
    temp = terbilang(angka / 1000000) + " Juta" + terbilang(angka % 1000000);
  }
  return temp.trim();
}

/**
 * Renders a highly authentic, transparent-style local admin stamp (Stempel Resmi Gedung Serbaguna Huntap Tondo 2)
 */
function drawDigitalStamp(doc: jsPDF, x: number, y: number, stampUrl?: string | null) {
  if (stampUrl) {
    try {
      const format = stampUrl.includes('jpeg') || stampUrl.includes('jpg') ? 'JPEG' : 'PNG';
      // Center the image around (x, y) with a radius of approx 18 (so size 36x36)
      doc.addImage(stampUrl, format, x - 18, y - 18, 36, 36);
      return;
    } catch (e) {
      console.error("Failed to add custom stamp to document:", e);
    }
  }

  // Save current styling states
  const oldLineWidth = doc.getLineWidth();
  const oldDrawColor = doc.getDrawColor();
  const oldTextColor = doc.getTextColor();
  
  // Stempel ink color: Rose/Magenta color (HEX #BE185D / rgb(190, 24, 93))
  const stampColor = [190, 24, 93];
  
  doc.setDrawColor(stampColor[0], stampColor[1], stampColor[2]);
  doc.setTextColor(stampColor[0], stampColor[1], stampColor[2]);
  
  // Outer circle border
  doc.setLineWidth(1.0);
  doc.circle(x, y, 22, 'S');
  
  // Inner circle border
  doc.setLineWidth(0.3);
  doc.circle(x, y, 17, 'S');
  
  // Horizontal text bounds
  doc.setLineWidth(0.2);
  doc.line(x - 16, y - 4, x + 16, y - 4);
  doc.line(x - 16, y + 4, x + 16, y + 4);
  
  // Stempel text content
  doc.setFont('helvetica', 'bold');
  
  doc.setFontSize(4.0);
  doc.text('GD. SERBAGUNA', x, y - 11, { align: 'center' });
  doc.text('HUNTAP TONDO II', x, y - 7, { align: 'center' });
  
  doc.setFontSize(8.0);
  doc.text('LUNAS / SAH', x, y + 1.5, { align: 'center' });
  
  doc.setFontSize(4.0);
  doc.text('KOTA PALU - SULAWESI TENGAH', x, y + 9.5, { align: 'center' });
  doc.text('MANAGEMENT SYSTEM', x, y + 13, { align: 'center' });

  // Minor star symbols/crosses on sides
  doc.setFontSize(7);
  doc.text('★', x - 12.5, y + 0.5, { align: 'center' });
  doc.text('★', x + 12.5, y + 0.5, { align: 'center' });
  
  // Restore style states
  doc.setLineWidth(oldLineWidth);
}

/**
 * Build PDF: 1. Surat Perjanjian Sewa Digital (Formal Digital Lease Contract)
 */
export const buildContractDoc = async (booking: BookingData): Promise<{ doc: jsPDF; filename: string }> => {
  const config = await getGlobalConfig();
  const bendaharaSig = config?.reportBendaharaSignature ? await getTransparentPNG(config.reportBendaharaSignature) : null;
  const stampImg = config?.reportStamp ? await getTransparentPNG(config.reportStamp) : null;
  const doc = new jsPDF();
  const primaryColor = [30, 64, 175]; // Royal Blue
  const darkSlate = [15, 23, 42]; // Off-black base
  const accentSlate = [71, 85, 105];
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // --- HEADER AREA ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const titleLines = doc.splitTextToSize('SURAT PERJANJIAN SEWA-MENYEWA FASILITAS GEDUNG', 110);
  doc.text(titleLines, margin, 14);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  const subTitle1 = doc.splitTextToSize('GEDUNG SERBAGUNA HUNTAP TONDO 2 - KOTA PALU', 110);
  doc.text(subTitle1, margin, 24);
  const subTitle2 = doc.splitTextToSize('Komp. Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu', 110);
  doc.text(subTitle2, margin, 29);
  const subTitle3 = doc.splitTextToSize('Email: gsgtondo2@gmail.com | WhatsApp: +62 822-2615-1215', 110);
  doc.text(subTitle3, margin, 34);

  // Digital Validation Box
  doc.setDrawColor(255, 255, 255, 0.4);
  doc.setFillColor(255, 255, 255, 0.1);
  doc.roundedRect(pageWidth - margin - 52, 11, 52, 24, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text('VERIFIKASI INTEGRITAS', pageWidth - margin - 47, 16);
  doc.setFontSize(7);
  doc.text(`REG-ID: ${booking.id.substring(0, 8).toUpperCase()}`, pageWidth - margin - 47, 21);
  doc.text(`TGL: ${new Date(booking.startDate).toLocaleDateString('id-ID')}`, pageWidth - margin - 47, 25);
  doc.text(`STATUS: ${booking.status.toUpperCase()}`, pageWidth - margin - 47, 29);

  // --- DOCUMENT BODY ---
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT KESEPAKATAN & PERJANJIAN KERJASAMA SEWA', pageWidth / 2, 57, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const todayDateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const intro = `Kami yang bertanda tangan di bawah ini menyepakati perjanjian sewa fasilitas pada hari ini ${todayDateStr}, dengan pihak-pihak terkait sebagai berikut:`;
  const introLines = doc.splitTextToSize(intro, 170);
  doc.text(introLines, margin, 65);

  // Pihak Pertama (Pengelola)
  doc.setFont('helvetica', 'bold');
  doc.text('I. PIHAK PERTAMA (PENGELOLA)', margin, 77);
  doc.setFont('helvetica', 'normal');
  doc.text('Nama       : Pengelola Gedung Serbaguna Huntap Tondo 2', margin + 5, 82);
  doc.text('Kedudukan  : Selaku pengelola sarana publik Gedung Serbaguna Huntap Tondo 2, Kota Palu.', margin + 5, 87);

  // Pihak Kedua (Penyewa)
  doc.setFont('helvetica', 'bold');
  doc.text('II. PIHAK KEDUA (PENYEWA)', margin, 97);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Pemohon  : ${booking.customerName.toUpperCase()}`, margin + 5, 102);
  doc.text(`Penyelenggara : ${booking.organizerName ? `${booking.organizerName.toUpperCase()} (${booking.organizerType || 'Perorangan'})` : (booking.organization ? `${booking.organization.toUpperCase()} (${booking.organizerType || 'Organisasi'})` : `${booking.customerName.toUpperCase()} (PERORANGAN)`)}`, margin + 5, 107);
  doc.text(`No. HP / WA   : ${booking.phone}`, margin + 5, 112);
  doc.text(`Peruntukan    : ${booking.purpose}`, margin + 5, 117);

  doc.text('Kedua belah pihak setuju untuk menaati kewajiban, ketentuan tata tertib lokal, serta persentasi sewa berikut:', margin, 122);

  // --- TABLE OF BOOKING AND EQUIPMENT INFO ---
  const bookingItems: Array<[string, string]> = [
    ['Tipe Paket Utama', booking.packageTitle || booking.packageName || 'Standar Gedung Serbaguna Huntap Tondo 2'],
    ['Tanggal Pelaksanaan', new Date(booking.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
    ['Total Biaya Sewa Resmi', `Rp ${booking.amount.toLocaleString('id-ID')}`],
  ];

  if (booking.layoutDraft) {
    bookingItems.push(['Konfigurasi Meja & Kursi', `Meja: ${booking.layoutDraft.tableQuantity || 0} unit, Kursi: ${booking.layoutDraft.chairQuantity || 0} unit (${booking.layoutDraft.template.toUpperCase()})`]);
  }

  autoTable(doc, {
    startY: 126,
    margin: { left: margin, right: margin },
    head: [['Elemen Perjanjian', 'Spesifikasi & Rincian']],
    body: bookingItems,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    headStyles: { fillColor: [51, 65, 85], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold' } }
  });

  const tableFinalY = (doc as any).lastAutoTable.finalY + 12;

  // Pasals / Clauses
  const clauses = [
    {
      title: 'PASAL 1: PERUNTUKAN & TATA TERTIB',
      desc: 'Pihak Kedua dilarang keras menggunakan Gedung Serbaguna untuk acara berbau politik praktis, aktivitas amoral, narkotika, atau kegiatan melanggar hukum RI. Pembatalan sepihak berhak dilakukan pengelola jika terindikasi ketidaksesuaian.'
    },
    {
      title: 'PASAL 2: KEBERSIHAN & TANGGUNG JAWAB',
      desc: `Pihak Kedua wajib menjamin kebersihan area gedung sesudah acara rampung. Maksimal pembersihan selesai pada H+1 pagi hari. Segala bentuk kerusakan properti fisik gedung wajib diganti 100% senilai harga perbaikan resmi.`
    },
    {
      title: 'PASAL 3: PEMBAYARAN & ADMINISTRASI',
      desc: `Biaya sewa sejumlah Rp ${booking.amount.toLocaleString('id-ID')} telah disahkan sebagai jaminan legalitas pemakaian. Seluruh pelunasan harus disinkronkan melalui mutasi kas digital yang tercatat resmi.`
    }
  ];

  let currentY = tableFinalY;
  clauses.forEach((cl) => {
    if (currentY > 215) {
      doc.addPage();
      currentY = 25;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(cl.title, margin, currentY);
    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(accentSlate[0], accentSlate[1], accentSlate[2]);
    const splitDesc = doc.splitTextToSize(cl.desc, 170);
    doc.text(splitDesc, margin, currentY, { lineHeightFactor: 1.4 });
    currentY += (splitDesc.length * 4.5) + 5;
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  });

  if (currentY > 230) {
    doc.addPage();
    currentY = 25;
  }

  // Terms agreement paragraph
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Kesepakatan ini mengikat secara hukum sejak disetujui bersama secara elekronis.', margin, currentY + 3);

  // --- SIGNATURE BLOCK ---
  const sigY = currentY + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('PIHAK PERTAMA (PENGELOLA)', margin + 32, sigY, { align: 'center' });
  doc.text('PIHAK KEDUA (PENYEWA)', pageWidth - margin - 32, sigY, { align: 'center' });
  
  // Signature Lines
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin + 7, sigY + 22, margin + 57, sigY + 22);
  doc.line(pageWidth - margin - 57, sigY + 22, pageWidth - margin - 7, sigY + 22);
  
  doc.setFontSize(7.5);
  doc.text('PENGELOLA GEDUNG SERBAGUNA', margin + 32, sigY + 26, { align: 'center' });
  doc.text(booking.customerName.toUpperCase(), pageWidth - margin - 32, sigY + 26, { align: 'center' });

  // Draw Bendahara Signature if uploaded
  if (bendaharaSig) {
    try {
      doc.addImage(bendaharaSig, 'PNG', margin + 17, sigY + 4, 30, 15);
    } catch (e) {
      console.error("Failed to add Bendahara signature to contract:", e);
    }
  }

  // RENDER THE AUTHENTIC DIGITAL STAMP OVER PIHAK PERTAMA'S SIGNATURE
  drawDigitalStamp(doc, margin + 32, sigY + 15, stampImg);

  // Official Verification QR Code
  try {
    const qrUrl = getDocumentVerificationUrl(booking.id, 'contract');
    const qrImg = await generateVerificationQRDataURL(qrUrl);
    const qrSize = 18;
    const qrX = (pageWidth / 2) - (qrSize / 2);
    doc.addImage(qrImg, 'PNG', qrX, sigY + 4, qrSize, qrSize);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('VERIFIKASI KEASLIAN', pageWidth / 2, sigY + 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.setTextColor(accentSlate[0], accentSlate[1], accentSlate[2]);
    doc.text('Pindai untuk validasi dokumen', pageWidth / 2, sigY + 28, { align: 'center' });
  } catch (e) {
    console.error('Gagal menambahkan QR Code pada kontrak:', e);
  }

  // --- FOOTER LANDING ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 286, pageWidth, 11, 'F');
  doc.setTextColor(255);
  doc.setFontSize(7.5);
  doc.text(`Dokumen ini sah secara hukum lokal berbasis Paperless Initiative Gedung Serbaguna Huntap Tondo 2. ID: ${booking.id}`, pageWidth / 2, 293, { align: 'center' });

  const filename = `Surat_Perjanjian_Sewa_Gedung_Serbaguna_${booking.customerName.replace(/\s+/g, '_')}.pdf`;
  return { doc, filename };
};

export const generateContract = async (booking: BookingData) => {
  const { doc, filename } = await buildContractDoc(booking);
  doc.save(filename);
};

/**
 * Build PDF: 2. Kuitansi / Invoice Pembayaran resmi (Receipt Document with dynamic breakdowns)
 */
export const buildReceiptDoc = async (booking: BookingData): Promise<{ doc: jsPDF; filename: string }> => {
  const config = await getGlobalConfig();
  const bendaharaSig = config?.reportBendaharaSignature ? await getTransparentPNG(config.reportBendaharaSignature) : null;
  const financeSig = config?.reportFinanceSignature ? await getTransparentPNG(config.reportFinanceSignature) : null;
  const stampImg = config?.reportStamp ? await getTransparentPNG(config.reportStamp) : null;
  const doc = new jsPDF();
  
  // Cohesive Modern Blue Palette
  const primaryColor: [number, number, number] = [30, 64, 175];    // Royal Blue (Brand Blue, matches application)
  const accentColor: [number, number, number] = [29, 78, 216];     // Deep Blue (for highlights and totals)
  const warningColor: [number, number, number] = [217, 119, 6];    // Amber-600 (Pending state)
  const textDark: [number, number, number] = [15, 23, 42];        // Slate-900 for high-contrast primary text
  const textMuted: [number, number, number] = [71, 85, 105];       // Slate-600 for clean readable captions and labels
  const borderLight: [number, number, number] = [191, 219, 254];  // Blue-200 for elegant, thin card borders
  const bgLight: [number, number, number] = [239, 246, 255];      // Blue-50 for clean card backgrounds
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // --- 0. BACKGROUND & WATERMARK ---
  doc.setTextColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setFontSize(38);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL INVOICE', 32, 140, { angle: 12 });

  // Subtle elegant framing border for a premium document card look
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, pageWidth - 20, 277, 'S');

  // Left primary color accent strip
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, 10, 3, 277, 'F');

  // --- 1. HEADER AREA ---
  // APP LOGO (Replicating logo.svg with primary color theme)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(18, 16, 16, 16, 3, 3, 'F');
  
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  // Main building outline
  doc.line(21, 29, 21, 20); // Left wall
  doc.line(21, 20, 27, 20); // Left roof
  doc.line(27, 20, 27, 29); // Inner wall (middle)
  doc.line(27, 23, 31, 23); // Right roof
  doc.line(31, 23, 31, 29); // Right wall
  doc.setLineWidth(0.7);
  doc.line(20, 29, 32, 29); // Ground Line
  doc.setLineWidth(0.5);
  doc.line(23, 22.5, 25.5, 22.5); // Window 1
  doc.line(23, 24.5, 25.5, 24.5); // Window 2
  doc.line(23, 26.5, 25.5, 26.5); // Window 3

  // Title next to logo
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GEDUNG SERBAGUNA HUNTAP TONDO 2', 38, 22);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Pusat Kegiatan Warga Huntap Tondo 2, Palu - Sulawesi Tengah', 38, 26);
  doc.text('Website: gsght2.vercel.app | Email: officialhuntaptondo2@gmail.com', 38, 30);

  // Status Check
  const isPaid = booking.paymentStatus === 'paid' || booking.status === 'paid';

  // Receipt Badge / Status Box on top right
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(pageWidth - 68, 15, 54, 22, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(pageWidth - 68, 15, 54, 22, 2, 2, 'S');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 63, 21);
  
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`NO: INV-${booking.id.substring(0, 8).toUpperCase()}`, pageWidth - 63, 25.5);
  doc.text(`METODE: SINKRON KAS`, pageWidth - 63, 29);
  
  if (isPaid) {
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]); // Emerald Green for Lunas
    doc.text(`STATUS: LUNAS`, pageWidth - 63, 32.5);
  } else {
    doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]); // Amber for pending
    doc.text(`STATUS: TAGIHAN`, pageWidth - 63, 32.5);
  }

  // Separator Line below header
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(18, 42, pageWidth - 18, 42);

  // --- 2. BENTO-STYLE TWO-COLUMN INFO GRID ---
  const gridY = 47;
  const cardHeight = 31;
  const cardWidth = 84;
  
  // Left Card: Billed To (Ditagihkan Kepada)
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(18, gridY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(18, gridY, cardWidth, cardHeight, 2, 2, 'S');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('DITERIMA DARI / RECEIVED FROM:', 22, gridY + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const displayName = booking.organizerName
    ? `${booking.organizerName} (${booking.customerName})`
    : (booking.organization 
      ? `${booking.organization} (${booking.customerName})` 
      : booking.customerName);
  doc.text(displayName.toUpperCase(), 22, gridY + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`No. Telp : ${booking.phone || '-'}`, 22, gridY + 18);
  
  const purposeText = `Keperluan: ${booking.purpose}`;
  const splitPurpose = doc.splitTextToSize(purposeText, cardWidth - 8);
  doc.text(splitPurpose, 22, gridY + 23.5);

  // Right Card: Invoice Meta Details
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(108, gridY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(108, gridY, cardWidth, cardHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('INFORMASI REKOR INVOICE:', 112, gridY + 6);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`KODE REF : INV-${booking.id.substring(0, 8).toUpperCase()}`, 112, gridY + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const eventDateStr = new Date(booking.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  doc.text(`Tgl Acara : ${eventDateStr}`, 112, gridY + 18);
  
  const printedDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' } as any);
  doc.text(`Dicetak    : ${printedDateStr} WIB`, 112, gridY + 24);

  // Divider Line
  let currentY = gridY + cardHeight + 6;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(18, currentY, pageWidth - 18, currentY);
  currentY += 7;

  // --- 3. DETAILED BREAKDOWN TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('RINCIAN TARIF & LAYANAN SEWA TAMBAHAN', 18, currentY);
  currentY += 4;

  // Compile detailed table items
  let inventorySubtotal = 0;
  const items: Array<[string, string, string, string]> = [];

  if (booking.selectedInventory) {
    Object.entries(booking.selectedInventory).forEach(([key, val]) => {
      const qty = Number(val);
      if (qty > 0) {
        let unitPrice = 5000;
        let name = "Tambahan Alat";
        if (key.includes('chair') || key.includes('kursi')) {
          unitPrice = 5000;
          name = "Tambahan Kursi Lipat Chitose";
        } else if (key.includes('table') || key.includes('meja')) {
          unitPrice = 25000;
          name = "Tambahan Meja Bulat Banquet";
        } else if (key.includes('sound')) {
          unitPrice = 350000;
          name = "Sewa Sound System Eksternal";
        } else if (key.includes('stage')) {
          unitPrice = 500000;
          name = "Panggung Eksternal / Pelaminan";
        } else {
          unitPrice = 15000;
          name = `Sewa Fasilitas: ${key}`;
        }
        
        items.push([name, `${qty} Pcs`, `Rp ${unitPrice.toLocaleString('id-ID')}`, `Rp ${(qty * unitPrice).toLocaleString('id-ID')}`]);
        inventorySubtotal += qty * unitPrice;
      }
    });
  }

  // Base rental package calculation
  let basePrice = booking.amount - inventorySubtotal;
  if (basePrice < 0) {
    basePrice = booking.amount;
    items.length = 0; // clear inventory list if calculation conflicts
  }

  // Add primary package to top of items list
  items.unshift([
    `Sewa Paket Utama: ${booking.packageTitle || booking.packageName || 'Standar Gedung Serbaguna Huntap Tondo 2'}`,
    '1 Paket',
    `Rp ${basePrice.toLocaleString('id-ID')}`,
    `Rp ${basePrice.toLocaleString('id-ID')}`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 18, right: 18 },
    head: [['Deskripsi Item Penggunaan', 'Volume', 'Harga Satuan', 'Total Subharga']],
    body: items,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3.5, textColor: textDark },
    headStyles: { fillColor: primaryColor, fontStyle: 'bold', fontSize: 8.5, halign: 'center', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 84 },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 33, halign: 'right' },
      3: { cellWidth: 33, halign: 'right' }
    }
  });

  const tableY = (doc as any).lastAutoTable.finalY + 8;
  
  // --- 4. SUMMARY BOXES (ZERO OVERLAP - BOTH BOXES ARE 84mm WIDE, MATCHING INFO GRID) ---
  // Left Box: Status Verifikasi (Centered content)
  const boxWidth = 84;
  const boxHeight = 19;
  
  if (isPaid) {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]); // soft blue tint (Blue-50)
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]); // Blue-200 border
    doc.roundedRect(18, tableY, boxWidth, boxHeight, 2, 2, 'F');
    doc.roundedRect(18, tableY, boxWidth, boxHeight, 2, 2, 'S');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Blue-700 for positive paid status
  } else {
    doc.setFillColor(254, 243, 199); // soft amber orange tint
    doc.setDrawColor(253, 230, 138); // amber-200 border
    doc.roundedRect(18, tableY, boxWidth, boxHeight, 2, 2, 'F');
    doc.roundedRect(18, tableY, boxWidth, boxHeight, 2, 2, 'S');
    doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]); // amber-600 for pending/tagihan
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('STATUS VERIFIKASI TRANSAKSI:', 18 + (boxWidth / 2), tableY + 5.5, { align: 'center' });
  doc.setFontSize(10);
  doc.text(isPaid ? 'LUNAS (MUTASI OK)' : 'MENUNGGU PELUNASAN', 18 + (boxWidth / 2), tableY + 12.5, { align: 'center' });

  // Right Box: Total Invoice Bill (Centered content inside card to guarantee no text boundary clipping)
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(108, tableY, boxWidth, boxHeight, 2, 2, 'F');
  doc.roundedRect(108, tableY, boxWidth, boxHeight, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('TOTAL TAGIHAN / INVOICE BILL:', 108 + (boxWidth / 2), tableY + 5.5, { align: 'center' });
  
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]); // emerald green for money
  doc.setFontSize(12.5);
  doc.text(`Rp ${booking.amount.toLocaleString('id-ID')},-`, 108 + (boxWidth / 2), tableY + 12.5, { align: 'center' });

  // --- 5. FULL-WIDTH TERBILANG BANNER ---
  const terbilangY = tableY + boxHeight + 4;
  const fullWidth = 174; // 18 to pageWidth - 18
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(18, terbilangY, fullWidth, 9, 1.5, 1.5, 'F');
  doc.roundedRect(18, terbilangY, fullWidth, 9, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const spellingText = `TERBILANG: ${terbilang(booking.amount).toUpperCase()} RUPIAH`;
  doc.text(spellingText, 23, terbilangY + 5.5);

  // --- 6. REGULATOR NOTES / DISCLAIMER ---
  const notesY = terbilangY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Catatan: Invoice ini merupakan dokumen resmi yang sah yang diterbitkan secara elektronik oleh Kasir Digital Otoritas Keuangan Gedung', 18, notesY);
  doc.text('Serbaguna Huntap Tondo 2. Seluruh dana yang diterima disinkronisasikan ke kas pengelolaan pembangunan gedung secara real-time.', 18, notesY + 3.5);

  // --- 7. SIGNATURES AREA ---
  let sigY = notesY + 11;
  if (sigY > 215) {
    doc.addPage();
    sigY = 25;
    
    // Redraw borders & side decorations on page 2 if overflowed
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, pageWidth - 20, 277, 'S');
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 10, 3, 277, 'F');
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const rightSigX = 155;
  const leftSigX = 55;
  const sigMode = config?.receiptSignatureMode || 'both';

  // Date placed on the right
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Palu, ${dateStr}`, rightSigX, sigY, { align: 'center' });

  if (sigMode === 'both') {
    // Left: Finance Staff
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Dibuat Oleh,', leftSigX, sigY + 6, { align: 'center' });
    doc.text('Administrasi Keuangan', leftSigX, sigY + 10.5, { align: 'center' });

    if (financeSig) {
      try {
        doc.addImage(financeSig, 'PNG', leftSigX - 15, sigY + 13.5, 30, 13);
      } catch (e) {
        console.error("Failed to add Finance signature to receipt:", e);
      }
    }

    const financeName = config?.reportFinanceName || 'Keuangan';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(financeName, leftSigX, sigY + 31, { align: 'center' });
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(leftSigX - 25, sigY + 33, leftSigX + 25, sigY + 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('STAF KEUANGAN GEDUNG', leftSigX, sigY + 37, { align: 'center' });

    // Right: Treasurer
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Mengetahui / Penerima,', rightSigX, sigY + 6, { align: 'center' });
    doc.text('Bendahara Gedung,', rightSigX, sigY + 10.5, { align: 'center' });

    if (bendaharaSig) {
      try {
        doc.addImage(bendaharaSig, 'PNG', rightSigX - 15, sigY + 13.5, 30, 13);
      } catch (e) {
        console.error("Failed to add Bendahara signature to receipt:", e);
      }
    }

    // Official Stamp
    drawDigitalStamp(doc, rightSigX, sigY + 22, stampImg);

    const bendaharaName = config?.reportBendaharaName || 'Bendahara';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(bendaharaName, rightSigX, sigY + 31, { align: 'center' });
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(rightSigX - 25, sigY + 33, rightSigX + 25, sigY + 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('BENDAHARA & PENGELOLA', rightSigX, sigY + 37, { align: 'center' });

  } else if (sigMode === 'finance') {
    // Only Finance staff
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Dibuat / Penerima,', rightSigX, sigY + 6, { align: 'center' });
    doc.text('Administrasi Keuangan,', rightSigX, sigY + 10.5, { align: 'center' });

    if (financeSig) {
      try {
        doc.addImage(financeSig, 'PNG', rightSigX - 15, sigY + 13.5, 30, 13);
      } catch (e) {
        console.error("Failed to add Finance signature to receipt:", e);
      }
    }

    // Official Stamp
    drawDigitalStamp(doc, rightSigX, sigY + 22, stampImg);

    const financeName = config?.reportFinanceName || 'Keuangan';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(financeName, rightSigX, sigY + 31, { align: 'center' });
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(rightSigX - 25, sigY + 33, rightSigX + 25, sigY + 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('STAF KEUANGAN GEDUNG', rightSigX, sigY + 37, { align: 'center' });

  } else {
    // Only Treasurer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Mengetahui / Penerima,', rightSigX, sigY + 6, { align: 'center' });
    doc.text('Bendahara Gedung,', rightSigX, sigY + 10.5, { align: 'center' });

    if (bendaharaSig) {
      try {
        doc.addImage(bendaharaSig, 'PNG', rightSigX - 15, sigY + 13.5, 30, 13);
      } catch (e) {
        console.error("Failed to add Bendahara signature to receipt:", e);
      }
    }

    // Official Stamp
    drawDigitalStamp(doc, rightSigX, sigY + 22, stampImg);

    const bendaharaName = config?.reportBendaharaName || 'Bendahara';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(bendaharaName, rightSigX, sigY + 31, { align: 'center' });
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(rightSigX - 25, sigY + 33, rightSigX + 25, sigY + 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('BENDAHARA & PENGELOLA', rightSigX, sigY + 37, { align: 'center' });
  }

  // Official Verification QR Code
  try {
    const qrUrl = getDocumentVerificationUrl(booking.id, 'receipt');
    const qrImg = await generateVerificationQRDataURL(qrUrl);
    const qrSize = 19;
    const qrX = sigMode === 'both' ? (pageWidth / 2) - (qrSize / 2) : 55 - (qrSize / 2);
    const qrCenter = sigMode === 'both' ? (pageWidth / 2) : 55;
    doc.addImage(qrImg, 'PNG', qrX, sigY + 10, qrSize, qrSize);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('VERIFIKASI RESMI DOKUMEN', qrCenter, sigY + 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Pindai untuk validasi keabsahan invoice', qrCenter, sigY + 35, { align: 'center' });
  } catch (e) {
    console.error('Gagal menambahkan QR code verifikasi pada invoice:', e);
  }

  // Footer bar decoration inside border card
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(10, 280, pageWidth - 20, 7, 'F');
  doc.setTextColor(255);
  doc.setFontSize(7.5);
  doc.text(`Invoice ini dicetak secara otomatis dan merupakan bukti pembayaran digital yang sah. Kode Ref: ${booking.id.substring(0,8).toUpperCase()}`, pageWidth / 2, 284.5, { align: 'center' });

  const filename = `Invoice_Pembayaran_Gedung_Serbaguna_${booking.customerName.replace(/\s+/g, '_')}.pdf`;
  return { doc, filename };
};

export const generateReceipt = async (booking: BookingData) => {
  const { doc, filename } = await buildReceiptDoc(booking);
  doc.save(filename);
};
