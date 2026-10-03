import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ 
  message = 'Memuat Sistem...', 
  subMessage = 'Menyiapkan modul dan data resmi GSG Huntap Tondo 2...',
  fullScreen = true 
}: PageLoaderProps) {
  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-[#0b1329] via-[#0f172a] to-[#070c1a] text-white p-6 overflow-hidden select-none'
    : 'w-full min-h-[360px] flex flex-col items-center justify-center p-8 bg-transparent text-gray-900 select-none';

  return (
    <div className={containerClasses}>
      {/* Background ambient radial glow for fullscreen */}
      {fullScreen && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-primary/25 rounded-full blur-[90px] pointer-events-none animate-pulse" />
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm"
      >
        {/* Logo Card with Pulse Rings */}
        <div className="relative mb-6">
          {/* Outer Ripple Ring */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0, 0.35]
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className={`absolute -inset-4 rounded-[32px] border ${
              fullScreen ? 'border-blue-400/30' : 'border-primary/20'
            }`}
          />

          {/* Inner Ripple Ring */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.1, 0.5]
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3
            }}
            className={`absolute -inset-2 rounded-[28px] border ${
              fullScreen ? 'border-blue-500/40' : 'border-primary/30'
            }`}
          />

          {/* Brand Logo Box */}
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-2xl shadow-primary/40 ring-1 ring-white/20">
            <svg 
              className="w-11 h-11 text-white drop-shadow-md" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 512 512"
            >
              <g transform="translate(256, 256) scale(0.92) translate(-256, -256)">
                <path 
                  d="M96 416V144C96 130.745 106.745 120 120 120H280C293.255 120 304 130.745 304 144V416" 
                  stroke="currentColor" 
                  strokeWidth="32" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M304 200H392C405.255 200 416 210.745 416 224V416" 
                  stroke="currentColor" 
                  strokeWidth="32" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M48 416H464" 
                  stroke="currentColor" 
                  strokeWidth="32" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M160 200H240" 
                  stroke="currentColor" 
                  strokeWidth="32" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M160 280H240" 
                  stroke="currentColor" 
                  strokeWidth="32" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path 
                  d="M160 360H240" 
                  stroke="currentColor" 
                  strokeWidth="32" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Text Header */}
        <h3 className={`text-base font-black tracking-wider uppercase ${
          fullScreen ? 'text-white' : 'text-gray-900'
        }`}>
          GSG Huntap Tondo 2
        </h3>
        <p className={`text-xs font-semibold mt-1 tracking-wide ${
          fullScreen ? 'text-blue-300' : 'text-primary'
        }`}>
          {message}
        </p>
        <p className={`text-[11px] font-normal mt-1 max-w-[280px] leading-relaxed ${
          fullScreen ? 'text-slate-400' : 'text-gray-500'
        }`}>
          {subMessage}
        </p>

        {/* Shimmering Progress Bar */}
        <div className={`w-36 h-1.5 rounded-full overflow-hidden mt-5 relative ${
          fullScreen ? 'bg-white/10' : 'bg-gray-100'
        }`}>
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '160%' }}
            transition={{
              repeat: Infinity,
              duration: 1.25,
              ease: 'easeInOut'
            }}
            className="w-1/2 h-full rounded-full bg-gradient-to-r from-sky-400 via-primary to-indigo-400 shadow-sm shadow-primary/50"
          />
        </div>

        {/* Official Sub-badge */}
        <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold mt-6 px-3.5 py-1.5 rounded-full ${
          fullScreen 
            ? 'bg-white/5 text-slate-400 border border-white/10' 
            : 'bg-gray-50 text-gray-500 border border-gray-100'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Sistem Resmi Warga Kota Palu</span>
        </div>
      </motion.div>
    </div>
  );
}
