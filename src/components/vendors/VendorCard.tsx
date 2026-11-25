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
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#FCFCFD] rounded-2xl border border-[#E5E7EB] hover:border-[#1E40AF]/40 transition-colors flex flex-col overflow-hidden group"
    >
      {/* Image & Top Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#F1F3F5]">
        <img 
          src={vendor.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'} 
          alt={vendor.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 via-[#111827]/10 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-md bg-[#FCFCFD]/95 text-[11px] font-semibold text-[#1E40AF] border border-[#E5E7EB]">
            {categoryMeta?.label || vendor.category}
          </span>

          {vendor.isHuntapResident ? (
            <span className="px-2.5 py-1 rounded-md bg-[#16A34A] text-white text-[11px] font-medium flex items-center gap-1">
              <Home className="w-3 h-3 shrink-0" />
              <span>Warga Huntap</span>
            </span>
          ) : vendor.featured ? (
            <span className="px-2.5 py-1 rounded-md bg-[#B45309] text-white text-[11px] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>Mitra Unggulan</span>
            </span>
          ) : null}
        </div>

        {/* Price Tag Floating on Bottom of Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white pointer-events-none">
          <div>
            <span className="text-[11px] text-[#E5E7EB] block">Mulai dari</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-mono tabular-nums font-semibold tracking-tight">
                Rp {vendor.startingPrice.toLocaleString('id-ID')}
              </span>
              <span className="text-[11px] text-[#CBD5E1]">/ {vendor.priceUnit}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#111827]/75 px-2 py-1 rounded-md border border-white/15">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-mono tabular-nums font-semibold text-white">{vendor.rating.toFixed(1)}</span>
            <span className="text-[10px] font-mono tabular-nums text-[#CBD5E1]">({vendor.reviewCount})</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Vendor Name & Verification */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 
              onClick={() => onSelect(vendor)}
              className="text-base font-semibold text-[#111827] group-hover:text-[#1E40AF] transition-colors cursor-pointer line-clamp-1"
              title={vendor.name}
            >
              {vendor.name}
            </h3>
            {vendor.isVerified && (
              <span title="Mitra Terverifikasi Pengelola GSG">
                <CheckCircle2 className="w-4 h-4 text-[#1E40AF] shrink-0 mt-0.5" />
              </span>
            )}
          </div>

          {/* Owner & Location */}
          <div className="flex items-center gap-1.5 text-xs text-[#4B5563] mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
            <span className="truncate">
              {vendor.huntapBlock ? `Huntap Tondo 2 (${vendor.huntapBlock})` : vendor.address}
            </span>
          </div>

          {/* Short Description */}
          <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed mb-4">
            {vendor.description}
          </p>

          {/* Service Pills */}
          {vendor.services && vendor.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {vendor.services.slice(0, 3).map((service, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-[#F8F9FA] text-[11px] font-medium text-[#4B5563] border border-[#E5E7EB]"
                >
                  {service}
                </span>
              ))}
              {vendor.services.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#F8F9FA] text-[10px] font-mono text-[#6B7280]">
                  +{vendor.services.length - 3} lainnya
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#E5E7EB] flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect(vendor)}
            className="flex-1 min-h-[44px] py-2.5 px-3 rounded-lg bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E5E7EB] text-[#111827] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Detail & Galeri</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>

          <a
            href={getWaLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] py-2.5 px-3.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0"
            title={`Hubungi ${vendor.name} via WhatsApp`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat WA</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
