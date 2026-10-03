import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getTransparentPNG } from '../lib/cloudinary';
import { generateVerificationQRDataURL, getDocumentVerificationUrl } from '../lib/qrcode';
import { terbilang } from './contractService';

export interface AnnualReportOptions {
  year: string;
  transactions: any[];
  bookings: any[];
  config: any;
  adminProfile?: any;
}

export async function buildAnnualReportDoc({
  year,
  transactions,
  bookings,
  config,
  adminProfile
}: AnnualReportOptions): Promise<{ doc: jsPDF; filename: string }> {
  const bendaharaSig = config?.reportBendaharaSignature ? await getTransparentPNG(config.reportBendaharaSignature) : null;
  const financeSig = config?.reportFinanceSignature ? await getTransparentPNG(config.reportFinanceSignature) : null;
  const stampImg = config?.reportStamp ? await getTransparentPNG(config.reportStamp) : null;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;   // 210mm
  const pageHeight = doc.internal.pageSize.height; // 297mm
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  const primaryBlue: [number, number, number] = [30, 64, 175];   // Brand Navy Blue
  const slateDark: [number, number, number] = [15, 23, 42];      // Slate 900
  const slateMuted: [number, number, number] = [71, 85, 105];    // Slate 600
  const emeraldGreen: [number, number, number] = [5, 150, 105];  // Emerald 600
  const roseRed: [number, number, number] = [220, 38, 38];       // Rose 600
  const bgCardLight: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderLight: [number, number, number] = [226, 232, 240]; // Slate 200

  // --- DATA CALCULATIONS ---
  const yearTxs = transactions.filter(t => t.date && t.date.startsWith(year));
  const yearBookings = bookings.filter(b => 
    b.startDate && 
    b.startDate.startsWith(year) && 
    (b.status === 'approved' || b.status === 'completed')
  );

  // Initial balance before 1st January of `year`
  const initialBalance = transactions
    .filter(t => t.date && t.date < `${year}-01-01`)
    .reduce((acc, curr) => {
      if (curr.type === 'income') return acc + (Number(curr.amount) || 0);
      if (curr.type === 'expense') return acc - Math.abs(Number(curr.amount) || 0);
      return acc;
    }, 0);

  const totalIncome = yearTxs
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalExpense = yearTxs
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);

  const netCashflow = totalIncome - totalExpense;
  const endingBalance = initialBalance + netCashflow;

  const devFundRate = config?.devFundRate ?? 0.2;
  const totalDevFundGrowth = yearTxs.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0);
  const totalOpsGrowth = yearTxs.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0);

  // Total accumulation to date
  const allTimeDevFund = transactions.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0);
  const allTimeOps = transactions.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0);

  // 12 Months Breakdown
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  let cumulativeMonthlyBalance = initialBalance;
  let busiestMonthName = '-';
  let maxMonthEvents = -1;

  const monthlyBreakdown = monthNames.map((mName, idx) => {
    const monthIndexStr = String(idx + 1).padStart(2, '0');
    const monthKey = `${year}-${monthIndexStr}`;

    const mEvents = yearBookings.filter(b => b.startDate.startsWith(monthKey)).length;
    const mIncome = yearTxs
      .filter(t => t.date.startsWith(monthKey) && t.type === 'income')
      .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const mExpense = yearTxs
      .filter(t => t.date.startsWith(monthKey) && t.type === 'expense')
      .reduce((acc, c) => acc + Math.abs(Number(c.amount) || 0), 0);
    const mNet = mIncome - mExpense;
    cumulativeMonthlyBalance += mNet;

    if (mEvents > maxMonthEvents && mEvents > 0) {
      maxMonthEvents = mEvents;
      busiestMonthName = `${mName} (${mEvents} Acara)`;
    }

    return {
      monthNumber: idx + 1,
      monthName: mName,
      eventsCount: mEvents,
      income: mIncome,
      expense: mExpense,
      net: mNet,
      balance: cumulativeMonthlyBalance
    };
  });

  if (maxMonthEvents <= 0 && yearBookings.length > 0) {
    busiestMonthName = `${yearBookings.length} Total Acara`;
  }

  // Expense Categories
  const categoryLabels: Record<string, string> = {
    listrik: 'Listrik, Air & Utilitas (PLN/PDAM)',
    kebersihan: 'Kebersihan & Keamanan Gedung',
    perbaikan: 'Perbaikan & Pemeliharaan Fasilitas',
    peralatan: 'Pengadaan & Servis Peralatan/Sound',
    sewa: 'Biaya Pengembalian / Operasional Sewa',
    iuran: 'Bantuan Sosial / Warga',
    umum: 'Operasional Rutin & Administrasi Lainnya'
  };

  const categoryTotals: Record<string, number> = {};
  yearTxs.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'umum';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(Number(t.amount) || 0);
  });

  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const generationDate = new Date().toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // ==========================================
  // PAGE 1: EXECUTIVE DASHBOARD & 12-MONTH TABLE
  // ==========================================

  // --- HEADER BANNER ---
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Decorative Accent Bar
  doc.setFillColor(245, 158, 11); // Amber gold accent
  doc.rect(0, 44, pageWidth, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN PERTANGGUNGJAWABAN & TUTUP BUKU TAHUNAN', margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('PENGELOLAAN KEUANGAN & PEMANFAATAN GEDUNG SERBAGUNA HUNTAP TONDO 2', margin, 23);
  
  doc.setFontSize(8.5);
  doc.setTextColor(254, 240, 138); // Yellow 200
  doc.setFont('helvetica', 'bold');
  doc.text(`TAHUN ANGGARAN: ${year} (1 JANUARI - 31 DESEMBER ${year})`, margin, 31);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('Kota Palu, Sulawesi Tengah | Status: Dokumen Resmi Terverifikasi Sistem', margin, 38);

  // Right Header Metadata
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMASI TUTUP BUKU:', pageWidth - margin, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(226, 232, 240);
  doc.text(`Waktu Penerbitan: ${generationDate}`, pageWidth - margin, 22, { align: 'right' });
  
  const authorName = config?.reportAuthorName || 
                    (adminProfile?.displayName ? `${adminProfile.displayName}` : null) || 
                    'Pengurus & Bendahara GSG';
  doc.text(`Disusun Oleh: ${authorName}`, pageWidth - margin, 28, { align: 'right' });
  doc.text(`Ref: TB-${year}-${new Date().getTime().toString().slice(-6)}`, pageWidth - margin, 34, { align: 'right' });

  // --- SECTION 1: 4 EXECUTIVE KPI CARDS ---
  const startCardY = 51;
  const cardWidth = (contentWidth - (3 * 3.5)) / 4; // 4 cards across
  const cardHeight = 22;

  const kpis = [
    {
      title: 'TOTAL PEMASUKAN',
      value: `Rp ${Math.round(totalIncome).toLocaleString('id-ID')}`,
      subtitle: `${yearBookings.length} agenda sewa & donasi`,
      color: emeraldGreen
    },
    {
      title: 'TOTAL PENGELUARAN',
      value: `Rp ${Math.round(totalExpense).toLocaleString('id-ID')}`,
      subtitle: 'Biaya operasional & utilitas',
      color: roseRed
    },
    {
      title: 'NET SURPLUS / (DEFISIT)',
      value: `Rp ${Math.round(netCashflow).toLocaleString('id-ID')}`,
      subtitle: netCashflow >= 0 ? 'Surplus kas operasional' : 'Defisit kas operasional',
      color: netCashflow >= 0 ? emeraldGreen : roseRed
    },
    {
      title: `SAVING FISIK (${Math.round(devFundRate * 100)}%)`,
      value: `Rp ${Math.round(totalDevFundGrowth).toLocaleString('id-ID')}`,
      subtitle: 'Pertumbuhan dana cadangan',
      color: primaryBlue
    }
  ];

  kpis.forEach((kpi, idx) => {
    const cx = margin + (idx * (cardWidth + 3.5));
    doc.setFillColor(bgCardLight[0], bgCardLight[1], bgCardLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, startCardY, cardWidth, cardHeight, 2, 2, 'FD');

    // Accent top strip
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(cx, startCardY, cardWidth, 1.8, 1, 1, 'F');

    // Title
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.title, cx + 3, startCardY + 6.5);

    // Value
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, cx + 3, startCardY + 13.5);

    // Subtitle
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.setFontSize(5.8);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.subtitle, cx + 3, startCardY + 18.5);
  });

  // --- SECTION 2: HIGHLIGHT METRICS STRIP ---
  const stripY = startCardY + cardHeight + 4;
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.setDrawColor(191, 219, 254); // Blue-200
  doc.roundedRect(margin, stripY, contentWidth, 9, 2, 2, 'FD');

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text(`RINGKASAN PEMANFAATAN GEDUNG ${year}:`, margin + 3.5, stripY + 5.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const avgMonthlyIncome = Math.round(totalIncome / 12);
  const highlightText = `Total Acara: ${yearBookings.length} Kali  |  Bulan Teramai: ${busiestMonthName}  |  Rata-rata Pemasukan: Rp ${avgMonthlyIncome.toLocaleString('id-ID')}/bulan  |  Saldo Awal Kas: Rp ${Math.round(initialBalance).toLocaleString('id-ID')}`;
  doc.text(highlightText, margin + 63, stripY + 5.8);

  // --- SECTION 3: 12-MONTH RECAPITULATION TABLE ---
  const tableTitleY = stripY + 16;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('I. REKAPITULASI KINERJA KAS PER BULAN (JANUARI - DESEMBER)', margin, tableTitleY);

  const tableBody = monthlyBreakdown.map(item => [
    item.monthNumber,
    item.monthName,
    item.eventsCount > 0 ? `${item.eventsCount} Acara` : '-',
    `Rp ${Math.round(item.income).toLocaleString('id-ID')}`,
    `Rp ${Math.round(item.expense).toLocaleString('id-ID')}`,
    {
      content: `Rp ${Math.round(item.net).toLocaleString('id-ID')}`,
      styles: {
        textColor: item.net > 0 ? emeraldGreen : item.net < 0 ? roseRed : slateMuted,
        fontStyle: 'bold'
      }
    },
    `Rp ${Math.round(item.balance).toLocaleString('id-ID')}`
  ]);

  // Total Summary Row
  tableBody.push([
    { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'center', fillColor: [30, 64, 175], textColor: 255 } },
    { content: `TAHUN ANGGARAN ${year}`, styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } },
    { content: `${yearBookings.length} Acara`, styles: { fontStyle: 'bold', halign: 'center', fillColor: [30, 64, 175], textColor: 255 } },
    { content: `Rp ${Math.round(totalIncome).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [30, 64, 175], textColor: 255 } },
    { content: `Rp ${Math.round(totalExpense).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [30, 64, 175], textColor: 255 } },
    { content: `Rp ${Math.round(netCashflow).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [30, 64, 175], textColor: 255 } },
    { content: `Rp ${Math.round(endingBalance).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [30, 64, 175], textColor: 255 } }
  ]);

  autoTable(doc, {
    startY: tableTitleY + 4,
    margin: { left: margin, right: margin },
    head: [['No', 'Bulan', 'Pemakaian', 'Pemasukan (Rp)', 'Pengeluaran (Rp)', 'Surplus / (Defisit)', 'Saldo Kas Akumulatif']],
    body: tableBody,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: 255,
      fontSize: 8,
      halign: 'center',
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253]
    },
    styles: {
      fontSize: 7.8,
      cellPadding: 2.8,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 32, halign: 'right' },
      6: { cellWidth: 29, halign: 'right', fontStyle: 'bold' }
    },
    theme: 'grid'
  });

  // Footer on Page 1
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text('Laporan Pertanggungjawaban Tahunan Pengurus GSG Huntap Tondo 2 - Halaman 1 dari 2', margin, pageHeight - 8);
  doc.text(`Waktu Cetak: ${generationDate}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

  // ==========================================
  // PAGE 2: EXPENSE ANALYSIS, SIGNATURES & QR
  // ==========================================
  doc.addPage();

  // Minimal Page 2 Header
  doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`LAPORAN PERTANGGUNGJAWABAN TUTUP BUKU TAHUN ${year} (BAGIAN II)`, margin, 11);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('Analisis Komposisi Pengeluaran, Neraca Posisi Dana & Lembar Pengesahan Sah', margin, 16);
  doc.text(`Halaman 2 dari 2`, pageWidth - margin, 14, { align: 'right' });

  // --- SECTION 4: EXPENSE CATEGORY COMPOSITION ---
  const expStartY = 28;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('II. ANALISIS & PROPORSI PENGELUARAN OPERASIONAL GEDUNG', margin, expStartY);

  const expTableRows = sortedCategories.length > 0
    ? sortedCategories.map((item, idx) => {
        const catKey = item[0];
        const nominal = item[1];
        const pct = totalExpense > 0 ? (nominal / totalExpense) * 100 : 0;
        return [
          idx + 1,
          categoryLabels[catKey] || catKey.toUpperCase(),
          `Rp ${Math.round(nominal).toLocaleString('id-ID')}`,
          `${pct.toFixed(1)}%`,
          catKey === 'listrik' ? 'Biaya rutin bulanan daya listrik & pompa air' :
          catKey === 'kebersihan' ? 'Honor kebersihan berkala & keamanan warga' :
          catKey === 'perbaikan' ? 'Perawatan fisik gedung, atap, cat, dan pintu' :
          catKey === 'peralatan' ? 'Pemeliharaan sound system, mic, kipas, lampu' :
          'Kebutuhan operasional umum penunjang acara'
        ];
      })
    : [
        [{ content: 'Tidak ada catatan transaksi pengeluaran pada tahun ini (Nihil)', colSpan: 5, styles: { halign: 'center', fontStyle: 'italic', textColor: [100, 116, 139] } }]
      ];

  // Add total expense row
  if (sortedCategories.length > 0) {
    expTableRows.push([
      { content: 'TOTAL', styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] } },
      { content: 'SELURUH REALISASI PENGELUARAN TAHUNAN', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
      { content: `Rp ${Math.round(totalExpense).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: roseRed } },
      { content: '100.0%', styles: { fontStyle: 'bold', halign: 'center', fillColor: [241, 245, 249] } },
      { content: 'Terealisasi 100% dari kas gedung', styles: { fontStyle: 'italic', fillColor: [241, 245, 249], textColor: [100, 116, 139] } }
    ]);
  }

  autoTable(doc, {
    startY: expStartY + 4,
    margin: { left: margin, right: margin },
    head: [['No', 'Bidang / Pos Alokasi Pengeluaran', 'Jumlah Realisasi (Rp)', 'Porsi (%)', 'Uraian & Catatan Kebutuhan']],
    body: expTableRows,
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: 255,
      fontSize: 8,
      halign: 'center',
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 'auto' }
    },
    theme: 'grid'
  });

  // --- SECTION 5: FINAL CASH POSITION RECAPITULATION CARD ---
  const balanceCardY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text('III. POSISI SALDO KAS AKHIR TAHUN & KANTONG DANA', margin, balanceCardY);

  const cardBoxY = balanceCardY + 4;
  doc.setFillColor(bgCardLight[0], bgCardLight[1], bgCardLight[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, cardBoxY, contentWidth, 34, 2, 2, 'FD');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`Saldo Awal Kas (Per 1 Januari ${year})`, margin + 5, cardBoxY + 7);
  doc.text(`Rp ${Math.round(initialBalance).toLocaleString('id-ID')}`, margin + 85, cardBoxY + 7, { align: 'right' });

  doc.text(`(+) Total Pemasukan Selama Tahun ${year}`, margin + 5, cardBoxY + 13);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text(`+ Rp ${Math.round(totalIncome).toLocaleString('id-ID')}`, margin + 85, cardBoxY + 13, { align: 'right' });

  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`(-) Total Pengeluaran Selama Tahun ${year}`, margin + 5, cardBoxY + 19);
  doc.setTextColor(roseRed[0], roseRed[1], roseRed[2]);
  doc.text(`- Rp ${Math.round(totalExpense).toLocaleString('id-ID')}`, margin + 85, cardBoxY + 19, { align: 'right' });

  // Divider inside card
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(margin + 5, cardBoxY + 23, margin + 85, cardBoxY + 23);

  // Total Ending Cash
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.text(`TOTAL SALDO AKHIR KAS (Per 31 Des ${year})`, margin + 5, cardBoxY + 29);
  doc.text(`Rp ${Math.round(endingBalance).toLocaleString('id-ID')}`, margin + 85, cardBoxY + 29, { align: 'right' });

  // Right Side: Kantong Dana (Saving vs Ops)
  const rightBoxX = margin + 98;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(rightBoxX - 6, cardBoxY + 4, rightBoxX - 6, cardBoxY + 30);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text('KOMPOSISI AKUMULASI DANA TERSEDIA:', rightBoxX, cardBoxY + 7);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`1. Dana Cadangan Fisik (Saving ${Math.round(devFundRate * 100)}%):`, rightBoxX, cardBoxY + 14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  doc.text(`Rp ${Math.round(allTimeDevFund).toLocaleString('id-ID')}`, pageWidth - margin - 5, cardBoxY + 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`2. Dana Operasional Rutin (Ops ${100 - Math.round(devFundRate * 100)}%):`, rightBoxX, cardBoxY + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(`Rp ${Math.round(allTimeOps).toLocaleString('id-ID')}`, pageWidth - margin - 5, cardBoxY + 21, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('* Dana Cadangan khusus untuk pemeliharaan jangka panjang & renovasi.', rightBoxX, cardBoxY + 28);

  // Terbilang Banner
  const terbilangY = cardBoxY + 37;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, terbilangY, contentWidth, 7, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.2);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  const spText = `TERBILANG SALDO AKHIR: ${terbilang(Math.abs(Math.round(endingBalance))).toUpperCase()} RUPIAH`;
  doc.text(spText, margin + 4, terbilangY + 4.8);

  // --- SECTION 6: OFFICIAL SIGNATURES & VERIFICATION QR ---
  const sigY = terbilangY + 15;
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const closingDateStr = `Palu, 31 Desember ${year}`;

  const leftSigX = margin + 35;
  const rightSigX = pageWidth - margin - 35;

  // Personnel Names
  const financeName = config?.reportFinanceName || 'Administrasi Keuangan';
  const bendaharaName = config?.reportBendaharaName || 'Bendahara Pengelola';

  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');

  // Left Signature: Keuangan
  doc.text('Dibuat & Diverifikasi Oleh,', leftSigX, sigY, { align: 'center' });
  doc.text('Administrasi Keuangan Gedung', leftSigX, sigY + 4.5, { align: 'center' });

  if (financeSig) {
    try {
      doc.addImage(financeSig, 'PNG', leftSigX - 16, sigY + 6, 32, 16);
    } catch (e) {
      console.error('Failed to add finance signature:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.text(financeName, leftSigX, sigY + 27, { align: 'center' });
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(leftSigX - 22, sigY + 28.5, leftSigX + 22, sigY + 28.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('PENGELOLA KEUANGAN', leftSigX, sigY + 32.5, { align: 'center' });

  // Right Signature: Bendahara
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  doc.text(closingDateStr, rightSigX, sigY - 5, { align: 'center' });
  doc.text('Mengetahui & Menyetujui,', rightSigX, sigY, { align: 'center' });
  doc.text('Bendahara & Pengurus Gedung', rightSigX, sigY + 4.5, { align: 'center' });

  if (bendaharaSig) {
    try {
      doc.addImage(bendaharaSig, 'PNG', rightSigX - 16, sigY + 6, 32, 16);
    } catch (e) {
      console.error('Failed to add bendahara signature:', e);
    }
  }

  // Stamp
  if (stampImg) {
    try {
      doc.addImage(stampImg, 'PNG', rightSigX - 24, sigY + 4, 22, 22);
    } catch (e) {
      console.error('Failed to add stamp:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text(bendaharaName, rightSigX, sigY + 27, { align: 'center' });
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.3);
  doc.line(rightSigX - 22, sigY + 28.5, rightSigX + 22, sigY + 28.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('BENDAHARA & PENGURUS GSG', rightSigX, sigY + 32.5, { align: 'center' });

  // Center QR Code for Verification
  try {
    const qrUrl = getDocumentVerificationUrl(`TUTUP_BUKU_${year}`, 'receipt');
    const qrImg = await generateVerificationQRDataURL(qrUrl);
    const qrX = (pageWidth / 2) - 8;
    const qrY = sigY + 5;
    doc.addImage(qrImg, 'PNG', qrX, qrY, 16, 16);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.text('VERIFIKASI DIGITAL RESMI', pageWidth / 2, qrY + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text('Pindai QR untuk verifikasi keabsahan laporan', pageWidth / 2, qrY + 22, { align: 'center' });
  } catch (e) {
    console.error('Failed to generate verification QR code:', e);
  }

  // Bottom Notice
  const noticeY = pageHeight - 16;
  doc.setFillColor(bgCardLight[0], bgCardLight[1], bgCardLight[2]);
  doc.rect(margin, noticeY - 3, contentWidth, 7, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text('Laporan Pertanggungjawaban Tahunan ini diterbitkan secara elektronik dan sah sebagai wujud transparansi publik kepada warga Huntap Tondo 2.', pageWidth / 2, noticeY + 1.5, { align: 'center' });

  const filename = `Laporan_Tutup_Buku_Tahunan_${year}_GSG_Huntap_Tondo_2.pdf`;
  return { doc, filename };
}
