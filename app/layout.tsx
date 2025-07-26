import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { LanguageProvider } from "@/lib/language-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Xknow",
  description: "Your AI learning companion. Ask anything, learn everything.",
  keywords: ["AI", "learning", "education", "knowledge", "artificial intelligence"],
  authors: [{ name: "Xknow" }],
  creator: "Xknow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://xknow.ai",
    title: "Xknow",
    description: "Your AI learning companion. Ask anything, learn everything.",
    siteName: "Xknow",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xknow",
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
      <html lang="en">
        <body className={`${inter.variable} font-sans antialiased`}>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
