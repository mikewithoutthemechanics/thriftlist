'use client';

import { useMemo, useEffect, useState } from 'react';

interface ClothingItem {
  id: number;
  src: string;
  width: number;
  height: number;
  landX: number;
  landY: number;
  landZ: number;
  rx: number;
  ry: number;
  rz: number;
  duration: number;
  delay: number;
  floatDelay: number;
}

const clothingData: Omit<ClothingItem, 'id'>[] = [
  // CLOTHING
  {
    src: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=350&auto=format&fit=crop&q=80',
    width: 140, height: 180,
    landX: 18, landY: 64, landZ: 80,
    rx: 72, ry: -5, rz: 12,
    duration: 2.8, delay: 0.2, floatDelay: 3.2,
  },
  {
    src: 'https://images.unsplash.com/photo-1542272617-08f086302542?w=350&auto=format&fit=crop&q=80',
    width: 130, height: 200,
    landX: 46, landY: 70, landZ: 120,
    rx: 80, ry: -6, rz: -14,
    duration: 3.2, delay: 0.5, floatDelay: 3.8,
  },
  // ELECTRONICS
  {
    src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=350&auto=format&fit=crop&q=80',
    width: 110, height: 180,
    landX: 10, landY: 72, landZ: 140,
    rx: 74, ry: 8, rz: -6,
    duration: 3.1, delay: 2.9, floatDelay: 4.0,
  },
  {
    src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=350&auto=format&fit=crop&q=80',
    width: 170, height: 120,
    landX: 34, landY: 76, landZ: 170,
    rx: 78, ry: -3, rz: 8,
    duration: 2.6, delay: 1.2, floatDelay: 3.4,
  },
  {
    src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=350&auto=format&fit=crop&q=80',
    width: 150, height: 130,
    landX: 58, landY: 82, landZ: 190,
    rx: 82, ry: 4, rz: -12,
    duration: 2.4, delay: 2.1, floatDelay: 3.2,
  },
  // FURNITURE / HOME
  {
    src: 'https://images.unsplash.com/photo-1503602642458-232111445657?w=350&auto=format&fit=crop&q=80',
    width: 140, height: 150,
    landX: 26, landY: 78, landZ: 160,
    rx: 76, ry: -4, rz: 18,
    duration: 3.0, delay: 1.6, floatDelay: 3.8,
  },
  {
    src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=350&auto=format&fit=crop&q=80',
    width: 130, height: 170,
    landX: 70, landY: 74, landZ: 130,
    rx: 73, ry: 5, rz: 22,
    duration: 2.9, delay: 0.9, floatDelay: 3.5,
  },
  // SHOES / ACCESSORIES
  {
    src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=350&auto=format&fit=crop&q=80',
    width: 120, height: 120,
    landX: 42, landY: 84, landZ: 210,
    rx: 85, ry: 2, rz: -18,
    duration: 2.2, delay: 1.7, floatDelay: 3.0,
  },
  {
    src: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=350&auto=format&fit=crop&q=80',
    width: 140, height: 140,
    landX: 78, landY: 80, landZ: 180,
    rx: 77, ry: -2, rz: 14,
    duration: 2.7, delay: 2.4, floatDelay: 3.6,
  },
  // BOOKS / MISC
  {
    src: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=350&auto=format&fit=crop&q=80',
    width: 130, height: 160,
    landX: 52, landY: 68, landZ: 100,
    rx: 71, ry: 6, rz: 28,
    duration: 3.0, delay: 1.4, floatDelay: 3.6,
  },
  {
    src: 'https://images.unsplash.com/photo-1586495777744-4413f21024fa?w=350&auto=format&fit=crop&q=80',
    width: 140, height: 140,
    landX: 64, landY: 86, landZ: 220,
    rx: 86, ry: -3, rz: -10,
    duration: 2.1, delay: 2.6, floatDelay: 3.0,
  },
  // MORE HOME / VINTAGE
  {
    src: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=350&auto=format&fit=crop&q=80',
    width: 160, height: 130,
    landX: 6, landY: 82, landZ: 200,
    rx: 79, ry: 7, rz: -22,
    duration: 2.5, delay: 3.0, floatDelay: 3.8,
  },
  {
    src: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=350&auto=format&fit=crop&q=80',
    width: 150, height: 150,
    landX: 84, landY: 66, landZ: 110,
    rx: 70, ry: -5, rz: 16,
    duration: 3.3, delay: 0.7, floatDelay: 3.4,
  },
  // BABY / KIDS
  {
    src: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=350&auto=format&fit=crop&q=80',
    width: 130, height: 130,
    landX: 22, landY: 86, landZ: 230,
    rx: 84, ry: -3, rz: 20,
    duration: 2.3, delay: 1.9, floatDelay: 3.2,
  },
  {
    src: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=350&auto=format&fit=crop&q=80',
    width: 150, height: 120,
    landX: 38, landY: 88, landZ: 240,
    rx: 87, ry: 4, rz: -14,
    duration: 2.1, delay: 2.7, floatDelay: 3.0,
  },
  {
    src: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=350&auto=format&fit=crop&q=80',
    width: 140, height: 140,
    landX: 54, landY: 90, landZ: 250,
    rx: 83, ry: -6, rz: 10,
    duration: 2.4, delay: 3.2, floatDelay: 3.6,
  },
  {
    src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=350&auto=format&fit=crop&q=80',
    width: 120, height: 160,
    landX: 72, landY: 86, landZ: 210,
    rx: 75, ry: 5, rz: -18,
    duration: 2.8, delay: 1.5, floatDelay: 3.4,
  },
];

export default function FallingClothes3D() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = useMemo(() => {
    return clothingData.map((item, i) => ({ ...item, id: i }));
  }, []);

  const dustParticles = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 25; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        top: 40 + Math.random() * 50,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 6,
        color: Math.random() > 0.5 ? 'rgba(196,168,130,0.4)' : 'rgba(255,255,255,0.3)',
      });
    }
    return particles;
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ perspective: '1200px', perspectiveOrigin: '50% 80%' }}
    >
      {/* Parallax container */}
      <div
        className="absolute inset-0"
        style={{
          transform: 'translateY(' + (scrollY * 0.35) + 'px)',
          transition: 'transform 0.1s linear',
          willChange: 'transform',
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute will-change-transform"
            style={{
              left: item.landX + '%',
              top: item.landY + '%',
              zIndex: Math.floor(item.landZ),
              transformStyle: 'preserve-3d',
              animation: 'clothes-fall ' + item.duration + 's ease-out ' + item.delay + 's forwards',
              ['--land-y' as string]: '0px',
              ['--land-z' as string]: item.landZ + 'px',
              ['--rx' as string]: item.rx + 'deg',
              ['--ry' as string]: item.ry + 'deg',
              ['--rz' as string]: item.rz + 'deg',
            }}
          >
            <div
              className="relative will-change-transform"
              style={{
                width: item.width,
                height: item.height,
                animation: 'fabric-float 4s ease-in-out ' + item.floatDelay + 's infinite',
                ['--rz' as string]: item.rz + 'deg',
              }}
            >
              <img
                src={item.src}
                alt=""
                width={item.width}
                height={item.height}
                className="w-full h-full object-contain"
                style={{
                  filter: 'drop-shadow(0 ' + (20 + item.landZ / 15) + 'px ' + (30 + item.landZ / 10) + 'px rgba(0,0,0,0.7))',
                  borderRadius: '8px',
                }}
                loading="eager"
                draggable={false}
              />
            </div>
          </div>
        ))}

        {dustParticles.map((p) => (
          <div
            key={'dust-' + p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.left + '%',
              top: p.top + '%',
              width: p.size,
              height: p.size,
              background: p.color,
              animation: 'dust-float ' + p.duration + 's ease-out ' + p.delay + 's infinite',
            }}
          />
        ))}

        <div
          className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,0,0,0.9) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}