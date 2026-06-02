'use client';

import { usePathname } from 'next/navigation';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import Sidebar from '@/components/Sidebar';
import ParticleBackground from '@/components/ParticleBackground';
import AuthProvider from '@/components/AuthProvider';
import Toaster from '@/components/Toaster';
import SmoothScroll from '@/components/SmoothScroll';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Onboarding from '@/components/Onboarding';
import SetupWizard from '@/components/SetupWizard';
import DashboardTour from '@/components/DashboardTour';
import SetupBanner from '@/components/SetupBanner';
import NotificationBell from '@/components/NotificationBell';

function InactivityMonitor() {
  useInactivityLogout();
  useKeyboardShortcuts();
  return null;
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  return (
    <ThemeProvider>
      <AuthProvider>
        <InactivityMonitor />
        <Toaster>
          {!isLanding && (
            <>
              <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-black focus:font-semibold">
                Skip to main content
              </a>
              <Sidebar />
              <div className="fixed top-4 right-4 z-[55]">
                <NotificationBell />
              </div>
            </>
          )}
          <SmoothScroll>
            <ErrorBoundary>
              <main
                id="main-content"
                className={`flex-1 overflow-auto relative z-10 ${isLanding ? 'p-0' : 'p-4 md:p-8 md:ml-64'}`}
              >
                {children}
              </main>
            </ErrorBoundary>
          </SmoothScroll>
        </Toaster>
        <SetupWizard />
        <Onboarding />
        <DashboardTour />
        <SetupBanner />
      </AuthProvider>
    </ThemeProvider>
  );
}
