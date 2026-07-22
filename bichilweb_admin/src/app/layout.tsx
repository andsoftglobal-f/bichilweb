import type { Metadata } from "next";
import { Inter, Montserrat, Open_Sans, Poppins } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AdminSettingsProvider } from '@/contexts/AdminSettingsContext'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Self-hosted via next/font instead of a raw <link> to Google Fonts —
// avoids the extra render-blocking request and layout shift, and content
// blocks can still set `font-family: 'Montserrat'` etc. by name since
// next/font registers the real @font-face under its real family name.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  weight: ["400", "700", "900"],
  subsets: ["latin", "cyrillic"],
});
const openSans = Open_Sans({
  variable: "--font-open-sans",
  weight: ["400", "800"],
  subsets: ["latin", "cyrillic"],
});
const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Panel | Bichil Globus",
  description: "Bichil Globus вэбсайтын удирдлагын самбар",
  icons: {
    icon: '/browser-logo.png',
    shortcut: '/browser-logo.png',
    apple: '/browser-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`${inter.variable} ${montserrat.variable} ${openSans.variable} ${poppins.variable} antialiased bg-gray-50`}>
        <AuthProvider>
          <LanguageProvider>
            <AdminSettingsProvider>
              {children}
            </AdminSettingsProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
