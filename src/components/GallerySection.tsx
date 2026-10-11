import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GallerySection() {
  const images = [
    {
      url: 'https://images.unsplash.com/photo-1517457373958-b7bdd24a8ad0?auto=format&fit=crop&q=80&w=1000',
      title: 'Tampilan Luar Gedung',
      category: 'Eksterior'
    },
    {
      url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1000',
      title: 'Dekorasi Acara Hajatan',
      category: 'Interior'
    },
    {
      url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1000',
      title: 'Rapat Koordinasi Warga',
      category: 'Kegiatan'
    },
    {
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000',
      title: 'Panggung & Sound System',
      category: 'Fasilitas'
    },
    {
      url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=1000',
      title: 'Area Parkir Luas',
      category: 'Eksterior'
    },
    {
      url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1000',
      title: 'Pencahayaan Malam Hari',
      category: 'Interior'
    }
  ];

  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev !== null ? (prev + 1) % images.length : null));
      } else if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, images.length]);

  return (
    <section id="galeri" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-4">
            <ImageIcon className="w-4 h-4" />
            Dokumentasi & Galeri
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Lihat Rekam Jejak <span className="text-primary italic">Gedung Serbaguna Huntap Tondo 2</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium">
            Koleksi foto fasilitas, kegiatan warga, dan berbagai acara yang telah sukses dilaksanakan di gedung kami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => {
            const isLoaded = Boolean(loadedImages[idx]);

            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => setSelectedImageIndex(idx)}
                className="group relative rounded-[2.5rem] overflow-hidden aspect-[4/3] bg-slate-100 border border-gray-100 shadow-sm cursor-pointer"
              >
                {/* Skeleton Shimmer Loading Placeholder */}
                {!isLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
                    <ImageIcon className="w-8 h-8 opacity-40 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Memuat Foto...</span>
                  </div>
                )}

                <img 
                  src={img.url} 
                  alt={img.title}
                  loading="lazy"
                  decoding="async"
                  onLoad={() => setLoadedImages(prev => ({ ...prev, [idx]: true }))}
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  referrerPolicy="no-referrer"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-8">
                  <span className="text-[10px] font-black text-primary bg-white/10 backdrop-blur-md px-3 py-1 rounded-full w-fit mb-2 uppercase tracking-widest border border-white/20">
                    {img.category}
                  </span>
                  <h4 className="text-xl font-bold text-white leading-tight">
                    {img.title}
                  </h4>
                </div>

                <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 text-white hover:bg-white/30">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400 italic">
            * Dokumentasi diperbarui secara berkala oleh tim admin pembangunan.
          </p>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImageIndex(null)}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 z-10 flex flex-col"
            >
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black/60 overflow-hidden flex items-center justify-center">
                <img 
                  src={images[selectedImageIndex].url}
                  alt={images[selectedImageIndex].title}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />

                {/* Navigation Buttons */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all backdrop-blur-md"
                  aria-label="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((selectedImageIndex + 1) % images.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-all backdrop-blur-md"
                  aria-label="Foto Berikutnya"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedImageIndex(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all backdrop-blur-md"
                  aria-label="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bottom Caption */}
              <div className="p-6 bg-slate-900 border-t border-white/10 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                    {images[selectedImageIndex].category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {images[selectedImageIndex].title}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {selectedImageIndex + 1} / {images.length}
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
