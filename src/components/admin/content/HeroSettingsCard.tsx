import React, { useState } from 'react';
import { Layout, Upload, Image as ImageIcon, Loader } from 'lucide-react';
import { uploadToCloudinary } from '../../../lib/cloudinary';

interface HeroSettingsCardProps {
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  onErrorAlert?: (title: string, message: string) => void;
}

export default function HeroSettingsCard({
  config,
  setConfig,
  onErrorAlert
}: HeroSettingsCardProps) {
  const [isUploadingHero, setIsUploadingHero] = useState(false);

  const handleHeroFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      onErrorAlert?.('Ukuran Berkas Terlalu Besar', 'Batas maksimal ukuran foto adalah 5MB.');
      return;
    }

    try {
      setIsUploadingHero(true);
      const { url } = await uploadToCloudinary(file);
      setConfig((prev: any) => ({ ...prev, heroImageUrl: url }));
    } catch (err: any) {
      onErrorAlert?.('Gagal Mengunggah Foto', err?.message || 'Terjadi kesalahan saat mengunggah foto ke Cloudinary.');
    } finally {
      setIsUploadingHero(false);
    }
  };

  return (
    <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Pengaturan Hero Section (Banner Beranda)</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Sesuaikan teks sambutan, foto aula gedung, dan angka kapasitas di halaman depan website.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-primary self-start sm:self-auto">
          Halaman Depan • Paling Atas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sisi Kiri: Teks & Narasi */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">1. Teks Judul & Slogan</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Teks Lokasi (Badge)
              </label>
              <input
                type="text"
                value={config?.heroBadgeLocation ?? 'Kawasan Huntap Tondo 2 • Palu'}
                onChange={(e) => setConfig({ ...config, heroBadgeLocation: e.target.value })}
                placeholder="Kawasan Huntap Tondo 2 • Palu"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
                Kategori (Badge)
              </label>
              <input
                type="text"
                value={config?.heroBadgeCategory ?? 'Balai Warga Terpadu'}
                onChange={(e) => setConfig({ ...config, heroBadgeCategory: e.target.value })}
                placeholder="Balai Warga Terpadu"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Judul Utama Baris 1
            </label>
            <input
              type="text"
              value={config?.heroTitle ?? 'Ruang Mulia Warga,'}
              onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
              placeholder="Ruang Mulia Warga,"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-black text-gray-900 focus:bg-white focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Sub-Judul Aksen Baris 2 (Gradien Biru)
            </label>
            <input
              type="text"
              value={config?.heroSubtitle ?? 'Panggung Cerita & Tradisi Kita.'}
              onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
              placeholder="Panggung Cerita & Tradisi Kita."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 focus:bg-white focus:border-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Deskripsi Singkat / Tagline
            </label>
            <textarea
              rows={3}
              value={config?.heroTagline ?? 'Dari akad nikah khidmat, resepsi adat, hingga musyawarah akbar warga.'}
              onChange={(e) => setConfig({ ...config, heroTagline: e.target.value })}
              placeholder="Tuliskan narasi singkat gedung..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-gray-700 focus:bg-white focus:border-primary outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Sisi Kanan: Foto Utama Aula & Floating Cards */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">2. Foto Utama & Statistik Showcase</h4>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Foto Hero Utama (Cloudinary Upload / URL)
            </label>
            <div className="flex gap-3 items-center">
              <div className="w-20 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 relative group">
                <img
                  src={config?.heroImageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'}
                  alt="Preview Hero"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors">
                    {isUploadingHero ? (
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingHero ? 'Mengunggah...' : 'Unggah Foto Baru'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingHero}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleHeroFileUpload(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-400">atau tempel link di bawah</span>
                </div>
                <input
                  type="url"
                  value={config?.heroImageUrl ?? ''}
                  onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-mono text-gray-700 focus:bg-white focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Keterangan Caption Foto
            </label>
            <input
              type="text"
              value={config?.heroImageCaption ?? 'Tata Lampu, Panggung Resepsi, & Akustik Terpadu'}
              onChange={(e) => setConfig({ ...config, heroImageCaption: e.target.value })}
              placeholder="Tata Lampu, Panggung Resepsi..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none transition-all"
            />
          </div>

          {/* 3 Badge Statistik */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Angka Ringkasan Fitur (3 Badge Bawah Foto)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="block text-[9px] text-slate-400 font-bold mb-1">Kapasitas Tamu</span>
                <input
                  type="text"
                  value={config?.heroStatCapacity ?? '500+'}
                  onChange={(e) => setConfig({ ...config, heroStatCapacity: e.target.value })}
                  placeholder="500+"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-center text-gray-800 focus:bg-white focus:border-primary outline-none"
                />
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 font-bold mb-1">Audio System</span>
                <input
                  type="text"
                  value={config?.heroStatAudio ?? '10.000 W'}
                  onChange={(e) => setConfig({ ...config, heroStatAudio: e.target.value })}
                  placeholder="10.000 W"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-center text-gray-800 focus:bg-white focus:border-primary outline-none"
                />
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 font-bold mb-1">Transparansi</span>
                <input
                  type="text"
                  value={config?.heroStatTransparency ?? '100%'}
                  onChange={(e) => setConfig({ ...config, heroStatTransparency: e.target.value })}
                  placeholder="100%"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-center text-gray-800 focus:bg-white focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Label Floating Cards */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1.5">
              Label Kartu Mengambang (Floating Cards)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[9px] text-slate-400 font-bold mb-1">Status Kesiapan</span>
                <input
                  type="text"
                  value={config?.heroStatusTitle ?? 'Gedung Siap Digunakan'}
                  onChange={(e) => setConfig({ ...config, heroStatusTitle: e.target.value })}
                  placeholder="Gedung Siap Digunakan"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none"
                />
              </div>
              <div>
                <span className="block text-[9px] text-slate-400 font-bold mb-1">Pengelola Mitra</span>
                <input
                  type="text"
                  value={config?.heroPartnerTitle ?? 'Pengurus RT 02 Huntap 2'}
                  onChange={(e) => setConfig({ ...config, heroPartnerTitle: e.target.value })}
                  placeholder="Pengurus RT 02 Huntap 2"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 focus:bg-white focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
