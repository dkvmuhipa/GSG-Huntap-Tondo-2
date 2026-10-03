import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  AlertCircle, 
  PlusCircle, 
  TrendingUp, 
  CheckCircle2, 
  Upload, 
  Shield,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  CreditCard,
  ArrowRightLeft,
  Sparkles,
  Trash2,
  Tag
} from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  error: string | null;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>> | ((val: any | ((prev: any) => any)) => void);
  allTransactions: any[];
  generateUniqueReceiptNo: (dateStr: string, txsList: any[]) => string;
  formatRupiahInput: (val: string) => string;
  parseRupiahInput: (val: string) => number;
  isInsufficientOps: boolean;
  isInsufficientDev: boolean;
  isBudgetExceeded: boolean;
  availableOps: number;
  availableDevFund: number;
  config: any;
  currentMonthOpsExpense: number;
  isCategoryManuallySelected: boolean;
  setIsCategoryManuallySelected: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean) => void);
  autoSuggestedFromKeyword: any;
  setAutoSuggestedFromKeyword: React.Dispatch<React.SetStateAction<any>> | ((val: any) => void);
  AUTO_CATEGORIES: any[];
  handleSourceChange: (val: string) => void;
  receiptFile: File | null;
  setReceiptFile: React.Dispatch<React.SetStateAction<File | null>> | ((val: File | null) => void);
  isReceiptNoManuallyEdited: boolean;
  setIsReceiptNoManuallyEdited: React.Dispatch<React.SetStateAction<boolean>> | ((val: boolean) => void);
  isLoggingIn: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  editingId,
  error,
  formData,
  setFormData,
  allTransactions,
  generateUniqueReceiptNo,
  formatRupiahInput,
  parseRupiahInput,
  isInsufficientOps,
  isInsufficientDev,
  isBudgetExceeded,
  availableOps,
  availableDevFund,
  config,
  currentMonthOpsExpense,
  isCategoryManuallySelected,
  setIsCategoryManuallySelected,
  autoSuggestedFromKeyword,
  setAutoSuggestedFromKeyword,
  AUTO_CATEGORIES,
  handleSourceChange,
  receiptFile,
  setReceiptFile,
  isReceiptNoManuallyEdited,
  setIsReceiptNoManuallyEdited,
  isLoggingIn,
  handleSubmit
}: TransactionFormModalProps) {
  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inputAmount = parseRupiahInput(formData.amount);

  const getAccentColor = () => {
    if (formData.type === 'income') return 'from-emerald-500 to-teal-600';
    if (formData.type === 'expense') return 'from-rose-500 to-red-600';
    return 'from-amber-500 to-orange-600';
  };

  const getBadgeStyle = () => {
    if (formData.type === 'income') return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    if (formData.type === 'expense') return 'bg-rose-50 text-rose-700 border-rose-200/80';
    return 'bg-amber-50 text-amber-700 border-amber-200/80';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4 overflow-y-auto" id="transaction-form-modal">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative my-auto overflow-y-auto max-h-[calc(100vh-2rem)] scrollbar-none border border-slate-100"
      >
        {/* Dynamic Gradient Top Border */}
        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getAccentColor()}`} />
        
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-6 pt-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getBadgeStyle()}`}>
                {formData.type === 'income' ? 'Arus Masuk' : formData.type === 'expense' ? 'Arus Keluar' : 'Reallokasi'}
              </span>
              <span className="text-[11px] text-slate-400 font-bold">Buku Kas RT 02</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {editingId ? 'Edit Transaksi Keuangan' : 'Pencatatan Transaksi Baru'}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {editingId ? 'Perbarui data catatan kas bendahara.' : 'Input arus kas transparan untuk warga Huntap Tondo 2.'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-200/80 flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-bounce" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Segmented Type Switcher */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 pl-1">
              Pilih Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60 gap-1">
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'income'})}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  formData.type === 'income' 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Pemasukan</span>
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'expense'})}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  formData.type === 'expense' 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Pengeluaran</span>
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, type: 'reallocation'})}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  formData.type === 'reallocation' 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Pindah Dana</span>
              </button>
            </div>
          </div>

          {/* Dates & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1.5 pl-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Tanggal Catat</span>
              </label>
              <input 
                type="date" 
                required
                value={formData.date}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    date: nextDate,
                    receiptNo: !isReceiptNoManuallyEdited 
                      ? generateUniqueReceiptNo(nextDate, allTransactions) 
                      : prev.receiptNo
                  }));
                }}
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1.5 pl-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tgl Acara (Opsional)</span>
              </label>
              <input 
                type="date" 
                value={formData.eventDate || ''}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1.5 pl-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nominal (Rp)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Rp</span>
                <input 
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: formatRupiahInput(e.target.value)})}
                  className={`w-full rounded-2xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-black outline-none transition-all ${
                    isInsufficientOps || isInsufficientDev
                      ? 'border-2 border-red-400 bg-red-50/40 text-red-900 focus:border-red-500'
                      : isBudgetExceeded
                      ? 'border-2 border-amber-400 bg-amber-50/40 text-amber-900 focus:border-amber-500'
                      : 'bg-slate-50/70 border border-slate-200/90 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                  }`}
                />
              </div>
              {isInsufficientOps && (
                <span className="text-[10px] text-red-600 font-extrabold flex items-center gap-1 mt-1 pl-1 shrink-0 animate-pulse">
                  ⚠️ Melebihi Kas Operasional (Rp {Math.floor(availableOps).toLocaleString('id-ID')})
                </span>
              )}
              {isInsufficientDev && (
                <span className="text-[10px] text-red-600 font-extrabold flex items-center gap-1 mt-1 pl-1 shrink-0 animate-pulse">
                  ⚠️ Melebihi Kas Pengembangan (Rp {Math.floor(availableDevFund).toLocaleString('id-ID')})
                </span>
              )}
              {isBudgetExceeded && !isInsufficientOps && (
                <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1 mt-1 pl-1 shrink-0">
                  ⚠️ Over-Budget! (Sisa: Rp {Math.floor((config?.monthlyBudget ?? 0) - currentMonthOpsExpense).toLocaleString('id-ID')})
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex justify-between items-center mb-1.5 pl-1">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kategori</span>
                </label>
                {isCategoryManuallySelected && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryManuallySelected(false);
                      const mockVal = formData.source;
                      const nextFormData = { ...formData };
                      const lower = mockVal.toLowerCase();
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
                      setFormData(nextFormData);
                    }}
                    className="text-[9px] text-primary hover:text-blue-800 font-black flex items-center gap-0.5 tracking-tight uppercase"
                    title="Kembali ke deteksi otomatis"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>AUTO DETEKSI</span>
                  </button>
                )}
              </div>
              <select 
                value={formData.category}
                onChange={(e) => {
                  setFormData({...formData, category: e.target.value});
                  setIsCategoryManuallySelected(true);
                  setAutoSuggestedFromKeyword(null);
                }}
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option value="sewa">Sewa Gedung</option>
                <option value="iuran">Sumbangan</option>
                <option value="listrik">Listrik</option>
                <option value="perbaikan">Perbaikan</option>
                <option value="peralatan">Peralatan</option>
                <option value="kebersihan">Kebersihan & Keamanan</option>
                <option value="umum">Lainnya / Manual</option>
              </select>
              {autoSuggestedFromKeyword && (
                <span className="text-[10px] text-emerald-700 font-black block mt-1.5 pl-1 flex items-center gap-1">
                  ✨ Disarankan: {autoSuggestedFromKeyword.categoryName} <span className="text-slate-400 font-normal font-mono text-[9px]">({autoSuggestedFromKeyword.keyword})</span>
                </span>
              )}
            </div>
            {formData.category === 'umum' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <label className="text-[11px] font-black text-primary uppercase tracking-wider block mb-1.5 pl-1">
                  Sebutkan Kategori Khusus
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Honor Kebersihan Khusus"
                  value={formData.customCategory || ''}
                  onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                  className="w-full bg-blue-50/50 border border-blue-200/90 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </motion.div>
            )}
          </div>

          {/* Source / Description */}
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1.5 pl-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{formData.type === 'income' ? 'Diterima Dari (Nama Penyewa / Pemohon)' : 'Sumber / Keterangan Transaksi'}</span>
              <span className="text-red-500 font-bold">*</span>
            </label>
            <textarea 
              required
              rows={2}
              placeholder={formData.type === 'income' ? 'Contoh: Ibu Rina (Sewa Paket Pernikahan)' : 'Contoh: Pembelian lampu LED & kabel instalasi hall'}
              value={formData.source}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          {/* Organizer details for income */}
          {formData.type === 'income' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1.5 pl-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kategori Penyelenggara</span>
                </label>
                <select 
                  value={formData.organizerType || 'Perorangan / Keluarga'}
                  onChange={(e) => setFormData({...formData, organizerType: e.target.value})}
                  className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                >
                  <option value="Perorangan / Keluarga">Perorangan / Keluarga</option>
                  <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                  <option value="Organisasi Kemasyarakatan / NGO">Organisasi / NGO / Sekolah</option>
                  <option value="Perusahaan Swasta / Komersial">Perusahaan / Komersial</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-1.5 pl-1">
                  Nama Lembaga / Instansi (Opsional)
                </label>
                <input 
                  type="text"
                  placeholder="Contoh: Sanggar Seni Palu"
                  value={formData.organizerName || ''}
                  onChange={(e) => setFormData({...formData, organizerName: e.target.value})}
                  className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          )}

          {/* Direction / Allocation Mode, Method, Receipt No */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1.5 pl-1">
                <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                <span>{formData.type === 'income' ? 'Metode Alokasi' : formData.type === 'reallocation' ? 'Arah Pindah' : 'Sumber Dana'}</span>
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
                className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold outline-none cursor-pointer transition-all ${
                  formData.type === 'income' 
                  ? 'bg-blue-50/60 border-blue-200/80 focus:border-primary' 
                  : formData.type === 'reallocation'
                  ? 'bg-amber-50/60 border-amber-200/80 focus:border-amber-500'
                  : 'bg-rose-50/60 border-rose-200/80 focus:border-rose-500'
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
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1.5 pl-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Metode Bayar</span>
              </label>
              <select 
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              >
                <option value="transfer">Transfer Bank</option>
                <option value="cash">Tunai (Cash)</option>
                <option value="qris">QRIS / E-Wallet</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-1.5 pl-1">
                Nomor Kwitansi
              </label>
              <input 
                type="text"
                value={formData.receiptNo || ''}
                onChange={(e) => {
                  setFormData({...formData, receiptNo: e.target.value});
                  setIsReceiptNoManuallyEdited(true);
                }}
                placeholder="KW/2026/..."
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-1.5 pl-1">
              {formData.type === 'income' ? 'Nama Acara / Tujuan Pemakaian' : 'Catatan Detil (Opsional)'}
              {formData.type === 'income' && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <textarea 
              required={formData.type === 'income'}
              rows={2}
              placeholder={formData.type === 'income' ? 'Contoh: Pentas Seni Siswa / Akad Nikah' : 'Spesifikasi barang, nota toko, nomor garansi...'}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          {/* Proof Upload */}
          <div>
            <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-1.5 pl-1">
              Bukti Nota / Struk Pembayaran (Opsional)
            </label>
            <div className="relative group/upload">
               <div className={`w-full border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 transition-all ${
                 receiptFile 
                   ? 'border-emerald-300 bg-emerald-50/40' 
                   : 'border-slate-200 bg-slate-50/60 hover:border-primary/40 hover:bg-blue-50/30'
               }`}>
                  {receiptFile ? (
                    <div className="flex items-center gap-3 w-full px-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{receiptFile.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{(receiptFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setReceiptFile(null)}
                        className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-colors flex items-center gap-1"
                        title="Hapus file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-xs text-slate-400 group-hover/upload:text-primary transition-colors border border-slate-200/80">
                         <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-800">Klik untuk upload bukti transaksi</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, PDF (Maks. 5MB)</p>
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

          {/* Live Simulation Card */}
          {inputAmount > 0 && (
            <div className="space-y-3">
              <div className={`${
                formData.type === 'income' 
                  ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900' 
                  : formData.type === 'reallocation' 
                  ? 'bg-amber-50/80 border-amber-200/90 text-amber-900' 
                  : (isInsufficientOps || isInsufficientDev)
                  ? 'bg-red-50/80 border-red-200/90 text-red-900'
                  : 'bg-rose-50/80 border-rose-200/90 text-rose-900'
              } p-5 rounded-2xl border shadow-xs`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield className={`w-4 h-4 ${formData.type === 'income' ? 'text-emerald-600' : formData.type === 'reallocation' ? 'text-amber-600' : (isInsufficientOps || isInsufficientDev) ? 'text-red-600' : 'text-rose-600'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${formData.type === 'income' ? 'text-emerald-700' : formData.type === 'reallocation' ? 'text-amber-700' : (isInsufficientOps || isInsufficientDev) ? 'text-red-700' : 'text-rose-700'}`}>
                    {formData.type === 'income' ? 'Simulasi Pembagian Alokasi Dana' : formData.type === 'reallocation' ? 'Rincian Reallokasi Saldo' : 'Rincian Pengurangan Saldo'}
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  {formData.type === 'income' ? (
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                        <span>Model: {formData.allocationMode === 'auto' ? 'Bagi Otomatis (Default)' : formData.allocationMode === 'full_ops' ? '100% Operasional' : '100% Tabungan Renovasi'}</span>
                        <span className="font-mono text-emerald-800 font-extrabold">Total: Rp {inputAmount.toLocaleString('id-ID')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 animate-pulse" />
                          <span>Tabungan Gedung (Saving):</span>
                        </span>
                        <span className="font-black text-accent font-mono text-sm">
                          Rp {Math.floor(formData.allocationMode === 'full_ops' ? 0 : formData.allocationMode === 'full_dev' ? inputAmount : (inputAmount * (config?.devFundRate ?? 0.2))).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-bold flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse" />
                          <span>Kas Operasional:</span>
                        </span>
                        <span className="font-black text-primary font-mono text-sm">
                          Rp {Math.floor(formData.allocationMode === 'full_dev' ? 0 : formData.allocationMode === 'full_ops' ? inputAmount : (inputAmount * (1 - (config?.devFundRate ?? 0.2)))).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner mt-2">
                        {(formData.allocationMode !== 'full_ops') && (
                          <div 
                            style={{ width: `${formData.allocationMode === 'full_dev' ? 100 : (config?.devFundRate ?? 0.2) * 100}%` }}
                            className="bg-accent h-full transition-all duration-300"
                            title="Porsi Tabungan Gedung"
                          />
                        )}
                        {(formData.allocationMode !== 'full_dev') && (
                          <div 
                            style={{ width: `${formData.allocationMode === 'full_ops' ? 100 : (1 - (config?.devFundRate ?? 0.2)) * 100}%` }}
                            className="bg-primary h-full transition-all duration-300"
                            title="Porsi Kas Operasional"
                          />
                        )}
                      </div>
                    </div>
                  ) : formData.type === 'reallocation' ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Asal Saldo:</span>
                        <span className="font-black text-slate-800">
                          {formData.transferDirection === 'ops_to_dev' ? 'Dana Operasional' : 'Dana Pengembangan'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Saldo Tersedia:</span>
                        <span className="font-bold text-slate-700 font-mono">
                          Rp {Math.floor(formData.transferDirection === 'ops_to_dev' ? availableOps : availableDevFund).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-amber-200/60 pt-1.5">
                        <span className="text-slate-600 font-medium">Tujuan Pemindahan:</span>
                        <span className="font-black text-emerald-700">
                          {formData.transferDirection === 'ops_to_dev' ? 'Dana Pengembangan' : 'Dana Operasional'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Diambil Dari:</span>
                        <span className={`font-black ${formData.expenseSource === 'dev' ? 'text-accent' : 'text-primary'}`}>
                          {formData.expenseSource === 'dev' ? 'Dana Pengembangan' : 'Dana Operasional'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Saldo Tersedia:</span>
                        <span className="font-bold text-slate-700 font-mono">
                          Rp {Math.floor(formData.expenseSource === 'dev' ? availableDevFund : availableOps).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition-all order-2 sm:order-1"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isLoggingIn || isInsufficientOps || isInsufficientDev}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-primary hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2 active:scale-[0.99]"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Transaksi</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
