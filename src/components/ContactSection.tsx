import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Navigation, MessageSquare, Copy, Check, ChevronDown, Calendar, User, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const formatWaNumber = (rawPhone: string): string => {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '6282291578809';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('8')) return '62' + digits;
  return digits;
};

export default function ContactSection() {
  const config = useAppStore((state) => state.config);
  const facilities = useAppStore((state) => state.facilities);

  const [activeTab, setActiveTab] = useState<'map' | 'template'>('template');
  const [copied, setCopied] = useState(false);

  const packageOptions = useMemo(() => {
    if (Array.isArray(facilities) && facilities.length > 0) {
      return facilities.map((f) => `${f.title} (${f.price || 'Tarif Standar'})`);
    }
    return [
      'Paket Pernikahan Lengkap',
      'Paket Acara Umum / Komersil',
      'Paket Kegiatan Kemasyarakatan',
      'Sewa Gedung Saja (Harian)'
    ];
  }, [facilities]);

  // Interactive template states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [selectedPkg, setSelectedPkg] = useState(packageOptions[0]);

  useEffect(() => {
    if (packageOptions.length > 0 && !packageOptions.includes(selectedPkg)) {
      setSelectedPkg(packageOptions[0]);
    }
  }, [packageOptions, selectedPkg]);

  const displayPhone = config?.contactPhone || '+62 822-9157-8809';
  const waNumber = formatWaNumber(displayPhone);
  const displayEmail = config?.contactEmail || 'officialhuntaptondo2@gmail.com';
  const displayHours = config?.contactHours || 'Setiap Hari, 08:00 - 22:00 WITA';
  const displayAddress = config?.contactAddress || 'Komplek Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu';
  const mapsUrl = config?.contactMapsUrl || 'https://maps.app.goo.gl/Zrm7XZ8GyRvqHK9o8';

  const contactInfo = [
    {
      icon: Phone,
      label: 'WhatsApp Pengelola Resmi',
      value: displayPhone,
      href: `https://wa.me/${waNumber}`
    },
    {
      icon: Mail,
      label: 'Email Layanan Resmi',
      value: displayEmail,
      href: `mailto:${displayEmail}`
    },
    {
      icon: Clock,
      label: 'Jam Operasional Layanan',
      value: displayHours,
      href: '#jadwal'
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
    return `https://wa.me/${waNumber}?text=${text}`;
  };

  return (
    <section id="kontak" className="py-12 sm:py-16 lg:py-20 bg-[#FCFCFD] overflow-hidden scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left: Info & Contacts */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF] mb-2">
              <MapPin className="w-4 h-4" strokeWidth={1.75} />
              <span>Lokasi & kontak resmi</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] tracking-tight leading-tight mb-4">
              Hubungi Kami & Sewa Gedung
            </h2>
            <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
              Gedung Serbaguna Huntap 2 Tondo siap melayani berbagai kebutuhan acara sosial, pernikahan, keagamaan, dan pertemuan umum warga.
            </p>

            <div className="grid gap-3 mb-6 sm:mb-8">
              {contactInfo.map((info, idx) => (
                <a 
                  key={idx}
                  href={info.href}
                  target={info.href.startsWith('http') ? '_blank' : undefined}
                  rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-4 p-4 min-h-[44px] bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] hover:border-[#1E40AF]/40 transition-colors group"
                >
                  <div className="w-11 h-11 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-xl flex items-center justify-center group-hover:bg-[#1E40AF] group-hover:text-white transition-colors shrink-0">
                    <info.icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#6B7280] mb-0.5">{info.label}</p>
                    <p className="font-semibold text-sm text-[#111827] font-mono tabular-nums truncate">{info.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="p-5 sm:p-6 bg-[#1E3A8A] rounded-2xl text-white border border-[#1E3A8A]">
              <span className="text-blue-200 text-xs font-medium block mb-1">Butuh bantuan lain?</span>
              <h4 className="font-display text-xl font-bold mb-2">Lihat Buku Saku & Prosedur Lengkap</h4>
              <p className="text-blue-100 text-xs sm:text-sm mb-5 leading-relaxed">
                Pelajari syarat ketetapan, tata cara pembayaran, aturan kebersihan, dan unduh dokumen panduan sewa resmi.
              </p>
              <a 
                href="/rules" 
                className="inline-flex items-center justify-center min-h-[44px] gap-2 bg-white text-[#1E40AF] px-4 py-2.5 rounded-lg font-semibold text-xs hover:bg-[#EFF6FF] transition-colors"
              >
                Baca Aturan & Prosedur
                <ChevronDown className="w-4 h-4 -rotate-90 text-[#1E40AF]" />
              </a>
            </div>
          </div>

          {/* Right: Tabbed Card Layout (Interactive Generator vs Map) */}
          <div className="w-full">
            {/* Tabs Selector */}
            <div className="flex bg-[#F1F3F5] p-1 rounded-xl border border-[#E5E7EB] mb-5 w-full sm:max-w-sm">
              <button
                onClick={() => setActiveTab('template')}
                className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'template'
                    ? 'bg-[#FCFCFD] text-[#111827] shadow-xs border border-[#E5E7EB]'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#1E40AF]" />
                Template Pesan
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-[#FCFCFD] text-[#111827] shadow-xs border border-[#E5E7EB]'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-[#16A34A]" />
                Peta Lokasi
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'template' ? (
                <motion.div
                  key="tab-template"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-[#F8F9FA] rounded-2xl p-5 sm:p-7 border border-[#E5E7EB]"
                >
                  <div className="mb-5">
                    <div className="inline-flex items-center gap-1.5 text-[#15803D] text-xs font-medium mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generator pesan resmi</span>
                    </div>
                    <h3 className="font-semibold text-[#111827] text-lg">Template Booking WhatsApp</h3>
                    <p className="text-xs text-[#4B5563] mt-1">Lengkapi form singkat berikut untuk menyusun pesan WhatsApp resmi ke pengelola gedung secara otomatis.</p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4 mb-5">
                    <div>
                      <label className="block text-xs font-medium text-[#4B5563] mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#6B7280]" /> Nama Lengkap Anda
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Budi Susanto"
                        className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FCFCFD] border border-[#D1D5DB] rounded-lg focus:border-[#1E40AF] text-xs font-medium transition-colors outline-none text-[#111827] placeholder:text-[#6B7280]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#4B5563] mb-1.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#6B7280]" /> Tanggal Rencana
                        </label>
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FCFCFD] border border-[#D1D5DB] rounded-lg focus:border-[#1E40AF] text-xs font-mono tabular-nums font-medium transition-colors outline-none text-[#111827]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4B5563] mb-1.5 flex items-center gap-1">
                          Jenis/Tujuan Acara
                        </label>
                        <input
                          type="text"
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="Contoh: Walimatul Ursy (Pernikahan)"
                          className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FCFCFD] border border-[#D1D5DB] rounded-lg focus:border-[#1E40AF] text-xs font-medium transition-colors outline-none text-[#111827] placeholder:text-[#6B7280]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4B5563] mb-1.5">
                        Pilihan Paket Sewa (Tersinkronisasi)
                      </label>
                      <div className="relative">
                        <select
                          value={selectedPkg}
                          onChange={(e) => setSelectedPkg(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#FCFCFD] border border-[#D1D5DB] rounded-lg focus:border-[#1E40AF] text-xs font-medium transition-colors outline-none text-[#111827] appearance-none cursor-pointer pr-10"
                        >
                          {packageOptions.map((pkg, idx) => (
                            <option key={idx} value={pkg}>
                              {pkg}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Message Bubble Preview */}
                  <div className="bg-[#F0FDF4] rounded-xl p-4 sm:p-5 border border-[#BBF7D0] relative mb-5">
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 min-h-[36px] bg-white hover:bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                      title="Salin Template"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#15803D]" />
                          <span className="text-[#15803D] text-[11px]">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#15803D]" />
                          <span className="text-[#15803D] text-[11px]">Salin</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs font-semibold text-[#15803D] block mb-2">Preview pesan WhatsApp</span>
                    <pre className="text-xs text-[#1E293B] font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-none pr-2">
                      {generatePublicMessage()}
                    </pre>
                  </div>

                  {/* Send Button */}
                  <a
                    href={getWALink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    Kirim via WhatsApp Sekarang
                  </a>
                </motion.div>
              ) : (
                <motion.div
                  key="tab-map"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full min-h-[360px] sm:min-h-[460px] bg-[#FCFCFD] rounded-2xl p-3 sm:p-4 border border-[#E5E7EB] relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Map Placeholder Graphic */}
                  <div className="absolute inset-2.5 sm:inset-3 rounded-xl bg-[#F1F3F5] overflow-hidden flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1524613032530-449a5d94c285?auto=format&fit=crop&q=80&w=1200" 
                      className="w-full h-full object-cover opacity-50 contrast-125 grayscale"
                      alt="Peta lokasi sekitar GSG Huntap Tondo 2"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-[#1E40AF]/10 mix-blend-multiply" />
                    
                    {/* Pin */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-12 h-12 bg-[#1E40AF] text-white rounded-full flex items-center justify-center shadow-lg relative">
                        <MapPin className="w-6 h-6" />
                        <div className="absolute -bottom-1.5 w-3 h-3 bg-[#1E40AF] rotate-45" />
                      </div>
                      <div className="mt-3 px-3.5 py-1.5 bg-[#FCFCFD] rounded-lg border border-[#D1D5DB] text-center max-w-xs">
                        <p className="text-[11px] font-semibold text-[#111827]">Gedung Serbaguna Huntap Tondo 2</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Details Bar */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 bg-[#FCFCFD]/95 rounded-xl p-3.5 sm:p-4 border border-[#D1D5DB] flex items-center justify-between gap-3 z-10">
                    <div className="min-w-0 flex-1 pr-2">
                      <h5 className="font-semibold text-[#111827] text-xs">Alamat Lengkap</h5>
                      <p className="text-xs text-[#4B5563] line-clamp-2">{displayAddress}</p>
                    </div>
                    <a
                      href={mapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-11 h-11 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-lg flex items-center justify-center hover:bg-[#1E40AF] hover:text-white transition-colors shrink-0"
                      title="Buka di Google Maps"
                    >
                      <Navigation className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  );
}
