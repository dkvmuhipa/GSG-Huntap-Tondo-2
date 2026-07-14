import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, Zap } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose} 
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
        >
          <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-xl font-black text-gray-900">Input Booking Gedung</h3>
              <p className="text-xs text-gray-500 font-bold mt-1">Sertakan detail acara dengan lengkap.</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-2xl"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nama Penyewa</label>
                <input 
                  required 
                  type="text" 
                  value={formData.customerName} 
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})} 
                  placeholder="Nama Bpk/Ibu..." 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">WhatsApp</label>
                <input 
                  required 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="08..." 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">NIK (Opsional)</label>
                <input 
                  type="text" 
                  value={formData.nik} 
                  onChange={(e) => setFormData({...formData, nik: e.target.value})} 
                  placeholder="16 Digit NIK" 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Instansi</label>
                <input 
                  type="text" 
                  value={formData.organization} 
                  onChange={(e) => setFormData({...formData, organization: e.target.value})} 
                  placeholder="Jika ada..." 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Alamat Domisili</label>
              <textarea 
                rows={2} 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                placeholder="Alamat lengkap pemohon..." 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tujuan / Nama Acara</label>
              <input 
                required 
                type="text" 
                value={formData.purpose} 
                onChange={(e) => setFormData({...formData, purpose: e.target.value})} 
                placeholder="Contoh: Resepsi Pernikahan..." 
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mulai Acara</label>
                <input 
                  required 
                  type="date" 
                  value={formData.startDate} 
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Selesai Acara (Opsional)</label>
                <input 
                  type="date" 
                  value={formData.endDate} 
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>

              {formData.startDate && formData.endDate && formData.startDate !== formData.endDate && (
                <div className="md:col-span-2 px-5 py-3 bg-blue-50 rounded-2xl flex items-center gap-3">
                  <Zap className="w-4 h-4 text-primary" />
                  <p className="text-[10px] font-bold text-primary uppercase">
                    Sewa Multi-Hari Terdeteksi: {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 3600 * 24)) + 1} Hari Terblokir
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  {formData.endDate && formData.endDate !== formData.startDate ? 'Jam Mulai (Hari Ke-1)' : 'Jam Mulai'}
                </label>
                <input 
                  type="time" 
                  value={formData.startTime} 
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})} 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                  {formData.endDate && formData.endDate !== formData.startDate ? 'Jam Selesai (Hari Terakhir)' : 'Jam Selesai'}
                </label>
                <input 
                  type="time" 
                  value={formData.endTime} 
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})} 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Estimasi Tamu</label>
                <input 
                  type="number" 
                  value={formData.guests} 
                  onChange={(e) => setFormData({...formData, guests: e.target.value})} 
                  placeholder="Orang" 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-bold text-gray-900 shadow-inner" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Biaya Sewa (Rp)</label>
                <input 
                  required 
                  type="number" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  placeholder="500000" 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:bg-white transition-all font-black text-gray-900 shadow-inner text-lg" 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-primary text-white py-5 rounded-[2rem] font-black shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all mt-4"
            >
              SIMPAN JADWAL BOOKING
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
