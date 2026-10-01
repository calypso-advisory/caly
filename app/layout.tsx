import type { Metadata, Viewport } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://calypso-advisory.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Calypso Advisory', template: '%s · Calypso Advisory' },
  description: "Calypso Advisory accompagne les dirigeants d'entreprises en difficulté : audit, orientation et pilotage de la trajectoire.",
  openGraph: { type: 'website', locale: 'fr_FR', siteName: 'Calypso Advisory' },
  icons: { icon: '/icon.svg' }
};

export const viewport: Viewport = { themeColor: '#08161F', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@400;500;600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
