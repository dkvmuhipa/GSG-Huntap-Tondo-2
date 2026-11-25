import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface FinanceChartsProps {
  chartData: any[];
  categoryData: any[];
  COLORS: string[];
}

export default function FinanceCharts({ chartData, categoryData }: FinanceChartsProps) {
  const maxCatValue = Math.max(...categoryData.map((c) => Number(c.value || 0)), 1);
  const totalCatValue = categoryData.reduce((acc, c) => acc + Number(c.value || 0), 0) || 1;

  return (
    <div className="grid lg:grid-cols-3 gap-6" id="finance-charts-section">
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="lg:col-span-2 min-w-0 bg-white p-6 rounded-xl border border-[#E4E4E7]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-semibold text-[#171717] text-sm">Arus Kas Bulanan</h3>
            <p className="text-xs text-[#737373] mt-0.5">Pemasukan vs Pengeluaran (6 bulan terakhir)</p>
          </div>
          <div className="flex gap-4 text-xs text-[#525252]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1E40AF]" />
              <span>Masuk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#D4D4D8]" />
              <span>Keluar</span>
            </div>
          </div>
        </div>
        <div className="h-[260px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 500, fill: '#737373' }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#FAFAFA' }}
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #E4E4E7', backgroundColor: '#FFFFFF', padding: '10px', fontSize: '12px' }}
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, '']}
              />
              <Bar dataKey="income" name="Masuk" fill="#1E40AF" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="expense" name="Keluar" fill="#D4D4D8" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white p-6 rounded-xl border border-[#E4E4E7] min-w-0 flex flex-col justify-between"
      >
        <div>
          <h3 className="font-semibold text-[#171717] text-sm mb-1">Alokasi Biaya Keluar</h3>
          <p className="text-xs text-[#737373] mb-6">Peringkat kategori pengeluaran operasional.</p>
          {categoryData.length === 0 ? (
            <p className="text-xs text-[#737373] text-center py-12">Belum ada pengeluaran pada periode ini.</p>
          ) : (
            <div className="space-y-4">
              {categoryData.slice(0, 5).map((cat, i) => {
                const pctWidth = Math.max(6, Math.round((Number(cat.value || 0) / maxCatValue) * 100));
                const sharePct = Math.round((Number(cat.value || 0) / totalCatValue) * 100);
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-medium text-[#171717] truncate">{cat.name}</span>
                      <span className="font-mono tabular-nums font-semibold text-[#171717] shrink-0">
                        Rp {Number(cat.value || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${i === 0 ? 'bg-[#1E40AF]' : 'bg-[#A1A1AA]'}`}
                          style={{ width: `${pctWidth}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[#737373] w-9 text-right">
                        {sharePct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-[#E4E4E7] flex items-center justify-between text-xs text-[#737373]">
          <span>Total tercatat</span>
          <span className="font-mono tabular-nums font-semibold text-[#171717]">
            Rp {categoryData.reduce((s, c) => s + Number(c.value || 0), 0).toLocaleString('id-ID')}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
