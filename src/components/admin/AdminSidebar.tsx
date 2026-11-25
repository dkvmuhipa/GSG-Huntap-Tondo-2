import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Wallet, 
  Settings, 
  Shield,
  Home,
  LogOut,
  Building2,
  Box,
  Store,
  History,
  X
} from 'lucide-react';

interface AdminSidebarProps {
  userRole?: string | null;
  onLogout?: () => void;
  onClose?: () => void;
}

export default function AdminSidebar({ userRole = 'admin', onLogout, onClose }: AdminSidebarProps) {
  const menuItems = [
    { name: 'Ringkasan', icon: LayoutDashboard, path: '/admin', roles: ['owner', 'admin', 'editor', 'finance', 'bendahara'] },
    { name: 'Kelola Booking', icon: CalendarCheck, path: '/admin/bookings', roles: ['owner', 'admin', 'editor', 'bendahara', 'finance'] },
    { name: 'Keuangan', icon: Wallet, path: '/admin/finance', roles: ['owner', 'admin', 'finance', 'bendahara'] },
    { name: 'Inventaris & Log', icon: Box, path: '/admin/inventory', roles: ['owner', 'admin', 'bendahara'] },
    { name: 'Mitra Vendor & UMKM', icon: Store, path: '/admin/vendors', roles: ['owner', 'admin', 'editor', 'bendahara'] },
    { name: 'Akses & Rules', icon: Shield, path: '/admin/rules', roles: ['owner', 'admin'] },
    { name: 'Audit Trail & Log', icon: History, path: '/admin/audit-logs', roles: ['owner', 'admin', 'bendahara', 'finance'] },
    { name: 'Pengaturan Gedung', icon: Settings, path: '/admin/settings', roles: ['owner', 'admin', 'editor', 'bendahara'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole || 'admin'));

  return (
    <aside className="w-64 bg-[#0F0F10] border-r border-white/10 h-full md:h-screen md:fixed left-0 top-0 text-white flex flex-col z-50">
      <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="text-white w-4 h-4" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Admin Tondo 2</span>
        </div>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#232325] transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            onClick={() => onClose && onClose()}
            className={({ isActive }) => 
              `h-9 flex items-center gap-3 px-3 rounded-lg transition-colors text-[13px] ${
                isActive 
                ? 'bg-[#232325] text-white font-medium' 
                : 'text-[#A1A1AA] hover:bg-[#1A1A1C] hover:text-white font-normal'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <NavLink
          to="/"
          className="h-9 flex items-center gap-3 px-3 rounded-lg text-[#A1A1AA] hover:bg-[#1A1A1C] hover:text-white transition-colors text-[13px]"
        >
          <Home className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>Lihat Website</span>
        </NavLink>
        <button 
          onClick={onLogout}
          className="w-full h-9 flex items-center gap-3 px-3 rounded-lg text-[#F87171] hover:bg-[#DC2626]/15 hover:text-[#FCA5A5] transition-colors text-[13px] font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
