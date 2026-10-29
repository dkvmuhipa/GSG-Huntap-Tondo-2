import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { terbilang } from './contractService';
import { generateVerificationQRDataURL, getDocumentVerificationUrl } from '../lib/qrcode';
import { getTransparentPNG } from '../lib/cloudinary';
import { auth } from '../lib/firebase';

export const displayCategory = (cat: string): string => {
  const map: Record<string, string> = {
    sewa: 'Sewa Gedung',
    iuran: 'Sumbangan',
    listrik: 'Listrik',
    perbaikan: 'Perbaikan',
    peralatan: 'Peralatan',
    kebersihan: 'Kebersihan & Keamanan',
    keamanan: 'Kebersihan & Keamanan',
    umum: 'Lainnya'
  };
  return map[cat] || cat;
};

export interface BuildFinanceReportParams {
  config: any;
  admins: any[];
  adminProfile?: any;
  allTransactions: any[];
  filteredReportTransactions: any[];
  filterMode: 'monthly' | 'annual' | 'custom';
  activeMonth: string;
  activeYear: string;
  customStartDate?: string;
  customEndDate?: string;
  totalIncome?: number;
  totalExpense?: number;
  totalDevFund: number;
  totalOps: number;
}

export const buildKwitansiDoc = async (
  tx: any, 
  config: any
): Promise<{ doc: jsPDF; filename: string }> => {
  const bendaharaSig = config?.reportBendaharaSignature ? await getTransparentPNG(config.reportBendaharaSignature) : null;
  const financeSig = config?.reportFinanceSignature ? await getTransparentPNG(config.reportFinanceSignature) : null;
  const stampImg = config?.reportStamp ? await getTransparentPNG(config.reportStamp) : null;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [210, 110]
  });

  // Cohesive Modern Blue Palette
  const primaryColor: [number, number, number] = [30, 64, 175];    // Royal Blue (Matches Brand Blue)
  const accentColor: [number, number, number] = [29, 78, 216];     // Deep Blue
  const textDark: [number, number, number] = [15, 23, 42];        // Slate-900 (High-Contrast Primary Text)
  const textMuted: [number, number, number] = [71, 85, 105];       // Slate-600 (Captions and Labels)
  const borderLight: [number, number, number] = [191, 219, 254];  // Blue-200 (Thin Card Borders)
  const bgLight: [number, number, number] = [239, 246, 255];      // Blue-50 (Clean Card Background)

  // --- 0. BACKGROUND & WATERMARK ---
  doc.setTextColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setFontSize(38);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL RECEIPT', 35, 62, { angle: 12 });

  // Subtle framing border for a high-end voucher card look
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.rect(5, 5, 200, 100, 'S');

  // Left primary color accent strip
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(5, 5, 3.5, 100, 'F');
  
  // APP LOGO (Replicating logo.svg with brand blue)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(14, 10, 15, 15, 2.5, 2.5, 'F');
  
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(17, 22.5, 17, 14); // Left wall
  doc.line(17, 14, 22.5, 14); // Left roof
  doc.line(22.5, 14, 22.5, 22.5); // Inner wall (middle)
  doc.line(22.5, 17, 26, 17); // Right roof
  doc.line(26, 17, 26, 22.5); // Right wall
  // Ground
  doc.setLineWidth(0.6);
  doc.line(16, 22.5, 27, 22.5);
  // Windows lines
  doc.setLineWidth(0.4);
  doc.line(19, 16, 21, 16);
  doc.line(19, 18, 21, 18);
  doc.line(19, 20, 21, 20);

  // Title next to logo
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GEDUNG SERBAGUNA HUNTAP TONDO 2', 32, 15);
  
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Pusat Kegiatan Warga Huntap Tondo 2, Palu - Sulawesi Tengah', 32, 19);
  doc.text('Website: gsght2.vercel.app | Email: officialhuntaptondo2@gmail.com', 32, 23);

  // Voucher Badge (Top Right)
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(154, 10, 46, 16, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(154, 10, 46, 16, 2, 2, 'S');
  
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('KWITANSI', 159, 15);
  
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`REF: ${tx.receiptNo || 'KW-' + tx.id.substring(0, 8).toUpperCase()}`, 159, 21);

  // Header Divider line
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.line(14, 29, 200, 29);

  // 2. CONTENT AREA (startY = 34)
  const startY = 34;
  const labelX = 14;
  const valueX = 48;
  const rowHeight = 7.5;

  // Row: Terima Dari
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Diterima Dari', labelX, startY + 3.5);
  doc.text(':', valueX - 3, startY + 3.5);
  
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  const organizerSuffix = tx.organizerName 
    ? ` [PENYELENGGARA: ${tx.organizerName.toUpperCase()} (${(tx.organizerType || 'Perorangan').toUpperCase()})]` 
    : '';
  const sourceText = `${tx.source.toUpperCase()}${organizerSuffix}`;
  const sourceLines = doc.splitTextToSize(sourceText, 152);
  doc.text(sourceLines, valueX, startY + 3.5);
  const sourceHeight = (sourceLines.length - 1) * 4.5;
  
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.25);
  doc.line(valueX, startY + sourceHeight + 4.5, 200, startY + sourceHeight + 4.5);

  // Row: Uang Sejumlah
  const amountY = startY + rowHeight + sourceHeight;
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Uang Sejumlah', labelX, amountY + 3.5);
  doc.text(':', valueX - 3, amountY + 3.5);
  
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Rp ${Math.abs(tx.amount).toLocaleString('id-ID')},-`, valueX, amountY + 3.5);
  
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(valueX, amountY + 4.5, 200, amountY + 4.5);

  // Row: Untuk Pembayaran
  const paymentY = amountY + rowHeight;
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Untuk Keperluan', labelX, paymentY + 3.5);
  doc.text(':', valueX - 3, paymentY + 3.5);
  
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  const paymentText = tx.type === 'income'
    ? (tx.notes ? tx.notes.toUpperCase() : `RESERVASI GEDUNG - ${displayCategory(tx.category).toUpperCase()}`)
    : `${displayCategory(tx.category).toUpperCase()} - ${tx.notes || 'PENGELUARAN'}`;
  const paymentLines = doc.splitTextToSize(paymentText, 152);
  doc.text(paymentLines, valueX, paymentY + 3.5);
  const paymentHeight = (paymentLines.length - 1) * 4.5;

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(valueX, paymentY + paymentHeight + 4.5, 200, paymentY + paymentHeight + 4.5);

  // Row: Tanggal Kegiatan / Acara
  const eventDateY = paymentY + paymentHeight + rowHeight;
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.text('Tanggal Kegiatan', labelX, eventDateY + 3.5);
  doc.text(':', valueX - 3, eventDateY + 3.5);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  let eventDateText = '-';
  if (tx.eventDate) {
    try {
      eventDateText = new Date(tx.eventDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      eventDateText = tx.eventDate;
    }
  } else {
    try {
      eventDateText = new Date(tx.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' (Sesuai Transaksi)';
    } catch {
      eventDateText = tx.date;
    }
  }
  doc.text(eventDateText, valueX, eventDateY + 3.5);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(valueX, eventDateY + 4.5, 200, eventDateY + 4.5);

  // 3. FULL-WIDTH TERBILANG BANNER (Visual Highlight)
  const terbilangY = eventDateY + 4.5 + 1.5;
  const fullWidth = 186; // 14 to 200
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(14, terbilangY, fullWidth, 7, 1.5, 1.5, 'F');
  doc.roundedRect(14, terbilangY, fullWidth, 7, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const spellingText = `TERBILANG: ${terbilang(Math.abs(tx.amount)).toUpperCase()} RUPIAH`;
  doc.text(spellingText, 18, terbilangY + 4.8);

  // 4. AMOUNT BOX (Bottom Left) & SIGNATURES AREA (Bottom Right)
  const footerY = 74;
  
  // Amount Box on the bottom left
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(14, footerY - 5, 85, 16, 2, 2, 'F');
  doc.roundedRect(14, footerY - 5, 85, 16, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('NOMINAL TRANSAKSI / AMOUNT PAID:', 18, footerY - 1);

  doc.setFontSize(12.5);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`Rp ${Math.abs(tx.amount).toLocaleString('id-ID')},-`, 18, footerY + 7);

  // --- SIGNATURES SECTION ---
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const rightSigX = 172;
  const leftSigX = 132;
  const sigMode = config?.receiptSignatureMode || 'both';

  // Date printed right above the signature blocks
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Palu, ${todayStr}`, rightSigX, footerY - 5, { align: 'center' });

  if (sigMode === 'both') {
    // Left: Finance Staff
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Dibuat Oleh,', leftSigX, footerY, { align: 'center' });
    doc.text('Administrasi Keuangan', leftSigX, footerY + 3.5, { align: 'center' });

    if (financeSig) {
      try {
        doc.addImage(financeSig, 'PNG', leftSigX - 15, footerY + 4.5, 30, 11);
      } catch (e) {
        console.error("Failed to add Finance signature to receipt:", e);
      }
    }

    const financeName = config?.reportFinanceName || 'Keuangan';
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(financeName, leftSigX, footerY + 18, { align: 'center' });
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(leftSigX - 18, footerY + 19.5, leftSigX + 18, footerY + 19.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('ADMINISTRASI KEUANGAN', leftSigX, footerY + 23, { align: 'center' });

    // Right: Treasurer
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Mengetahui / Penerima,', rightSigX, footerY, { align: 'center' });
    doc.text('Bendahara Gedung,', rightSigX, footerY + 3.5, { align: 'center' });

    if (bendaharaSig) {
      try {
        doc.addImage(bendaharaSig, 'PNG', rightSigX - 15, footerY + 4.5, 30, 11);
      } catch (e) {
        console.error("Failed to add Bendahara signature to receipt:", e);
      }
    }

    // Official Stamp
    if (stampImg) {
      try {
        doc.addImage(stampImg, 'PNG', rightSigX - 22, footerY + 1, 18, 18);
      } catch (e) {
        console.error("Failed to add stamp to receipt:", e);
      }
    } else {
      // Small Stamp Placeholder
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.15);
      doc.setLineDashPattern([1.5, 1], 0);
      doc.circle(rightSigX - 15, footerY + 10, 6);
      doc.setFontSize(4.5);
      doc.text('STEMPEL', rightSigX - 15, footerY + 10.5, { align: 'center' });
      doc.setLineDashPattern([], 0);
    }

    const bendaharaName = config?.reportBendaharaName || 'Bendahara';
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(bendaharaName, rightSigX, footerY + 18, { align: 'center' });
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(rightSigX - 18, footerY + 19.5, rightSigX + 18, footerY + 19.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('BENDAHARA & PENGELOLA', rightSigX, footerY + 23, { align: 'center' });

  } else if (sigMode === 'finance') {
    // Only Finance Staff
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Dibuat / Penerima,', rightSigX, footerY, { align: 'center' });
    doc.text('Administrasi Keuangan', rightSigX, footerY + 3.5, { align: 'center' });

    if (financeSig) {
      try {
        doc.addImage(financeSig, 'PNG', rightSigX - 15, footerY + 4.5, 30, 11);
      } catch (e) {
        console.error("Failed to add Finance signature to receipt:", e);
      }
    }

    // Stamp
    if (stampImg) {
      try {
        doc.addImage(stampImg, 'PNG', rightSigX - 22, footerY + 1, 18, 18);
      } catch (e) {
        console.error("Failed to add stamp to receipt:", e);
      }
    } else {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.15);
      doc.setLineDashPattern([1.5, 1], 0);
      doc.circle(rightSigX - 15, footerY + 10, 6);
      doc.setFontSize(4.5);
      doc.text('STEMPEL', rightSigX - 15, footerY + 10.5, { align: 'center' });
      doc.setLineDashPattern([], 0);
    }

    const financeName = config?.reportFinanceName || 'Keuangan';
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(financeName, rightSigX, footerY + 18, { align: 'center' });
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(rightSigX - 18, footerY + 19.5, rightSigX + 18, footerY + 19.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('ADMINISTRASI KEUANGAN GEDUNG', rightSigX, footerY + 23, { align: 'center' });

  } else {
    // Only Treasurer
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Penerima / Mengetahui,', rightSigX, footerY, { align: 'center' });
    doc.text('Bendahara', rightSigX, footerY + 3.5, { align: 'center' });

    if (bendaharaSig) {
      try {
        doc.addImage(bendaharaSig, 'PNG', rightSigX - 15, footerY + 4.5, 30, 11);
      } catch (e) {
        console.error("Failed to add Bendahara signature to receipt:", e);
      }
    }

    // Stamp
    if (stampImg) {
      try {
        doc.addImage(stampImg, 'PNG', rightSigX - 22, footerY + 1, 18, 18);
      } catch (e) {
        console.error("Failed to add stamp to receipt:", e);
      }
    } else {
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.15);
      doc.setLineDashPattern([1.5, 1], 0);
      doc.circle(rightSigX - 15, footerY + 10, 6);
      doc.setFontSize(4.5);
      doc.text('STEMPEL', rightSigX - 15, footerY + 10.5, { align: 'center' });
      doc.setLineDashPattern([], 0);
    }

    const bendaharaName = config?.reportBendaharaName || 'Bendahara';
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(bendaharaName, rightSigX, footerY + 18, { align: 'center' });
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(rightSigX - 18, footerY + 19.5, rightSigX + 18, footerY + 19.5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('BENDAHARA & PENGELOLA', rightSigX, footerY + 23, { align: 'center' });
  }

  // Official Verification QR Code
  try {
    const qrUrl = getDocumentVerificationUrl(tx.id, 'receipt');
    const qrImg = await generateVerificationQRDataURL(qrUrl);
    doc.addImage(qrImg, 'PNG', 14, 86, 13, 13);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('VERIFIKASI RESMI DOKUMEN', 29, 89.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Pindai QR Code untuk cek keabsahan kwitansi', 29, 93.5);
    doc.text('secara langsung pada database GSG.', 29, 96.5);
  } catch (e) {
    console.error('Gagal menambahkan QR code verifikasi ke kwitansi:', e);
  }

  // Bottom banner bar decoration inside border card
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(5, 101, 200, 4, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Kwitansi resmi ini diterbitkan secara elektronik dan merupakan bukti transaksi pembayaran yang sah.', 105, 103.8, { align: 'center' });

  const receiptNameStr = tx.receiptNo 
    ? tx.receiptNo.replace(/[^a-zA-Z0-9]/g, '_') 
    : tx.id.substring(0, 8);
  const filename = `Kwitansi_${receiptNameStr}_${tx.source.replace(/\s+/g, '_')}.pdf`;
  return { doc, filename };
};

export const buildFinanceReportDoc = async (
  params: BuildFinanceReportParams
): Promise<{ doc: jsPDF; filename: string }> => {
  const {
    config,
    admins,
    adminProfile,
    allTransactions,
    filteredReportTransactions,
    filterMode,
    activeMonth,
    activeYear,
    customStartDate,
    customEndDate,
    totalDevFund,
    totalOps
  } = params;

  const bendaharaSig = config?.reportBendaharaSignature ? await getTransparentPNG(config.reportBendaharaSignature) : null;
  const financeSig = config?.reportFinanceSignature ? await getTransparentPNG(config.reportFinanceSignature) : null;
  const stampImg = config?.reportStamp ? await getTransparentPNG(config.reportStamp) : null;

  const doc = new jsPDF();
  const generationDate = new Date().toLocaleString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Page margin configuration
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // --- PDF GENERATION CORE ---
  const drawHeader = (pageNumber: number) => {
    const isFirst = pageNumber === 1;
    const headerHeight = isFirst ? 45 : 25;

    // Header background
    doc.setFillColor(30, 64, 175); // primary blue
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    
    if (isFirst) {
      // Full Header (Page 1)
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN MANAJEMEN KEUANGAN', margin, 18);
      doc.text('GEDUNG SERBAGUNA HUNTAP TONDO 2', margin, 26);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text('KOTA PALU, SULAWESI TENGAH', margin, 33);

      if (filterMode === 'monthly' && activeMonth !== 'all') {
        const [year, month] = activeMonth.split('-');
        const mDate = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = mDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`PERIODE: ${monthName.toUpperCase()}`, margin, 40);
      } else if (filterMode === 'annual') {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`PERIODE: TAHUN ${activeYear}`, margin, 40);
      } else if (filterMode === 'custom') {
        const startLabel = customStartDate ? new Date(customStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Awal';
        const endLabel = customEndDate ? new Date(customEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sekarang';
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`PERIODE: ${startLabel.toUpperCase()} S.D. ${endLabel.toUpperCase()}`, margin, 40);
      }

      // Metadata Right (Page 1 Only)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('INFORMASI LAPORAN:', pageWidth - margin, 18, { align: 'right' });
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text(`Waktu Cetak: ${generationDate}`, pageWidth - margin, 24, { align: 'right' });
      
      const roleMap: Record<string, string> = {
        owner: 'Pengelola', admin: 'Administrator', editor: 'Editor', bendahara: 'Bendahara', finance: 'Admin Keuangan'
      };
      const currentRole = adminProfile?.role ? (roleMap[adminProfile.role] || adminProfile.role) : '';
      const authorName = config?.reportAuthorName || 
                        (adminProfile?.displayName ? `${adminProfile.displayName}${currentRole ? ` (${currentRole})` : ''}` : null) || 
                        auth.currentUser?.displayName || 'Administrator';
      doc.text(`Oleh: ${authorName}`, pageWidth - margin, 32, { align: 'right' });
    } else {
      // Minimal Header (Page 2+)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN KEUANGAN - GEDUNG SERBAGUNA HUNTAP TONDO 2', margin, 12);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240);
      doc.text(`Halaman ${pageNumber} | Dicetak: ${generationDate}`, margin, 18);
    }
  };

  const drawFooter = (pageNumber: number) => {
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text('Laporan Rahasia - Penggunaan Internal Pengurus Gedung Serbaguna Huntap Tondo 2', margin, pageHeight - 10);
    doc.text(`Halaman ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // Initial Header
  drawHeader(1);

  // 1. Determine if the report has a filtered period
  const isFilteredPeriod = (filterMode === 'monthly' && activeMonth !== 'all') || 
                           (filterMode === 'annual') || 
                           (filterMode === 'custom' && (!!customStartDate || !!customEndDate));

  // 2. Cutoff transactions for period-ending balances (ops, devFund, total)
  const txsUpToCutoff = allTransactions.filter(t => {
    if (!t.date) return false;
    if (filterMode === 'monthly' && activeMonth !== 'all') {
      return t.date.slice(0, 7) <= activeMonth;
    }
    if (filterMode === 'annual') {
      return t.date.slice(0, 4) <= activeYear;
    }
    if (filterMode === 'custom' && customEndDate) {
      return t.date <= customEndDate;
    }
    return true;
  });

  const periodOps = isFilteredPeriod 
    ? txsUpToCutoff.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0)
    : totalOps;
  const periodDevFund = isFilteredPeriod
    ? txsUpToCutoff.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0)
    : totalDevFund;
  const periodTotalBalance = periodOps + periodDevFund;

  // Title and label for Section 1
  let section1Title = 'I. RINGKASAN SALDO KAS TERSEDIA (REAL-TIME)';
  let totalLabel = 'TOTAL AKUMULASI SELURUH DANA';

  if (filterMode === 'monthly' && activeMonth !== 'all') {
    const [year, month] = activeMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    section1Title = `I. RINGKASAN SALDO KAS (PER AKHIR ${monthName.toUpperCase()})`;
    totalLabel = `TOTAL SALDO PER AKHIR ${monthName.toUpperCase()}`;
  } else if (filterMode === 'annual') {
    section1Title = `I. RINGKASAN SALDO KAS (PER AKHIR TAHUN ${activeYear})`;
    totalLabel = `TOTAL SALDO PER AKHIR TAHUN ${activeYear}`;
  } else if (filterMode === 'custom' && customEndDate) {
    const endLabel = new Date(customEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    section1Title = `I. RINGKASAN SALDO KAS (PER ${endLabel.toUpperCase()})`;
    totalLabel = `TOTAL SALDO PER ${endLabel.toUpperCase()}`;
  }

  // Section 1: Ringkasan Saldo
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(section1Title, margin, 62);

  const currentRate = (config?.devFundRate ?? 0.2) * 100;
  
  autoTable(doc, {
    startY: 68,
    margin: { left: margin, right: margin, bottom: 20 },
    head: [['Keterangan Klasifikasi Dana', 'Porsi (%)', 'Jumlah Saldo']],
    body: [
      ['Dana Operasional', `${100 - currentRate}%`, `Rp ${Math.floor(periodOps).toLocaleString('id-ID')}`],
      ['Dana Cadangan', `${currentRate}%`, `Rp ${Math.floor(periodDevFund).toLocaleString('id-ID')}`],
      [{ content: totalLabel, styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } }, '', { content: `Rp ${Math.floor(periodTotalBalance).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } }]
    ],
    headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 10, halign: 'center', fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 } ,
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
    },
    theme: 'grid',
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader(data.pageNumber);
      }
      drawFooter(data.pageNumber);
    }
  });

  const noteY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  const noteText = isFilteredPeriod
    ? '* Menampilkan posisi saldo kas kumulatif pada akhir periode yang dipilih. Dana Operasional siap pakai harian, Dana Cadangan dialokasikan untuk pembangunan fisik/darurat.'
    : '* Dana Operasional: Siap digunakan untuk kebutuhan rutin harian. Dana Cadangan: Dialokasikan khusus untuk pengembangan fisik atau dana darurat.';
  doc.text(noteText, margin, noteY);

  // Section 2: Rincian Transaksi
  const txStartY = (doc as any).lastAutoTable.finalY + 18; 
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('II. RINCIAN TRANSAKSI AKTIVITAS', margin, txStartY);

  // Sort transactions by date ascending (Oldest to Newest) - Chronological order
  const sortedTransactions = [...filteredReportTransactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB; 
    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  const tableData = sortedTransactions.length > 0 
    ? sortedTransactions.map((t, index) => [
        index + 1,
        t.date.split('-').reverse().join('/'), 
        t.source,
        displayCategory(t.category),
        t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER',
        { content: t.type === 'income' ? 'MASUK' : t.type === 'reallocation' ? 'REALLOKASI' : 'KELUAR', styles: { textColor: t.type === 'income' ? [5, 150, 105] : t.type === 'reallocation' ? [217, 119, 6] : [220, 38, 38] } },
        `Rp ${Math.abs(t.amount || 0).toLocaleString('id-ID')}`
      ])
    : [
        [
          { 
            content: 'Tidak ada aktivitas transaksi pada periode ini (Laporan Nihil)', 
            colSpan: 7, 
            styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139], minCellHeight: 12 } 
          }
        ]
      ];

  autoTable(doc, {
    startY: txStartY + 5,
    margin: { left: margin, right: margin, bottom: 25, top: 35 },
    head: [['No', 'Tanggal', 'Uraian Transaksi', 'Kategori', 'Metode', 'Status Arus', 'Nominal']],
    body: tableData,
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, halign: 'center', fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    theme: 'grid',
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawHeader(data.pageNumber);
      }
      drawFooter(data.pageNumber);
    }
  });

  // --- REKAPITULASI ARUS KAS ---
  const recapY = (doc as any).lastAutoTable.finalY + 12;
  
  // Safety check for page capacity
  let finalRecapY = recapY;
  if (finalRecapY > pageHeight - 75) {
    doc.addPage();
    drawHeader(doc.getNumberOfPages());
    drawFooter(doc.getNumberOfPages());
    finalRecapY = 35; // Adjusted to be below the minimal header
  }

  doc.setFillColor(248, 250, 252); // soft slate background
  doc.rect(margin, finalRecapY - 5, pageWidth - (margin * 2), 48, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, finalRecapY - 5, pageWidth - (margin * 2), 48, 'D');

  doc.setTextColor(30, 64, 175);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  let recapTitle = 'III. REKAPITULASI SALDO PERIODE';
  if (filterMode === 'monthly' && activeMonth !== 'all') {
    const [year, month] = activeMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    recapTitle += ` (${monthName.toUpperCase()})`;
  } else if (filterMode === 'annual') {
    recapTitle += ` (TAHUN ${activeYear})`;
  } else if (filterMode === 'custom') {
    const startLabel = customStartDate ? new Date(customStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Awal';
    const endLabel = customEndDate ? new Date(customEndDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sekarang';
    recapTitle += ` (${startLabel.toUpperCase()} - ${endLabel.toUpperCase()})`;
  }
  doc.text(recapTitle, margin + 5, finalRecapY + 2);

  const periodTxs = allTransactions.filter(t => {
    if (!t.date) return false;
    if (filterMode === 'monthly') {
      return activeMonth === 'all' || t.date.startsWith(activeMonth);
    } else if (filterMode === 'annual') {
      return t.date.startsWith(activeYear);
    } else if (filterMode === 'custom') {
      const afterStart = customStartDate ? t.date >= customStartDate : true;
      const beforeEnd = customEndDate ? t.date <= customEndDate : true;
      return afterStart && beforeEnd;
    }
    return true;
  });

  const periodIncome = periodTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const periodExpense = periodTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
  
  // Initial balance (Balance before the period start)
  const allTxsSorted = [...allTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let initialBalance = 0;
  if (filterMode === 'monthly' && activeMonth !== 'all') {
    initialBalance = allTxsSorted
      .filter(t => t.date && t.date < activeMonth + '-01')
      .reduce((acc, curr) => {
        if (curr.type === 'income') return acc + (Number(curr.amount) || 0);
        if (curr.type === 'expense') return acc - Math.abs(Number(curr.amount) || 0);
        return acc;
      }, 0);
  } else if (filterMode === 'annual') {
    initialBalance = allTxsSorted
      .filter(t => t.date && t.date < activeYear + '-01-01')
      .reduce((acc, curr) => {
        if (curr.type === 'income') return acc + (Number(curr.amount) || 0);
        if (curr.type === 'expense') return acc - Math.abs(Number(curr.amount) || 0);
        return acc;
      }, 0);
  } else if (filterMode === 'custom' && customStartDate) {
    initialBalance = allTxsSorted
      .filter(t => t.date && t.date < customStartDate)
      .reduce((acc, curr) => {
        if (curr.type === 'income') return acc + (Number(curr.amount) || 0);
        if (curr.type === 'expense') return acc - Math.abs(Number(curr.amount) || 0);
        return acc;
      }, 0);
  }

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Saldo Awal (Dana dari periode sebelumnya)', margin + 5, finalRecapY + 12);
  doc.text(`Rp ${Math.floor(initialBalance).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 12, { align: 'right' });

  doc.text('(+) Total Pemasukan Periode Ini', margin + 5, finalRecapY + 20);
  doc.setTextColor(5, 150, 105);
  doc.text(`Rp ${Math.floor(periodIncome).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 20, { align: 'right' });

  doc.setTextColor(71, 85, 105);
  doc.text('(-) Total Pengeluaran Periode Ini', margin + 5, finalRecapY + 28);
  doc.setTextColor(220, 38, 38);
  doc.text(`Rp ${Math.floor(periodExpense).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 28, { align: 'right' });

  doc.setFillColor(30, 64, 175);
  doc.rect(margin + 2, finalRecapY + 34, pageWidth - (margin * 2) - 4, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL SALDO AKHIR PERIODE (AVAILABLE)', margin + 5, finalRecapY + 40.5);
  const finalBalance = isFilteredPeriod ? (initialBalance + periodIncome - periodExpense) : (totalDevFund + totalOps);
  doc.text(`Rp ${Math.floor(finalBalance).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 40.5, { align: 'right' });

  // Section 3: Signature Area
  const finalY = finalRecapY + 55;
  
  let sigY = finalY;
  if (sigY > pageHeight - 60) {
    doc.addPage();
    drawHeader(doc.getNumberOfPages());
    drawFooter(doc.getNumberOfPages());
    sigY = 35; // Adjusted to be below the minimal header
  }

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const sigDate = `Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  const signBlockWidth = 60;
  
  // Right Block: Bendahara
  const rightSigX = pageWidth - margin - (signBlockWidth / 2);
  
  // Find designated personnel from admins list
  const financeStaff = admins.find(a => a.role === 'finance') || admins.find(a => a.role === 'bendahara');
  const bendaharaStaff = admins.find(a => a.role === 'bendahara') || admins.find(a => a.role === 'owner') || admins.find(a => a.role === 'admin');
  
  const financeName = config?.reportFinanceName || financeStaff?.displayName || auth.currentUser?.displayName || '( ................................. )';
  const bendaharaName = config?.reportBendaharaName || bendaharaStaff?.displayName || '( ................................. )';

  doc.text(sigDate, rightSigX, sigY, { align: 'center' });
  doc.text('Mengetahui / Menyetujui,', rightSigX, sigY + 5, { align: 'center' });
  
  // Draw Bendahara Digital Signature
  if (bendaharaSig) {
    try {
      doc.addImage(bendaharaSig, 'PNG', rightSigX - 15, sigY + 8, 30, 16);
    } catch (e) {
      console.error("Failed to add Bendahara digital signature:", e);
    }
  }

  // Draw Stamp if available
  if (stampImg) {
    try {
      doc.addImage(stampImg, 'PNG', rightSigX - 22, sigY + 6, 24, 24);
    } catch (e) {
      console.error("Failed to add stamp to report:", e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Black/Dark Slate
  doc.text(bendaharaName, rightSigX, sigY + 35, { align: 'center' });
  
  doc.setTextColor(30, 64, 175); // Blue for position title
  doc.text('Bendahara', rightSigX, sigY + 40, { align: 'center' });

  // Left Block: Administrasi Keuangan
  const leftSigX = margin + (signBlockWidth / 2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Dibuat Oleh,', leftSigX, sigY + 5, { align: 'center' });
  
  // Draw Finance Digital Signature
  if (financeSig) {
    try {
      doc.addImage(financeSig, 'PNG', leftSigX - 15, sigY + 8, 30, 16);
    } catch (e) {
      console.error("Failed to add Finance digital signature:", e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // Black/Dark Slate
  doc.text(financeName, leftSigX, sigY + 35, { align: 'center' });
  
  doc.setTextColor(30, 64, 175); // Blue for position title
  doc.text('Administrasi Keuangan', leftSigX, sigY + 40, { align: 'center' });
  
  // Bottom Caption
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'italic');
  doc.text('Tanda Tangan & Cap Stempel Resmi', pageWidth / 2, sigY + 50, { align: 'center' });

  let periodLabel = 'Semua_Waktu';
  if (filterMode === 'monthly') {
    periodLabel = activeMonth === 'all' ? 'Semua_Bulan' : 
      new Date(parseInt(activeMonth.split('-')[0]), parseInt(activeMonth.split('-')[1]) - 1)
        .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');
  } else if (filterMode === 'annual') {
    periodLabel = `Tahun_${activeYear}`;
  } else if (filterMode === 'custom') {
    const s = customStartDate ? customStartDate.replace(/-/g, '') : 'Awal';
    const e = customEndDate ? customEndDate.replace(/-/g, '') : 'Sekarang';
    periodLabel = `Rentang_${s}_sd_${e}`;
  }

  const suffix = sortedTransactions.length === 0 ? '_Nihil' : '';
  const filename = `Laporan_Keuangan_${periodLabel}${suffix}_${new Date().toISOString().split('T')[0]}.pdf`;
  return { doc, filename };
};
