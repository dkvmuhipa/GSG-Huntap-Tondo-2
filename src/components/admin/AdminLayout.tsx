import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { User, Bell, LogOut, AlertTriangle, Menu, X, Home, Calendar, Wallet, LayoutDashboard, CalendarCheck } from 'lucide-react';
import { auth, logout, db } from '../../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link } from 'react-router-dom';

export default function AdminLayout() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminStatus = async (firebaseUser: FirebaseUser) => {
      try {
        const owners = ["dkvsmkmuhipa@gmail.com"];
        const userEmail = firebaseUser.email?.toLowerCase() || "";
        
        let profile = null;
        if (owners.includes(userEmail)) {
          profile = { role: 'owner', displayName: 'System Owner' };
        }

        // Direct lookup by email key
        const docRef = doc(db, 'admins', userEmail);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          profile = docSnap.data();
        }

        if (profile) {
          return { authorized: true, role: profile.role, profile };
        }

        return { authorized: false, role: null, profile: null };
      } catch (err: any) {
        console.error("Admin check failed:", err);
        return { authorized: false, role: null, profile: null };
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
      
      if (!currentUser) {
        navigate('/login', { replace: true });
        return;
      }

      const { authorized, role, profile } = await checkAdminStatus(currentUser);
      
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
          onClick={() => navigate('/login', { replace: true })}
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all"
        >
          Kembali ke Login
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
          onLogout={handleLogout} 
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight line-clamp-1">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3 md:gap-6">
            <button className="hidden sm:block relative p-2 text-gray-400 hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            
            <div className="hidden sm:block h-8 w-px bg-gray-100" />
            
            <div className="flex items-center gap-2 md:gap-3 group cursor-pointer" onClick={handleLogout}>
              <div className="text-right hidden xs:block">
                <p className="text-sm font-bold text-gray-900 line-clamp-1">{adminProfile?.displayName || user?.displayName || 'Admin'}</p>
                <p className="text-[9px] uppercase font-bold text-gray-400">
                  {userRole}
                </p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-primary group-hover:bg-red-50 group-hover:text-red-500 transition-colors shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full rounded-full" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-8 pb-24 md:pb-8">
          <Outlet context={{ userRole, adminProfile }} />
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <motion.nav 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgba(0,0,0,0.05)] pt-3 pb-8 flex items-center justify-around pointer-events-auto"
        >
          <MobileAdminNav userRole={userRole} onLogout={handleLogout} />
        </motion.nav>
      </div>
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
