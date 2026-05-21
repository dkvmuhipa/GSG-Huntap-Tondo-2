import React from 'react';
import { motion } from 'motion/react';
import { Home, Calendar, Image as ImageIcon, FileText, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BottomNavbarProps {
  onOpenBooking: () => void;
}

export default function BottomNavbar({ onOpenBooking }: BottomNavbarProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const navItems = [
    { name: 'Beranda', icon: Home, href: '/' },
    { name: 'Jadwal', icon: Calendar, href: '/#jadwal' },
    { name: 'Booking', icon: Plus, isAction: true },
    { name: 'Galeri', icon: ImageIcon, href: '/#galeri' },
    { name: 'Aturan', icon: FileText, href: '/rules' },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return isHome && !location.hash;
    if (href.startsWith('/#')) return isHome && location.hash === href.substring(1);
    return location.pathname === href;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] pt-2 pb-8 flex items-center justify-around pointer-events-auto w-full"
      >
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <button
                key="booking-action"
                onClick={onOpenBooking}
                className="relative -top-6 bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                <Plus className="w-6 h-6" />
                <span className="sr-only">Booking</span>
              </button>
            );
          }

          const Icon = item.icon;
          const active = isActive(item.href);

          return item.href?.startsWith('/#') ? (
            <a
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                active ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </a>
          ) : (
            <Link
              key={item.name}
              to={item.href || '/'}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                active ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
