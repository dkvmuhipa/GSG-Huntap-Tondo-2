import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Bagaimana cara melakukan penyewaan?',
    answer: 'Anda dapat menekan tombol "Booking Sekarang", pilih paket yang sesuai, dan isi formulir pendaftaran. Admin akan memverifikasi data Anda maksimal 2x24 jam.'
  },
  {
    question: 'Apakah warga Huntap 2 mendapatkan harga khusus?',
    answer: 'Ya, warga Huntap Tondo 2 mendapatkan subsidi biaya atau tarif khusus untuk kegiatan sosial non-komersial. Silakan lampirkan KTP Huntap 2 saat pendaftaran.'
  },
  {
    question: 'Fasilitas apa saja yang sudah termasuk dalam sewa?',
    answer: 'Secara standar, sewa mencakup gedung utama, listrik standar, area parkir, toilet, dan 50 buah kursi. Untuk fasilitas tambahan seperti sound system besar atau genset dapat dikoordinasikan lebih lanjut.'
  },
  {
    question: 'Berapa kapasitas maksimal gedung?',
    answer: 'Gedung dapat menampung hingga 300 orang untuk format teater/rapat, dan sekitar 150-200 orang untuk format hajatan dengan meja.'
  },
  {
    question: 'Apakah boleh memasang dekorasi tambahan?',
    answer: 'Boleh, namun dilarang keras memaku dinding atau plafon. Kami menyarankan penggunaan stand dekorasi mandiri (self-standing).'
  },
  {
    question: 'Bagaimana jika saya ingin membatalkan booking?',
    answer: 'Pembatalan dapat diajukan melalui WhatsApp Admin. Harap baca halaman "Aturan & Prosedur" untuk detail kebijakan pengembalian dana (refund).'
  }
];

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10 mb-4">
            <HelpCircle className="w-4 h-4" />
            Pusat Bantuan
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            Tanya <span className="text-primary italic">Jawab</span>
          </h2>
          <p className="text-gray-500 font-medium">
            Beberapa hal yang paling sering ditanyakan oleh calon penyewa gedung.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md"
            >
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full px-8 py-6 text-left flex items-center justify-between gap-4 group"
              >
                <span className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary transition-colors">
                  {faq.question}
                </span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${openIdx === idx ? 'bg-primary text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10'}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-8 pb-8 pt-2">
                      <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <p className="text-gray-600 leading-relaxed font-medium italic">
                          "{faq.answer}"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-white rounded-[2.5rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h4 className="text-xl font-black text-gray-900">Masih belum menemukan jawaban?</h4>
              <p className="text-gray-500 text-sm font-medium">Tim admin kami siap membantu Anda secara langsung via WhatsApp.</p>
            </div>
          </div>
          <a 
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noreferrer"
            className="w-full md:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-black text-sm text-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            HUBUNGI ADMIN
          </a>
        </div>
      </div>
    </section>
  );
}
