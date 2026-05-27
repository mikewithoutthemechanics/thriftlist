'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect } from 'react';

interface ImageLightboxProps {
  images: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onChange: (index: number) => void;
}

export default function ImageLightbox({ images, index, open, onClose, onChange }: ImageLightboxProps) {
  const next = useCallback(() => {
    onChange((index + 1) % images.length);
  }, [index, images.length, onChange]);

  const prev = useCallback(() => {
    onChange((index - 1 + images.length) % images.length);
  }, [index, images.length, onChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, next, prev]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={onClose}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors z-10">
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors z-10">
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {images.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors z-10">
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          <motion.img
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            src={images[index]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onChange(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
