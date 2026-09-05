import React from 'react';
import '../styles/case-fonts.css';
import '../styles/case/lv.css';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LVApp from '../components/lv/LVApp';

const LouisVuitton: React.FC = () => {
  return (
    <div className="lv-case bg-[#0e0c0a]">
      <div className="bg-[#171715] px-4 sm:px-6 lg:px-12 xl:px-24 pt-24 md:pt-28 pb-4">
        <div className="max-w-[1600px] mx-auto">
          <Link
            to="/work"
            className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-[#8f8f88] hover:text-[#d7ff4f] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Work
          </Link>
        </div>
      </div>
      <LVApp />
    </div>
  );
};

export default LouisVuitton;
