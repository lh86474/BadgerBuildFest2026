import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "../components/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PHASE | Because every phase is different",
  description:
    "A calm space to explore your health history, one day at a time.",
  icons: {
    icon: [
      { url: "/phase_icon/favicon.ico" },
      { url: "/phase_icon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/phase_icon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/phase_icon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/phase_icon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/phase_icon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/phase_icon/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <AppShell>{children}</AppShell>
        </ClerkProvider>
      </body>
    </html>
  );
}