import { jsPDF } from 'jspdf';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface BookingData {
  id: string;
  customerName: string;
  phone: string;
  purpose: string;
  startDate: string;
  amount: number;
}

export const generateContract = async (booking: BookingData) => {
  const doc = new jsPDF();
  const primaryColor = [30, 64, 175]; // Primary Blue
  const darkSlate = [15, 23, 42]; // Dark Slate
  const accentSlate = [71, 85, 105];
  
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // --- HEADER AREA ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SURAT PERJANJIAN SEWA-MENYEWA FASILITAS GEDUNG', margin, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('GEDUNG SERBAGUNA HUNTAP TONDO 2 - KOTA PALU', margin, 26);
  doc.text('Komplek Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu', margin, 31);
  doc.text('Email: gsgtondo2@gmail.com | WhatsApp: +62 822-xxxx-xxxx', margin, 36);

  // Digital Badge
  doc.setDrawColor(255, 255, 255, 0.4);
  doc.setFillColor(255, 255, 255, 0.1);
  doc.roundedRect(pageWidth - margin - 50, 10, 50, 25, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text('VERIFIKASI DIGITAL', pageWidth - margin - 45, 17);
  doc.setFontSize(7);
  doc.text(`DOC-ID: ${booking.id.substring(0, 8).toUpperCase()}`, pageWidth - margin - 45, 23);
  doc.text(`DATE: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - margin - 45, 27);
  doc.text('STATUS: RESMI/SAH', pageWidth - margin - 45, 31);

  // --- DOCUMENT CONTENT ---
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PERJANJIAN KERJASAMA PEMAKAIAN FASILITAS', pageWidth / 2, 55, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const intro = `Pada hari ini, ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, kami yang bertanda tangan di bawah ini masing-masing bertindak untuk dan atas nama diri sendiri atau instansi yang diwakili:`;
  const introLines = doc.splitTextToSize(intro, 170);
  doc.text(introLines, margin, 65);

  // Parties info
  doc.setFont('helvetica', 'bold');
  doc.text('I. PIHAK PERTAMA (PENGELOLA)', margin, 78);
  doc.setFont('helvetica', 'normal');
  doc.text('Nama: Pengelola Gedung Serbaguna Huntap Tondo 2', margin + 5, 83);
  doc.text('Kedudukan: Selaku otoritas pengelola fasilitas publik Huntap Tondo 2, Kota Palu.', margin + 5, 88);

  doc.setFont('helvetica', 'bold');
  doc.text('II. PIHAK KEDUA (PENYEWA)', margin, 98);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nama: ${booking.customerName.toUpperCase()}`, margin + 5, 103);
  doc.text(`Kontak: ${booking.phone}`, margin + 5, 108);
  doc.text(`Keperluan: ${booking.purpose}`, margin + 5, 113);

  doc.text('Kedua belah pihak telah sepakat untuk mengikatkan diri dalam Perjanjian Sewa-Menyewa dengan syarat dan ketentuan sebagai berikut:', margin, 123);

  // Clauses
  const clauses = [
    {
      t: 'PASAL 1: OBJEK DAN JANGKA WAKTU',
      c: `Pihak Pertama menyewakan Gedung Serbaguna Tondo 2 kepada Pihak Kedua untuk digunakan pada tanggal ${booking.startDate}. Masa sewa berlaku selama 24 jam terhitung sejak dimulainya persiapan acara hingga selesainya pembersihan.`
    },
    {
      t: 'PASAL 2: HARGA DAN TATA CARA PEMBAYARAN',
      c: `Total nilai sewa adalah Rp ${booking.amount.toLocaleString('id-ID')}. Pembayaran dilakukan melalui mekanisme administrasi yang sah. Pelunasan sisa tagihan wajib dilakukan paling lambat H-3 pelaksanaan acara.`
    },
    {
      t: 'PASAL 3: FASILITAS DAN DAYA LISTRIK',
      c: 'Harga sewa mencakup penggunaan ruang utama, toilet, area parkir, serta daya listrik standar. Penggunaan daya tambahan wajib dikoordinasikan terlebih dahulu dengan petugas teknis.'
    },
    {
      t: 'PASAL 4: LARANGAN KERAS',
      c: 'Dilarang menggunakan gedung untuk kegiatan politik praktis, panggung porno, perjudian, narkoba, atau aktivitas melanggar hukum. Dilarang merusak struktur bangunan gedung (memaku dinding/mengecat ulang).'
    },
    {
      t: 'PASAL 5: KEBERSIHAN DAN LINGKUNGAN',
      c: 'Pihak Kedua bertanggung jawab penuh atas kebersihan area gedung selama dan sesudah acara. Sampah wajib dikumpulkan pada titik yang telah ditentukan.'
    },
    {
      t: 'PASAL 6: GANTI RUGI DAN KERUSAKAN',
      c: 'Segala kerusakan fasilitas yang diakibatkan oleh kelalaian Pihak Kedua atau tamu undangan menjadi tanggung jawab sepenuhnya Pihak Kedua untuk mengganti sesuai nilai perbaikan.'
    }
  ];

  let y = 135;
  clauses.forEach((item) => {
    // Basic page overflow check (though limited for this layout)
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(item.t, margin, y);
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(accentSlate[0], accentSlate[1], accentSlate[2]);
    const lines = doc.splitTextToSize(item.c, 170);
    doc.text(lines, margin, y, { lineHeightFactor: 1.5 });
    y += (lines.length * 5) + 6;
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Demikian surat perjanjian ini disetujui secara digital dan memiliki kekuatan hukum yang sah.', margin, 240);

  // Signatures
  const sigY = 252;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PENGELOLA GEDUNG SERBAGUNA (PIHAK I)', margin + 30, sigY, { align: 'center' });
  doc.text('PENYEWA (PIHAK II)', pageWidth - margin - 30, sigY, { align: 'center' });
  
  doc.setDrawColor(200);
  doc.line(margin + 5, sigY + 22, margin + 55, sigY + 22);
  doc.line(pageWidth - margin - 55, sigY + 22, pageWidth - margin - 5, sigY + 22);
  
  doc.setFontSize(9);
  doc.text('MANAGEMENT TEAM', margin + 30, sigY + 28, { align: 'center' });
  doc.text(booking.customerName.toUpperCase(), pageWidth - margin - 30, sigY + 28, { align: 'center' });

  // Footer bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 285, pageWidth, 12, 'F');
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.text(`Dihasilkan otomatis oleh Sistem Informasi Digital Gedung Serbaguna Huntap Tondo 2 | Ref: ${booking.id.toUpperCase()}`, pageWidth / 2, 292, { align: 'center' });

  // Save PDF
  doc.save(`KONTRAK_RESMI_${booking.customerName.replace(/\s+/g, '_')}.pdf`);
};
