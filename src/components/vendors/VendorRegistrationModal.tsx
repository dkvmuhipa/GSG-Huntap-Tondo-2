import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Store, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Home, 
  Loader2 
} from 'lucide-react';
import { VENDOR_CATEGORIES, VendorCategory } from '../../types/vendor';
import { submitVendorRegistration } from '../../lib/db';
import { uploadToCloudinary } from '../../lib/cloudinary';

interface VendorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorRegistrationModal({ isOpen, onClose }: VendorRegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'catering' as VendorCategory,
    ownerName: '',
    phone: '',
    instagram: '',
    address: '',
    isHuntapResident: true,
    huntapBlock: '',
    description: '',
    servicesInput: '',
    startingPrice: '',
    priceUnit: 'paket',
    imageUrl: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.ownerName.trim() || !formData.phone.trim()) {
      setError('Mohon lengkapi Nama Usaha, Nama Pemilik, dan Nomor WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const { url } = await uploadToCloudinary(imageFile);
        finalImageUrl = url;
      }

      if (!finalImageUrl) {
        // Fallback placeholder based on category
        finalImageUrl = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
      }

      const services = formData.servicesInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      await submitVendorRegistration({
        name: formData.name.trim(),
        category: formData.category,
        ownerName: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        instagram: formData.instagram.trim() ? (formData.instagram.startsWith('@') ? formData.instagram : '@' + formData.instagram) : '',
        address: formData.address.trim() || (formData.isHuntapResident ? `Huntap Tondo 2 ${formData.huntapBlock}` : 'Kota Palu'),
        isHuntapResident: formData.isHuntapResident,
        huntapBlock: formData.huntapBlock.trim(),
        description: formData.description.trim(),
        services: services.length > 0 ? services : ['Layanan Acara', 'Konsultasi Gratis'],
        startingPrice: Number(formData.startingPrice) || 0,
        priceUnit: formData.priceUnit.trim() || 'paket',
        imageUrl: finalImageUrl,
        galleryUrls: [finalImageUrl]
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError('Gagal mengirim pendaftaran: ' + (err.message || 'Terjadi kesalahan sistem'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setError(null);
    setFormData({
      name: '',
      category: 'catering',
      ownerName: '',
      phone: '',
      instagram: '',
      address: '',
      isHuntapResident: true,
      huntapBlock: '',
      description: '',
      servicesInput: '',
      startingPrice: '',
      priceUnit: 'paket',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleResetAndClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shrink-0 relative">
            <button
              onClick={handleResetAndClose}
              type="button"
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <Store className="w-5 h-5 text-amber-300" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                Pemberdayaan Ekonomi Warga
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Daftarkan Usaha / Jasa Acara Anda</h2>
            <p className="text-xs text-blue-100/80 mt-1 max-w-lg">
              Tampilkan layanan katering, dekorasi, sound system, MUA, atau kue Anda di direktori resmi GSG Huntap Tondo 2 agar langsung ditemukan calon penyewa gedung.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 overflow-y-auto">
            {isSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-gray-900">Pendaftaran Berhasil Dikirim!</h3>
                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                  Terima kasih telah mendaftarkan usaha Anda. Tim pengelola Gedung Serbaguna Huntap Tondo 2 akan memverifikasi profil usaha Anda sebelum ditayangkan di direktori publik.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="bg-primary text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Resident of Huntap Checkbox Banner */}
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={formData.isHuntapResident}
                      onChange={(e) => setFormData(prev => ({ ...prev, isHuntapResident: e.target.checked }))}
                      className="w-5 h-5 text-emerald-600 rounded-lg focus:ring-emerald-500 border-gray-300 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-600" />
                        Usaha Dikelola oleh Warga Huntap Tondo 2
                      </span>
                      <span className="text-[10px] text-emerald-700 block">
                        Mendapatkan lencana khusus "Warga Huntap" untuk prioritas rekomendasi.
                      </span>
                    </div>
                  </label>

                  {formData.isHuntapResident && (
                    <input 
                      type="text"
                      placeholder="Contoh: Blok B-14"
                      value={formData.huntapBlock}
                      onChange={(e) => setFormData(prev => ({ ...prev, huntapBlock: e.target.value }))}
                      className="bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500/20 w-full sm:w-36"
                    />
                  )}
                </div>

                {/* Basic Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Nama Usaha / Brand *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Katering Berkah Tondo"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Kategori Layanan *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as VendorCategory }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all cursor-pointer"
                    >
                      {VENDOR_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Nama Pemilik / Pengelola *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Ibu Rahmawati"
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Nomor WhatsApp Aktif *</label>
                    <input 
                      type="tel"
                      required
                      placeholder="Contoh: 082291234567"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Estimasi Harga Mulai (Rp)</label>
                    <input 
                      type="number"
                      placeholder="Contoh: 35000"
                      value={formData.startingPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, startingPrice: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Satuan Harga</label>
                    <input 
                      type="text"
                      placeholder="Contoh: porsi, paket, hari, box"
                      value={formData.priceUnit}
                      onChange={(e) => setFormData(prev => ({ ...prev, priceUnit: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Alamat / Lokasi Lengkap</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Huntap Tondo 2, Blok B No. 18, Kota Palu"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Instagram / Akun Medsos (Opsional)</label>
                  <input 
                    type="text"
                    placeholder="Contoh: @kateringberkah.tondo"
                    value={formData.instagram}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Deskripsi & Keunggulan Layanan</label>
                  <textarea 
                    rows={3}
                    placeholder="Jelaskan menu andalan, pengalaman acara, atau keunggulan layanan Anda..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Daftar Layanan / Menu Utama (Pisahkan dengan koma)</label>
                  <input 
                    type="text"
                    placeholder="Contoh: Prasmanan Resepsi, Pondokan Kaledo, Snack Box Rapat, Pelayan Meja"
                    value={formData.servicesInput}
                    onChange={(e) => setFormData(prev => ({ ...prev, servicesInput: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary transition-all"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Foto Sampul / Portofolio Usaha</label>
                  <div className="flex items-center gap-4">
                    {imagePreview ? (
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-200 shrink-0 relative group">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setImageFile(null); setImagePreview(''); }}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl p-4 text-center transition-colors">
                        <Upload className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                        <span className="text-xs font-bold text-gray-700 block">Pilih Gambar Portofolio</span>
                        <span className="text-[10px] text-gray-400">JPG, PNG maksimal 5MB</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-4 bg-primary hover:bg-blue-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirim Data...</span>
                      </>
                    ) : (
                      <span>Kirim Pendaftaran</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
