import React from 'react';
import { motion } from 'motion/react';
import { Building2, MessageCircle, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const navLinks = [
    { name: 'Jadwal', href: '/#jadwal' },
    { name: 'Agenda Acara', href: '/#agenda-kegiatan' },
    { name: 'Mitra Vendor', href: '/#mitra-vendor' },
    { name: 'Transparansi', href: '/#transparansi' },
    { name: 'Galeri', href: '/#galeri' },
    { name: 'Aturan', href: '/rules' },
  ];

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
              <Building2 className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg md:text-xl font-black tracking-tight text-primary truncate leading-tight">
                GEDUNG SERBAGUNA
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 tracking-wider uppercase truncate">
                Huntap Tondo 2
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            {navLinks.map((link) => (
              link.href.startsWith('/') && !link.href.includes('#') ? (
                <Link 
                  key={link.name} 
                  to={link.href}
                  className="hover:text-primary transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ) : (
                <a 
                  key={link.name} 
                  href={link.href}
                  className="hover:text-primary transition-colors duration-200"
                >
                  {link.name}
                </a>
              )
            ))}
          </div>

          {/* Booking Button, PWA Install & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <PWAInstallButton variant="navbar" />

            <motion.button
              onClick={onOpenBooking}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex bg-primary hover:bg-blue-800 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200 items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Booking Sekarang
            </motion.button>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors rounded-xl hover:bg-gray-100"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <motion.div
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="md:hidden overflow-hidden bg-white border-b border-gray-100 px-4"
      >
        <div className="py-4 space-y-2">
          {navLinks.map((link) => (
            link.href.startsWith('/') && !link.href.includes('#') ? (
              <Link 
                key={link.name} 
                to={link.href}
                className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-primary rounded-xl transition-all"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ) : (
              <a 
                key={link.name} 
                href={link.href}
                className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-primary rounded-xl transition-all"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            )
          ))}

          <div className="pt-2 space-y-2 sm:hidden">
            <PWAInstallButton variant="compact" />
            <button
              onClick={() => {
                onOpenBooking();
                setIsOpen(false);
              }}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Booking Sekarang
            </button>
          </div>
        </div>
      </motion.div>
    </nav>
  );
}
