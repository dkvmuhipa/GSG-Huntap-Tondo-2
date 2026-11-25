import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'default-1',
    text: 'Kerja bakti warga Huntap Tondo 2 dilaksanakan pada Minggu, 12 Mei 2026 mulai pukul 07.00 WITA',
    type: 'info',
    active: true
  },
  {
    id: 'default-2',
    text: 'Gedung Serbaguna ditutup sementara untuk pemeliharaan rutin atap pada 15–16 Mei 2026',
    type: 'warning',
    active: true
  },
  {
    id: 'default-3',
    text: 'Pendaftaran Senam Sehat Minggu Pagi di halaman gedung telah dibuka, hubungi pengurus RT untuk info lanjut',
    type: 'success',
    active: true
  }
];

export default function AnnouncementTicker() {
  const config = useAppStore(state => state.config);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return sessionStorage.getItem('gsg_ticker_dismissed') !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem('gsg_ticker_dismissed', 'true');
    } catch {}
  };

  const isEnabled = config?.showAnnouncementTicker !== false;

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
    const readingTimeMs = Math.max(9000, Math.min(26000, currentText.length * 170));

    const timer = setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % announcementsList.length);
    }, readingTimeMs);

    return () => clearTimeout(timer);
  }, [currentIdx, announcementsList]);

  if (!isVisible || !isEnabled || announcementsList.length === 0) return null;

  const currentAnnouncement = announcementsList[currentIdx % announcementsList.length];

  return (
    <div className="announcement-ticker bg-[#1E40AF] text-white overflow-hidden relative border-b border-[#1D3A8A] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2 shrink-0 text-blue-100">
          <Bell className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span className="hidden sm:inline text-xs font-medium whitespace-nowrap">Info warga</span>
        </div>

        <div className="flex-1 overflow-hidden relative h-5 min-w-0 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 w-full min-w-0"
            >
              {currentAnnouncement.type === 'warning' && (
                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F59E0B] text-[#0F172A]">
                  Perhatian
                </span>
              )}
              {currentAnnouncement.type === 'success' && (
                <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded bg-[#16A34A] text-white">
                  Agenda
                </span>
              )}

              {/* Desktop View */}
              <p className="hidden sm:block text-xs font-normal text-white/95 whitespace-nowrap truncate">
                {currentAnnouncement.text}
              </p>

              {/* Mobile View */}
              <div className="flex-1 sm:hidden overflow-hidden min-w-0 flex items-center">
                {currentAnnouncement.text.length > 25 ? (
                  <div
                    className="animate-marquee-smooth text-xs font-normal text-white/95"
                    style={{
                      '--marquee-speed': `${Math.max(14, Math.min(28, currentAnnouncement.text.length * 0.22))}s`
                    } as React.CSSProperties}
                  >
                    <span>{currentAnnouncement.text}</span>
                    <span className="mx-4 text-blue-200">·</span>
                    <span>{currentAnnouncement.text}</span>
                    <span className="mx-4 text-blue-200">·</span>
                  </div>
                ) : (
                  <p className="text-xs font-normal text-white/95 whitespace-nowrap truncate">
                    {currentAnnouncement.text}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => (prev - 1 + announcementsList.length) % announcementsList.length)}
              className="p-1 text-blue-100 hover:text-white hover:bg-white/15 rounded transition-colors cursor-pointer"
              aria-label="Pengumuman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <span className="text-xs font-mono tabular-nums text-blue-100 px-1">
              {(currentIdx % announcementsList.length) + 1}/{announcementsList.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentIdx((prev) => (prev + 1) % announcementsList.length)}
              className="p-1 text-blue-100 hover:text-white hover:bg-white/15 rounded transition-colors cursor-pointer"
              aria-label="Pengumuman selanjutnya"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
          <div className="hidden sm:block w-px h-3.5 bg-white/15" />
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/15 rounded transition-colors cursor-pointer"
            aria-label="Tutup pengumuman"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
