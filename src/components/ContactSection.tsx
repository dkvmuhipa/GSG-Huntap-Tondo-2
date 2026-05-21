import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Navigation, ExternalLink } from 'lucide-react';

export default function ContactSection() {
  const contactInfo = [
    {
      icon: Phone,
      label: 'WhatsApp Admin',
      value: '+62 812-3456-7890',
      href: 'https://wa.me/6281234567890'
    },
    {
      icon: Mail,
      label: 'Email Layanan',
      value: 'admin.gsg@tondo2.com',
      href: 'mailto:admin.gsg@tondo2.com'
    },
    {
      icon: Clock,
      label: 'Jam Operasional',
      value: 'Setiap Hari, 08:00 - 22:00 WITA',
      href: '#'
    }
  ];

  return (
    <section id="kontak" className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Left: Info & Contacts */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-6">
              <MapPin className="w-4 h-4" />
              Lokasi & Kontak
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              Kunjungi Kami di <span className="text-primary italic">Huntap Tondo 2</span>
            </h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed mb-10">
              Gedung Serbaguna berada di pusat strategis komplek Hunian Tetap Tondo 2, memudahkan akses bagi seluruh warga dan tamu undangan.
            </p>

            <div className="grid gap-4 mb-10">
              {contactInfo.map((info, idx) => (
                <a 
                  key={idx}
                  href={info.href}
                  className="flex items-center gap-5 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group"
                >
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <info.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{info.label}</p>
                    <p className="font-bold text-gray-900">{info.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="p-8 bg-primary rounded-[2.5rem] text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-2">Butuh Bantuan Navigasi?</h4>
                <p className="text-white/70 text-sm font-medium mb-6">Gunakan Google Maps untuk petunjuk arah yang lebih akurat ke lokasi gedung.</p>
                <a 
                  href="https://maps.google.com/?q=Huntap+Tondo+2+Palu" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-2xl font-black text-xs shadow-xl shadow-black/10 hover:bg-gray-50 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  BUKA GOOGLE MAPS
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Map Placeholder / Visual */}
          <div className="relative">
            <div className="w-full h-full min-h-[500px] bg-white rounded-[3rem] p-4 border border-gray-100 shadow-xl relative overflow-hidden">
              {/* Map Placeholder Graphic */}
              <div className="absolute inset-4 rounded-[2.5rem] bg-gray-100 overflow-hidden flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1524613032530-449a5d94c285?auto=format&fit=crop&q=80&w=1200" 
                  className="w-full h-full object-cover opacity-50 contrast-125 grayscale"
                  alt="City Map Placeholder"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                
                {/* Pin Animation */}
                <motion.div 
                  initial={{ y: -50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="relative z-10"
                >
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl relative">
                    <MapPin className="w-8 h-8 animate-bounce" />
                    <div className="absolute -bottom-2 w-4 h-4 bg-primary rotate-45" />
                  </div>
                  <div className="mt-4 px-4 py-2 bg-white rounded-xl shadow-xl text-center">
                    <p className="text-[10px] font-black text-gray-900 uppercase">Gedung Serbaguna Huntap Tondo 2</p>
                  </div>
                </motion.div>
              </div>

              {/* Float Card */}
              <div className="absolute bottom-10 left-10 right-10 bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-white shadow-2xl flex items-center justify-between">
                <div>
                  <h5 className="font-black text-gray-900">Alamat Lengkap</h5>
                  <p className="text-sm text-gray-500 italic">Komplek Perumahan Huntap 2, Tondo, Palu.</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <Navigation className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            {/* Dots Decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}
