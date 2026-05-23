import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BookingData {
  id: string;
  customerName: string;
  phone: string;
  purpose: string;
  startDate: string;
  endDate?: string;
  amount: number;
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
function drawDigitalStamp(doc: jsPDF, x: number, y: number) {
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
 * Generate PDF: 1. Surat Perjanjian Sewa Digital (Formal Digital Lease Contract)
 */
export const generateContract = async (booking: BookingData) => {
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
  doc.text(`Nama       : ${booking.customerName.toUpperCase()}`, margin + 5, 102);
  doc.text(`No. HP     : ${booking.phone}`, margin + 5, 107);
  doc.text(`Peruntukan : ${booking.purpose}`, margin + 5, 112);

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

  // RENDER THE AUTHENTIC DIGITAL STAMP OVER PIHAK PERTAMA'S SIGNATURE
  drawDigitalStamp(doc, margin + 32, sigY + 15);

  // --- FOOTER LANDING ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 286, pageWidth, 11, 'F');
  doc.setTextColor(255);
  doc.setFontSize(7.5);
  doc.text(`Dokumen ini sah secara hukum lokal berbasis Paperless Initiative Gedung Serbaguna Huntap Tondo 2. ID: ${booking.id}`, pageWidth / 2, 293, { align: 'center' });

  // Download Action
  doc.save(`Surat_Perjanjian_Sewa_Gedung_Serbaguna_${booking.customerName.replace(/\s+/g, '_')}.pdf`);
};

/**
 * Generate PDF: 2. Kuitansi / Invoice Pembayaran resmi (Receipt Document with dynamic breakdowns)
 */
export const generateReceipt = async (booking: BookingData) => {
  const doc = new jsPDF();
  const primaryColor = [16, 185, 129]; // Emerald Green for financial transactions
  const darkSlate = [15, 23, 42]; 
  const accentSlate = [100, 116, 139];
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // --- HEADER AREA ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const titleLines = doc.splitTextToSize('KUITANSI PEMBAYARAN RESMI', 110);
  doc.text(titleLines, margin, 18);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(237, 253, 245);
  const subTitle1 = doc.splitTextToSize('GEDUNG SERBAGUNA HUNTAP TONDO 2 - PALU', 110);
  doc.text(subTitle1, margin, 26);
  const subTitle2 = doc.splitTextToSize('Sistem Keuangan Digital Otoritas Keuangan Terintegrasi', 110);
  doc.text(subTitle2, margin, 31);
  const subTitle3 = doc.splitTextToSize('Tanggal Cetak: ' + new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' } as any), 110);
  doc.text(subTitle3, margin, 36);

  // Receipt meta box
  doc.setDrawColor(255, 255, 255, 0.4);
  doc.setFillColor(255, 255, 255, 0.1);
  doc.roundedRect(pageWidth - margin - 52, 11, 52, 24, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.text('STATUS FINANSIAL', pageWidth - margin - 47, 16);
  doc.setFontSize(7.5);
  doc.text(`NO: KUI-${booking.id.substring(0, 8).toUpperCase()}`, pageWidth - margin - 47, 21);
  doc.text(`METODE: SINKRON KAS`, pageWidth - margin - 47, 25);
  doc.text(`STATUS: ${booking.paymentStatus === 'paid' ? 'LUNAS' : 'TAGIHAN'}`, pageWidth - margin - 47, 29);

  // --- BILL RECEIPT METRICS ---
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  let currentY = 58;
  
  const labelWidth = 40;
  
  // Telah Terima Dari
  doc.setFont('helvetica', 'bold');
  doc.text('Telah Terima Dari', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(':  ' + booking.customerName.toUpperCase(), margin + labelWidth, currentY);
  
  // Sejumlah Uang
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Sejumlah Uang', margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(':  Rp ' + booking.amount.toLocaleString('id-ID'), margin + labelWidth, currentY);

  // Terbilang
  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Terbilang', margin, currentY);
  doc.setFont('helvetica', 'italic');
  const spellingText = '*** ' + terbilang(booking.amount) + ' Rupiah ***';
  const splitSpelling = doc.splitTextToSize(spellingText, 120);
  doc.text(': ', margin + labelWidth, currentY);
  doc.text(splitSpelling, margin + labelWidth + 3, currentY);
  
  const spellingHeight = splitSpelling.length * 5;
  currentY += Math.max(8, spellingHeight);

  // Untuk Acara / Pembayaran
  doc.setFont('helvetica', 'bold');
  doc.text('Peruntukan Sewa', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(':  ' + booking.purpose, margin + labelWidth, currentY);

  currentY += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal Acara', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(':  ' + new Date(booking.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), margin + labelWidth, currentY);

  // Divider Line
  currentY += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  // --- DETAILED BREAKDOWN TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.text('RINCIAN TARIF & LAYANAN TAMBAHAN:', margin, currentY);
  currentY += 5;

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

  // Base rental package calculating
  let basePrice = booking.amount - inventorySubtotal;
  if (basePrice < 0) {
    basePrice = booking.amount;
    items.length = 0; // fallback clear inventory if values mismatch
  }

  // Add primary package sewa to top
  items.unshift([
    `Paket Utama: ${booking.packageTitle || booking.packageName || 'Standar Gedung Serbaguna Huntap Tondo 2'}`,
    '1 Paket',
    `Rp ${basePrice.toLocaleString('id-ID')}`,
    `Rp ${basePrice.toLocaleString('id-ID')}`
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Deskripsi Item Penggunaan', 'Volume', 'Harga Satuan', 'Total Subharga']],
    body: items,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 4 },
    headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' }
    }
  });

  const tableY = (doc as any).lastAutoTable.finalY + 10;
  
  // Total metrics
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL PEMBAYARAN', 130, tableY);
  doc.text(`Rp ${booking.amount.toLocaleString('id-ID')}`, pageWidth - margin, tableY, { align: 'right' });

  // Draw a beautiful lunas box
  doc.setDrawColor(209, 250, 229);
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(margin, tableY - 6, 80, 16, 2, 2, 'F');
  
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('VERIFIKASI TRANSAKSI:', margin + 4, tableY - 1.5);
  doc.setFontSize(11);
  doc.text(booking.paymentStatus === 'paid' ? 'LUNAS (MUTASI OK)' : 'MENUNGGU PELUNASAN', margin + 4, tableY + 4);
  
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);

  // Signatures Area
  const sigY = tableY + 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Tanggal: ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - margin - 40, sigY);
  doc.setFont('helvetica', 'bold');
  doc.text('Penerima / Bendahara Gedung,', pageWidth - margin - 40, sigY + 6, { align: 'center' });
  
  doc.setDrawColor(226, 232, 240);
  doc.line(pageWidth - margin - 55, sigY + 28, pageWidth - margin - 5, sigY + 28);
  
  doc.setFontSize(7.5);
  doc.text('BENDAHARA GEDUNG SERBAGUNA', pageWidth - margin - 40, sigY + 32, { align: 'center' });

  // Seal with dynamic transparent stamp overlaying bendahara's signature block
  drawDigitalStamp(doc, pageWidth - margin - 40, sigY + 20);

  // Footer bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 286, pageWidth, 11, 'F');
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.text(`Kuitansi ini dicetak digital secara otomatis dan sah tanpa tanda tangan basah. Ref: ${booking.id.substring(0,8).toUpperCase()}`, pageWidth / 2, 292, { align: 'center' });

  // Save/Download Action
  doc.save(`Kuitansi_Pembayaran_Gedung_Serbaguna_${booking.customerName.replace(/\s+/g, '_')}.pdf`);
};
