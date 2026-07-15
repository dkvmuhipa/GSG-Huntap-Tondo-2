import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  AlertCircle, 
  PlusCircle, 
  TrendingUp, 
  CheckCircle2, 
  Upload, 
  Shield 
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
  if (!isOpen) return null;

  const inputAmount = parseRupiahInput(formData.amount);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto" id="transaction-form-modal">
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
            onClick={onClose}
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

          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tanggal Transaksi</label>
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
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tanggal Kegiatan/Acara (Opsional)</label>
              <input 
                type="date" 
                value={formData.eventDate || ''}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nominal (Rp)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                <input 
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: formatRupiahInput(e.target.value)})}
                  className={`w-full border rounded-2xl pl-12 pr-5 py-3.5 text-sm font-black outline-none transition-all ${
                    isInsufficientOps || isInsufficientDev
                      ? 'border-red-300 bg-red-50/20 focus:border-red-500'
                      : isBudgetExceeded
                      ? 'border-amber-300 bg-amber-50/20 focus:border-amber-500'
                      : 'bg-gray-50 border-gray-100 focus:border-emerald-500'
                  }`}
                />
              </div>
              {isInsufficientOps && (
                <span className="text-[10px] text-red-600 font-extrabold flex items-center gap-1 mt-1.5 pl-1 shrink-0 animate-pulse">
                  ⚠️ Melebihi Kas Operasional (Rp {Math.floor(availableOps).toLocaleString('id-ID')})
                </span>
              )}
              {isInsufficientDev && (
                <span className="text-[10px] text-red-600 font-extrabold flex items-center gap-1 mt-1.5 pl-1 shrink-0 animate-pulse">
                  ⚠️ Melebihi Kas Pengembangan (Rp {Math.floor(availableDevFund).toLocaleString('id-ID')})
                </span>
              )}
              {isBudgetExceeded && !isInsufficientOps && (
                <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1 mt-1.5 pl-1 shrink-0">
                  ⚠️ Over-Budget Bulanan! (Sisa plafon: Rp {Math.floor((config?.monthlyBudget ?? 0) - currentMonthOpsExpense).toLocaleString('id-ID')})
                </span>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
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
                    title="Klik untuk kembali menggunakan pencocokan otomatis berdasarkan kolom uraian"
                  >
                    ✨ AUTO DETEKSI
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
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary appearance-none cursor-pointer"
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
                <span className="text-[10px] text-emerald-600 font-black block mt-2 animate-bounce flex items-center gap-1 pl-1">
                  🪄 Disarankan otomatis: {autoSuggestedFromKeyword.categoryName} <span className="text-gray-400 font-medium font-mono text-[9px]">({autoSuggestedFromKeyword.keyword})</span>
                </span>
              )}
            </div>
            {formData.category === 'umum' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <label className="block text-[10px] font-black text-primary uppercase tracking-widest mb-3">Sebutkan Kategori Lainnya</label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Honor Staf"
                  value={formData.customCategory || ''}
                  onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                  className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all"
                />
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              {formData.type === 'income' ? 'Diterima Dari (Nama Penyewa / Pemohon)' : 'Sumber / Keterangan Singkat'}
            </label>
            <textarea 
              required
              rows={2}
              placeholder={formData.type === 'income' ? 'Contoh: Chintiya' : 'Contoh: Pembelian Alat Kebersihan'}
              value={formData.source}
              onChange={(e) => handleSourceChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          {formData.type === 'income' && (
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Kategori Penyelenggara</label>
                <select 
                  value={formData.organizerType || 'Perorangan / Keluarga'}
                  onChange={(e) => setFormData({...formData, organizerType: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="Perorangan / Keluarga">Perorangan / Keluarga</option>
                  <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                  <option value="Organisasi Kemasyarakatan / NGO">Organisasi / NGO / Sekolah</option>
                  <option value="Perusahaan Swasta / Komersial">Perusahaan / Komersial</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nama Penyelenggara / Instansi (Opsional)</label>
                <input 
                  type="text"
                  placeholder="Contoh: OSIS SMAN 5 Palu"
                  value={formData.organizerName || ''}
                  onChange={(e) => setFormData({...formData, organizerName: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all"
                />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-5">
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
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Nomor Kwitansi</label>
              <input 
                type="text"
                value={formData.receiptNo || ''}
                onChange={(e) => {
                  setFormData({...formData, receiptNo: e.target.value});
                  setIsReceiptNoManuallyEdited(true);
                }}
                placeholder="Contoh: KW/2026/07/001"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:border-primary transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
              {formData.type === 'income' ? 'Untuk Keperluan (Nama Acara/Kegiatan)' : 'Catatan Detil (Opsional)'}
            </label>
            <textarea 
              required={formData.type === 'income'}
              rows={3}
              placeholder={formData.type === 'income' ? 'Contoh: Pentas Seni Budaya / Rapat Koordinasi' : 'Detail tambahan: Garansi, No. Invoice, atau spesifikasi barang...'}
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

          {inputAmount > 0 && (
            <div className="space-y-3">
              <div className={`${
                formData.type === 'income' 
                  ? 'bg-emerald-50 border-emerald-150 text-emerald-900' 
                  : formData.type === 'reallocation' 
                  ? 'bg-amber-50 border-amber-150 text-amber-900' 
                  : (isInsufficientOps || isInsufficientDev)
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-rose-50 border-rose-150 text-rose-900'
              } p-6 rounded-[2rem] border`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Shield className={`w-4 h-4 ${formData.type === 'income' ? 'text-emerald-600' : formData.type === 'reallocation' ? 'text-amber-600' : (isInsufficientOps || isInsufficientDev) ? 'text-red-600' : 'text-rose-600'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${formData.type === 'income' ? 'text-emerald-600' : formData.type === 'reallocation' ? 'text-amber-600' : (isInsufficientOps || isInsufficientDev) ? 'text-red-600' : 'text-rose-600'}`}>
                    {formData.type === 'income' ? 'Simulasi Alokasi' : formData.type === 'reallocation' ? 'Detail Reallokasi' : 'Detail Pengurangan'}
                  </span>
                </div>
                <div className="space-y-3">
                  {formData.type === 'income' ? (
                    <div className="space-y-3.5 pt-1">
                      <div className="text-[10px] font-black tracking-widest uppercase text-emerald-800/60 flex items-center justify-between border-b border-emerald-150 pb-2 mb-1.5">
                        <span>Estimasi Alokasi Dana</span>
                        <span>{formData.allocationMode === 'auto' ? 'Bagi Otomatis' : formData.allocationMode === 'full_ops' ? '100% Ops' : '100% Saving'}</span>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-gray-600 font-bold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 animate-pulse" />
                            Tabungan Renovasi (Saving):
                          </span>
                          <span className="font-black text-accent text-sm">
                            Rp {Math.floor(formData.allocationMode === 'full_ops' ? 0 : formData.allocationMode === 'full_dev' ? inputAmount : (inputAmount * (config?.devFundRate ?? 0.2))).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-medium pl-4 mt-0.5">
                          <span>Porsi {formData.allocationMode === 'full_ops' ? 0 : formData.allocationMode === 'full_dev' ? 100 : Math.round((config?.devFundRate ?? 0.2) * 100)}%</span>
                          <span>Penyelamatan Gedung</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs items-center">
                          <span className="text-gray-600 font-bold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse" />
                            Dana Operasional:
                          </span>
                          <span className="font-black text-primary text-sm">
                            Rp {Math.floor(formData.allocationMode === 'full_dev' ? 0 : formData.allocationMode === 'full_ops' ? inputAmount : (inputAmount * (1 - (config?.devFundRate ?? 0.2)))).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-medium pl-4 mt-0.5">
                          <span>Porsi {formData.allocationMode === 'full_dev' ? 0 : formData.allocationMode === 'full_ops' ? 100 : (100 - Math.round((config?.devFundRate ?? 0.2) * 100))}%</span>
                          <span>Kebutuhan Harian</span>
                        </div>
                      </div>

                      <div className="h-3 bg-gray-200/60 rounded-full overflow-hidden flex shadow-inner mt-2">
                        {(formData.allocationMode !== 'full_ops') && (
                          <div 
                            style={{ width: `${formData.allocationMode === 'full_dev' ? 100 : (config?.devFundRate ?? 0.2) * 100}%` }}
                            className="bg-accent h-full transition-all duration-500 ease-out"
                          />
                        )}
                        {(formData.allocationMode !== 'full_dev') && (
                          <div 
                            style={{ width: `${formData.allocationMode === 'full_ops' ? 100 : (1 - (config?.devFundRate ?? 0.2)) * 100}%` }}
                            className="bg-primary h-full transition-all duration-500 ease-out"
                          />
                        )}
                      </div>
                    </div>
                  ) : formData.type === 'reallocation' ? (
                    <>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-500 font-medium whitespace-nowrap">Dari Pos:</span>
                        <span className="font-black text-sm text-gray-900 border-b border-gray-200">
                          {formData.transferDirection === 'ops_to_dev' ? 'Dana Operasional' : 'Dana Pengembangan'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-500 font-medium whitespace-nowrap">Saldo Tersedia:</span>
                        <span className="font-extrabold text-xs text-gray-700">
                          Rp {Math.floor(formData.transferDirection === 'ops_to_dev' ? availableOps : availableDevFund).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-500 font-medium whitespace-nowrap">Ke Pos:</span>
                        <span className="font-black text-xs text-emerald-600">
                          {formData.transferDirection === 'ops_to_dev' ? 'Dana Pengembangan' : 'Dana Operasional'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-500 font-medium whitespace-nowrap">Diambil Dari:</span>
                        <span className={`font-black text-sm ${formData.expenseSource === 'dev' ? 'text-accent' : 'text-primary'}`}>
                          {formData.expenseSource === 'dev' ? 'Dana Pengembangan' : 'Dana Operasional'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-gray-500 font-medium whitespace-nowrap">Saldo Tersedia:</span>
                        <span className="font-extrabold text-xs text-gray-700">
                          Rp {Math.floor(formData.expenseSource === 'dev' ? availableDevFund : availableOps).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-8 rounded-3xl bg-gray-50 hover:bg-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest transition-all"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isLoggingIn || isInsufficientOps || isInsufficientDev}
              className="flex-1 py-4 px-8 rounded-3xl bg-primary hover:bg-blue-800 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
