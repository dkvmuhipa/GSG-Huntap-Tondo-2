import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, Search, FileDown, CheckCircle, AlertTriangle } from 'lucide-react';
import { subscribeToBookings, checkCurrentAvailability, subscribeToConfig } from '../lib/db';
import CalendarModal from './ui/CalendarModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AvailabilityWidget() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [phoneToTrack, setPhoneToTrack] = useState('');
  const [trackedBooking, setTrackedBooking] = useState<any>(null);
  const [trackingError, setTrackingError] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const unsubBookings = subscribeToBookings((data) => setBookings(data));
    const unsubConfig = subscribeToConfig((data) => setConfig(data));
    return () => {
      unsubBookings();
      unsubConfig();
    };
  }, []);

  const handleTrack = () => {
    if (!phoneToTrack) return;
    setIsTracking(true);
    setTrackingError('');
    
    // Find latest booking for this phone
    const found = [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .find(b => b.phone.replace(/\D/g, '') === phoneToTrack.replace(/\D/g, ''));

    if (found) {
      setTrackedBooking(found);
    } else {
      setTrackingError('Booking tidak ditemukan untuk nomor ini.');
      setTrackedBooking(null);
    }
    setIsTracking(false);
  };

  const downloadConfirmation = (booking: any) => {
    const doc = new jsPDF();
    const margin = 20;
    
    // Header
    doc.setFillColor(30, 58, 138); // primary
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('SURAT KONFIRMASI BOOKING', margin, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`NO. REG: ${booking.id.substring(0, 8).toUpperCase()}`, margin, 30);
    doc.text(`TANGGAL TERBIT: ${new Date().toLocaleDateString('id-ID')}`, 150, 30);

    // Body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('A. INFORMASI PENYEWA', margin, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Field', 'Keterangan']],
      body: [
        ['Nama Lengkap', booking.customerName],
        ['Instansi/Tujuan', booking.purpose],
        ['No. Telepon', booking.phone],
        ['Fasilitas', booking.packageTitle],
      ],
      theme: 'grid',
      headStyles: { textColor: [100, 100, 100], fontStyle: 'bold' },
      styles: { fontSize: 10 }
    });

    doc.text('B. RINCIAN JADWAL & STATUS', margin, (doc as any).lastAutoTable.finalY + 15);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Detail', 'Keterangan']],
      body: [
        ['Tanggal Acara', new Date(booking.startDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
        ['Status Booking', booking.status.toUpperCase()],
        ['Keterangan Admin', booking.adminNotes || '-'],
      ],
      theme: 'grid',
      headStyles: { textColor: [100, 100, 100], fontStyle: 'bold' },
      styles: { fontSize: 10 }
    });

    const finalY = (doc as any).lastAutoTable.finalY;
    
    doc.setFontSize(10);
    doc.text('C. CATATAN PENTING', margin, finalY + 15);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const notes = [
      '1. Harap tunjukkan dokumen ini kepada petugas keamanan/admin saat hari pelaksanaan.',
      '2. Pembayaran harus dilunasi sesuai instruksi admin sebelum acara dimulai.',
      '3. Jaga kebersihan dan fasilitas gedung selama penggunaan.',
      '4. Segala kerusakan menjadi tanggung jawab penyewa.'
    ];
    notes.forEach((note, i) => {
      doc.text(note, margin, finalY + 22 + (i * 5));
    });

    // Signatures
    const sigY = finalY + 50;
    doc.setFont('helvetica', 'normal');
    doc.text('Disetujui Oleh,', 140, sigY);
    doc.text('Admin GSG Huntap 2', 140, sigY + 25);
    doc.setDrawColor(200, 200, 200);
    doc.line(140, sigY + 20, 190, sigY + 20);

    doc.save(`Konfirmasi_Booking_${booking.customerName.replace(/\s+/g, '_')}.pdf`);
  };

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

  return (
    <div id="jadwal" className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-100"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight">Status Ketersediaan Hari Ini</h3>
              <p className="text-sm text-gray-500">{todayStr}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm ${!isBusy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${!isBusy ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} />
              {!isBusy ? (
                '🟢 TERSEDIA'
              ) : (
                <div className="flex flex-col">
                  <span>🔴 SEDANG DIGUNAKAN</span>
                  <p className="text-[10px] opacity-70 font-normal mt-0.5">
                    {currentEvent} ({facilityName})
                  </p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-2xl font-bold text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Lihat Kalender Jadwal
            </button>
          </div>
        </motion.div>
      </div>

      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />

      {/* TRACKING SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-md">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Cek Status & Bukti Booking
              </h3>
              <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">
                Sudah mengajukan? Masukkan No. HP WhatsApp Anda untuk mengecek status dan mengunduh bukti konfirmasi resmi.
              </p>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Contoh: 08123456xxx"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold placeholder:font-normal"
                  value={phoneToTrack}
                  onChange={(e) => setPhoneToTrack(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <button 
                  onClick={handleTrack}
                  disabled={isTracking || !phoneToTrack}
                  className="absolute right-2 top-2 bottom-2 bg-primary text-white px-5 rounded-xl text-xs font-black shadow-sm disabled:opacity-50"
                >
                  CEK STATUS
                </button>
              </div>
            </div>
          </div>

          {/* TRACKING RESULT */}
          <AnimatePresence mode="wait">
            {trackedBooking && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 pt-8 border-t border-gray-100 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Status Saat Ini</p>
                    <div className="flex items-center gap-2">
                      {trackedBooking.status === 'approved' || trackedBooking.status === 'completed' ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                          <CheckCircle className="w-4 h-4" />
                          <span>{trackedBooking.status === 'approved' ? 'DISETUJUI / FIXED' : 'SELESAI'}</span>
                        </div>
                      ) : trackedBooking.status === 'rejected' ? (
                        <div className="flex items-center gap-1.5 text-red-500 font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>DITOLAK</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold animate-pulse">
                          <Clock className="w-4 h-4" />
                          <span>DALAM ANTRIAN VERIFIKASI</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">Rincian Acara</p>
                    <h5 className="font-black text-gray-900 leading-tight line-clamp-1">{trackedBooking.purpose}</h5>
                    <p className="text-xs text-gray-500 mt-1">{new Date(trackedBooking.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>

                  <div className="flex items-center justify-end">
                    {trackedBooking.status === 'approved' || trackedBooking.status === 'completed' ? (
                      <button 
                        onClick={() => downloadConfirmation(trackedBooking)}
                        className="w-full md:w-auto bg-primary text-white py-4 px-8 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <FileDown className="w-5 h-5" />
                        UNDUH BUKTI KONFIRMASI
                      </button>
                    ) : (
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 leading-relaxed italic max-w-[200px]">
                          Bukti konfirmasi dapat diunduh secara otomatis segera setelah pengajuan Anda disetujui oleh admin.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {trackingError && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center"
              >
                {trackingError}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
