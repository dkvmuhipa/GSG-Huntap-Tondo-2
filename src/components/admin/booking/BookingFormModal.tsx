import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  MapPin, 
  Building2, 
  Zap, 
  ChevronDown,
  CalendarCheck,
  FileText
} from 'lucide-react';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export default function BookingFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
}: BookingFormModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 16 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 16 }} 
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[92vh] z-10 border border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/50 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Input Jadwal Booking</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Catat jadwal pemakaian gedung oleh warga atau instansi.</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              type="button"
              className="p-2.5 hover:bg-white text-slate-400 hover:text-slate-600 transition-all rounded-xl border border-transparent hover:border-slate-200"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            {/* Section 1: Customer Profile */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Data Pemohon & Penyelenggara</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama Penyewa <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required 
                      type="text" 
                      value={formData.customerName} 
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
                      placeholder="Nama lengkap pemohon..." 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      required 
                      type="tel" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      placeholder="08xxxxxxxxxx" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    NIK KTP (Opsional)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.nik || ''} 
                      onChange={(e) => setFormData({...formData, nik: e.target.value})} 
                      placeholder="16 Digit NIK" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kategori Penyelenggara
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <select 
                      required
                      value={formData.organizerType || 'Perorangan / Keluarga'}
                      onChange={(e) => setFormData({...formData, organizerType: e.target.value})}
                      className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-800 appearance-none text-xs sm:text-sm outline-none cursor-pointer"
                    >
                      <option value="Perorangan / Keluarga">Perorangan / Keluarga</option>
                      <option value="Instansi Pemerintah">Instansi Pemerintah</option>
                      <option value="Organisasi Kemasyarakatan / Komunitas">Organisasi / Komunitas</option>
                      <option value="Swasta / Perusahaan / Komersil">Swasta / Komersil</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Kepanitiaan / Komunitas (Opsional)
                </label>
                <input 
                  type="text" 
                  value={formData.organizerName || ''} 
                  onChange={(e) => setFormData({...formData, organizerName: e.target.value, organization: e.target.value})} 
                  placeholder="Contoh: Panitia HUT RI Huntap 2 / Keluarga Besar..." 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Alamat Domisili Pemohon
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea 
                    rows={2} 
                    value={formData.address || ''} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})} 
                    placeholder="Contoh: Huntap Tondo 2, Blok B No. 12..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none resize-none" 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Event Details & Schedule */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Jadwal & Tujuan Pemakaian</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tujuan / Judul Acara <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    value={formData.purpose} 
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})} 
                    placeholder="Contoh: Resepsi Pernikahan, Rapat Koordinasi, Turnamen Bulutangkis..." 
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Mulai Acara <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    required 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tanggal Selesai (Opsional)
                  </label>
                  <input 
                    type="date" 
                    value={formData.endDate || ''} 
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                  />
                </div>

                {formData.startDate && formData.endDate && formData.startDate !== formData.endDate && (
                  <div className="sm:col-span-2 px-4 py-2.5 bg-blue-50 border border-blue-200/80 rounded-2xl flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-[11px] font-black text-primary uppercase tracking-wide">
                      Durasi Multi-Hari: {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 3600 * 24)) + 1} Hari Pemakaian Gedung
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jam Mulai
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="time" 
                      value={formData.startTime || '08:00'} 
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})} 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Jam Selesai
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="time" 
                      value={formData.endTime || '17:00'} 
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})} 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Capacity & Pricing */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
                <span>Kapasitas & Kesepakatan Biaya</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimasi Jumlah Tamu
                  </label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      value={formData.guests || ''} 
                      onChange={(e) => setFormData({...formData, guests: e.target.value})} 
                      placeholder="Contoh: 300" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-900 text-xs sm:text-sm outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Biaya Sewa (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs sm:text-sm">Rp</span>
                    <input 
                      required 
                      type="number" 
                      value={formData.amount} 
                      onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                      placeholder="1500000" 
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-black text-slate-900 text-sm sm:text-base outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider rounded-2xl transition-all active:scale-[0.98]"
              >
                Batal
              </button>

              <button 
                type="submit" 
                className="flex-2 py-4 bg-primary hover:bg-blue-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Simpan Jadwal Booking</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
