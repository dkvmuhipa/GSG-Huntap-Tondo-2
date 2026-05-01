import React from 'react';
import { motion } from 'motion/react';

interface HeroProps {
  onOpenBooking: () => void;
}

export default function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section className="relative pt-32 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Pusat Kegiatan Komunitas
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] text-gray-900 mb-6">
              Ruang Berkumpul,<br /> 
              <span className="text-primary italic font-serif">Tumbuh,</span> dan Berdaya.
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-xl leading-relaxed">
              Pusat kegiatan warga Huntap Tondo 2 yang dikelola secara modern dan transparan untuk kenyamanan bersama.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onOpenBooking}
                className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-primary/20 hover:bg-blue-800 transition-all duration-300"
              >
                Pesan Gedung Sekarang
              </button>
              <a 
                href="#fasilitas"
                className="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
              >
                Lihat Fasilitas
              </a>
            </div>
          </motion.div>


          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-gray-200 border-8 border-white">
              <img 
                src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1200" 
                alt="GSG Tondo 2 Interior" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
            
            {/* Quick Stats Overlay */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Kapasitas</div>
              </div>
              <div className="w-px h-10 bg-gray-100 my-auto" />
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Keamanan</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -z-10 w-1/3 h-full bg-blue-50/50 rounded-bl-full" />
    </section>
  );
}
