import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { Header } from "@/components/Header";
import LiveSystem from "@/components/system/LiveSystem";
import { site, contacts } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  keywords: [...site.keywords],
  // Адреса СТРАНИЦЫ — со слэшем: GH Pages отдаёт /slk-labs-v7 301-редиректом на /slk-labs-v7/.
  alternates: { canonical: `${site.url}/` },
  openGraph: {
    type: "website",
    locale: site.locale,
    url: `${site.url}/`,
    siteName: site.name,
    title: site.title,
    description: site.payoff,
    images: [{ url: `${site.url}/og.png`, width: 1200, height: 630, alt: site.title }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.payoff,
    images: [`${site.url}/og.png`],
  },
};

export const viewport: Viewport = { themeColor: site.themeColor };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-ink focus:px-4 focus:py-3 focus:font-mono focus:text-label focus:text-[var(--color-ink-fg)]"
        >
          Перейти к содержанию
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: site.name,
              url: `${site.url}/`,
              description: site.description,
              email: contacts.email,
              sameAs: [contacts.telegram.href],
            }),
          }}
        />
        {/* Живая система — нервная сеть всей страницы, фиксированный слой за контентом */}
        <LiveSystem />
        <Header />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
