import React from 'react';
import '../styles/case-fonts.css';
import '../styles/case/cornetto.css';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CaseNav from '../components/cornetto/CaseNav';
import CornettoHero from '../components/cornetto/CornettoHero';
import Insight from '../components/cornetto/Insight';
import Lifestyle from '../components/cornetto/Lifestyle';
import Execution from '../components/cornetto/Execution';
import UserFlow from '../components/cornetto/UserFlow';
import Design from '../components/cornetto/Design';
import Skater from '../components/cornetto/Skater';
import Community from '../components/cornetto/Community';
import Role from '../components/cornetto/Role';

const Cornetto: React.FC = () => {
  return (
    <div className="cornetto-case font-corn-body bg-cornetto-cream">
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

      <CaseNav />
      <CornettoHero />
      <Insight />
      <Lifestyle />
      <Execution />
      <UserFlow />
      <Design />
      <Skater />
      <Community />
      <Role />
    </div>
  );
};

export default Cornetto;
