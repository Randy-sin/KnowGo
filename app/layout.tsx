import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KnowGo",
  description: "Your AI learning companion. Ask anything, learn everything.",
  keywords: ["AI", "learning", "education", "knowledge", "artificial intelligence"],
  authors: [{ name: "KnowGo" }],
  creator: "KnowGo",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://knowgo.ai",
    title: "KnowGo",
    description: "Your AI learning companion. Ask anything, learn everything.",
    siteName: "KnowGo",
  },
  twitter: {
    card: "summary_large_image",
    title: "KnowGo",
    description: "Your AI learning companion. Ask anything, learn everything.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
