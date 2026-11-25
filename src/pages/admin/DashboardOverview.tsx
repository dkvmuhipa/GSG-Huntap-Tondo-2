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
  MapPin,
  Bell,
  ArrowRight
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
import { syncFinanceTotals, checkCurrentAvailability } from '../../lib/db';
import { getLocalDateISO } from '../../lib/dateUtils';
import { useAppStore } from '../../store/useAppStore';

import { useOutletContext, Link } from 'react-router-dom';
import QuickMenuGrid from '../../components/admin/QuickMenuGrid';
import ActivityLogWidget from '../../components/admin/ActivityLogWidget';

export default function DashboardOverview() {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const transactions = useAppStore(state => state.transactions);
  const bookings = useAppStore(state => state.bookings);
  const config = useAppStore(state => state.config);
  const adminCount = useAppStore(state => state.admins.length);

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
      const dateStr = getLocalDateISO(d);
      
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
  
  // Real Occupancy Rate for Current Month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const currentMonthBookings = bookings.filter(b => 
    (b.status === 'approved' || b.status === 'completed') &&
    b.startDate && b.startDate.startsWith(currentMonthPrefix)
  );
  const occupiedDaysThisMonth = new Set(currentMonthBookings.map(b => b.startDate)).size;
  const occupancyRate = daysInMonth > 0 ? ((occupiedDaysThisMonth / daysInMonth) * 100).toFixed(1) : '0';

  // Previous Month for MoM comparison
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthPrefix = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Real Month-over-Month (MoM) Revenue Trend
  const currentMonthRevenue = transactions
    .filter(t => t.type === 'income' && t.date && t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const prevMonthRevenue = transactions
    .filter(t => t.type === 'income' && t.date && t.date.startsWith(prevMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const momRevenueTrend = calculateTrend(currentMonthRevenue, prevMonthRevenue);
  const isMomRevenuePositive = currentMonthRevenue >= prevMonthRevenue;

  const confirmedBookings = bookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  const stats = [
    { 
      label: 'Booking Terkonfirmasi', 
      value: confirmedBookings.toString(), 
      icon: Calendar, 
      trend: pendingBookings > 0 ? `${pendingBookings} Menunggu` : 'Semua Terproses', 
      isPositive: pendingBookings === 0 
    },
    { 
      label: 'Rasio Okupansi Bulan Ini', 
      value: `${occupancyRate}%`, 
      icon: LayoutGrid, 
      trend: `${occupiedDaysThisMonth} dari ${daysInMonth} Hari`, 
      isPositive: occupiedDaysThisMonth > 0 
    },
    { 
      label: 'Saldo Kas', 
      value: (userRole === 'editor') ? '••••••' : (config?.opsFund || 'Rp 0'), 
      icon: Wallet, 
      trend: currentMonthRevenue > 0 ? `+Rp ${(currentMonthRevenue / 1000).toLocaleString('id-ID')}k bln ini` : 'Bulan Ini', 
      isPositive: true,
      hidden: userRole === 'editor'
    },
    { 
      label: 'Dana Pembangunan', 
      value: (userRole === 'editor') ? '••••••' : (config?.devFund || 'Rp 0'), 
      icon: TrendingUp, 
      trend: `${momRevenueTrend} MoM`, 
      isPositive: isMomRevenuePositive,
      hidden: userRole === 'editor'
    },
  ];

  const recentTransactions = transactions.slice(0, 5);

  // Radar H-1: Detect events happening tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  
  const tomorrowBookings = bookings.filter(b => 
    (b.status === 'approved' || b.status === 'confirmed') &&
    b.startDate && b.startDate.startsWith(tomorrowStr)
  );

  return (
    <div className="space-y-8">
      {/* Availability Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={`p-4 sm:p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          availability.isBusy 
          ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]' 
          : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D]'
        }`}
      >
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 ${
            availability.isBusy ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DCFCE7] text-[#16A34A]'
          }`}>
            <LayoutGrid className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-xs opacity-80">Status gedung hari ini</h4>
            <p className="text-base sm:text-lg font-semibold truncate">
              {availability.isBusy ? `Sedang digunakan: ${availability.currentBooking?.purpose}` : 'Gedung sedang kosong / tersedia'}
            </p>
          </div>
        </div>
        
        {availability.isBusy ? (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-[#FECACA] w-full md:w-auto">
            <Clock className="w-4 h-4 text-[#DC2626] shrink-0" />
            <div className="text-left leading-tight min-w-0">
              <p className="text-[11px] font-medium text-[#B91C1C]">Penyewa</p>
              <p className="text-xs sm:text-sm font-semibold text-[#171717] truncate">{availability.currentBooking?.customerName}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-lg border border-[#BBF7D0] w-full md:w-auto justify-center md:justify-start">
            <span className="w-2 h-2 bg-[#16A34A] rounded-full" />
            <span className="text-xs font-medium text-[#15803D]">Siap digunakan</span>
          </div>
        )}
      </motion.div>

      {/* Radar Pengingat H-1 Acara Besok */}
      {tomorrowBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-[#E4E4E7] border-l-4 border-l-[#1E40AF] p-5 sm:p-6 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[11px] font-medium mb-1">
                Radar pengingat H-1
              </span>
              <h4 className="text-base font-semibold text-[#171717]">
                Ada <span className="font-mono tabular-nums">{tomorrowBookings.length}</span> jadwal acara besok ({tomorrow.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })})
              </h4>
              <p className="text-xs text-[#737373] mt-0.5 line-clamp-1">
                {tomorrowBookings.map(b => `${b.customerName} - ${b.purpose || 'Acara'}`).join(' · ')}
              </p>
            </div>
          </div>
          <Link
            to="/admin/bookings"
            className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-[#1E40AF] hover:bg-[#1D3A8A] text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <span>Buka & Kirim Pengingat WA</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Quick Menu Grid */}
      <QuickMenuGrid userRole={userRole} pendingBookingsCount={pendingBookings} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`bg-white p-5 rounded-xl border border-[#E4E4E7] ${stat.hidden ? 'opacity-70 grayscale-[0.5]' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-9 h-9 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-center text-[#1E40AF]">
                <stat.icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-mono tabular-nums font-medium ${stat.isPositive ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                {stat.trend}
                {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-xs font-medium text-[#737373] mb-1">{stat.label}</p>
            <h3 className="text-xl sm:text-2xl font-mono tabular-nums font-semibold text-[#171717]">{stat.value}</h3>
            {stat.hidden && <p className="text-[11px] text-[#B45309] font-medium mt-2">Akses terbatas</p>}
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className={`lg:col-span-2 bg-white p-6 rounded-xl border border-[#E4E4E7] h-[380px] relative overflow-hidden min-w-0 ${userRole === 'editor' ? 'opacity-50' : ''}`}>
          {userRole === 'editor' && (
            <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center">
              <div className="text-center p-6 bg-white rounded-xl border border-[#E4E4E7] shadow-sm">
                <TrendingUp className="w-7 h-7 text-[#B45309] mx-auto mb-2.5" />
                <p className="font-semibold text-sm text-[#171717]">Statistik Keuangan Terkunci</p>
                <p className="text-xs text-[#737373] mt-1">Hanya Owner, Admin, Bendahara, dan Finance yang dapat melihat data ini.</p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-[#171717] text-base">Arus Kas Masuk (Realtime)</h3>
              <p className="text-xs text-[#737373] mt-0.5">Performa 7 hari terakhir</p>
            </div>
            <span className="px-2.5 py-1 bg-[#F4F4F5] border border-[#E4E4E7] rounded-md text-[11px] font-medium text-[#1E40AF]">
              Pemasukan
            </span>
          </div>
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#1E40AF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#737373' }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid #E4E4E7', 
                    backgroundColor: '#FFFFFF',
                    fontSize: '12px'
                  }} 
                  formatter={(value: any) => [`Rp ${value.toLocaleString('id-ID')}k`, 'Pemasukan']}
                />
                <Area type="monotone" dataKey="income" stroke="#1E40AF" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl border border-[#E4E4E7] flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[#171717] text-base">Aktivitas Terbaru</h3>
            <Link to="/admin/finance" className="text-xs font-medium text-[#1E40AF] hover:underline">Semua</Link>
          </div>
          <div className="space-y-4 flex-1">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  tx.type === 'expense' ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#F0FDF4] text-[#16A34A]'
                }`}>
                  {tx.type === 'expense' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-xs text-[#171717] leading-tight truncate">{tx.source}</p>
                        {tx.receiptUrl && <Receipt className="w-3 h-3 text-[#1E40AF] shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#737373] font-mono tabular-nums mt-0.5">
                        {tx.category} · {tx.date}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end shrink-0 sm:text-right mt-1 sm:mt-0">
                      <p className={`text-xs font-mono tabular-nums font-semibold ${tx.type === 'expense' ? 'text-[#DC2626]' : 'text-[#15803D]'}`}>
                        {tx.type === 'income' ? '+' : '-'}Rp {Math.abs(tx.amount).toLocaleString('id-ID')}
                      </p>
                      <p className="hidden sm:block text-[10px] text-[#737373]">Tercatat</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <div className="text-center py-10">
                <p className="text-xs text-[#737373]">Belum ada transaksi</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => syncFinanceTotals(transactions)}
            disabled={userRole === 'editor' || transactions.length === 0}
            className={`w-full mt-6 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              userRole === 'editor' || transactions.length === 0
              ? 'bg-[#F4F4F5] text-[#A1A1AA] cursor-not-allowed border border-[#E4E4E7]' 
              : 'bg-[#EFF6FF] text-[#1E40AF] hover:bg-[#DBEAFE] border border-[#BFDBFE]'
            }`}
          >
            {userRole === 'editor' ? 'Akses Dibatasi' : 'Sinkronkan Data Dashboard'}
          </button>
        </div>
      </div>

      {/* Catatan Aktivitas Admin / Audit Trail */}
      <ActivityLogWidget />
    </div>
  );
}
