import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { subscribeToBookings } from '../../lib/db';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    return subscribeToBookings((data) => {
      setBookings(data.filter(b => b.status === 'approved' || b.status === 'completed'));
      setLoading(false);
    });
  }, [isOpen]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { 
      weekday: 'short',
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
            className="relative bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] my-auto"
          >
            <div className="bg-primary p-8 text-white relative shrink-0">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-black mb-1">Kalender Jadwal Gedung</h3>
              <p className="text-white/70 text-sm">Daftar booking yang telah disetujui.</p>
            </div>

            <div className="p-8 overflow-y-auto flex-1 scrollbar-none">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-gray-400 font-bold text-sm">Memuat data jadwal...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-20 opacity-40">
                  <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-bold">Belum ada jadwal terdaftar.</p>
                  <p className="text-sm">Silakan lakukan pengajuan sewa.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div 
                      key={booking.id}
                      className="p-5 rounded-3xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">
                            {formatDate(booking.startDate)}
                          </p>
                          <h4 className="font-bold text-gray-900 line-clamp-1">{booking.purpose}</h4>
                          <p className="text-xs text-gray-500">Oleh: {booking.customerName}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${booking.status === 'completed' ? 'bg-gray-200 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                        {booking.status === 'completed' ? (
                          <>SELESAI</>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            FIXED
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-12 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                <p className="text-xs text-blue-900 leading-relaxed">
                  <strong>Catatan Transparansi:</strong> Jadwal yang tampil adalah yang sudah diverifikasi oleh admin. Jika hari ini kosong namun gedung terlihat digunakan, kemungkinan sedang ada pemeliharaan rutin atau acara internal warga bebas biaya.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
