import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Upload, RotateCcw, Loader } from 'lucide-react';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { DEFAULT_GALLERY_IMAGES, GalleryItem } from '../../GallerySection';

interface GallerySettingsCardProps {
  config: any;
  setConfig: React.Dispatch<React.SetStateAction<any>>;
  onErrorAlert?: (title: string, message: string) => void;
}

const GALLERY_CATEGORIES = ['Eksterior', 'Interior', 'Kegiatan', 'Fasilitas'];

export default function GallerySettingsCard({
  config,
  setConfig,
  onErrorAlert
}: GallerySettingsCardProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Kegiatan');
  const [newUrl, setNewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const galleryList: GalleryItem[] =
    Array.isArray(config?.galleryImages) && config.galleryImages.length > 0
      ? config.galleryImages
      : DEFAULT_GALLERY_IMAGES;

  const handleUploadNewPhoto = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      onErrorAlert?.('Ukuran Berkas Terlalu Besar', 'Maksimal ukuran foto galeri adalah 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      const { url } = await uploadToCloudinary(file);
      setNewUrl(url);
    } catch (err: any) {
      onErrorAlert?.('Gagal Mengunggah Foto', err?.message || 'Gagal mengunggah gambar ke Cloudinary.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddGalleryItem = () => {
    if (!newUrl.trim() || !newTitle.trim()) {
      onErrorAlert?.('Data Belum Lengkap', 'Harap isi judul dokumentasi dan unggah/masukkan URL foto terlebih dahulu.');
      return;
    }

    const updated = [
      {
        url: newUrl.trim(),
        title: newTitle.trim(),
        category: newCategory
      },
      ...galleryList
    ];

    setConfig({ ...config, galleryImages: updated });
    setNewTitle('');
    setNewUrl('');
  };

  const handleRemoveGalleryItem = (index: number) => {
    const updated = galleryList.filter((_, idx) => idx !== index);
    setConfig({ ...config, galleryImages: updated });
  };

  const handleResetGallery = () => {
    setConfig({ ...config, galleryImages: DEFAULT_GALLERY_IMAGES });
  };

  return (
    <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">Manajemen Galeri & Dokumentasi Gedung</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Unggah foto dokumentasi kegiatan warga, resepsi, atau kondisi fisik gedung terbaru.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetGallery}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset ke Default ({DEFAULT_GALLERY_IMAGES.length} Foto)
        </button>
      </div>

      {/* Form Tambah Foto Dokumentasi Baru */}
      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-600">Tambah Foto Dokumentasi Baru</h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
              Judul Foto / Kegiatan
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Contoh: Resepsi Pernikahan Warga RT 02"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-primary"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
              Kategori Filter
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-primary"
            >
              {GALLERY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                URL Foto / Unggah Langsung
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-700 outline-none focus:border-primary"
                />
                <label className="cursor-pointer px-3.5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs flex items-center gap-1.5 shrink-0 border border-indigo-200/70 transition-colors">
                  {isUploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isUploading ? 'Upload...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadNewPhoto(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddGalleryItem}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-blue-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Foto Galeri Saat Ini */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleryList.map((item, idx) => (
          <div
            key={`${item.url}-${idx}`}
            className="group flex items-center gap-3.5 p-3 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:border-slate-200 transition-all"
          >
            <div className="w-16 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-primary mb-1">
                {item.category}
              </span>
              <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveGalleryItem(idx)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              title="Hapus Foto"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
