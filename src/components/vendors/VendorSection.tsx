import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, 
  Search, 
  Filter, 
  Home, 
  PlusCircle, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  X,
  Building2,
  Utensils,
  Camera,
  Crown,
  Volume2,
  Tent,
  Cookie,
  Gift
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Vendor, VENDOR_CATEGORIES, VendorCategory } from '../../types/vendor';
import VendorCard from './VendorCard';
import VendorDetailModal from './VendorDetailModal';
import VendorRegistrationModal from './VendorRegistrationModal';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Layers,
  catering: Utensils,
  decoration: Sparkles,
  photography: Camera,
  mua: Crown,
  sound_genset: Volume2,
  tent_chairs: Tent,
  snack_umkm: Cookie,
  souvenir_invitation: Gift
};

export default function VendorSection() {
  const vendors = useAppStore(state => state.vendors);
  const [selectedCategory, setSelectedCategory] = useState<VendorCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyHuntapResidents, setOnlyHuntapResidents] = useState(false);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Filter only active vendors for the public view
  const activeVendors = useMemo(() => {
    return (vendors || []).filter(v => v.status !== 'inactive' && v.status !== 'pending');
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return activeVendors.filter(vendor => {
      // Category filter
      if (selectedCategory !== 'all' && vendor.category !== selectedCategory) {
        return false;
      }

      // Huntap resident filter
      if (onlyHuntapResidents && !vendor.isHuntapResident) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = vendor.name.toLowerCase().includes(query);
        const matchOwner = vendor.ownerName.toLowerCase().includes(query);
        const matchDesc = vendor.description.toLowerCase().includes(query);
        const matchServices = vendor.services.some(s => s.toLowerCase().includes(query));
        const matchAddress = vendor.address.toLowerCase().includes(query);
        if (!matchName && !matchOwner && !matchDesc && !matchServices && !matchAddress) {
          return false;
        }
      }

      return true;
    });
  }, [activeVendors, selectedCategory, onlyHuntapResidents, searchQuery]);

  const handleOpenDetail = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDetailOpen(true);
  };

  return (
    <section id="mitra-vendor" className="section-padding bg-slate-50/70 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-center md:text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4">
              <Store className="w-4 h-4 text-primary" />
              <span>Direktori UMKM & Vendor Lokal</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
              Mitra & Rekomendasi Acara
            </h2>
            <p className="text-gray-500 text-sm md:text-base mt-3 leading-relaxed">
              Temukan katering, pelaminan, foto, MUA, dan sound system terpercaya dari warga lokal Huntap Tondo 2 & Kota Palu untuk menyempurnakan pesta atau pertemuan Anda di gedung serbaguna.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 text-xs font-black uppercase tracking-wider border border-gray-200/80 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-primary" />
              <span>Daftarkan Usaha Anda</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Cari vendor katering, dekorasi, tenda, sound system, MUA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl pl-11 pr-10 py-3 text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toggle Only Huntap Residents */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-2xl shrink-0">
              <div className="flex items-center gap-2">
                <Home className={`w-4 h-4 ${onlyHuntapResidents ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className="text-xs font-black text-gray-700">Warga Huntap Saja</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={onlyHuntapResidents}
                onClick={() => setOnlyHuntapResidents(!onlyHuntapResidents)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${onlyHuntapResidents ? 'bg-emerald-500' : 'bg-gray-300'}`}
              >
                <span 
                  className={`block w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${onlyHuntapResidents ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          {/* Category Filter Pills (Horizontal Scrollable) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            {VENDOR_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] || Layers;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as VendorCategory)}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <VendorCard 
                key={vendor.id} 
                vendor={vendor} 
                onSelect={handleOpenDetail} 
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-1">Tidak Ada Mitra Ditemukan</h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              {searchQuery || onlyHuntapResidents || selectedCategory !== 'all'
                ? 'Tidak ada vendor yang cocok dengan filter atau kata kunci pencarian Anda.'
                : 'Belum ada data vendor yang terdaftar saat ini.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyHuntapResidents(false);
              }}
              className="px-6 py-3 rounded-2xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-blue-800 transition-colors shadow-sm"
            >
              Reset Semua Filter
            </button>
          </div>
        )}

        {/* Bottom Banner Callout */}
        <div className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block mb-1">
              Dukungan UMKM Mandiri Tondo 2
            </span>
            <h3 className="text-2xl font-black tracking-tight mb-2">
              Punya Usaha Katering, Tenda, Sound, atau Rias?
            </h3>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              Pengelola Gedung Serbaguna Huntap Tondo 2 memberikan kesempatan bagi seluruh warga dan pelaku UMKM lokal untuk mempromosikan layanannya secara gratis tanpa dipungut biaya perantara.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="shrink-0 px-8 py-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-amber-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-400/20 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Gabung Jadi Mitra Kami</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <VendorDetailModal
        vendor={selectedVendor}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedVendor(null);
        }}
      />

      <VendorRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
    </section>
  );
}
