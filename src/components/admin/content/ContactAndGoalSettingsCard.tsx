import React from 'react';
import { Phone, Mail, Clock, MapPin, Target } from 'lucide-react';

interface ContactAndGoalSettingsCardProps {
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}

export default function ContactAndGoalSettingsCard({
  config,
  setConfig
}: ContactAndGoalSettingsCardProps) {
  return (
    <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 1. Pengaturan Kontak Resmi & Jam Operasional */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Kontak Resmi & Lokasi Gedung</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Nomor WhatsApp, email, dan alamat yang tampil di halaman kontak, footer, serta tombol konfirmasi booking.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Nomor WhatsApp Admin Resmi
              </label>
              <input
                type="text"
                value={config?.contactPhone ?? '+62 822-9157-8809'}
                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                placeholder="+62 822-9157-8809"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Email Layanan Resmi
              </label>
              <input
                type="email"
                value={config?.contactEmail ?? 'officialhuntaptondo2@gmail.com'}
                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                placeholder="officialhuntaptondo2@gmail.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Jam Operasional Layanan
            </label>
            <input
              type="text"
              value={config?.contactHours ?? 'Setiap Hari, 08:00 - 22:00 WITA'}
              onChange={(e) => setConfig({ ...config, contactHours: e.target.value })}
              placeholder="Setiap Hari, 08:00 - 22:00 WITA"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Alamat Lengkap Gedung
            </label>
            <input
              type="text"
              value={config?.contactAddress ?? 'Komplek Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu'}
              onChange={(e) => setConfig({ ...config, contactAddress: e.target.value })}
              placeholder="Komplek Huntap Tondo 2, Kel. Tondo..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Tautan Google Maps
            </label>
            <input
              type="url"
              value={config?.contactMapsUrl ?? 'https://maps.app.goo.gl/Zrm7XZ8GyRvqHK9o8'}
              onChange={(e) => setConfig({ ...config, contactMapsUrl: e.target.value })}
              placeholder="https://maps.app.goo.gl/..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-700 focus:bg-white focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Target Pembangunan Gedung (Visual Goal Tracker di Dashboard Transparansi) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Target Pembangunan & Pengadaan Fasilitas</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tampilkan progres pengumpulan Dana Pembangunan gedung untuk target fasilitas berikutnya secara transparan kepada warga.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Nama Target Pembangunan / Pengadaan Saat Ini
            </label>
            <input
              type="text"
              value={config?.devGoalTitle ?? 'Pengadaan 2 Unit AC Standing 3PK & Peningkatan Akustik Aula'}
              onChange={(e) => setConfig({ ...config, devGoalTitle: e.target.value })}
              placeholder="Contoh: Pengadaan 2 Unit AC Standing & Renovasi Plafon"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Target Dana Dibutuhkan (Rp)
              </label>
              <input
                type="number"
                value={config?.devGoalTargetAmount ?? 15000000}
                onChange={(e) => setConfig({ ...config, devGoalTargetAmount: Number(e.target.value) })}
                placeholder="15000000"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Label Tahapan / Prioritas
              </label>
              <input
                type="text"
                value={config?.devGoalBadge ?? 'Prioritas Musyawarah Warga RT 02'}
                onChange={(e) => setConfig({ ...config, devGoalBadge: e.target.value })}
                placeholder="Prioritas Musyawarah Warga RT 02"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Deskripsi Manfaat bagi Warga
            </label>
            <textarea
              rows={3}
              value={
                config?.devGoalDescription ??
                'Dana cadangan (20% dari setiap sewa gedung & partisipasi warga) dialokasikan khusus untuk peningkatan kenyamanan fasilitas fisik aula agar semakin representatif.'
              }
              onChange={(e) => setConfig({ ...config, devGoalDescription: e.target.value })}
              placeholder="Jelaskan manfaat target pembangunan ini..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-700 focus:bg-white focus:border-primary outline-none transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
