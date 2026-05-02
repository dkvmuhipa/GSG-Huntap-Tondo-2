import React from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Maximize2 } from 'lucide-react';

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

  return (
    <section id="galeri" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-4">
            <ImageIcon className="w-4 h-4" />
            Dokumentasi & Galeri
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Lihat Rekam Jejak <span className="text-primary italic">GSG Tondo 2</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium">
            Koleksi foto fasilitas, kegiatan warga, dan berbagai acara yang telah sukses dilaksanakan di gedung kami.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative rounded-[2.5rem] overflow-hidden aspect-[4/3] bg-gray-100 border border-gray-100 shadow-sm"
            >
              <img 
                src={img.url} 
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
              <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center transform translate-y-2 group-hover:translate-y-0">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400 italic">
            * Dokumentasi diperbarui secara berkala oleh tim admin pembangunan.
          </p>
        </div>
      </div>
    </section>
  );
}
