import React, { lazy, Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { MouseProvider } from './context/MouseContext';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import Navbar from './components/Navbar';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import ErrorBoundary from './components/ErrorBoundary';

const Work = lazy(() => import('./pages/Work'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Cornetto = lazy(() => import('./pages/Cornetto'));
const TauFoods = lazy(() => import('./pages/TauFoods'));
const LouisVuitton = lazy(() => import('./pages/LouisVuitton'));
const Audi = lazy(() => import('./pages/Audi'));
const Nandos = lazy(() => import('./pages/Nandos'));
const Joshua = lazy(() => import('./pages/Joshua'));
const Vodacom = lazy(() => import('./pages/Vodacom'));
const Sars = lazy(() => import('./pages/Sars'));
const Resume = lazy(() => import('./pages/Resume'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));

/**
 * Open a page at the top of it. Every time, on every route.
 *
 * A single `scrollTo(0, 0)` in an effect is not enough, and the failure is
 * quiet: you click Louis Vuitton, and land half way down it.
 *
 *  - The browser's own `scrollRestoration` is "auto" by default and will put
 *    the offset back after our effect has run.
 *  - Route chunks are lazy. At the moment the pathname changes the incoming
 *    page is still a short Suspense fallback; the real, tall page mounts a
 *    frame or two later, and the offset has to be re-asserted once it has.
 *  - Any stray `scroll-behavior: smooth` on the document turns the jump into
 *    an animation that the very next render interrupts. We force `auto` for
 *    the duration of the jump rather than trusting no one has set it.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    const jump = () => {
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      root.style.scrollBehavior = prev;
    };
    // Immediately, and then re-asserted across the lazy route's mount so a
    // page that lengthens after the first jump can never leave you mid-page.
    jump();
    const raf = requestAnimationFrame(jump);
    const settle = window.setTimeout(jump, 140);
    const late = window.setTimeout(jump, 520);
    const later = window.setTimeout(jump, 1100);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.clearTimeout(late);
      window.clearTimeout(later);
    };
  }, [pathname]);

  return null;
};

const PageFallback = () => (
  <div className="min-h-screen bg-[#000000]" aria-hidden />
);

/**
 * Route chunks are fetched once the browser is genuinely idle — never during
 * the hero's first impression. By the time anyone clicks a link the chunk is
 * already in memory, so the matrix panel is never left covering an empty
 * Suspense fallback, and no route feels like it "loads".
 */
const routePrefetchers = [
  () => import('./pages/Work'),
  () => import('./pages/About'),
  () => import('./pages/Contact'),
  () => import('./pages/Resume'),
  () => import('./pages/Cornetto'),
  () => import('./pages/TauFoods'),
  () => import('./pages/LouisVuitton'),
  () => import('./pages/Audi'),
  () => import('./pages/Nandos'),
  () => import('./pages/Joshua'),
  () => import('./pages/Vodacom'),
  () => import('./pages/Sars'),
  () => import('./pages/Privacy'),
  () => import('./pages/NotFound'),
];

const useRoutePrefetch = () => {
  useEffect(() => {
    let cancelled = false;
    let i = 0;
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const idle = (cb: () => void) => {
      const w = window as IdleWindow;
      if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(cb, { timeout: 2500 });
      else window.setTimeout(cb, 400);
    };
    // One chunk per idle slice, so prefetching can never contend with a
    // scroll or an animation frame.
    const pump = () => {
      if (cancelled || i >= routePrefetchers.length) return;
      routePrefetchers[i++]().catch(() => {});
      idle(pump);
    };
    const kick = window.setTimeout(() => idle(pump), 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(kick);
    };
  }, []);
};

/**
 * Scroll progress bar.
 *
 * Was framer-motion's useScroll + useSpring. That pulled the whole motion
 * runtime onto the initial route just to scale one div. It is now a passive,
 * rAF-throttled scroll listener writing a single transform.
 */
const ScrollProgress: React.FC = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const write = () => {
      ticking = false;
      const bar = barRef.current;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(write);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    write();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return <div ref={barRef} className="scroll-progress fixed top-0 left-0 right-0 h-1 bg-accent z-50" aria-hidden />;
};

const AppContent: React.FC = () => {
  useSmoothScroll();
  useRoutePrefetch();
  const location = useLocation();
  /**
   * The reveal belongs to the transition, not to arriving at the site. On a
   * cold load the hero runs its own intro, so replaying page-enter on top of
   * it would only hold the largest text on the page back by another beat.
   */
  const firstPaint = useRef(true);
  useEffect(() => { firstPaint.current = false; }, []);

  return (
    <div className="relative min-h-screen bg-[#000000] mix-grain">
      <ScrollProgress />
      <CustomCursor />
      <Navbar />
      <main className="relative z-10">
        <Suspense fallback={<PageFallback />}>
          {/* Keyed on the path so every arrival replays the reveal: the new
              page's typography rises through the contracting matrix panel
              rather than simply being there. */}
          <div key={location.pathname} className={firstPaint.current ? undefined : 'page-enter'}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/work" element={<Work />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/work/cornetto" element={<Cornetto />} />
              <Route path="/work/tau-foods" element={<TauFoods />} />
              <Route path="/work/louis-vuitton" element={<LouisVuitton />} />
              <Route path="/work/audi" element={<Audi />} />
              <Route path="/work/nandos" element={<Nandos />} />
              <Route path="/work/joshua" element={<Joshua />} />
              <Route path="/work/vodacom" element={<Vodacom />} />
              <Route path="/work/sars" element={<Sars />} />
              <Route path="/resume" element={<Resume />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Suspense>
      </main>
      <footer className="site-footer relative z-10 border-t border-white/10 py-8 text-center text-[11px] uppercase tracking-[0.3em] text-[#8f8f88] bg-[#000000]">
        <p>© {new Date().getFullYear()} Papi Raborife — Crafted with culture, clarity and motion. <Link to="/privacy" className="hover:text-[#d7ff4f]">Privacy</Link></p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <MouseProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <AppContent />
        </ErrorBoundary>
      </MouseProvider>
    </Router>
  );
};

export default App;
