import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ChevronRight, ChevronLeft, X } from 'lucide-react';

const announcements = [
  {
    id: 1,
    text: 'Jadwal Kerja Bakti Warga Huntap Tondo 2 akan dilaksanakan pada Minggu, 12 Mei 2026. Mohon partisipasi seluruh warga.',
    type: 'info'
  },
  {
    id: 2,
    text: 'Gedung Serbaguna akan ditutup sementara untuk pemeliharaan rutin atap pada tanggal 15-16 Mei 2026.',
    type: 'warning'
  },
  {
    id: 3,
    text: 'Pendaftaran Senam Sehat Minggu Pagi di Halaman Gedung Serbaguna telah dibuka! Hubungi Ibu RT untuk detail.',
    type: 'success'
  }
];

export default function AnnouncementTicker() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % announcements.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="bg-primary text-white overflow-hidden relative border-b border-white/10 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shrink-0">
          <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-bounce text-amber-300" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Info Warga</span>
        </div>

        <div className="flex-1 overflow-hidden relative h-5 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p 
              key={currentIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-[11px] sm:text-xs font-semibold whitespace-nowrap truncate italic"
            >
              {announcements[currentIdx].text}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button 
              onClick={() => setCurrentIdx((prev) => (prev - 1 + announcements.length) % announcements.length)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
              aria-label="Pengumuman sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-[9px] sm:text-[10px] font-black opacity-60">{currentIdx + 1}/{announcements.length}</span>
            <button 
              onClick={() => setCurrentIdx((prev) => (prev + 1) % announcements.length)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
              aria-label="Pengumuman selanjutnya"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="w-px h-3.5 bg-white/20 mx-0.5" />
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
            aria-label="Tutup info"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
