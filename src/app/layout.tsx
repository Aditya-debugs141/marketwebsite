import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThreeBackgroundWrapper } from "@/components/ThreeBackgroundWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Indian Markets Pulse - Real-time Intelligence",
  description: "AI-powered Indian stock market news with real-time prices, FII/DII tracking, and institutional analysis.",
};

import { Sidebar } from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#050505] text-white`}
      >
        <ThreeBackgroundWrapper />
        <div className="flex bg-[#0A0A0A]/50 min-h-screen">
          <Sidebar />
          <div className="flex-1 pl-20 relative w-full overflow-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
