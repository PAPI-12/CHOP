import React from 'react';

const links = [
  { href: '#cornetto-insight', label: 'Insight' },
  { href: '#cornetto-execution', label: 'Execution' },
  { href: '#cornetto-design', label: 'Design' },
  { href: '#cornetto-culture', label: 'Culture' },
];

const CaseNav: React.FC = () => {
  return (
    <div className="sticky top-[64px] md:top-[76px] z-30 border-y-[3px] border-cornetto-ink bg-cornetto-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 overflow-x-auto px-5 py-3 md:px-8">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="corn-pill-cream shrink-0 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition hover:-translate-y-0.5"
          >
            {link.label}
          </a>
        ))}
        <a
          href="#cornetto-role"
          className="corn-pill-yellow ml-auto shrink-0 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition hover:-translate-y-0.5"
        >
          View Role
        </a>
      </div>
    </div>
  );
};

export default CaseNav;
