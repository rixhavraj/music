import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { PlayerShell } from "@/features/player/player-shell";
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
            
            {/* Main content wrapper */}
            <div className="flex-1 relative flex flex-col min-w-0">
              <main className="flex-1 bg-brand-surface md:rounded-3xl overflow-y-auto scrollbar-hide md:border md:border-white/5 relative pb-36 md:pb-24">
                {children}
              </main>
              
              {/* Bottom player positioned within main content area */}
              <PlayerShell />
            </div>
            
            {/* Right sidebar — desktop only */}
            <RightSidebar />
          </div>
          
          {/* Mobile bottom nav — visible on mobile only */}
          <MobileBottomNav />
          
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
