import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutGrid, 
  CalendarCheck, 
  Wallet, 
  Box, 
  Shield, 
  Settings, 
  Home, 
  FileText 
} from 'lucide-react';

interface QuickMenuGridProps {
  userRole: string | null;
  pendingBookingsCount?: number;
}

export default function QuickMenuGrid({ userRole = 'admin', pendingBookingsCount = 0 }: QuickMenuGridProps) {
  const currentRole = userRole || 'admin';

  const menuItems = [
    {
      name: 'Ringkasan',
      path: '/admin',
      icon: LayoutGrid,
      gradient: 'from-indigo-500 to-indigo-600',
      shadowColor: 'shadow-indigo-500/25 hover:shadow-indigo-500/40',
      badge: null,
      roles: ['owner', 'admin', 'editor', 'finance', 'bendahara'],
    },
    {
      name: 'Kelola Booking',
      path: '/admin/bookings',
      icon: CalendarCheck,
      gradient: 'from-sky-400 to-blue-500',
      shadowColor: 'shadow-sky-400/25 hover:shadow-sky-400/40',
      badge: pendingBookingsCount > 0 ? `${pendingBookingsCount} Baru` : 'Cek',
      badgeColor: pendingBookingsCount > 0 ? 'bg-red-500 animate-bounce' : 'bg-blue-600',
      roles: ['owner', 'admin', 'editor', 'bendahara', 'finance'],
    },
    {
      name: 'Keuangan',
      path: '/admin/finance',
      icon: Wallet,
      gradient: 'from-orange-500 to-amber-600',
      shadowColor: 'shadow-orange-500/25 hover:shadow-orange-500/40',
      badge: currentRole !== 'editor' ? 'Realtime' : 'Terkunci',
      badgeColor: currentRole !== 'editor' ? 'bg-orange-500' : 'bg-gray-500',
      roles: ['owner', 'admin', 'finance', 'bendahara'],
    },
    {
      name: 'Inventaris & Log',
      path: '/admin/inventory',
      icon: Box,
      gradient: 'from-purple-500 to-fuchsia-600',
      shadowColor: 'shadow-purple-500/25 hover:shadow-purple-500/40',
      badge: null,
      roles: ['owner', 'admin', 'bendahara'],
    },
    {
      name: 'Akses & Rules',
      path: '/admin/rules',
      icon: Shield,
      gradient: 'from-emerald-500 to-emerald-600',
      shadowColor: 'shadow-emerald-500/25 hover:shadow-emerald-500/40',
      badge: 'Penting',
      badgeColor: 'bg-amber-500',
      roles: ['owner', 'admin'],
    },
    {
      name: 'Situs & Konten',
      path: '/admin/settings',
      icon: Settings,
      gradient: 'from-cyan-400 to-cyan-500',
      shadowColor: 'shadow-cyan-400/25 hover:shadow-cyan-400/40',
      badge: 'Update',
      badgeColor: 'bg-cyan-600',
      roles: ['owner', 'admin', 'editor', 'bendahara'],
    },
    {
      name: 'Lihat Website',
      path: '/',
      icon: Home,
      gradient: 'from-indigo-600 to-blue-500',
      shadowColor: 'shadow-indigo-600/25 hover:shadow-indigo-600/40',
      badge: 'Halaman',
      badgeColor: 'bg-indigo-500',
      roles: ['owner', 'admin', 'editor', 'finance', 'bendahara'],
    },
    {
      name: 'Aturan Gedung',
      path: '/rules',
      icon: FileText,
      gradient: 'from-rose-500 to-red-600',
      shadowColor: 'shadow-red-500/25 hover:shadow-red-500/40',
      badge: 'SOP',
      badgeColor: 'bg-red-500',
      roles: ['owner', 'admin', 'editor', 'finance', 'bendahara'],
    },
  ];

  // Filter based on roles
  const filteredMenu = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      {/* Title block matching user's reference */}
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
          Layanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-600">Admin Terpadu</span>
        </h2>
        <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1 leading-relaxed">
          Semua pengelolaan gedung, keuangan warga, inventaris, dan publikasi kini serba praktis dalam satu ketukan.
        </p>
      </div>

      {/* Grid of rounded-squircle items */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-6 sm:gap-y-8">
        {filteredMenu.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="flex flex-col items-center group text-center"
            >
              <Link to={item.path} className="relative flex flex-col items-center">
                {/* Micro badge above icon */}
                {item.badge && (
                  <span className={`absolute -top-2 z-10 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-white shadow-sm border border-white ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}

                {/* iOS-style squircle with color-matching neon glow */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.4rem] sm:rounded-2xl bg-gradient-to-tr ${item.gradient} ${item.shadowColor} flex items-center justify-center text-white cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300 shadow-lg`}>
                  <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>

                {/* Item Label */}
                <span className="mt-2.5 text-[11px] sm:text-xs font-bold text-gray-700 group-hover:text-primary transition-colors max-w-[80px] sm:max-w-[100px] leading-tight block">
                  {item.name}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
