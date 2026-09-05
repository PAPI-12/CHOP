import React from 'react';
import { motion } from 'framer-motion';
import CTAButton from '../components/CTAButton';

const NotFound: React.FC = () => (
  <div className="min-h-[80vh] flex items-center justify-center px-4 py-24 bg-[#171715]">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#8f8f88] mb-5 md:mb-6">404 // Signal lost</p>
      <h1 className="font-display text-[28vw] md:text-[14vw] leading-[0.8] text-[#d7ff4f]">404</h1>
      <p className="mt-6 md:mt-8 text-lg md:text-2xl font-display text-[#f5f3ee]">This page is not in the archive.</p>
      <div className="mt-7 md:mt-8 flex justify-center">
        <CTAButton to="/">RETURN HOME</CTAButton>
      </div>
    </motion.div>
  </div>
);

export default NotFound;
