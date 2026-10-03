import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../calendar.css'; // We'll create this for custom styling

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
    if (!selectedDate) {
      setActiveDateBookings([]);
      return;
    }
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dayBookings = bookings.filter(b => b.startDate === dateStr);
    setActiveDateBookings(dayBookings);
  }, [selectedDate, bookings]);

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      const hasBooking = bookings.some(b => b.startDate === dateStr);
      if (hasBooking) {
        return 'has-booking';
      }
    }
    return null;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:items-center overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row max-h-[90vh] my-auto"
          >
            {/* Left Side: Calendar Control */}
            <div className="bg-gray-50 p-6 md:p-8 flex-1 border-r border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">Kalender Jadwal</h3>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mt-1 italic">Teras Digital Huntap 2</p>
                </div>
                <button 
                  onClick={onClose}
                  className="md:hidden w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="calendar-container bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                <Calendar 
                  onChange={(val) => setSelectedDate(val as Date)} 
                  value={selectedDate}
                  tileClassName={tileClassName}
                  showNeighboringMonth={false}
                  locale="id-ID"
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-4 px-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Ada Acara/Terisi</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <div className="w-3 h-3 rounded-full border-2 border-primary" />
                  <span>Hari Ini</span>
                </div>
              </div>
            </div>

            {/* Right Side: Details */}
            <div className="w-full md:w-80 bg-white flex flex-col">
              <div className="p-6 md:p-8 bg-primary text-white hidden md:block">
                <div className="flex justify-between items-start mb-4">
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest border border-white/20 px-4">
                    Jadwal Terverifikasi
                  </div>
                  <button 
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-2xl font-black mb-1">{selectedDate?.getDate()}</h4>
                <p className="text-white/70 text-sm font-medium">
                  {selectedDate?.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {selectedDate ? formatDate(selectedDate) : 'Pilih Tanggal'}
                </h4>

                <div className="space-y-4">
                  {loading ? (
                    <div className="py-10 text-center">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-xs text-gray-400 font-bold">Memuat...</p>
                    </div>
                  ) : activeDateBookings.length === 0 ? (
                    <div className="py-10 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <p className="text-gray-400 font-bold text-sm">Masih Kosong</p>
                      <p className="text-[10px] text-gray-400 mt-1 italic leading-relaxed px-4">Gedung tersedia untuk di-booking pada tanggal ini.</p>
                    </div>
                  ) : (
                    activeDateBookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="p-5 rounded-3xl border border-gray-100 bg-gray-50 flex flex-col gap-3"
                      >
                        <div>
                          <h5 className="font-bold text-gray-900 leading-tight mb-1">{booking.purpose}</h5>
                          <p className="text-[10px] text-gray-500 font-bold">Oleh: {booking.customerName}</p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-1 rounded-md">
                            {booking.packageTitle}
                          </span>
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${booking.status === 'completed' ? 'bg-gray-200 text-gray-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {booking.status === 'completed' ? 'Selesai' : 'Fixed'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-8 p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex items-start gap-3">
                  <Info className="w-4 h-4 text-primary shrink-0 opacity-40 mt-0.5" />
                  <p className="text-[10px] text-blue-900/60 leading-relaxed italic">
                    Jadwal di atas adalah acara publik atau sewa yang disetujui. Untuk pembersihan atau perbaikan rutin mungkin tidak tercatat di sini.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
