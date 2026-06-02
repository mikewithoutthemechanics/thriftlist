'use client';

import { useRef, useEffect } from 'react';

const items = [
  'Yaga', 'Facebook Marketplace', 'Gumtree', 'OLX', 'Junk Mail', 'Auto-Post', 'One Upload', 'Every Platform',
];

export default function MarqueeStrip() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let x = 0;
    let animId: number;
    const speed = 0.4;

    const animate = () => {
      x -= speed;
      const half = track.scrollWidth / 2;
      if (Math.abs(x) >= half) x = 0;
      track.style.transform = `translateX(${x}px)`;
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const content = items.map((text, i) => (
    <span key={i} className="flex items-center gap-6 text-lg sm:text-xl font-bold text-foreground/10 uppercase tracking-[0.2em] whitespace-nowrap px-6">
      {text}
      <span className="w-[3px] h-[3px] rounded-full bg-primary/30 flex-shrink-0" />
    </span>
  ));

  return (
    <section className="relative py-6 overflow-hidden border-y border-border bg-background">
      <div ref={trackRef} className="flex w-max">
        {content}
        {content}
      </div>
    </section>
  );
}
