import React from 'react';
import { motion } from 'motion/react';
import { Building2, Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export default function PageLoader({ message = 'Memuat Halaman...' }: PageLoaderProps) {
  return (
    <div className="min-h-[50vh] w-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-md">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">GSG Huntap Tondo 2</h4>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{message}</p>
        </div>

        <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="w-1/2 h-full bg-primary rounded-full"
          />
        </div>
      </motion.div>
    </div>
  );
}
