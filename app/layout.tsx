import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LedgerProvider } from "@/lib/store";
import Nav from "@/components/Nav";
import Aura from "@/components/Aura";
import SW from "@/components/SW";

export const metadata: Metadata = {
  title: "Aura — soft money ledger",
  description: "A quiet, beautiful way to track where the money goes.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Aura",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Aura />
        <LedgerProvider>
          <div className="shell">{children}</div>
          <Nav />
          <SW />
        </LedgerProvider>
      </body>
    </html>
  );
}
