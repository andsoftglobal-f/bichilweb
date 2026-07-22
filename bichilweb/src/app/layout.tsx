import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingMenu from "@/components/FloatingMenu";
import AdPopup from "@/components/AdPopup";
import PageTracker from "@/components/PageTracker";
import { getLocale } from "@/lib/serverLocale";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bichilglobus.mn'),
  title: "BichilGlobus",
  description: "BichilGlobus нь таны бизнесийг олон улсын зах зээлд гаргахад туслах найдвартай түнш юм.",
  icons: {
    icon: '/browser-logo.png',
    shortcut: '/browser-logo.png',
    apple: '/browser-logo.png',
  },
  openGraph: {
    title: "BichilGlobus",
    description: "BichilGlobus нь таны бизнесийг олон улсын зах зээлд гаргахад туслах найдвартай түнш юм.",
    siteName: "BichilGlobus",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <head>
        {/* Google Fonts: Montserrat, Open Sans, Poppins – header цэсний фонтод */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Open+Sans:wght@400;800&family=Poppins:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <PageTracker />
        <Header locale={locale} />
        <main className="flex-1 w-full pt-20 lg:pt-24">
          {children}
        </main>
        <Footer locale={locale} />
        <FloatingMenu locale={locale} />
        <AdPopup />
      </body>
    </html>
  );
}
