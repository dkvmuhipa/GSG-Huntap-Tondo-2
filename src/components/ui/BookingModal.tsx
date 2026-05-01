import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar as CalendarIcon, User, Phone, FileText, Send, CheckCircle2, ChevronDown, MapPin, Building2, Users, Clock, ClipboardCheck, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { addBooking, subscribeToFacilities, subscribeToBookings } from '../../lib/db';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage?: string;
}

export default function BookingModal({ isOpen, onClose, selectedPackage }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const TERMS = [
    "Pembayaran DP minimal 30% dilakukan maksimal 3 hari setelah permohonan disetujui.",
    "Pelunasan wajib dilakukan paling lambat 7 hari sebelum hari H.",
    "Pembatalan kurang dari 7 hari sebelum acara dikenakan denda 50% dari uang muka.",
    "Penyewa wajib menjaga kebersihan dan fasilitas gedung selama acara berlangsung.",
    "Kerusakan fasilitas gedung yang disebabkan oleh kelalaian penyewa menjadi tanggung jawab penyewa.",
    "Penggunaan gedung tidak boleh melebihi batas waktu yang telah disepakati.",
    "Dilarang membawa barang berbahaya, narkotika, atau melakukan aktivitas ilegal di area gedung."
  ];

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    nik: '',
    address: '',
    organization: '',
    purpose: '',
    isPublic: true,
    startDate: '',
    startTime: '08:00',
    endTime: '17:00',
    guests: '',
    amount: 0,
    notes: '',
    packageName: '',
    agreeTerms: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const unsubFac = subscribeToFacilities((data) => {
      setPackages(data);
      if (selectedPackage) {
        const pkg = data.find(p => p.title === selectedPackage);
        if (pkg) {
          const numericPrice = parseInt(pkg.price.replace(/[^0-9]/g, '')) || 0;
          setFormData(prev => ({ 
            ...prev, 
            packageName: pkg.title, 
            amount: numericPrice 
          }));
        }
      }
    });

    const unsubBook = subscribeToBookings((data) => {
      setBookings(data);
    });

    return () => {
      unsubFac();
      unsubBook();
    };
  }, [isOpen, selectedPackage]);

  const handlePackageChange = (packageName: string) => {
    const pkg = packages.find(p => p.title === packageName);
    const numericPrice = pkg ? (parseInt(pkg.price.replace(/[^0-9]/g, '')) || 0) : 0;
    setFormData({
      ...formData,
      packageName,
      amount: numericPrice
    });
  };

  const checkCollision = (date: string, pkg: string) => {
    return bookings.some(b => 
      b.startDate === date && 
      b.packageName === pkg && 
      (b.status === 'approved' || b.status === 'completed' || b.status === 'pending')
    );
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.customerName || !formData.phone || !formData.packageName) {
        setError('Mohon lengkapi data identitas dan pilih paket.');
        return;
      }
    }
    if (step === 2) {
      if (!formData.startDate || !formData.purpose) {
        setError('Mohon tentukan tanggal dan tujuan acara.');
        return;
      }
      if (checkCollision(formData.startDate, formData.packageName)) {
        setError('Maaf, tanggal tersebut sudah dipesan untuk paket ini. Silakan pilih tanggal lain.');
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      nextStep();
      return;
    }

    if (!formData.agreeTerms) {
      setError('Anda harus menyetujui syarat & ketentuan.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addBooking({
        ...formData,
        endDate: formData.startDate, // Currently single day event
        status: 'pending',
        paymentStatus: 'unpaid',
        financeAdded: false,
        amount: Number(formData.amount) || 0,
        createdAt: new Date().toISOString()
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setStep(1);
        setFormData({
          customerName: '',
          phone: '',
          nik: '',
          address: '',
          organization: '',
          purpose: '',
          isPublic: true,
          startDate: '',
          startTime: '08:00',
          endTime: '17:00',
          guests: '',
          amount: 0,
          notes: '',
          packageName: '',
          agreeTerms: false
        });
      }, 3000);
    } catch (err: any) {
      setError('Gagal mengirimkan permohonan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden my-auto"
          >
            {isSuccess ? (
              <div className="p-12 text-center text-balance">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Permohonan Terkirim!</h3>
                <p className="text-gray-500 mb-0">Admin akan segera menghubungi Anda melalui WhatsApp untuk konfirmasi paket dan pembayaran.</p>
              </div>
            ) : (
              <>
                <div className="bg-primary p-8 text-white relative">
                  <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-2xl font-black mb-1">Permohonan Sewa Gedung</h3>
                  
                  {/* Stepper */}
                  <div className="mt-6 flex items-center gap-2">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${step >= s ? 'bg-white text-primary' : 'bg-white/10 text-white/50'}`}>
                          {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        {s < 3 && <div className={`w-8 h-0.5 rounded-full ${step > s ? 'bg-white' : 'bg-white/10'}`} />}
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[70vh] scrollbar-none">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                      <X className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {step === 1 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <User className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Langkah 1</p>
                          <h4 className="text-sm font-black text-gray-900">Identitas Pemohon</h4>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pilih Paket Sewa</label>
                        <div className="relative">
                          <select 
                            required
                            value={formData.packageName}
                            onChange={(e) => handlePackageChange(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:border-primary outline-none transition-all appearance-none font-bold text-gray-900"
                          >
                            <option value="" disabled>Pilih Fasilitas...</option>
                            {packages.map(pkg => (
                              <option key={pkg.id} value={pkg.title}>{pkg.title} - {pkg.price}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                          <input 
                            required
                            type="text"
                            placeholder="Sesuai KTP"
                            value={formData.customerName}
                            onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nomor NIK (Opsional)</label>
                          <input 
                            type="text"
                            placeholder="16 Digit NIK"
                            value={formData.nik}
                            onChange={(e) => setFormData({...formData, nik: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nomor WhatsApp</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input 
                            required
                            type="tel"
                            placeholder="08xxxxxxxxxx"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Alamat Lengkap Pemohon</label>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                          <textarea 
                            required
                            placeholder="Contoh: Jl. Huntap Tondo 2, Blok A No. 1..."
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-3 mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <Building2 className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Langkah 2</p>
                          <h4 className="text-sm font-black text-gray-900">Detail & Waktu Acara</h4>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Instansi / Organisasi (Jika Ada)</label>
                        <input 
                          type="text"
                          placeholder="Pemerintah, LSM, Komunitas, dll..."
                          value={formData.organization}
                          onChange={(e) => setFormData({...formData, organization: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Keperluan / Nama Acara</label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                          <textarea 
                            required
                            placeholder="Contoh: Resepsi Pernikahan, Seminar Nasional, dll..."
                            rows={2}
                            value={formData.purpose}
                            onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <input 
                          type="checkbox"
                          id="isPublic"
                          checked={formData.isPublic !== false}
                          onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                          className="w-4 h-4 rounded border-blue-200 text-primary focus:ring-primary/20"
                        />
                        <label htmlFor="isPublic" className="text-[10px] font-bold text-blue-900 cursor-pointer select-none">
                          Tampilkan nama acara di dashboard publik? 
                          <span className="block font-normal opacity-60">Jika tidak dicentang, hanya akan tertulis "Acara Warga (Privat)"</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tanggal Acara</label>
                          <input 
                            required
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimasi Tamu</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              required
                              type="number"
                              placeholder="Orang"
                              value={formData.guests}
                              onChange={(e) => setFormData({...formData, guests: e.target.value})}
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jam Mulai</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              required
                              type="time"
                              value={formData.startTime}
                              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Jam Selesai</label>
                          <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                              required
                              type="time"
                              value={formData.endTime}
                              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                              className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-900 focus:border-primary outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 rounded-2xl border border-green-100">
                        <ClipboardCheck className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Langkah 3</p>
                          <h4 className="text-sm font-black text-gray-900">Review & Kirim</h4>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Biaya Sewa</span>
                          <span className="text-xl font-black text-primary">Rp {formData.amount.toLocaleString('id-ID')}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase">Paket</span>
                            <p className="text-gray-900">{formData.packageName}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase">Tanggal</span>
                            <p className="text-gray-900">{formData.startDate}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase">Pemohon</span>
                            <p className="text-gray-900">{formData.customerName}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-gray-400 uppercase">Waktu</span>
                            <p className="text-gray-900">{formData.startTime} - {formData.endTime}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 border border-gray-100 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors group">
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox"
                              required
                              checked={formData.agreeTerms}
                              onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                              className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-200 transition-all checked:bg-primary checked:border-primary"
                            />
                            <CheckCircle2 className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-bold text-gray-600 block group-hover:text-gray-900 transition-colors">
                              Saya menyetujui <button type="button" onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }} className="text-primary underline hover:text-blue-700">Syarat & Ketentuan</button> penyewaan gedung yang berlaku di RT 02 Huntap Tondo.
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest text-center leading-relaxed">
                          Permohonan ini akan diverifikasi oleh Admin. Pembayaran hanya dilakukan setelah permohonan disetujui.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-4">
                    {step > 1 && (
                      <button 
                        type="button"
                        onClick={prevStep}
                        className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                      </button>
                    )}
                    
                    <button 
                      type={step === 3 ? "submit" : "button"}
                      onClick={step < 3 ? nextStep : undefined}
                      disabled={isSubmitting}
                      className={`flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${step === 3 ? 'bg-green-500 hover:bg-green-600 shadow-green-200' : 'bg-primary hover:bg-blue-800 shadow-primary/20'} text-white`}
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {step === 3 ? (
                            <>
                              <Send className="w-4 h-4" />
                              Kirim Permohonan
                            </>
                          ) : (
                            <>
                              Lanjutkan
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    Teras RT 02 Digital Ecosystem • Mendukung Transparansi Warga Huntap Tondo 2
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Terms & Conditions Detail Modal */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-black text-gray-900">Syarat & Ketentuan</h4>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Penyewaan Gedung RT 02</p>
                </div>
                <button onClick={() => setIsTermsOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-8 space-y-4 max-h-[50vh] overflow-y-auto">
                {TERMS.map((term, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="shrink-0 w-6 h-6 bg-blue-50 text-primary rounded-lg flex items-center justify-center text-[10px] font-black">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">{term}</p>
                  </div>
                ))}
              </div>
              <div className="p-8 pt-0">
                <button 
                  onClick={() => setIsTermsOpen(false)}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-blue-800 transition-all"
                >
                  Saya Mengerti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
