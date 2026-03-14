'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

const titles = ['memorize', 'analyse', 'organize'];

export default function LandingPage() {
  const containerRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize title spans
    titles.forEach((text, i) => {
      const span = document.createElement('span');
      span.textContent = text;
      span.style.cssText = 'transition: all 0.6s cubic-bezier(0.16,1,0.3,1); position: absolute; width: 100%; left: 0;';
      if (i === 0) {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      } else {
        span.style.opacity = '0';
        span.style.transform = 'translateY(40px)';
      }
      container.appendChild(span);
    });

    const interval = setInterval(() => {
      const children = container.children;
      if (children.length === 0) return;
      const prev = indexRef.current;
      indexRef.current = (indexRef.current + 1) % titles.length;
      const next = indexRef.current;

      (children[prev] as HTMLElement).style.opacity = '0';
      (children[prev] as HTMLElement).style.transform = 'translateY(-40px)';
      (children[next] as HTMLElement).style.opacity = '1';
      (children[next] as HTMLElement).style.transform = 'translateY(0)';

      setTimeout(() => {
        (children[prev] as HTMLElement).style.transform = 'translateY(40px)';
      }, 600);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        .snap-container { height: 100vh; overflow-y: scroll; scroll-snap-type: y mandatory; scrollbar-width: none; }
        .snap-container::-webkit-scrollbar { display: none; }
        .snap-section { scroll-snap-align: start; scroll-snap-stop: always; min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
        .glow-teal { text-shadow: 0 0 25px rgba(0,255,213,0.4); }
        .bg-gradient-teal { background: radial-gradient(circle at center, rgba(13,31,34,1) 0%, rgba(5,12,13,1) 100%); }
        .glass-panel { background: rgba(13,31,34,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(0,255,213,0.1); }
        .teal-accent { color: #00ffd5; }
        .bg-teal-accent { background-color: #00ffd5; }
        .bg-dark-teal { background-color: #0d1f22; }
        .bg-charcoal { background-color: #1a1a1a; }
        .bg-background-landing { background-color: #050c0d; }
        .text-muted-fg { color: #94a3b8; }
      `}</style>

      <div className="bg-background-landing text-white antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="snap-container">

          {/* ===== HERO SECTION ===== */}
          <section className="snap-section bg-gradient-teal">
            <div className="container mx-auto px-4">
              <div className="flex gap-8 py-20 items-center justify-center flex-col text-center">
                {/* Badge */}
                <div>
                  <span className="inline-flex items-center justify-center gap-2 rounded-full bg-dark-teal px-4 py-1.5 text-sm font-medium teal-accent border border-teal-900/50">
                    AI-Powered HR Intelligence
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </span>
                </div>

                {/* Headline */}
                <div className="flex gap-6 flex-col items-center">
                  <h1 className="text-5xl md:text-7xl max-w-3xl tracking-tighter font-medium leading-[1.1]">
                    <span className="block text-slate-100">Canopy helps you</span>
                    <span
                      ref={containerRef}
                      className="relative flex w-full justify-center overflow-hidden glow-teal font-bold"
                      style={{ height: '1.2em', color: '#00ffd5' }}
                    />
                  </h1>
                  <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-fg max-w-2xl">
                    Experience a seamless workflow designed for the modern HR professional.
                    Automate the tedious and focus on what truly matters to your growth.
                  </p>
                </div>

                {/* Get Started Button */}
                <div className="mt-4">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-accent px-10 py-3.5 text-sm font-bold text-black transition-all hover:brightness-110"
                    style={{ boxShadow: '0 0 20px rgba(0,255,213,0.3)' }}
                  >
                    Get Started
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Link>
                </div>

                <div className="mt-12 animate-bounce opacity-50">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 14l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* ===== INSTITUTIONAL MEMORY ===== */}
          <section className="snap-section bg-charcoal border-t border-teal-900/20">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="teal-accent font-semibold tracking-widest uppercase text-sm">Institutional Memory</div>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight">Your digital brain, <br/>never forgets.</h2>
                  <p className="text-muted-fg text-lg max-w-md">
                    Every conversation, note, and commitment indexed and retrievable. Never walk into a meeting blind again.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 glass-panel rounded-lg">
                      <span className="teal-accent text-2xl">🧠</span>
                      <div>
                        <div className="text-white font-medium">Contextual Recall</div>
                        <p className="text-sm text-muted-fg">Automatic retrieval of previous meeting outcomes.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="aspect-video glass-panel rounded-2xl border border-teal-900/30 shadow-2xl relative overflow-hidden flex flex-col p-4">
                  <div className="flex items-center gap-2 mb-4 border-b border-teal-900/30 pb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    <div className="ml-auto text-[10px] opacity-50 font-mono uppercase tracking-widest teal-accent">Memory Console</div>
                  </div>
                  <div className="flex-1 space-y-3 font-mono text-xs opacity-80">
                    <div className="teal-accent">&gt; query --all &quot;Q3 commitments&quot;</div>
                    <div className="text-slate-400">Found 3 relevant transcripts from July 2023...</div>
                    <div className="p-2 bg-teal-950/20 rounded border border-teal-900/50 italic text-slate-300">
                      &quot;Sarah agreed to review the vendor contract by Friday.&quot;
                    </div>
                    <div className="teal-accent">&gt; summarize --delta</div>
                    <div className="text-slate-400">Comparing current progress to initial roadmap...</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== ANALYZE SENTIMENT ===== */}
          <section className="snap-section bg-background-landing border-t border-teal-900/20">
            <div className="container mx-auto px-4">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Chart */}
                <div className="order-2 lg:order-1 aspect-square max-w-md mx-auto w-full glass-panel rounded-3xl border border-teal-500/20 relative flex flex-col p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="teal-accent font-mono text-sm uppercase tracking-tighter">Team Sentiment Index</h3>
                    <span className="teal-accent font-bold text-xl">84%</span>
                  </div>
                  <div className="flex-1 flex items-end gap-2 px-2">
                    {[50, 66, 75, 83, 50].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t transition-all hover:opacity-80" style={{
                        height: `${h}%`,
                        background: `rgba(0,255,213,${0.1 + i * 0.12})`,
                        borderTop: `1px solid rgba(0,255,213,${0.2 + i * 0.15})`
                      }} />
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-teal-900/30 flex justify-between text-[10px] text-muted-fg uppercase font-mono">
                    <span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span>
                  </div>
                </div>
                {/* Text */}
                <div className="order-1 lg:order-2 space-y-6">
                  <div className="teal-accent font-semibold tracking-widest uppercase text-sm">Analyze Sentiment</div>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight">Data that feels <br/>human.</h2>
                  <p className="text-muted-fg text-lg">
                    Uses AI to extract burnout signals, emotional trends, and risk indicators from transcripts. Stay ahead of team morale before it affects the bottom line.
                  </p>
                  <Link href="/auth/login" className="teal-accent font-medium hover:underline inline-flex items-center gap-1">
                    Learn about analytics
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7-7 7M5 12h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ===== ORGANIZE & PREP ===== */}
          <section className="snap-section bg-dark-teal">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-4xl mx-auto space-y-12">
                <div className="space-y-4">
                  <div className="teal-accent font-semibold tracking-widest uppercase text-sm">Organize &amp; Prep</div>
                  <h2 className="text-4xl md:text-6xl font-bold">Ready to <span className="teal-accent">Break Ice?</span></h2>
                  <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                    The HR leader walks in knowing exactly what to say. Personalized AI prep briefs curated from every relevant interaction.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { icon: '😊', title: 'Employee Mood', desc: 'Detect shifts in enthusiasm or frustration through natural language analysis of check-ins.' },
                    { icon: '⚠️', title: 'Key Concerns', desc: 'Summarized list of recurring issues raised in asynchronous threads and chats.' },
                    { icon: '📅', title: 'Overdue Commitments', desc: 'Auto-track promises made in meetings that haven\'t been reflected in task managers yet.' },
                  ].map((card) => (
                    <div key={card.title} className="p-6 glass-panel rounded-xl text-left space-y-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-10 text-4xl">{card.icon}</div>
                      <h4 className="teal-accent font-bold">{card.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-8">
                  <Link
                    href="/auth/login"
                    className="inline-block px-10 py-4 rounded-full bg-teal-accent text-black font-bold hover:brightness-110 transition-all shadow-lg"
                    style={{ boxShadow: '0 0 20px rgba(0,255,213,0.3)' }}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
