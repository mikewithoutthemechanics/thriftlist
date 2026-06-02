import { Fira_Code, Fira_Sans } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

const firaCode = Fira_Code({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

const firaSans = Fira_Sans({
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
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
      className={`${firaCode.variable} ${firaSans.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020617" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex text-white gradient-bg">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}