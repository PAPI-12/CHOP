import React from 'react';
import '../styles/case-fonts.css';
import '../styles/case/sars.css';
import SarsApp from '../components/SarsApp';

const Sars: React.FC = () => {
  return (
    <div className="sars-case pt-16 md:pt-[76px] bg-[#030303]">
      <SarsApp />
    </div>
  );
};

export default Sars;
