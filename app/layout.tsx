import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Remind | Mint Every Memory",
  description: "Mint Every Memory — turn your meaningful internet moments into collectible memories on Zora.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "http://localhost:3000"),
  openGraph: {
    title: "Remind | Mint Every Memory",
    description: "Mint Every Memory — turn your meaningful internet moments into collectible memories on Zora.",
    images: [process.env.NEXT_PUBLIC_APP_OG_IMAGE || "/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remind | Mint Every Memory",
    description: "Mint Every Memory — turn your meaningful internet moments into collectible memories on Zora.",
    images: [process.env.NEXT_PUBLIC_APP_OG_IMAGE || "/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-app-background text-app-foreground antialiased">
        <div className="min-h-screen max-w-screen-sm mx-auto px-4 py-2">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
