import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

import { useScrollLock } from '../hooks/useScrollLock';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setIsMobileMenuOpen(false); }, [location]);

  // Lock body scroll while the fullscreen mobile menu is open, otherwise the
  // page behind it scrolls under the overlay and the menu appears to "jump".
  // Via the shared hook, so it also compensates for the vanishing scrollbar.
  useScrollLock(isMobileMenuOpen);

  /**
   * The wordmark has exactly one job: put the visitor on the hero. Nowhere
   * else, ever.
   *
   * It used to smooth-scroll the whole way up, which meant travelling back
   * THROUGH the pinned What I Do sequence — that section re-arms and takes
   * the scroll while you are passing through it, and you get left stranded
   * somewhere in the middle of the page. So there is no journey: the page is
   * simply put at the hero. Nothing to hijack, nothing to fight.
   */
  const goToHero = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    const atHero = () => {
      window.scrollTo(0, 0);
      // Some browsers restore scroll asynchronously after a route swap.
      requestAnimationFrame(() => window.scrollTo(0, 0));
    };

    if (location.pathname === '/') {
      atHero();
      return;
    }
    navigate('/');
    atHero();
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/work', label: 'Work' },
    { path: '/resume', label: 'Resume' },
    { path: '/contact', label: 'Contact' },
  ];
  return (
    <>
      <nav id="main-nav" className={`nav-drop fixed top-0 left-0 w-full z-[50] transition-all duration-300 ${isScrolled ? 'bg-[#000000]/95 backdrop-blur-md py-4' : 'bg-transparent py-6 md:py-8'}`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 flex justify-between items-center">
          {/* Clicking the brand also re-arms the What I Do machine act — it is
              the explicit "play it again" affordance besides a page reload. */}
          <Link to="/" data-no-transition onClick={goToHero} className="flex items-center gap-3 group" aria-label="Papi Raborife — back to top">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="transition-transform group-hover:rotate-12">
              <rect x="2" y="2" width="36" height="36" rx="18" stroke="#D7FF4F" strokeWidth="1.5" />
              <path d="M20 8L25 18H15L20 8Z" fill="#F5F3EE" />
              <path d="M20 32L15 22H25L20 32Z" fill="#D7C4AA" />
              <circle cx="20" cy="20" r="3" fill="#D7FF4F" />
            </svg>
            <div className="hidden sm:block text-left">
              <span className="font-display text-lg md:text-xl text-[#f5f3ee] block leading-none">PAPI</span>
              <span className="text-[10px] text-[#8f8f88] tracking-wider uppercase">RABORIFE</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={`text-xs font-bold uppercase tracking-[0.2em] transition-colors ${location.pathname === link.path ? 'text-[#d7ff4f]' : 'text-[#8f8f88] hover:text-[#f5f3ee]'}`}>{link.label}</Link>
            ))}
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center text-[#f5f3ee] z-50" aria-label="Toggle menu">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </nav>
      {/* Kept mounted and translated off-canvas so opening the menu is a pure
          compositor transform — no mount cost, no AnimatePresence runtime. */}
      <div
        className="mobile-menu fixed inset-0 z-[45] bg-[#000000] pt-32 px-8 md:hidden"
        data-open={isMobileMenuOpen ? 'true' : 'false'}
        aria-hidden={!isMobileMenuOpen}
      >
            <div className="flex flex-col gap-8">
              {navLinks.map((link, i) => (
                <div key={link.path} className="mobile-menu-item" style={{ transitionDelay: `${0.08 + i * 0.06}s` }}>
                  <Link to={link.path} tabIndex={isMobileMenuOpen ? 0 : -1} className={`block text-4xl font-display ${location.pathname === link.path ? 'text-[#d7ff4f]' : 'text-[#f5f3ee]'}`}>{link.label}</Link>
                </div>
              ))}
              <div className="mt-12 pt-12 border-t border-white/10">
                <p className="text-[10px] text-[#8f8f88] uppercase tracking-[0.3em] mb-4">Connect</p>
                <a href="mailto:papiraborife@gmail.com" tabIndex={isMobileMenuOpen ? 0 : -1} className="text-xl text-[#f5f3ee] font-display">papiraborife@gmail.com</a>
              </div>
            </div>
      </div>
    </>
  );
};
export default Navbar;
