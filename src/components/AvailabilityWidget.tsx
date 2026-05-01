import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { subscribeToBookings, checkCurrentAvailability, subscribeToConfig } from '../lib/db';
import CalendarModal from './ui/CalendarModal';

export default function AvailabilityWidget() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const unsubBookings = subscribeToBookings((data) => setBookings(data));
    const unsubConfig = subscribeToConfig((data) => setConfig(data));
    return () => {
      unsubBookings();
      unsubConfig();
    };
  }, []);

  const status = checkCurrentAvailability(bookings, config, 'all');
  const isBusy = status.isBusy;
  const currentEvent = status.currentBooking?.purpose || '';
  const facilityName = status.currentBooking?.packageTitle || 'Gedung Serbaguna';

  const todayStr = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div id="jadwal" className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-50 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-gray-100"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <Calendar className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight">Status Ketersediaan Hari Ini</h3>
              <p className="text-sm text-gray-500">{todayStr}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm ${!isBusy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${!isBusy ? 'bg-green-500 animate-ping' : 'bg-red-500'}`} />
              {!isBusy ? (
                '🟢 TERSEDIA'
              ) : (
                <div className="flex flex-col">
                  <span>🔴 SEDANG DIGUNAKAN</span>
                  <p className="text-[10px] opacity-70 font-normal mt-0.5">
                    {currentEvent} ({facilityName})
                  </p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 px-6 py-3 rounded-2xl font-bold text-primary hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Lihat Kalender Jadwal
            </button>
          </div>
        </motion.div>
      </div>

      <CalendarModal 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
      />
    </div>
  );
}
