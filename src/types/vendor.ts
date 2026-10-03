export type VendorCategory = 
  | 'all'
  | 'catering'
  | 'decoration'
  | 'photography'
  | 'mua'
  | 'sound_genset'
  | 'tent_chairs'
  | 'snack_umkm'
  | 'souvenir_invitation';

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  ownerName: string;
  phone: string; // WhatsApp number (628...)
  instagram?: string;
  address: string;
  isHuntapResident: boolean; // True jika warga Huntap Tondo 2
  huntapBlock?: string; // Contoh: "Blok C No. 14"
  description: string;
  services: string[]; // Contoh: ["Prasmanan Nusantara", "Kambing Guling", "Pondokan"]
  startingPrice: number;
  priceUnit: string; // Contoh: "porsi", "paket", "hari"
  imageUrl: string;
  galleryUrls?: string[];
  rating: number; // 1-5
  reviewCount: number;
  isVerified: boolean;
  status: 'active' | 'pending' | 'inactive';
  featured?: boolean;
  notes?: string;
  createdAt?: any;
}

export const VENDOR_CATEGORIES = [
  { id: 'all', label: 'Semua Kategori', icon: 'LayoutGrid' },
  { id: 'catering', label: 'Katering & Prasmanan', icon: 'Utensils' },
  { id: 'decoration', label: 'Dekorasi & Pelaminan', icon: 'Sparkles' },
  { id: 'photography', label: 'Foto & Video Dokumentasi', icon: 'Camera' },
  { id: 'mua', label: 'MUA & Busana Pengantin', icon: 'Crown' },
  { id: 'sound_genset', label: 'Sound System & Genset', icon: 'Volume2' },
  { id: 'tent_chairs', label: 'Tenda & Kursi Ekstra', icon: 'Tent' },
  { id: 'snack_umkm', label: 'Kue & Snack Tradisional', icon: 'Cookie' },
  { id: 'souvenir_invitation', label: 'Souvenir & Undangan', icon: 'Gift' }
] as const;

export const DEFAULT_VENDORS: Vendor[] = [
  {
    id: 'vendor-1',
    name: 'Katering Berkah Tondo 2',
    category: 'catering',
    ownerName: 'Ibu Rahmawati',
    phone: '6282291234567',
    instagram: '@kateringberkah.tondo',
    address: 'Huntap Tondo 2, Blok B No. 18, Kota Palu',
    isHuntapResident: true,
    huntapBlock: 'Blok B-18',
    description: 'Menyediakan aneka menu prasmanan khas Nusantara & masakan khas Palu (Kaledo, Uta Dada, Palumara). Higienis, halal, dan berpengalaman melayani resepsi hingga 1.000 porsi.',
    services: ['Prasmanan Resepsi Lengkap', 'Pondokan Tradisional', 'Menu Kaledo & Uta Dada', 'Peralatan & Pelayan Meja'],
    startingPrice: 35000,
    priceUnit: 'porsi',
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.9,
    reviewCount: 38,
    isVerified: true,
    status: 'active',
    featured: true
  },
  {
    id: 'vendor-2',
    name: 'Anggrek Pelaminan & Dekorasi Palu',
    category: 'decoration',
    ownerName: 'Bapak Mansyur',
    phone: '6285241098765',
    instagram: '@anggrekdekorasipalu',
    address: 'Jl. R.E. Martadinata No. 45 / Huntap Tondo 2 Blok D',
    isHuntapResident: true,
    huntapBlock: 'Blok D-05',
    description: 'Spesialis dekorasi pelaminan modern rustic, adat Kaili, Bugis, dan Nasional. Menyesuaikan dengan dimensi panggung utama Gedung Serbaguna Huntap Tondo 2.',
    services: ['Pelaminan Modern & Tradisional', 'Gate Masuk & Lorong Bunga', 'Photobooth Interaktif', 'Lighting Panggung & Karpet Merah'],
    startingPrice: 3500000,
    priceUnit: 'paket',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 5.0,
    reviewCount: 42,
    isVerified: true,
    status: 'active',
    featured: true
  },
  {
    id: 'vendor-3',
    name: 'Lensa Kaili Cinema & Foto',
    category: 'photography',
    ownerName: 'Fadel Muhammad',
    phone: '6281342678901',
    instagram: '@lensakaili.project',
    address: 'Huntap Tondo 2, Blok A No. 09, Kota Palu',
    isHuntapResident: true,
    huntapBlock: 'Blok A-09',
    description: 'Dokumentasi visual foto dan video cinematic pernikahan, lamaran, wisuda, dan acara kedinasan. Lengkap dengan drone 4K dan cetak album magazine eksklusif.',
    services: ['Foto & Video Cinematic Liputan', 'Drone Aerial 4K', 'Cetak Album Kolase 20 Halaman', 'Same Day Edit Video'],
    startingPrice: 2000000,
    priceUnit: 'paket',
    imageUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.9,
    reviewCount: 29,
    isVerified: true,
    status: 'active',
    featured: true
  },
  {
    id: 'vendor-4',
    name: 'Glamour MUA & Sanggar Busana',
    category: 'mua',
    ownerName: 'Ibu Nurhayati (Kak Nana)',
    phone: '6281245678999',
    instagram: '@glamourmua.tondo',
    address: 'Huntap Tondo 2, Blok E No. 22, Kota Palu',
    isHuntapResident: true,
    huntapBlock: 'Blok E-22',
    description: 'Rias pengantin flawless tahan lama hingga 12 jam. Menyewakan pakaian pengantin adat Kaili, Bugis, Makassar, Jawa, serta gaun modern pengantin & jas pria.',
    services: ['Make Up Pengantin Flawless', 'Sewa Baju Adat Lengkap', 'Rias Ibu & Pagar Ayu', 'Touch-up Standby Selama Acara'],
    startingPrice: 1500000,
    priceUnit: 'paket',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.8,
    reviewCount: 34,
    isVerified: true,
    status: 'active',
    featured: false
  },
  {
    id: 'vendor-5',
    name: 'Prima Nada Sound & Genset Silent',
    category: 'sound_genset',
    ownerName: 'Mas Danang',
    phone: '6282199887766',
    instagram: '@primanada_soundpalu',
    address: 'Komp. Huntap Tondo 2 Samping RTH',
    isHuntapResident: true,
    huntapBlock: 'Blok C-02',
    description: 'Penyewaan sound system line-array konser & resepsi, lighting moving beam, wireless microphone, serta genset silent 20 kVA tanpa asap dan tidak berisik.',
    services: ['Sound System 10.000 Watt', 'Genset Silent 20 kVA', 'Lighting Moving Head & Par LED', 'Operator & Sound Engineer Profesional'],
    startingPrice: 1800000,
    priceUnit: 'hari',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 5.0,
    reviewCount: 26,
    isVerified: true,
    status: 'active',
    featured: true
  },
  {
    id: 'vendor-6',
    name: 'Dapur Mama Siti (Kue & Snack Tradisional)',
    category: 'snack_umkm',
    ownerName: 'Ibu Siti Hajar',
    phone: '6285398761234',
    instagram: '@dapurmamasiti.huntap',
    address: 'Huntap Tondo 2, Blok B No. 04, Kota Palu',
    isHuntapResident: true,
    huntapBlock: 'Blok B-04',
    description: 'UMKM binaan warga Huntap Tondo 2. Memproduksi aneka kue basah tradisional khas Kaili & Sulawesi (Lalampa, Tetu, Barongko, Apem, Risol Mayo) dan snack box rapat.',
    services: ['Snack Box Acara Rapat / Pengajian', 'Kue Tampah Tradisional', 'Lalampa Panggang & Tetu Gula Merah', 'Kopi & Teh Sambut Tamu'],
    startingPrice: 12000,
    priceUnit: 'box',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 5.0,
    reviewCount: 51,
    isVerified: true,
    status: 'active',
    featured: false
  },
  {
    id: 'vendor-7',
    name: 'Tenda Sarnafil & Kanopi Megah Tondo',
    category: 'tent_chairs',
    ownerName: 'H. Sudirman',
    phone: '6282298711223',
    instagram: '@tendamegah.palu',
    address: 'Jl. Trans Sulawesi Km 7 Tondo / Huntap 2',
    isHuntapResident: false,
    huntapBlock: '',
    description: 'Penyewaan tenda sarnafil kerucut putih, tenda plafon dekorasi VIP, kipas blower embun air (misty fan), dan tambahan kursi cover pita busa.',
    services: ['Tenda Sarnafil 5x5 VIP', 'Tenda Plafon Gelombang Resepsi', 'Misty Fan (Kipas Embun)', 'Kursi Futura Cover Pita'],
    startingPrice: 250000,
    priceUnit: 'unit/hari',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80'
    ],
    rating: 4.7,
    reviewCount: 19,
    isVerified: true,
    status: 'active',
    featured: false
  }
];
