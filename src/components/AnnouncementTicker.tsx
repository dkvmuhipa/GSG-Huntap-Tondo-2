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
    <div className="bg-primary text-white overflow-hidden relative border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shrink-0">
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          <span className="text-[10px] font-black uppercase tracking-widest">Info Huntap Tondo 2</span>
        </div>

        <div className="flex-1 overflow-hidden relative h-5">
          <AnimatePresence mode="wait">
            <motion.p 
              key={currentIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-xs font-bold whitespace-nowrap truncate italic"
            >
              {announcements[currentIdx].text}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentIdx((prev) => (prev - 1 + announcements.length) % announcements.length)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black opacity-50">{currentIdx + 1}/{announcements.length}</span>
            <button 
              onClick={() => setCurrentIdx((prev) => (prev + 1) % announcements.length)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
