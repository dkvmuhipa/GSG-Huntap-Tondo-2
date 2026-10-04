import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { 
  User, 
  Bell, 
  LogOut, 
  AlertTriangle, 
  Menu, 
  X, 
  Home, 
  Calendar, 
  Wallet, 
  LayoutDashboard, 
  CalendarCheck,
  ChevronDown,
  Shield,
  Settings,
  ExternalLink
} from 'lucide-react';
import { auth, logout, db, checkIsAdminAuthorized } from '../../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link } from 'react-router-dom';
import ConfirmModal from '../ui/ConfirmModal';

export default function AdminLayout() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      
      if (!currentUser) {
        navigate('/login', { replace: true });
        return;
      }

      const { authorized, role, profile } = await checkIsAdminAuthorized(currentUser);
      
      if (!isMounted) return;

      if (!authorized) {
        setError("Akses Ditolak: Email anda (" + currentUser.email + ") tidak terdaftar sebagai administrator.");
        setLoading(false);
      } else {
        setUser(currentUser);
        setUserRole(role);
        setAdminProfile(profile);
        setIsAdmin(true);
        setLoading(false);
      }
    }, (err) => {
      if (isMounted) {
        setError(err.message);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-primary font-bold">Memuat Sistem Keamanan...</p>
    </div>
  );

  if (error || (!user && !loading)) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-sm w-full text-center">
        <div className={`w-16 h-16 ${error?.includes('Akses Ditolak') ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
          {error?.includes('Akses Ditolak') ? <AlertTriangle className="w-8 h-8" /> : <LogOut className="w-8 h-8" />}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {error?.includes('Akses Ditolak') ? 'Akses Dibatasi' : 'Sesi Berakhir'}
        </h3>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {error || "Sesi anda telah berakhir atau anda tidak memiliki akses ke area ini."}
        </p>
        <button 
          onClick={async () => {
            try {
              await logout();
            } catch (err) {
              console.error("Gagal log out:", err);
            }
            navigate('/login', { replace: true });
          }}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all"
        >
          Keluar & Kembali ke Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <AdminSidebar 
          userRole={userRole} 
          onLogout={() => setIsLogoutModalOpen(true)} 
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 -ml-1 text-gray-600 hover:text-primary rounded-xl hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Buka Menu Admin"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base sm:text-xl font-bold text-gray-900 tracking-tight line-clamp-1">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <button className="hidden sm:block relative p-2 text-gray-400 hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            
            <div className="hidden sm:block h-8 w-px bg-gray-100" />
            
            {/* Account Profile Trigger & Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-2xl hover:bg-gray-50 transition-all group outline-none"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs md:text-sm font-bold text-gray-900 line-clamp-1">{adminProfile?.displayName || user?.displayName || 'Admin'}</p>
                  <p className="text-[9px] uppercase font-black tracking-wider text-primary">
                    {userRole || 'admin'}
                  </p>
                </div>
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform hidden sm:block ${isProfileMenuOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 overflow-hidden"
                  >
                    {/* User Identity Card */}
                    <div className="flex items-start gap-3 p-3 bg-gray-50/70 rounded-2xl mb-3">
                      <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black shrink-0 overflow-hidden">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {adminProfile?.displayName || user?.displayName || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 truncate font-medium">
                          {user?.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                          {userRole || 'admin'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Shortcuts */}
                    <div className="space-y-1 border-t border-gray-100 pt-2 mb-2">
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                        Ringkasan Dashboard
                      </Link>

                      {(userRole === 'owner' || userRole === 'admin') && (
                        <Link
                          to="/admin/rules"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                        >
                          <Shield className="w-4 h-4 text-gray-400" />
                          Hak Akses & Akun Admin
                        </Link>
                      )}

                      <Link
                        to="/admin/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Pengaturan Gedung
                      </Link>

                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <Home className="w-4 h-4 text-gray-400" />
                          Portal Warga GSG
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </a>
                    </div>

                    {/* Logout Button */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsLogoutModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Keluar dari Akun
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-8 pb-24 md:pb-8">
          <Outlet context={{ userRole, adminProfile }} />
        </main>
      </div>
      {/* Mobile Drawer Slide-over */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative z-10 w-72 max-w-[85vw] h-full"
            >
              <AdminSidebar 
                userRole={userRole} 
                onLogout={() => {
                  setIsMobileDrawerOpen(false);
                  setIsLogoutModalOpen(true);
                }} 
                onClose={() => setIsMobileDrawerOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] pt-3 pb-8 flex items-center justify-around pointer-events-auto"
        >
          <MobileAdminNav userRole={userRole} onLogout={() => setIsLogoutModalOpen(true)} />
        </motion.nav>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Keluar Sistem"
        message="Apakah Anda yakin ingin mengakhiri sesi administrator dan keluar dari sistem GSG Huntap Tondo 2?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        type="danger"
      />
    </div>
  );
}

// Separate component for mobile nav to keep layout clean
function MobileAdminNav({ userRole, onLogout }: { userRole: string | null, onLogout: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin', roles: ['owner', 'admin', 'editor', 'finance', 'bendahara'] },
    { name: 'Booking', icon: CalendarCheck, path: '/admin/bookings', roles: ['owner', 'admin', 'editor', 'bendahara', 'finance'] },
    { name: 'Keuangan', icon: Wallet, path: '/admin/finance', roles: ['owner', 'admin', 'finance', 'bendahara'] },
    { name: 'Logout', icon: LogOut, path: 'logout', roles: ['owner', 'admin', 'editor', 'finance', 'bendahara'] }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole || 'admin'));

  return (
    <>
      {filteredMenu.map(item => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        return (
          <button
            key={item.name}
            onClick={() => item.path === 'logout' ? onLogout() : navigate(item.path)}
            className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-300 relative ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabAdmin"
                className="absolute inset-0 bg-primary/5 rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
            <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </>
  );
}
