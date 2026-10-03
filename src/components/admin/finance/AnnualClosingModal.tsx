import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  FileText, 
  Award, 
  Layers, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface AnnualClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (year: string) => void;
  transactions: any[];
  bookings: any[];
  initialYear?: string;
}

export default function AnnualClosingModal({
  isOpen,
  onClose,
  onGenerateReport,
  transactions,
  bookings,
  initialYear
}: AnnualClosingModalProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(
    initialYear || currentYear.toString()
  );

  // Available years from transactions or default last 5 years
  const availableYears = useMemo(() => {
    const yearSet = new Set<string>();
    yearSet.add(currentYear.toString());
    yearSet.add((currentYear - 1).toString());

    transactions.forEach(t => {
      if (t.date && t.date.length >= 4) {
        yearSet.add(t.date.substring(0, 4));
      }
    });

    bookings.forEach(b => {
      if (b.startDate && b.startDate.length >= 4) {
        yearSet.add(b.startDate.substring(0, 4));
      }
    });

    return Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
  }, [transactions, bookings, currentYear]);

  // Quick summary for selected year
  const yearSummary = useMemo(() => {
    const yearTxs = transactions.filter(t => t.date && t.date.startsWith(selectedYear));
    const yearBookings = bookings.filter(b => 
      b.startDate && 
      b.startDate.startsWith(selectedYear) && 
      (b.status === 'approved' || b.status === 'completed')
    );

    const income = yearTxs
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const expense = yearTxs
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + Math.abs(Number(curr.amount) || 0), 0);

    const net = income - expense;
    const savingGrowth = yearTxs.reduce((acc, curr) => acc + (Number(curr.devFund) || 0), 0);

    return {
      eventsCount: yearBookings.length,
      income,
      expense,
      net,
      savingGrowth
    };
  }, [transactions, bookings, selectedYear]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-6 sm:p-8 z-10 overflow-hidden"
        >
          {/* Header Accent */}
          <div className="flex items-start justify-between pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  Tutup Buku & Laporan Tahunan
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Rekapitulasi resmi 12 bulan untuk pertanggungjawaban warga & RT/RW
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="py-6 space-y-6">
            {/* Year Selector */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                Pilih Tahun Anggaran Buku
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl pl-11 pr-10 py-3.5 text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>
                      Tahun Anggaran {yr} {yr === currentYear.toString() ? '(Tahun Berjalan)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Pratinjau Kinerja Tahun {selectedYear}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {yearSummary.eventsCount} Kegiatan Terlaksana
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Total Pemasukan</p>
                  <p className="text-base sm:text-lg font-black text-emerald-700 mt-1">
                    Rp {Math.round(yearSummary.income).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Total Pengeluaran</p>
                  <p className="text-base sm:text-lg font-black text-rose-700 mt-1">
                    Rp {Math.round(yearSummary.expense).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <p className="text-[10px] font-black text-primary uppercase tracking-wider">Surplus / (Defisit)</p>
                  <p className={`text-base sm:text-lg font-black mt-1 ${yearSummary.net >= 0 ? 'text-primary' : 'text-rose-600'}`}>
                    Rp {Math.round(yearSummary.net).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Akumulasi Saving 20%</p>
                  <p className="text-base sm:text-lg font-black text-purple-700 mt-1">
                    Rp {Math.round(yearSummary.savingGrowth).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Infographic Features List */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Isi Dokumen Laporan Tutup Buku:
              </p>
              <ul className="text-[11px] text-gray-500 space-y-1 list-disc list-inside">
                <li>Kartu Skor Kinerja Eksekutif & Statistik Utilisasi Gedung</li>
                <li>Tabel Rekapitulasi Rinci Arus Kas 12 Bulan (Januari - Desember)</li>
                <li>Analisis Posisi & Komposisi Pengeluaran Operasional (PLN, Kebersihan, Fisik)</li>
                <li>Neraca Saldo Akhir Kas & Kantong Dana (*Saving vs Operasional*)</li>
                <li>Tanda Tangan Sah Pengurus, Cap Stempel Resmi & QR Code Verifikasi</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGenerateReport(selectedYear);
              }}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4" />
              Buka Pratinjau Laporan Tutup Buku
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
