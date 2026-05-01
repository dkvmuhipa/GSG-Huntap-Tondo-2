import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Wallet, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Clock,
  Receipt,
  LayoutGrid,
  MapPin
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { subscribeToTransactions, subscribeToConfig, syncFinanceTotals, subscribeToAdmins, subscribeToBookings, checkCurrentAvailability } from '../../lib/db';

import { useOutletContext } from 'react-router-dom';

export default function DashboardOverview() {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [adminCount, setAdminCount] = useState(0);

  useEffect(() => {
    const unsubTx = subscribeToTransactions(setTransactions);
    const unsubConfig = subscribeToConfig(setConfig);
    const unsubAdmins = subscribeToAdmins((data) => setAdminCount(data.length));
    const unsubBookings = subscribeToBookings(setBookings);
    return () => {
      unsubTx();
      unsubConfig();
      unsubAdmins();
      unsubBookings();
    };
  }, []);

  const availability = checkCurrentAvailability(bookings, config, 'all');

  // Calculate 7-day stats
  const getChartData = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const now = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      
      const dayTotal = transactions
        .filter(t => t.date === dateStr && t.type === 'income')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      result.push({ name: dayName, income: dayTotal / 1000 }); // In thousands for display
    }
    return result;
  };

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '+0%';
    const diff = ((current - previous) / previous) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
  };

  const chartData = getChartData();
  
  // Example trend calculation (simple version)
  const currentWeekRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const previousWeekRevenue = 0; // Just as example
  const revenueTrend = calculateTrend(currentWeekRevenue, previousWeekRevenue);

  const stats = [
    { label: 'Total Booking', value: transactions.length.toString(), icon: Calendar, trend: '+0%', isPositive: true },
    { 
      label: 'Saldo Kas', 
      value: (userRole === 'editor') ? '••••••' : (config?.opsFund || 'Rp 0'), 
      icon: Wallet, 
      trend: '+0%', 
      isPositive: true,
      hidden: userRole === 'editor'
    },
    { label: 'Admin/Warga', value: adminCount.toString(), icon: Users, trend: `+${adminCount}`, isPositive: true },
    { 
      label: 'Dana Peng.', 
      value: (userRole === 'editor') ? '••••••' : (config?.devFund || 'Rp 0'), 
      icon: TrendingUp, 
      trend: revenueTrend, 
      isPositive: true,
      hidden: userRole === 'editor'
    },
  ];

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Availability Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${
          availability.isBusy 
          ? 'bg-red-50 border-red-100 text-red-900' 
          : 'bg-emerald-50 border-emerald-100 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            availability.isBusy ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
          }`}>
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest opacity-60">Status Gedung Hari Ini</h4>
            <p className="text-xl font-black">
              {availability.isBusy ? `SEDANG DIGUNAKAN: ${availability.currentBooking?.purpose}` : 'GEDUNG SEDANG KOSONG / TERSEDIA'}
            </p>
          </div>
        </div>
        
        {availability.isBusy ? (
          <div className="flex items-center gap-3 bg-white/50 px-5 py-3 rounded-2xl border border-red-100">
            <Clock className="w-5 h-5 text-red-500" />
            <div className="text-left leading-tight">
              <p className="text-[10px] font-black uppercase text-red-400 leading-none mb-1">Booking Info</p>
              <p className="text-sm font-bold">{availability.currentBooking?.customerName}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-5 py-3 bg-white/50 rounded-2xl border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-sm font-black uppercase tracking-widest text-emerald-600">Ready for Events</span>
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm ${stat.hidden ? 'opacity-75 grayscale-[0.5]' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.trend}
                {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            {stat.hidden && <p className="text-[10px] text-orange-500 font-bold mt-2">Akses Terbatas</p>}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className={`lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-[400px] relative overflow-hidden ${userRole === 'editor' ? 'opacity-50' : ''}`}>
          {userRole === 'editor' && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
              <div className="text-center p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <p className="font-bold text-gray-900">Statistik Keuangan Terkunci</p>
                <p className="text-xs text-gray-400 mt-1">Hanya Owner, Admin, Bendahara, dan Finance yang dapat melihat data ini.</p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Arus Kas Masuk (Realtime)</h3>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Performa 7 Hari Terakhir</p>
            </div>
            <div className="p-1 bg-gray-50 rounded-xl flex gap-1">
              <span className="px-3 py-1 bg-white rounded-lg text-[10px] font-black text-primary shadow-sm tracking-widest uppercase">Income</span>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1E40AF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }} 
                  formatter={(value: any) => [`Rp ${value.toLocaleString()}k`, 'Pemasukan']}
                />
                <Area type="monotone" dataKey="income" stroke="#1E40AF" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 text-lg">Aktivitas Terbaru</h3>
            <button className="text-xs font-bold text-primary hover:underline">Semua</button>
          </div>
          <div className="space-y-6 flex-1">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  tx.type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {tx.type === 'expense' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-900 truncate">{tx.source}</p>
                    {tx.receiptUrl && <Receipt className="w-3 h-3 text-primary shrink-0" />}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{tx.category} • {tx.date}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${tx.type === 'expense' ? 'text-red-600' : 'text-gray-900'}`}>
                    {tx.type === 'income' ? '+' : '-'}Rp {Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Verified</p>
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400 italic">Belum ada transaksi</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => syncFinanceTotals(transactions)}
            disabled={userRole === 'editor' || transactions.length === 0}
            className={`w-full mt-10 py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
              userRole === 'editor' 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-primary/5 text-primary hover:bg-primary/10'
            }`}
          >
            {userRole === 'editor' ? 'Akses Dibatasi' : 'Force Sync Dashboard Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
