import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Receipt, TrendingUp } from 'lucide-react';

interface FinanceSummaryCardsProps {
  totalDevFund: number;
  totalOps: number;
  activeMonth: string;
  allTransactionsCount: number;
  momDelta: {
    curIncome: number;
    prevIncome: number;
    income: { badgeText: string };
    opsExpense: { colorClass: string; badgeText: string };
    curSavingAlloc: number;
    saving: { colorClass: string; text: string };
  };
  budgetProgress: number;
  currentMonthOpsExpense: number;
}

export default function FinanceSummaryCards({
  totalDevFund,
  totalOps,
  activeMonth,
  allTransactionsCount,
  momDelta,
  budgetProgress,
  currentMonthOpsExpense
}: FinanceSummaryCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Total Saldo Card (Span 2) */}
      <div className="md:col-span-2 bg-gradient-to-br from-blue-900 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-white/60 mb-1">Total Akumulasi Seluruh Dana Gedung</p>
          <h3 className="text-4xl font-extrabold tracking-tight">
            Rp {(totalDevFund + totalOps).toLocaleString('id-ID')}
          </h3>
          <div className="mt-8 flex flex-wrap gap-2.5 text-[10px] font-bold uppercase tracking-widest">
            <span
              className={`px-4.5 py-2 rounded-full backdrop-blur-sm whitespace-nowrap border ${
                activeMonth === 'all'
                  ? 'bg-white/10 text-white/90 border-white/10'
                  : momDelta.curIncome > momDelta.prevIncome
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : momDelta.curIncome < momDelta.prevIncome && momDelta.prevIncome > 0
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-white/10 text-white/90 border-white/10'
              }`}
            >
              {activeMonth === 'all'
                ? (allTransactionsCount > 0 ? `${allTransactionsCount} Transaksi Tercatat` : 'Belum Ada Transaksi')
                : momDelta.income.badgeText}
            </span>
            <span className="bg-white/10 text-white/90 px-4.5 py-2 rounded-full backdrop-blur-sm whitespace-nowrap border border-white/5">
              Audit Transparan
            </span>
          </div>
        </div>
      </div>

      {/* Dana Operasional (Likuid) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-primary/30 transition-colors flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dana Operasional (Likuid)</p>
          <h3 className="text-2xl font-black text-gray-900">
            Rp {Math.floor(totalOps).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Penyerapan Anggaran {activeMonth !== 'all' ? `(${new Date(activeMonth + '-01').toLocaleDateString('id-ID', { month: 'short' })})` : '(Bulan Ini)'}
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
            <span className={`text-[10px] font-bold flex items-center gap-1 tracking-tight px-2.5 py-0.5 rounded-lg border ${
              activeMonth === 'all'
                ? (currentMonthOpsExpense > 0 
                    ? 'text-amber-700 bg-amber-50 border-amber-200' 
                    : 'text-gray-500 bg-gray-50 border-gray-200/80')
                : momDelta.opsExpense.colorClass
            }`}>
              {activeMonth === 'all'
                ? (currentMonthOpsExpense > 0 
                    ? `-Rp ${currentMonthOpsExpense.toLocaleString('id-ID')} Bln Ini` 
                    : 'Nihil Beban Bln Ini')
                : momDelta.opsExpense.badgeText}
            </span>
          </div>
        </div>
      </div>

      {/* Dana Cadangan (Pengembangan) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-accent/30 transition-colors flex flex-col justify-between">
        <div>
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dana Cadangan (Pengembangan)</p>
          <h3 className="text-2xl font-black text-gray-900">
            Rp {Math.floor(totalDevFund).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mt-2 pt-2.5 border-t border-gray-100">
            <p className="text-[10px] text-accent font-bold flex items-center gap-1 italic">
              Saran: Renovasi/Darurat
            </p>
            <span className={`text-[10px] font-bold flex items-center gap-1 tracking-tight px-2.5 py-0.5 rounded-lg border ${
              activeMonth === 'all'
                ? (momDelta.curSavingAlloc > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-gray-500 bg-gray-50 border-gray-200/80')
                : momDelta.saving.colorClass
            }`}>
              {activeMonth === 'all'
                ? (momDelta.curSavingAlloc > 0 ? `+Rp ${momDelta.curSavingAlloc.toLocaleString('id-ID')} Bln Ini` : 'Tetap / Stabil')
                : momDelta.saving.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
