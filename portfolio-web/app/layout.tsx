import type { Metadata } from "next";
import { Newsreader, JetBrains_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Axror — Full-Stack Engineer",
    template: "%s · Axror",
  },
  description:
    "Full-stack engineer — TypeScript, Node, React, Go. Field notes from real work: weekly logs, deep dives, and shipped projects.",
  openGraph: {
    title: "Axror — Full-Stack Engineer",
    description:
      "Full-stack engineer — TypeScript, Node, React, Go, and a lot of maps. Field notes from real work.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Axror — Full-Stack Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Axror — Full-Stack Engineer",
    description:
      "Full-stack engineer — TypeScript, Node, React, Go, and a lot of maps.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${serif.variable} ${mono.variable} ${sans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
