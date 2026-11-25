import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Menu,
  X,
  CalendarCheck,
  Search,
  PieChart,
  Image as ImageIcon,
  Store,
  FileText,
  ChevronDown,
  ChevronRight
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
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setIsMoreOpen(false);
    setIsOpen(false);
  }, [location]);

  const primaryNavLinks = [
    { name: 'Jadwal', href: '/#jadwal', icon: CalendarCheck },
    { name: 'Fasilitas & tarif', href: '/#fasilitas', icon: Building2 },
    { name: 'Lacak sewa', href: '/#lacak', icon: Search },
    { name: 'Transparansi kas', href: '/#transparansi', icon: PieChart },
  ];

  const moreNavLinks = [
    {
      name: 'Galeri gedung',
      href: '/#galeri',
      icon: ImageIcon,
      desc: 'Dokumentasi fasilitas dan kegiatan warga'
    },
    {
      name: 'Mitra UMKM warga',
      href: '/#mitra-vendor',
      icon: Store,
      desc: 'Katering, dekorasi, dan tata suara lokal'
    },
    {
      name: 'Aturan & prosedur',
      href: '/rules',
      icon: FileText,
      desc: 'Syarat sewa dan tata tertib gedung'
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

  const handleNavClick = (href: string) => {
    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      if (id === 'lacak') {
        window.dispatchEvent(new CustomEvent('activate-tracking-tab'));
      }
      if (location.pathname === '/') {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      }
    }
  };

  const isAnyMoreLinkActive = moreNavLinks.some(link => isLinkActive(link.href));

  return (
    <nav
      className={`w-full transition-colors duration-150 ${
        scrolled
          ? 'bg-[#FCFCFD]/95 backdrop-blur-sm border-b border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
          : 'bg-[#FCFCFD] border-b border-[#E5E7EB]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-3 sm:gap-4">
          {/* Quiet Brand Wordmark + Flat Mark */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 group">
            <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="text-white w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[15px] sm:text-base font-bold tracking-tight text-[#1E293B] truncate leading-none">
                GSG Huntap Tondo 2
              </span>
              <span className="text-[11px] sm:text-xs font-normal text-[#6B7280] truncate mt-1 leading-none">
                RT 02, Kota Palu
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 text-sm font-medium text-[#4B5563]">
            {primaryNavLinks.map((link) => {
              const active = isLinkActive(link.href);

              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`px-3 py-1.5 rounded-lg transition-colors duration-150 whitespace-nowrap ${
                    active
                      ? 'text-[#1E40AF] bg-[#EFF6FF]'
                      : 'hover:text-[#1E40AF] hover:bg-[#F1F5F9]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* "Lainnya" Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`px-3 py-1.5 rounded-lg transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isMoreOpen || isAnyMoreLinkActive
                    ? 'text-[#1E40AF] bg-[#EFF6FF]'
                    : 'hover:text-[#1E40AF] hover:bg-[#F1F5F9]'
                }`}
                aria-expanded={isMoreOpen}
              >
                <span>Lainnya</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#6B7280] transition-transform duration-150 ${isMoreOpen ? 'rotate-180' : ''}`}
                  strokeWidth={1.5}
                />
              </button>

              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 mt-2 w-72 bg-[#FCFCFD] rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-[#E5E7EB] p-2 z-50"
                  >
                    <div className="space-y-1">
                      {moreNavLinks.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => {
                              setIsMoreOpen(false);
                              handleNavClick(item.href);
                            }}
                            className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#F1F3F5] transition-colors duration-150 group text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F1F3F5] text-[#4B5563] group-hover:text-[#111827] flex items-center justify-center shrink-0">
                              <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#111827] leading-tight">
                                {item.name}
                              </p>
                              <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="xl:hidden mt-2 pt-2 border-t border-[#E5E7EB]">
                      <Link
                        to="/login"
                        onClick={() => setIsMoreOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F1F3F5] transition-colors"
                      >
                        <span>Portal pengurus</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Action: Quiet Admin Text Link + Single Primary Button */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <Link
              to="/login"
              className="hidden xl:inline-block text-sm font-medium text-[#4B5563] hover:text-[#111827] transition-colors whitespace-nowrap"
            >
              Portal pengurus
            </Link>

            <button
              type="button"
              onClick={onOpenBooking}
              className="hidden sm:inline-flex h-10 px-4 rounded-lg bg-[#1E40AF] hover:bg-[#1D3A8A] active:scale-[0.98] text-white text-sm font-medium transition-[background-color,transform] duration-150 items-center justify-center cursor-pointer shrink-0 whitespace-nowrap"
            >
              Ajukan sewa
            </button>

            <button
              type="button"
              className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center gap-1.5 px-2.5 text-[#111827] hover:bg-[#F1F3F5] rounded-lg transition-colors cursor-pointer shrink-0"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            >
              {isOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
              <span className="hidden sm:inline text-xs font-medium">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu (opacity/transform only, no layout height animation) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden bg-[#FCFCFD] border-b border-[#E5E7EB] px-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] max-h-[calc(100dvh-6rem)] overflow-y-auto"
          >
            <div className="py-4 space-y-1">
              {[...primaryNavLinks, ...moreNavLinks].map((link) => {
                const active = isLinkActive(link.href);
                const IconComponent = link.icon;

                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => {
                      setIsOpen(false);
                      handleNavClick(link.href);
                    }}
                    className={`min-h-[44px] flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#EFF6FF] text-[#1E40AF]'
                        : 'text-[#4B5563] hover:bg-[#F1F5F9] hover:text-[#1E40AF]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-5 flex items-center justify-center text-[#6B7280] shrink-0">
                        <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                      </span>
                      <span className="truncate">{link.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6B7280] shrink-0" strokeWidth={1.5} />
                  </Link>
                );
              })}

              <div className="pt-3 pb-2 space-y-2 border-t border-[#E5E7EB] mt-2">
                <PWAInstallButton variant="compact" />

                <button
                  type="button"
                  onClick={() => {
                    onOpenBooking();
                    setIsOpen(false);
                  }}
                  className="w-full min-h-[44px] bg-[#1E40AF] hover:bg-[#1D3A8A] active:scale-[0.98] text-white rounded-lg font-medium flex items-center justify-center text-sm transition-[background-color,transform] duration-150 cursor-pointer"
                >
                  Ajukan sewa gedung
                </button>

                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full min-h-[44px] rounded-lg bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#111827] font-medium text-sm flex items-center justify-center transition-colors"
                >
                  Portal pengurus
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
