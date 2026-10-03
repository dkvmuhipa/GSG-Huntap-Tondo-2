import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Home, 
  Star, 
  ExternalLink, 
  Phone, 
  MessageCircle, 
  Sparkles, 
  Eye, 
  X,
  Upload,
  Image as ImageIcon,
  Check,
  Building2,
  Clock,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { Vendor, VENDOR_CATEGORIES, VendorCategory } from '../../types/vendor';
import { upsertVendor, removeVendor } from '../../lib/db';
import { uploadToCloudinary } from '../../lib/cloudinary';
import ConfirmModal from '../../components/ui/ConfirmModal';
import VendorDetailModal from '../../components/vendors/VendorDetailModal';

export default function VendorManager() {
  const { userRole } = useOutletContext<{ userRole: string }>();
  const isAuthorized = ['owner', 'admin', 'editor', 'bendahara'].includes(userRole);

  const vendors = useAppStore(state => state.vendors);
  const [activeTab, setActiveTab] = useState<'all' | 'huntap' | 'pending' | 'inactive'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [previewVendor, setPreviewVendor] = useState<Vendor | null>(null);

  // Confirm delete modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    vendorId: string;
    vendorName: string;
  }>({
    isOpen: false,
    vendorId: '',
    vendorName: ''
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'catering' as VendorCategory,
    ownerName: '',
    phone: '',
    instagram: '',
    address: '',
    isHuntapResident: true,
    huntapBlock: '',
    description: '',
    servicesInput: '',
    startingPrice: '',
    priceUnit: 'paket',
    imageUrl: '',
    galleryInput: '',
    status: 'active' as 'active' | 'pending' | 'inactive',
    featured: false,
    isVerified: true
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const total = vendors.length;
    const huntap = vendors.filter(v => v.isHuntapResident).length;
    const pending = vendors.filter(v => v.status === 'pending').length;
    const active = vendors.filter(v => v.status === 'active').length;
    return { total, huntap, pending, active };
  }, [vendors]);

  // Filtered List
  const filteredVendors = useMemo(() => {
    return vendors.filter(vendor => {
      // Tab filter
      if (activeTab === 'huntap' && !vendor.isHuntapResident) return false;
      if (activeTab === 'pending' && vendor.status !== 'pending') return false;
      if (activeTab === 'inactive' && vendor.status !== 'inactive') return false;

      // Category filter
      if (selectedCategory !== 'all' && vendor.category !== selectedCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = vendor.name.toLowerCase().includes(query);
        const matchOwner = vendor.ownerName.toLowerCase().includes(query);
        const matchDesc = vendor.description.toLowerCase().includes(query);
        const matchBlock = vendor.huntapBlock?.toLowerCase().includes(query);
        if (!matchName && !matchOwner && !matchDesc && !matchBlock) return false;
      }

      return true;
    });
  }, [vendors, activeTab, selectedCategory, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingVendor(null);
    setFormData({
      name: '',
      category: 'catering',
      ownerName: '',
      phone: '',
      instagram: '',
      address: 'Huntap Tondo 2, Kota Palu',
      isHuntapResident: true,
      huntapBlock: '',
      description: '',
      servicesInput: '',
      startingPrice: '',
      priceUnit: 'paket',
      imageUrl: '',
      galleryInput: '',
      status: 'active',
      featured: false,
      isVerified: true
    });
    setImageFile(null);
    setImagePreview('');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      category: vendor.category,
      ownerName: vendor.ownerName,
      phone: vendor.phone,
      instagram: vendor.instagram || '',
      address: vendor.address,
      isHuntapResident: vendor.isHuntapResident,
      huntapBlock: vendor.huntapBlock || '',
      description: vendor.description,
      servicesInput: (vendor.services || []).join(', '),
      startingPrice: vendor.startingPrice ? vendor.startingPrice.toString() : '',
      priceUnit: vendor.priceUnit || 'paket',
      imageUrl: vendor.imageUrl || '',
      galleryInput: (vendor.galleryUrls || []).join('\n'),
      status: vendor.status || 'active',
      featured: !!vendor.featured,
      isVerified: !!vendor.isVerified
    });
    setImageFile(null);
    setImagePreview(vendor.imageUrl || '');
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.ownerName.trim() || !formData.phone.trim()) {
      setFormError('Nama usaha, nama penanggung jawab, dan nomor WhatsApp wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const { url } = await uploadToCloudinary(imageFile);
        finalImageUrl = url;
      }

      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80';
      }

      const services = formData.servicesInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const galleryUrls = formData.galleryInput
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      if (finalImageUrl && !galleryUrls.includes(finalImageUrl)) {
        galleryUrls.unshift(finalImageUrl);
      }

      const payload: Partial<Vendor> = {
        name: formData.name.trim(),
        category: formData.category,
        ownerName: formData.ownerName.trim(),
        phone: formData.phone.trim(),
        instagram: formData.instagram.trim(),
        address: formData.address.trim(),
        isHuntapResident: formData.isHuntapResident,
        huntapBlock: formData.huntapBlock.trim(),
        description: formData.description.trim(),
        services: services.length > 0 ? services : ['Layanan Acara'],
        startingPrice: Number(formData.startingPrice) || 0,
        priceUnit: formData.priceUnit.trim() || 'paket',
        imageUrl: finalImageUrl,
        galleryUrls: galleryUrls.length > 0 ? galleryUrls : [finalImageUrl],
        status: formData.status,
        featured: formData.featured,
        isVerified: formData.isVerified
      };

      if (editingVendor) {
        await upsertVendor(editingVendor.id, payload);
      } else {
        await upsertVendor(null, payload);
      }

      setIsFormModalOpen(false);
      setEditingVendor(null);
    } catch (err: any) {
      console.error(err);
      setFormError('Gagal menyimpan data vendor: ' + (err.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (vendor: Vendor, newStatus: 'active' | 'inactive') => {
    try {
      await upsertVendor(vendor.id, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprovePending = async (vendor: Vendor) => {
    try {
      await upsertVendor(vendor.id, {
        status: 'active',
        isVerified: true
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFeatured = async (vendor: Vendor) => {
    try {
      await upsertVendor(vendor.id, { featured: !vendor.featured });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (vendor: Vendor) => {
    setConfirmModal({
      isOpen: true,
      vendorId: vendor.id,
      vendorName: vendor.name
    });
  };

  const confirmDelete = async () => {
    try {
      await removeVendor(confirmModal.vendorId);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center text-gray-500">
        Anda tidak memiliki izin untuk mengelola Mitra Vendor & UMKM.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider mb-2">
            <Store className="w-4 h-4" />
            <span>Pemberdayaan Ekonomi Warga</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mitra Vendor & UMKM</h2>
          <p className="text-gray-500 text-sm mt-1">
            Kelola direktori rekomendasi vendor pesta, katering, tenda, sound system & MUA untuk penyewa gedung.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-primary hover:bg-blue-800 active:scale-95 text-white px-7 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Mitra Baru</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Total Mitra Terdaftar</span>
          <p className="text-3xl font-black text-gray-900">{stats.total}</p>
          <span className="text-xs text-gray-500 mt-1 block">Semua kategori layanan</span>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-100 p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block mb-1">UMKM Warga Huntap</span>
          <p className="text-3xl font-black text-emerald-900">{stats.huntap}</p>
          <span className="text-xs text-emerald-700/80 mt-1 block">Warga Huntap Tondo 2</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-100 p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block mb-1">Mitra Tayang Aktif</span>
          <p className="text-3xl font-black text-blue-900">{stats.active}</p>
          <span className="text-xs text-blue-700/80 mt-1 block">Terverifikasi & Tayang</span>
        </div>

        <div className="bg-amber-50/80 border border-amber-100 p-6 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block mb-1">Menunggu Verifikasi</span>
          <p className="text-3xl font-black text-amber-900">{stats.pending}</p>
          <span className="text-xs text-amber-700/80 mt-1 block">Pendaftaran warga baru</span>
        </div>
      </div>

      {/* Tab & Search Filter Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'all' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Semua ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('huntap')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'huntap' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Warga Huntap ({stats.huntap})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span>Perlu Verifikasi</span>
              {stats.pending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === 'inactive' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Non-Aktif
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama usaha, pemilik, blok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:bg-white focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider shrink-0 mr-1">
            Kategori:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            Semua
          </button>
          {VENDOR_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Table / List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                <th className="px-6 py-4">Mitra / Usaha</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Kontak & Lokasi</th>
                <th className="px-6 py-4">Estimasi Tarif</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
              {filteredVendors.map((vendor) => {
                const categoryMeta = VENDOR_CATEGORIES.find(c => c.id === vendor.category);

                return (
                  <tr key={vendor.id} className="hover:bg-gray-50/40 transition-colors">
                    {/* Name & Thumbnail */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={vendor.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
                          alt={vendor.name}
                          className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-gray-100"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-black text-gray-900 text-sm truncate">{vendor.name}</p>
                            {vendor.isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" title="Terverifikasi" />
                            )}
                            {vendor.featured && (
                              <span className="p-0.5 rounded bg-amber-100 text-amber-600" title="Mitra Unggulan">
                                <Sparkles className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500">PJ: {vendor.ownerName}</p>
                          {vendor.isHuntapResident && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5">
                              <Home className="w-2.5 h-2.5" />
                              Warga Huntap {vendor.huntapBlock ? `(${vendor.huntapBlock})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-xl bg-gray-50 text-gray-700 font-bold text-[11px] border border-gray-100">
                        {categoryMeta?.label || vendor.category}
                      </span>
                    </td>

                    {/* Contact & Location */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{vendor.phone}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{vendor.address}</p>
                      {vendor.instagram && (
                        <p className="text-[10px] text-pink-600 font-semibold">{vendor.instagram}</p>
                      )}
                    </td>

                    {/* Starting Price */}
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900">
                        Rp {vendor.startingPrice.toLocaleString('id-ID')}
                      </p>
                      <span className="text-[10px] text-gray-400">/ {vendor.priceUnit}</span>
                    </td>

                    {/* Status Pill */}
                    <td className="px-6 py-4 text-center">
                      {vendor.status === 'active' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-black text-[10px] uppercase">
                          Aktif Tayang
                        </span>
                      ) : vendor.status === 'pending' ? (
                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-black text-[10px] uppercase animate-pulse">
                          Menunggu
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-black text-[10px] uppercase">
                          Non-Aktif
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* If Pending, Show Approve Button */}
                        {vendor.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleApprovePending(vendor)}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Setujui & Publikasikan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setPreviewVendor(vendor)}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                          title="Lihat Pratinjau Publik"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(vendor)}
                          className={`p-2 rounded-xl transition-colors ${
                            vendor.featured ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-400'
                          }`}
                          title={vendor.featured ? 'Hapus dari Rekomendasi Unggulan' : 'Jadikan Rekomendasi Unggulan'}
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(vendor)}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Edit Data Mitra"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(vendor)}
                          className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Hapus Mitra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-gray-400 italic">
                    Tidak ada mitra yang ditemukan pada filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Add / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div 
            onClick={() => setIsFormModalOpen(false)}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]"
          >
            <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {editingVendor ? 'Edit Data Mitra Vendor' : 'Tambah Mitra Vendor Baru'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Lengkapi data profil usaha untuk ditayangkan di direktori warga & penyewa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="p-6 sm:p-8 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Status & Resident Checks */}
              <div className="grid sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isHuntapResident}
                    onChange={(e) => setFormData(prev => ({ ...prev, isHuntapResident: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Warga Huntap</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Terverifikasi Resmi</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>Mitra Unggulan</span>
                </label>
              </div>

              {formData.isHuntapResident && (
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Blok Hunian Huntap</label>
                  <input
                    type="text"
                    placeholder="Contoh: Blok B-18"
                    value={formData.huntapBlock}
                    onChange={(e) => setFormData(prev => ({ ...prev, huntapBlock: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Nama Usaha / Brand *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Kategori Layanan *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as VendorCategory }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                  >
                    {VENDOR_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Nama Penanggung Jawab *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0822..."
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Estimasi Tarif Mulai (Rp)</label>
                  <input
                    type="number"
                    value={formData.startingPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, startingPrice: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formData.priceUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceUnit: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Instagram (Opsional)</label>
                <input
                  type="text"
                  placeholder="@nama_akun"
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Deskripsi Lengkap Usaha</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Daftar Layanan / Menu (Pisahkan koma)</label>
                <input
                  type="text"
                  placeholder="Prasmanan, Kambing Guling, Snack Box"
                  value={formData.servicesInput}
                  onChange={(e) => setFormData(prev => ({ ...prev, servicesInput: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Foto Sampul Utama</label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border" />
                  ) : null}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                        setImagePreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-500 mb-1">Status Penayangan</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-900 outline-none focus:bg-white focus:border-primary"
                >
                  <option value="active">Aktif (Tayang di Web Publik)</option>
                  <option value="pending">Menunggu Verifikasi (Pending)</option>
                  <option value="inactive">Non-Aktif (Arsip)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-black uppercase transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-primary hover:bg-blue-800 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Data Mitra'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Detail Preview Modal */}
      <VendorDetailModal
        vendor={previewVendor}
        isOpen={!!previewVendor}
        onClose={() => setPreviewVendor(null)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete}
        title="Hapus Data Mitra?"
        message={`Apakah Anda yakin ingin menghapus data mitra "${confirmModal.vendorName}" dari direktori resmi?`}
      />
    </div>
  );
}
