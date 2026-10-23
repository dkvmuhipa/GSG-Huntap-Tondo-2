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
  Info,
  CreditCard,
  Copy,
  Check,
  MessageCircle,
  Building2,
  Upload,
  Loader2,
  Eye,
  ExternalLink,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { checkCurrentAvailability, updateBookingStatus } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import CalendarModal from './ui/CalendarModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildContractDoc, buildReceiptDoc } from '../services/contractService';
import PdfPreviewModal from './ui/PdfPreviewModal';
import { useLocation } from 'react-router-dom';
import { uploadToCloudinary } from '../lib/cloudinary';
import { notifyAdminPaymentProofUploaded } from '../services/whatsappGatewayService';

interface AvailabilityWidgetProps {
  onOpenBooking?: (pkg?: string, date?: string) => void;
}

export default function AvailabilityWidget({ onOpenBooking }: AvailabilityWidgetProps) {
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
  const [copiedAccount, setCopiedAccount] = useState(false);

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
      const timer = setTimeout(() => {
        const el = document.getElementById('lacak');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  // Listen for custom event triggered by navbar clicks (even if hash is unchanged)
  useEffect(() => {
    const handleActivateTracking = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveTab('tracking');
      if (customEvent.detail?.phone) {
        const phoneStr = String(customEvent.detail.phone);
        setPhoneToTrack(phoneStr);
        const cleaned = phoneStr.replace(/\D/g, '');
        const found = [...bookings]
          .sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())
          .find(b => (b.phone || '').replace(/\D/g, '') === cleaned);
        if (found) {
          setTrackedBooking(found);
          setTrackingError('');
        }
      }
      const timer = setTimeout(() => {
        const el = document.getElementById('lacak');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };

    window.addEventListener('activate-tracking-tab', handleActivateTracking);
    return () => window.removeEventListener('activate-tracking-tab', handleActivateTracking);
  }, [bookings]);

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

  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !trackedBooking) return;

    setIsUploadingProof(true);
    setUploadSuccessMsg('');
    setUploadErrorMsg('');

    try {
      const uploadRes = await uploadToCloudinary(file);
      const proofUrl = uploadRes.url;

      await updateBookingStatus(trackedBooking.id, {
        paymentProofUrl: proofUrl,
        paymentStatus: 'verifying',
        paymentProofUploadedAt: new Date().toISOString()
      });

      // Send automated WhatsApp alert to GSG Admin via SIDOBE WA API
      notifyAdminPaymentProofUploaded(trackedBooking, proofUrl).catch(err => {
        console.warn('WhatsApp alert to admin failed:', err);
      });

      // Update local state
      setTrackedBooking({
        ...trackedBooking,
        paymentProofUrl: proofUrl,
        paymentStatus: 'verifying',
        paymentProofUploadedAt: new Date().toISOString()
      });

      setUploadSuccessMsg('Bukti transfer berhasil diunggah! Pengurus GSG Huntap Tondo 2 telah diberitahu via WhatsApp.');
    } catch (err: any) {
      console.error('Error uploading payment proof:', err);
      setUploadErrorMsg(err?.message || 'Gagal mengunggah bukti transfer. Silakan coba lagi.');
    } finally {
      setIsUploadingProof(false);
      e.target.value = '';
    }
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
        <div id="lacak" className="flex items-center justify-center mb-8 scroll-mt-28 md:scroll-mt-32">
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

            {/* Tracked Booking Card - Digital Civic Boarding Pass */}
            {trackedBooking && (() => {
              const isApproved = trackedBooking.status === 'approved';
              const isRejected = trackedBooking.status === 'rejected';
              const isPaid = trackedBooking.paymentStatus === 'paid';
              const isVerifying = trackedBooking.paymentStatus === 'verifying';

              // 4-Stage Stepper calculation
              const steps = [
                {
                  id: 1,
                  label: 'Permohonan Masuk',
                  desc: 'Formulir tercatat di sistem',
                  status: 'completed'
                },
                {
                  id: 2,
                  label: 'Verifikasi Pengurus',
                  desc: isApproved ? 'Disetujui RT 02' : isRejected ? 'Permohonan Ditolak' : 'Pemeriksaan berkas',
                  status: isApproved ? 'completed' : isRejected ? 'rejected' : 'current'
                },
                {
                  id: 3,
                  label: 'Setoran DP (30%)',
                  desc: isPaid ? 'Pembayaran Sah' : isVerifying ? 'Verifikasi Struk' : isApproved ? 'Menunggu Transfer' : 'Menunggu Persetujuan',
                  status: isPaid ? 'completed' : isVerifying ? 'current' : isApproved ? 'pending' : 'upcoming'
                },
                {
                  id: 4,
                  label: 'Serah Terima Gedung',
                  desc: isApproved && isPaid ? 'Siap Digunakan' : 'Menunggu Pelunasan',
                  status: isApproved && isPaid ? 'completed' : 'upcoming'
                }
              ];

              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 overflow-hidden text-left"
                >
                  {/* TICKET TOP HEADER: CIVIC AUTHENTICITY BADGE */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 sm:p-7 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-inner backdrop-blur-xs">
                          <Building2 className="w-6 h-6 text-blue-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                              Pas Reservasi Resmi
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <h4 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                            Gedung Serbaguna Huntap Tondo 2
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Kompleks Huntap II Tondo, Kota Palu • RT 02 / RW 01
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-2.5 backdrop-blur-sm self-start sm:self-auto">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-300 block">KODE REGISTRASI</span>
                        <span className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-wider">
                          #{trackedBooking.id?.substring(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE 4-STAGE STEPPER TIMELINE */}
                  <div className="bg-slate-50/80 px-5 sm:px-7 py-5 border-b border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3.5 flex items-center justify-between">
                      <span>Progres Alur Permohonan</span>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        isApproved ? 'bg-emerald-100 text-emerald-800' : isRejected ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isApproved ? 'STATUS: DISETUJUI' : isRejected ? 'STATUS: DITOLAK' : 'STATUS: MENUNGGU VERIFIKASI'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
                      {steps.map((st, idx) => {
                        const isDone = st.status === 'completed';
                        const isCur = st.status === 'current';
                        const isRej = st.status === 'rejected';

                        return (
                          <div 
                            key={st.id} 
                            className={`p-3 rounded-2xl border transition-all ${
                              isDone 
                                ? 'bg-white border-emerald-200 shadow-xs' 
                                : isCur 
                                  ? 'bg-blue-50/70 border-primary/30 ring-2 ring-primary/10 shadow-xs' 
                                  : isRej 
                                    ? 'bg-rose-50/70 border-rose-200' 
                                    : 'bg-white/60 border-slate-200/60 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isDone 
                                  ? 'bg-emerald-600 text-white' 
                                  : isCur 
                                    ? 'bg-primary text-white animate-pulse' 
                                    : isRej 
                                      ? 'bg-rose-600 text-white' 
                                      : 'bg-slate-200 text-slate-600'
                              }`}>
                                {isDone ? '✓' : isRej ? '✕' : st.id}
                              </span>
                              <span className="text-[11px] font-black text-slate-900 leading-tight truncate">
                                {st.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-tight pl-7 truncate">
                              {st.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PERFORATED DIVIDER NOTCHES */}
                  <div className="relative py-1 bg-white">
                    <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-50 border-r border-slate-200 shadow-inner" />
                    <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-50 border-l border-slate-200 shadow-inner" />
                    <div className="border-b-2 border-dashed border-slate-200 mx-7" />
                  </div>

                  {/* MAIN TICKET BODY: DATA SPECIFICATIONS */}
                  <div className="p-5 sm:p-7 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Pemohon</span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">{trackedBooking.customerName}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{trackedBooking.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Tanggal Acara</span>
                        <p className="font-black text-slate-900 text-sm mt-0.5">{formatDateLong(trackedBooking.startDate)}</p>
                        <span className="text-[10px] text-primary font-bold">{getDaysRemainingText(trackedBooking.startDate).text}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Keperluan Acara</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{trackedBooking.purpose || 'Kegiatan Warga'}</p>
                        <span className="text-[10px] text-slate-400">{trackedBooking.organization || 'Penyewa Perorangan'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Total Nilai Sewa</span>
                        <p className="font-black text-primary text-base mt-0.5">
                          Rp {Number(trackedBooking.amount || 0).toLocaleString('id-ID')}
                        </p>
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : isVerifying ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPaid ? 'Lunas (Sah) ✅' : isVerifying ? 'Verifikasi Bukti ⏳' : 'Belum Lunas'}
                        </span>
                      </div>
                    </div>

                    {/* PAYMENT STUB FOR APPROVED & UNPAID BOOKINGS */}
                    {isApproved && !isPaid && (
                      <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/60">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                                Instruksi Setoran Uang Muka (DP 30%)
                              </h5>
                              <p className="text-[10px] text-amber-700">
                                Kunci kepastian jadwal sewa gedung Anda maksimal 3 hari setelah disetujui.
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-950 self-start sm:self-auto">
                            Tenggat: H+3 Disetujui
                          </span>
                        </div>

                        {/* Nominal Breakdown Split */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Nominal DP Wajib (30%)</span>
                            <p className="text-lg font-black text-amber-700 leading-tight mt-0.5">
                              Rp {Math.round(Number(trackedBooking.amount || 0) * 0.3).toLocaleString('id-ID')}
                            </p>
                            <span className="text-[10px] text-slate-400">Diperlukan untuk mengunci tanggal acara</span>
                          </div>
                          <div className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Sisa Pelunasan (70%)</span>
                            <p className="text-sm font-bold text-slate-700 leading-tight mt-0.5">
                              Rp {Math.round(Number(trackedBooking.amount || 0) * 0.7).toLocaleString('id-ID')}
                            </p>
                            <span className="text-[10px] text-slate-400">Dilunasi paling lambat H-7 pelaksanaan acara</span>
                          </div>
                        </div>

                        {/* Official BSI Account */}
                        <div className="bg-white p-4 rounded-xl border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-primary" />
                              <span className="text-xs font-black text-slate-900">Bank Syariah Indonesia (BSI)</span>
                            </div>
                            <p className="font-mono text-base font-black text-slate-900 tracking-wider mt-0.5">
                              7188 2938 19
                            </p>
                            <span className="text-[10px] text-slate-500 font-medium">a.n. Kas Gedung Serbaguna Huntap Tondo 2</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('7188293819');
                              setCopiedAccount(true);
                              setTimeout(() => setCopiedAccount(false), 2000);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer active:scale-95"
                          >
                            {copiedAccount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedAccount ? 'Nomor Tersalin' : 'Salin Nomor Rekening'}</span>
                          </button>
                        </div>

                        {/* Uploaded Proof Preview (If exists) */}
                        {trackedBooking.paymentProofUrl && (
                          <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[11px] font-black text-blue-900 block leading-tight">Bukti Transfer Telah Diunggah</span>
                                <span className="text-[10px] text-blue-600 font-medium">Bendahara pengurus sedang melakukan verifikasi mutasi bank</span>
                              </div>
                            </div>
                            <a
                              href={trackedBooking.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Struk</span>
                            </a>
                          </div>
                        )}

                        {/* Upload Action */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                            {trackedBooking.paymentProofUrl ? 'Unggah Ulang Bukti Transfer Baru' : 'Unggah Struk / Bukti Transfer Sekarang'}
                          </span>
                          <label className={`w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-400 bg-white hover:bg-amber-50/50 flex items-center justify-center gap-2 text-xs font-bold text-amber-900 cursor-pointer transition-all shadow-xs ${isUploadingProof ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isUploadingProof ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                                <span>Mengunggah & Mengirim Alert ke Pengurus...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-amber-600" />
                                <span>Pilih Foto Bukti Transfer (JPG/PNG)</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadProof}
                              disabled={isUploadingProof}
                              className="sr-only"
                            />
                          </label>
                          {uploadSuccessMsg && (
                            <p className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>{uploadSuccessMsg}</span>
                            </p>
                          )}
                          {uploadErrorMsg && (
                            <p className="text-xs text-rose-700 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>{uploadErrorMsg}</span>
                            </p>
                          )}
                        </div>

                        {/* Direct WhatsApp Confirmation Button */}
                        <a
                          href={`https://wa.me/${
                            config?.contactPhone 
                              ? (config.contactPhone.startsWith('0') ? '62' + config.contactPhone.slice(1) : config.contactPhone.replace(/\D/g, '')) 
                              : '6285961194622'
                          }?text=${encodeURIComponent(
                            `Yth. Pengelola GSG Huntap Tondo 2,\n\nSaya ingin mengonfirmasi pembayaran uang muka (DP) sewa gedung:\n• ID Registrasi: #${trackedBooking.id?.substring(0, 8).toUpperCase()}\n• Nama Pemohon: ${trackedBooking.customerName}\n• Tanggal Acara: ${trackedBooking.startDate}\n• Nominal DP: Rp ${Math.round(Number(trackedBooking.amount || 0) * 0.3).toLocaleString('id-ID')}\n${trackedBooking.paymentProofUrl ? `• Tautan Bukti: ${trackedBooking.paymentProofUrl}\n` : ''}\nMohon diverifikasi. Terima kasih.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Konfirmasi Langsung via WhatsApp Pengurus</span>
                        </a>
                      </div>
                    )}

                    {/* TICKET FOOTER: OFFICIAL VERIFICATION & PDF DOCUMENTATION */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-[10px] font-medium leading-tight">
                          Dokumen sah terbitan resmi Pengurus RT 02 Huntap Tondo 2. Dapat diverifikasi secara terbuka.
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => handlePreviewContract(trackedBooking)}
                            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-primary text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span>Surat Perjanjian Sewa</span>
                          </button>
                        )}
                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => handlePreviewReceipt(trackedBooking)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-white" />
                            <span>Kuitansi Resmi (Lunas)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </div>

      {/* Calendar Modal */}
      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        onSelectDateToBook={(dateStr) => {
          setIsCalendarOpen(false);
          onOpenBooking?.(undefined, dateStr);
        }}
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
