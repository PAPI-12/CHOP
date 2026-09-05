import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', project: '', message: '', website: '' });
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'api' | 'email' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const idempotencyRef = useRef<string>('');
  const emailFallbackHref = `mailto:papiraborife@gmail.com?subject=${encodeURIComponent(
    `Portfolio enquiry — ${formData.project || 'New project'}`,
  )}&body=${encodeURIComponent(
    `Name: ${formData.name}\nEmail: ${formData.email}\nProject: ${formData.project || '-'}\n\n${formData.message}`,
  )}`;

  /**
   * Defensive submit: if the optional Python backend (backend/main.py) is
   * deployed and reachable at VITE_API_URL, the message is delivered there.
   * Static mode opens a populated email draft; API mode stores the lead in
   * SQLite. Neither path claims success before a real delivery action occurs.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    setStatusMessage('Sending your enquiry…');

    const apiUrl = ((import.meta as any).env?.VITE_API_URL as string | undefined) || 'http://localhost:8000';
    const openEmailFallback = () => {
      window.location.href = emailFallbackHref;
      setStatus('email');
      setStatusMessage('Email draft opened — please press Send in your email app.');
    };

    if (!apiUrl) {
      openEmailFallback();
      return;
    }

    if (!idempotencyRef.current) {
      idempotencyRef.current =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID().replace(/-/g, '')
          : `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
    }

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyRef.current,
        },
        body: JSON.stringify({ ...formData, consent }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeout));

      if (res.ok) {
        const payload = await res.json().catch(() => ({}));
        setStatus('api');
        setStatusMessage(
          payload.duplicate
            ? 'We already received this enquiry — no duplicate was created.'
            : payload.notification_sent
              ? 'Your enquiry was securely received and the studio was notified.'
              : 'Your enquiry was securely stored for studio review.',
        );
        setFormData({ name: '', email: '', project: '', message: '', website: '' });
        setConsent(false);
        idempotencyRef.current = '';
        return;
      }

      if (res.status === 400 || res.status === 422) {
        setStatus('error');
        setStatusMessage('Please check every field and try again. Your form has not been cleared.');
        return;
      }
      if (res.status === 429) {
        setStatus('error');
        setStatusMessage('Too many attempts. Please wait a minute or use the email address shown on this page.');
        return;
      }

      if (res.status === 409) {
        setStatus('error');
        setStatusMessage('This submission changed during a retry. Review the form and submit again with a fresh request.');
        idempotencyRef.current = '';
        return;
      }

      // Do not launch another application unexpectedly. Preserve the form and
      // let the visitor deliberately choose retry or the email fallback.
      setStatus('error');
      setStatusMessage('The studio API could not confirm receipt. Your form is preserved; retry or use the email fallback below.');
    } catch {
      setStatus('error');
      setStatusMessage('The connection timed out. Your form is preserved; retry or use the email fallback below.');
    }
  };

  return (
    <div className="min-h-screen bg-[#171715] pt-24 md:pt-32">
      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-6 md:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1600px] mx-auto">
          <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-3 md:mb-4 text-[#8f8f88]">Get In Touch</p>
          <h1 className="text-[11vw] md:text-[6vw] font-display leading-[0.9] text-[#f5f3ee] max-w-4xl">LET'S CREATE<br /><span className="text-[#d7c4aa]">SOMETHING</span>{' '}<span className="text-[#d7ff4f]">GREAT</span></h1>
        </motion.div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-6 md:py-12">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <p className="hand-note text-[#d7c4aa] text-lg md:text-2xl mb-6 md:mb-8">Available for freelance projects and collaborations</p>
            <div className="space-y-5 md:space-y-6">
              <a href="mailto:papiraborife@gmail.com" className="flex items-center gap-4 group">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#d7ff4f] group-hover:bg-[#d7ff4f]/10 transition-all"><Mail className="w-5 h-5 text-[#d7ff4f]" /></div>
                <div><p className="text-[10px] md:text-xs text-[#8f8f88] uppercase tracking-wider">Email</p><p className="text-base md:text-xl font-display text-[#f5f3ee] group-hover:text-[#d7ff4f] transition-colors break-all">papiraborife@gmail.com</p></div>
              </a>
              <a href="tel:+27636965065" className="flex items-center gap-4 group">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:border-[#d7ff4f] group-hover:bg-[#d7ff4f]/10 transition-all"><Phone className="w-5 h-5 text-[#d7ff4f]" /></div>
                <div><p className="text-[10px] md:text-xs text-[#8f8f88] uppercase tracking-wider">Phone</p><p className="text-base md:text-xl font-display text-[#f5f3ee] group-hover:text-[#d7ff4f] transition-colors">+27 63 696 5065</p></div>
              </a>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center"><MapPin className="w-5 h-5 text-[#d7ff4f]" /></div>
                <div><p className="text-[10px] md:text-xs text-[#8f8f88] uppercase tracking-wider">Location</p><p className="text-base md:text-xl font-display text-[#f5f3ee]">Johannesburg, South Africa</p></div>
              </div>
            </div>
            <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-white/10">
              <p className="text-[10px] md:text-xs text-[#8f8f88] uppercase tracking-wider mb-3 md:mb-4">Follow</p>
              <div className="flex gap-3 md:gap-4 flex-wrap">
                {[
                  { label: 'Instagram', href: 'https://www.instagram.com/' },
                  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
                  { label: 'Behance', href: 'https://www.behance.net/' },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="px-4 py-2 border border-white/20 rounded-full text-[10px] md:text-xs text-[#8f8f88] hover:border-[#d7ff4f] hover:text-[#d7ff4f] transition-all">{s.label}</a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-[#1d1d1a] p-5 md:p-10 rounded-2xl md:rounded-3xl">
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6" noValidate={false}>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute left-[-10000px] h-px w-px overflow-hidden"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-[10px] md:text-xs text-[#8f8f88] uppercase tracking-wider mb-2">Name</label>
                  <input type="text" required minLength={2} maxLength={120} autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-[#171715] border border-white/10 rounded-lg px-4 py-3 text-sm md:text-base text-[#f5f3ee] focus:border-[#d7ff4f] focus:outline-none transition-colors" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs text-[#8f8f88] uppercase tracking-wider mb-2">Email</label>
                  <input type="email" required maxLength={254} autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-[#171715] border border-white/10 rounded-lg px-4 py-3 text-sm md:text-base text-[#f5f3ee] focus:border-[#d7ff4f] focus:outline-none transition-colors" placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] md:text-xs text-[#8f8f88] uppercase tracking-wider mb-2">Project Type</label>
                <select value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} className="w-full bg-[#171715] border border-white/10 rounded-lg px-4 py-3 text-sm md:text-base text-[#f5f3ee] focus:border-[#d7ff4f] focus:outline-none transition-colors">
                  <option value="">Select a project type</option>
                  <option value="uxui">UX/UI – Tau Foods</option>
                  <option value="artdirection">Art Direction – SARS</option>
                  <option value="ai">AI – Louis Vuitton</option>
                  <option value="uiux-illu">UI/UX + Art Direction & Illustration – Cornetto</option>
                  <option value="aiadv">AI Advertising – Audi</option>
                  <option value="artcine">Art Direction & Cinematography – Debonairs</option>
                  <option value="cine">Cinematography – Joshua The I Am</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] md:text-xs text-[#8f8f88] uppercase tracking-wider mb-2">Message</label>
                <textarea required minLength={10} maxLength={4000} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={5} className="w-full bg-[#171715] border border-white/10 rounded-lg px-4 py-3 text-sm md:text-base text-[#f5f3ee] focus:border-[#d7ff4f] focus:outline-none transition-colors resize-none" placeholder="Tell me about your project..." />
              </div>
              <label className="flex items-start gap-3 text-[10px] md:text-xs leading-relaxed text-[#8f8f88] cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#d7ff4f]"
                />
                <span>
                  I consent to my details being used to respond to this enquiry. See the{' '}
                  <Link to="/privacy" className="text-[#d7ff4f] underline underline-offset-2">privacy notice</Link>.
                </span>
              </label>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 bg-[#d7ff4f] text-[#171715] font-display text-xs md:text-sm uppercase tracking-[0.22em] hover:bg-[#f5f3ee] transition-colors rounded-full border border-transparent disabled:cursor-wait disabled:opacity-60"
              >
                {status === 'sending' ? 'SENDING…' : 'SEND MESSAGE'}
              </button>
              {status !== 'idle' && status !== 'sending' && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`text-center font-mono text-[10px] uppercase tracking-[0.16em] mt-3 ${status === 'error' ? 'text-[#d7c4aa]' : 'text-[#d7ff4f]'}`}
                >
                  {statusMessage}
                </p>
              )}
              {status === 'error' && (
                <a
                  href={emailFallbackHref}
                  className="block text-center font-display text-[10px] md:text-xs uppercase tracking-[0.18em] text-[#d7ff4f] underline underline-offset-4"
                >
                  Open a populated email draft instead
                </a>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-12 xl:px-24 py-10 md:py-16 border-t border-white/10 mt-12 md:mt-16">
        <div className="max-w-[1600px] mx-auto text-center">
          <p className="hand-note text-[#d7c4aa] text-xl md:text-4xl">“Good design is honest” — Dieter Rams</p>
        </div>
      </section>
    </div>
  );
};

export default Contact;
