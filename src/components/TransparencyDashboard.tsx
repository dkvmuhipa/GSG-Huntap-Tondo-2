import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PiggyBank, Receipt, ShieldCheck, Download, LayoutGrid, CheckCircle2, Clock, Calendar, ChevronDown } from 'lucide-react';
import { subscribeToConfig, subscribeToTransactions } from '../lib/db';
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

export default function TransparencyDashboard() {
  const getLocalMonthKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

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

  const [config, setConfig] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeMonth, setActiveMonth] = useState('all');
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
  const [filterMode, setFilterMode] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    const unsubConfig = subscribeToConfig((data) => setConfig(data));
    // Subscribe to all to keep balances accurate, filter list/charts client-side
    const unsubTx = subscribeToTransactions((data) => setTransactions(data));
    return () => {
      unsubConfig();
      unsubTx();
    };
  }, []);

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

  const exportToPDF = () => {
    if (transactions.length === 0) return;
    
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

        if (activeMonth !== 'all') {
          const [year, month] = activeMonth.split('-');
          const mDate = new Date(parseInt(year), parseInt(month) - 1);
          const monthName = mDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(`PERIODE: ${monthName.toUpperCase()}`, margin, 40);
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

    // Summary Section
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. RINGKASAN POSISI KEUANGAN', margin, 62);

    autoTable(doc, {
      startY: 65,
      margin: { left: margin, right: margin, bottom: 20 },
      head: [['Keterangan Alokasi Dana', 'Jumlah Saldo']],
      body: [
        ['Dana Operasional (Likuid / Rutin)', `Rp ${Math.floor(totalOps).toLocaleString('id-ID')}`],
        ['Dana Saving (Cadangan / Strategis)', `Rp ${Math.floor(totalDevFund).toLocaleString('id-ID')}`],
        [{ content: 'TOTAL AKUMULASI SELURUH DANA GEDUNG', styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } }, { content: `Rp ${Math.floor(totalDevFund + totalOps).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } }]
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
    if (finalRecapY > pageHeight - 70) {
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
    if (activeMonth !== 'all') {
      const [year, month] = activeMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      recapTitle += ` (${monthName.toUpperCase()})`;
    }
    doc.text(recapTitle, margin + 5, finalRecapY + 2);

    const periodIncome = sortedTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const periodExpense = sortedTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
    
    // Initial balance calculation (all time before activeMonth)
    const allTxsSorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let initialBalance = 0;
    if (activeMonth !== 'all') {
      initialBalance = allTxsSorted
        .filter(t => t.date < activeMonth + '-01')
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
    doc.text(`Rp ${Math.floor(initialBalance + periodIncome - periodExpense).toLocaleString('id-ID')}`, pageWidth - margin - 5, finalRecapY + 36.5, { align: 'right' });

    const periodLabel = activeMonth === 'all' ? 'Semua_Waktu' : 
      new Date(parseInt(activeMonth.split('-')[0]), parseInt(activeMonth.split('-')[1]) - 1)
        .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');

    doc.save(`Laporan_Transparansi_${periodLabel}_${new Date().toISOString().split('T')[0]}.pdf`);
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
      '\ufeff' + headers.join(','), // UTF-8 BOM for Excel
      ...rows.map(row => row.map(cell => {
        const val = cell === null || cell === undefined ? '' : String(cell);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const periodLabel = activeMonth === 'all' ? 'Semua_Waktu' : 
      new Date(parseInt(activeMonth.split('-')[0]), parseInt(activeMonth.split('-')[1]) - 1)
        .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Ekspor_Transparansi_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`);
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
    <section id="transparansi" className="section-padding bg-surface-low">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12 text-center lg:text-left">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Financial Transparency</h2>
            <p className="text-gray-500">
              Setiap rupiah yang Anda bayarkan dikelola kembali untuk kepentingan warga secara transparan dan akuntabel.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-white border border-gray-100 p-1 rounded-2xl shadow-sm w-full sm:w-auto">
              <button 
                onClick={() => setFilterMode('monthly')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'monthly' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setFilterMode('annual')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'annual' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}
              >
                Tahunan
              </button>
            </div>

            <div className="relative group w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-white border border-gray-100 px-6 py-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <Calendar className="w-5 h-5 text-primary" />
                {filterMode === 'monthly' ? (
                  <select 
                    value={activeMonth}
                    onChange={(e: any) => setActiveMonth(e.target.value)}
                    className="w-full bg-transparent border-none text-sm font-black text-gray-900 outline-none cursor-pointer appearance-none pr-8 uppercase tracking-widest"
                  >
                    <option value="all">SEMUA BULAN</option>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const d = new Date();
                      d.setDate(1);
                      d.setMonth(d.getMonth() - i);
                      const val = getLocalMonthKey(d);
                      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                      return <option key={val} value={val}>{label.toUpperCase()}</option>;
                    })}
                  </select>
                ) : (
                  <select 
                    value={activeYear}
                    onChange={(e: any) => setActiveYear(e.target.value)}
                    className="w-full bg-transparent border-none text-sm font-black text-gray-900 outline-none cursor-pointer appearance-none pr-8 uppercase tracking-widest"
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const year = (new Date().getFullYear() - i).toString();
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                )}
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`p-10 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 flex flex-col justify-between h-[320px] ${stat.accent === 'bg-accent' ? 'bg-accent text-white' : 'bg-white'}`}
            >
              <div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${stat.accent === 'bg-accent' ? 'bg-white/20' : 'bg-blue-50'}`}>
                  <stat.icon className={`w-7 h-7 ${stat.accent === 'bg-accent' ? 'text-white' : 'text-primary'}`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${stat.accent === 'bg-accent' ? 'text-white' : 'text-gray-900'}`}>{stat.title}</h3>
                <div className={`text-4xl font-extrabold mb-4 ${stat.accent === 'bg-accent' ? 'text-white' : 'text-primary'}`}>{stat.value}</div>
              </div>
              <p className={`text-sm leading-relaxed ${stat.accent === 'bg-accent' ? 'text-white/80' : 'text-gray-500'}`}>
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Visual Insights for Public */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h4 className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Aktivitas Keuangan 4 Bulan Terakhir</h4>
              <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" />Pemasukan</span>
                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Pengeluaran</span>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="income" fill="#1E40AF" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="expense" fill="#F87171" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
          >
            <h4 className="font-black text-gray-900 uppercase tracking-widest text-[10px] mb-6">Distribusi Pengeluaran</h4>
            <div className="h-[150px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData.length > 0 ? categoryData : [{ name: 'N/A', value: 1 }]} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value">
                    {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    {categoryData.length === 0 && <Cell key="empty-cell" fill="#f1f5f9" />}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Receipt className="w-5 h-5 text-gray-200" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.slice(0, 3).map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1.5 uppercase">
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    {cat.name}
                  </span>
                  <span className="text-[10px] font-black text-gray-900">RP {cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="bg-primary/5 rounded-[2rem] p-8 border border-primary/10 flex flex-col md:flex-row items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shrink-0">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg mb-1" id="trust-guarantee">Jaminan Kepercayaan Warga</h4>
            <p className="text-gray-600 text-sm">"Setiap sewa yang Anda bayar, <span className="font-bold text-primary">{(config?.devFundRate ?? 0.2) * 100}% dialokasikan langsung</span> untuk pemeliharaan fasilitas gedung demi aset masa depan Tondo 2. Dana operasional juga dapat dialokasikan kembali untuk pengembangan aset jika terdapat kelebihan anggaran."</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button 
              onClick={exportToCSV}
              className="bg-white border border-primary/20 text-primary px-6 py-3 rounded-2xl font-bold hover:bg-white/50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              Export CSV/Excel
            </button>
            <button 
              onClick={exportToPDF}
              className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center justify-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Unduh Laporan (PDF)
            </button>
          </div>
        </div>

        {/* Budget Insight for Citizens */}
        <div className="bg-emerald-900 rounded-[2.5rem] p-10 text-white mb-12 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-emerald-500/20 p-3 rounded-2xl backdrop-blur-sm border border-emerald-400/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                 </div>
                 <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Efisiensi Anggaran</span>
              </div>
              <h3 className="text-2xl font-black mb-4">Penggunaan Dana Operasional {activeMonth === 'all' ? 'Bulan Ini' : new Date(activeMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h3>
              <p className="text-emerald-100/60 text-sm leading-relaxed">
                Kami berkomitmen menjaga pengeluaran operasional (listrik, air, staf) di bawah target anggaran bulanan untuk memaksimalkan saldo kas warga.
              </p>
            </div>
            
            <div className="w-full md:w-[400px] bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-sm">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Status Penyerapan</p>
                  <p className="text-3xl font-black">Rp {currentMonthOpsExpense.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Target Anggaran</p>
                  <p className="text-sm font-bold text-white/60">Rp {(config?.monthlyBudget || 0).toLocaleString('id-ID')}</p>
                </div>
              </div>
              
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(100, budgetProgress)}%` }}
                  viewport={{ once: true }}
                  className={`h-full ${budgetProgress > 85 ? 'bg-orange-500' : 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'}`}
                />
              </div>
              
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className={budgetProgress > 100 ? 'text-red-400' : 'text-emerald-400'}>
                  {budgetProgress > 100 ? 'OVER BUDGET' : 'DALAM TARGET'}
                </span>
                <span className="text-white/40">{Math.round(budgetProgress)}% TERPAKAI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-12">
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
            <h4 className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Aktivitas Keuangan Terbaru</h4>
            <LayoutGrid className="w-4 h-4 text-gray-300" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[9px] uppercase font-bold text-gray-400 tracking-widest">
                  <th className="px-8 py-4">Tanggal</th>
                  <th className="px-8 py-4">Keterangan</th>
                  <th className="px-8 py-4">Tipe</th>
                  <th className="px-8 py-4 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.slice(0, activeMonth === 'all' ? 5 : 20).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-4 text-[11px] font-bold text-gray-400">{t.date}</td>
                    <td className="px-8 py-4">
                      <p className="text-xs font-bold text-gray-900">{t.source}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                          {displayCategory(t.category)}
                        </span>
                        <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest px-1.5 py-0.5 bg-blue-50 rounded italic">
                          {t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        t.type === 'income' ? 'text-emerald-500' : 
                        t.type === 'reallocation' ? 'text-accent' : 'text-red-500'
                      }`}>
                        {t.type === 'income' ? 'Masuk' : t.type === 'reallocation' ? 'Reallokasi' : 'Keluar'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {t.type === 'reallocation' ? (
                        <span className="text-xs font-black text-accent italic">Adjustment</span>
                      ) : (
                        <span className={`text-xs font-black ${t.type === 'income' ? 'text-gray-900' : 'text-red-500'}`}>
                          {t.type === 'income' ? '+' : '-'} Rp {Math.abs(t.amount || 0).toLocaleString('id-ID')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center text-xs text-gray-400 italic">Belum ada data transaksi publik.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
