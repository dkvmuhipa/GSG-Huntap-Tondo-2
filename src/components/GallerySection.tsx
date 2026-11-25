import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Maximize2, X, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export interface GalleryItem {
  url: string;
  title: string;
  category: string;
}

export const DEFAULT_GALLERY_IMAGES: GalleryItem[] = [
  {
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1000',
    title: 'Tampilan Utama & Aula Gedung',
    category: 'Eksterior'
  },
  {
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1000',
    title: 'Dekorasi Acara Resepsi & Hajatan',
    category: 'Interior'
  },
  {
    url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1000',
    title: 'Musyawarah & Rapat Koordinasi Warga',
    category: 'Kegiatan'
  },
  {
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000',
    title: 'Tata Panggung & Sound System',
    category: 'Fasilitas'
  },
  {
    url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=1000',
    title: 'Halaman & Area Parkir Luas',
    category: 'Eksterior'
  },
  {
    url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1000',
    title: 'Suasana Pencahayaan Malam Hari',
    category: 'Interior'
  }
];

export default function GallerySection() {
  const config = useAppStore((state) => state.config);

  const images: GalleryItem[] = useMemo(() => {
    if (Array.isArray(config?.galleryImages) && config.galleryImages.length > 0) {
      return config.galleryImages;
    }
    return DEFAULT_GALLERY_IMAGES;
  }, [config?.galleryImages]);

  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [loadedUrls, setLoadedUrls] = useState<Record<string, boolean>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    const uniqueCats = Array.from(new Set(images.map((img) => img.category || 'Lainnya')));
    return ['Semua', ...uniqueCats];
  }, [images]);

  const filteredImages = useMemo(() => {
    if (activeCategory === 'Semua') return images;
    return images.filter((img) => img.category === activeCategory);
  }, [images, activeCategory]);

  useEffect(() => {
    setSelectedImageIndex(null);
  }, [activeCategory]);

  useEffect(() => {
    if (selectedImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev !== null ? (prev + 1) % filteredImages.length : null));
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev !== null ? (prev - 1 + filteredImages.length) % filteredImages.length : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, filteredImages.length]);

  return (
    <section id="galeri" className="py-12 sm:py-16 lg:py-20 bg-[#FCFCFD] overflow-hidden scroll-mt-28 border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF] mb-2">
            <ImageIcon className="w-4 h-4" strokeWidth={1.75} />
            <span>Dokumentasi & galeri</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] tracking-tight mb-3">
            Rekam Jejak Gedung Serbaguna Huntap Tondo 2
          </h2>
          <p className="text-[#4B5563] max-w-2xl mx-auto text-sm sm:text-base">
            Koleksi foto fasilitas, kegiatan warga, dan berbagai acara yang telah terlaksana di aula bersama.
          </p>

          {/* Interactive Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 sm:mt-8">
            {categories.map((cat) => {
              const count = cat === 'Semua' ? images.length : images.filter((i) => i.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer border ${
                    isActive
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                      : 'bg-[#F8F9FA] hover:bg-[#F1F3F5] text-[#4B5563] border-[#E5E7EB]'
                  }`}
                >
                  {cat === 'Semua' && <Layers className="w-3.5 h-3.5" />}
                  <span>{cat}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#F1F3F5] text-[#4B5563]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredImages.map((img, idx) => {
              const isLoaded = Boolean(loadedUrls[img.url]);

              return (
                <motion.div 
                  layout
                  key={`${img.url}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setSelectedImageIndex(idx)}
                  className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#F1F3F5] border border-[#E5E7EB] cursor-pointer"
                >
                  {/* Loading Placeholder */}
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-[#F1F3F5] flex flex-col items-center justify-center gap-2 text-[#6B7280]">
                      <ImageIcon className="w-7 h-7 opacity-50" strokeWidth={1.5} />
                      <span className="text-xs font-medium">Memuat foto...</span>
                    </div>
                  )}

                  <img 
                    src={img.url} 
                    alt={img.title}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoadedUrls((prev) => ({ ...prev, [img.url]: true }))}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/85 via-[#111827]/20 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4 sm:p-6">
                    <span className="text-[11px] font-medium text-white bg-[#1E40AF] px-2.5 py-0.5 rounded-md w-fit mb-2">
                      {img.category}
                    </span>
                    <h4 className="text-base sm:text-lg font-semibold text-white leading-tight">
                      {img.title}
                    </h4>
                  </div>

                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-lg bg-[#0F172A]/65 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-white border border-white/15">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <div className="mt-10 sm:mt-12 text-center">
          <p className="text-xs text-[#6B7280]">
            Dokumentasi diperbarui secara berkala oleh pengurus Gedung Serbaguna Huntap Tondo 2.
          </p>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && filteredImages[selectedImageIndex] && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImageIndex(null)}
              className="fixed inset-0 bg-[#0F172A]/85"
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-4xl w-full max-h-[90dvh] bg-[#0F172A] rounded-2xl overflow-hidden border border-white/15 z-10 flex flex-col"
            >
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black overflow-hidden flex items-center justify-center">
                <img 
                  src={filteredImages[selectedImageIndex].url}
                  alt={filteredImages[selectedImageIndex].title}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {/* Navigation Buttons */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((selectedImageIndex - 1 + filteredImages.length) % filteredImages.length);
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0F172A]/75 hover:bg-[#0F172A] text-white flex items-center justify-center transition-colors border border-white/15 cursor-pointer"
                  aria-label="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((selectedImageIndex + 1) % filteredImages.length);
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-[#0F172A]/75 hover:bg-[#0F172A] text-white flex items-center justify-center transition-colors border border-white/15 cursor-pointer"
                  aria-label="Foto Berikutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedImageIndex(null)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 w-11 h-11 rounded-full bg-[#0F172A]/75 hover:bg-[#0F172A] text-white flex items-center justify-center transition-colors border border-white/15 cursor-pointer"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom Caption */}
              <div className="p-4 sm:p-5 bg-[#0F172A] border-t border-white/10 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-medium text-[#93C5FD]">
                    {filteredImages[selectedImageIndex].category}
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold text-white mt-0.5">
                    {filteredImages[selectedImageIndex].title}
                  </h3>
                </div>
                <span className="text-xs font-mono tabular-nums font-medium text-[#94A3B8] shrink-0">
                  {selectedImageIndex + 1} / {filteredImages.length}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
