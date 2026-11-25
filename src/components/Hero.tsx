import React from 'react';
import { motion } from 'motion/react';
import { Calendar, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface HeroProps {
  onOpenBooking: () => void;
}

export default function Hero({ onOpenBooking }: HeroProps) {
  const config = useAppStore(state => state.config);

  const badgeLocation = config?.heroBadgeLocation || 'Kawasan Huntap Tondo 2, Palu';
  const badgeCategory = config?.heroBadgeCategory || 'Balai warga RT 02';
  const title = config?.heroTitle || 'Ruang warga terpadu,';
  const subtitle = config?.heroSubtitle || 'tercatat rapi dan terbuka.';
  const tagline =
    config?.heroTagline ||
    'Dari akad nikah, resepsi adat, hingga musyawarah warga. Aula serbaguna berkapasitas hingga 300 tamu yang dikelola secara mandiri, transparan, dan terbuka untuk umum.';
  const imageUrl = config?.heroImageUrl || '/hero-gsg-tondo2.webp';
  const imageCaption = config?.heroImageCaption || 'Aula utama dengan tata suara 5.000 W dan ruang duduk fleksibel';
  const statCapacity = config?.heroStatCapacity || '300';
  const statAudio = config?.heroStatAudio || '5.000 W';
  const statTransparency = config?.heroStatTransparency || '100%';

  return (
    <section className="relative pt-28 sm:pt-36 lg:pt-40 pb-12 sm:pb-20 bg-[#F8F9FA] border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-center">
          {/* LEFT COLUMN: CIVIC THESIS & TWO ACTIONS */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 text-left min-w-0"
          >
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-semibold text-[#1E40AF] mb-4">
              {badgeLocation} · {badgeCategory}
            </p>

            <h1 className="font-display text-[clamp(2rem,7.2vw,3.75rem)] font-extrabold leading-[1.08] sm:leading-[1.04] tracking-tight text-[#1E293B] mb-4 sm:mb-5">
              {title}{' '}
              <span className="block text-[#1E40AF]">{subtitle.replace(/\.$/, '')}</span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#4B5563] mb-6 sm:mb-8 max-w-[34rem] leading-relaxed font-normal">
              {tagline}
            </p>

            {/* Primary & Secondary Action Row + Quiet Inline Link */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
              <button
                type="button"
                onClick={onOpenBooking}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#1E40AF] hover:bg-[#1D3A8A] active:scale-[0.98] text-white px-6 py-3 rounded-[10px] font-medium text-sm transition-[background-color,transform] duration-150 cursor-pointer"
              >
                <Calendar className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>Ajukan sewa gedung</span>
                <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              </button>

              <a
                href="#jadwal"
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center bg-[#F1F3F5] hover:bg-[#E5E7EB] active:scale-[0.98] text-[#111827] border border-[#E5E7EB] px-5 py-3 rounded-[10px] font-medium text-sm transition-[background-color,transform] duration-150 cursor-pointer"
              >
                Cek jadwal &amp; lacak
              </a>
            </div>

            <div className="mb-8 sm:mb-10">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('activate-tracking-tab'))}
                className="min-h-[36px] inline-flex items-center text-xs font-medium text-[#1E40AF] hover:underline cursor-pointer text-left"
              >
                Sudah punya kode booking? Lacak pas reservasi →
              </button>
            </div>

            {/* Civic Specification Strip */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 pt-5 sm:pt-6 border-t border-[#E5E7EB] max-w-md text-left">
              <div className="min-w-0">
                <span className="font-mono tabular-nums text-lg sm:text-2xl font-bold text-[#1E293B] block leading-tight">
                  {statCapacity}
                </span>
                <span className="text-[11px] sm:text-xs text-[#6B7280] mt-1 block">Kapasitas tamu</span>
              </div>
              <div className="min-w-0 border-l border-[#E5E7EB] pl-2.5 sm:pl-4">
                <span className="font-mono tabular-nums text-lg sm:text-2xl font-bold text-[#1E293B] block leading-tight">
                  {statAudio}
                </span>
                <span className="text-[11px] sm:text-xs text-[#6B7280] mt-1 block">Tata suara</span>
              </div>
              <div className="min-w-0 border-l border-[#E5E7EB] pl-2.5 sm:pl-4">
                <span className="font-mono tabular-nums text-lg sm:text-2xl font-bold text-[#1E40AF] block leading-tight">
                  {statTransparency}
                </span>
                <span className="text-[11px] sm:text-xs text-[#6B7280] mt-1 block">Kas terbuka</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: SINGLE CLEAN ARCHITECTURAL VISUAL */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 min-w-0"
          >
            <figure className="rounded-2xl overflow-hidden bg-[#FCFCFD] border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="aspect-[16/10] w-full overflow-hidden bg-[#F1F3F5]">
                <img
                  src={imageUrl}
                  alt="Interior Gedung Serbaguna Huntap Tondo 2, Palu"
                  fetchPriority="high"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <figcaption className="px-4 sm:px-5 py-3 bg-[#FCFCFD] border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-xs">
                <span className="text-[#4B5563] line-clamp-2 sm:truncate">{imageCaption}</span>
                <span className="font-mono text-[#6B7280] shrink-0">Aula utama</span>
              </figcaption>
            </figure>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
