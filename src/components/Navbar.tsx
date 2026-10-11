import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown and drawer when location changes
  useEffect(() => {
    setIsMoreOpen(false);
    setIsOpen(false);
  }, [location]);

  // 4 Core Primary Nav Links
  const primaryNavLinks = [
    { name: 'Jadwal', href: '/#jadwal', icon: CalendarCheck },
    { name: 'Fasilitas & Biaya', href: '/#fasilitas', icon: Building2 },
    { name: 'Lacak Sewa', href: '/#lacak', icon: Search },
    { name: 'Transparansi', href: '/#transparansi', icon: PieChart },
  ];

  // Secondary items tucked neatly inside "Lainnya" Dropdown
  const moreNavLinks = [
    { 
      name: 'Galeri Foto Gedung', 
      href: '/#galeri', 
      icon: ImageIcon,
      desc: 'Dokumentasi fasilitas & rekam jejak acara' 
    },
    { 
      name: 'Mitra Vendor UMKM', 
      href: '/#mitra-vendor', 
      icon: Store,
      desc: 'Katering, dekorasi, & sound system warga' 
    },
    { 
      name: 'Aturan & SOP Sewa', 
      href: '/rules', 
      icon: FileText,
      desc: 'Syarat, ketentuan, & tata tertib gedung' 
    },
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

  const isAnyMoreLinkActive = moreNavLinks.some(link => isLinkActive(link.href));

  return (
    <nav className={`w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-md shadow-slate-900/5' 
        : 'bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 gap-4">
          
          {/* Logo (Shrink-0, Crisp & Never Truncated) */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <Building2 className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col shrink-0 text-left">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors whitespace-nowrap leading-tight">
                GEDUNG SERBAGUNA
              </span>
              <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase whitespace-nowrap">
                Huntap Tondo 2
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links: 4 Core Items + 1 Sleek Dropdown */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-bold text-slate-600">
            {primaryNavLinks.map((link) => {
              const active = isLinkActive(link.href);

              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                    active 
                      ? 'text-primary bg-primary/10 font-black' 
                      : 'hover:text-primary hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}

            {/* "Lainnya" Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`px-3 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isMoreOpen || isAnyMoreLinkActive
                    ? 'text-primary bg-primary/10 font-black'
                    : 'hover:text-primary hover:bg-slate-50'
                }`}
                aria-expanded={isMoreOpen}
              >
                <span>Lainnya</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2.5 z-50 overflow-hidden"
                  >
                    <div className="space-y-1">
                      {moreNavLinks.map((item) => {
                        const IconComponent = item.icon;
                        const isInternalRoute = !item.href.includes('#');

                        const itemBody = (
                          <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer text-left">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-primary/10 text-slate-500 group-hover:text-primary flex items-center justify-center shrink-0 transition-colors mt-0.5">
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-800 group-hover:text-primary transition-colors leading-tight">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5 truncate">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        );

                        return isInternalRoute ? (
                          <Link 
                            key={item.name} 
                            to={item.href}
                            onClick={() => setIsMoreOpen(false)}
                          >
                            {itemBody}
                          </Link>
                        ) : (
                          <a 
                            key={item.name} 
                            href={item.href}
                            onClick={() => setIsMoreOpen(false)}
                          >
                            {itemBody}
                          </a>
                        );
                      })}
                    </div>

                    {/* Divider and Admin Portal Shortcut */}
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <Link
                        to="/login"
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-blue-50/80 transition-colors group text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 group-hover:text-primary transition-colors leading-tight">
                            Portal Pengurus
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                            Login Admin, Bendahara & RT 02
                          </p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Action: Clean Single Primary CTA Button */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.button
              onClick={onOpenBooking}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden sm:inline-flex bg-primary hover:bg-blue-800 text-white px-5 sm:px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-primary/25 transition-all items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Booking Sekarang</span>
            </motion.button>

            {/* Mobile Hamburger Menu Toggle */}
            <button 
              className="md:hidden p-2 text-slate-700 hover:text-primary hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer shrink-0"
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
            className="md:hidden overflow-hidden bg-white border-b border-slate-200/80 px-4 shadow-xl"
          >
            <div className="py-4 space-y-1">
              {[...primaryNavLinks, ...moreNavLinks].map((link) => {
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
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="whitespace-nowrap">{link.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
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
