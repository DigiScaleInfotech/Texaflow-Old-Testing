'use client';

import { motion } from 'framer-motion';

export default function MobileMessage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4"
    >
      <div className="glass-card p-8 rounded-xl text-center max-w-md mx-auto backdrop-blur-sm bg-white/5">
        <h1 className="text-2xl font-bold text-white mb-4">Desktop Version Only</h1>
        <p className="text-gray-200">
          This application is optimized for desktop use. Please access it from a desktop or laptop computer for the best experience.
        </p>
      </div>
    </motion.div>
  );
}
