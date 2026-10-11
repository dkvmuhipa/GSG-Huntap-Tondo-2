import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  FileDown, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Receipt,
  Sparkles,
  Filter,
  CheckCircle2,
  CalendarCheck,
  ChevronRight,
  User,
  Info
} from 'lucide-react';
import { checkCurrentAvailability } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import CalendarModal from './ui/CalendarModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildContractDoc, buildReceiptDoc } from '../services/contractService';
import PdfPreviewModal from './ui/PdfPreviewModal';
import { useLocation } from 'react-router-dom';

export default function AvailabilityWidget() {
  const bookings = useAppStore(state => state.bookings);
  const bookingsLoaded = useAppStore(state => state.isBookingsLoaded);
  const config = useAppStore(state => state.config);
  const location = useLocation();

  // Active view tab: 'events' (Agenda Acara) or 'tracking' (Lacak Booking)
  const [activeTab, setActiveTab] = useState<'events' | 'tracking'>('events');

  // Calendar Modal State
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Tracking States
  const [phoneToTrack, setPhoneToTrack] = useState('');
  const [trackedBooking, setTrackedBooking] = useState<any>(null);
  const [trackingError, setTrackingError] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  // Upcoming Events States
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'this-month' | 'next-30-days'>('all');

  // PDF Preview State
  const [pdfPreviewModal, setPdfPreviewModal] = useState<{
    isOpen: boolean;
    title: string;
    loadPdf: () => Promise<{ doc: jsPDF; filename: string }>;
  }>({
    isOpen: false,
    title: '',
    loadPdf: async () => ({ doc: new jsPDF(), filename: '' })
  });

  // Automatically activate events tab if hash is #agenda-kegiatan or tracking if #lacak
  useEffect(() => {
    if (location.hash === '#agenda-kegiatan') {
      setActiveTab('events');
    } else if (location.hash === '#lacak') {
      setActiveTab('tracking');
    }
  }, [location.hash]);

  const handlePreviewContract = (booking: any) => {
    setPdfPreviewModal({
      isOpen: true,
      title: `Surat Perjanjian Sewa - ${booking.customerName}`,
      loadPdf: () => buildContractDoc(booking)
    });
  };

  const handlePreviewReceipt = (booking: any) => {
    setPdfPreviewModal({
      isOpen: true,
      title: `Kuitansi Resmi Sewa - ${booking.customerName}`,
      loadPdf: () => buildReceiptDoc(booking)
    });
  };

  const handleTrack = () => {
    if (!phoneToTrack) return;
    setIsTracking(true);
    setTrackingError('');
    
    const cleaned = phoneToTrack.replace(/\D/g, '');
    const found = [...bookings]
      .sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())
      .find(b => (b.phone || '').replace(/\D/g, '') === cleaned);

    if (found) {
      setTrackedBooking(found);
    } else {
      setTrackingError('Permohonan booking tidak ditemukan untuk nomor ini. Pastikan nomor WhatsApp yang Anda masukkan sesuai saat pengajuan.');
      setTrackedBooking(null);
    }
    setIsTracking(false);
  };

  // Availability calculation
  const status = checkCurrentAvailability(bookings, config, 'all');
  const isBusy = status.isBusy;
  const currentEvent = status.currentBooking?.purpose || '';
  const facilityName = status.currentBooking?.packageTitle || 'Gedung Serbaguna';

  const todayStr = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Upcoming events calculation
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().split('T')[0];
    
    let filtered = bookings.filter(b => {
      const isApproved = b.status === 'approved' || b.status === 'completed';
      const isUpcomingOrToday = (b.startDate || '') >= todayIso;
      return isApproved && isUpcomingOrToday;
    });

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        const purpose = (b.isPublic !== false ? (b.purpose || '') : 'Acara Warga (Privat)').toLowerCase();
        const customer = (b.isPublic !== false ? (b.customerName || '') : 'Warga Huntap 2').toLowerCase();
        const pkg = (b.packageTitle || b.packageName || '').toLowerCase();
        return purpose.includes(term) || customer.includes(term) || pkg.includes(term);
      });
    }

    if (activeFilter === 'this-month') {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      filtered = filtered.filter(b => {
        const eventDate = new Date(b.startDate);
        return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
      });
    } else if (activeFilter === 'next-30-days') {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(today.getDate() + 30);
      const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];
      filtered = filtered.filter(b => (b.startDate || '') <= thirtyDaysLaterStr);
    }

    return filtered.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [bookings, searchTerm, activeFilter]);

  const getDaysRemainingText = (eventDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(eventDateStr);
    eventDate.setHours(0, 0, 0, 0);
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: 'Hari Ini', style: 'bg-emerald-500 text-white' };
    if (diffDays === 1) return { text: 'Besok', style: 'bg-amber-500 text-white' };
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

  return (
    <section id="jadwal" className="bg-slate-50/60 py-16 scroll-mt-20 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full mb-3">
              <CalendarCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-widest">Jadwal & Agenda Terpadu</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
              Ketersediaan & Agenda Gedung
            </h2>
            <p className="text-sm md:text-base text-gray-500 mt-2 leading-relaxed">
              Pantau jadwal terpakai hari ini, agenda kegiatan warga terverifikasi, dan lacak status reservasi Anda secara transparan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="inline-flex items-center gap-2 bg-primary hover:bg-blue-800 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-primary/25 transition-all active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Buka Kalender Lengkap</span>
            </button>
          </div>
        </div>

        {/* Status Ketersediaan Hari Ini (Hero Card) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-100 shadow-sm mb-10"
        >
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Status Operasional Hari Ini</span>
              <h3 className="font-extrabold text-lg text-gray-900 leading-snug">{todayStr}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2.5 ${!isBusy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${!isBusy ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
              {!isBusy ? (
                <span>GEDUNG TERSEDIA UNTUK DISEWA</span>
              ) : (
                <div className="text-left">
                  <span>SEDANG DIGUNAKAN</span>
                  <span className="block text-[11px] font-medium text-red-600 normal-case opacity-90">
                    {currentEvent} ({facilityName})
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Segmented Switcher Tabs */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-1 w-full max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'events'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Agenda Acara Warga</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'tracking'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Lacak Status Sewa</span>
            </button>
          </div>
        </div>

        {/* TAB 1: AGENDA ACARA MENDATANG */}
        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Filter Toolbar */}
            <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeFilter === 'all'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Semua Acara
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('this-month')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeFilter === 'this-month'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('next-30-days')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    activeFilter === 'next-30-days'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  30 Hari Kedepan
                </button>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari acara atau nama warga..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200/80 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            {/* Events Grid */}
            {upcomingEvents.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Calendar className="w-8 h-8" />
                </div>
                <h4 className="font-extrabold text-gray-900 text-base">Belum Ada Agenda Terjadwal</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Tidak ada kegiatan warga pada filter yang dipilih. Gedung siap digunakan untuk reservasi Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingEvents.map((evt) => {
                  const cal = getCalendarParts(evt.startDate);
                  const rem = getDaysRemainingText(evt.startDate);
                  const isPublic = evt.isPublic !== false;

                  return (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-white rounded-3xl p-5 border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col justify-between group"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {/* Calendar Badge */}
                        <div className="w-14 h-16 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center shrink-0 text-center shadow-md shadow-slate-900/10">
                          <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider leading-none">{cal.month}</span>
                          <span className="text-xl font-black leading-tight mt-0.5">{cal.day}</span>
                          <span className="text-[9px] text-gray-400 leading-none">{cal.weekday}</span>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${rem.style}`}>
                              {rem.text}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 truncate">
                              {evt.packageTitle || evt.packageName || 'Paket Standar'}
                            </span>
                          </div>
                          <h4 className="font-black text-sm text-gray-900 truncate group-hover:text-primary transition-colors" title={isPublic ? evt.purpose : 'Acara Warga'}>
                            {isPublic ? (evt.purpose || 'Acara Warga') : 'Acara Warga (Privat)'}
                          </h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{isPublic ? (evt.customerName || 'Warga') : 'Warga Huntap 2'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {evt.startTime || '08:00'} - {evt.endTime || 'Selesai'} WITA
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">
                          Terverifikasi
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: LACAK PENGAJUAN BOOKING */}
        {activeTab === 'tracking' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm max-w-2xl mx-auto"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-black text-xl text-gray-900">Lacak Pengajuan Sewa Anda</h3>
              <p className="text-xs text-gray-500 mt-1">
                Masukkan nomor WhatsApp yang Anda gunakan saat mengajukan permohonan sewa gedung.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={phoneToTrack}
                onChange={(e) => setPhoneToTrack(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                className="flex-1 bg-gray-50 border border-gray-200/80 rounded-2xl px-5 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              />
              <button
                type="button"
                onClick={handleTrack}
                disabled={isTracking || !phoneToTrack}
                className="px-6 py-3 rounded-2xl bg-primary hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isTracking ? 'Mencari...' : 'Lacak Status'}
              </button>
            </div>

            {trackingError && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 mb-6 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{trackingError}</span>
              </div>
            )}

            {/* Tracked Booking Card */}
            {trackedBooking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-left"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-black uppercase text-gray-400">ID Registrasi</span>
                    <p className="font-mono text-sm font-black text-gray-900">
                      #{trackedBooking.id?.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    trackedBooking.status === 'approved' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : trackedBooking.status === 'rejected' 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-amber-100 text-amber-800'
                  }`}>
                    {trackedBooking.status === 'approved' ? 'DISETUJUI' : trackedBooking.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU VERIFIKASI'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Pemohon</span>
                    <p className="font-bold text-gray-900">{trackedBooking.customerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Tanggal Acara</span>
                    <p className="font-bold text-gray-900">{formatDateLong(trackedBooking.startDate)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Keperluan</span>
                    <p className="font-medium text-gray-700">{trackedBooking.purpose || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold block">Total Biaya</span>
                    <p className="font-bold text-primary">Rp {Number(trackedBooking.amount || 0).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* Download PDF Buttons */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-end">
                  {trackedBooking.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => handlePreviewContract(trackedBooking)}
                      className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-primary text-gray-800 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Surat Perjanjian Sewa</span>
                    </button>
                  )}
                  {trackedBooking.paymentStatus === 'paid' && (
                    <button
                      type="button"
                      onClick={() => handlePreviewReceipt(trackedBooking)}
                      className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kuitansi Resmi (Lunas)</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Calendar Modal */}
      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />

      {/* PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={pdfPreviewModal.isOpen}
        onClose={() => setPdfPreviewModal(prev => ({ ...prev, isOpen: false }))}
        title={pdfPreviewModal.title}
        loadPdf={pdfPreviewModal.loadPdf}
      />
    </section>
  );
}
