import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import { TextureOverlay } from "@/components/TextureOverlay";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pocket.xyz"),
  title: "Pocket — Your growth team, in your pocket",
  description:
    "The on-chain marketplace where startups hire vetted growth talent — and every payment is guaranteed by escrow on Stellar.",
  keywords: [
    "Pocket",
    "startup marketplace",
    "growth specialists",
    "Stellar",
    "escrow",
    "freelance",
  ],
  openGraph: {
    title: "Pocket — Your growth team, in your pocket",
    description:
      "The on-chain marketplace where startups hire vetted growth talent — and every payment is guaranteed.",
    url: "https://pocket.xyz",
    siteName: "Pocket",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pocket — Talent, payments and trust. All in your pocket.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pocket — Your growth team, in your pocket",
    description:
      "The on-chain marketplace where startups hire vetted growth talent — and every payment is guaranteed.",
    images: ["/assets/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/assets/favicon.png", type: "image/png" },
      { url: "/assets/placeholders/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/assets/favicon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="h-full">
        <TextureOverlay />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
