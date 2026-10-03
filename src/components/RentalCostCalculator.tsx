import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  Sparkles, 
  Check, 
  Plus, 
  Minus, 
  HelpCircle, 
  ArrowRight, 
  MessageCircle, 
  Zap, 
  ShieldCheck, 
  Layers, 
  RotateCcw,
  Tag
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface RentalCostCalculatorProps {
  onOpenBooking: (pkg?: string) => void;
}

interface AddonItem {
  id: string;
  name: string;
  unitPrice: number;
  category: string;
  min: number;
  max: number;
  step: number;
  unitLabel: string;
}

const DEFAULT_ADDONS: AddonItem[] = [
  { id: 'kursi', name: 'Kursi Lipat Chitose', unitPrice: 5000, category: 'Tempat Duduk', min: 0, max: 500, step: 10, unitLabel: 'kursi' },
  { id: 'meja', name: 'Meja Bulat Banquet', unitPrice: 20000, category: 'Meja & Acara', min: 0, max: 60, step: 2, unitLabel: 'meja' },
  { id: 'sound', name: 'Sound System 5000W + Mic Wireless', unitPrice: 500000, category: 'Audio Visual', min: 0, max: 2, step: 1, unitLabel: 'set' },
  { id: 'ac', name: 'AC Portable Standing 2PK', unitPrice: 250000, category: 'Pendingin', min: 0, max: 6, step: 1, unitLabel: 'unit' },
  { id: 'genset', name: 'Genset Silent Honda 10kVA', unitPrice: 300000, category: 'Kelistrikan', min: 0, max: 2, step: 1, unitLabel: 'unit' },
  { id: 'tenda', name: 'Tenda Sarnafil VIP 5x5m', unitPrice: 150000, category: 'Dekorasi Luar', min: 0, max: 10, step: 1, unitLabel: 'plafon' },
];

export default function RentalCostCalculator({ onOpenBooking }: RentalCostCalculatorProps) {
  const facilities = useAppStore(state => state.facilities);
  const config = useAppStore(state => state.config);

  const availablePackages = useMemo(() => {
    if (facilities && facilities.length > 0) {
      return facilities.map(f => {
        const rawPrice = Number(String(f.price || '').replace(/\D/g, '')) || 0;
        return {
          id: f.id,
          title: f.title,
          price: rawPrice || 500000,
          duration: f.duration || 'Durasi Acara',
          features: f.features || []
        };
      });
    }

    return [
      {
        id: 'pkg-wedding',
        title: 'Resepsi & Pernikahan',
        price: 500000,
        duration: 'Durasi 12 Jam Penuh',
        features: ['Kapasitas hingga 500 tamu', 'Meja & kursi dasar', 'Ruang ganti & toilet']
      },
      {
        id: 'pkg-meeting',
        title: 'Rapat / Musik / Seminar',
        price: 150000,
        duration: 'Durasi 4 Jam',
        features: ['Sound standar gedung', 'Panggung mini', 'Sirkulasi udara alami']
      },
      {
        id: 'pkg-sport',
        title: 'Kegiatan Olahraga / Komunitas',
        price: 50000,
        duration: 'Per Jam',
        features: ['Lapangan badminton / karate', 'Penerangan optimal', 'Akses toilet']
      }
    ];
  }, [facilities]);

  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    availablePackages[0]?.id || 'pkg-wedding'
  );
  const [durationDays, setDurationDays] = useState<number>(1);
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({
    kursi: 50,
    meja: 6,
    sound: 0,
    ac: 0,
    genset: 0,
    tenda: 0
  });
  const [includeCleaning, setIncludeCleaning] = useState<boolean>(true);

  const selectedPackage = useMemo(() => {
    return availablePackages.find(p => p.id === selectedPackageId) || availablePackages[0];
  }, [availablePackages, selectedPackageId]);

  const handleAddonQty = (id: string, delta: number, item: AddonItem) => {
    setAddonQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(item.min, Math.min(item.max, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const resetCalculator = () => {
    setSelectedPackageId(availablePackages[0]?.id || 'pkg-wedding');
    setDurationDays(1);
    setAddonQuantities({
      kursi: 0,
      meja: 0,
      sound: 0,
      ac: 0,
      genset: 0,
      tenda: 0
    });
    setIncludeCleaning(true);
  };

  // Calculation logic
  const cleaningFee = includeCleaning ? 25000 : 0;
  const packageTotal = (selectedPackage?.price || 0) * durationDays;

  const addonsTotal = useMemo(() => {
    return DEFAULT_ADDONS.reduce((acc, item) => {
      const qty = addonQuantities[item.id] || 0;
      return acc + (qty * item.unitPrice);
    }, 0);
  }, [addonQuantities]);

  const grandTotal = packageTotal + addonsTotal + cleaningFee;
  const downPaymentEst = Math.round(grandTotal * 0.3); // 30% DP
  const remainingPayment = grandTotal - downPaymentEst;

  const handleConsultWhatsApp = () => {
    const activeAddonsList = DEFAULT_ADDONS
      .filter(item => (addonQuantities[item.id] || 0) > 0)
      .map(item => `• ${item.name}: ${addonQuantities[item.id]} ${item.unitLabel} (Rp ${(addonQuantities[item.id] * item.unitPrice).toLocaleString('id-ID')})`)
      .join('\n');

    const msg = `Halo Pengelola Gedung Serbaguna Huntap Tondo 2,

Saya tertarik untuk menyewa gedung dengan simulasi kalkulasi berikut:

🏛️ *Paket:* ${selectedPackage?.title} (Rp ${(selectedPackage?.price || 0).toLocaleString('id-ID')} / ${selectedPackage?.duration})
📅 *Durasi:* ${durationDays} Hari
${activeAddonsList ? `\n📦 *Fasilitas Tambahan:*\n${activeAddonsList}` : ''}
🧹 *Biaya Kebersihan:* ${includeCleaning ? 'Rp 25.000' : 'Tidak diambil'}
💰 *Estimasi Total:* Rp ${grandTotal.toLocaleString('id-ID')} (Perkiraan DP 30%: Rp ${downPaymentEst.toLocaleString('id-ID')})

Mohon informasi ketersediaan tanggal dan verifikasi jadwal acara saya. Terima kasih.`;

    const encoded = encodeURIComponent(msg);
    const phone = config?.contactPhone || '6282226151215';
    const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '62');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <section id="kalkulator" className="py-20 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 border border-primary/20">
            <Calculator className="w-4 h-4" />
            Simulasi Biaya Transparan
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
            Kalkulator Estimasi Biaya Sewa
          </h2>
          <p className="mt-4 text-base md:text-lg text-gray-500 font-medium">
            Hitung perkiraan biaya sewa gedung dan perlengkapan tambahan secara transparan dalam hitungan detik sebelum mengajukan pemesanan resmi.
          </p>
        </div>

        {/* Main Bento Layout */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Interactive Inputs (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. Pilih Paket Acara */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shadow-md shadow-primary/20">
                    1
                  </span>
                  <h3 className="text-lg font-black text-gray-900">Pilih Kategori Paket Acara</h3>
                </div>
                <button
                  type="button"
                  onClick={resetCalculator}
                  className="text-xs font-bold text-gray-400 hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                {availablePackages.map(pkg => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all relative ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/20' 
                          : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/70 hover:border-gray-200'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <p className="font-black text-gray-900 text-sm leading-tight pr-6">{pkg.title}</p>
                      <p className="text-xs font-black text-primary mt-2">
                        Rp {pkg.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{pkg.duration}</p>
                    </button>
                  );
                })}
              </div>

              {/* Durasi Acara Slider / Counter */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-gray-800">Durasi Pemakaian (Hari)</p>
                  <p className="text-xs text-gray-400">Total hari kalender gedung digunakan untuk acara.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDurationDays(Math.max(1, durationDays - 1))}
                    disabled={durationDays <= 1}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-black text-base text-gray-900">
                    {durationDays} Hari
                  </span>
                  <button
                    type="button"
                    onClick={() => setDurationDays(Math.min(7, durationDays + 1))}
                    disabled={durationDays >= 7}
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Tambahan Perlengkapan & Fasilitas */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center shadow-md shadow-primary/20">
                    2
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Perlengkapan & Fasilitas Tambahan</h3>
                    <p className="text-xs text-gray-400">Sesuaikan jumlah perlengkapan sesuai kapasitas tamu.</p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {DEFAULT_ADDONS.map(item => {
                  const qty = addonQuantities[item.id] || 0;
                  const itemSubtotal = qty * item.unitPrice;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        qty > 0 
                          ? 'border-blue-200 bg-blue-50/30' 
                          : 'border-gray-100 bg-gray-50/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                          <p className="text-[11px] font-bold text-primary">
                            Rp {item.unitPrice.toLocaleString('id-ID')} <span className="text-gray-400 font-normal">/{item.unitLabel}</span>
                          </p>
                        </div>
                        {qty > 0 && (
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            +Rp {itemSubtotal.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-medium">Jumlah:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddonQty(item.id, -item.step, item)}
                            disabled={qty <= item.min}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center font-black text-xs text-gray-900">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddonQty(item.id, item.step, item)}
                            disabled={qty >= item.max}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-white text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Jasa Kebersihan Checkbox */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <label htmlFor="cleaning-check" className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    id="cleaning-check"
                    type="checkbox"
                    checked={includeCleaning}
                    onChange={(e) => setIncludeCleaning(e.target.checked)}
                    className="w-5 h-5 rounded-lg border-gray-300 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">Jasa Kebersihan Gedung Pasca-Acara</p>
                    <p className="text-xs text-gray-400">Pembersihan ruang utama dan pengangkutan sampah usai acara.</p>
                  </div>
                </label>
                <span className="text-xs font-black text-gray-900 bg-gray-100 px-3 py-1.5 rounded-xl">
                  Rp 25.000
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Live Calculation Summary Card (5 Cols) */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">

            <div className="bg-gradient-to-br from-slate-900 via-primary-dark to-slate-900 text-white rounded-[2.5rem] p-7 md:p-8 shadow-2xl shadow-primary/20 border border-white/10 relative overflow-hidden">
              {/* Background badge accent */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between pb-6 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h4 className="font-black text-base tracking-wide uppercase">Rincian Estimasi Biaya</h4>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-blue-200 border border-white/10">
                  Real-time
                </span>
              </div>

              {/* Itemized Breakdown List */}
              <div className="py-6 space-y-3.5 text-sm border-b border-white/10 relative z-10">
                <div className="flex justify-between items-center text-slate-300">
                  <div>
                    <p className="font-semibold text-white">{selectedPackage?.title}</p>
                    <p className="text-[11px] text-slate-400 font-medium">({durationDays} Hari pemakaian)</p>
                  </div>
                  <span className="font-bold text-white">
                    Rp {packageTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                {DEFAULT_ADDONS.filter(item => (addonQuantities[item.id] || 0) > 0).map(item => {
                  const qty = addonQuantities[item.id];
                  return (
                    <div key={item.id} className="flex justify-between items-center text-slate-300">
                      <span className="text-xs text-slate-300">
                        {item.name} ({qty} {item.unitLabel})
                      </span>
                      <span className="text-xs font-semibold text-white">
                        Rp {(qty * item.unitPrice).toLocaleString('id-ID')}
                      </span>
                    </div>
                  );
                })}

                {includeCleaning && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-xs text-slate-300">Jasa Kebersihan Gedung</span>
                    <span className="text-xs font-semibold text-white">Rp 25.000</span>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="pt-6 space-y-4 relative z-10">
                <div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-widest block mb-1">
                    Total Estimasi Biaya Sewa
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
                    <span>Rp {grandTotal.toLocaleString('id-ID')}</span>
                    <span className="text-xs text-slate-400 font-medium">,-</span>
                  </div>
                </div>

                {/* DP & Sisa Pelunasan Badge */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perkiraan DP (30%)</p>
                    <p className="text-sm font-black text-amber-300 mt-1">
                      Rp {downPaymentEst.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sisa Pelunasan (70%)</p>
                    <p className="text-sm font-black text-blue-200 mt-1">
                      Rp {remainingPayment.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenBooking(selectedPackage?.title)}
                    className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm tracking-wide shadow-xl shadow-primary/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <span>Ajukan Booking Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleConsultWhatsApp}
                    className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs tracking-wide border border-white/15 flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Konsultasi Rincian via WhatsApp</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed pt-2">
                  * Biaya di atas merupakan simulasi resmi pengelola GSG Huntap Tondo 2. Penetapan jadwal final menunggu verifikasi ketersediaan dan persetujuan panitia.
                </p>
              </div>
            </div>

            {/* Transparency Trust Badge */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-black text-gray-900 text-sm">Transparansi 100% Kas Warga</h5>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Setiap pembayaran sewa otomatis disinkronkan ke kas pemeliharaan gedung warga dan dapat dipantau di Dasbor Transparansi publik.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
