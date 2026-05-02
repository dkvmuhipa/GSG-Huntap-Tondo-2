import React from 'react';
import { motion } from 'motion/react';
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
  Scale
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function RulesProcedures() {
  const sections = [
    {
      title: 'Persyaratan Umum',
      icon: Users,
      items: [
        'Penyewa adalah warga Huntap Tondo 2 atau pihak luar yang mendapatkan izin.',
        'Penggunaan gedung harus untuk kegiatan positif (sosial, keagamaan, pendidikan, atau hajatan).',
        'Dilarang melakukan kegiatan yang melanggar hukum, norma kesusilaan, atau perjudian.',
        'Wajib melampirkan KTP saat melakukan pendaftaran secara online.'
      ]
    },
    {
      title: 'Prosedur Booking',
      icon: Clock,
      items: [
        'Booking dilakukan melalui website resmi GSG Huntap Tondo 2.',
        'Penyewa minimal melakukan reservasi 7 hari sebelum hari pelaksanaan.',
        'Admin akan melakukan verifikasi maksimal dalam 2x24 jam.',
        'Booking dianggap sah (Fixed) hanya jika sudah disetujui admin dan status berubah di sistem.'
      ]
    },
    {
      title: 'Ketentuan Pembayaran',
      icon: CreditCard,
      items: [
        'Pembayaran dapat dilakukan melalui transfer atau tunai kepada bendahara pembangunan.',
        'Down Payment (DP) minimal 30% dibayarkan maksimal 3 hari setelah persetujuan.',
        'Pelunasan wajib dilakukan paling lambat 2 hari sebelum acara dimulai.',
        'Bukti transfer wajib diunggah ke sistem atau dikirim melalui WhatsApp Admin.'
      ]
    },
    {
      title: 'Tanggung Jawab & Larangan',
      icon: AlertTriangle,
      items: [
        'Penyewa wajib menjaga kebersihan dan fasilitas gedung.',
        'Dilarang memaku dinding atau merusak cat gedung.',
        'Segala bentuk kerusakan fasilitas menjadi tanggung jawab penuh penyewa (ganti rugi).',
        'Dilarang membawa senjata tajam, miras, atau obat-obatan terlarang ke area gedung.',
        'Penggunaan daya listrik berlebih harus dikoordinasikan sebelumnya.'
      ]
    },
    {
      title: 'Pembatalan & Pengembalian',
      icon: Trash2,
      items: [
        'Pembatalan sewa H-3 tidak akan mendapatkan pengembalian DP (hangus).',
        'Pembatalan sebelum H-7, DP dikembalikan sebesar 50%.',
        'Jika gedung tidak dapat digunakan karena bencana alam atau keadaan darurat, biaya dikembalikan 100%.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onOpenBooking={() => {}} />
      
      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>

          <header className="mb-12">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/10 mb-6">
              <Scale className="w-4 h-4" />
              Standard Operating Procedure
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Aturan & Prosedur <span className="text-primary">GSG Tondo 2</span>
            </h1>
            <p className="text-gray-500 mt-4 text-lg max-w-2xl leading-relaxed">
              Panduan lengkap tata tertib, hak, dan kewajiban selama menggunakan fasilitas Gedung Serba Guna Huntap Tondo 2 demi kenyamanan bersama.
            </p>
          </header>

          <div className="space-y-8">
            {sections.map((section, idx) => (
              <motion.section 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">{section.title}</h2>
                </div>

                <ul className="grid gap-6">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 group">
                      <div className="mt-1.5 w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <p className="text-gray-600 leading-relaxed font-medium">
                        {item}
                      </p>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>

          <div className="mt-12 p-8 bg-blue-900 rounded-[2.5rem] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div>
                <h3 className="text-2xl font-black mb-2">Punya pertanyaan lain?</h3>
                <p className="text-white/70 font-medium italic">Hubungi admin kami untuk informasi lebih detail.</p>
              </div>
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white text-blue-900 px-10 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all text-sm whitespace-nowrap shadow-xl"
              >
                HUBUNGI WHATSAPP
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
