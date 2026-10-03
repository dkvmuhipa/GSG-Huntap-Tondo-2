import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageCircle, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Home, 
  Instagram, 
  User, 
  Phone, 
  ShieldCheck, 
  Tag, 
  Image as ImageIcon,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Vendor, VENDOR_CATEGORIES } from '../../types/vendor';

interface VendorDetailModalProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorDetailModal({ vendor, isOpen, onClose }: VendorDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen || !vendor) return null;

  const categoryMeta = VENDOR_CATEGORIES.find(c => c.id === vendor.category);

  const allImages = [
    vendor.imageUrl,
    ...(vendor.galleryUrls || [])
  ].filter(Boolean);

  const getWaLink = () => {
    const phone = vendor.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const text = encodeURIComponent(
      `Halo *${vendor.name}* (Owner: ${vendor.ownerName}),\n\nSaya melihat profil usaha Anda di direktori resmi *Gedung Serbaguna Huntap Tondo 2*.\nSaya berminat untuk konsultasi / menanyakan paket *${categoryMeta?.label || vendor.category}* untuk acara saya.\n\nApakah bisa dikirimkan rincian katalog lengkap & ketersediaan tanggalnya? Terima kasih.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const getInstagramLink = () => {
    if (!vendor.instagram) return null;
    const handle = vendor.instagram.replace('@', '').trim();
    return `https://instagram.com/${handle}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
        >
          {/* Header Image Gallery */}
          <div className="relative h-64 sm:h-80 w-full bg-slate-900 shrink-0 overflow-hidden">
            <img 
              src={allImages[activeImageIndex] || vendor.imageUrl} 
              alt={vendor.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-colors z-20"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Carousel Navigation */}
            {allImages.length > 1 && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                  className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                  className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Category & Status Badges */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none z-10">
              <span className="px-3.5 py-1.5 rounded-full bg-white text-xs font-black uppercase tracking-wider text-primary shadow-lg border border-white/60">
                {categoryMeta?.label || vendor.category}
              </span>

              {vendor.isHuntapResident && (
                <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span>Warga Huntap Tondo 2 {vendor.huntapBlock && `(${vendor.huntapBlock})`}</span>
                </span>
              )}
            </div>

            {/* Bottom Title on Image */}
            <div className="absolute bottom-4 left-6 right-6 text-white pointer-events-none z-10">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
                  {vendor.name}
                </h2>
                {vendor.isVerified && (
                  <span className="bg-blue-600/90 text-white p-1 rounded-full" title="Terverifikasi Pengelola GSG">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-200">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-300" />
                  Penanggung Jawab: <strong className="text-white">{vendor.ownerName}</strong>
                </span>
                <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md border border-white/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <strong className="text-white">{vendor.rating.toFixed(1)}</strong> ({vendor.reviewCount} ulasan)
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnail Dots if multiple images */}
          {allImages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 border-t border-slate-800">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-2 rounded-full transition-all ${activeImageIndex === idx ? 'w-6 bg-primary' : 'w-2 bg-slate-600 hover:bg-slate-500'}`}
                  aria-label={`Lihat foto ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Modal Content Scrollable Area */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
            {/* Pricing Card */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Estimasi Harga Paket</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-gray-900">
                    Rp {vendor.startingPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-bold text-gray-500">/ {vendor.priceUnit}</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  *Harga dapat disesuaikan dengan paket kebutuhan acara Anda.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={getWaLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 justify-center"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hubungi via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">Tentang Layanan</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {vendor.description}
              </p>
            </div>

            {/* Services / Menu Offered */}
            {vendor.services && vendor.services.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Layanan & Spesialisasi</h4>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {vendor.services.map((service, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact & Location Info */}
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Informasi Kontak & Lokasi</h4>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900">Alamat / Lokasi:</strong>
                    <span className="text-gray-600">{vendor.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900">Nomor Telepon / WA:</strong>
                    <span className="text-gray-600">{vendor.phone}</span>
                  </div>
                </div>

                {vendor.instagram && (
                  <div className="flex items-start gap-2">
                    <Instagram className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-gray-900">Instagram:</strong>
                      <a 
                        href={getInstagramLink() || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pink-600 font-bold hover:underline flex items-center gap-1"
                      >
                        {vendor.instagram}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900">Status Verifikasi:</strong>
                    <span className="text-blue-600 font-bold">Terverifikasi Resmi Pengelola GSG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer Footer Note */}
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
              💡 <strong>Catatan Pengelola:</strong> Direktori ini disediakan secara cuma-cuma untuk mendukung kemandirian ekonomi warga Huntap Tondo 2 dan mempermudah penyewa gedung. Segala perjanjian paket, transaksi pembayaran, dan teknis operasional dilakukan langsung antara penyewa dan pemilik usaha bersangkutan.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
