import React from 'react';
import CTAButton from '../components/CTAButton';

const Privacy: React.FC = () => (
  <div className="min-h-screen bg-[#171715] pt-28 md:pt-36 px-4 sm:px-6 lg:px-12 xl:px-24 pb-20">
    <main className="max-w-4xl mx-auto">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8f8f88] mb-5">Legal / Privacy</p>
      <h1 className="font-display text-[14vw] sm:text-[10vw] md:text-[6vw] leading-[0.86] text-[#f5f3ee] mb-10">
        YOUR DATA.<br /><span className="text-[#d7ff4f]">HONESTLY HANDLED.</span>
      </h1>

      <div className="space-y-8 text-sm md:text-base leading-relaxed text-[#8f8f88]">
        <section>
          <h2 className="font-display text-xl md:text-2xl text-[#d7c4aa] mb-3">What is collected</h2>
          <p>Name, email address, selected project type, and the message you choose to submit through the contact form.</p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl text-[#d7c4aa] mb-3">Why it is used</h2>
          <p>Only to assess and respond to your enquiry, discuss a possible project, and retain a record of business correspondence.</p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl text-[#d7c4aa] mb-3">Storage and retention</h2>
          <p>When the studio API is enabled, enquiries are stored in the studio database for up to 12 months unless a longer period is legally required. Static-mode enquiries open in your own email application and are not stored by this website.</p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl text-[#d7c4aa] mb-3">Sharing</h2>
          <p>Your details are not sold. They may be processed by hosting, email, Google Fonts, or image-delivery providers solely to operate and display this website. Loading externally hosted fonts or images can disclose your IP address to those providers.</p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl text-[#d7c4aa] mb-3">Your rights</h2>
          <p>You may ask to access, correct, or delete your enquiry by emailing <a className="text-[#d7ff4f] underline" href="mailto:papiraborife@gmail.com">papiraborife@gmail.com</a>. Identity may be verified before disclosure or deletion.</p>
        </section>
        <section>
          <h2 className="font-display text-xl md:text-2xl text-[#d7c4aa] mb-3">Cookies and tracking</h2>
          <p>This build does not install analytics or advertising cookies. Third-party links are governed by their own privacy terms.</p>
        </section>
      </div>

      <div className="mt-12"><CTAButton to="/contact">BACK TO CONTACT</CTAButton></div>
    </main>
  </div>
);

export default Privacy;