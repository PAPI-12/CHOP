import React from 'react';
import { Play } from 'lucide-react';
import { usePrototype } from './prototype/PrototypeContext';

const links = [
  { href: '#tau-overview', label: 'Overview' },
  { href: '#tau-scope', label: 'Scope' },
  { href: '#tau-research', label: 'Research' },
  { href: '#tau-user-flow', label: 'User Flow' },
  { href: '#tau-wireframes', label: 'Wireframes' },
  { href: '#tau-design', label: 'Design' },
];

const CaseNav: React.FC = () => {
  const { launch } = usePrototype();
  return (
    <div className="sticky top-[64px] md:top-[76px] z-30 border-y border-[#243d2c] bg-[#0a0a0a]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-5 py-3 lg:px-8">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="shrink-0 text-xs font-medium text-white/50 hover:text-white transition-colors tracking-wide"
          >
            {link.label}
          </a>
        ))}
        <button
          type="button"
          onClick={launch}
          className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#1a4d2e] text-[#74c69d] border border-[#2d6a4f] hover:bg-[#2d6a4f] transition-colors"
          aria-label="Launch the Tau Foods interactive prototype"
        >
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#74c69d] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#74c69d]" />
          </span>
          Live Prototype
          <Play className="w-3 h-3 fill-current" />
        </button>
      </div>
    </div>
  );
};

export default CaseNav;
