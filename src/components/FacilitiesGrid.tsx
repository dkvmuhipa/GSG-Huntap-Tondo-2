import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PartyPopper, 
  Dumbbell, 
  Users2, 
  Music, 
  Check, 
  Info, 
  Building2, 
  Calendar, 
  Heart, 
  Utensils, 
  Clock,
  Calculator,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { checkCurrentAvailability } from '../lib/db';
import { useAppStore } from '../store/useAppStore';

const ICON_MAP: { [key: string]: any } = {
  PartyPopper,
  Dumbbell,
  Users2,
  Music,
  Building2,
  Calendar,
  Heart,
  Utensils
};

interface AddonItem {
  id: string;
  name: string;
  unitPrice: number;
  min: number;
  max: number;
  step: number;
  unitLabel: string;
}

const DEFAULT_ADDONS: AddonItem[] = [
  { id: 'kursi', name: 'Kursi Lipat Chitose', unitPrice: 5000, min: 0, max: 500, step: 10, unitLabel: 'kursi' },
  { id: 'meja', name: 'Meja Bulat Banquet', unitPrice: 20000, min: 0, max: 60, step: 2, unitLabel: 'meja' },
  { id: 'sound', name: 'Sound System 5000W + Mic Wireless', unitPrice: 500000, min: 0, max: 2, step: 1, unitLabel: 'set' },
  { id: 'ac', name: 'AC Portable Standing 2PK', unitPrice: 250000, min: 0, max: 6, step: 1, unitLabel: 'unit' },
  { id: 'genset', name: 'Genset Silent Honda 10kVA', unitPrice: 300000, min: 0, max: 2, step: 1, unitLabel: 'unit' },
  { id: 'tenda', name: 'Tenda Sarnafil VIP 5x5m', unitPrice: 150000, min: 0, max: 10, step: 1, unitLabel: 'plafon' },
];

interface FacilityCardProps {
  fac: any;
  index: number;
  bookings: any[];
  config: any;
  onOpenBooking: (pkg?: string) => void;
}

const FacilityCard: React.FC<FacilityCardProps> = ({ fac, index, bookings, config, onOpenBooking }) => {
  const IconComponent = ICON_MAP[fac.iconName] || Users2;
  const availability = checkCurrentAvailability(bookings, config, fac.title);
  const isBusy = availability.isBusy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      className={`rounded-2xl border overflow-hidden relative group flex flex-col justify-between transition-colors ${
        fac.highlight 
          ? 'bg-[#FCFCFD] border-[#1E40AF] ring-1 ring-[#1E40AF]/15' 
          : 'bg-[#F8F9FA] border-[#E5E7EB] hover:bg-[#FCFCFD] hover:border-[#1E40AF]/35'
      }`}
    >
      {/* Image Section */}
      <div>
        <div className="h-48 relative overflow-hidden bg-[#F1F3F5]">
          {fac.imageUrl ? (
            <img 
              src={fac.imageUrl} 
              alt={fac.title} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" 
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${fac.highlight ? 'bg-[#EFF6FF]' : 'bg-[#F1F3F5]'}`}>
              <IconComponent className={`w-12 h-12 ${fac.highlight ? 'text-[#1E40AF]' : 'text-[#6B7280]'}`} strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 via-[#111827]/20 to-transparent flex items-end p-5 z-10">
            <div className="flex flex-col text-left">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${fac.highlight ? 'bg-[#1E40AF] text-white' : 'bg-white/95 text-[#1E40AF] border border-white/40'}`}>
                <IconComponent className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <h3 className="text-lg font-semibold text-white tracking-tight">{fac.title}</h3>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`absolute top-3.5 right-3.5 px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 z-10 border ${
            isBusy ? 'bg-[#DC2626] text-white border-[#B91C1C]' : 'bg-[#FCFCFD]/95 text-[#15803D] border-[#BBF7D0]'
          }`}>
            <span className={`inline-flex rounded-full h-2 w-2 ${isBusy ? 'bg-white' : 'bg-[#16A34A]'}`} />
            {isBusy ? 'Terpakai' : 'Tersedia'}
          </div>
        </div>
        
        <div className="p-5 sm:p-6 text-left">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {fac.capacity && (
              <div className="px-2.5 py-1 bg-[#F1F3F5] text-[11px] font-medium text-[#4B5563] rounded-md border border-[#E5E7EB]">
                Kapasitas: {fac.capacity}
              </div>
            )}
            {fac.highlight && (
              <div className="px-2.5 py-1 bg-[#1E40AF] text-[11px] font-medium text-white rounded-md">
                Terfavorit
              </div>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 mb-5">
            <span className="text-2xl sm:text-3xl font-mono tabular-nums font-semibold text-[#111827] tracking-tight">{fac.price}</span>
            <span className="text-xs text-[#6B7280]">/ {fac.duration}</span>
          </div>

          <div className="space-y-2.5 mb-4">
            {(fac.features || []).slice(0, 4).map((feat: string, i: number) => (
              <div key={`${feat}-${i}`} className="flex items-center gap-2.5 text-xs text-[#4B5563]">
                <div className="w-4 h-4 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-[#16A34A] stroke-[2.5px]" />
                </div>
                <span className="line-clamp-1">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 pt-0 z-10">
        <button 
          onClick={() => onOpenBooking(fac.title)}
          disabled={isBusy}
          className={`w-full min-h-[44px] py-3 px-4 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
            isBusy 
              ? 'bg-[#F1F3F5] text-[#6B7280] cursor-not-allowed' 
              : fac.highlight 
                ? 'bg-[#1E40AF] text-white hover:bg-[#1D3A8A]' 
                : 'bg-[#FCFCFD] border border-[#D1D5DB] text-[#111827] hover:bg-[#F1F3F5]'
          }`}
        >
          <span>{isBusy ? 'Sudah Dipesan Hari Ini' : 'Ajukan Paket Ini'}</span>
          {!isBusy && (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

interface FacilitiesGridProps {
  onOpenBooking: (pkg?: string) => void;
}

export default function FacilitiesGrid({ onOpenBooking }: FacilitiesGridProps) {
  const facilities = useAppStore(state => state.facilities);
  const bookings = useAppStore(state => state.bookings);
  const config = useAppStore(state => state.config);

  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [addonCounts, setAddonCounts] = useState<{ [id: string]: number }>({
    kursi: 50,
    meja: 6,
    sound: 0,
    ac: 0,
    genset: 0,
    tenda: 0
  });

  const displayFacilities = facilities.length > 0 ? facilities : [
    {
      id: 'mock-1',
      title: 'Resepsi & Acara Besar',
      price: 'Rp 500.000',
      duration: 'Durasi 12 Jam',
      iconName: 'PartyPopper',
      features: ['Kapasitas 300 Orang', 'Meja & Kursi Standar', 'Sirkulasi Udara Alami', 'Ruang Ganti'],
      highlight: true
    },
    {
      id: 'mock-2',
      title: 'Kegiatan Olahraga',
      price: 'Rp 50.000',
      duration: 'Per Jam',
      iconName: 'Dumbbell',
      features: ['Badminton / Karate', 'Penerangan Memadai', 'Wastafel & Toilet', 'Parkir Luas'],
      highlight: false
    },
    {
      id: 'mock-3',
      title: 'Rapat / Musik',
      price: 'Rp 150.000',
      duration: 'Durasi 4 Jam',
      iconName: 'Music',
      features: ['Sound System Standar', 'Sirkulasi Udara', 'Panggung Kecil', 'Kebersihan Terjamin'],
      highlight: false
    }
  ];

  // Set default package if not selected
  useEffect(() => {
    if (!selectedPackageId && displayFacilities.length > 0) {
      setSelectedPackageId(displayFacilities[0].id);
    }
  }, [displayFacilities, selectedPackageId]);

  const selectedFacility = useMemo(() => {
    return displayFacilities.find(f => f.id === selectedPackageId) || displayFacilities[0];
  }, [displayFacilities, selectedPackageId]);

  const packagePriceNumber = useMemo(() => {
    return Number(String(selectedFacility?.price || '').replace(/\D/g, '')) || 0;
  }, [selectedFacility]);

  const addonsTotal = useMemo(() => {
    return DEFAULT_ADDONS.reduce((sum, item) => {
      const count = addonCounts[item.id] || 0;
      return sum + (count * item.unitPrice);
    }, 0);
  }, [addonCounts]);

  const cleaningFee = 25000;
  const grandTotal = packagePriceNumber + addonsTotal + cleaningFee;

  const updateAddon = (id: string, delta: number, step: number, min: number, max: number) => {
    setAddonCounts(prev => {
      const current = prev[id] || 0;
      const next = Math.max(min, Math.min(max, current + (delta * step)));
      return { ...prev, [id]: next };
    });
  };

  const resetAddons = () => {
    setAddonCounts({
      kursi: 0,
      meja: 0,
      sound: 0,
      ac: 0,
      genset: 0,
      tenda: 0
    });
  };

  return (
    <section id="fasilitas" className="py-12 sm:py-16 lg:py-20 bg-[#FCFCFD] scroll-mt-28 border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 sm:mb-12 gap-5 sm:gap-6 text-left">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#1E40AF] mb-2">
              <Sparkles className="w-4 h-4" strokeWidth={1.75} />
              <span>Pilihan fasilitas</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E293B] mb-3 tracking-tight">
              Fasilitas &amp; Tarif Sewa
            </h2>
            <p className="text-[#4B5563] text-sm sm:text-base leading-relaxed">
              Pilih paket penggunaan sesuai kebutuhan acara Anda. Harga flat, terjangkau, dan transparan untuk seluruh warga.
            </p>
          </div>
          <div className="bg-[#EFF6FF] px-4 py-2.5 rounded-xl border border-[#BFDBFE] flex items-center gap-2 text-xs font-medium text-[#1E40AF] w-full md:w-auto">
            <Info className="w-4 h-4 shrink-0" />
            <span className="font-mono tabular-nums">Tarif di luar iuran kebersihan gedung (Rp 25.000)</span>
          </div>
        </div>

        {/* Facilities Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {displayFacilities.map((fac, index) => (
            <FacilityCard
              key={fac.id || `fac-${index}`}
              fac={fac}
              index={index}
              bookings={bookings}
              config={config}
              onOpenBooking={onOpenBooking}
            />
          ))}
        </div>

        {/* INTEGRATED COST CALCULATOR DRAWER */}
        <div className="mt-10 sm:mt-12">
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
            className="w-full min-h-[44px] bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E5E7EB] p-4 sm:p-5 rounded-2xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-left group cursor-pointer"
          >
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-xl flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm sm:text-base text-[#111827] leading-snug">
                  Butuh Tambahan Kursi, Meja, AC, atau Sound System?
                </h4>
                <p className="text-xs text-[#4B5563] mt-0.5">
                  Klik untuk membuka simulasi perhitungan biaya perlengkapan tambahan secara transparan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-[#1E40AF] shrink-0 self-end sm:self-center sm:ml-4">
              <span>{isCalculatorOpen ? 'Tutup Simulasi' : 'Buka Kalkulator Biaya'}</span>
              {isCalculatorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {/* Expandable Calculator Body */}
          <AnimatePresence>
            {isCalculatorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="bg-[#FCFCFD] rounded-2xl border border-[#E5E7EB] p-4 sm:p-8 mt-4 text-left">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6 sm:gap-8">
                    
                    {/* Left: Controls */}
                    <div className="flex-1 w-full min-w-0 space-y-6">
                      <div>
                        <label className="text-xs font-medium text-[#6B7280] block mb-2">
                          1. Pilih Paket Dasar Gedung
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {displayFacilities.map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setSelectedPackageId(f.id)}
                              className={`min-h-[44px] p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                selectedPackageId === f.id
                                  ? 'border-[#1E40AF] bg-[#EFF6FF]'
                                  : 'border-[#E5E7EB] bg-[#F8F9FA] hover:border-[#D1D5DB]'
                              }`}
                            >
                              <span className="font-semibold text-xs text-[#111827] block truncate">{f.title}</span>
                              <span className="font-mono tabular-nums font-semibold text-xs text-[#1E40AF]">{f.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-[#6B7280]">
                            2. Tambahan Inventaris &amp; Fasilitas
                          </label>
                          <button
                            type="button"
                            onClick={resetAddons}
                            className="min-h-[36px] px-2 text-xs font-medium text-[#6B7280] hover:text-[#111827] flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {DEFAULT_ADDONS.map(item => {
                            const count = addonCounts[item.id] || 0;
                            return (
                              <div 
                                key={item.id}
                                className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-semibold text-xs text-[#111827] block truncate">{item.name}</span>
                                  <span className="text-[11px] font-mono tabular-nums text-[#4B5563]">
                                    Rp {item.unitPrice.toLocaleString('id-ID')} / {item.unitLabel}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateAddon(item.id, -1, item.step, item.min, item.max)}
                                    disabled={count <= item.min}
                                    aria-label={`Kurangi ${item.name}`}
                                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#FCFCFD] border border-[#D1D5DB] flex items-center justify-center text-[#111827] hover:bg-[#F1F3F5] disabled:opacity-30 transition-colors cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-8 text-center font-mono tabular-nums font-semibold text-xs text-[#111827]">
                                    {count}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateAddon(item.id, 1, item.step, item.min, item.max)}
                                    disabled={count >= item.max}
                                    aria-label={`Tambah ${item.name}`}
                                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#FCFCFD] border border-[#D1D5DB] flex items-center justify-center text-[#111827] hover:bg-[#F1F3F5] disabled:opacity-30 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Summary Card */}
                    <div className="w-full lg:w-80 bg-[#1E3A8A] text-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between shrink-0">
                      <div>
                        <span className="text-xs font-medium text-blue-200">
                          Estimasi biaya transparan
                        </span>
                        <h4 className="font-display font-bold text-lg text-white mt-1 mb-4">Ringkasan Simulasi</h4>

                        <div className="space-y-3 text-xs border-b border-white/15 pb-4">
                          <div className="flex justify-between gap-3">
                            <span className="text-blue-100 min-w-0 flex-1 truncate">{selectedFacility?.title}</span>
                            <span className="font-mono tabular-nums font-medium shrink-0">Rp {packagePriceNumber.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-blue-100">Total Fasilitas Tambahan</span>
                            <span className="font-mono tabular-nums font-medium shrink-0">Rp {addonsTotal.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-blue-100">Iuran Kebersihan</span>
                            <span className="font-mono tabular-nums font-medium shrink-0">Rp {cleaningFee.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        <div className="pt-4 mb-6">
                          <span className="text-xs text-blue-200 block">Total Estimasi</span>
                          <span className="text-2xl font-mono tabular-nums font-bold text-[#FCD34D]">
                            Rp {grandTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenBooking(selectedFacility?.title)}
                        className="w-full min-h-[44px] py-3 rounded-lg bg-white hover:bg-[#EFF6FF] text-[#1E40AF] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Lanjutkan Reservasi</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
