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
  PenTool,
  Settings,
  Percent,
  Target,
  FileSignature,
  Award
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
import PdfPreviewModal from '../../components/ui/PdfPreviewModal';

import { useOutletContext } from 'react-router-dom';

import FinanceCharts from '../../components/admin/finance/FinanceCharts';
import ExportButton from '../../components/admin/finance/ExportButton';
import TransactionTable from '../../components/admin/finance/TransactionTable';
import TransactionFormModal from '../../components/admin/finance/TransactionFormModal';
import AnnualClosingModal from '../../components/admin/finance/AnnualClosingModal';
import { buildAnnualReportDoc } from '../../services/annualReportService';
import { exportTransactionsToExcel } from '../../services/excelExportService';
import { buildKwitansiDoc, buildFinanceReportDoc } from '../../services/financePdfService';
import RateSettingsModal from '../../components/admin/finance/RateSettingsModal';
import BudgetSettingsModal from '../../components/admin/finance/BudgetSettingsModal';
import ReportSignaturesModal from '../../components/admin/finance/ReportSignaturesModal';
import FinanceSummaryCards from '../../components/admin/finance/FinanceSummaryCards';

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
  const bookings = useAppStore(state => state.bookings);
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
  const [isAnnualModalOpen, setIsAnnualModalOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const settingsMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    };
    if (isSettingsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsMenuOpen]);

  // Keyboard Escape listener for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRateModalOpen) setIsRateModalOpen(false);
        if (isBudgetModalOpen) setIsBudgetModalOpen(false);
        if (isReportSettingsModalOpen) setIsReportSettingsModalOpen(false);
        if (isSettingsMenuOpen) setIsSettingsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRateModalOpen, isBudgetModalOpen, isReportSettingsModalOpen, isSettingsMenuOpen]);

                const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isReceiptNoManuallyEdited, setIsReceiptNoManuallyEdited] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense'>('all');
  const [activeMonth, setActiveMonth] = useState('all');
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());
  const [filterMode, setFilterMode] = useState<'monthly' | 'annual' | 'custom'>('monthly');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

  const [pdfPreviewModal, setPdfPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    loadPdf: () => Promise<{ doc: jsPDF; filename: string }>;
  }>({
    isOpen: false,
    title: '',
    loadPdf: async () => ({ doc: new jsPDF(), filename: '' })
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
    } else if (filterMode === 'annual') {
      result = result.filter(t => t.date.startsWith(activeYear));
    } else if (filterMode === 'custom') {
      if (customStartDate) {
        result = result.filter(t => t.date >= customStartDate);
      }
      if (customEndDate) {
        result = result.filter(t => t.date <= customEndDate);
      }
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
  }, [transactions, searchQuery, activeMonth, activeType, filterMode, activeYear, customStartDate, customEndDate]);

  const filteredReportTransactions = useMemo(() => {
    let result = [...allTransactions];
    
    if (activeType !== 'all') {
      result = result.filter(t => t.type === activeType);
    }
    
    if (filterMode === 'monthly') {
      if (activeMonth !== 'all') {
        result = result.filter(t => t.date.startsWith(activeMonth));
      }
    } else if (filterMode === 'annual') {
      result = result.filter(t => t.date.startsWith(activeYear));
    } else if (filterMode === 'custom') {
      if (customStartDate) {
        result = result.filter(t => t.date >= customStartDate);
      }
      if (customEndDate) {
        result = result.filter(t => t.date <= customEndDate);
      }
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
  }, [allTransactions, searchQuery, activeMonth, activeType, filterMode, activeYear, customStartDate, customEndDate]);

  const filteredStats = useMemo(() => {
    const periodTxs = filterMode === 'monthly'
      ? (activeMonth === 'all' ? allTransactions : allTransactions.filter(t => t.date.startsWith(activeMonth)))
      : filterMode === 'annual'
        ? allTransactions.filter(t => t.date.startsWith(activeYear))
        : allTransactions.filter(t => {
            const afterStart = customStartDate ? t.date >= customStartDate : true;
            const beforeEnd = customEndDate ? t.date <= customEndDate : true;
            return afterStart && beforeEnd;
          });
    
    const income = periodTxs.filter(t => t.type === 'income').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const expense = periodTxs.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);
    
    return { income, expense };
  }, [allTransactions, activeMonth, activeYear, filterMode, customStartDate, customEndDate]);

  const downloadKwitansi = async (tx: any) => {
    const { doc, filename } = await buildKwitansiDoc(tx, config);
    doc.save(filename);
  };

  const handlePreviewKwitansi = (tx: any) => {
    setPdfPreviewModal({
      isOpen: true,
      title: `Kwitansi Kasir - ${tx.receiptNo || tx.source}`,
      loadPdf: () => buildKwitansiDoc(tx, config)
    });
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

    const prevMonthLabel = prevDate.toLocaleDateString('id-ID', { month: 'short' });

    const formatDelta = (curr: number, prev: number, isExpense = false) => {
      if (prev === 0 && curr === 0) {
        return {
          text: isExpense ? 'Nihil Pengeluaran' : 'Nihil Pemasukan',
          colorClass: 'text-gray-500 bg-gray-50 border-gray-200/80',
          badgeText: isExpense ? 'Nihil Pengeluaran' : 'Nihil Masukan Bln Ini'
        };
      }
      if (prev === 0 && curr > 0) {
        return {
          text: `Baru bulan ini`,
          colorClass: isExpense ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
          badgeText: isExpense ? `-Rp ${curr.toLocaleString('id-ID')} Terpakai Bln Ini` : `+Rp ${curr.toLocaleString('id-ID')} Bln Ini`
        };
      }
      if (curr === prev) {
        return {
          text: `Sama dgn ${prevMonthLabel}`,
          colorClass: 'text-gray-500 bg-gray-50 border-gray-200/80',
          badgeText: `Sama dgn ${prevMonthLabel}`
        };
      }
      const pct = Math.round(((curr - prev) / prev) * 100);
      if (pct > 0) {
        return {
          text: `▲ +${pct}% vs ${prevMonthLabel}`,
          colorClass: isExpense ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200',
          badgeText: isExpense ? `▲ +${pct}% Beban vs ${prevMonthLabel}` : `▲ +${pct}% Masukan vs ${prevMonthLabel}`
        };
      } else {
        return {
          text: `▼ ${Math.abs(pct)}% vs ${prevMonthLabel}`,
          colorClass: isExpense ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200',
          badgeText: isExpense ? `▼ ${Math.abs(pct)}% Beban vs ${prevMonthLabel}` : `▼ ${Math.abs(pct)}% Masukan vs ${prevMonthLabel}`
        };
      }
    };

    const formatSaving = (curr: number, prev: number) => {
      if (curr === 0) {
        return {
          text: 'Tetap / Stabil',
          colorClass: 'text-gray-500 bg-gray-50 border-gray-200/80'
        };
      }
      if (curr > 0) {
        return {
          text: `+Rp ${curr.toLocaleString('id-ID')} bln ini`,
          colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200'
        };
      }
      return {
        text: `-Rp ${Math.abs(curr).toLocaleString('id-ID')} terpakai`,
        colorClass: 'text-rose-700 bg-rose-50 border-rose-200'
      };
    };

    return {
      income: formatDelta(curIncome, prevIncome, false),
      opsExpense: formatDelta(curOpsExpense, prevOpsExpense, true),
      saving: formatSaving(curSavingAlloc, prevSavingAlloc),
      curIncome,
      prevIncome,
      curOpsExpense,
      prevOpsExpense,
      curSavingAlloc,
      prevSavingAlloc,
      prevMonthLabel
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

  const generateFinanceReport = () => {
    const isFilteredPeriod = (filterMode === 'monthly' && activeMonth !== 'all') || 
                             (filterMode === 'annual') || 
                             (filterMode === 'custom' && (!!customStartDate || !!customEndDate));

    const txsUpToCutoff = allTransactions.filter(t => {
      if (!t.date) return false;
      if (filterMode === 'monthly' && activeMonth !== 'all') return t.date.slice(0, 7) <= activeMonth;
      if (filterMode === 'annual') return t.date.slice(0, 4) <= activeYear;
      if (filterMode === 'custom' && customEndDate) return t.date <= customEndDate;
      return true;
    });

    const periodOps = isFilteredPeriod 
      ? txsUpToCutoff.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0)
      : totalOps;
    const periodDevFund = isFilteredPeriod
      ? txsUpToCutoff.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0)
      : totalDevFund;

    return buildFinanceReportDoc({
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
      totalDevFund: periodDevFund,
      totalOps: periodOps
    });
  };

  const exportToPDF = async () => {
    const { doc, filename } = await generateFinanceReport();
    doc.save(filename);
  };

  const handlePreviewReport = () => {
    setPdfPreviewModal({
      isOpen: true,
      title: 'Laporan Manajemen Keuangan',
      loadPdf: generateFinanceReport
    });
  };

  const handlePreviewAnnualReport = (targetYear?: string) => {
    const yr = targetYear || activeYear || new Date().getFullYear().toString();
    setPdfPreviewModal({
      isOpen: true,
      title: `Laporan Infografis Tutup Buku Tahunan ${yr}`,
      loadPdf: () => buildAnnualReportDoc({
        year: yr,
        transactions: allTransactions,
        bookings: bookings,
        config: config,
        adminProfile: adminProfile
      })
    });
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
      `Dana Cadangan (${Math.round((config?.devFundRate ?? 0.2) * 100)}%)`, 
      `Dana Operasional (${100 - Math.round((config?.devFundRate ?? 0.2) * 100)}%)`,
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
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Ekspor_Keuangan_${periodLabel}${suffix}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    let periodLabel = 'Semua Waktu';
    if (filterMode === 'monthly') {
      periodLabel = activeMonth === 'all' ? 'Semua Bulan' : 
        new Date(parseInt(activeMonth.split('-')[0]), parseInt(activeMonth.split('-')[1]) - 1)
          .toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } else if (filterMode === 'annual') {
      periodLabel = `Tahun ${activeYear}`;
    } else if (filterMode === 'custom') {
      const s = customStartDate ? customStartDate : 'Awal';
      const e = customEndDate ? customEndDate : 'Sekarang';
      periodLabel = `${s} s.d. ${e}`;
    }

    const isFilteredPeriod = (filterMode === 'monthly' && activeMonth !== 'all') || 
                             (filterMode === 'annual') || 
                             (filterMode === 'custom' && (!!customStartDate || !!customEndDate));

    const txsUpToCutoff = allTransactions.filter(t => {
      if (!t.date) return false;
      if (filterMode === 'monthly' && activeMonth !== 'all') return t.date.slice(0, 7) <= activeMonth;
      if (filterMode === 'annual') return t.date.slice(0, 4) <= activeYear;
      if (filterMode === 'custom' && customEndDate) return t.date <= customEndDate;
      return true;
    });

    const periodOps = isFilteredPeriod 
      ? txsUpToCutoff.reduce((acc, curr) => acc + (Number(curr.ops) || 0), 0)
      : totalOps;
    const periodDevFund = isFilteredPeriod
      ? txsUpToCutoff.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0)
      : totalDevFund;

    const reportIncome = filteredReportTransactions
      .filter((t: any) => t.type === 'income')
      .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
    const reportExpense = filteredReportTransactions
      .filter((t: any) => t.type === 'expense')
      .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

    exportTransactionsToExcel(filteredReportTransactions, {
      totalIncome: reportIncome,
      totalExpense: reportExpense,
      netBalance: reportIncome - reportExpense,
      opsBalance: periodOps,
      devBalance: periodDevFund,
      periodLabel
    });
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
      : filterMode === 'annual'
        ? allTransactions.filter(t => t.date.startsWith(activeYear))
        : allTransactions.filter(t => {
            const afterStart = customStartDate ? t.date >= customStartDate : true;
            const beforeEnd = customEndDate ? t.date <= customEndDate : true;
            return afterStart && beforeEnd;
          });
    
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
  }, [allTransactions, activeMonth, activeYear, filterMode, customStartDate, customEndDate]);

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
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'monthly' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setFilterMode('annual')}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'annual' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Tahunan
              </button>
              <button 
                onClick={() => setFilterMode('custom')}
                className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'custom' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Rentang Tanggal
              </button>
            </div>

            {filterMode === 'custom' ? (
              <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-100 px-3.5 py-2 rounded-2xl">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-gray-400">Dari:</span>
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <span className="text-gray-300 font-bold">-</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase text-gray-400">Sampai:</span>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button 
                    type="button"
                    onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors ml-1"
                    title="Reset rentang tanggal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
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
            )}

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
              type="excel"
              onClick={handleExportExcel}
            />

            <ExportButton 
              type="csv"
              onClick={exportToCSV}
            />

            <div className="h-6 w-px bg-gray-100 mx-2 hidden md:block" />

            {/* Dropdown Menu Pengaturan Kas Terpadu */}
            <div className="relative" ref={settingsMenuRef}>
              <button 
                type="button"
                onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-3 bg-gray-50 border border-gray-200/70 rounded-2xl text-xs font-black text-gray-700 hover:bg-gray-100 transition-all uppercase tracking-wider shadow-sm"
                title="Buka Pengaturan Pembukuan Kas"
              >
                <Settings className="w-4 h-4 text-primary" />
                <span>Pengaturan Kas</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isSettingsMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60] overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Opsi Konfigurasi Keuangan
                    </div>

                    <div className="space-y-1 mt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          setIsRateModalOpen(true);
                        }}
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-orange-50/70 text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Percent className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 group-hover:text-orange-950">Alokasi Dana (% Dev/Ops)</p>
                          <p className="text-[10px] text-gray-400 leading-tight">Bagi hasil pembangunan vs operasional</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          setIsBudgetModalOpen(true);
                        }}
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50/70 text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-950">Target Anggaran Bulanan</p>
                          <p className="text-[10px] text-gray-400 leading-tight">Pagu pengeluaran operasional per bulan</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          setIsReportSettingsModalOpen(true);
                        }}
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-indigo-50/70 text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileSignature className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 group-hover:text-indigo-950">Format Laporan & TTD PDF</p>
                          <p className="text-[10px] text-gray-400 leading-tight">Pengurus, tanda tangan & stempel sah</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsSettingsMenuOpen(false);
                          setIsAnnualModalOpen(true);
                        }}
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-purple-50/70 text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 group-hover:text-purple-950">Laporan Tutup Buku Tahunan</p>
                          <p className="text-[10px] text-gray-400 leading-tight">Infografis & rekap 12 bulan eksekutif</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end shrink-0">
          <button 
            type="button"
            onClick={() => setIsAnnualModalOpen(true)}
            className="flex items-center gap-2 px-5 py-4 rounded-3xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-widest transition-all border border-indigo-200/80 shadow-sm active:scale-95"
            title="Laporan Infografis Tutup Buku Tahunan"
          >
            <Award className="w-4 h-4 text-indigo-600" />
            Tutup Buku Tahunan
          </button>
          <ExportButton 
            type="pdf"
            onClick={handlePreviewReport}
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
      <FinanceSummaryCards
        totalDevFund={totalDevFund}
        totalOps={totalOps}
        activeMonth={activeMonth}
        allTransactionsCount={allTransactions.length}
        momDelta={momDelta}
        budgetProgress={budgetProgress}
        currentMonthOpsExpense={currentMonthOpsExpense}
      />

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
        onPreviewKwitansi={handlePreviewKwitansi}
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

      <RateSettingsModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        currentRate={config?.devFundRate ?? 0.2}
        onSave={async (rate) => {
          await updateGlobalConfig({ devFundRate: rate });
        }}
        onErrorAlert={(title, message) => setConfirmConfig({ isOpen: true, title, message, onConfirm: () => {}, type: 'danger', isAlert: true })}
      />

      <BudgetSettingsModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        monthlyBudget={config?.monthlyBudget ?? 5000000}
        onSave={async (budget) => {
          await updateGlobalConfig({ monthlyBudget: budget });
        }}
        onErrorAlert={(title, message) => setConfirmConfig({ isOpen: true, title, message, onConfirm: () => {}, type: 'danger', isAlert: true })}
      />

      <ReportSignaturesModal
        isOpen={isReportSettingsModalOpen}
        onClose={() => setIsReportSettingsModalOpen(false)}
        config={config}
        onSave={async (data) => {
          await updateGlobalConfig(data);
        }}
        onErrorAlert={(title, message) => setConfirmConfig({ isOpen: true, title, message, onConfirm: () => {}, type: 'danger', isAlert: true })}
      />

      <AnnualClosingModal
        isOpen={isAnnualModalOpen}
        onClose={() => setIsAnnualModalOpen(false)}
        onGenerateReport={(yr) => handlePreviewAnnualReport(yr)}
        transactions={allTransactions}
        bookings={bookings}
        initialYear={activeYear}
      />

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

      <PdfPreviewModal
        isOpen={pdfPreviewModal.isOpen}
        onClose={() => setPdfPreviewModal(prev => ({ ...prev, isOpen: false }))}
        title={pdfPreviewModal.title}
        loadPdf={pdfPreviewModal.loadPdf}
      />
    </div>
  );
}
