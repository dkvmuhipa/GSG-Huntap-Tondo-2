import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { 
  AlertCircle, 
  Trash2, 
  Plus, 
  ToggleRight, 
  ToggleLeft, 
  Edit3, 
  CheckCircle2, 
  Save, 
  Settings2, 
  X,
  Image as ImageIcon,
  Upload,
  Bell,
  RotateCcw
} from 'lucide-react';
import { updateGlobalConfig, upsertFacility, removeFacility } from '../../lib/db';
import { useAppStore } from '../../store/useAppStore';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { DEFAULT_ANNOUNCEMENTS } from '../../components/AnnouncementTicker';

import { useOutletContext } from 'react-router-dom';

export default function ContentManager() {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAuthorized = ['owner', 'admin', 'editor', 'bendahara'].includes(userRole);
  const canEditFinancials = ['owner', 'admin', 'bendahara'].includes(userRole);

  const storeConfig = useAppStore(state => state.config);
  const facilities = useAppStore(state => state.facilities);
  const [config, setConfig] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  // Announcement Ticker States
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [newAnnouncementType, setNewAnnouncementType] = useState<'info' | 'warning' | 'success'>('info');

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'info' | 'success';
    isAlert?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    facilityId: string;
    facilityTitle: string;
  }>({
    isOpen: false,
    facilityId: '',
    facilityTitle: ''
  });

  useEffect(() => {
    if (storeConfig) {
      setConfig(storeConfig);
    }
  }, [storeConfig]);

  const handleDeleteFacility = (id: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      facilityId: id,
      facilityTitle: title
    });
  };

  const confirmDeleteFacility = async () => {
    try {
      await removeFacility(confirmModal.facilityId);
    } catch (err) {
      console.error("Delete facility error:", err);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await updateGlobalConfig(config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('idle');
    }
  };

  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleImageUpload = async (id: string, file: File) => {
    setIsUploading(id);
    try {
      const { url } = await uploadToCloudinary(file);
      await handleUpdateFacility(id, 'imageUrl', url);
    } catch (err: any) {
      setConfirmConfig({
        isOpen: true,
        title: 'Gagal Upload',
        message: err.message || 'Terjadi kesalahan saat mengupload gambar.',
        onConfirm: () => {},
        type: 'danger',
        isAlert: true
      });
    } finally {
      setIsUploading(null);
    }
  };
  const handleUpdateFacility = async (id: string, field: string, value: any) => {
    const updated = facilities.find(f => f.id === id);
    if (updated) {
      await upsertFacility(id, { ...updated, [field]: value });
    }
  };

  const [editingFacility, setEditingFacility] = useState<any>(null);

  const handleUpdateEditing = (field: string, value: any) => {
    setEditingFacility((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleToggleFeature = (feature: string) => {
    const currentFeatures = editingFacility.features || [];
    if (currentFeatures.includes(feature)) {
      handleUpdateEditing('features', currentFeatures.filter((f: string) => f !== feature));
    } else {
      handleUpdateEditing('features', [...currentFeatures, feature]);
    }
  };

  const handleAddCustomFeature = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.target as any).querySelector('input');
    const value = input.value.trim();
    if (value) {
      handleUpdateEditing('features', [...(editingFacility.features || []), value]);
      input.value = '';
    }
  };

  const saveFacilityUpdate = async () => {
    if (!editingFacility) return;
    setSaveStatus('saving');
    try {
      await upsertFacility(editingFacility.id, editingFacility);
      setEditingFacility(null);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('idle');
    }
  };

  const handleAddFacility = async () => {
    const newFac = {
      title: 'Nama Paket Baru',
      price: 'Rp 0',
      duration: 'Per Acara',
      iconName: 'Users2',
      features: ['Kapasitas 100 Orang'],
      capacity: '100 Orang',
      highlight: false,
      description: 'Deskripsi paket penggunaan gedung.',
      order: facilities.length
    };
    await upsertFacility(null, newFac);
  };

  const ICON_OPTIONS = [
    { name: 'Users2', label: 'Umum' },
    { name: 'PartyPopper', label: 'Pesta' },
    { name: 'Dumbbell', label: 'Olahraga' },
    { name: 'Music', label: 'Hiburan' },
    { name: 'Building2', label: 'Gedung' },
    { name: 'Calendar', label: 'Agenda' },
    { name: 'Heart', label: 'Sosial' },
    { name: 'Utensils', label: 'Katering' }
  ];

  // Announcement Handlers
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    const currentList = config?.announcements || DEFAULT_ANNOUNCEMENTS;
    const newItem = {
      id: `ann-${Date.now()}`,
      text: newAnnouncementText.trim(),
      type: newAnnouncementType,
      active: true
    };
    setConfig({
      ...config,
      announcements: [...currentList, newItem]
    });
    setNewAnnouncementText('');
  };

  const handleToggleAnnouncementActive = (id: string) => {
    const currentList = config?.announcements || DEFAULT_ANNOUNCEMENTS;
    setConfig({
      ...config,
      announcements: currentList.map((item: any) =>
        item.id === id ? { ...item, active: item.active === false ? true : false } : item
      )
    });
  };

  const handleDeleteAnnouncement = (id: string) => {
    const currentList = config?.announcements || DEFAULT_ANNOUNCEMENTS;
    setConfig({
      ...config,
      announcements: currentList.filter((item: any) => item.id !== id)
    });
  };

  const handleResetToDefaultAnnouncements = () => {
    setConfig({
      ...config,
      announcements: DEFAULT_ANNOUNCEMENTS
    });
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ToggleRight className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Akses Terbatas</h2>
          <p className="text-gray-500 leading-relaxed mb-8">
            Maaf, anda tidak memiliki izin untuk mengakses modul Pengaturan Gedung. 
            Modul ini hanya dapat diakses oleh Owner, Admin, atau Editor Konten.
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl text-xs font-bold text-gray-400 uppercase tracking-widest">
            Level Akses Anda: {
              userRole === 'owner' ? 'System Owner' :
              userRole === 'admin' ? 'Administrator' :
              userRole === 'bendahara' ? 'Bendahara Gedung Serbaguna' :
              userRole === 'finance' ? 'Administrasi Keuangan' :
              userRole === 'editor' ? 'Editor Konten' : userRole
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pengaturan Konten Publik</h2>
          <p className="text-gray-500 text-sm">Kelola informasi yang tampil pada halaman depan website.</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-blue-800 transition-all"
        >
          {saveStatus === 'saving' ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saveStatus === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saveStatus === 'saving' ? 'Menyimpan...' : saveStatus === 'success' ? 'Berhasil!' : 'Update Tampilan Publik'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Status Ketersediaan (Peningkatan) */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <ToggleRight className="w-6 h-6 text-primary" />
            <h3 className="font-bold text-gray-900 leading-none">Status Operasional Gedung</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between px-1">
                Mode Kontrol
                <span className={`px-2 py-0.5 rounded-full text-[8px] ${config?.manualStatus === 'maintenance' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                  {config?.manualStatus === 'maintenance' ? 'LOCKED: MAINTENANCE' : 'AUTO: BERDASARKAN BOOKING'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setConfig({...config, manualStatus: 'auto', isAvailable: true})}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${config?.manualStatus !== 'maintenance' ? 'border-primary bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                >
                  <ToggleRight className={`w-6 h-6 ${config?.manualStatus !== 'maintenance' ? 'text-primary' : 'text-gray-300'}`} />
                  <span className="text-[10px] font-black uppercase text-gray-900">Otomatis / Normal</span>
                </button>
                
                <button 
                  onClick={() => setConfig({...config, manualStatus: 'maintenance', isAvailable: false})}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${config?.manualStatus === 'maintenance' ? 'border-amber-500 bg-amber-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                >
                  <AlertCircle className={`w-6 h-6 ${config?.manualStatus === 'maintenance' ? 'text-amber-500' : 'text-gray-300'}`} />
                  <span className="text-[10px] font-black uppercase text-gray-900">Maintenance / Tutup</span>
                </button>
              </div>
            </div>

            {config?.manualStatus === 'maintenance' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-amber-50 rounded-2xl border border-amber-100"
              >
                <label className="block text-xs font-bold text-amber-900 mb-2">Alasan / Catatan Publik</label>
                <input 
                  type="text"
                  placeholder="Contoh: Pembersihan Gedung Mingguan"
                  value={config?.manualStatusNote || ''}
                  onChange={(e) => setConfig({ ...config, manualStatusNote: e.target.value })}
                  className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-200 outline-none transition-all shadow-sm"
                />
              </motion.div>
            ) : (
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900">Sistem Berjalan Otomatis</p>
                    <p className="text-[10px] text-blue-700 opacity-70">Status "Tersedia" akan berubah otomatis jika ada booking yang disetujui (Approved) sesuai tanggal hari ini.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transparency Data */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <AlertCircle className="w-6 h-6 text-primary" />
            <h3 className="font-bold text-gray-900">Data Transparansi (Public Counter)</h3>
          </div>
          
          <div className="grid gap-6">
            <div className={!canEditFinancials ? 'opacity-60 cursor-not-allowed' : ''}>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dana Pengembangan (20%)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={config?.devFund || ''}
                  onChange={(e) => canEditFinancials && setConfig({...config, devFund: e.target.value})}
                  readOnly={!canEditFinancials}
                  className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:border-primary transition-colors text-sm ${!canEditFinancials ? 'cursor-not-allowed' : ''}`}
                />
                <Edit3 className="absolute right-4 top-3.5 w-4 h-4 text-gray-300" />
              </div>
              {!canEditFinancials && <p className="text-[10px] text-red-400 font-bold mt-1">Hanya Owner/Admin yang dapat mengubah angka ini</p>}
            </div>
            <div className={!canEditFinancials ? 'opacity-60 cursor-not-allowed' : ''}>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Biaya Operasional (Bulan Ini)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={config?.opsFund || ''}
                  onChange={(e) => canEditFinancials && setConfig({...config, opsFund: e.target.value})}
                  readOnly={!canEditFinancials}
                  className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-900 outline-none focus:border-primary transition-colors text-sm ${!canEditFinancials ? 'cursor-not-allowed' : ''}`}
                />
                <Edit3 className="absolute right-4 top-3.5 w-4 h-4 text-gray-300" />
              </div>
              {!canEditFinancials && <p className="text-[10px] text-red-400 font-bold mt-1">Hanya Owner/Admin yang dapat mengubah angka ini</p>}
            </div>
          </div>
        </div>

        {/* Info Warga / Announcement Ticker Manager */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">Pengumuman Berjalan (Info Warga)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Kelola pesan teks berputar yang tampil di baris teratas website publik.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setConfig({
                  ...config,
                  showAnnouncementTicker: config?.showAnnouncementTicker === false ? true : false
                })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  config?.showAnnouncementTicker !== false
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500 border-gray-200'
                }`}
              >
                {config?.showAnnouncementTicker !== false ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-600" />
                    <span>Status: Aktif Tayang</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                    <span>Status: Disembunyikan</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetToDefaultAnnouncements}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
                title="Muat teks default awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            </div>
          </div>

          {/* Form Tambah Pengumuman */}
          <form onSubmit={handleAddAnnouncement} className="mb-6 p-4 sm:p-5 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-4">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-primary" /> Tambah Pengumuman Baru
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Ketik isi pengumuman untuk warga (contoh: Kerja bakti hari Minggu jam 07.00...)"
                  value={newAnnouncementText}
                  onChange={(e) => setNewAnnouncementText(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={newAnnouncementType}
                  onChange={(e: any) => setNewAnnouncementType(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                >
                  <option value="info">ℹ️ Tipe: Informasi (Normal)</option>
                  <option value="warning">⚠️ Tipe: Perhatian / Penting</option>
                  <option value="success">✅ Tipe: Sukses / Agenda</option>
                </select>

                <button
                  type="submit"
                  disabled={!newAnnouncementText.trim()}
                  className="px-5 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          </form>

          {/* Daftar Pengumuman Saat Ini */}
          <div className="space-y-2.5">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
              Daftar Pesan Berputar ({((config?.announcements || DEFAULT_ANNOUNCEMENTS) as any[]).length} Pesan)
            </label>

            {((config?.announcements || DEFAULT_ANNOUNCEMENTS) as any[]).length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                Belum ada pengumuman. Ketik di atas atau klik "Reset Default" untuk memuat contoh pengumuman.
              </div>
            ) : (
              ((config?.announcements || DEFAULT_ANNOUNCEMENTS) as any[]).map((ann: any, index: number) => {
                const isActive = ann.active !== false;
                return (
                  <div 
                    key={ann.id || index}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start sm:items-center justify-between gap-3 ${
                      isActive 
                        ? 'bg-white border-gray-200/80 hover:border-gray-300 shadow-sm' 
                        : 'bg-gray-50/80 border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-black text-[10px] flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ann.type === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        ann.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {ann.type === 'warning' ? 'Perhatian' : ann.type === 'success' ? 'Agenda' : 'Info'}
                      </span>

                      <p className={`text-xs sm:text-sm font-medium ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-500 line-through'}`}>
                        {ann.text}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleAnnouncementActive(ann.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        title="Hapus pengumuman ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Facilities Editor */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Settings2 className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-gray-900">Kelola Fasilitas & Tarif</h3>
            </div>
            <button 
              onClick={handleAddFacility}
              className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Paket
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                  <th className="pb-4 px-2">Visual</th>
                  <th className="pb-4 px-2">Nama Fasilitas/Paket</th>
                  <th className="pb-4 px-2">Tarif Publik</th>
                  <th className="pb-4 px-2">Durasi</th>
                  <th className="pb-4 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {facilities.map((fac) => (
                  <tr key={fac.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-6 px-2">
                       <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden group/img">
                         {fac.imageUrl ? (
                           <img src={fac.imageUrl} alt={fac.title} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center">
                             <ImageIcon className="w-5 h-5 text-gray-300" />
                           </div>
                         )}
                         <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                            <Upload className="w-4 h-4 text-white" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(fac.id, file);
                              }}
                            />
                         </label>
                         {isUploading === fac.id && (
                           <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                             <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                           </div>
                         )}
                       </div>
                    </td>
                    <td className="py-6 px-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{fac.title}</span>
                        {fac.highlight && <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full">POPULER</div>}
                      </div>
                    </td>
                    <td className="py-6 px-2">
                      <span className="font-bold text-primary">{fac.price}</span>
                    </td>
                    <td className="py-6 px-2">
                      <span className="text-sm text-gray-500">{fac.duration}</span>
                    </td>
                    <td className="py-6 px-2 text-right">
                      <div className="flex justify-end gap-2 px-2">
                        <button 
                          onClick={() => setEditingFacility(fac)}
                          className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 hover:shadow-sm transition-all"
                        >
                          Atur Detail
                        </button>
                        <button 
                          onClick={() => handleDeleteFacility(fac.id, fac.title)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Professional Facility Editing Modal */}
      <AnimatePresence>
        {editingFacility && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingFacility(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    <Settings2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">Detail Paket Sewa</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Konfigurasi Fasilitas & Penawaran</p>
                  </div>
                </div>
                <button onClick={() => setEditingFacility(null)} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nama Fasilitas/Paket</label>
                    <input 
                      type="text" 
                      value={editingFacility.title}
                      onChange={(e) => handleUpdateEditing('title', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pilih Icon Representatif</label>
                    <select 
                      value={editingFacility.iconName}
                      onChange={(e) => handleUpdateEditing('iconName', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    >
                      {ICON_OPTIONS.map(opt => (
                        <option key={opt.name} value={opt.name}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tarif Sewa (Format Bebas)</label>
                    <input 
                      type="text" 
                      value={editingFacility.price}
                      onChange={(e) => handleUpdateEditing('price', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/10 transition-all font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Satuan Durasi</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Per Acara / Per Jam"
                      value={editingFacility.duration}
                      onChange={(e) => handleUpdateEditing('duration', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-500 outline-none focus:ring-2 focus:ring-primary/10 transition-all font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Estimasi Kapasitas</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 500 Orang"
                      value={editingFacility.capacity || ''}
                      onChange={(e) => handleUpdateEditing('capacity', e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleUpdateEditing('highlight', !editingFacility.highlight)}
                      className={`flex-1 p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${editingFacility.highlight ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {editingFacility.highlight ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      <span className="font-black text-xs uppercase tracking-widest">Tandai Populer</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Daftar Keunggulan/Fitur</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(editingFacility.features || []).map((feat: string, i: number) => (
                      <div key={i} className="bg-blue-50 text-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-blue-100 group">
                        {feat}
                        <button 
                          onClick={() => handleToggleFeature(feat)}
                          className="p-1 hover:bg-white rounded-md text-primary/40 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddCustomFeature} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Tambah fitur (Contoh: Panggung Besar, AC, Kursi Lipat)"
                      className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                    <button type="submit" className="p-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-colors">
                      <Plus className="w-6 h-6" />
                    </button>
                  </form>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Deskripsi Singkat (Opsional)</label>
                  <textarea 
                    rows={3}
                    value={editingFacility.description || ''}
                    onChange={(e) => handleUpdateEditing('description', e.target.value)}
                    placeholder="Tuliskan penjelasan singkat paket ini..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    onClick={() => setEditingFacility(null)}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Batalkan
                  </button>
                  <button 
                    onClick={saveFacilityUpdate}
                    className="flex-[2] px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-3"
                  >
                    {saveStatus === 'saving' ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Simpan Perubahan Paket
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        isAlert={confirmConfig.isAlert}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDeleteFacility}
        title="Hapus Paket Fasilitas?"
        message={`Apakah Anda yakin ingin menghapus paket "${confirmModal.facilityTitle}"? Paket ini tidak akan muncul lagi di halaman depan.`}
      />
    </div>
  );
}
