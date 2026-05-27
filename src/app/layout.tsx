import { Playfair_Display, Lora, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

const lora = Lora({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
});

const ibmMono = IBM_Plex_Mono({
  variable: '--font-mono',
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Thrift List | Luxury Reselling Platform',
  description: 'Automated clothing listings for South African marketplaces. Sell smarter, not harder.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lora.variable} ${ibmMono.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex text-white gradient-bg">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}