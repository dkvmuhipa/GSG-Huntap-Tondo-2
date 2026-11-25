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
import { getLocalDateISO, getOffsetLocalDateISO, parseLocalDate, maskPhoneNumber } from '../lib/dateUtils';
import { formatWhatsAppPhoneNumber } from '../lib/whatsapp';

const normalizePhoneDigits = (raw: string): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  if (digits.startsWith('8')) return '0' + digits;
  return digits;
};

const findBookingByQuery = (bookingsList: any[], queryInput: string) => {
  const trimmed = queryInput.trim();
  if (!trimmed) return undefined;
  const sorted = [...bookingsList].sort(
    (a, b) => new Date(b.createdAt || b.startDate || 0).getTime() - new Date(a.createdAt || a.startDate || 0).getTime()
  );

  const cleanedCode = trimmed.replace(/^#/, '').replace(/^GSG-/i, '').replace(/\s+/g, '').toUpperCase();
  if (/[A-Z]/i.test(trimmed) || trimmed.startsWith('#')) {
    const byCode = sorted.find((b) => {
      const idUpper = String(b.id || '').toUpperCase();
      return (
        idUpper === cleanedCode ||
        (cleanedCode.length >= 6 && idUpper.slice(-6) === cleanedCode) ||
        (cleanedCode.length >= 8 && idUpper.slice(0, 8) === cleanedCode)
      );
    });
    if (byCode) return byCode;
  }

  const targetPhone = normalizePhoneDigits(trimmed);
  if (targetPhone.length >= 6) {
    const byPhone = sorted.find((b) => normalizePhoneDigits(b.phone) === targetPhone);
    if (byPhone) return byPhone;
  }

  return sorted.find((b) => {
    const idUpper = String(b.id || '').toUpperCase();
    return cleanedCode.length >= 6 && (idUpper === cleanedCode || idUpper.slice(-6) === cleanedCode);
  });
};

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
      const queryVal = customEvent.detail?.code || customEvent.detail?.phone;
      if (queryVal) {
        const queryStr = String(queryVal);
        setPhoneToTrack(queryStr);
        const found = findBookingByQuery(bookings, queryStr);
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
    if (!phoneToTrack.trim()) return;
    setIsTracking(true);
    setTrackingError('');

    const found = findBookingByQuery(bookings, phoneToTrack);

    if (found) {
      setTrackedBooking(found);
    } else {
      setTrackingError('Permohonan booking tidak ditemukan. Pastikan Nomor WhatsApp atau Kode Pengajuan (#GSG-XXXXXX) sesuai saat pendaftaran.');
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
    const now = new Date();
    const todayIso = getLocalDateISO(now);
    
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
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      filtered = filtered.filter(b => {
        const eventDate = parseLocalDate(b.startDate);
        return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
      });
    } else if (activeFilter === 'next-30-days') {
      const thirtyDaysLaterStr = getOffsetLocalDateISO(30, now);
      filtered = filtered.filter(b => (b.startDate || '') <= thirtyDaysLaterStr);
    }

    return filtered.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  }, [bookings, searchTerm, activeFilter]);

  const getDaysRemainingText = (eventDateStr: string) => {
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDate = parseLocalDate(eventDateStr);
    
    const diffTime = eventDate.getTime() - todayMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { text: 'Hari ini', style: 'bg-[#16A34A] text-white' };
    if (diffDays === 1) return { text: 'Besok', style: 'bg-[#B45309] text-white' };
    return { text: `${diffDays} hari lagi`, style: 'bg-[#F1F3F5] text-[#4B5563] border border-[#E5E7EB]' };
  };

  const getCalendarParts = (dateStr: string) => {
    const dateObj = parseLocalDate(dateStr);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleDateString('id-ID', { month: 'short' });
    const weekday = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
    const year = dateObj.getFullYear();
    return { day, month, weekday, year };
  };

  const formatDateLong = (dateStr: string) => {
    return parseLocalDate(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <section id="jadwal" className="bg-[#F8F9FA] py-12 sm:py-16 lg:py-20 scroll-mt-28 border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-10 text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF] mb-2">
              <CalendarCheck className="w-4 h-4" strokeWidth={1.75} />
              <span>Jadwal &amp; agenda terpadu</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] leading-tight tracking-tight">
              Ketersediaan &amp; Agenda Gedung
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] mt-2.5 leading-relaxed">
              Pantau jadwal terpakai hari ini, agenda kegiatan warga terverifikasi, dan lacak status reservasi Anda secara transparan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="w-full md:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#1E40AF] hover:bg-[#1D3A8A] text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4" strokeWidth={1.75} />
              <span>Buka Kalender Lengkap</span>
            </button>
          </div>
        </div>

        {/* Status Ketersediaan Hari Ini */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#FCFCFD] rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-5 border border-[#E5E7EB] mb-8"
        >
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-[#6B7280]">Status operasional hari ini</span>
              <h3 className="font-semibold text-base sm:text-lg text-[#111827] leading-snug mt-0.5">{todayStr}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto md:justify-end">
            <div className={`w-full md:w-auto px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-2.5 ${!isBusy ? 'bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${!isBusy ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
              {!isBusy ? (
                <span>Gedung tersedia untuk disewa</span>
              ) : (
                <div className="text-left min-w-0">
                  <span className="font-semibold">Sedang digunakan</span>
                  <span className="block text-[11px] text-[#B91C1C] opacity-90 truncate">
                    {currentEvent} ({facilityName})
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Segmented Switcher Tabs */}
        <div id="lacak" className="flex items-center justify-center mb-6 sm:mb-8 scroll-mt-28">
          <div className="bg-[#F1F3F5] p-1 rounded-xl border border-[#E5E7EB] flex items-center gap-1 w-full max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'events'
                  ? 'bg-[#FCFCFD] text-[#111827] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <CalendarCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">Agenda Acara Warga</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tracking')}
              className={`flex-1 min-h-[44px] py-2 px-3 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-[#FCFCFD] text-[#111827] shadow-xs border border-[#E5E7EB]'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">Lacak Status Sewa</span>
            </button>
          </div>
        </div>

        {/* TAB 1: AGENDA ACARA MENDATANG */}
        {activeTab === 'events' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5 sm:space-y-6"
          >
            {/* Filter Toolbar */}
            <div className="bg-[#FCFCFD] rounded-2xl p-4 border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                      : 'bg-[#F8F9FA] text-[#4B5563] border-[#E5E7EB] hover:bg-[#F1F3F5]'
                  }`}
                >
                  Semua Acara
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('this-month')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                    activeFilter === 'this-month'
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                      : 'bg-[#F8F9FA] text-[#4B5563] border-[#E5E7EB] hover:bg-[#F1F3F5]'
                  }`}
                >
                  Bulan Ini
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('next-30-days')}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                    activeFilter === 'next-30-days'
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                      : 'bg-[#F8F9FA] text-[#4B5563] border-[#E5E7EB] hover:bg-[#F1F3F5]'
                  }`}
                >
                  30 Hari Kedepan
                </button>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari acara atau nama warga..."
                  className="w-full min-h-[40px] pl-10 pr-4 py-2 bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg text-xs font-medium text-[#111827] placeholder:text-[#6B7280] focus:bg-[#FCFCFD] focus:border-[#1E40AF] outline-none transition-colors"
                />
              </div>
            </div>

            {/* Events Grid */}
            {upcomingEvents.length === 0 ? (
              <div className="bg-[#FCFCFD] rounded-2xl p-10 sm:p-12 text-center border border-[#E5E7EB]">
                <div className="w-14 h-14 bg-[#F1F3F5] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#6B7280]">
                  <Calendar className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h4 className="font-semibold text-[#111827] text-base">Belum Ada Agenda Terjadwal</h4>
                <p className="text-xs text-[#4B5563] mt-1 max-w-sm mx-auto">
                  Tidak ada kegiatan warga pada filter yang dipilih. Gedung siap digunakan untuk reservasi Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {upcomingEvents.map((evt) => {
                  const cal = getCalendarParts(evt.startDate);
                  const rem = getDaysRemainingText(evt.startDate);
                  const isPublic = evt.isPublic !== false;

                  return (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="bg-[#FCFCFD] rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] hover:border-[#1E40AF]/35 transition-colors flex flex-col justify-between group"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {/* Calendar Badge */}
                        <div className="w-14 h-16 bg-[#1E40AF] text-white rounded-xl flex flex-col items-center justify-center shrink-0 text-center">
                          <span className="text-[10px] font-mono uppercase text-blue-200 leading-none">{cal.month}</span>
                          <span className="text-xl font-mono tabular-nums font-bold leading-tight mt-0.5">{cal.day}</span>
                          <span className="text-[10px] text-blue-100 leading-none">{cal.weekday}</span>
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium font-mono tabular-nums ${rem.style}`}>
                              {rem.text}
                            </span>
                            <span className="text-[11px] text-[#6B7280] truncate">
                              {evt.packageTitle || evt.packageName || 'Paket Standar'}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-[#111827] truncate group-hover:text-[#1E40AF] transition-colors" title={isPublic ? evt.purpose : 'Acara Warga'}>
                            {isPublic ? (evt.purpose || 'Acara Warga') : 'Acara Warga (Privat)'}
                          </h4>
                          <p className="text-xs text-[#4B5563] flex items-center gap-1.5 mt-1">
                            <User className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
                            <span className="truncate">{isPublic ? (evt.customerName || 'Warga') : 'Warga Huntap 2'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-2 text-[11px] text-[#6B7280]">
                        <span className="flex items-center gap-1 font-mono tabular-nums">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          {evt.startTime || '08:00'} - {evt.endTime || 'Selesai'} WITA
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] font-medium text-[11px] shrink-0">
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#FCFCFD] rounded-2xl p-4 sm:p-8 border border-[#E5E7EB] max-w-2xl mx-auto"
          >
            <div className="text-center mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display font-semibold text-xl sm:text-2xl text-[#111827]">Lacak Pengajuan Sewa Anda</h3>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
                Masukkan nomor WhatsApp atau kode registrasi #GSG yang Anda gunakan saat pengajuan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="No. WA (08xx) atau Kode Booking (#GSG-XXXXXX)"
                value={phoneToTrack}
                onChange={(e) => setPhoneToTrack(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                className="w-full sm:flex-1 min-h-[44px] bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm font-mono text-[#111827] placeholder:font-sans placeholder:text-[#6B7280] focus:bg-[#FCFCFD] focus:border-[#1E40AF] transition-colors outline-none"
              />
              <button
                type="button"
                onClick={handleTrack}
                disabled={isTracking || !phoneToTrack}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E40AF] hover:bg-[#1D3A8A] text-white font-medium text-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isTracking ? 'Mencari...' : 'Lacak Status'}
              </button>
            </div>

            {trackingError && (
              <div className="p-4 rounded-xl bg-[#FEF2F2] text-[#B91C1C] text-xs font-medium border border-[#FECACA] mb-6 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
                <span>{trackingError}</span>
              </div>
            )}

            {/* Tracked Booking Card - Digital Civic Boarding Pass */}
            {trackedBooking && (() => {
              const isApproved = trackedBooking.status === 'approved' || trackedBooking.status === 'completed';
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl bg-[#FCFCFD] border border-[#D1D5DB] overflow-hidden text-left"
                >
                  {/* TICKET TOP HEADER: CIVIC PASS STUB */}
                  <div className="bg-[#1E3A8A] text-white p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-blue-200" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-blue-200">
                              Pas Reservasi Resmi
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                          </div>
                          <h4 className="text-base sm:text-lg font-display font-bold tracking-tight text-white leading-tight mt-0.5 truncate">
                            Gedung Serbaguna Huntap Tondo 2
                          </h4>
                          <span className="text-[11px] text-blue-200 block truncate">
                            Kompleks Huntap II Tondo, Kota Palu · RT 02 / RW 01
                          </span>
                        </div>
                      </div>

                      <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-2.5 self-start sm:self-auto shrink-0">
                        <span className="text-[10px] font-mono text-blue-100 block">Kode Pengajuan</span>
                        <span className="font-mono tabular-nums text-base sm:text-lg font-bold text-[#FCD34D] tracking-wider">
                          #GSG-{trackedBooking.id?.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE 4-STAGE STEPPER TIMELINE */}
                  <div className="bg-[#F8F9FA] px-4 sm:px-6 py-5 border-b border-[#E5E7EB]">
                    <div className="text-xs font-medium text-[#6B7280] mb-3.5 flex flex-wrap items-center justify-between gap-2">
                      <span>Progres alur permohonan</span>
                      <span className={`px-2.5 py-0.5 rounded-md font-medium text-[11px] border ${
                        isApproved
                          ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                          : isRejected
                            ? 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]'
                            : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                      }`}>
                        {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Menunggu verifikasi'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                      {steps.map((st) => {
                        const isDone = st.status === 'completed';
                        const isCur = st.status === 'current';
                        const isRej = st.status === 'rejected';

                        return (
                          <div 
                            key={st.id} 
                            className={`p-3 rounded-xl border transition-colors ${
                              isDone 
                                ? 'bg-[#FCFCFD] border-[#BBF7D0]' 
                                : isCur 
                                  ? 'bg-[#EFF6FF] border-[#1E40AF]/35' 
                                  : isRej 
                                    ? 'bg-[#FEF2F2] border-[#FECACA]' 
                                    : 'bg-[#FCFCFD]/70 border-[#E5E7EB] opacity-70'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono font-semibold shrink-0 ${
                                isDone 
                                  ? 'bg-[#16A34A] text-white' 
                                  : isCur 
                                    ? 'bg-[#1E40AF] text-white' 
                                    : isRej 
                                      ? 'bg-[#DC2626] text-white' 
                                      : 'bg-[#F1F3F5] text-[#4B5563]'
                              }`}>
                                {isDone ? '✓' : isRej ? '✕' : st.id}
                              </span>
                              <span className="text-xs font-semibold text-[#111827] leading-tight truncate">
                                {st.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#4B5563] leading-tight pl-7 truncate">
                              {st.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PERFORATED DIVIDER NOTCHES */}
                  <div className="relative py-1 bg-[#FCFCFD]">
                    <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F8F9FA] border-r border-[#D1D5DB]" />
                    <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F8F9FA] border-l border-[#D1D5DB]" />
                    <div className="border-b-2 border-dashed border-[#D1D5DB] mx-7" />
                  </div>

                  {/* MAIN TICKET BODY: DATA SPECIFICATIONS */}
                  <div className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
                      <div className="min-w-0">
                        <span className="text-[#6B7280] text-[11px] font-medium block">Pemohon</span>
                        <p className="font-semibold text-[#111827] text-sm mt-0.5 truncate">{trackedBooking.customerName}</p>
                        <span className="text-[11px] text-[#4B5563] font-mono tabular-nums">{maskPhoneNumber(trackedBooking.phone)}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[#6B7280] text-[11px] font-medium block">Tanggal Acara</span>
                        <p className="font-semibold text-[#111827] text-sm mt-0.5">{formatDateLong(trackedBooking.startDate)}</p>
                        <span className="text-[11px] text-[#1E40AF] font-medium font-mono">{getDaysRemainingText(trackedBooking.startDate).text}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[#6B7280] text-[11px] font-medium block">Keperluan Acara</span>
                        <p className="font-semibold text-[#111827] text-sm mt-0.5 truncate">{trackedBooking.purpose || 'Kegiatan Warga'}</p>
                        <span className="text-[11px] text-[#6B7280] truncate block">{trackedBooking.organization || 'Penyewa Perorangan'}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[#6B7280] text-[11px] font-medium block">Total Nilai Sewa</span>
                        <p className="font-mono tabular-nums font-semibold text-[#1E40AF] text-base mt-0.5">
                          Rp {Number(trackedBooking.amount || 0).toLocaleString('id-ID')}
                        </p>
                        <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md mt-1 border ${
                          isPaid
                            ? 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]'
                            : isVerifying
                              ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
                              : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                        }`}>
                          {isPaid ? 'Lunas (Sah)' : isVerifying ? 'Verifikasi bukti' : 'Belum lunas'}
                        </span>
                      </div>
                    </div>

                    {/* PAYMENT STUB FOR APPROVED & UNPAID BOOKINGS */}
                    {isApproved && !isPaid && (
                      <div className="p-4 sm:p-5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#FDE68A]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-semibold text-[#111827]">
                                Instruksi Setoran Uang Muka (DP 30%)
                              </h5>
                              <p className="text-[11px] text-[#B45309]">
                                Kunci kepastian jadwal sewa gedung Anda maksimal 3 hari setelah disetujui.
                              </p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono tabular-nums font-medium px-2.5 py-1 rounded-md bg-[#FEF3C7] text-[#92400E] self-start sm:self-auto shrink-0">
                            Tenggat: H+3 Disetujui
                          </span>
                        </div>

                        {/* Nominal Breakdown Split */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-[#FCFCFD] p-3.5 rounded-lg border border-[#FDE68A]">
                            <span className="text-[11px] text-[#6B7280] font-medium block">Nominal DP Wajib (30%)</span>
                            <p className="text-lg font-mono tabular-nums font-semibold text-[#B45309] leading-tight mt-0.5">
                              Rp {Math.round(Number(trackedBooking.amount || 0) * 0.3).toLocaleString('id-ID')}
                            </p>
                            <span className="text-[11px] text-[#6B7280]">Diperlukan untuk mengunci tanggal acara</span>
                          </div>
                          <div className="bg-[#FCFCFD] p-3.5 rounded-lg border border-[#FDE68A]">
                            <span className="text-[11px] text-[#6B7280] font-medium block">Sisa Pelunasan (70%)</span>
                            <p className="text-base font-mono tabular-nums font-semibold text-[#111827] leading-tight mt-0.5">
                              Rp {Math.round(Number(trackedBooking.amount || 0) * 0.7).toLocaleString('id-ID')}
                            </p>
                            <span className="text-[11px] text-[#6B7280]">Dilunasi paling lambat H-7 pelaksanaan acara</span>
                          </div>
                        </div>

                        {/* Official BSI Account */}
                        <div className="bg-[#FCFCFD] p-4 rounded-lg border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-[#1E40AF] shrink-0" />
                              <span className="text-xs font-semibold text-[#111827]">Bank Syariah Indonesia (BSI)</span>
                            </div>
                            <p className="font-mono tabular-nums text-base font-semibold text-[#111827] tracking-wider mt-0.5">
                              7188 2938 19
                            </p>
                            <span className="text-[11px] text-[#4B5563] block">a.n. Kas Gedung Serbaguna Huntap Tondo 2</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('7188293819');
                              setCopiedAccount(true);
                              setTimeout(() => setCopiedAccount(false), 2000);
                            }}
                            className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-lg bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#111827] text-xs font-medium flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                          >
                            {copiedAccount ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedAccount ? 'Nomor Tersalin' : 'Salin Nomor Rekening'}</span>
                          </button>
                        </div>

                        {/* Uploaded Proof Preview (If exists) */}
                        {trackedBooking.paymentProofUrl && (
                          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-[#1E40AF] block leading-tight">Bukti Transfer Telah Diunggah</span>
                                <span className="text-[11px] text-[#1D4ED8] block">Bendahara pengurus sedang melakukan verifikasi mutasi bank</span>
                              </div>
                            </div>
                            <a
                              href={trackedBooking.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full sm:w-auto min-h-[40px] px-3 py-1.5 rounded-lg bg-white border border-[#BFDBFE] text-[#1E40AF] hover:bg-[#EFF6FF] text-xs font-medium flex items-center justify-center gap-1 transition-colors shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Struk</span>
                            </a>
                          </div>
                        )}

                        {/* Upload Action */}
                        <div className="space-y-2">
                          <span className="text-xs font-medium text-[#4B5563] block">
                            {trackedBooking.paymentProofUrl ? 'Unggah Ulang Bukti Transfer Baru' : 'Unggah Struk / Bukti Transfer Sekarang'}
                          </span>
                          <label className={`w-full min-h-[44px] py-3 px-4 rounded-lg border-2 border-dashed border-[#D97706]/50 hover:border-[#B45309] bg-[#FCFCFD] hover:bg-white flex items-center justify-center gap-2 text-xs font-medium text-[#92400E] cursor-pointer transition-colors ${isUploadingProof ? 'opacity-50 pointer-events-none' : ''}`}>
                            {isUploadingProof ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-[#B45309]" />
                                <span>Mengunggah &amp; Mengirim Notifikasi ke Pengurus...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 text-[#B45309]" />
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
                            <p className="text-xs text-[#15803D] font-medium bg-[#F0FDF4] p-2.5 rounded-lg border border-[#BBF7D0] flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                              <span>{uploadSuccessMsg}</span>
                            </p>
                          )}
                          {uploadErrorMsg && (
                            <p className="text-xs text-[#B91C1C] font-medium bg-[#FEF2F2] p-2.5 rounded-lg border border-[#FECACA] flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                              <span>{uploadErrorMsg}</span>
                            </p>
                          )}
                        </div>

                        {/* Direct WhatsApp Confirmation Button */}
                        <a
                          href={`https://wa.me/${formatWhatsAppPhoneNumber(
                            config?.contactPhone || '+62 822-9157-8809'
                          )}?text=${encodeURIComponent(
                            `Yth. Pengelola GSG Huntap Tondo 2,\n\nSaya ingin mengonfirmasi pembayaran uang muka (DP) sewa gedung:\n• Kode Pengajuan: #GSG-${trackedBooking.id?.slice(-6).toUpperCase()}\n• Nama Pemohon: ${trackedBooking.customerName}\n• Tanggal Acara: ${trackedBooking.startDate}\n• Nominal DP: Rp ${Math.round(Number(trackedBooking.amount || 0) * 0.3).toLocaleString('id-ID')}\n${trackedBooking.paymentProofUrl ? `• Tautan Bukti: ${trackedBooking.paymentProofUrl}\n` : ''}\nMohon diverifikasi. Terima kasih.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[44px] py-2.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Konfirmasi Langsung via WhatsApp Pengurus</span>
                        </a>
                      </div>
                    )}

                    {/* TICKET FOOTER: OFFICIAL VERIFICATION & PDF DOCUMENTATION */}
                    <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-[#6B7280]">
                        <ShieldCheck className="w-4 h-4 text-[#1E40AF] shrink-0" />
                        <span className="text-[11px] leading-tight">
                          Dokumen sah terbitan resmi Pengurus RT 02 Huntap Tondo 2. Dapat diverifikasi secara terbuka.
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto justify-end">
                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => handlePreviewContract(trackedBooking)}
                            className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-lg bg-white border border-[#D1D5DB] hover:border-[#1E40AF] text-[#111827] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#1E40AF]" />
                            <span>Surat Perjanjian Sewa</span>
                          </button>
                        )}
                        {isPaid && (
                          <button
                            type="button"
                            onClick={() => handlePreviewReceipt(trackedBooking)}
                            className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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
