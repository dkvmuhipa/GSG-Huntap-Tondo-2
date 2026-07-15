import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Navigation, ExternalLink, MessageSquare, Copy, Check, ChevronDown, Calendar, User, Sparkles } from 'lucide-react';

export default function ContactSection() {
  const [activeTab, setActiveTab] = useState<'map' | 'template'>('template'); // Default to template so it's instantly visible!
  const [copied, setCopied] = useState(false);
  
  // Interactive template states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedPkg, setSelectedPkg] = useState('Paket Pernikahan Lengkap');

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

  const generatePublicMessage = () => {
    const dispName = name.trim() || '[Nama Lengkap Anda]';
    const dispDate = date || '[Tanggal Acara]';
    const dispPurpose = purpose.trim() || '[Jenis Acara, misal: Resepsi Pernikahan]';
    const dispPkg = selectedPkg || '[Paket Pilihan]';

    return `Yth. Pengelola Gedung Serbaguna Huntap 2 Tondo,

Saya ingin mengajukan permohonan booking / menyewa gedung dengan rincian berikut:

📌 *IDENTITAS & ACARA*
- Nama Lengkap: ${dispName}
- Rencana Tanggal: ${dispDate}
- Jenis/Tujuan Acara: ${dispPurpose}
- Paket Pilihan: ${dispPkg}

Mohon informasi mengenai ketersediaan jadwal pada tanggal tersebut serta panduan verifikasi selanjutnya. Terima kasih.`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePublicMessage());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWALink = () => {
    const text = encodeURIComponent(generatePublicMessage());
    return `https://wa.me/6281234567890?text=${text}`;
  };

  return (
    <section id="kontak" className="py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Left: Info & Contacts */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-6">
              <MapPin className="w-4 h-4" />
              Lokasi & Kontak
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              Hubungi Kami & <span className="text-primary italic">Sewa Gedung</span>
            </h2>
            <p className="text-gray-500 font-medium text-base md:text-lg leading-relaxed mb-8">
              Gedung Serbaguna Huntap 2 Tondo siap melayani berbagai kebutuhan acara sosial, pernikahan, keagamaan, dan pertemuan umum Anda.
            </p>

            <div className="grid gap-4 mb-8">
              {contactInfo.map((info, idx) => (
                <a 
                  key={idx}
                  href={info.href}
                  className="flex items-center gap-5 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all group"
                >
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                    <info.icon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{info.label}</p>
                    <p className="font-bold text-gray-900 truncate">{info.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="p-6 md:p-8 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden group border border-slate-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <span className="text-primary text-[10px] font-black uppercase tracking-wider block mb-1">Butuh Bantuan Lain?</span>
                <h4 className="text-lg md:text-xl font-black mb-2">Lihat Prosedur Lengkap</h4>
                <p className="text-slate-400 text-xs md:text-sm font-medium mb-5">Pelajari syarat ketetapan, tata cara pembayaran, aturan kebersihan, dan unduh dokumen panduan sewa resmi.</p>
                <a 
                  href="/rules" 
                  className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs shadow-xl shadow-black/10 hover:bg-gray-100 transition-all"
                >
                  BACA ATURAN & PROSEDUR
                  <ChevronDown className="w-4 h-4 -rotate-90 text-primary" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Tabbed Card Layout (Interactive Generator vs Map) */}
          <div className="w-full">
            {/* Tabs Selector */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 max-w-sm">
              <button
                onClick={() => setActiveTab('template')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'template'
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                Template Pesan
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === 'map'
                    ? 'bg-white text-slate-950 shadow-md'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Peta Lokasi
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'template' ? (
                <motion.div
                  key="tab-template"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-xl shadow-slate-100/50"
                >
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border border-emerald-500/15">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Generator Pesan Booking
                    </div>
                    <h3 className="font-black text-gray-900 text-xl">Template Booking WhatsApp</h3>
                    <p className="text-xs text-gray-500 mt-1">Lengkapi form singkat berikut untuk menyusun pesan WhatsApp resmi ke pengelola gedung secara otomatis.</p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> Nama Lengkap Anda
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Budi Susanto"
                        className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-primary focus:bg-white text-xs font-semibold transition-all outline-none text-slate-800 placeholder:text-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> Tanggal Rencana
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-primary focus:bg-white text-xs font-semibold transition-all outline-none text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          Jenis/Tujuan Acara
                        </label>
                        <input
                          type="text"
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="Contoh: Walimatul Ursy (Pernikahan)"
                          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-primary focus:bg-white text-xs font-semibold transition-all outline-none text-slate-800 placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
                        Pilihan Paket Sewa
                      </label>
                      <div className="relative">
                        <select
                          value={selectedPkg}
                          onChange={(e) => setSelectedPkg(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 rounded-xl focus:border-primary focus:bg-white text-xs font-semibold transition-all outline-none text-slate-800 appearance-none cursor-pointer pr-10"
                        >
                          <option value="Paket Pernikahan Lengkap">Paket Pernikahan Lengkap</option>
                          <option value="Paket Acara Umum / Komersil">Paket Acara Umum / Komersil</option>
                          <option value="Paket Kegiatan Kemasyarakatan">Paket Kegiatan Kemasyarakatan</option>
                          <option value="Sewa Gedung Saja (Harian)">Sewa Gedung Saja (Harian)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Message Bubble Preview */}
                  <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 relative mb-5">
                    <button
                      onClick={handleCopy}
                      className="absolute top-3.5 right-3.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white p-2 rounded-xl text-xs flex items-center gap-1.5 transition-all font-bold border border-white/5 cursor-pointer"
                      title="Salin Template"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px]">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-400 text-[10px]">Salin</span>
                        </>
                      )}
                    </button>
                    <span className="text-[9px] uppercase font-black text-indigo-400 tracking-wider block mb-2">Preview Pesan WhatsApp</span>
                    <pre className="text-[10px] sm:text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-none pr-2">
                      {generatePublicMessage()}
                    </pre>
                  </div>

                  {/* Send Button */}
                  <a
                    href={getWALink()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    KIRIM VIA WHATSAPP SEKARANG
                  </a>
                </motion.div>
              ) : (
                <motion.div
                  key="tab-map"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="w-full min-h-[480px] bg-white rounded-[3rem] p-4 border border-gray-100 shadow-xl relative overflow-hidden flex flex-col justify-between"
                >
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
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl relative">
                        <MapPin className="w-7 h-7 animate-bounce" />
                        <div className="absolute -bottom-2 w-3.5 h-3.5 bg-primary rotate-45" />
                      </div>
                      <div className="mt-4 px-4 py-2 bg-white rounded-xl shadow-xl text-center max-w-xs border border-gray-100">
                        <p className="text-[9px] font-black text-gray-900 uppercase">Gedung Serbaguna Huntap Tondo 2</p>
                      </div>
                    </div>
                  </div>

                  {/* Float Card */}
                  <div className="absolute bottom-10 left-10 right-10 bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-white shadow-2xl flex items-center justify-between z-10">
                    <div className="min-w-0 flex-1 pr-3">
                      <h5 className="font-black text-gray-900 text-xs">Alamat Lengkap</h5>
                      <p className="text-[11px] text-gray-500 italic truncate">Komplek Perumahan Huntap 2, Tondo, Palu.</p>
                    </div>
                    <a
                      href="https://maps.google.com/?q=Huntap+Tondo+2+Palu" 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all shrink-0"
                    >
                      <Navigation className="w-5 h-5" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Dots Decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
          </div>

        </div>
      </div>
    </section>
  );
}

