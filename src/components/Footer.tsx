import { Building2, Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatWaNumber } from './ContactSection';

export default function Footer() {
  const config = useAppStore((state) => state.config);

  const displayPhone = config?.contactPhone || '+62 822-9157-8809';
  const waNumber = formatWaNumber(displayPhone);
  const displayEmail = config?.contactEmail || 'officialhuntaptondo2@gmail.com';
  const displayAddress = config?.contactAddress || 'Huntap Tondo 2, Tondo, Mantikulore, Kota Palu, Sulawesi Tengah 94119';
  const mapsUrl = config?.contactMapsUrl || 'https://maps.app.goo.gl/Zrm7XZ8GyRvqHK9o8';

  return (
    <footer className="bg-[#1E3A8A] text-white border-t border-[#172554] pt-12 sm:pt-16 pb-28 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-8 h-8 bg-white text-[#1E40AF] rounded-lg flex items-center justify-center shrink-0">
                <Building2 className="text-[#1E40AF] w-4 h-4" strokeWidth={1.5} />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Gedung Serbaguna Huntap Tondo 2
              </span>
            </div>
            <p className="text-sm text-blue-100/90 max-w-sm mb-6 leading-relaxed">
              Dikelola secara mandiri dan terbuka oleh pengurus RT 02 Huntap Tondo 2 untuk mendukung kegiatan sosial, pernikahan, dan pertemuan warga Kota Palu.
            </p>
            <div className="flex gap-3">
              <a
                href="#kontak"
                className="w-10 h-10 bg-white/10 border border-white/15 rounded-lg flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" strokeWidth={1.5} />
              </a>
              <a
                href="#kontak"
                className="w-10 h-10 bg-white/10 border border-white/15 rounded-lg flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4 sm:mb-5">Kontak admin</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`https://wa.me/${waNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-blue-100 hover:text-white transition-colors min-w-0"
                >
                  <Phone className="w-4 h-4 text-blue-200 shrink-0" strokeWidth={1.5} />
                  <span className="truncate font-mono tabular-nums">{displayPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${displayEmail}`}
                  className="flex items-center gap-2.5 text-sm text-blue-100 hover:text-white transition-colors min-w-0"
                >
                  <Mail className="w-4 h-4 text-blue-200 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{displayEmail}</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4 sm:mb-5">Lokasi</h4>
            <div className="flex items-start gap-2.5 text-blue-100">
              <MapPin className="w-4 h-4 text-blue-200 shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-sm leading-relaxed">{displayAddress}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-[#FCD34D] text-xs font-medium hover:underline"
                >
                  Buka Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-blue-200">
          <p>© {new Date().getFullYear()} Gedung Serbaguna Huntap Tondo 2, RT 02 Kota Palu.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a href="/login" className="hover:text-white transition-colors">
              Portal pengurus
            </a>
            <span>Pengelola: RT 02 Huntap Tondo 2</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
