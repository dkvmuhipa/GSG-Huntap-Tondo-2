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
    <section id="mitra-vendor" className="section-padding scroll-mt-28 bg-[#F8F9FA] border-t border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10 text-center md:text-left">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF] mb-2">
              <Store className="w-4 h-4 text-[#1E40AF]" strokeWidth={1.75} />
              <span>Direktori UMKM & vendor lokal</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] tracking-tight">
              Mitra & Rekomendasi Acara
            </h2>
            <p className="text-[#4B5563] text-sm sm:text-base mt-3 leading-relaxed">
              Temukan katering, pelaminan, foto, MUA, dan sound system terpercaya dari warga lokal Huntap Tondo 2 & Kota Palu untuk menyempurnakan acara Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-lg bg-[#FCFCFD] hover:bg-[#F1F3F5] text-[#111827] text-xs font-medium border border-[#D1D5DB] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#1E40AF]" />
              <span>Daftarkan Usaha Anda</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-[#FCFCFD] p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] mb-6 sm:mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input 
                type="text"
                placeholder="Cari vendor katering, dekorasi, tenda, sound system, MUA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[44px] bg-[#F8F9FA] border border-[#D1D5DB] rounded-lg pl-10 pr-10 py-2.5 text-xs font-medium text-[#111827] placeholder:text-[#6B7280] outline-none focus:bg-[#FCFCFD] focus:border-[#1E40AF] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] flex items-center justify-center text-[#6B7280] hover:text-[#111827] rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Toggle Only Huntap Residents */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-[#F8F9FA] border border-[#E5E7EB] min-h-[44px] px-4 py-2 rounded-lg shrink-0">
              <div className="flex items-center gap-2">
                <Home className={`w-4 h-4 ${onlyHuntapResidents ? 'text-[#16A34A]' : 'text-[#6B7280]'}`} />
                <span className="text-xs font-medium text-[#111827]">Warga Huntap Saja</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={onlyHuntapResidents}
                onClick={() => setOnlyHuntapResidents(!onlyHuntapResidents)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${onlyHuntapResidents ? 'bg-[#16A34A]' : 'bg-[#D1D5DB]'}`}
              >
                <span 
                  className={`block w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${onlyHuntapResidents ? 'translate-x-6' : 'translate-x-1'}`}
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
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors flex items-center gap-2 shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E40AF] text-white border-[#1E40AF]'
                      : 'bg-[#F8F9FA] hover:bg-[#F1F3F5] text-[#4B5563] border-[#E5E7EB]'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
          <div className="bg-[#FCFCFD] rounded-2xl p-8 sm:p-12 text-center border border-[#E5E7EB] max-w-lg mx-auto">
            <div className="w-14 h-14 bg-[#F1F3F5] text-[#6B7280] rounded-xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-[#111827] mb-1">Tidak Ada Mitra Ditemukan</h3>
            <p className="text-xs text-[#4B5563] mb-6 leading-relaxed">
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
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E40AF] text-white text-xs font-medium hover:bg-[#1D3A8A] transition-colors cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        )}

        {/* Bottom Banner Callout */}
        <div className="mt-10 sm:mt-12 p-6 sm:p-8 rounded-2xl bg-[#1E3A8A] text-white border border-[#1E3A8A] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <span className="text-xs font-medium text-blue-200 block mb-1">
              Dukungan UMKM Mandiri Tondo 2
            </span>
            <h3 className="text-xl sm:text-2xl font-display font-bold tracking-tight mb-2">
              Punya Usaha Katering, Tenda, Sound, atau Rias?
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Pengelola Gedung Serbaguna Huntap Tondo 2 memberikan kesempatan bagi seluruh warga dan pelaku UMKM lokal untuk mempromosikan layanannya secara gratis tanpa dipungut biaya perantara.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsRegisterOpen(true)}
            className="w-full md:w-auto shrink-0 min-h-[44px] px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
