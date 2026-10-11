import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MessageCircle, 
  Menu, 
  X, 
  Shield, 
  CalendarCheck, 
  Search, 
  PieChart, 
  Image as ImageIcon, 
  Store, 
  FileText,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Fasilitas & Tarif', href: '/#fasilitas', icon: Building2 },
    { name: 'Ketersediaan', href: '/#jadwal', icon: CalendarCheck },
    { name: 'Lacak Sewa', href: '/#lacak', icon: Search },
    { name: 'Transparansi', href: '/#transparansi', icon: PieChart },
    { name: 'Galeri', href: '/#galeri', icon: ImageIcon },
    { name: 'Mitra Vendor', href: '/#mitra-vendor', icon: Store },
    { name: 'Aturan Sewa', href: '/rules', icon: FileText },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/rules') {
      return location.pathname === '/rules';
    }
    if (href.startsWith('/#')) {
      const hash = href.replace('/', '');
      return location.pathname === '/' && location.hash === hash;
    }
    return false;
  };

  return (
    <nav className={`w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-md shadow-slate-900/5' 
        : 'bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <Building2 className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg md:text-xl font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors truncate leading-tight">
                GEDUNG SERBAGUNA
              </span>
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-widest uppercase truncate">
                Huntap Tondo 2
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm font-bold text-slate-600">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              const isExternalOrHash = link.href.includes('#');

              const content = (
                <span className={`px-3 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 ${
                  active 
                    ? 'text-primary bg-primary/10 font-black' 
                    : 'hover:text-primary hover:bg-slate-50'
                }`}>
                  {link.name}
                </span>
              );

              return !isExternalOrHash ? (
                <Link key={link.name} to={link.href}>
                  {content}
                </Link>
              ) : (
                <a key={link.name} href={link.href}>
                  {content}
                </a>
              );
            })}
          </div>

          {/* Right Action Elements: PWA, Portal Pengurus, Booking Button, Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* PWA Install */}
            <PWAInstallButton variant="navbar" />

            {/* Portal Pengurus / Admin Login Button */}
            <Link
              to="/login"
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-primary hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition-all flex items-center gap-1.5"
              title="Portal Pengurus & Admin"
              aria-label="Portal Pengurus"
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="hidden xl:inline text-[11px] font-black uppercase tracking-wider">Pengurus</span>
            </Link>

            {/* Main Booking Button */}
            <motion.button
              onClick={onOpenBooking}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden sm:inline-flex bg-primary hover:bg-blue-800 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-primary/20 transition-all items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Booking Sekarang</span>
            </motion.button>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-slate-700 hover:text-primary hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Tutup menu" : "Buka menu"}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden bg-white border-b border-slate-200/80 px-4 shadow-xl"
          >
            <div className="py-4 space-y-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link.href);
                const isExternalOrHash = link.href.includes('#');
                const IconComponent = link.icon;

                const itemContent = (
                  <div className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    active 
                      ? 'bg-primary/10 text-primary font-black' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-primary'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span>{link.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </div>
                );

                return !isExternalOrHash ? (
                  <Link 
                    key={link.name} 
                    to={link.href} 
                    onClick={() => setIsOpen(false)}
                    className="block"
                  >
                    {itemContent}
                  </Link>
                ) : (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    onClick={() => setIsOpen(false)}
                    className="block"
                  >
                    {itemContent}
                  </a>
                );
              })}

              {/* Mobile Actions Footer */}
              <div className="pt-3 pb-2 space-y-2.5 border-t border-slate-100 mt-2">
                <PWAInstallButton variant="compact" />

                <button
                  onClick={() => {
                    onOpenBooking();
                    setIsOpen(false);
                  }}
                  className="w-full bg-primary hover:bg-blue-800 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Booking Gedung Sekarang</span>
                </button>

                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>Masuk Portal Pengurus & Admin</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
