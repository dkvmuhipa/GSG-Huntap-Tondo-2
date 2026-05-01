import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  Trash2, 
  Download, 
  TrendingUp, 
  PlusCircle, 
  Receipt, 
  Wallet,
  LayoutGrid,
  X, 
  Shield, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  User as UserIcon,
  ChevronDown,
  Calendar,
  Upload,
  Edit3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
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
import { 
  subscribeToTransactions, 
  addTransaction, 
  updateTransaction, 
  removeTransaction, 
  syncFinanceTotals, 
  subscribeToConfig, 
  updateGlobalConfig,
  subscribeToAdmins
} from '../../lib/db';
import { uploadToCloudinary } from '../../lib/cloudinary';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { auth } from '../../lib/firebase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useOutletContext } from 'react-router-dom';

export default function FinanceManager() {
  const { userRole, adminProfile } = useOutletContext<{ userRole: string, adminProfile: any }>();
  const isAuthorized = ['owner', 'admin', 'finance', 'bendahara'].includes(userRole);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newRate, setNewRate] = useState('20');
  const [newBudget, setNewBudget] = useState('5000000');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense'>('all');
  const [activeMonth, setActiveMonth] = useState('all');

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'info' | 'success';
    isAlert?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    transactionId: string;
    transactionInfo: string;
  }>({
    isOpen: false,
    transactionId: '',
    transactionInfo: ''
  });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: '',
    amount: '',
    type: 'income' as 'income' | 'expense' | 'reallocation',
    category: 'umum',
    paymentMethod: 'transfer' as 'cash' | 'transfer' | 'qris',
    notes: '',
    status: 'completed',
    receiptUrl: '',
    allocationMode: 'auto' as 'auto' | 'full_ops' | 'full_dev',
    expenseSource: 'ops' as 'ops' | 'dev',
    transferDirection: 'ops_to_dev' as 'ops_to_dev' | 'dev_to_ops'
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  useEffect(() => {
    const unsubTx = subscribeToTransactions(setTransactions, { 
      type: activeType, 
      month: activeMonth 
    });
    const unsubConfig = subscribeToConfig(setConfig);
    const unsubAdmins = subscribeToAdmins(setAdmins);
    return () => {
      unsubTx();
      unsubConfig();
      unsubAdmins();
    };
  }, [activeType, activeMonth]);

  useEffect(() => {
    if (config?.devFundRate) {
      setNewRate((config.devFundRate * 100).toString());
    }
    if (config?.monthlyBudget) {
      setNewBudget(config.monthlyBudget.toString());
    }
  }, [config]);

  useEffect(() => {
    if (transactions.length > 0) {
      syncFinanceTotals(transactions);
    }
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const lower = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.source?.toLowerCase().includes(lower) || 
      t.category?.toLowerCase().includes(lower) ||
      t.addedBy?.toLowerCase().includes(lower)
    );
  }, [transactions, searchQuery]);

  const rate = config?.devFundRate ?? 0.2;
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalDevFund = transactions.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0);
  const totalOps = transactions.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthOpsExpense = transactions
    .filter(t => t.date.startsWith(currentMonth) && t.type === 'expense' && t.expenseSource === 'ops')
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
  
  const budgetProgress = config?.monthlyBudget ? (currentMonthOpsExpense / config.monthlyBudget) * 100 : 0;

  const handleEdit = (tx: any) => {
    setEditingId(tx.id);
    setFormData({
      date: tx.date,
      source: tx.source,
      amount: Math.abs(tx.amount).toString(),
      type: tx.type,
      category: tx.category || 'umum',
      paymentMethod: tx.paymentMethod || 'transfer',
      notes: tx.notes || '',
      status: tx.status || 'completed',
      receiptUrl: tx.receiptUrl || '',
      allocationMode: tx.allocationMode || 'auto',
      expenseSource: tx.expenseSource || 'ops',
      transferDirection: tx.transferDirection || 'ops_to_dev'
    });
    setReceiptFile(null);
    setIsModalOpen(true);
  };
  const handleDeleteTransaction = (id: string, info: string) => {
    setConfirmModal({
      isOpen: true,
      transactionId: id,
      transactionInfo: info
    });
  };

  const confirmDeleteTransaction = async () => {
    try {
      await removeTransaction(confirmModal.transactionId);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleUpdateBudget = async () => {
    try {
      await updateGlobalConfig({ monthlyBudget: Number(newBudget) });
      setIsBudgetModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

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

    // Page margin configuration
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Header - App Theme (Primary Blue)
    doc.setFillColor(30, 64, 175); // primary blue
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Title Section
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); // Reduced to 14 for optimal fit
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEUANGAN GEDUNG SERBAGUNA', margin, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240); // Better contrast
    doc.text(config?.reportOrgName?.toUpperCase() || 'HUNTAP TONDO 2, KEL. TONDO, KEC. MANTIKULORE', margin, 28);
    doc.text('KOTA PALU, SULAWESI TENGAH', margin, 34);

    // Metadata Section (Right Aligned)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMASI LAPORAN:', pageWidth - margin, 18, { align: 'right' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    doc.text(`Waktu Cetak: ${generationDate}`, pageWidth - margin, 24, { align: 'right' });

    const roleMap: Record<string, string> = {
      owner: 'Pengelola',
      admin: 'Administrator',
      editor: 'Editor',
      bendahara: 'Bendahara',
      finance: 'Admin Keuangan'
    };

    const currentRole = adminProfile?.role ? (roleMap[adminProfile.role] || adminProfile.role) : '';
    const authorName = config?.reportAuthorName || 
                      (adminProfile?.displayName ? `${adminProfile.displayName}${currentRole ? ` (${currentRole})` : ''}` : null) || 
                      auth.currentUser?.displayName || 
                      'Administrator';

    doc.text(`Oleh: ${authorName}`, pageWidth - margin, 30, { align: 'right' });
    doc.text(`Status: Laporan Internal Pengurus`, pageWidth - margin, 36, { align: 'right' });

    // Section 1: Ringkasan Saldo
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. RINGKASAN SALDO KAS TERSEDIA', margin, 62);

    const currentRate = (config?.devFundRate ?? 0.2) * 100;
    
    autoTable(doc, {
      startY: 68,
      margin: { left: margin, right: margin },
      head: [['Keterangan Klasifikasi Dana', 'Porsi (%)', 'Jumlah Saldo']],
      body: [
        ['Dana Operasional', `${100 - currentRate}%`, `Rp ${totalOps.toLocaleString('id-ID')}`],
        ['Dana Saving', `${currentRate}%`, `Rp ${totalDevFund.toLocaleString('id-ID')}`],
        [{ content: 'TOTAL AKUMULASI SELURUH DANA', styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } }, '', { content: `Rp ${(totalDevFund + totalOps).toLocaleString('id-ID')}`, styles: { fontStyle: 'bold', fillColor: [30, 64, 175], textColor: 255 } }]
      ],
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontSize: 10, halign: 'center', fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 } ,
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
      },
      theme: 'grid'
    });

    const noteY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('* Dana Operasional: Siap digunakan untuk kebutuhan rutin harian. Dana Saving: Dialokasikan khusus untuk pengembangan fisik atau dana darurat.', margin, noteY);

    // Section 2: Rincian Transaksi
    const txStartY = (doc as any).lastAutoTable.finalY + 18; 
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('II. RINCIAN TRANSAKSI AKTIVITAS', margin, txStartY);

    // Sort transactions by date ascending (Oldest to Newest) - Chronological order
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB; // Ascending
      // Secondary sort by ID to preserve input order
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    // Handle display of categories matching app settings
    const displayCategory = (cat: string) => {
      const map: Record<string, string> = {
        sewa: 'Sewa Gedung',
        iuran: 'Iuran Warga',
        listrik: 'Listrik & Air',
        perbaikan: 'Perbaikan',
        peralatan: 'Peralatan',
        kebersihan: 'Kebersihan',
        keamanan: 'Keamanan',
        umum: 'Umum / Lainnya'
      };
      return map[cat] || cat?.toUpperCase() || 'UMUM';
    };

    const tableData = sortedTransactions.map((t, index) => [
      index + 1,
      t.date.split('-').reverse().join('/'), 
      t.source,
      displayCategory(t.category),
      t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER',
      { content: t.type === 'income' ? 'MASUK' : t.type === 'reallocation' ? 'REALLOKASI' : 'KELUAR', styles: { textColor: t.type === 'income' ? [5, 150, 105] : t.type === 'reallocation' ? [217, 119, 6] : [220, 38, 38] } },
      `Rp ${Math.abs(t.amount || 0).toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: txStartY + 5,
      margin: { left: margin, right: margin, bottom: 25 },
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
        // Footer elements on each page
        const str = 'Halaman ' + doc.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text('Laporan Rahasia - Penggunaan Internal Pengurus Gedung Serbaguna Huntap Tondo 2', margin, pageHeight - 10);
        doc.text(str, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }
    });

    // Section 3: Signature Area
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    let sigY = finalY;
    if (sigY > pageHeight - 60) {
      doc.addPage();
      sigY = 30;
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

    doc.save(`Laporan_Keuangan_GSG_Admin_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = [
      'ID',
      'Tanggal', 
      'Keterangan Transaksi', 
      'Kategori', 
      'Metode Pembayaran', 
      'Jenis Transaksi', 
      'Nominal (Rp)', 
      'Dana Saving (20%)', 
      'Dana Operasional (80%)',
      'User Input',
      'Status',
      'Catatan'
    ];

    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB; // Ascending
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    // Handle display of categories matching app settings
    const displayCategory = (cat: string) => {
      const map: Record<string, string> = {
        sewa: 'Sewa Gedung',
        iuran: 'Iuran Warga',
        listrik: 'Listrik & Air',
        perbaikan: 'Perbaikan',
        peralatan: 'Peralatan',
        kebersihan: 'Kebersihan',
        keamanan: 'Keamanan',
        umum: 'Umum / Lainnya'
      };
      return map[cat] || cat?.toUpperCase() || 'UMUM';
    };

    const rows = sortedTransactions.map((t) => [
      t.id,
      t.date.split('-').reverse().join('/'),
      t.source,
      displayCategory(t.category),
      t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER',
      t.type === 'income' ? 'PEMASUKAN' : t.type === 'reallocation' ? 'REALLOKASI' : 'PENGELUARAN',
      t.amount || 0,
      t.devFund || 0,
      t.ops || 0,
      t.addedBy || 'Sistem',
      t.status === 'completed' ? 'SELESAI' : t.status === 'pending' ? 'PENDING' : 'BATAL',
      t.notes || '-'
    ]);

    const csvContent = [
      '\ufeff' + headers.join(','), // UTF-8 BOM for Excel
      ...rows.map(row => row.map(cell => {
        const val = cell === null || cell === undefined ? '' : String(cell);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Ekspor_Admin_Keuangan_GSG_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    setIsLoggingIn(true);
    
    try {
      let finalReceiptUrl = formData.receiptUrl;
      if (receiptFile) {
        setIsUploadingReceipt(true);
        try {
          const { url } = await uploadToCloudinary(receiptFile);
          finalReceiptUrl = url;
        } finally {
          setIsUploadingReceipt(false);
        }
      }

      const rate = config?.devFundRate ?? 0.2;
      let devFund = 0;
      let ops = 0;
      let finalAmount = amount;

      if (formData.type === 'income') {
        finalAmount = amount;
        if (formData.allocationMode === 'full_ops') {
          ops = amount;
          devFund = 0;
        } else if (formData.allocationMode === 'full_dev') {
          devFund = amount;
          ops = 0;
        } else {
          devFund = amount * rate;
          ops = amount * (1 - rate);
        }
      } else if (formData.type === 'expense') {
        finalAmount = -amount;
        if (formData.expenseSource === 'dev') {
          devFund = -amount;
          ops = 0;
        } else {
          ops = -amount;
          devFund = 0;
        }
      } else if (formData.type === 'reallocation') {
        finalAmount = 0; // Net zero for the whole GSG
        if (formData.transferDirection === 'ops_to_dev') {
          ops = -amount;
          devFund = amount;
        } else {
          ops = amount;
          devFund = -amount;
        }
      }

      if (editingId) {
        await updateTransaction(editingId, {
          ...formData,
          receiptUrl: finalReceiptUrl,
          amount: finalAmount,
          devFund,
          ops
        });
      } else {
        await addTransaction({
          ...formData,
          receiptUrl: finalReceiptUrl,
          amount: finalAmount,
          devFund,
          ops
        }, { 
          email: auth.currentUser?.email || null, 
          displayName: adminProfile?.displayName || auth.currentUser?.displayName || undefined,
          role: userRole
        });
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        source: '',
        amount: '',
        type: 'income',
        category: 'umum',
        paymentMethod: 'transfer',
        notes: '',
        status: 'completed',
        receiptUrl: '',
        allocationMode: 'auto',
        expenseSource: 'ops',
        transferDirection: 'ops_to_dev'
      });
      setReceiptFile(null);
      setError(null);
    } catch (err: any) {
      console.error("Finance error:", err);
      setError("Gagal menyimpan transaksi: " + (err.message || "Izin ditolak"));
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Shield className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Akses Terbatas</h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            Maaf, anda tidak memiliki izin untuk mengakses modul Manajemen Keuangan. 
            Modul ini hanya dapat diakses oleh Owner, Admin, Bendahara, atau Staf Keuangan.
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl text-xs font-bold text-gray-400 uppercase tracking-widest">
            Level Akses Anda: {
              userRole === 'owner' ? 'System Owner' :
              userRole === 'admin' ? 'Administrator' :
              userRole === 'bendahara' ? 'Bendahara GSG' :
              userRole === 'finance' ? 'Administrasi Keuangan' :
              userRole === 'editor' ? 'Editor Konten' : userRole
            }
          </div>
        </div>
      </div>
    );
  }

  // Calculate 7-month stats for chart
  const chartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // Prevent overflow if current day > target month days
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().substring(0, 7);
      const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' });
      
      const monthTxs = transactions.filter(t => t.date.startsWith(monthKey));
      const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
      
      months.push({ name: monthLabel, income, expense });
    }
    return months;
  }, [transactions]);

  // Calculate Category Stats
  const categoryData = useMemo(() => {
    const cats: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'umum';
        cats[cat] = (cats[cat] || 0) + Math.abs(Number(t.amount) || 0);
      });
    
    return Object.entries(cats)
      .map(([name, value]) => ({ name: name.toUpperCase(), value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const COLORS = ['#1E40AF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#6366F1'];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Keuangan</h2>
          <p className="text-gray-500 text-sm mt-1">Laporan arus kas masuk dan keluar gedung.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsRateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
          >
            <Shield className="w-4 h-4 text-accent" />
            Atur % Dana
          </button>
          <button 
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Budget Bulanan
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-primary" />
            PDF
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
          >
            <LayoutGrid className="w-4 h-4 text-emerald-500" />
            Excel/CSV
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <PlusCircle className="w-5 h-5" />
            Catat Transaksi
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-blue-900 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
          <LayoutGrid className="absolute -right-4 -bottom-4 w-40 h-40 text-white/5 rotate-12" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-white/60 mb-1">Total Akumulasi Seluruh Dana GSG</p>
            <h3 className="text-4xl font-extrabold tracking-tight">Rp {(totalDevFund + totalOps).toLocaleString('id-ID')}</h3>
            <div className="mt-8 flex gap-4 text-[10px] font-bold uppercase tracking-widest overflow-x-auto pb-2 scrollbar-none">
              <span className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm whitespace-nowrap">Status: Sinkron</span>
              <span className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full backdrop-blur-sm whitespace-nowrap">Audit Transparan</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-primary/30 transition-all">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dana Operasional (Likuid)</p>
          <h3 className="text-2xl font-black text-gray-900">Rp {Math.floor(totalOps).toLocaleString('id-ID')}</h3>
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Penyerapan Budget</span>
              <span className="text-[10px] font-black text-primary">{Math.min(100, Math.round(budgetProgress))}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, budgetProgress)}%` }}
                className={`h-full ${budgetProgress > 100 ? 'bg-red-500' : 'bg-primary'}`}
               />
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5 font-medium italic">Dana siap pakai harian</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-accent/30 transition-all">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dana Saving (Cadangan)</p>
          <h3 className="text-2xl font-black text-gray-900">Rp {Math.floor(totalDevFund).toLocaleString('id-ID')}</h3>
          <p className="text-[10px] text-accent font-bold mt-2 flex items-center gap-1 italic">
            Prioritas: Renovasi & Darurat
          </p>
        </div>
      </div>

      {/* Charts & Insights Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Arus Kas Bulanan</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Income vs Expense (6 Bulan Terakhir)</p>
            </div>
            <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Keluar</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString()}`, '']}
                />
                <Bar dataKey="income" fill="#1E40AF" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="expense" fill="#F87171" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
        >
          <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-8">Alokasi Biaya Keluar</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{ name: 'EMPTY', value: 1 }]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {categoryData.length === 0 && <Cell fill="#f1f5f9" />}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-gray-400 uppercase leading-none">Total</span>
              <span className="text-lg font-black text-gray-900">Cat.</span>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {categoryData.slice(0, 3).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{cat.name}</span>
                </div>
                <span className="text-[10px] font-black text-gray-900">Rp {cat.value.toLocaleString()}</span>
              </div>
            ))}
            {categoryData.length === 0 && (
              <p className="text-[10px] text-gray-400 text-center italic">Belum ada pengeluaran</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input 
            type="text" 
            placeholder="Cari sumber, keterangan, atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative group">
            <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-sm">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                value={activeType}
                onChange={(e: any) => setActiveType(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer appearance-none pr-4"
              >
                <option value="all">Semua Tipe</option>
                <option value="income">Pendapatan</option>
                <option value="expense">Pengeluaran</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 pointer-events-none" />
            </div>
          </div>

          <div className="relative group">
            <div className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select 
                value={activeMonth}
                onChange={(e: any) => setActiveMonth(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-700 outline-none cursor-pointer appearance-none pr-4"
              >
                <option value="all">Semua Waktu</option>
                {Array.from({ length: 6 }).map((_, i) => {
                  const d = new Date();
                  d.setDate(1); // Prevent overflow
                  d.setMonth(d.getMonth() - i);
                  const val = d.toISOString().substring(0, 7);
                  const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                  return <option key={val} value={val}>{label}</option>;
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Tanggal</th>
                <th className="px-8 py-5">Keterangan</th>
                <th className="px-8 py-5">Total Transaksi</th>
                <th className="px-8 py-5 text-accent text-center">Alokasi Dana Peng.</th>
                <th className="px-8 py-5">Input Oleh</th>
                <th className="px-8 py-5 text-right pr-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.length === 0 ? (
                  <tr key="no-data">
                    <td colSpan={7} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-900">Data Tidak Ditemukan</p>
                        <p className="text-sm text-gray-400">Coba ubah filter atau kata kunci pencarian anda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <motion.tr 
                      key={t.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-gray-50/50 transition-all"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {t.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500" />
                          )}
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${t.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {t.status === 'completed' ? 'SELESAI' : t.status === 'pending' ? 'PENDING' : 'BATAL'}
                          </span>
                          {t.type === 'reallocation' && (
                             <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-1">Transfer</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-gray-700">{t.date}</span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{t.source}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5 bg-gray-100 rounded-md uppercase tracking-wider">
                            {t.category === 'sewa' ? 'Sewa Gedung' : 
                             t.category === 'iuran' ? 'Iuran Warga' :
                             t.category === 'listrik' ? 'Listrik & Air' :
                             t.category === 'perbaikan' ? 'Perbaikan' :
                             t.category === 'peralatan' ? 'Peralatan' :
                             t.category === 'kebersihan' ? 'Kebersihan' :
                             t.category === 'keamanan' ? 'Keamanan' : 'Umum'}
                          </span>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest italic">
                            {t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${t.type === 'income' ? 'text-emerald-500' : t.type === 'reallocation' ? 'text-accent' : 'text-red-500'}`}>
                            {t.type === 'income' ? '• Pemasukan' : t.type === 'reallocation' ? '• Reallokasi' : '• Pengeluaran'}
                          </span>
                        </div>
                        {t.notes && (
                          <p className="text-[10px] text-gray-400 mt-2 italic max-w-md line-clamp-1">"{t.notes}"</p>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-sm font-black ${t.type === 'income' ? 'text-gray-900' : t.type === 'reallocation' ? 'text-accent italic' : 'text-red-500'}`}>
                           {t.type === 'income' ? '+' : t.type === 'reallocation' ? '' : '-'} {t.type === 'reallocation' ? 'PENYESUAIAN' : `Rp ${Math.abs(t.amount).toLocaleString('id-ID')}`}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          {t.devFund !== 0 ? (
                            <div className="flex flex-col items-center">
                              <span className={`${t.devFund > 0 ? 'bg-accent/10 text-accent' : 'bg-red-50 text-accent'} px-3 py-1 rounded-full text-[10px] font-black tracking-tight`}>
                                {t.devFund > 0 ? '+' : ''}Rp {Math.floor(t.devFund).toLocaleString('id-ID')}
                              </span>
                              {t.type === 'income' && (
                                <span className="text-[8px] font-bold text-gray-300 uppercase mt-1">
                                  {t.allocationMode === 'full_dev' ? 'MANUAL 100%' : t.allocationMode === 'full_ops' ? 'MANUAL 0%' : 'AUTO SPLIT'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserIcon className="w-3 h-3 text-gray-400" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 truncate max-w-[100px]">{t.addedBy?.split('@')[0]}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right pr-12">
                        <div className="flex justify-end items-center gap-2">
                          {t.receiptUrl && (
                            <a 
                              href={t.receiptUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-primary bg-blue-50 hover:bg-blue-100 transition-all shadow-sm"
                              title="Lihat Nota/Kwitansi"
                            >
                              <Receipt className="w-4 h-4" />
                            </a>
                          )}
                          <button 
                            onClick={() => handleEdit(t)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-blue-50 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                            title="Edit Transaksi"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteTransaction(t.id, `${t.source} - Rp ${t.amount.toLocaleString()}`)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-xl shadow-2xl relative my-auto overflow-y-auto max-h-[calc(100vh-2rem)] scrollbar-none"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {editingId ? 'Edit Transaksi' : 'Pencatatan Keuangan'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {editingId ? 'Perbarui data arus kas.' : 'Input data arus kas secara akurat.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    source: '',
                    amount: '',
                    type: 'income',
                    category: 'umum',
                    status: 'completed',
                    receiptUrl: '',
                    allocationMode: 'auto',
                    expenseSource: 'ops'
                  });
                }}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {error && (
              <div className="mb-8 p-5 bg-red-50 text-red-600 rounded-[2rem] text-xs font-bold border border-red-100 flex items-start gap-3 animate-pulse">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tipe Transaksi</label>
                <div className="grid grid-cols-3 bg-gray-50 p-1.5 rounded-2xl">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'income'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${formData.type === 'income' ? 'bg-white text-primary shadow-lg shadow-blue-900/5' : 'text-gray-400'}`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Pemasukan
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'expense'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${formData.type === 'expense' ? 'bg-white text-red-500 shadow-lg shadow-red-900/5' : 'text-gray-400'}`}
                  >
                    <X className="w-4 h-4" />
                    Pengeluaran
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'reallocation'})}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${formData.type === 'reallocation' ? 'bg-white text-accent shadow-lg shadow-amber-900/5' : 'text-gray-400'}`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Pindah Dana
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tanggal Transaksi</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nominal (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-black outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kategori</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="sewa">Sewa Gedung</option>
                    <option value="iuran">Iuran Warga</option>
                    <option value="listrik">Listrik & Air</option>
                    <option value="perbaikan">Perbaikan</option>
                    <option value="peralatan">Peralatan</option>
                    <option value="kebersihan">Kebersihan</option>
                    <option value="keamanan">Keamanan</option>
                    <option value="umum">Lainnya / Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    {formData.type === 'income' ? 'Metode Alokasi' : formData.type === 'reallocation' ? 'Arah Pemindahan' : 'Sumber Dana'}
                  </label>
                  <select 
                    value={formData.type === 'income' ? formData.allocationMode : formData.type === 'reallocation' ? formData.transferDirection : formData.expenseSource}
                    onChange={(e) => {
                      if (formData.type === 'income') {
                        setFormData({...formData, allocationMode: e.target.value as any});
                      } else if (formData.type === 'reallocation') {
                        setFormData({...formData, transferDirection: e.target.value as any});
                      } else {
                        setFormData({...formData, expenseSource: e.target.value as any});
                      }
                    }}
                    className={`w-full border rounded-2xl px-5 py-3.5 text-sm font-bold outline-none appearance-none cursor-pointer ${
                      formData.type === 'income' 
                      ? 'bg-blue-50/50 border-blue-100 focus:border-primary' 
                      : formData.type === 'reallocation'
                      ? 'bg-amber-50/50 border-amber-100 focus:border-accent'
                      : 'bg-red-50/50 border-red-100 focus:border-red-400'
                    }`}
                  >
                    {formData.type === 'income' ? (
                      <>
                        <option value="auto">Bagi Otomatis (Rate)</option>
                        <option value="full_ops">100% Operasional</option>
                        <option value="full_dev">100% Pengembangan</option>
                      </>
                    ) : formData.type === 'reallocation' ? (
                      <>
                        <option value="ops_to_dev">Operasional ➔ Pengembangan</option>
                        <option value="dev_to_ops">Pengembangan ➔ Operasional</option>
                      </>
                    ) : (
                      <>
                        <option value="ops">Dana Operasional</option>
                        <option value="dev">Dana Pengembangan</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sumber / Keterangan Singkat</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="Contoh: Sewa Resepsi Pernikahan (Bpk. Ahmad)"
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Metode Pembayaran</label>
                  <select 
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="qris">QRIS / E-Wallet</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                   <p className="text-[9px] text-gray-400 font-bold mb-2 uppercase">Catatan: Pastikan bukti sesuai metode</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Catatan Detil (Opsional)</label>
                <textarea 
                  rows={3}
                  placeholder="Detail tambahan: Garansi, No. Invoice, atau spesifikasi barang..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nota / Kwitansi (Opsional)</label>
                <div className="relative group/upload">
                   <div className={`w-full border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 transition-all ${receiptFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100 bg-gray-50/50 hover:border-primary/20 hover:bg-blue-50/30'}`}>
                      {receiptFile ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <p className="text-xs font-bold text-emerald-700">{receiptFile.name}</p>
                          <button 
                            type="button" 
                            onClick={() => setReceiptFile(null)}
                            className="text-[10px] uppercase font-black text-red-400 hover:text-red-500"
                          >
                            Hapus File
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-300 group-hover/upload:text-primary transition-colors">
                             <Upload className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-gray-900">Upload Bukti Transaksi</p>
                            <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, PDF (Maks. 5MB)</p>
                          </div>
                        </>
                      )}
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setReceiptFile(file);
                        }}
                      />
                   </div>
                </div>
              </div>

              {Number(formData.amount) > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`${formData.type === 'income' ? 'bg-emerald-50 border-emerald-100' : formData.type === 'reallocation' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'} p-6 rounded-[2rem] border`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className={`w-4 h-4 ${formData.type === 'income' ? 'text-emerald-600' : formData.type === 'reallocation' ? 'text-amber-600' : 'text-red-600'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.type === 'income' ? 'text-emerald-600' : formData.type === 'reallocation' ? 'text-amber-600' : 'text-red-600'}`}>
                      {formData.type === 'income' ? 'Simulasi Alokasi' : formData.type === 'reallocation' ? 'Detail Reallokasi' : 'Detail Pengurangan'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {formData.type === 'income' ? (
                      <>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-gray-500 font-medium whitespace-nowrap">Tabungan Renovasi:</span>
                          <span className="font-black text-accent text-sm">
                            Rp {
                              formData.allocationMode === 'full_ops' ? '0' :
                              formData.allocationMode === 'full_dev' ? Number(formData.amount).toLocaleString('id-ID') :
                              (Number(formData.amount) * (config?.devFundRate ?? 0.2)).toLocaleString('id-ID')
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-gray-500 font-medium whitespace-nowrap">Dana Operasional:</span>
                          <span className="font-black text-primary text-sm">
                            Rp {
                              formData.allocationMode === 'full_dev' ? '0' :
                              formData.allocationMode === 'full_ops' ? Number(formData.amount).toLocaleString('id-ID') :
                              (Number(formData.amount) * (1 - (config?.devFundRate ?? 0.2))).toLocaleString('id-ID')
                            }
                          </span>
                        </div>
                      </>
                    ) : formData.type === 'reallocation' ? (
                      <>
                         <div className="flex justify-between text-xs items-center">
                          <span className="text-gray-500 font-medium whitespace-nowrap">Dari Pos:</span>
                          <span className="font-black text-sm text-gray-900 border-b border-gray-200">
                            {formData.transferDirection === 'ops_to_dev' ? 'Dana Operasional' : 'Dana Pengembangan'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-gray-500 font-medium whitespace-nowrap">Ke Pos:</span>
                          <span className="font-black text-sm text-emerald-600">
                             {formData.transferDirection === 'ops_to_dev' ? 'Dana Pengembangan' : 'Dana Operasional'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-500 font-medium whitespace-nowrap">Diambil Dari:</span>
                        <span className={`font-black text-sm ${formData.expenseSource === 'dev' ? 'text-accent' : 'text-primary'}`}>
                          {formData.expenseSource === 'dev' ? 'Dana Pengembangan' : 'Dana Operasional'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={isLoggingIn || isUploadingReceipt}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-900/20 hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isUploadingReceipt ? 'Mengupload Nota...' : isLoggingIn ? 'Memproses...' : editingId ? 'Simpan Perubahan' : 'Simpan Entri Keuangan'}
                </span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Rate Adjust Modal */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Atur Persentase Dana</h3>
                <p className="text-gray-500 text-xs">Persentase alokasi untuk Dana Pengembangan.</p>
              </div>
              <button onClick={() => setIsRateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Dana Pengembangan (%)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-lg font-black outline-none focus:border-accent transition-all"
                    placeholder="20"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-orange-700 font-medium leading-relaxed">
                  Perubahan ini hanya akan berdampak pada transaksi **baru** yang diinput mulai sekarang. Data lama tidak akan terpengaruh secara retrospektif.
                </p>
              </div>

              <button 
                onClick={async () => {
                  const rate = Number(newRate) / 100;
                  if (isNaN(rate) || rate < 0 || rate > 1) {
                    setConfirmConfig({
                      isOpen: true,
                      title: 'Input Tidak Valid',
                      message: 'Persentase harus berada di antara angka 0 hingga 100.',
                      onConfirm: () => {},
                      type: 'danger',
                      isAlert: true
                    });
                    return;
                  }
                  await updateGlobalConfig({ devFundRate: rate });
                  setIsRateModalOpen(false);
                }}
                className="w-full bg-accent text-white py-5 rounded-2xl font-black shadow-xl shadow-amber-900/20 active:scale-[0.98] transition-transform"
              >
                SIMPAN PERUBAHAN
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Monthly Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Set Anggaran Bulanan</h3>
                <p className="text-gray-500 text-xs">Atur batas pengeluaran operasional per bulan.</p>
              </div>
              <button onClick={() => setIsBudgetModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nominal Budget (Rp)</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-lg font-black outline-none focus:border-emerald-500 transition-all"
                    placeholder="5000000"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 font-bold">Rp</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-700 font-medium leading-relaxed">
                  Anggaran ini akan membantu tim keuangan dalam memantau efisiensi penggunaan dana operasional warga.
                </p>
              </div>

              <button 
                onClick={handleUpdateBudget}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-transform"
              >
                SIMPAN ANGGARAN
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        isAlert={confirmConfig.isAlert}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDeleteTransaction}
        title="Hapus Transaksi?"
        message={`Apakah Anda yakin ingin menghapus data transaksi "${confirmModal.transactionInfo}"? Tindakan ini akan mempengaruhi saldo akumulasi dan laporan keuangan warga.`}
      />
    </div>
  );
}
