import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

interface RateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRate: number; // Decimal (e.g. 0.2 for 20%)
  onSave: (newRateDecimal: number) => Promise<void>;
  onErrorAlert: (title: string, message: string) => void;
}

export default function RateSettingsModal({
  isOpen,
  onClose,
  currentRate,
  onSave,
  onErrorAlert
}: RateSettingsModalProps) {
  const [newRate, setNewRate] = useState<string>('20');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewRate(Math.round((currentRate ?? 0.2) * 100).toString());
    }
  }, [isOpen, currentRate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const rate = Number(newRate) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) {
      onErrorAlert('Input Tidak Valid', 'Persentase harus berada di antara angka 0 hingga 100.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(rate);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="flex justify-between items-start mb-5 pt-1">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 inline-block mb-1.5">
              Kebijakan Kas RT 02
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Atur Persentase Dana</h3>
            <p className="text-slate-500 text-xs mt-0.5">Persentase alokasi otomatis untuk Dana Pengembangan / Renovasi.</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>
        
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 pl-1">
              Porsi Dana Pengembangan (%)
            </label>
            <div className="relative">
              <input 
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl pl-4 pr-12 py-3.5 text-lg font-black text-slate-900 font-mono outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                placeholder="20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm bg-slate-200/70 px-2 py-0.5 rounded-lg">%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 pl-1">Sisa persentase otomatis dialokasikan ke Dana Operasional.</p>
          </div>

          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              Perubahan rasio ini hanya akan berlaku pada transaksi <strong className="text-amber-950">baru</strong> yang dicatat. Riwayat transaksi terdahulu tetap dipertahankan keabsahan nilainya.
            </p>
          </div>

          <div className="flex gap-2.5 pt-1">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
