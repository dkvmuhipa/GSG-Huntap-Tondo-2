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
  Loader,
  Calendar,
  Upload,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  PenTool
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
  addTransaction, 
  updateTransaction, 
  removeTransaction, 
  syncFinanceTotals, 
  updateGlobalConfig
} from '../../lib/db';
import { useAppStore } from '../../store/useAppStore';
import { uploadToCloudinary, getTransparentPNG } from '../../lib/cloudinary';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { auth } from '../../lib/firebase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { terbilang } from '../../services/contractService';

import { useOutletContext } from 'react-router-dom';

import FinanceCharts from '../../components/admin/finance/FinanceCharts';
import ExportButton from '../../components/admin/finance/ExportButton';
import TransactionTable from '../../components/admin/finance/TransactionTable';
import TransactionFormModal from '../../components/admin/finance/TransactionFormModal';

const AUTO_CATEGORIES = [
  {
    category: 'listrik',
    label: 'Listrik',
    keywords: ['listrik', 'pln', 'token', 'pdam', 'air ', 'pam', 'pulsa ']
  },
  {
    category: 'sewa',
    label: 'Sewa Gedung',
    keywords: ['sewa ', 'sewa_gedung', 'booking', 'dp ', 'pelunasan', 'resepsi', 'wedding', 'nikah', 'wisuda', 'acara', 'gedung', 'down payment']
  },
  {
    category: 'iuran',
    label: 'Sumbangan',
    keywords: ['iuran', 'sumbangan', 'donasi', 'sedekah', 'infak', 'zakat', 'celengan', 'asrama', 'bantuan']
  },
  {
    category: 'kebersihan',
    label: 'Kebersihan & Keamanan',
    keywords: ['sapu', 'pel ', 'kemoceng', 'kebersihan', 'keamanan', 'satpam', 'ronda', 'makam', 'poskamling', 'tong sampah', 'sabun', 'detergen', 'wipol', 'pembersih', 'tisue', 'tisu', 'cleaning']
  },
  {
    category: 'perbaikan',
    label: 'Perbaikan',
    keywords: ['cat ', 'renov', 'perbaikan', 'bocor', 'atap', 'genteng', 'tembok', 'semen', 'servis', 'service', 'kunci', 'engsel', 'tukang', 'las ', 'pipa', 'keramik', 'pintu', 'jendela', 'semen', 'batu', 'pasir', 'gagang']
  },
  {
    category: 'peralatan',
    label: 'Peralatan',
    keywords: ['meja', 'kursi', 'sound', 'proyektor', 'ac ', 'kipas', 'peralatan', 'lampu', 'kabel', 'piring', 'gelas', 'mic ', 'speaker', 'infocus', 'baterai', 'steker', 'colokan', 'terminal', 'perkakas', 'mesin']
  }
];

export default function FinanceManager() {
  const { userRole, adminProfile } = useOutletContext<{ userRole: string, adminProfile: any }>();
  const isAuthorized = ['owner', 'admin', 'finance', 'bendahara'].includes(userRole);
  
  const allTransactions = useAppStore(state => state.transactions);
  const config = useAppStore(state => state.config);
  const admins = useAppStore(state => state.admins);
  const [limitCount, setLimitCount] = useState(20);

  const transactions = useMemo(() => {
    return allTransactions.slice(0, limitCount);
  }, [allTransactions, limitCount]);

  const [isMainLoading, setIsMainLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isReportSettingsModalOpen, setIsReportSettingsModalOpen] = useState(false);
  const [localFinanceName, setLocalFinanceName] = useState('');
  const [localBendaharaName, setLocalBendaharaName] = useState('');
  const [localFinanceSig, setLocalFinanceSig] = useState<string | null>(null);
  const [localBendaharaSig, setLocalBendaharaSig] = useState<string | null>(null);
  const [localReceiptSignatureMode, setLocalReceiptSignatureMode] = useState('both');
  const [newRate, setNewRate] = useState('20');
  const [newBudget, setNewBudget] = useState('5000000');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isReceiptNoManuallyEdited, setIsReceiptNoManuallyEdited] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense'>('all');
  const [activeMonth, setActiveMonth] = useState('all');
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
  const [filterMode, setFilterMode] = useState<'monthly' | 'annual'>('monthly');

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

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalMonthKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const generateUniqueReceiptNo = (dateStr: string, txsList: any[]) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const year = parts[0] || new Date().getFullYear().toString();
    const month = parts[1] || String(new Date().getMonth() + 1).padStart(2, '0');
    
    let seq = 1;
    let receiptNo = '';
    let isUnique = false;
    
    while (!isUnique) {
      receiptNo = `KW/${year}/${month}/${String(seq).padStart(3, '0')}`;
      const exists = txsList.some(t => t.receiptNo === receiptNo && t.id !== editingId);
      if (!exists) {
        isUnique = true;
      } else {
        seq++;
      }
    }
    return receiptNo;
  };

  const displayCategory = (cat: string) => {
    const map: { [key: string]: string } = {
      'sewa': 'Sewa Gedung',
      'iuran': 'Sumbangan',
      'listrik': 'Listrik',
      'perbaikan': 'Perbaikan',
      'peralatan': 'Peralatan',
      'kebersihan': 'Kebersihan & Keamanan',
      'keamanan': 'Kebersihan & Keamanan',
      'umum': 'Lainnya'
    };
    return map[cat] || cat;
  };

  const formatRupiahInput = (value: string) => {
    const clean = String(value || '').replace(/\D/g, '');
    if (!clean) return '';
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseRupiahInput = (value: string) => {
    const clean = String(value || '').replace(/\D/g, '');
    return Number(clean) || 0;
  };

  const [formData, setFormData] = useState({
    date: getLocalMonthKey(new Date()) + '-' + String(new Date().getDate()).padStart(2, '0'),
    eventDate: '',
    source: '',
    amount: '',
    type: 'income' as 'income' | 'expense' | 'reallocation',
    category: 'umum',
    customCategory: '',
    paymentMethod: 'transfer' as 'cash' | 'transfer' | 'qris',
    notes: '',
    status: 'completed',
    receiptUrl: '',
    allocationMode: 'auto' as 'auto' | 'full_ops' | 'full_dev',
    expenseSource: 'ops' as 'ops' | 'dev',
    transferDirection: 'ops_to_dev' as 'ops_to_dev' | 'dev_to_ops',
    receiptNo: '',
    organizerType: 'Perorangan / Keluarga',
    organizerName: ''
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const [isCategoryManuallySelected, setIsCategoryManuallySelected] = useState(false);
  const [autoSuggestedFromKeyword, setAutoSuggestedFromKeyword] = useState<{
    keyword: string;
    categoryName: string;
    categoryId: string;
  } | null>(null);

  const handleSourceChange = (val: string) => {
    setFormData(prev => {
      const nextFormData = { ...prev, source: val };
      
      if (!isCategoryManuallySelected) {
        const lower = val.toLowerCase();
        let matched = false;
        
        for (const item of AUTO_CATEGORIES) {
          for (const kw of item.keywords) {
            if (lower.includes(kw)) {
              nextFormData.category = item.category;
              setAutoSuggestedFromKeyword({
                keyword: kw,
                categoryName: item.label,
                categoryId: item.category
              });
              matched = true;
              break;
            }
          }
          if (matched) break;
        }
        
        if (!matched) {
          nextFormData.category = 'umum';
          setAutoSuggestedFromKeyword(null);
        }
      }
      
      return nextFormData;
    });
  };

  // Sync transactions cache for offline resilience
  useEffect(() => {
    if (allTransactions.length > 0) {
      localStorage.setItem('gsg_all_transactions_cache', JSON.stringify(allTransactions));
    }
  }, [allTransactions]);

  useEffect(() => {
    if (config?.devFundRate) {
      setNewRate((config.devFundRate * 100).toString());
    }
    if (config?.monthlyBudget) {
      setNewBudget(config.monthlyBudget.toString());
    }
    if (config) {
      setLocalFinanceName(config.reportFinanceName || '');
      setLocalBendaharaName(config.reportBendaharaName || '');
      setLocalFinanceSig(config.reportFinanceSignature || null);
      setLocalBendaharaSig(config.reportBendaharaSignature || null);
      setLocalReceiptSignatureMode(config.receiptSignatureMode || 'both');
    }
  }, [config]);

  // Sync totals using all transactions to prevent overwriting with partial/limited data
  useEffect(() => {
    if (allTransactions.length > 0) {
      syncFinanceTotals(allTransactions);
    }
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    if (activeType !== 'all') {
      result = result.filter(t => t.type === activeType);
    }
    
    if (filterMode === 'monthly') {
      if (activeMonth !== 'all') {
        result = result.filter(t => t.date.startsWith(activeMonth));
      }
    } else {
      result = result.filter(t => t.date.startsWith(activeYear));
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.source?.toLowerCase().includes(lower) || 
        t.category?.toLowerCase().includes(lower) ||
        t.addedBy?.toLowerCase().includes(lower)
      );
    }

    return result.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [transactions, searchQuery, activeMonth, activeType, filterMode, activeYear]);

  const filteredReportTransactions = useMemo(() => {
    let result = [...allTransactions];
    
    if (activeType !== 'all') {
      result = result.filter(t => t.type === activeType);
    }
    
    if (filterMode === 'monthly') {
      if (activeMonth !== 'all') {
        result = result.filter(t => t.date.startsWith(activeMonth));
      }
    } else {
      result = result.filter(t => t.date.startsWith(activeYear));
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.source?.toLowerCase().includes(lower) || 
        t.category?.toLowerCase().includes(lower) ||
        t.addedBy?.toLowerCase().includes(lower)
      );
    }

    return result.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [allTransactions, searchQuery, activeMonth, activeType, filterMode, activeYear]);

  const filteredStats = useMemo(() => {
    const periodTxs = filterMode === 'monthly'
      ? (activeMonth === 'all' ? allTransactions : allTransactions.filter(t => t.date.startsWith(activeMonth)))
      : allTransactions.filter(t => t.date.startsWith(activeYear));
    
    const income = periodTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const expense = periodTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
    
    return { income, expense };
  }, [allTransactions, activeMonth, activeYear, filterMode]);

  const downloadKwitansi = async (tx: any) => {
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

    const pageWidth = doc.internal.pageSize.width;
    
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
      } catch (e) {
        eventDateText = tx.eventDate;
      }
    } else {
      try {
        eventDateText = new Date(tx.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' (Sesuai Transaksi)';
      } catch (e) {
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
    doc.save(`Kwitansi_${receiptNameStr}_${tx.source.replace(/\s+/g, '_')}.pdf`);
  };

  const exportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Sumber/Tujuan', 'Jumlah', 'Catatan'];
    const rows = filteredTransactions.length > 0 
      ? filteredTransactions.map(t => [
          t.id,
          t.date,
          t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
          displayCategory(t.category),
          t.source,
          t.amount,
          t.notes || ''
        ])
      : [
          [
            '-',
            '-',
            'Laporan Nihil',
            '-',
            'Tidak ada aktivitas transaksi pada periode ini (Nihil)',
            '0',
            '-'
          ]
        ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_Gedung_Serbaguna_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rate = config?.devFundRate ?? 0.2;
  const totalIncome = allTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpense = allTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const totalDevFund = allTransactions.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0);
  const totalOps = allTransactions.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0);

  const currentMonthKey = getLocalMonthKey(new Date());
  const reportMonthKey = activeMonth === 'all' ? currentMonthKey : activeMonth;
  const currentMonthOpsExpense = allTransactions
    .filter(t => t.date.startsWith(reportMonthKey) && t.type === 'expense' && t.expenseSource === 'ops')
    .reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
  
  const budgetProgress = config?.monthlyBudget ? (currentMonthOpsExpense / config.monthlyBudget) * 100 : 0;

  // Real-time Balance Checking and Budget Warning variables
  const originalTx = editingId ? allTransactions.find(t => t.id === editingId) : null;
  const originalOps = originalTx ? (Number(originalTx.ops) || 0) : 0;
  const originalDevFund = originalTx ? (Number(originalTx.devFund) || 0) : 0;

  const availableOps = totalOps - originalOps;
  const availableDevFund = totalDevFund - originalDevFund;

  const inputAmount = parseRupiahInput(formData.amount);

  const isInsufficientOps = (formData.type === 'expense' && formData.expenseSource === 'ops' && inputAmount > availableOps) ||
                            (formData.type === 'reallocation' && formData.transferDirection === 'ops_to_dev' && inputAmount > availableOps);

  const isInsufficientDev = (formData.type === 'expense' && formData.expenseSource === 'dev' && inputAmount > availableDevFund) ||
                            (formData.type === 'reallocation' && formData.transferDirection === 'dev_to_ops' && inputAmount > availableDevFund);

  const isBudgetExceeded = useMemo(() => {
    if (formData.type !== 'expense' || formData.expenseSource !== 'ops' || !config?.monthlyBudget) return false;
    
    const txMonth = formData.date.substring(0, 7);
    const existingMonthOpsExpense = allTransactions
      .filter(t => t.date.startsWith(txMonth) && t.type === 'expense' && t.expenseSource === 'ops' && t.id !== editingId)
      .reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
      
    return (existingMonthOpsExpense + inputAmount) > config.monthlyBudget;
  }, [formData.type, formData.expenseSource, formData.date, formData.amount, config?.monthlyBudget, allTransactions, editingId]);

  // Month-over-Month Delta Calculation for financial stat cards
  const momDelta = useMemo(() => {
    let currentKey = activeMonth;
    if (currentKey === 'all') {
      currentKey = new Date().toISOString().substring(0, 7);
    }

    const [yearStr, monthStr] = currentKey.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const curDate = new Date(year, month - 1, 1);
    const prevDate = new Date(year, month - 1, 1);
    prevDate.setMonth(prevDate.getMonth() - 1);

    const curMonthKey = curDate.toISOString().substring(0, 7);
    const prevMonthKey = prevDate.toISOString().substring(0, 7);

    const curTxs = allTransactions.filter(t => t.date.startsWith(curMonthKey));
    const prevTxs = allTransactions.filter(t => t.date.startsWith(prevMonthKey));

    // Calculate total incomes
    const curIncome = curTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Calculate operational expenses
    const curOpsExpense = curTxs.filter(t => t.type === 'expense' && t.expenseSource === 'ops').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
    const prevOpsExpense = prevTxs.filter(t => t.type === 'expense' && t.expenseSource === 'ops').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);

    // Calculate saving additions (accumulated from devFund portions)
    const curSavingAlloc = curTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.devFund) || 0), 0) + 
                           curTxs.filter(t => t.type === 'reallocation' && t.transferDirection === 'ops_to_dev').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) -
                           curTxs.filter(t => t.type === 'reallocation' && t.transferDirection === 'dev_to_ops').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
                           
    const prevSavingAlloc = prevTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.devFund) || 0), 0) + 
                            prevTxs.filter(t => t.type === 'reallocation' && t.transferDirection === 'ops_to_dev').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) -
                            prevTxs.filter(t => t.type === 'reallocation' && t.transferDirection === 'dev_to_ops').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const calculatePct = (curr: number, prev: number) => {
      if (prev === 0) {
        return curr > 0 ? 100 : 0;
      }
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      incomePct: calculatePct(curIncome, prevIncome),
      curIncome,
      prevIncome,
      opsExpensePct: calculatePct(curOpsExpense, prevOpsExpense),
      curOpsExpense,
      prevOpsExpense,
      savingPct: calculatePct(curSavingAlloc, prevSavingAlloc),
      curSavingAlloc,
      prevSavingAlloc,
      prevMonthLabel: prevDate.toLocaleDateString('id-ID', { month: 'short' })
    };
  }, [allTransactions, activeMonth]);

  const handleEdit = (tx: any) => {
    setEditingId(tx.id);
    const isFixed = ['sewa', 'iuran', 'listrik', 'perbaikan', 'peralatan', 'kebersihan', 'keamanan', 'umum'].includes(tx.category);
    
    setIsCategoryManuallySelected(true);
    setAutoSuggestedFromKeyword(null);

    setFormData({
      date: tx.date,
      eventDate: tx.eventDate || '',
      source: tx.source,
      amount: formatRupiahInput(Math.abs(tx.amount).toString()),
      type: tx.type,
      category: isFixed ? tx.category : 'umum',
      customCategory: isFixed ? '' : tx.category,
      paymentMethod: tx.paymentMethod || 'transfer',
      notes: tx.notes || '',
      status: tx.status || 'completed',
      receiptUrl: tx.receiptUrl || '',
      allocationMode: tx.allocationMode || 'auto',
      expenseSource: tx.expenseSource || 'ops',
      transferDirection: tx.transferDirection || 'ops_to_dev',
      receiptNo: tx.receiptNo || generateUniqueReceiptNo(tx.date, allTransactions),
      organizerType: tx.organizerType || 'Perorangan / Keluarga',
      organizerName: tx.organizerName || ''
    });
    setIsReceiptNoManuallyEdited(!!tx.receiptNo);
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

  const [dragActiveFinance, setDragActiveFinance] = useState(false);
  const [dragActiveBendahara, setDragActiveBendahara] = useState(false);

  const handleSignatureUpload = (file: File, type: 'finance' | 'bendahara') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (type === 'finance') {
        setLocalFinanceSig(base64);
      } else {
        setLocalBendaharaSig(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveReportSettings = async () => {
    try {
      await updateGlobalConfig({
        reportFinanceName: localFinanceName,
        reportBendaharaName: localBendaharaName,
        reportFinanceSignature: localFinanceSig,
        reportBendaharaSignature: localBendaharaSig,
        receiptSignatureMode: localReceiptSignatureMode
      });
      setIsReportSettingsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const exportToPDF = async () => {
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

        if (activeMonth !== 'all') {
          const [year, month] = activeMonth.split('-');
          const mDate = new Date(parseInt(year), parseInt(month) - 1);
          const monthName = mDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(`PERIODE: ${monthName.toUpperCase()}`, margin, 40);
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

    // Section 1: Ringkasan Saldo
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. RINGKASAN SALDO KAS TERSEDIA', margin, 62);

    const currentRate = (config?.devFundRate ?? 0.2) * 100;
    
    autoTable(doc, {
      startY: 68,
      margin: { left: margin, right: margin, bottom: 20 },
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
    doc.text('* Dana Operasional: Siap digunakan untuk kebutuhan rutin harian. Dana Saving: Dialokasikan khusus untuk pengembangan fisik atau dana darurat.', margin, noteY);

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

    const pdfDisplayCategory = (cat: string) => {
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
      return map[cat] || cat?.toUpperCase() || 'UMUM';
    };

    const tableData = sortedTransactions.length > 0 
      ? sortedTransactions.map((t, index) => [
          index + 1,
          t.date.split('-').reverse().join('/'), 
          t.source,
          pdfDisplayCategory(t.category),
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
    if (activeMonth !== 'all') {
      const [year, month] = activeMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      recapTitle += ` (${monthName.toUpperCase()})`;
    }
    doc.text(recapTitle, margin + 5, finalRecapY + 2);

    const periodIncome = sortedTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const periodExpense = sortedTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
    
    // Initial balance (Balance before the period start)
    const allTxsSorted = [...allTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
    const finalBalance = activeMonth !== 'all' ? (initialBalance + periodIncome - periodExpense) : (totalDevFund + totalOps);
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
        // Positioned centrally in the blank space
        doc.addImage(bendaharaSig, 'PNG', rightSigX - 15, sigY + 8, 30, 16);
      } catch (e) {
        console.error("Failed to add Bendahara digital signature:", e);
      }
    }

    // Draw Stamp if available
    if (stampImg) {
      try {
        // Overlapping the bendahara signature beautifully
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

    const periodLabel = activeMonth === 'all' ? 'Semua_Waktu' : 
      new Date(parseInt(activeMonth.split('-')[0]), parseInt(activeMonth.split('-')[1]) - 1)
        .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).replace(/\s+/g, '_');

    const suffix = sortedTransactions.length === 0 ? '_Nihil' : '';
    doc.save(`Laporan_Keuangan_${periodLabel}${suffix}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
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

    const sortedTransactions = [...filteredReportTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB; // Ascending
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

    // Handle display of categories matching app settings
    const csvDisplayCategory = (cat: string) => {
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
      return map[cat] || cat?.toUpperCase() || 'UMUM';
    };

    const rows = sortedTransactions.length > 0
      ? sortedTransactions.map((t) => [
          t.id,
          t.date.split('-').reverse().join('/'),
          t.source,
          csvDisplayCategory(t.category),
          t.paymentMethod === 'cash' ? 'TUNAI' : t.paymentMethod === 'qris' ? 'QRIS' : 'TRANSFER',
          t.type === 'income' ? 'PEMASUKAN' : t.type === 'reallocation' ? 'REALLOKASI' : 'PENGELUARAN',
          t.amount || 0,
          t.devFund || 0,
          t.ops || 0,
          t.addedBy || 'Sistem',
          t.status === 'completed' ? 'SELESAI' : t.status === 'pending' ? 'PENDING' : 'BATAL',
          t.notes || '-'
        ])
      : [
          [
            '-',
            '-',
            'Tidak ada aktivitas transaksi pada periode ini (Laporan Nihil)',
            'NIHIL',
            '-',
            'NIHIL',
            0,
            0,
            0,
            'Sistem',
            'SELESAI',
            'Laporan Nihil'
          ]
        ];

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

    const suffix = sortedTransactions.length === 0 ? '_Nihil' : '';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Ekspor_Keuangan_${periodLabel}${suffix}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseRupiahInput(formData.amount);
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
        finalAmount = 0; // Net zero for the whole building
        if (formData.transferDirection === 'ops_to_dev') {
          ops = -amount;
          devFund = amount;
        } else {
          ops = amount;
          devFund = -amount;
        }
      }

      if (editingId) {
        const { category, customCategory, ...rest } = formData;
        const finalCategory = category === 'umum' && customCategory.trim() ? customCategory : category;

        await updateTransaction(editingId, {
          ...rest,
          category: finalCategory,
          receiptUrl: finalReceiptUrl,
          amount: finalAmount,
          devFund,
          ops
        });
      } else {
        const { category, customCategory, ...rest } = formData;
        const finalCategory = category === 'umum' && customCategory.trim() ? customCategory : category;

        await addTransaction({
          ...rest,
          category: finalCategory,
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
      setIsCategoryManuallySelected(false);
      setAutoSuggestedFromKeyword(null);
      setFormData({
        date: getLocalDateString(new Date()),
        eventDate: '',
        source: '',
        amount: '',
        type: 'income',
        category: 'umum',
        customCategory: '',
        paymentMethod: 'transfer',
        notes: '',
        status: 'completed',
        receiptUrl: '',
        allocationMode: 'auto',
        expenseSource: 'ops',
        transferDirection: 'ops_to_dev',
        receiptNo: '',
        organizerType: 'Perorangan / Keluarga',
        organizerName: ''
      });
      setIsReceiptNoManuallyEdited(false);
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
            Modul ini hanya dapat diakses oleh Owner, Admin, Bendahara, atau Administrasi Keuangan.
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl text-xs font-bold text-gray-400 uppercase tracking-widest">
            Level Akses Anda: {
              userRole === 'owner' ? 'System Owner' :
              userRole === 'admin' ? 'Administrator' :
              userRole === 'bendahara' ? 'Bendahara Gedung Serbaguna' :
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
    const baseDate = filterMode === 'monthly' 
      ? (activeMonth === 'all' ? new Date() : new Date(activeMonth + '-05'))
      : new Date(activeYear + '-06-01');
    
    const count = filterMode === 'monthly' ? 5 : 11;
    
    for (let i = count; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      
      // If annual, we strictly filter for the target year
      if (filterMode === 'annual' && d.getFullYear().toString() !== activeYear) continue;

      const monthKey = d.toISOString().substring(0, 7);
      const monthLabel = d.toLocaleDateString('id-ID', { month: 'short' });
      
      const monthTxs = allTransactions.filter(t => t.date.startsWith(monthKey));
      const income = monthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const expense = monthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0);
      
      months.push({ name: monthLabel, income, expense });
    }
    return months;
  }, [allTransactions, activeMonth, activeYear, filterMode]);


  // Calculate Category Stats
  const categoryData = useMemo(() => {
    const cats: { [key: string]: number } = {};
    const targetTxs = filterMode === 'monthly'
      ? (activeMonth === 'all' ? allTransactions : allTransactions.filter(t => t.date.startsWith(activeMonth)))
      : allTransactions.filter(t => t.date.startsWith(activeYear));
    
    targetTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'umum';
        const displayName = displayCategory(cat).toUpperCase();
        cats[displayName] = (cats[displayName] || 0) + Math.abs(Number(t.amount) || 0);
      });
    
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allTransactions, activeMonth, activeYear, filterMode]);

  const COLORS = ['#1E40AF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#6366F1'];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex-1">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Manajemen Keuangan</h2>
          <p className="text-gray-500 text-sm mt-1">Audit arus kas masuk, pengeluaran & tabungan aset warga.</p>
          
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 p-1 rounded-2xl">
              <button 
                onClick={() => setFilterMode('monthly')}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'monthly' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setFilterMode('annual')}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'annual' ? 'bg-white text-primary shadow-sm' : 'text-gray-400'}`}
              >
                Tahunan
              </button>
            </div>

            <div className="relative group">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl">
                <Calendar className="w-4 h-4 text-gray-400" />
                {filterMode === 'monthly' ? (
                  <select 
                    value={activeMonth}
                    onChange={(e: any) => setActiveMonth(e.target.value)}
                    className="bg-transparent border-none text-xs font-black text-gray-700 outline-none cursor-pointer appearance-none pr-6 uppercase tracking-widest"
                  >
                    <option value="all">SEMUA BULAN</option>
                    {Array.from({ length: 24 }).map((_, i) => {
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
                    className="bg-transparent border-none text-xs font-black text-gray-700 outline-none cursor-pointer appearance-none pr-6 uppercase tracking-widest"
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const year = (new Date().getFullYear() - i).toString();
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                )}
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 pointer-events-none" />
              </div>
            </div>

            <div className="relative group">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  value={activeType}
                  onChange={(e: any) => setActiveType(e.target.value)}
                  className="bg-transparent border-none text-xs font-black text-gray-700 outline-none cursor-pointer appearance-none pr-6 uppercase tracking-widest"
                >
                  <option value="all">SEMUA ARUS</option>
                  <option value="income">PENDAPATAN</option>
                  <option value="expense">PENGELUARAN</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 pointer-events-none" />
              </div>
            </div>

            <ExportButton 
              type="csv"
              onClick={exportToCSV}
            />

            <div className="h-6 w-px bg-gray-100 mx-2 hidden md:block" />

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsRateModalOpen(true)}
                className="p-3 bg-gray-50 text-accent rounded-xl hover:bg-orange-50 transition-colors"
                title="Atur % Dana"
              >
                <Shield className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsBudgetModalOpen(true)}
                className="p-3 bg-gray-50 text-emerald-500 rounded-xl hover:bg-emerald-50 transition-colors"
                title="Budget Bulanan"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsReportSettingsModalOpen(true)}
                className="p-3 bg-gray-50 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors"
                title="Laporan PDF & Tanda Tangan"
              >
                <PenTool className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end shrink-0">
          <ExportButton 
            type="pdf"
            onClick={exportToPDF}
          />
          <button 
            onClick={() => {
              setIsCategoryManuallySelected(false);
              setAutoSuggestedFromKeyword(null);
              const initialDate = getLocalDateString(new Date());
              setFormData({
                date: initialDate,
                eventDate: '',
                source: '',
                amount: '',
                type: 'income',
                category: 'umum',
                customCategory: '',
                paymentMethod: 'transfer',
                notes: '',
                status: 'completed',
                receiptUrl: '',
                allocationMode: 'auto',
                expenseSource: 'ops',
                transferDirection: 'ops_to_dev',
                receiptNo: generateUniqueReceiptNo(initialDate, allTransactions),
                organizerType: 'Perorangan / Keluarga',
                organizerName: ''
              });
              setIsReceiptNoManuallyEdited(false);
              setIsModalOpen(true);
            }}
            className="bg-primary text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Catat Keuangan
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
            <p className="text-sm font-medium text-white/60 mb-1">Total Akumulasi Seluruh Dana Gedung</p>
            <h3 className="text-4xl font-extrabold tracking-tight">Rp {(totalDevFund + totalOps).toLocaleString('id-ID')}</h3>
            <div className="mt-8 flex flex-wrap gap-2.5 text-[10px] font-bold uppercase tracking-widest">
              <span className={`px-4.5 py-2 rounded-full backdrop-blur-sm whitespace-nowrap border ${momDelta.incomePct >= 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                {momDelta.incomePct >= 0 ? '▲ +' : '▼ '}{momDelta.incomePct}% Pendapatan vs {momDelta.prevMonthLabel}
              </span>
              <span className="bg-white/10 text-white/90 px-4.5 py-2 rounded-full backdrop-blur-sm whitespace-nowrap border border-white/5">
                Audit Transparan
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-primary/30 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dana Operasional (Likuid)</p>
            <h3 className="text-2xl font-black text-gray-900">Rp {Math.floor(totalOps).toLocaleString('id-ID')}</h3>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Penyerapan Budget {activeMonth !== 'all' ? activeMonth : ''}
              </span>
              <span className="text-[10px] font-black text-primary">{Math.min(100, Math.round(budgetProgress))}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, budgetProgress)}%` }}
                className={`h-full ${budgetProgress > 100 ? 'bg-red-500' : 'bg-primary'}`}
               />
            </div>
            <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-gray-50">
              <span className="text-[9px] text-gray-400 font-medium italic">Siap pakai harian</span>
              <span className={`text-[10px] font-black flex items-center gap-0.5 uppercase tracking-tight ${
                momDelta.opsExpensePct > 0 
                  ? 'text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md' 
                  : momDelta.opsExpensePct < 0 
                  ? 'text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md' 
                  : 'text-gray-400'
              }`}>
                {momDelta.opsExpensePct > 0 ? '▲ +' : momDelta.opsExpensePct < 0 ? '▼ ' : '• '}{momDelta.opsExpensePct}% MoM ({momDelta.prevMonthLabel})
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-accent/30 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dana Saving (Cadangan)</p>
            <h3 className="text-2xl font-black text-gray-900">Rp {Math.floor(totalDevFund).toLocaleString('id-ID')}</h3>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-center mt-2 pt-2.5 border-t border-gray-100">
              <p className="text-[10px] text-accent font-bold flex items-center gap-1 italic">
                Saran: Renovasi/Darurat
              </p>
              <span className={`text-[10px] font-black flex items-center gap-0.5 uppercase tracking-tight ${
                momDelta.savingPct >= 0 
                  ? 'text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md' 
                  : 'text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md'
              }`}>
                {momDelta.savingPct >= 0 ? '▲ +' : '▼ '}{momDelta.savingPct}% Saving vs {momDelta.prevMonthLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Insights Section */}
      <FinanceCharts 
        chartData={chartData}
        categoryData={categoryData}
        COLORS={COLORS}
      />

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
        
        <div className="flex items-center gap-4 px-6 border-l border-gray-100 hidden lg:flex">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aktivitas {activeMonth === 'all' ? 'Total' : 'Bulan Ini'}</p>
            <div className="flex items-center gap-3">
               <span className="text-xs font-black text-emerald-500">+{filteredStats.income.toLocaleString()}</span>
               <span className="text-xs font-black text-red-500">-{filteredStats.expense.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <TransactionTable 
        filteredTransactions={filteredTransactions}
        allTransactions={allTransactions}
        transactions={transactions}
        displayCategory={displayCategory}
        downloadKwitansi={downloadKwitansi}
        handleEdit={handleEdit}
        handleDeleteTransaction={handleDeleteTransaction}
        isLoadingMore={isLoadingMore}
        limitCount={limitCount}
        setLimitCount={setLimitCount}
      />

      {/* Modal Form */}
      <TransactionFormModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setIsCategoryManuallySelected(false);
          setAutoSuggestedFromKeyword(null);
          setFormData({
            date: getLocalDateString(new Date()),
            eventDate: '',
            source: '',
            amount: '',
            type: 'income',
            category: 'umum',
            customCategory: '',
            paymentMethod: 'transfer',
            notes: '',
            status: 'completed',
            receiptUrl: '',
            allocationMode: 'auto',
            expenseSource: 'ops',
            transferDirection: 'ops_to_dev',
            receiptNo: '',
            organizerType: 'Perorangan / Keluarga',
            organizerName: ''
          });
          setIsReceiptNoManuallyEdited(false);
          setReceiptFile(null);
        }}
        editingId={editingId}
        error={error}
        formData={formData}
        setFormData={setFormData}
        allTransactions={allTransactions}
        generateUniqueReceiptNo={generateUniqueReceiptNo}
        formatRupiahInput={formatRupiahInput}
        parseRupiahInput={parseRupiahInput}
        isInsufficientOps={isInsufficientOps}
        isInsufficientDev={isInsufficientDev}
        isBudgetExceeded={isBudgetExceeded}
        availableOps={availableOps}
        availableDevFund={availableDevFund}
        config={config}
        currentMonthOpsExpense={currentMonthOpsExpense}
        isCategoryManuallySelected={isCategoryManuallySelected}
        setIsCategoryManuallySelected={setIsCategoryManuallySelected}
        autoSuggestedFromKeyword={autoSuggestedFromKeyword}
        setAutoSuggestedFromKeyword={setAutoSuggestedFromKeyword}
        AUTO_CATEGORIES={AUTO_CATEGORIES}
        handleSourceChange={handleSourceChange}
        receiptFile={receiptFile}
        setReceiptFile={setReceiptFile}
        isReceiptNoManuallyEdited={isReceiptNoManuallyEdited}
        setIsReceiptNoManuallyEdited={setIsReceiptNoManuallyEdited}
        isLoggingIn={isLoggingIn}
        handleSubmit={handleSubmit}
      />

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

      {/* Report PDF & Digital Signature Settings Modal */}
      {isReportSettingsModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl overflow-hidden relative my-8"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Pengaturan Laporan & Tanda Tangan</h3>
                <p className="text-gray-500 text-xs mt-1">Sesuaikan nama penandatangan dan sematkan gambar tanda tangan digital transparan pada PDF laporan bulanan.</p>
              </div>
              <button onClick={() => setIsReportSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Administrasi Keuangan block */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] bg-indigo-55 text-indigo-700 font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase">Pihak 1 (Pembuat Laporan)</span>
                    <h4 className="text-xs font-black text-gray-400 mt-2 uppercase tracking-wide">Administrasi Keuangan</h4>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Pegawai Keuangan</label>
                    <input 
                      type="text"
                      value={localFinanceName}
                      onChange={(e) => setLocalFinanceName(e.target.value)}
                      placeholder="Contoh: Safira S.Ak."
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tanda Tangan Digital (Transparan)</label>
                    
                    {localFinanceSig ? (
                      <div className="relative border border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col items-center justify-center">
                        <img 
                          src={localFinanceSig} 
                          alt="Tanda Tangan Administrasi"
                          className="max-h-24 object-contain mb-3 bg-white border border-gray-100 p-2 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setLocalFinanceSig(null)}
                          className="text-[10px] text-red-500 hover:text-red-700 font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                        >
                          Hapus Tanda Tangan
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setDragActiveFinance(true); }}
                        onDragLeave={() => setDragActiveFinance(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActiveFinance(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleSignatureUpload(file, 'finance');
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          dragActiveFinance ? 'border-indigo-500 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-400 bg-gray-50'
                        }`}
                        onClick={() => document.getElementById('financeSigInput')?.click()}
                      >
                        <Upload className="w-5 h-5 text-gray-400 mb-2" />
                        <span className="text-xs font-black text-gray-700">Pilih atau Tarik Gambar</span>
                        <span className="text-[9px] text-gray-400 mt-1">PNG Transparan direkomendasikan</span>
                        <input 
                          id="financeSigInput"
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSignatureUpload(file, 'finance');
                          }}
                          className="hidden" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bendahara block */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] bg-emerald-55 text-emerald-700 font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase">Pihak 2 (Mengetahui)</span>
                    <h4 className="text-xs font-black text-gray-400 mt-2 uppercase tracking-wide">Bendahara / Ketua RT</h4>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 font-sans">Nama Bendahara / Ketua RT</label>
                    <input 
                      type="text"
                      value={localBendaharaName}
                      onChange={(e) => setLocalBendaharaName(e.target.value)}
                      placeholder="Contoh: Bpk. H. Ahmad Fauzi"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold outline-none focus:border-indigo-500 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tanda Tangan Digital (Transparan)</label>
                    
                    {localBendaharaSig ? (
                      <div className="relative border border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col items-center justify-center">
                        <img 
                          src={localBendaharaSig} 
                          alt="Tanda Tangan Bendahara"
                          className="max-h-24 object-contain mb-3 bg-white border border-gray-100 p-2 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setLocalBendaharaSig(null)}
                          className="text-[10px] text-red-500 hover:text-red-700 font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                        >
                          Hapus Tanda Tangan
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragOver={(e) => { e.preventDefault(); setDragActiveBendahara(true); }}
                        onDragLeave={() => setDragActiveBendahara(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActiveBendahara(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleSignatureUpload(file, 'bendahara');
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          dragActiveBendahara ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-200 hover:border-emerald-400 bg-gray-50'
                        }`}
                        onClick={() => document.getElementById('bendaharaSigInput')?.click()}
                      >
                        <Upload className="w-5 h-5 text-gray-400 mb-2" />
                        <span className="text-xs font-black text-gray-700">Pilih atau Tarik Gambar</span>
                        <span className="text-[9px] text-gray-400 mt-1">PNG Transparan direkomendasikan</span>
                        <input 
                          id="bendaharaSigInput"
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSignatureUpload(file, 'bendahara');
                          }}
                          className="hidden" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Pilihan Tanda Tangan pada Kuitansi / Kwitansi PDF
                </label>
                <select 
                  value={localReceiptSignatureMode}
                  onChange={(e) => setLocalReceiptSignatureMode(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:border-indigo-500 transition-all text-xs cursor-pointer"
                >
                  <option value="both">Tampilkan Keduanya (Administrasi Keuangan & Bendahara)</option>
                  <option value="finance">Tampilkan Administrasi Keuangan Saja</option>
                  <option value="bendahara">Tampilkan Bendahara Saja</option>
                </select>
              </div>

              <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 text-[10px] text-indigo-700 font-medium leading-relaxed">
                💡 <span className="font-bold">Tips Transparansi:</span> Menggunakan gambar tanda tangan digital berlatar belakang transparan (PNG) akan memberikan tampilan paling tajam dan presisi pada cetakan PDF laporan tanpa menutupi batas garis stempel laporan fisik.
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setIsReportSettingsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black active:scale-[0.98] transition-transform text-xs uppercase"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveReportSettings}
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-900/10 active:scale-[0.98] transition-transform text-xs uppercase"
                >
                  Simpan Pengaturan
                </button>
              </div>
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
