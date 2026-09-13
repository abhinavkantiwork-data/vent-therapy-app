import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Check, ChevronDown, HeartHandshake, LockKeyhole, MessageCircle, Mic, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = [
    ['Is VENT a replacement for therapy?', 'No. VENT offers everyday emotional support and reflection, but it is not a replacement for a licensed mental health professional or emergency care.'],
    ['Are my conversations private?', 'Your account and conversations are tied to your authenticated session. Avoid sharing sensitive information you would not want stored online.'],
    ['What happens in a crisis?', 'If you may hurt yourself or someone else, contact local emergency services or a crisis hotline immediately. VENT is not an emergency service.'],
  ];

  return (
    <main className="home-shell">
      <nav className="home-nav page-width">
        <Link to="/" className="brand-mark" aria-label="VENT home"><span className="brand-mark-icon"><Sparkles size={16} /></span><span>VENT 0.2</span></Link>
        <div className="home-nav-links"><a href="#how-it-works">How it works</a><a href="#questions">Questions</a><Link to={user ? '/dashboard' : '/login'} className="nav-action">{user ? 'Open your space' : 'Sign in'} <ArrowRight size={15} /></Link></div>
      </nav>

      <section className="home-hero page-width">
        <div className="hero-copy-block"><p className="eyebrow"><span className="eyebrow-dot" /> A calmer place to begin</p><h1>Make room for what you feel.</h1><p className="hero-lede">VENT is a private space to talk things through, notice patterns, and find one steady next step.</p><div className="hero-actions"><Link to={user ? '/dashboard' : '/login'} className="primary-action">{user ? 'Go to your space' : 'Start a conversation'} <ArrowRight size={18} /></Link><a href="#how-it-works" className="text-action">See how it works <ArrowRight size={16} /></a></div><div className="hero-trust"><LockKeyhole size={15} /> Your words stay tied to your account</div></div>
        <div className="hero-note" aria-label="A quiet space for reflection"><div className="note-orbit note-orbit-one" /><div className="note-orbit note-orbit-two" /><div className="note-center"><Brain size={28} /></div><div className="note-caption"><span>Today’s prompt</span><strong>What would feel a little lighter?</strong></div></div>
      </section>

      <section className="home-proof page-width" id="how-it-works"><p className="section-kicker">A simple ritual for difficult days</p><div className="proof-grid"><article><span className="proof-number">01</span><h2>Say what’s there</h2><p>Write or speak honestly, without needing the perfect words.</p></article><article><span className="proof-number">02</span><h2>Find a little clarity</h2><p>Receive a thoughtful response that helps you slow down and reflect.</p></article><article><span className="proof-number">03</span><h2>Keep the thread</h2><p>Return to your sessions and notice what changes over time.</p></article></div></section>

      <section className="home-feature-band"><div className="page-width feature-layout"><div><p className="section-kicker">Built for real life</p><h2>Support that meets you where you are.</h2><p className="feature-intro">No appointment, performance, or polished story required. Just a small place to land when your mind feels crowded.</p></div><div className="feature-list"><div><MessageCircle size={20} /><span><strong>Thoughtful conversation</strong><small>Warm, concise responses that keep the focus on you.</small></span></div><div><Mic size={20} /><span><strong>Use your own voice</strong><small>Move between typing and speaking when it feels easier.</small></span></div><div><HeartHandshake size={20} /><span><strong>Gentle perspective</strong><small>Simple prompts for noticing, naming, and moving forward.</small></span></div></div></div></section>

      <section className="home-faq page-width" id="questions"><div className="faq-heading"><p className="section-kicker">Good to know</p><h2>Questions, answered.</h2></div><div className="faq-list">{faqs.map(([question, answer], index) => <div className="faq-item" key={question}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}><span>{question}</span><ChevronDown size={18} className={openFaq === index ? 'faq-chevron-open' : ''} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></section>

      <footer className="home-footer page-width"><div><Link to="/" className="brand-mark"><span className="brand-mark-icon"><Sparkles size={16} /></span><span>VENT 0.2</span></Link><p>A little more room to breathe.</p><a className="footer-email" href="mailto:abhinav.kanti.work@gmail.com">abhinav.kanti.work@gmail.com</a></div><div className="footer-note"><Check size={15} /> Supportive, not a substitute for professional care.</div></footer>
    </main>
  );
};

export default HomePage;
