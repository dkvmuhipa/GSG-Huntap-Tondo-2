import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, Sparkles, Search, ChevronRight, Filter, AlertCircle, Info, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface Booking {
  id: string;
  startDate: string;
  endDate: string;
  purpose: string;
  customerName: string;
  packageTitle: string;
  status: string;
  isPublic?: boolean;
}

export default function UpcomingEvents() {
  const bookings = useAppStore(state => state.bookings);
  const bookingsLoaded = useAppStore(state => state.isBookingsLoaded);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'this-month' | 'next-30-days'>('all');

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Filter approved, current/future events
    let filtered = bookings.filter(b => {
      const isApproved = b.status === 'approved';
      const isUpcomingOrToday = b.startDate >= todayStr;
      return isApproved && isUpcomingOrToday;
    });

    // Apply Search Filter (by purpose or package)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        const purpose = (b.isPublic !== false ? b.purpose : 'Acara Warga (Privat)').toLowerCase();
        const customer = (b.isPublic !== false ? b.customerName : 'Warga Huntap 2').toLowerCase();
        const pkg = b.packageTitle.toLowerCase();
        return purpose.includes(term) || customer.includes(term) || pkg.includes(term);
      });
    }

    // Apply Tab Filter
    if (activeFilter === 'this-month') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-11
      filtered = filtered.filter(b => {
        const eventDate = new Date(b.startDate);
        return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
      });
    } else if (activeFilter === 'next-30-days') {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];
      filtered = filtered.filter(b => b.startDate <= thirtyDaysLaterStr);
    }

    // Sort ascending by startDate
    return filtered.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [bookings, searchTerm, activeFilter]);

  const getDaysRemainingText = (eventDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(eventDateStr);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: 'Hari Ini', style: 'bg-emerald-500 text-white shadow-emerald-100' };
    if (diffDays === 1) return { text: 'Besok', style: 'bg-amber-500 text-white shadow-amber-100' };
    return { text: `${diffDays} Hari Lagi`, style: 'bg-slate-100 text-slate-700 border border-slate-200' };
  };

  const getCalendarParts = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
    const weekday = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
    const year = dateObj.getFullYear();
    return { day, month, weekday, year };
  };

  const formatDateLong = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!bookingsLoaded) {
    return (
      <section className="bg-gradient-to-b from-gray-50 via-white to-gray-50 py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 font-bold tracking-wide">Menyelaraskan agenda kegiatan terverifikasi...</p>
        </div>
      </section>
    );
  }

  // Separate the very next event (Featured Event) from the rest, only if we are on 'all' and search is empty
  const hasFeatured = upcomingEvents.length > 0 && searchTerm === '' && activeFilter === 'all';
  const featuredEvent = hasFeatured ? upcomingEvents[0] : null;
  const remainingEvents = hasFeatured ? upcomingEvents.slice(1) : upcomingEvents;

  return (
    <section id="agenda-kegiatan" className="bg-gradient-to-b from-slate-50 via-white to-slate-50/50 py-20 scroll-mt-20 overflow-hidden relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-[-10%] w-[35rem] h-[35rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-[-10%] w-[35rem] h-[35rem] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-4 py-1.5 rounded-full mb-4"
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-black text-primary uppercase tracking-widest">Informasi Publik</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight"
            >
              Agenda Kegiatan Terdekat
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base text-gray-500 mt-3 leading-relaxed"
            >
              Jadwal pelaksanaan kegiatan sosial, keagamaan, musyawarah, pernikahan, dan acara warga yang telah terverifikasi oleh pengelola.
            </motion.p>
          </div>

          {/* Quick Action */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="shrink-0"
          >
            <a 
              href="#katalog-paket"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-gray-800 font-bold text-xs px-5 py-3 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:scale-[1.01]"
            >
              <Calendar className="w-4 h-4 text-primary" />
              Sewa Gedung Sekarang
            </a>
          </motion.div>
        </div>

        {/* Toolbar: Filters & Search bar */}
        <div className="bg-white rounded-3xl p-4 mb-10 border border-slate-100 shadow-md shadow-slate-100/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeFilter === 'all'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Agenda
            </button>
            <button
              onClick={() => setActiveFilter('this-month')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeFilter === 'this-month'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setActiveFilter('next-30-days')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                activeFilter === 'next-30-days'
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              30 Hari Terdekat
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari acara atau paket sewa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-medium text-slate-800 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Content Layout */}
        <AnimatePresence mode="wait">
          {upcomingEvents.length === 0 ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-16 text-center max-w-2xl mx-auto border border-slate-100 shadow-xl shadow-slate-100/30"
            >
              <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/10">
                <Calendar className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-extrabold text-gray-900 text-xl">Tidak Ada Agenda Ditemukan</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-3 leading-relaxed max-w-md mx-auto">
                {searchTerm 
                  ? 'Tidak ada kegiatan terverifikasi yang cocok dengan pencarian Anda. Silakan coba kata kunci lain.' 
                  : 'Saat ini belum ada agenda kegiatan terverifikasi untuk kategori ini. Ingin menyelenggarakan acara di sini?'}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a 
                  href="#katalog-paket"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white font-black text-xs px-8 py-4 rounded-2xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  PILIH PAKET SEWA
                </a>
                {searchTerm && (
                  <button
                    onClick={() => { setSearchTerm(''); setActiveFilter('all'); }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs px-6 py-4 rounded-2xl transition-all"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">
              
              {/* Highlight / Featured Event Block */}
              {featuredEvent && (
                <motion.div
                  key={`featured-${featuredEvent.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-700/30"
                >
                  {/* Glowing background circles */}
                  <div className="absolute top-[-50%] right-[-10%] w-[30rem] h-[30rem] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
                  <div className="absolute bottom-[-50%] left-[-10%] w-[30rem] h-[30rem] rounded-full bg-indigo-500/15 blur-[100px] pointer-events-none" />

                  <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                    {/* Event Main Details */}
                    <div className="flex-1 space-y-5">
                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-[10px] tracking-wider uppercase px-4 py-1.5 rounded-full shadow-md shadow-primary/30">
                          ACARA TERDEKAT BERIKUTNYA
                        </span>
                        <span className="bg-white/10 backdrop-blur-md text-slate-200 border border-white/10 font-bold text-[10px] tracking-wide uppercase px-3.5 py-1.5 rounded-full">
                          {featuredEvent.packageTitle}
                        </span>
                        <span className="bg-emerald-500 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          {getDaysRemainingText(featuredEvent.startDate).text}
                        </span>
                      </div>

                      {/* Main Title */}
                      <div>
                        <h3 className="font-black text-2xl md:text-4xl text-white leading-tight tracking-tight">
                          {featuredEvent.isPublic !== false ? featuredEvent.purpose : 'Acara Kemasyarakatan (Privat)'}
                        </h3>
                        <p className="text-slate-300 font-medium text-xs md:text-sm mt-2 flex items-center gap-2">
                          Penyelenggara: <span className="text-white font-bold">{featuredEvent.isPublic !== false ? featuredEvent.customerName : 'Warga Huntap 2'}</span>
                        </p>
                      </div>

                      {/* Info Footer Block */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm">
                        <div className="flex items-center gap-3 text-slate-300">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                            <Calendar className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Tanggal & Hari</p>
                            <p className="font-bold text-white text-xs md:text-sm">{formatDateLong(featuredEvent.startDate)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-slate-300">
                          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                            <MapPin className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Tempat Pelaksanaan</p>
                            <p className="font-bold text-white text-xs md:text-sm">Gedung Serbaguna Huntap 2 Tondo</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Left/Right Visual: Dynamic Calendar Sheet */}
                    <div className="w-full lg:w-auto shrink-0 flex justify-center lg:justify-end">
                      {(() => {
                        const cal = getCalendarParts(featuredEvent.startDate);
                        return (
                          <div className="w-32 md:w-36 bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center border border-slate-100">
                            <div className="w-full bg-primary py-3 text-center text-white font-black tracking-widest text-xs md:text-sm">
                              {cal.month}
                            </div>
                            <div className="py-5 md:py-7 flex flex-col items-center">
                              <span className="text-4xl md:text-5xl font-black text-slate-900 leading-none">
                                {cal.day}
                              </span>
                              <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                {cal.weekday}
                              </span>
                              <span className="text-[9px] font-semibold text-slate-300 mt-1">
                                {cal.year}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Grid of Other/All Events */}
              {remainingEvents.length > 0 && (
                <div className="space-y-6">
                  {hasFeatured && (
                    <h4 className="font-extrabold text-sm md:text-base text-gray-700 tracking-wider uppercase flex items-center gap-2 mb-4">
                      <ChevronRight className="w-5 h-5 text-primary" />
                      Agenda Kegiatan Selanjutnya
                    </h4>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingEvents.map((event, index) => {
                      const countdown = getDaysRemainingText(event.startDate);
                      const cal = getCalendarParts(event.startDate);
                      const displayPurpose = event.isPublic !== false 
                        ? event.purpose 
                        : 'Acara Warga (Privat)';
                      const displayCustomer = event.isPublic !== false 
                        ? event.customerName 
                        : 'Warga Huntap 2';

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 25 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white rounded-[2.5rem] border border-slate-100 hover:border-primary/20 p-5 flex items-start gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                          {/* Calendar block on the left */}
                          <div className="w-16 shrink-0 bg-slate-50/70 border border-slate-100 rounded-2xl overflow-hidden flex flex-col items-center group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
                            <div className="w-full bg-slate-200 group-hover:bg-primary text-center py-1 text-slate-600 group-hover:text-white font-black text-[9px] uppercase tracking-wider transition-colors">
                              {cal.month}
                            </div>
                            <div className="py-2.5 flex flex-col items-center">
                              <span className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors">
                                {cal.day}
                              </span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {cal.weekday}
                              </span>
                            </div>
                          </div>

                          {/* Info block on the right */}
                          <div className="flex-1 flex flex-col justify-between min-h-[110px]">
                            <div>
                              {/* Header badges */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100 line-clamp-1 max-w-[110px]">
                                  {event.packageTitle}
                                </span>
                                <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${countdown.style}`}>
                                  {countdown.text}
                                </span>
                              </div>

                              {/* Title */}
                              <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors" title={displayPurpose}>
                                {displayPurpose}
                              </h4>

                              {/* Owner */}
                              <p className="text-[10px] text-gray-400 font-medium">
                                Oleh: <span className="font-bold text-gray-600">{displayCustomer}</span>
                              </p>
                            </div>

                            {/* Place Details */}
                            <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center gap-1.5 text-[10px] text-gray-400">
                              <MapPin className="w-3.5 h-3.5 text-gray-300" />
                              <span className="line-clamp-1">Huntap 2 Tondo</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
        
        {/* Footnote information banner */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-indigo-800/90 max-w-3xl mx-auto"
        >
          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Catatan Transparansi:</strong> Demi menghormati privasi warga, beberapa kegiatan pribadi di daftar agenda ini hanya tertulis sebagai <strong>Acara Warga (Privat)</strong>. Jam operasional dan konfirmasi lengkap dapat diakses secara resmi oleh pengelola gedung.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
