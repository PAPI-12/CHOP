import React from 'react';
import '../styles/case-fonts.css';
import '../styles/case/nandos.css';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useReveal } from '../components/nandos/hooks/useReveal';
import Hero from '../components/nandos/Hero';
import Marquee from '../components/nandos/Marquee';
import Overview from '../components/nandos/Overview';
import Film from '../components/nandos/Film';
import Frames from '../components/nandos/Frames';
import Insight from '../components/nandos/Insight';
import Craft from '../components/nandos/Craft';
import Credits from '../components/nandos/Credits';
import Footer from '../components/nandos/Footer';

const Nandos: React.FC = () => {
  useReveal();
  return (
    <div className="nandos-case bg-cream text-ink">
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
      <Hero />
      <Marquee />
      <Overview />
      <Film />
      <Frames />
      <Insight />
      <Craft />
      <Credits />
      <Footer />
    </div>
  );
};

export default Nandos;
