import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c] p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-[accent]/10 flex items-center justify-center">
          <span className="text-5xl font-bold text-[accent]">404</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">Page not found</h1>
          <p className="text-white/60">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[accent] text-[#0c0c0c] rounded-full font-semibold text-sm hover:bg-[accent] transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
