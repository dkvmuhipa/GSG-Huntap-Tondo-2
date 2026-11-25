import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PiggyBank, Receipt, ShieldCheck, Download, LayoutGrid, CheckCircle2, Clock, Calendar, ChevronDown, Award, Target, Sparkles, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { auth } from '../lib/firebase';
import { getTransparentPNG } from '../lib/cloudinary';
import PdfPreviewModal from './ui/PdfPreviewModal';
import { buildAnnualReportDoc } from '../services/annualReportService';
import { getLocalDateISO, getLocalMonthKey } from '../lib/dateUtils';
import { sanitizeCsvCell } from '../lib/csvUtils';

export default function TransparencyDashboard() {
  const displayCategory = (cat: string) => {
    const map: Record<string, string> = {
      sewa: 'Sewa Gedung',
      iuran: 'Sumbangan',
      listrik: 'Listrik & Air',
      perbaikan: 'Perbaikan',
      peralatan: 'Peralatan',
      kebersihan: 'Kebersihan & Keamanan',
      keamanan: 'Kebersihan & Keamanan',
      umum: 'Lainnya'
    };
    return map[cat] || cat || 'Umum';
  };

  const config = useAppStore(state => state.config);
  const transactions = useAppStore(state => state.transactions);
  const bookings = useAppStore(state => state.bookings);
  const [activeMonth, setActiveMonth] = useState('all');
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
  const [filterMode, setFilterMode] = useState<'monthly' | 'annual'>('monthly');
  const [pdfPreviewModal, setPdfPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    loadPdf: () => Promise<{ doc: jsPDF; filename: string }>;
  }>({
    isOpen: false,
    title: '',
    loadPdf: async () => ({ doc: new jsPDF(), filename: '' })
  });

  const totalDevFund = transactions.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0);
  const totalOps = transactions.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0);
  
  const currentMonthKey = getLocalMonthKey(new Date());
  const reportMonthKey = filterMode === 'monthly' ? (activeMonth === 'all' ? currentMonthKey : activeMonth) : activeYear;
  
  const filteredTransactions = transactions.filter(t => {
    if (filterMode === 'monthly') {
      return activeMonth === 'all' || t.date.startsWith(activeMonth);
    }
    return t.date.startsWith(activeYear);
  }).sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return String(b.id || '').localeCompare(String(a.id || ''));
  });

  const currentMonthOpsExpense = transactions
    .filter(t => t.date.startsWith(reportMonthKey) && t.type === 'expense' && t.expenseSource === 'ops')
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
  
  const budgetProgress = config?.monthlyBudget ? (currentMonthOpsExpense / config.monthlyBudget) * 100 : 0;

  // Development Goal Progress Calculations
  const devGoalTarget = Number(config?.devGoalTargetAmount) > 0 ? Number(config?.devGoalTargetAmount) : 15000000;
  const devGoalTitle = config?.devGoalTitle || 'Pengadaan Sound System & Pendingin Tambahan';
  const devGoalBadge = config?.devGoalBadge || 'TARGET PEMBANGUNAN 2026';
  const devGoalDescription = config?.devGoalDescription || 'Akumulasi Dana Saving (20% dari setiap sewa gedung) digunakan secara gotong royong untuk peningkatan fasilitas warga Huntap Tondo 2.';
  const devGoalProgress = Math.min(100, Math.max(0, (Math.max(0, totalDevFund) / devGoalTarget) * 100));
  const devGoalRemaining = Math.max(0, devGoalTarget - Math.max(0, totalDevFund));

  // Calculate 4-month stats for chart
  const chartData = Array.from({ length: filterMode === 'monthly' ? 4 : 12 }).map((_, i) => {
    const d = new Date(filterMode === 'monthly' ? new Date() : new Date(activeYear + '-12-01'));
    d.setDate(1); 
    const offset = filterMode === 'monthly' ? (3 - i) : (11 - i);
    d.setMonth(d.getMonth() - offset);
    
    // For annual view, only show months of THAT year
    if (filterMode === 'annual' && d.getFullYear().toString() !== activeYear) return null;

    const monthKey = getLocalMonthKey(d);
    const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' });
    
    const monthTxs = transactions.filter(t => t.date.startsWith(monthKey));
    const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    
    return { name: monthLabel, income, expense };
  }).filter(Boolean) as any[];

  const categoryData = Array.from(
    filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const cat = t.category || 'umum';
        const displayName = displayCategory(cat).toUpperCase();
        acc.set(displayName, (acc.get(displayName) || 0) + Math.abs(Number(t.amount) || 0));
        return acc;
      }, new Map<string, number>())
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  const COLORS = ['#1E40AF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

  const buildTransparencyDoc = async (): Promise<{ doc: jsPDF; filename: string }> => {
    
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

    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;

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
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('LAPORAN TRANSPARANSI KEUANGAN', margin, 18);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('GEDUNG SERBAGUNA HUNTAP TONDO 2', margin, 26);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(226, 232, 240); // slate-200 color
        doc.text('KOTA PALU, SULAWESI TENGAH', margin, 33);

        if (filterMode === 'monthly' && activeMonth !== 'all') {
          const [year, month] = activeMonth.split('-');
          const mDate = new Date(parseInt(year), parseInt(month) - 1);
          const monthName = mDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(`PERIODE: ${monthName.toUpperCase()}`, margin, 40);
        } else if (filterMode === 'annual') {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(`PERIODE: TAHUN ${activeYear}`, margin, 40);
        }

        // Metadata Right (Page 1)
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('DATA TRANSPARANSI PUBLIK', pageWidth - margin, 18, { align: 'right' });
        doc.setFontSize(8);
        doc.setTextColor(226, 232, 240);
        doc.text(`Waktu Cetak: ${generationDate}`, pageWidth - margin, 24, { align: 'right' });
        
        const currentAuthor = config?.reportAuthorName || auth.currentUser?.displayName || 'Administrator Keuangan';
        doc.text(`Oleh: ${currentAuthor}`, pageWidth - margin, 30, { align: 'right' });
      } else {
        // Minimal Header (Page 2+)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN TRANSPARANSI - GEDUNG SERBAGUNA HUNTAP TONDO 2', margin, 12);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(226, 232, 240);
        doc.text(`Halaman ${pageNumber} | Dicetak: ${generationDate}`, margin, 18);
      }
    };

    const drawFooter = (pageNumber: number) => {
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, doc.internal.pageSize.height - 18, pageWidth - margin, doc.internal.pageSize.height - 18);
      
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Laporan Transparansi Digital Keuangan - Gedung Serbaguna Huntap Tondo 2. Akuntabilitas untuk Warga.',
        margin,
        doc.internal.pageSize.height - 12
      );
      doc.text(`Halaman ${pageNumber}`, pageWidth - margin, doc.internal.pageSize.height - 12, { align: 'right' });
    };

    // Initial Header
    drawHeader(1);

    const isFilteredPeriod = (filterMode === 'monthly' && activeMonth !== 'all') || (filterMode === 'annual');

    const txsUpToCutoff = transactions.filter(t => {
      if (!t.date) return false;
      if (filterMode === 'monthly' && activeMonth !== 'all') {
        return t.date.slice(0, 7) <= activeMonth;
      }
      if (filterMode === 'annual') {
        return t.date.slice(0, 4) <= activeYear;
      }
      return true;
    });

    const docOps = isFilteredPeriod
      ? txsUpToCutoff.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0)
      : totalOps;
    const docDevFund = isFilteredPeriod
      ? txsUpToCutoff.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0)
      : totalDevFund;
    const docTotal = docOps + docDevFund;

    // Summary Section
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    let section1Title = 'I. RINGKASAN POSISI KEUANGAN';
    let totalLabel = 'TOTAL AKUMULASI SELURUH DANA GEDUNG';
    if (filterMode === 'monthly' && activeMonth !== 'all') {
      const [year, month] = activeMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      section1Title = `I. RINGKASAN POSISI KEUANGAN (PER AKHIR ${monthName.toUpperCase()})`;
      totalLabel = `TOTAL SALDO PER AKHIR ${monthName.toUpperCase()}`;
    } else if (filterMode === 'annual') {
      section1Title = `I. RINGKASAN POSISI KEUANGAN (PER AKHIR TAHUN ${activeYear})`;
      totalLabel = `TOTAL SALDO PER AKHIR TAHUN ${activeYear}`;
    }
    doc.text(section1Title, margin, 62);

    autoTable(doc, {
      startY: 65,
      margin: { left: margin, right: margin, bottom: 20 },
      head: [['Keterangan Alokasi Dana', 'Jumlah Saldo']],
      body: [
        ['Dana Operasional (Likuid / Rutin)', `Rp ${Math.floor(docOps).toLocaleString('id-ID')}`],
        ['Dana Saving (Cadangan / Strategis)', `Rp ${Math.floor(docDevFund).toLocaleString('id-ID')}`],
        [{ content: totalLabel, styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } }, { content: `Rp ${Math.floor(docTotal).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } }]
      ],
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 10, cellPadding: 2 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeader(data.pageNumber);
        }
        drawFooter(data.pageNumber);
      }
    });

    // History Table
    const lastY = (doc as any).lastAutoTable.finalY + 8; // Decreased spacing (was 12)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(activeMonth === 'all' ? 'II. RIWAYAT 15 TRANSAKSI TERBARU' : 'II. DAFTAR TRANSAKSI BULANAN', margin, lastY);
    
    let sortedTransactions = [...filteredTransactions]
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA; // Descending for raw sort
        return String(b.id || '').localeCompare(String(a.id || ''));
      });

    if (activeMonth === 'all') {
      sortedTransactions = sortedTransactions.slice(0, 15);
    }

    sortedTransactions = sortedTransactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB; // Ascending for the display list (newest at bottom)
        return String(a.id || '').localeCompare(String(b.id || ''));
      });
    
    const historyData = sortedTransactions.map((t) => [
      t.date.split('-').reverse().join('/'),
      t.source,
      displayCategory(t.category),
      t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER',
      t.type === 'income' ? 'MASUK' : t.type === 'reallocation' ? 'REALLOKASI' : 'KELUAR',
      t.type === 'reallocation' ? 'PENYESUAIAN' : `Rp ${Math.abs(t.amount || 0).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: lastY + 5,
      margin: { left: margin, right: margin, bottom: 25, top: 35 },
      head: [['Tanggal', 'Uraian Transaksi', 'Klasifikasi', 'Metode', 'Status', 'Nominal']],
      body: historyData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, halign: 'center' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', cellWidth: 25 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 32 }
      },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeader(data.pageNumber);
        }
        drawFooter(data.pageNumber);
      }
    });

    // --- REKAPITULASI ARUS KAS (Dashboard) ---
    const recapY = (doc as any).lastAutoTable.finalY + 12;
    const pageHeight = doc.internal.pageSize.height;
    
    // Safety check for page capacity
    let finalRecapY = recapY;
    if (finalRecapY > pageHeight - 110) {
      doc.addPage();
      drawHeader(doc.getNumberOfPages());
      drawFooter(doc.getNumberOfPages());
      finalRecapY = 35;
    }

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, finalRecapY - 5, pageWidth - (margin * 2), 42, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, finalRecapY - 5, pageWidth - (margin * 2), 42, 'D');

    doc.setTextColor(30, 64, 175);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    
    let recapTitle = 'III. REKAPITULASI ARUS KAS PERIODE';
    if (filterMode === 'monthly' && activeMonth !== 'all') {
      const [year, month] = activeMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      recapTitle += ` (${monthName.toUpperCase()})`;
    } else if (filterMode === 'annual') {
      recapTitle += ` (TAHUN ${activeYear})`;
    }
    doc.text(recapTitle, margin + 5, finalRecapY + 2);

    const periodTxs = transactions.filter(t => {
      if (!t.date) return false;
      if (filterMode === 'monthly') {
        return activeMonth === 'all' || t.date.startsWith(activeMonth);
      }
      return t.date.startsWith(activeYear);
    });

    const periodIncome = periodTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const periodExpense = periodTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
    
    // Initial balance calculation (before period)
    const allTxsSorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
    }

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text('Saldo Awal (Dana Sebelum Periode)', margin + 5, finalRecapY + 12);
    doc.text(`Rp ${Math.floor(initialBalance).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 12, { align: 'right' });

    doc.text('(+) Total Pemasukan Bulanan', margin + 5, finalRecapY + 19);
    doc.setTextColor(5, 150, 105);
    doc.text(`Rp ${Math.floor(periodIncome).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 19, { align: 'right' });

    doc.setTextColor(71, 85, 105);
    doc.text('(-) Total Pengeluaran Bulanan', margin + 5, finalRecapY + 26);
    doc.setTextColor(220, 38, 38);
    doc.text(`Rp ${Math.floor(periodExpense).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 26, { align: 'right' });

    doc.setFillColor(30, 64, 175);
    doc.rect(margin + 2, finalRecapY + 31, pageWidth - (margin * 2) - 4, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SALDO AKHIR PERIODE (TOTAL KAS)', margin + 5, finalRecapY + 36.5);
    const finalBalance = isFilteredPeriod ? (initialBalance + periodIncome - periodExpense) : (totalDevFund + totalOps);
    doc.text(`Rp ${Math.floor(finalBalance).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 36.5, { align: 'right' });

    // --- SIGNATURES SECTION ---
    const sigY = finalRecapY + 50;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const sigDate = `Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const signBlockWidth = 60;
    const rightSigX = pageWidth - margin - (signBlockWidth / 2);
    const leftSigX = margin + (signBlockWidth / 2);
    
    const financeName = config?.reportFinanceName || 'Keuangan';
    const bendaharaName = config?.reportBendaharaName || 'Bendahara';

    // Right Side: Bendahara
    doc.text(sigDate, rightSigX, sigY, { align: 'center' });
    doc.text('Mengetahui / Menyetujui,', rightSigX, sigY + 5, { align: 'center' });
    
    if (bendaharaSig) {
      try {
        doc.addImage(bendaharaSig, 'PNG', rightSigX - 15, sigY + 8, 30, 15);
      } catch (e) {
        console.error("Failed to add Bendahara signature to transparency report:", e);
      }
    }

    if (stampImg) {
      try {
        doc.addImage(stampImg, 'PNG', rightSigX - 22, sigY + 6, 24, 24);
      } catch (e) {
        console.error("Failed to add stamp to transparency report:", e);
      }
    }

    doc.setFont('helvetica', 'bold');
    doc.text(bendaharaName, rightSigX, sigY + 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Bendahara', rightSigX, sigY + 36, { align: 'center' });

    // Left Side: Administrasi Keuangan
    doc.text('Dibuat Oleh,', leftSigX, sigY + 5, { align: 'center' });
    if (financeSig) {
      try {
        doc.addImage(financeSig, 'PNG', leftSigX - 15, sigY + 8, 30, 15);
      } catch (e) {
        console.error("Failed to add Finance signature to transparency report:", e);
      }
    }
    doc.setFont('helvetica', 'bold');
    doc.text(financeName, leftSigX, sigY + 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text('Keuangan', leftSigX, sigY + 36, { align: 'center' });

    const periodLabel = activeMonth === 'all' ? 'Semua_Waktu' : 
      new Date(parseInt(activeMonth.split('-')[0]), parseInt(activeMonth.split('-')[1]) - 1)
        .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');

    const filename = `Laporan_Transparansi_${periodLabel}_${getLocalDateISO()}.pdf`;
    return { doc, filename };
  };

  const exportToPDF = async () => {
    if (transactions.length === 0) return;
    const { doc, filename } = await buildTransparencyDoc();
    doc.save(filename);
  };

  const handlePreviewReport = () => {
    if (transactions.length === 0) return;
    setPdfPreviewModal({
      isOpen: true,
      title: 'Laporan Transparansi Keuangan Warga',
      loadPdf: () => buildTransparencyDoc()
    });
  };

  const handlePreviewAnnualReport = () => {
    if (transactions.length === 0) return;
    setPdfPreviewModal({
      isOpen: true,
      title: `Laporan Infografis Tutup Buku Tahunan ${activeYear}`,
      loadPdf: () => buildAnnualReportDoc({
        year: activeYear,
        transactions: transactions,
        bookings: bookings,
        config: config,
        adminProfile: null
      })
    });
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = [
      'Tanggal', 
      'Keterangan Transaksi', 
      'Kategori', 
      'Metode Pembayaran', 
      'Jenis Transaksi', 
      'Nominal (Rp)', 
      'Dana Saving (20%)', 
      'Dana Operasional (80%)',
      'Catatan'
    ];

    const sortedTransactions = [...filteredTransactions]
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateA - dateB; // Ascending (Oldest -> Newest)
        return String(a.id || '').localeCompare(String(b.id || ''));
      });

    const rows = sortedTransactions.map(t => [
      t.date.split('-').reverse().join('/'),
      t.source,
      displayCategory(t.category),
      t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER',
      t.type === 'income' ? 'PEMASUKAN' : t.type === 'reallocation' ? 'REALLOKASI' : 'PENGELUARAN',
      t.amount || 0,
      t.devFund || 0,
      t.ops || 0,
      t.notes || '-'
    ]);

    const csvContent = [
      '\ufeff' + headers.map(sanitizeCsvCell).join(','), // UTF-8 BOM for Excel
      ...rows.map(row => row.map(sanitizeCsvCell).join(','))
    ].join('\n');

    const periodLabel = activeMonth === 'all' ? 'Semua_Waktu' : 
      new Date(parseInt(activeMonth.split('-')[0]), parseInt(activeMonth.split('-')[1]) - 1)
        .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Ekspor_Transparansi_${periodLabel}_${getLocalDateISO()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };


  const stats = [
    {
      id: 'saving-dev',
      title: 'Dana Saving',
      value: `Rp ${Math.floor(totalDevFund).toLocaleString('id-ID')}`,
      description: 'Alokasi khusus untuk renovasi & pemeliharaan fasilitas.',
      icon: PiggyBank,
      accent: 'bg-accent',
      color: 'text-white'
    },
    {
      id: 'saving-ops',
      title: 'Dana Operasional',
      value: `Rp ${Math.floor(totalOps).toLocaleString('id-ID')}`,
      description: 'Laporan biaya listrik, air, dan kebersihan bulan ini.',
      icon: Receipt,
      accent: 'bg-white',
      color: 'text-primary'
    }
  ];

  return (
    <section id="transparansi" className="section-padding bg-[#F8F9FA] border-b border-[#E5E7EB] scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 sm:gap-6 mb-10 sm:mb-12 text-left">
          <div className="max-w-2xl">
            <span className="text-xs font-medium text-[#1E40AF] block mb-2">Transparansi &amp; akuntabilitas kas</span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] mb-3 tracking-tight">
              Transparansi Keuangan Warga
            </h2>
            <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
              Setiap rupiah yang Anda bayarkan tercatat terbuka dalam buku kas dan dialokasikan kembali untuk operasional serta pengembangan aset Gedung Serbaguna.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-[#F1F3F5] border border-[#E5E7EB] p-1 rounded-xl w-full sm:w-auto">
              <button 
                onClick={() => setFilterMode('monthly')}
                className={`flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterMode === 'monthly' ? 'bg-[#FCFCFD] text-[#111827] shadow-xs border border-[#E5E7EB]' : 'text-[#4B5563] hover:text-[#111827]'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setFilterMode('annual')}
                className={`flex-1 sm:flex-none min-h-[40px] px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${filterMode === 'annual' ? 'bg-[#FCFCFD] text-[#111827] shadow-xs border border-[#E5E7EB]' : 'text-[#4B5563] hover:text-[#111827]'}`}
              >
                Tahunan
              </button>
            </div>

            <div className="relative w-full sm:w-auto">
              <div className="flex items-center gap-2.5 bg-[#FCFCFD] border border-[#D1D5DB] px-4 min-h-[44px] py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-[#1E40AF] shrink-0" />
                {filterMode === 'monthly' ? (
                  <select 
                    value={activeMonth}
                    onChange={(e: any) => setActiveMonth(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-medium text-[#111827] outline-none cursor-pointer appearance-none pr-6"
                  >
                    <option value="all">Semua bulan</option>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(1);
                      d.setMonth(d.getMonth() - i);
                      const val = getLocalMonthKey(d);
                      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                      return <option key={val} value={val}>{label}</option>;
                    })}
                  </select>
                ) : (
                  <select 
                    value={activeYear}
                    onChange={(e: any) => setActiveYear(e.target.value)}
                    className="w-full bg-transparent border-none text-xs font-mono tabular-nums font-medium text-[#111827] outline-none cursor-pointer appearance-none pr-6"
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const year = (new Date().getFullYear() - i).toString();
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                )}
                <ChevronDown className="w-4 h-4 text-[#6B7280] pointer-events-none shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Primary Kas Summary Cards */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6 mb-8 sm:mb-10">
          {stats.map((stat, index) => {
            const isPrimaryHero = stat.accent === 'bg-accent';
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className={`p-5 sm:p-7 rounded-2xl border flex flex-col justify-between gap-5 sm:gap-6 ${
                  isPrimaryHero
                    ? 'bg-[#1E40AF] border-[#1E40AF] text-white'
                    : 'bg-[#FCFCFD] border-[#E5E7EB] text-[#1E293B]'
                }`}
              >
                <div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 sm:mb-5 ${
                    isPrimaryHero ? 'bg-white/15 text-white' : 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]'
                  }`}>
                    <stat.icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <h3 className={`text-sm font-medium mb-2 ${isPrimaryHero ? 'text-blue-100' : 'text-[#4B5563]'}`}>
                    {stat.title}
                  </h3>
                  <div className={`text-2xl sm:text-4xl font-mono tabular-nums tracking-tight ${isPrimaryHero ? 'font-bold text-white' : 'font-semibold text-[#1E293B]'}`}>
                    {stat.value}
                  </div>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isPrimaryHero ? 'text-blue-100/90' : 'text-[#4B5563]'}`}>
                  {stat.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Target Pembangunan & Pengadaan Fasilitas Warga (Goal Tracker) */}
        {config?.showDevGoalTracker !== false && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#FCFCFD] rounded-2xl p-5 sm:p-8 border border-[#E5E7EB] border-l-4 border-l-[#1E40AF] mb-8 sm:mb-10"
          >
            <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="lg:col-span-7 space-y-3 min-w-0">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF]">
                  <Target className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{devGoalBadge}</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-[#111827]">
                  {devGoalTitle}
                </h3>
                <p className="text-[#4B5563] text-sm leading-relaxed max-w-2xl">
                  {devGoalDescription}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2 rounded-lg text-[#4B5563]">
                    <Sparkles className="w-3.5 h-3.5 text-[#1E40AF] shrink-0" />
                    <span>Sumber: <strong className="text-[#111827] font-mono tabular-nums">{(config?.devFundRate ?? 0.2) * 100}%</strong> alokasi otomatis sewa gedung</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E5E7EB] px-3.5 py-2 rounded-lg text-[#4B5563]">
                    <TrendingUp className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    <span>
                      {devGoalRemaining === 0 ? (
                        <strong className="text-[#15803D]">Target tercapai 100% — siap eksekusi pengadaan</strong>
                      ) : (
                        <>Kurang <strong className="text-[#111827] font-mono tabular-nums">Rp {Math.floor(devGoalRemaining).toLocaleString('id-ID')}</strong> menuju target</>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-4 sm:p-6 min-w-0">
                <div className="flex justify-between items-end mb-4 gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#4B5563] mb-1">Dana Saving Terkumpul</p>
                    <p className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-[#111827] truncate">
                      Rp {Math.floor(Math.max(0, totalDevFund)).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#6B7280] mb-1">Target Dana</p>
                    <p className="text-xs sm:text-sm font-mono tabular-nums font-semibold text-[#4B5563]">
                      Rp {Math.floor(devGoalTarget).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${devGoalProgress}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full bg-[#1E40AF]"
                  />
                </div>

                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="font-semibold text-[#1E40AF]">{devGoalProgress.toFixed(1)}% terkumpul</span>
                  <span className="text-[#6B7280]">
                    {devGoalProgress >= 100 ? 'Tercapai' : devGoalProgress >= 50 ? 'Tahap akumulasi akhir' : 'Tahap pengumpulan'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Visual Insights for Public: 1 Wide Bar Chart + 1 Ranked Horizontal Breakdown List */}
        <div className="grid lg:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-2 bg-[#FCFCFD] p-5 sm:p-7 rounded-2xl border border-[#E5E7EB] min-w-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 sm:mb-6">
              <h4 className="font-semibold text-[#111827] text-sm">Arus Kas 4 Bulan Terakhir</h4>
              <div className="flex gap-4 text-xs text-[#4B5563]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#1E40AF]" />Pemasukan</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-xs bg-[#CBD5E1]" />Pengeluaran</span>
              </div>
            </div>
            <div className="h-[220px] sm:h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#6B7280' }} dy={10} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(17, 24, 39, 0.04)' }}
                    contentStyle={{ borderRadius: '0.75rem', border: '1px solid rgba(17,24,39,0.12)', backgroundColor: '#FCFCFD', fontSize: '12px' }}
                    formatter={(val: any) => `Rp ${Number(val || 0).toLocaleString('id-ID')}`}
                  />
                  <Bar dataKey="income" name="Pemasukan" fill="#1E40AF" radius={[4, 4, 0, 0]} barSize={26} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#CBD5E1" radius={[4, 4, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.25, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#FCFCFD] p-5 sm:p-7 rounded-2xl border border-[#E5E7EB] min-w-0 flex flex-col justify-between"
          >
            <div>
              <h4 className="font-semibold text-[#111827] text-sm mb-1">Distribusi Pengeluaran</h4>
              <p className="text-xs text-[#6B7280] mb-6">Peringkat kategori biaya operasional.</p>
              {categoryData.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#6B7280]">
                  Belum ada pengeluaran pada periode ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const maxCatValue = Math.max(...categoryData.map((c) => Number(c.value || 0)), 1);
                    const totalCatValue = categoryData.reduce((acc, c) => acc + Number(c.value || 0), 0) || 1;
                    return categoryData.slice(0, 5).map((cat, idx) => {
                      const pctWidth = Math.max(6, Math.round((Number(cat.value || 0) / maxCatValue) * 100));
                      const sharePct = Math.round((Number(cat.value || 0) / totalCatValue) * 100);
                      return (
                        <div key={cat.name} className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2 text-xs">
                            <span className="font-medium text-[#111827] truncate">{cat.name}</span>
                            <span className="font-mono tabular-nums font-semibold text-[#111827] shrink-0">
                              Rp {Number(cat.value || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#F1F3F5] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${idx === 0 ? 'bg-[#1E40AF]' : 'bg-[#94A3B8]'}`}
                                style={{ width: `${pctWidth}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono tabular-nums text-[#6B7280] w-9 text-right">
                              {sharePct}%
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
              <span>Periode aktif</span>
              <span className="font-mono tabular-nums font-medium text-[#111827]">
                {activeMonth === 'all' ? (filterMode === 'annual' ? activeYear : 'Semua bulan') : activeMonth}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Citizen Guarantee & Official Export Bar */}
        <div className="bg-[#FCFCFD] rounded-2xl p-5 sm:p-7 border border-[#E5E7EB] flex flex-col lg:flex-row items-start lg:items-center gap-5 sm:gap-6 mb-8 sm:mb-10">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck className="text-[#1E40AF] w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-[#111827] text-base sm:text-lg mb-1" id="trust-guarantee">Jaminan Kepercayaan Warga</h4>
            <p className="text-[#4B5563] text-xs sm:text-sm leading-relaxed">
              Setiap biaya sewa yang Anda bayarkan, <span className="font-mono tabular-nums font-semibold text-[#1E40AF]">{(config?.devFundRate ?? 0.2) * 100}%</span> dialokasikan langsung untuk pemeliharaan fasilitas gedung sebagai aset bersama warga Huntap Tondo 2.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto shrink-0">
            <button 
              onClick={exportToCSV}
              className="w-full sm:w-auto min-h-[44px] bg-[#F8F9FA] border border-[#D1D5DB] text-[#111827] px-4 py-2.5 rounded-lg font-medium hover:bg-[#F1F3F5] transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              Export CSV/Excel
            </button>
            {filterMode === 'annual' && (
              <button 
                onClick={handlePreviewAnnualReport}
                className="w-full sm:w-auto min-h-[44px] bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE] px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
                title={`Pratinjau & Unduh Laporan Tutup Buku Tahunan ${activeYear}`}
              >
                <Award className="w-4 h-4 text-[#D97706]" />
                Tutup Buku {activeYear}
              </button>
            )}
            <button 
              onClick={handlePreviewReport}
              className="w-full sm:w-auto min-h-[44px] bg-[#1E40AF] hover:bg-[#1D3A8A] text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
              title="Pratinjau, Cetak & Unduh Laporan PDF"
            >
              <Download className="w-4 h-4" />
              Cetak / Unduh PDF
            </button>
          </div>
        </div>

        {/* Budget Insight for Citizens */}
        <div className="bg-[#FCFCFD] border border-[#E5E7EB] border-l-4 border-l-[#059669] rounded-2xl p-5 sm:p-7 mb-8 sm:mb-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
            <div className="max-w-md min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="bg-[#F0FDF4] p-2 rounded-lg border border-[#BBF7D0]">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                </div>
                <span className="text-xs font-medium text-[#15803D]">Efisiensi anggaran operasional</span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#111827] mb-2">
                Penggunaan Dana Operasional {activeMonth === 'all' ? 'Bulan Ini' : new Date(activeMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-[#4B5563] text-xs sm:text-sm leading-relaxed">
                Pengurus menjaga pengeluaran operasional (listrik, air, kebersihan, staf) agar tetap di bawah pagu anggaran bulanan untuk memaksimalkan saldo kas warga.
              </p>
            </div>
            
            <div className="w-full lg:w-[380px] lg:shrink-0 bg-[#F8F9FA] p-5 sm:p-6 rounded-xl border border-[#E5E7EB]">
              <div className="flex justify-between items-end mb-4 gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#4B5563] mb-1">Realisasi Penyerapan</p>
                  <p className="text-xl sm:text-3xl font-mono tabular-nums font-semibold text-[#111827] truncate">Rp {currentMonthOpsExpense.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#6B7280] mb-1">Target Anggaran</p>
                  <p className="text-xs sm:text-sm font-mono tabular-nums font-semibold text-[#4B5563]">Rp {(config?.monthlyBudget || 0).toLocaleString('id-ID')}</p>
                </div>
              </div>
              
              <div className="w-full h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden mb-3">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(100, budgetProgress)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full ${budgetProgress > 100 ? 'bg-[#DC2626]' : budgetProgress > 85 ? 'bg-[#B45309]' : 'bg-[#16A34A]'}`}
                />
              </div>
              
              <div className="flex justify-between text-xs font-mono tabular-nums">
                <span className={`font-semibold ${budgetProgress > 100 ? 'text-[#B91C1C]' : 'text-[#15803D]'}`}>
                  {budgetProgress > 100 ? 'Melebihi anggaran' : 'Dalam batas target'}
                </span>
                <span className="text-[#4B5563]">{Math.round(budgetProgress)}% terpakai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table / Mobile Ledger */}
        <div className="bg-[#FCFCFD] rounded-2xl border border-[#E5E7EB] overflow-hidden mb-4 sm:mb-8">
          <div className="px-4 sm:px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h4 className="font-semibold text-[#111827] text-sm">Catatan Mutasi Kas Terbaru</h4>
            <LayoutGrid className="w-4 h-4 text-[#6B7280]" />
          </div>

          {/* Mobile Stacked Ledger Cards */}
          <div className="sm:hidden divide-y divide-[#E5E7EB]">
            {filteredTransactions.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-[#6B7280]">
                Belum ada data transaksi publik pada periode ini.
              </div>
            ) : (
              filteredTransactions.slice(0, activeMonth === 'all' ? 5 : 20).map((t) => (
                <div key={t.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#111827] leading-snug">{t.source}</p>
                      <span className="text-[11px] font-mono tabular-nums text-[#6B7280] block mt-0.5">
                        {t.date} · {displayCategory(t.category)}
                      </span>
                    </div>
                    <div className="text-right shrink-0 font-mono tabular-nums">
                      {t.type === 'reallocation' ? (
                        <span className="text-xs font-medium text-[#B45309]">Penyesuaian</span>
                      ) : (
                        <span className={`text-xs font-semibold ${t.type === 'income' ? 'text-[#111827]' : 'text-[#DC2626]'}`}>
                          {t.type === 'income' ? '+' : '-'} Rp {Math.abs(t.amount || 0).toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] font-mono text-[#1E40AF] px-1.5 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded">
                      {t.paymentMethod === 'cash' ? 'Tunai' : t.paymentMethod === 'qris' ? 'QRIS' : 'Transfer'}
                    </span>
                    <span className={`text-[11px] font-medium ${
                      t.type === 'income' ? 'text-[#15803D]' : 
                      t.type === 'reallocation' ? 'text-[#B45309]' : 'text-[#DC2626]'
                    }`}>
                      {t.type === 'income' ? 'Masuk' : t.type === 'reallocation' ? 'Realokasi' : 'Keluar'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop / Tablet Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8F9FA] text-xs font-medium text-[#6B7280] border-b border-[#E5E7EB]">
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">Keterangan</th>
                  <th className="px-6 py-3.5">Tipe</th>
                  <th className="px-6 py-3.5 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredTransactions.slice(0, activeMonth === 'all' ? 5 : 20).map((t) => (
                  <tr key={t.id} className="hover:bg-[#F8F9FA]/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono tabular-nums text-[#4B5563] whitespace-nowrap">{t.date}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-[#111827]">{t.source}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-[#6B7280]">
                          {displayCategory(t.category)}
                        </span>
                        <span className="text-[10px] font-mono text-[#1E40AF] px-1.5 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded">
                          {t.paymentMethod === 'cash' ? 'Tunai' : t.paymentMethod === 'qris' ? 'QRIS' : 'Transfer'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium ${
                        t.type === 'income' ? 'text-[#15803D]' : 
                        t.type === 'reallocation' ? 'text-[#B45309]' : 'text-[#DC2626]'
                      }`}>
                        {t.type === 'income' ? 'Masuk' : t.type === 'reallocation' ? 'Realokasi' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {t.type === 'reallocation' ? (
                        <span className="text-xs font-medium text-[#B45309]">Penyesuaian</span>
                      ) : (
                        <span className={`text-xs font-semibold ${t.type === 'income' ? 'text-[#111827]' : 'text-[#DC2626]'}`}>
                          {t.type === 'income' ? '+' : '-'} Rp {Math.abs(t.amount || 0).toLocaleString('id-ID')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-xs text-[#6B7280]">Belum ada data transaksi publik pada periode ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <PdfPreviewModal
        isOpen={pdfPreviewModal.isOpen}
        onClose={() => setPdfPreviewModal(prev => ({ ...prev, isOpen: false }))}
        title={pdfPreviewModal.title}
        loadPdf={pdfPreviewModal.loadPdf}
      />
    </section>
  );
}
