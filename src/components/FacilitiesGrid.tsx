import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PartyPopper, Dumbbell, Users2, Music, Check, Info, Building2, Calendar, Heart, Utensils, Clock } from 'lucide-react';
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

interface FacilitiesGridProps {
  onOpenBooking: (pkg?: string) => void;
}

export default function FacilitiesGrid({ onOpenBooking }: FacilitiesGridProps) {
  const facilities = useAppStore(state => state.facilities);
  const bookings = useAppStore(state => state.bookings);
  const config = useAppStore(state => state.config);

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

  return (
    <section id="fasilitas" className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">Fasilitas & Tarif</h2>
            <p className="text-gray-500">Pilih paket penggunaan sesuai kebutuhan acara Anda. Harga flat dan kompetitif untuk kualitas prima.</p>
          </div>
          <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100 flex items-center gap-2 text-xs font-bold text-primary">
            <Info className="w-4 h-4" />
            Tarif belum termasuk biaya kebersihan (Rp 25.000)
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
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
                  className={`rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative group ${fac.highlight ? 'bg-white border-primary shadow-2xl shadow-primary/10' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}
                >
                  {/* Image Hero Section */}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                      <div className="flex flex-col">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${fac.highlight ? 'bg-primary text-white shadow-lg' : 'bg-white/20 backdrop-blur-md text-white'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">{fac.title}</h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md ${isBusy ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/20' : 'bg-white text-green-600 shadow-lg'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isBusy ? 'bg-white' : 'bg-green-500 animate-pulse'}`} />
                      {isBusy ? 'In Use' : 'Ready'}
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-4">
                      {fac.capacity && (
                        <div className="px-2 py-1 bg-gray-100 text-[10px] font-black text-gray-500 rounded-lg uppercase tracking-tight">
                          Kapasitas: {fac.capacity}
                        </div>
                      )}
                      {fac.highlight && (
                        <div className="px-2 py-1 bg-primary text-[10px] font-black text-white rounded-lg uppercase tracking-tight">
                          Terpopuler
                        </div>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-extrabold text-primary">{fac.price}</span>
                      <span className="text-sm text-gray-400 font-medium tracking-tight">/ {fac.duration}</span>
                    </div>

                    <div className="space-y-4 mb-8">
                      {(fac.features || []).slice(0, 4).map((feat: string, i: number) => (
                        <div key={`${feat}-${i}`} className="flex items-center gap-3 text-sm text-gray-600">
                          <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-green-600 stroke-[3px]" />
                          </div>
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => onOpenBooking(fac.title)}
                      disabled={isBusy}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform active:scale-95 ${isBusy ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : fac.highlight ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-blue-800' : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50'}`}
                    >
                      {isBusy ? 'Sudah Dipesan Hari Ini' : 'Booking Sekarang'}
                    </button>
                  </div>
                </motion.div>
              );
          })}
        </div>
      </div>
    </section>
  );
}
