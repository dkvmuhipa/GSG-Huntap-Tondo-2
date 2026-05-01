import { Building2, Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">GSG Tondo 2</span>
            </div>
            <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
              Dikelola secara profesional oleh komunitas Huntap Tondo 2 untuk mewujudkan ekosistem lingkungan yang mandiri dan berdaya saing tinggi.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Kontak Admin</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-400 group cursor-pointer hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-primary">
                  <Phone className="w-4 h-4" />
                </div>
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 group cursor-pointer hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <span>admin@gsgtondo2.com</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Lokasi</h4>
            <li className="flex items-start gap-4 text-gray-400">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm">Huntap Tondo 2,Tondo, Mantikulore, Kota Palu, Sulawesi Tengah 94119</p>
                <a 
                  href="https://maps.app.goo.gl/Zrm7XZ8GyRvqHK9o8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-primary text-xs font-bold uppercase tracking-wider hover:underline"
                >
                  Buka Google Maps
                </a>
              </div>
            </li>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
          <p>© 2026 GSG Tondo 2. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/login" className="hover:text-white transition-colors">Admin Login</a>
            <div className="flex items-center gap-2">
              <span>Managed by</span>
              <span className="font-bold text-white px-2 py-1 bg-primary/20 rounded">Teras RT 02 Digital Ecosystem</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
