import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ChevronRight, ChevronLeft, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'default-1',
    text: 'Jadwal Kerja Bakti Warga Huntap Tondo 2 akan dilaksanakan pada Minggu, 12 Mei 2026. Mohon partisipasi seluruh warga.',
    type: 'info',
    active: true
  },
  {
    id: 'default-2',
    text: 'Gedung Serbaguna akan ditutup sementara untuk pemeliharaan rutin atap pada tanggal 15-16 Mei 2026.',
    type: 'warning',
    active: true
  },
  {
    id: 'default-3',
    text: 'Pendaftaran Senam Sehat Minggu Pagi di Halaman Gedung Serbaguna telah dibuka! Hubungi Ibu RT untuk detail.',
    type: 'success',
    active: true
  }
];

export default function AnnouncementTicker() {
  const config = useAppStore(state => state.config);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Check if ticker is enabled in config (default: true)
  const isEnabled = config?.showAnnouncementTicker !== false;

  // Determine active announcements
  const announcementsList = React.useMemo(() => {
    if (config?.announcements && Array.isArray(config.announcements) && config.announcements.length > 0) {
      const active = config.announcements.filter((a: any) => a.active !== false && a.text?.trim());
      if (active.length > 0) return active;
    }
    return DEFAULT_ANNOUNCEMENTS;
  }, [config?.announcements]);

  useEffect(() => {
    if (announcementsList.length <= 1) return;

    const currentText = announcementsList[currentIdx % announcementsList.length]?.text || '';
    // Dynamic reading time so running text has ample time on mobile before rotating
    const readingTimeMs = Math.max(9000, Math.min(26000, currentText.length * 170));

    const timer = setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % announcementsList.length);
    }, readingTimeMs);

    return () => clearTimeout(timer);
  }, [currentIdx, announcementsList]);

  if (!isVisible || !isEnabled || announcementsList.length === 0) return null;

  const currentAnnouncement = announcementsList[currentIdx % announcementsList.length];

  return (
    <div className="bg-primary text-white overflow-hidden relative border-b border-white/10 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shrink-0">
          <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-bounce text-amber-300" />
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Info Warga</span>
        </div>

        <div className="flex-1 overflow-hidden relative h-5 sm:h-6 min-w-0 flex items-center">
          {/* Subtle gradient masks on mobile edges to soften clipping */}
          <div className="sm:hidden pointer-events-none absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-primary to-transparent z-10" />
          <div className="sm:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-primary to-transparent z-10" />

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex items-center gap-2 w-full min-w-0"
            >
              {currentAnnouncement.type === 'warning' && (
                <span className="shrink-0 text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-amber-950 flex items-center gap-1 shadow-sm">
                  <AlertTriangle className="w-2.5 h-2.5" /> Perhatian
                </span>
              )}
              {currentAnnouncement.type === 'success' && (
                <span className="shrink-0 text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-400 text-emerald-950 flex items-center gap-1 shadow-sm">
                  <CheckCircle className="w-2.5 h-2.5" /> Agenda
                </span>
              )}

              {/* Desktop View: Clean static text */}
              <p className="hidden sm:block text-xs font-semibold whitespace-nowrap truncate italic">
                {currentAnnouncement.text}
              </p>

              {/* Mobile View: Running text (Marquee) for long text */}
              <div className="flex-1 sm:hidden overflow-hidden min-w-0 flex items-center">
                {currentAnnouncement.text.length > 25 ? (
                  <div 
                    className="animate-marquee-smooth italic text-[11px] font-semibold text-white/95"
                    style={{
                      '--marquee-speed': `${Math.max(14, Math.min(28, currentAnnouncement.text.length * 0.22))}s`
                    } as React.CSSProperties}
                  >
                    <span>{currentAnnouncement.text}</span>
                    <span className="mx-4 text-amber-300 font-bold opacity-80">✦</span>
                    <span>{currentAnnouncement.text}</span>
                    <span className="mx-4 text-amber-300 font-bold opacity-80">✦</span>
                  </div>
                ) : (
                  <p className="text-[11px] font-semibold whitespace-nowrap italic">
                    {currentAnnouncement.text}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button 
              onClick={() => setCurrentIdx((prev) => (prev - 1 + announcementsList.length) % announcementsList.length)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
              aria-label="Pengumuman sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-[9px] sm:text-[10px] font-black opacity-60">
              {(currentIdx % announcementsList.length) + 1}/{announcementsList.length}
            </span>
            <button 
              onClick={() => setCurrentIdx((prev) => (prev + 1) % announcementsList.length)}
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
