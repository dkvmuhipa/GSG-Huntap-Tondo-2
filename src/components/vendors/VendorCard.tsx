import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageCircle, 
  Star, 
  CheckCircle2, 
  MapPin, 
  ExternalLink, 
  Home, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Vendor, VENDOR_CATEGORIES } from '../../types/vendor';

interface VendorCardProps {
  key?: React.Key;
  vendor: Vendor;
  onSelect: (vendor: Vendor) => void;
}

export default function VendorCard({ vendor, onSelect }: VendorCardProps) {
  const categoryMeta = VENDOR_CATEGORIES.find(c => c.id === vendor.category);

  const getWaLink = () => {
    const phone = vendor.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const text = encodeURIComponent(
      `Halo *${vendor.name}*,\n\nSaya melihat profil usaha Anda di direktori resmi *Gedung Serbaguna Huntap Tondo 2*.\nSaya berminat untuk konsultasi / menanyakan paket *${categoryMeta?.label || vendor.category}* untuk acara saya.\n\nApakah bisa mendapatkan informasi pricelist & ketersediaan tanggal? Terima kasih.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-3xl border border-gray-100/90 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 flex flex-col overflow-hidden group"
    >
      {/* Image & Top Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-100">
        <img 
          src={vendor.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'} 
          alt={vendor.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-primary shadow-md border border-white/60">
            {categoryMeta?.label || vendor.category}
          </span>

          {vendor.isHuntapResident ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
              <Home className="w-3 h-3 shrink-0" />
              <span>Warga Huntap</span>
            </span>
          ) : vendor.featured ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/95 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Mitra Unggulan</span>
            </span>
          ) : null}
        </div>

        {/* Price Tag Floating on Bottom of Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white pointer-events-none">
          <div>
            <span className="text-[10px] text-gray-200 uppercase font-semibold tracking-wider block">Mulai dari</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tight drop-shadow-sm">
                Rp {vendor.startingPrice.toLocaleString('id-ID')}
              </span>
              <span className="text-[11px] text-gray-300 font-medium">/ {vendor.priceUnit}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-white">{vendor.rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-300 font-medium">({vendor.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Vendor Name & Verification */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 
              onClick={() => onSelect(vendor)}
              className="text-base font-black text-gray-900 group-hover:text-primary transition-colors cursor-pointer line-clamp-1"
              title={vendor.name}
            >
              {vendor.name}
            </h3>
            {vendor.isVerified && (
              <span title="Mitra Terverifikasi Pengelola GSG">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              </span>
            )}
          </div>

          {/* Owner & Location */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">
              {vendor.huntapBlock ? `Huntap Tondo 2 (${vendor.huntapBlock})` : vendor.address}
            </span>
          </div>

          {/* Short Description */}
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
            {vendor.description}
          </p>

          {/* Service Pills */}
          {vendor.services && vendor.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {vendor.services.slice(0, 3).map((service, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-gray-50 text-[10px] font-bold text-gray-600 border border-gray-100"
                >
                  {service}
                </span>
              ))}
              {vendor.services.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-lg bg-gray-50 text-[9px] font-bold text-gray-400">
                  +{vendor.services.length - 3} lainnya
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-gray-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect(vendor)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Detail & Galeri</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          </button>

          <a
            href={getWaLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
            title={`Hubungi ${vendor.name} via WhatsApp`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat WA</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
