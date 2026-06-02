'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl+S even in inputs for form saving
        if (!(e.ctrlKey && e.key.toLowerCase() === 's')) return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        router.push('/items/new');
      }

      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        // Trigger save on current form if available
        const saveBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        if (saveBtn && !saveBtn.disabled) saveBtn.click();
      }

      if (e.key === 'Escape') {
        // Close any open modal by finding the first close button
        const closeBtns = document.querySelectorAll('[data-modal-close], .modal-close, button[aria-label*="Close"]');
        for (const btn of Array.from(closeBtns)) {
          if (btn instanceof HTMLElement && btn.offsetParent !== null) {
            btn.click();
            break;
          }
        }
        // Also try to navigate back if on item detail page
        const backLink = document.querySelector('a[href="/items"]') as HTMLAnchorElement | null;
        if (backLink && window.location.pathname !== '/items' && window.location.pathname.startsWith('/items/')) {
          // Only if no modal was closed
          if (closeBtns.length === 0 || !(Array.from(closeBtns).some(b => (b as HTMLElement).offsetParent !== null))) {
            router.push('/items');
          }
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);
}
