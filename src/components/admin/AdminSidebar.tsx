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
  Building2
} from 'lucide-react';

interface AdminSidebarProps {
  userRole?: string | null;
  onLogout?: () => void;
}

export default function AdminSidebar({ userRole = 'admin', onLogout }: AdminSidebarProps) {
  const menuItems = [
    { name: 'Ringkasan', icon: LayoutDashboard, path: '/admin', roles: ['owner', 'admin', 'editor', 'finance', 'bendahara'] },
    { name: 'Kelola Booking', icon: CalendarCheck, path: '/admin/bookings', roles: ['owner', 'admin', 'editor', 'bendahara', 'finance'] },
    { name: 'Keuangan', icon: Wallet, path: '/admin/finance', roles: ['owner', 'admin', 'finance', 'bendahara'] },
    { name: 'Akses & Rules', icon: Shield, path: '/admin/rules', roles: ['owner', 'admin'] },
    { name: 'Pengaturan Gedung', icon: Settings, path: '/admin/settings', roles: ['owner', 'admin', 'editor', 'bendahara'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole || 'admin'));

  return (
    <aside className="w-64 bg-gray-900 h-screen fixed left-0 top-0 text-white flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold">Admin Tondo 2</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm">Lihat Website</span>
        </NavLink>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
