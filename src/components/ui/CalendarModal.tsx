import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sparkles,
  User,
  Building2,
  CalendarCheck
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../calendar.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const bookingsFromStore = useAppStore(state => state.bookings);
  const bookingsLoaded = useAppStore(state => state.isBookingsLoaded);

  const bookings = React.useMemo(() => {
    return bookingsFromStore.filter(b => b.status === 'approved' || b.status === 'completed');
  }, [bookingsFromStore]);

  const loading = !bookingsLoaded;
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [activeDateBookings, setActiveDateBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!selectedDate) {
      setActiveDateBookings([]);
      return;
    }
    
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayBookings = bookings.filter(b => b.startDate === dateStr);
    setActiveDateBookings(dayBookings);
  }, [selectedDate, bookings]);

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const hasBooking = bookings.some(b => b.startDate === dateStr);
      if (hasBooking) {
        return 'has-booking';
      }
    }
    return null;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row max-h-[92vh] z-10 my-auto"
        >
          {/* Left Side: Calendar View */}
          <div className="bg-slate-50/70 p-6 md:p-8 flex-1 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Kalender Ketersediaan</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">Cek Tanggal Kosong Gedung</p>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  type="button"
                  className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Styled Calendar Box */}
              <div className="calendar-container bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                <Calendar 
                  onChange={(val) => setSelectedDate(val as Date)} 
                  value={selectedDate}
                  tileClassName={tileClassName}
                  showNeighboringMonth={false}
                  locale="id-ID"
                />
              </div>
            </div>

            {/* Legend */}
            <div className="mt-5 flex flex-wrap items-center gap-4 px-2 pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span>Ada Acara / Terisi</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-3 h-3 rounded-full border-2 border-primary" />
                <span>Hari Ini</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span>Tersedia</span>
              </div>
            </div>
          </div>

          {/* Right Side: Selected Date Details */}
          <div className="w-full md:w-88 bg-white flex flex-col shrink-0">
            {/* Top Date Hero Header */}
            <div className="p-6 md:p-8 bg-gradient-to-br from-blue-900 via-primary to-indigo-900 text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="flex justify-between items-start mb-3 relative z-10">
                <span className="px-3 py-1 rounded-full bg-white/15 text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md">
                  Agenda Tanggal
                </span>
                <button 
                  onClick={onClose}
                  type="button"
                  className="hidden md:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-3xl font-black mb-0.5 tracking-tight relative z-10">
                {selectedDate?.getDate()}
              </h4>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider relative z-10">
                {selectedDate?.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* List of events on this date */}
            <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{selectedDate ? formatDate(selectedDate) : 'Pilih Tanggal'}</span>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Memeriksa jadwal...</p>
                  </div>
                ) : activeDateBookings.length === 0 ? (
                  <div className="py-10 text-center bg-emerald-50/60 rounded-3xl border border-emerald-100 p-6">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-emerald-950 font-black text-sm">Gedung Tersedia!</p>
                    <p className="text-[11px] text-emerald-700/80 mt-1 leading-relaxed">
                      Belum ada jadwal sewa terkonfirmasi pada tanggal ini. Siap untuk dipesan.
                    </p>
                  </div>
                ) : (
                  activeDateBookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 flex flex-col gap-2.5 hover:border-primary/20 transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-wider block">
                          {booking.purpose || 'Acara Warga'}
                        </span>
                        <p className="text-xs font-bold text-slate-800 mt-0.5">
                          Oleh: {booking.customerName}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 font-bold">
                        <span>{booking.startTime || '08:00'} - {booking.endTime || '17:00'}</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-primary font-black uppercase">
                          Terverifikasi
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Helpful footer */}
              <div className="mt-6 p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-900/70 leading-relaxed">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Jadwal di atas diperbarui secara real-time dari sistem reservasi GSG Huntap Tondo 2.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
