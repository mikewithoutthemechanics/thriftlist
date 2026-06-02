'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_AT = 9 * 60 * 1000; // 9 minutes

export function useInactivityLogout() {
  const { user, signOut } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);

  const doLogout = useCallback(async () => {
    await signOut();
    window.location.href = '/login?reason=session_expired';
  }, [signOut]);

  const showWarning = useCallback(() => {
    if (warnedRef.current) return;
    warnedRef.current = true;
    // Dispatch a custom event that a toast listener can pick up
    window.dispatchEvent(
      new CustomEvent('inactivity-warning', {
        detail: { message: 'You will be logged out in 1 minute due to inactivity.' },
      })
    );
  }, []);

  const resetTimer = useCallback(() => {
    if (!user) return;
    warnedRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    warningRef.current = setTimeout(showWarning, WARNING_AT);
    timerRef.current = setTimeout(doLogout, INACTIVITY_TIMEOUT);
  }, [user, doLogout, showWarning]);

  useEffect(() => {
    if (!user) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'wheel'];
    const handler = () => resetTimer();

    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimer]);
}
