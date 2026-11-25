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
    <div className="grid md:grid-cols-4 gap-5">
      {/* Total Saldo Card (Span 2) */}
      <div className="md:col-span-2 bg-[#171717] p-6 sm:p-7 rounded-xl text-white border border-[#171717] flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-5">
            <Wallet className="w-5 h-5 text-[#93C5FD]" strokeWidth={1.75} />
          </div>
          <p className="text-xs font-medium text-[#A1A1AA] mb-1">Total akumulasi seluruh dana gedung</p>
          <h3 className="text-3xl sm:text-4xl font-mono tabular-nums font-semibold tracking-tight text-white">
            Rp {(totalDevFund + totalOps).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
          <span
            className={`px-3 py-1 rounded-md whitespace-nowrap border font-mono tabular-nums ${
              activeMonth === 'all'
                ? 'bg-white/10 text-[#E4E4E7] border-white/10'
                : momDelta.curIncome > momDelta.prevIncome
                ? 'bg-[#16A34A]/20 text-[#86EFAC] border-[#16A34A]/30'
                : momDelta.curIncome < momDelta.prevIncome && momDelta.prevIncome > 0
                ? 'bg-[#DC2626]/20 text-[#FCA5A5] border-[#DC2626]/30'
                : 'bg-white/10 text-[#E4E4E7] border-white/10'
            }`}
          >
            {activeMonth === 'all'
              ? (allTransactionsCount > 0 ? `${allTransactionsCount} Transaksi tercatat` : 'Belum ada transaksi')
              : momDelta.income.badgeText}
          </span>
          <span className="bg-white/10 text-[#D4D4D8] px-3 py-1 rounded-md whitespace-nowrap border border-white/10">
            Audit transparan
          </span>
        </div>
      </div>

      {/* Dana Operasional (Likuid) */}
      <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] hover:border-[#1E40AF]/40 transition-colors flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-lg flex items-center justify-center mb-4">
            <Receipt className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <p className="text-xs font-medium text-[#737373] mb-1">Dana Operasional (Likuid)</p>
          <h3 className="text-2xl font-mono tabular-nums font-semibold text-[#171717]">
            Rp {Math.floor(totalOps).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-medium text-[#737373]">
              Penyerapan anggaran {activeMonth !== 'all' ? `(${new Date(activeMonth + '-01').toLocaleDateString('id-ID', { month: 'short' })})` : '(bulan ini)'}
            </span>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-[#1E40AF]">{Math.min(100, Math.round(budgetProgress))}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, budgetProgress)}%` }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${budgetProgress > 100 ? 'bg-[#DC2626]' : 'bg-[#1E40AF]'}`}
            />
          </div>
          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[#E4E4E7]">
            <span className="text-[11px] text-[#737373]">Siap pakai harian</span>
            <span className={`text-[11px] font-mono tabular-nums font-medium flex items-center gap-1 px-2 py-0.5 rounded-md border ${
              activeMonth === 'all'
                ? (currentMonthOpsExpense > 0 
                    ? 'text-[#B45309] bg-[#FFFBEB] border-[#FDE68A]' 
                    : 'text-[#525252] bg-[#F4F4F5] border-[#E4E4E7]')
                : momDelta.opsExpense.colorClass
            }`}>
              {activeMonth === 'all'
                ? (currentMonthOpsExpense > 0 
                    ? `-Rp ${currentMonthOpsExpense.toLocaleString('id-ID')} bln ini` 
                    : 'Nihil beban bln ini')
                : momDelta.opsExpense.badgeText}
            </span>
          </div>
        </div>
      </div>

      {/* Dana Cadangan (Pengembangan) */}
      <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] hover:border-[#1E40AF]/40 transition-colors flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <p className="text-xs font-medium text-[#737373] mb-1">Dana Cadangan (Pengembangan)</p>
          <h3 className="text-2xl font-mono tabular-nums font-semibold text-[#171717]">
            Rp {Math.floor(totalDevFund).toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="mt-4">
          <div className="flex justify-between items-center mt-2 pt-2.5 border-t border-[#E4E4E7]">
            <p className="text-[11px] text-[#525252] font-medium flex items-center gap-1">
              Alokasi renovasi aset
            </p>
            <span className={`text-[11px] font-mono tabular-nums font-medium flex items-center gap-1 px-2 py-0.5 rounded-md border ${
              activeMonth === 'all'
                ? (momDelta.curSavingAlloc > 0 ? 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]' : 'text-[#525252] bg-[#F4F4F5] border-[#E4E4E7]')
                : momDelta.saving.colorClass
            }`}>
              {activeMonth === 'all'
                ? (momDelta.curSavingAlloc > 0 ? `+Rp ${momDelta.curSavingAlloc.toLocaleString('id-ID')} bln ini` : 'Tetap / Stabil')
                : momDelta.saving.text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
