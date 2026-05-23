import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Info, 
  ShieldCheck, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  ArrowLeft,
  CheckCircle2,
  Users,
  Trash2,
  Scale,
  Search,
  Printer,
  CalendarDays,
  UserCheck,
  BadgePercent,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Copy,
  Check,
  ExternalLink,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RulesProcedures() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Quick Steps Workflow
  const steps = [
    {
      num: '01',
      title: 'Pilih Jadwal & Isi Form',
      desc: 'Cek ketersediaan di kalender publik, tentukan paket/fasilitas, isi form reservasi online lengkap dengan unggah KTP.',
      icon: CalendarDays,
      color: 'text-sky-500 bg-sky-50 border-sky-100',
    },
    {
      num: '02',
      title: 'Verifikasi Admin (H-7)',
      desc: 'Admin memeriksa formulir dan detail acara Anda. Status disetujui dalam waktu maksimal 2 x 24 jam.',
      icon: UserCheck,
      color: 'text-indigo-500 bg-indigo-50 border-indigo-100',
    },
    {
      num: '03',
      title: 'DP Minimal 30%',
      desc: 'Bayar uang muka (DP) paling lambat 3 hari setelah disetujui. Unggah bukti pembayaran di sistem.',
      icon: BadgePercent,
      color: 'text-amber-500 bg-amber-50 border-amber-100',
    },
    {
      num: '04',
      title: 'Pelunasan & Acara',
      desc: 'Lakukan pelunasan H-2 sebelum acara dimulai. Gedung siap digunakan dengan tata tertib yang berlaku.',
      icon: ShieldCheck,
      color: 'text-emerald-500 bg-emerald-50 border-emerald-100',
    },
  ];

  const sections = [
    {
      id: 'umum',
      title: 'Persyaratan Umum',
      icon: Users,
      items: [
        'Penyewa adalah warga Huntap Tondo 2 atau pihak luar yang mendapatkan izin resmi dari pengurus.',
        'Penggunaan gedung harus untuk kegiatan positif (sosial, keagamaan, pendidikan, kemasyarakatan, atau hajatan keluarga).',
        'Dilarang keras melakukan kegiatan yang melanggar hukum RI, norma kesusilaan, perjudian, atau politik praktis.',
        'Wajib melampirkan foto KTP asli yang masih berlaku saat melakukan pendaftaran reservasi via website.'
      ]
    },
    {
      id: 'booking',
      title: 'Prosedur Reservasi',
      icon: Clock,
      items: [
        'Booking harus diajukan secara online melalui website resmi Gedung Serbaguna Huntap Tondo 2.',
        'Penyewa wajib mengajukan permohonan sewa minimal 7 hari (H-7) sebelum hari pelaksanaan acara.',
        'Tim Admin Gedung akan memproses verifikasi kelayakan acara maksimal dalam 2x24 jam sejak pengajuan.',
        'Status reservasi dianggap sah (Fixed/Disetujui) hanya jika telah dikonfirmasi admin dan tercatat di sistem luar jaringan.'
      ]
    },
    {
      id: 'pembayaran',
      title: 'Ketentuan Pembayaran',
      icon: CreditCard,
      items: [
        'Pembayaran dapat dilakukan melalui transfer rekening bank resmi yayasan atau tunai kepada Bendahara Pengelola.',
        'Uang muka (Down Payment/DP) minimal senilai 30% wajib dibayarkan maksimal 3 hari setelah pendaftaran disetujui.',
        'Pelunasan sisa biaya sewa wajib diselesaikan paling lambat 2 hari (H-2) sebelum tanggal pelaksanaan acara.',
        'Bukti penyerahan transfer wajib diunggah ke sistem atau dikonfirmasikan langsung melalui kanal WhatsApp resmi.'
      ]
    },
    {
      id: 'larangan',
      title: 'Etika, Aturan & Larangan',
      icon: AlertTriangle,
      items: [
        'Penyewa bersama seluruh panitia wajib menjaga kebersihan, sarana, dan fasilitas penunjang di area gedung.',
        'Dilarang melakukan modifikasi gedung secara permanen, seperti memaku dinding, menempel paku payung, atau merusak cat.',
        'Segala bentuk kehilangan atau kerusakan fasilitas inventaris wajib diganti rugi penuh oleh penyewa sesuai nilai barang.',
        'Dilarang membawa senjata tajam, minuman keras beralkohol, judi, narkotika, serta obat terlarang ke lingkungan gedung.',
        'Penggunaan daya listrik berkapasitas besar (seperti sound system panggung eksternal) harus dikoordinasikan sebelumnya.'
      ]
    },
    {
      id: 'pembatalan',
      title: 'Pembatalan & Pengembalian Dana',
      icon: Trash2,
      items: [
        'Pembatalan sewa sepihak kurang dari 3 hari (H-3) mengakibatkan uang muka (DP) dinyatakan hangus.',
        'Pembatalan reservasi sebelum H-7, uang muka (DP) akan dikembalikan secara utuh sebesar 50%.',
        'Apabila terjadi Force Majeure (bencana alam, huru-hara, kebijakan darurat negara), biaya akan dikembalikan 100%.'
      ]
    }
  ];

  const faqs = [
    {
      q: 'Apakah pihak luar (non-warga) boleh menyewa gedung?',
      a: 'Boleh. Gedung Serbaguna Huntap Tondo 2 terbuka untuk masyarakat umum selama jadwal tersedia dan mematuhi aturan serta tarif yang ditentukan pengurus.'
    },
    {
      q: 'Bagaimana jika waktu acara melebihi batas waktu sewa?',
      a: 'Sewa umum dihitung per hari (sesuai jam yang diajukan). Kelebihan durasi yang ekstrem wajib dikonfirmasikan agar tidak bentrok dengan jadwal kebersihan atau pemeliharaan berkala.'
    },
    {
      q: 'Apakah biaya sewa sudah termasuk fasilitas kursi dan sound system?',
      a: 'Fasilitas bawaan seperti kursi standar, panggung, dan meja tersedia. Silakan cek detail ketersediaan inventaris atau tanyakan langsung pada admin saat verifikasi.'
    }
  ];

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const copyRulesToClipboard = () => {
    const textContent = sections.map(sec => {
      return `${sec.title.toUpperCase()}\n${sec.items.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Categories list
  const categories = ['Semua', 'Umum', 'Booking', 'Pembayaran', 'Larangan', 'Pembatalan'];

  const getCategoryId = (cat: string) => {
    if (cat === 'Umum') return 'umum';
    if (cat === 'Booking') return 'booking';
    if (cat === 'Pembayaran') return 'pembayaran';
    if (cat === 'Larangan') return 'larangan';
    if (cat === 'Pembatalan') return 'pembatalan';
    return 'all';
  };

  // Filter sections and items based on category and search query
  const filteredSections = sections
    .map(section => {
      // If category is not "Semua" and it doesn't match this section, filter out items
      const matchesCategory = activeCategory === 'Semua' || section.id === getCategoryId(activeCategory);
      
      if (!matchesCategory) return null;

      // Filter items inside section based on search query
      const filteredItems = section.items.filter(item => 
        item.toLowerCase().includes(searchQuery.toLowerCase()) || 
        section.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredItems.length === 0) return null;

      return {
        ...section,
        items: filteredItems
      };
    })
    .filter(Boolean) as typeof sections;

  return (
    <main className="pt-24 pb-20 bg-gray-50/50 min-h-screen print:bg-white print:pt-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Back Button (Hidden in Print) */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-8 group print:hidden"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>

          {/* Header Block */}
          <header className="mb-12 text-center md:text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm print:hidden">
              <Scale className="w-4 h-4 text-indigo-500" />
              Surat Keputusan Pengurus & SOP Resmi
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                  Aturan & Prosedur <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-primary">Gedung Serbaguna</span>
                </h1>
                <p className="text-gray-500 mt-4 text-base md:text-lg max-w-2xl leading-relaxed">
                  Panduan lengkap tata tertib, hak, tanggung jawab, dan kewajiban penyewa demi menjaga kelestarian fasilitas publik Huntap Tondo 2.
                </p>
              </div>
              
              {/* Action Buttons (Hidden in Print) */}
              <button 
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 hover:text-primary rounded-2xl hover:border-primary/20 hover:shadow-md active:scale-95 transition-all text-xs font-bold shrink-0 self-center md:self-end print:hidden shadow-sm"
              >
                <Printer className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                Cetak Aturan Resmi
              </button>
            </div>
          </header>

          {/* Visual Step Timeline Step-By-Step (Hidden in Print) */}
          <section className="mb-14 print:hidden">
            <div className="bg-gradient-to-r from-gray-900 to-indigo-950 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black uppercase text-emerald-400 tracking-widest">Alur Pendaftaran Praktis</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4 text-white">Bagaimana Alur Pemesanan Gedung?</h2>
                <p className="text-gray-300 text-sm max-w-2xl font-medium leading-relaxed mb-10">
                  Berikut adalah tahapan transparan mulai dari mendaftar online hingga hari pelaksanaan kegiatan Anda di gedung serbaguna.
                </p>

                {/* The Timeline Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                  {steps.map((step, idx) => {
                    const IconComponent = step.icon;
                    return (
                      <div key={idx} className="relative flex flex-col group">
                        {/* Line connector between steps (Desktop) */}
                        {idx < steps.length - 1 && (
                          <div className="hidden md:block absolute top-7 left-14 right-[-1.5rem] h-[2px] bg-gradient-to-r from-indigo-500/30 to-transparent z-0" />
                        )}
                        
                        <div className="flex items-start md:flex-col gap-4 relative z-10">
                          {/* Number & Icon Ball */}
                          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 ${step.color}`}>
                            <IconComponent className="w-6 h-6 stroke-[2]" />
                          </div>

                          <div>
                            {/* Step Indicator */}
                            <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">LANGKAH {step.num}</span>
                            <h3 className="text-sm md:text-base font-black text-white tracking-tight mb-1">{step.title}</h3>
                            <p className="text-xs text-gray-400 font-medium leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Filtering Area (Hidden in Print) */}
          <div className="mb-8 print:hidden flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aturan sewa gedung..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-medium transition-all shadow-sm outline-none placeholder:text-gray-400 text-gray-800"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none snap-x">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 snap-start ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                      : 'bg-white hover:bg-gray-100 border border-gray-100 text-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Rules Sections Container */}
          <div className="space-y-8 print:space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredSections.map((section, idx) => (
                <motion.section 
                  key={section.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 md:p-10 border border-gray-100 shadow-sm print:shadow-none print:border-none print:p-0"
                >
                  <div className="flex items-center gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-50 print:border-b-2 print:border-gray-200">
                    <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 print:hidden">
                      <section.icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{section.title}</h2>
                      <span className="hidden print:inline text-xs text-gray-400 uppercase tracking-widest font-black">Ketentuan Penggunaan</span>
                    </div>
                  </div>

                  <ul className="grid gap-5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 group">
                        <div className="mt-1 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform print:bg-transparent print:text-black">
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-semibold print:text-black">
                          {item}
                        </p>
                      </li>
                    ))}
                  </ul>
                </motion.section>
              ))}
            </AnimatePresence>

            {/* Empty State when Search yields no results */}
            {filteredSections.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-white rounded-[2.5rem] border border-gray-100"
              >
                <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-gray-900">Aturan tidak ditemukan</h3>
                <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto font-medium">Coba gunakan kata kunci pencarian lain, seperti "DP", "batal", atau "KTP".</p>
              </motion.div>
            )}
          </div>

          {/* Interactive FAQ Accordion Area (Hidden in Print) */}
          <section className="mt-14 print:hidden">
            <div className="mb-6">
              <span className="text-indigo-600 text-xs font-black uppercase tracking-widest block mb-1">Pertanyaan Umum</span>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Paling Sering Ditanyakan (FAQ)</h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index} 
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left font-black text-gray-800 hover:text-indigo-600 transition-colors"
                    >
                      <span className="text-sm md:text-base">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div 
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-48 border-t border-gray-50' : 'max-h-0'
                      } overflow-hidden`}
                    >
                      <p className="px-6 py-4 text-sm md:text-base text-gray-500 font-medium leading-relaxed bg-gray-50/30">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Call to Action Block (Hidden in Print) */}
          <div className="mt-12 p-8 sm:p-10 bg-gradient-to-tr from-indigo-900 to-blue-950 rounded-[2.5rem] text-white overflow-hidden relative shadow-lg print:hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  KONSULTASI GRATIS
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2">Masih Ragu / Punya Pertanyaan?</h3>
                <p className="text-white/70 text-sm font-semibold">Tanyakan langsung pada tim dinas pengurus Huntap Tondo 2 untuk solusi terbaik acara Anda.</p>
              </div>
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black hover:scale-[1.03] active:scale-95 transition-all text-sm whitespace-nowrap shadow-xl inline-flex items-center gap-2 tracking-tight"
              >
                HUBUNGI WHATSAPP
              </a>
            </div>
          </div>
      </div>

      {/* Print Helper Modal */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrintModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative z-10 border border-gray-100 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowPrintModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-150 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Printer className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">Asisten Pencetakan Dokumen</h3>
                  <p className="text-gray-400 text-xs font-semibold">Gedung Serbaguna Huntap Tondo 2</p>
                </div>
              </div>

              {/* Informative advice */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs sm:text-sm font-semibold leading-relaxed mb-6 flex gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-900">Mengapa Tombol Cetak Terbatas?</p>
                  <p className="text-amber-800/80 mt-1">
                    Anda sedang membuka web melalui Panel Pratinjau (iFrame). Kebijakan keamanan browser membatasi perintah cetak demi privasi Anda.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* 1. Open in new tab link */}
                <a
                  href={`${window.location.origin}/rules`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowPrintModal(false)}
                  className="flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-2xl transition-all shadow-md shadow-indigo-600/10 group font-bold text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-white/80" />
                    <div className="text-left">
                      <span className="block text-white">Mulai Cetak di Tab Baru</span>
                      <span className="block text-[10px] text-indigo-200 font-semibold mt-0.5">Sangat direkomendasikan & bebas hambatan</span>
                    </div>
                  </div>
                  <span className="text-xs bg-black/10 px-2.5 py-1 rounded-lg uppercase tracking-wider text-[9px] font-black group-hover:bg-black/20">REKOMENDASI</span>
                </a>

                {/* 2. Direct print backup */}
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setTimeout(() => {
                      window.print();
                    }, 300);
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.99] text-gray-700 rounded-2xl transition-all font-bold text-sm text-left shadow-sm cursor-pointer"
                >
                  <Printer className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="block text-gray-800 font-bold">Coba Cetak di Frame Ini</span>
                    <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">Gunakan bila Anda telah membuka tab penuh</span>
                  </div>
                </button>

                {/* 3. Copy content rules */}
                <button
                  onClick={copyRulesToClipboard}
                  className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.99] text-gray-700 rounded-2xl transition-all font-bold text-sm text-left shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {copied ? (
                      <Check className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <span className="block text-gray-800 font-bold">
                        {copied ? 'Aturan Berhasil Disalin!' : 'Salin Seluruh Aturan (Text)'}
                      </span>
                      <span className="block text-[10px] text-gray-400 font-semibold mt-0.5">
                        {copied ? 'Siap ditempel di Word atau WhatsApp' : 'Format rapi siap tempel di mana saja'}
                      </span>
                    </div>
                  </div>
                  {copied && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-lg text-[9px] font-black">BERHASIL</span>
                  )}
                </button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold transition-colors cursor-pointer"
                >
                  Tutup Panduan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}

