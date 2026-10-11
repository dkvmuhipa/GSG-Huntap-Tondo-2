import React from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  Calendar, 
  Search, 
  Sparkles, 
  MapPin, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck,
  Clock
} from 'lucide-react';

interface HeroProps {
  onOpenBooking: () => void;
}

export default function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-slate-50/30">
      {/* Architectural Ambient Glow */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 -z-10 w-[800px] h-[400px] bg-gradient-to-tr from-blue-200/30 via-primary/10 to-emerald-100/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: CIVIC THESIS & CALL TO ACTION (7 Cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7 text-center lg:text-left"
          >
            {/* Context Badge: Grounded in Huntap Tondo 2, Palu */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs mb-6">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                Kawasan Huntap Tondo 2 • Palu
              </span>
              <span className="text-slate-300 font-bold">•</span>
              <span className="text-[11px] font-bold text-primary">
                Balai Warga Terpadu
              </span>
            </div>

            {/* Editorial Title Interplay */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] text-slate-950 tracking-tight mb-6">
              Ruang Mulia Warga,{' '}
              <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-primary to-indigo-600 italic font-serif">
                Panggung Cerita & Tradisi Kita.
              </span>
            </h1>

            {/* Authentic Subheadline */}
            <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Dari akad nikah khidmat, resepsi adat, hingga musyawarah mufakat warga. Fasilitas aula representatif 
              berkapasitas hingga <strong className="text-slate-900 font-black">500+ tamu</strong> yang dikelola 
              secara mandiri, transparan, dan terbuka untuk umum.
            </p>

            {/* Interactive Primary & Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-10">
              <motion.button 
                onClick={onOpenBooking}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-blue-800 text-white px-7 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/25 transition-all cursor-pointer group"
              >
                <Calendar className="w-4 h-4" />
                <span>Ajukan Sewa Gedung</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </motion.button>
              
              <a 
                href="#jadwal"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-6 py-4 rounded-2xl font-bold text-sm transition-all shadow-xs active:scale-95"
              >
                <span>Lihat Agenda & Ketersediaan</span>
              </a>

              <a 
                href="/#lacak"
                className="inline-flex items-center justify-center gap-2 bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 px-5 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>Lacak Sewa</span>
              </a>
            </div>

            {/* Key Civic Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0 text-left">
              <div>
                <span className="text-xl sm:text-2xl font-black text-slate-950 block leading-tight">500+</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kapasitas Tamu</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-xl sm:text-2xl font-black text-primary block leading-tight">10.000 W</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audio & Panggung</span>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <span className="text-xl sm:text-2xl font-black text-emerald-600 block leading-tight">100%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transparansi Kas</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: ARCHITECTURAL SHOWCASE FRAME (5 Cols) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="lg:col-span-5 relative"
          >
            {/* Visual Frame */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 border-4 sm:border-8 border-white bg-slate-900 group">
              <div className="aspect-[4/3] sm:aspect-[5/4] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1200" 
                  alt="Interior Gedung Serbaguna Huntap Tondo 2" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Gradient Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Bottom Frame Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary/80 backdrop-blur-md text-white font-mono text-[9px] font-black uppercase tracking-wider">
                    AULA UTAMA
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium">
                    Tata Ruang Acara Fleksibel
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                  Tata Lampu, Panggung Resepsi, & Akustik Terpadu
                </h3>
              </div>
            </div>

            {/* FLOATING CARD 1: LIVE STATUS BEACON */}
            <motion.div 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -top-4 -left-4 sm:-top-5 sm:-left-6 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 text-left max-w-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Status Hari Ini</span>
                <p className="text-xs font-black text-slate-900 leading-tight">Gedung Siap Digunakan</p>
                <span className="text-[10px] text-emerald-600 font-bold">Reservasi Online Terbuka</span>
              </div>
            </motion.div>

            {/* FLOATING CARD 2: CIVIC TRUST CERTIFICATE */}
            <motion.div 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="absolute -bottom-5 -right-4 sm:-bottom-6 sm:-right-6 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Kemitraan Komunitas</span>
                <p className="text-xs font-black text-slate-900 leading-tight">Pengurus RT 02 Huntap 2</p>
                <span className="text-[10px] text-slate-500 font-medium">Laporan Kas Terbuka & Sah</span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
