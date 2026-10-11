import React, { useState, useEffect, useMemo } from 'react';
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
      features: ['Kapasitas 500 Orang', 'Meja & Kursi Standar', 'Sirkulasi Udara Alami', 'Ruang Ganti'],
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
    <section id="fasilitas" className="py-20 bg-white scroll-mt-20 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6 text-left">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-black text-primary uppercase tracking-widest">Pilihan Fasilitas</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
              Fasilitas & Tarif Sewa
            </h2>
            <p className="text-gray-500 text-sm md:text-base leading-relaxed">
              Pilih paket penggunaan sesuai kebutuhan acara Anda. Harga flat, terjangkau, dan kompetitif untuk kenyamanan warga.
            </p>
          </div>
          <div className="bg-blue-50 px-4 py-2.5 rounded-2xl border border-blue-100 flex items-center gap-2 text-xs font-bold text-primary">
            <Info className="w-4 h-4 shrink-0" />
            <span>Tarif di luar iuran kebersihan gedung (Rp 25.000)</span>
          </div>
        </div>

        {/* Facilities Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayFacilities.map((fac, index) => {
            const IconComponent = ICON_MAP[fac.iconName] || Users2;
            const availability = checkCurrentAvailability(bookings, config, fac.title);
            const isBusy = availability.isBusy;

            return (
              <motion.div
                key={fac.id || `fac-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-[2.5rem] border transition-all duration-300 overflow-hidden relative group flex flex-col justify-between ${
                  fac.highlight 
                    ? 'bg-white border-primary shadow-xl shadow-primary/10' 
                    : 'bg-gray-50/70 border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* Image Section */}
                <div>
                  <div className="h-48 relative overflow-hidden">
                    {fac.imageUrl ? (
                      <img 
                        src={fac.imageUrl} 
                        alt={fac.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${fac.highlight ? 'bg-primary/5' : 'bg-gray-200/50'}`}>
                        <IconComponent className={`w-12 h-12 ${fac.highlight ? 'text-primary' : 'text-gray-300'}`} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                      <div className="flex flex-col text-left">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${fac.highlight ? 'bg-primary text-white shadow-lg' : 'bg-white/20 backdrop-blur-md text-white'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{fac.title}</h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md ${isBusy ? 'bg-red-500/90 text-white shadow-lg' : 'bg-white text-emerald-600 shadow-md'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isBusy ? 'bg-white' : 'bg-emerald-500 animate-pulse'}`} />
                      {isBusy ? 'Terpakai' : 'Tersedia'}
                    </div>
                  </div>
                  
                  <div className="p-7 text-left">
                    <div className="flex items-center gap-2 mb-4">
                      {fac.capacity && (
                        <div className="px-2.5 py-1 bg-gray-100 text-[10px] font-black text-gray-600 rounded-lg uppercase tracking-tight">
                          Kapasitas: {fac.capacity}
                        </div>
                      )}
                      {fac.highlight && (
                        <div className="px-2.5 py-1 bg-primary text-[10px] font-black text-white rounded-lg uppercase tracking-tight">
                          Terfavorit
                        </div>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-black text-primary">{fac.price}</span>
                      <span className="text-xs text-gray-400 font-bold tracking-tight">/ {fac.duration}</span>
                    </div>

                    <div className="space-y-3 mb-6">
                      {(fac.features || []).slice(0, 4).map((feat: string, i: number) => (
                        <div key={`${feat}-${i}`} className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
                          <div className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3px]" />
                          </div>
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-7 pt-0">
                  <button 
                    onClick={() => onOpenBooking(fac.title)}
                    disabled={isBusy}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                      isBusy 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : fac.highlight 
                          ? 'bg-primary text-white shadow-xl shadow-primary/25 hover:bg-blue-800' 
                          : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {isBusy ? 'Sudah Dipesan Hari Ini' : 'Booking Sekarang'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* INTEGRATED COST CALCULATOR DRAWER */}
        <div className="mt-14">
          <button
            type="button"
            onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
            className="w-full bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 p-5 rounded-3xl transition-all flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-base text-gray-900 leading-snug">
                  Butuh Tambahan Kursi, Meja, AC, atau Sound System?
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Klik untuk membuka simulasi perhitungan biaya perlengkapan tambahan secara transparan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-black uppercase text-primary shrink-0 ml-4">
              <span>{isCalculatorOpen ? 'Tutup Simulasi' : 'Buka Kalkulator Biaya'}</span>
              {isCalculatorOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {/* Expandable Calculator Body */}
          <AnimatePresence>
            {isCalculatorOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 sm:p-10 mt-4 text-left">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                    
                    {/* Left: Controls */}
                    <div className="flex-1 w-full space-y-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">
                          1. Pilih Paket Dasar Gedung
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {displayFacilities.map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setSelectedPackageId(f.id)}
                              className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                                selectedPackageId === f.id
                                  ? 'border-primary bg-blue-50/50'
                                  : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              <span className="font-bold text-xs text-gray-900 block truncate">{f.title}</span>
                              <span className="font-extrabold text-xs text-primary">{f.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                            2. Tambahan Inventaris & Fasilitas
                          </label>
                          <button
                            type="button"
                            onClick={resetAddons}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1"
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
                                className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-gray-900 block truncate">{item.name}</span>
                                  <span className="text-[11px] text-gray-500">
                                    Rp {item.unitPrice.toLocaleString('id-ID')} / {item.unitLabel}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateAddon(item.id, -1, item.step, item.min, item.max)}
                                    disabled={count <= item.min}
                                    className="w-7 h-7 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 active:scale-95"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-8 text-center font-black text-xs text-gray-900">
                                    {count}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateAddon(item.id, 1, item.step, item.min, item.max)}
                                    disabled={count >= item.max}
                                    className="w-7 h-7 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 active:scale-95"
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
                    <div className="w-full lg:w-80 bg-slate-900 text-white rounded-3xl p-6 flex flex-col justify-between shrink-0 shadow-xl">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                          Estimasi Biaya Transparan
                        </span>
                        <h4 className="font-black text-lg text-white mt-1 mb-4">Ringkasan Simulasi</h4>

                        <div className="space-y-3 text-xs border-b border-slate-800 pb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-400 truncate max-w-[150px]">{selectedFacility?.title}</span>
                            <span className="font-bold">Rp {packagePriceNumber.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Fasilitas Tambahan</span>
                            <span className="font-bold">Rp {addonsTotal.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Iuran Kebersihan</span>
                            <span className="font-bold">Rp {cleaningFee.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        <div className="pt-4 mb-6">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Estimasi</span>
                          <span className="text-2xl font-black text-emerald-400">
                            Rp {grandTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenBooking(selectedFacility?.title)}
                        className="w-full py-3.5 rounded-2xl bg-primary hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 active:scale-95"
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
