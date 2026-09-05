import React from 'react';

type State = { failed: boolean };

/** Last-resort UI containment: an unexpected component error never leaves a blank page. */
class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // No visitor data is attached. Replace with a privacy-safe error service if desired.
    console.error('Portfolio UI error', error.name, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#171715] px-4">
        <div className="max-w-xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8f8f88] mb-5">Interface recovery</p>
          <h1 className="font-display text-4xl md:text-7xl leading-[0.9] text-[#f5f3ee]">
            THE PAGE HIT A<br /><span className="text-[#d7ff4f]">TEMPORARY GLITCH.</span>
          </h1>
          <p className="mt-6 text-sm text-[#8f8f88]">Your form data has not been submitted. Reload the page or contact the studio directly.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={() => window.location.reload()} className="rounded-full border border-[#d7ff4f] px-6 py-3 font-display text-xs tracking-[0.2em] text-[#d7ff4f] hover:bg-[#d7ff4f] hover:text-[#171715] transition-colors">RELOAD</button>
            <a href="mailto:papiraborife@gmail.com" className="rounded-full border border-white/15 px-6 py-3 font-display text-xs tracking-[0.2em] text-[#f5f3ee] hover:border-[#d7ff4f] transition-colors">EMAIL STUDIO</a>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;