import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, X } from 'lucide-react';

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyBudget: number;
  onSave: (newBudget: number) => Promise<void>;
  onErrorAlert: (title: string, message: string) => void;
}

export default function BudgetSettingsModal({
  isOpen,
  onClose,
  monthlyBudget,
  onSave,
  onErrorAlert
}: BudgetSettingsModalProps) {
  const [newBudget, setNewBudget] = useState<string>('5000000');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewBudget((monthlyBudget ?? 5000000).toString());
    }
  }, [isOpen, monthlyBudget]);

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
    const val = Number(newBudget);
    if (isNaN(val) || val < 0) {
      onErrorAlert('Input Tidak Valid', 'Nominal anggaran harus berupa angka positif.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(val);
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
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="flex justify-between items-start mb-5 pt-1">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-block mb-1.5">
              Batas Anggaran
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Set Plafon Anggaran</h3>
            <p className="text-slate-500 text-xs mt-0.5">Batas aman pengeluaran operasional per bulan.</p>
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
              Nominal Anggaran Bulanan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
              <input 
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-full bg-slate-50/70 border border-slate-200/90 rounded-2xl pl-12 pr-4 py-3.5 text-lg font-black text-slate-900 font-mono outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                placeholder="5000000"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 pl-1">Target pengeluaran operasional rutin gedung.</p>
          </div>

          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 flex items-start gap-3 shadow-xs">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              Plafon anggaran ini akan memandu bendahara mendeteksi peringatan bila pengeluaran bulanan melampaui batas wajar.
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Anggaran'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
