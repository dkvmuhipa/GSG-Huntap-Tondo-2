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
    <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl border border-[#E4E4E7] shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4E4E7]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center shrink-0">
            <Layout className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-semibold text-[#171717] leading-tight">Pengaturan Hero Section (Banner Beranda)</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Sesuaikan teks sambutan, foto aula gedung, dan angka kapasitas di halaman depan website.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono tabular-nums font-medium px-3 py-1 rounded-full bg-[#F4F4F5] text-[#525252] border border-[#E4E4E7] self-start sm:self-auto">
          Halaman Depan · Paling Atas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sisi Kiri: Teks & Narasi */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-[#525252]">1. Teks Judul & Slogan</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
                Teks Lokasi (Label Atas)
              </label>
              <input
                type="text"
                value={config?.heroBadgeLocation ?? 'Kawasan Huntap Tondo 2, Palu'}
                onChange={(e) => setConfig({ ...config, heroBadgeLocation: e.target.value })}
                placeholder="Kawasan Huntap Tondo 2, Palu"
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
                Kategori (Label Atas)
              </label>
              <input
                type="text"
                value={config?.heroBadgeCategory ?? 'Balai Warga Terpadu'}
                onChange={(e) => setConfig({ ...config, heroBadgeCategory: e.target.value })}
                placeholder="Balai Warga Terpadu"
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
              Judul Utama Baris 1
            </label>
            <input
              type="text"
              value={config?.heroTitle ?? 'Ruang Mulia Warga,'}
              onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
              placeholder="Ruang Mulia Warga,"
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
              Sub-Judul Aksen Baris 2
            </label>
            <input
              type="text"
              value={config?.heroSubtitle ?? 'Panggung Cerita & Tradisi Kita'}
              onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
              placeholder="Panggung Cerita & Tradisi Kita"
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-xs font-semibold text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
              Deskripsi Singkat / Tagline
            </label>
            <textarea
              rows={3}
              value={config?.heroTagline ?? 'Dari akad nikah khidmat, resepsi adat, hingga musyawarah akbar warga.'}
              onChange={(e) => setConfig({ ...config, heroTagline: e.target.value })}
              placeholder="Tuliskan narasi singkat gedung..."
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg p-3 text-xs font-medium text-[#525252] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Sisi Kanan: Foto Utama Aula & Statistik */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-[#525252]">2. Foto Utama & Statistik Resmi Gedung</h4>

          <div>
            <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
              Foto Hero Utama (Cloudinary Upload / URL)
            </label>
            <div className="flex gap-3 items-center">
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#F4F4F5] border border-[#E4E4E7] shrink-0 relative group">
                <img
                  src={config?.heroImageUrl || '/hero-gsg-tondo2.webp'}
                  alt="Preview Hero"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1E40AF] text-xs font-medium transition-colors">
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
                  <span className="text-[11px] text-[#737373]">atau tempel link di bawah</span>
                </div>
                <input
                  type="url"
                  value={config?.heroImageUrl ?? ''}
                  onChange={(e) => setConfig({ ...config, heroImageUrl: e.target.value })}
                  placeholder="/hero-gsg-tondo2.webp"
                  className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs font-mono text-[#525252] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
              Keterangan Caption Foto
            </label>
            <input
              type="text"
              value={config?.heroImageCaption ?? 'Tata Lampu, Panggung Resepsi, & Akustik Terpadu'}
              onChange={(e) => setConfig({ ...config, heroImageCaption: e.target.value })}
              placeholder="Tata Lampu, Panggung Resepsi..."
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
            />
          </div>

          {/* 3 Statistik Utama */}
          <div>
            <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
              Angka Ringkasan Fitur (3 Spesifikasi Utama)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="block text-[10px] text-[#737373] font-medium mb-1">Kapasitas Tamu</span>
                <input
                  type="text"
                  value={config?.heroStatCapacity ?? '300'}
                  onChange={(e) => setConfig({ ...config, heroStatCapacity: e.target.value })}
                  placeholder="300"
                  className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold text-center text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                />
              </div>
              <div>
                <span className="block text-[10px] text-[#737373] font-medium mb-1">Audio System</span>
                <input
                  type="text"
                  value={config?.heroStatAudio ?? '5.000 W'}
                  onChange={(e) => setConfig({ ...config, heroStatAudio: e.target.value })}
                  placeholder="5.000 W"
                  className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold text-center text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                />
              </div>
              <div>
                <span className="block text-[10px] text-[#737373] font-medium mb-1">Transparansi</span>
                <input
                  type="text"
                  value={config?.heroStatTransparency ?? '100%'}
                  onChange={(e) => setConfig({ ...config, heroStatTransparency: e.target.value })}
                  placeholder="100%"
                  className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums font-semibold text-center text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Keterangan Status & Pengelola */}
          <div>
            <label className="block text-[11px] font-medium text-[#525252] mb-1.5">
              Label Status & Pengelola Resmi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] text-[#737373] font-medium mb-1">Status Kesiapan</span>
                <input
                  type="text"
                  value={config?.heroStatusTitle ?? 'Gedung Siap Digunakan'}
                  onChange={(e) => setConfig({ ...config, heroStatusTitle: e.target.value })}
                  placeholder="Gedung Siap Digunakan"
                  className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs font-medium text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                />
              </div>
              <div>
                <span className="block text-[10px] text-[#737373] font-medium mb-1">Pengelola Mitra</span>
                <input
                  type="text"
                  value={config?.heroPartnerTitle ?? 'Pengurus RT 02 Huntap 2'}
                  onChange={(e) => setConfig({ ...config, heroPartnerTitle: e.target.value })}
                  placeholder="Pengurus RT 02 Huntap 2"
                  className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs font-medium text-[#171717] focus:bg-white focus:border-[#1E40AF] outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
