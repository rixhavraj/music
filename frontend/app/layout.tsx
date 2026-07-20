import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { BottomPlayer } from "@/components/layout/BottomPlayer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Lofiëra — Your vibe, your music",
  description: "A fast personal music streaming PWA with mood-based discovery.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Lofiëra",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#101418",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-screen w-full flex flex-col overflow-hidden bg-brand-dark md:p-2 md:gap-2`}>
        <Providers>
          {/* Main layout area */}
          <div className="flex-1 flex min-h-0 md:gap-2 overflow-hidden">
            {/* Left sidebar — hidden on mobile, visible on tablet+ */}
            <LeftSidebar />
            
            {/* Main content — full width on mobile, flex-1 on tablet+ */}
            <main className="flex-1 bg-brand-surface md:rounded-3xl overflow-y-auto scrollbar-hide md:border md:border-white/5 relative pb-36 md:pb-10">
              {children}
            </main>
            
            {/* Right sidebar — desktop only */}
            <RightSidebar />
          </div>
          
          {/* Desktop bottom player — hidden on mobile */}
          <BottomPlayer />
          
          {/* Mobile bottom nav — visible on mobile only */}
          <MobileBottomNav />
          
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
