import React from 'react';

interface BookingCalendarProps {
  calendarDays: any[];
  currentMonth: Date;
}

export default function BookingCalendar({
  calendarDays,
  currentMonth,
}: BookingCalendarProps) {
  return (
    <div className="p-8">
      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-[2rem] overflow-hidden">
        {['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
          <div 
            key={d} 
            className="bg-gray-50 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest"
          >
            {d}
          </div>
        ))}
        {calendarDays.map((dayObj, i) => (
          <div 
            key={i} 
            className={`min-h-[100px] bg-white p-3 transition-colors ${!dayObj ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'}`}
          >
            {dayObj && (
              <>
                <span 
                  className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                    dayObj.day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-gray-300 font-bold'
                  }`}
                >
                  {dayObj.day}
                </span>
                <div className="mt-2 space-y-1">
                  {dayObj.bookings.map((b: any) => (
                    <div 
                      key={b.id} 
                      className="p-1 px-1.5 bg-primary/5 rounded border-l-2 border-primary text-[8px] font-black text-primary truncate leading-tight group relative cursor-help"
                    >
                      {b.purpose}
                      <div className="absolute z-20 hidden group-hover:block bg-gray-900 text-white p-2 rounded-xl text-[10px] left-0 bottom-full mb-2 w-32 shadow-xl whitespace-normal font-bold">
                        {b.customerName}: {b.purpose}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
