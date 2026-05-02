import React from 'react';
import { motion } from 'motion/react';
import { Building2, MessageCircle } from 'lucide-react';

import { Link } from 'react-router-dom';

interface NavbarProps {
  onOpenBooking: () => void;
}

export default function Navbar({ onOpenBooking }: NavbarProps) {
  const navLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Punya Aturan?', href: '/rules' },
    { name: 'Cek Jadwal', href: '/#jadwal' },
    { name: 'Transparansi', href: '/#transparansi' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">GEDUNG SERBAGUNA</span>
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

          {/* Booking Button */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onOpenBooking}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary hover:bg-blue-800 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-primary/20 transition-all duration-200 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Booking Sekarang
            </motion.button>
          </div>
        </div>
      </div>
    </nav>
  );
}
