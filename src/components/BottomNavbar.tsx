import React from 'react';
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
    <div id="bottom-navbar" className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <nav
        aria-label="Navigasi bawah"
        className="bg-[#FCFCFD]/95 backdrop-blur-sm border-t border-[#E5E7EB] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around pointer-events-auto"
      >
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <button
                key="booking-action"
                type="button"
                onClick={onOpenBooking}
                aria-label="Ajukan sewa gedung"
                className="relative -top-3.5 bg-[#1E40AF] hover:bg-[#1D3A8A] text-white w-11 h-11 rounded-xl border border-white/20 flex items-center justify-center active:scale-[0.97] transition-[background-color,transform] duration-150 cursor-pointer"
              >
                <Plus className="w-5 h-5" strokeWidth={1.75} />
              </button>
            );
          }

          const Icon = item.icon;
          const active = isActive(item.href);

          return item.href?.startsWith('/#') ? (
            <a
              key={item.name}
              href={item.href}
              className={`min-h-[44px] min-w-[48px] flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                active ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium">{item.name}</span>
            </a>
          ) : (
            <Link
              key={item.name}
              to={item.href || '/'}
              className={`min-h-[44px] min-w-[48px] flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                active ? 'text-[#1E40AF]' : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
              <span className="text-[11px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
