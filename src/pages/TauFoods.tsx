import React from 'react';
import '../styles/case-fonts.css';
import '../styles/case/tau.css';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PrototypeProvider, usePrototype } from '../components/tau/prototype/PrototypeContext';
import Prototype from '../components/tau/prototype/Prototype';
import CaseNav from '../components/tau/CaseNav';
import TauHero from '../components/tau/TauHero';
import Overview from '../components/tau/Overview';
import Scope from '../components/tau/Scope';
import Research from '../components/tau/Research';
import UserFlow from '../components/tau/UserFlow';
import Wireframes from '../components/tau/Wireframes';
import Design from '../components/tau/Design';
import Results from '../components/tau/Results';
import Footer from '../components/tau/Footer';

function PrototypeHost() {
  const { open, close } = usePrototype();
  return <Prototype open={open} onClose={close} />;
}

const TauFoods: React.FC = () => {
  return (
    <PrototypeProvider>
      <div className="tau-case bg-[#0a0a0a]">
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
        <TauHero />
        <Overview />
        <Scope />
        <Research />
        <UserFlow />
        <Wireframes />
        <Design />
        <Results />
        <Footer />
        <PrototypeHost />
      </div>
    </PrototypeProvider>
  );
};

export default TauFoods;
