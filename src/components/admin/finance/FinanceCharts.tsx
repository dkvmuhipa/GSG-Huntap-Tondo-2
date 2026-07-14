import React from 'react';
import { motion } from 'motion/react';
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

interface FinanceChartsProps {
  chartData: any[];
  categoryData: any[];
  COLORS: string[];
}

export default function FinanceCharts({ chartData, categoryData, COLORS }: FinanceChartsProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6" id="finance-charts-section">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Arus Kas Bulanan</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Income vs Expense (6 Bulan Terakhir)</p>
          </div>
          <div className="flex gap-3 text-[8px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>Masuk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>Keluar</span>
            </div>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                formatter={(value: number) => [`Rp ${value.toLocaleString()}`, '']}
              />
              <Bar dataKey="income" fill="#1E40AF" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="expense" fill="#F87171" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm"
      >
        <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-8">Alokasi Biaya Keluar</h3>
        <div className="h-[200px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData.length > 0 ? categoryData : [{ name: 'EMPTY', value: 1 }]}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                {categoryData.length === 0 && <Cell key="empty-cell" fill="#f1f5f9" />}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-gray-400 uppercase leading-none">Total</span>
            <span className="text-lg font-black text-gray-900">Cat.</span>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          {categoryData.slice(0, 3).map((cat, i) => (
            <div key={cat.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-bold text-gray-500 uppercase">{cat.name}</span>
              </div>
              <span className="text-[10px] font-black text-gray-900">Rp {cat.value.toLocaleString()}</span>
            </div>
          ))}
          {categoryData.length === 0 && (
            <p className="text-[10px] text-gray-400 text-center italic">Belum ada pengeluaran</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
