import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { 
  User, 
  LogOut, 
  AlertTriangle, 
  Menu, 
  Home, 
  Wallet, 
  LayoutDashboard, 
  CalendarCheck,
  ChevronDown,
  Shield,
  Settings,
  ExternalLink
} from 'lucide-react';
import AdminNotificationBell from './AdminNotificationBell';
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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] flex-col gap-3">
      <div className="w-8 h-8 border-2 border-[#1E40AF]/25 border-t-[#1E40AF] rounded-full animate-spin" />
      <p className="text-[#525252] text-xs font-medium">Memuat sistem keamanan...</p>
    </div>
  );

  if (error || (!user && !loading)) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-4">
      <div className="bg-white p-8 rounded-2xl border border-[#E4E4E7] max-w-sm w-full text-center">
        <div className={`w-12 h-12 ${error?.includes('Akses Ditolak') ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'} rounded-xl flex items-center justify-center mx-auto mb-5`}>
          {error?.includes('Akses Ditolak') ? <AlertTriangle className="w-6 h-6" /> : <LogOut className="w-6 h-6" />}
        </div>
        <h3 className="text-lg font-semibold text-[#171717] mb-2">
          {error?.includes('Akses Ditolak') ? 'Akses Dibatasi' : 'Sesi Berakhir'}
        </h3>
        <p className="text-[#525252] text-sm mb-6 leading-relaxed">
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
          className="w-full bg-[#1E40AF] text-white py-3 rounded-lg font-medium text-xs hover:bg-[#1D3A8A] transition-colors cursor-pointer"
        >
          Keluar & Kembali ke Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <div className="hidden md:block">
        <AdminSidebar 
          userRole={userRole} 
          onLogout={() => setIsLogoutModalOpen(true)} 
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E4E4E7] flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 -ml-1 text-[#525252] hover:text-[#171717] rounded-lg hover:bg-[#F4F4F5] transition-colors shrink-0"
              aria-label="Buka Menu Admin"
            >
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-[#171717] tracking-tight line-clamp-1">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-5">
            <AdminNotificationBell userRole={userRole} />
            
            <div className="hidden sm:block h-6 w-px bg-[#E4E4E7]" />
            
            {/* Account Profile Trigger & Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 md:gap-2.5 p-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors group outline-none cursor-pointer"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-[#171717] line-clamp-1">{adminProfile?.displayName || user?.displayName || 'Admin'}</p>
                  <p className="text-[11px] font-medium text-[#1E40AF] capitalize">
                    {userRole || 'admin'}
                  </p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 bg-[#EFF6FF] rounded-full border border-[#BFDBFE] flex items-center justify-center text-[#1E40AF] shrink-0 overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#737373] transition-transform hidden sm:block ${isProfileMenuOpen ? 'rotate-180 text-[#1E40AF]' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#E4E4E7] p-3 z-50 overflow-hidden"
                  >
                    {/* User Identity Card */}
                    <div className="flex items-start gap-3 p-3 bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg mb-2.5">
                      <div className="w-10 h-10 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-center text-[#1E40AF] font-semibold shrink-0 overflow-hidden">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-[#1E40AF]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#171717] truncate">
                          {adminProfile?.displayName || user?.displayName || 'Admin'}
                        </p>
                        <p className="text-xs text-[#737373] truncate">
                          {user?.email}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] text-[11px] font-medium capitalize">
                          {userRole || 'admin'}
                        </span>
                      </div>
                    </div>

                    {/* Navigation Shortcuts */}
                    <div className="space-y-0.5 border-t border-[#E4E4E7] pt-2 mb-2">
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#171717] hover:bg-[#F4F4F5] hover:text-[#1E40AF] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#737373]" />
                        Ringkasan Dashboard
                      </Link>

                      {(userRole === 'owner' || userRole === 'admin') && (
                        <Link
                          to="/admin/rules"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#171717] hover:bg-[#F4F4F5] hover:text-[#1E40AF] transition-colors"
                        >
                          <Shield className="w-4 h-4 text-[#737373]" />
                          Hak Akses & Akun Admin
                        </Link>
                      )}

                      <Link
                        to="/admin/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#171717] hover:bg-[#F4F4F5] hover:text-[#1E40AF] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#737373]" />
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
              className="fixed inset-0 bg-black/60"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border-t border-[#E4E4E7] pt-3 pb-8 flex items-center justify-around pointer-events-auto"
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
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors relative cursor-pointer ${
              isActive ? 'text-[#1E40AF]' : 'text-[#737373]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabAdmin"
                className="absolute inset-0 bg-[#EFF6FF] rounded-lg -z-10"
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <Icon className="w-5 h-5" strokeWidth={1.75} />
            <span className={`text-[11px] font-medium ${isActive ? 'text-[#1E40AF]' : 'text-[#737373]'}`}>
              {item.name}
            </span>
          </button>
        );
      })}
    </>
  );
}
