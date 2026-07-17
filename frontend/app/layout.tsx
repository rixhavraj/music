import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/app/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { BottomPlayer } from "@/components/layout/BottomPlayer";
const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "Personal Music PWA",
  description: "A fast personal music streaming PWA scaffold.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Music PWA",
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
      <body className={`${inter.className} h-screen w-full flex flex-col overflow-hidden bg-brand-dark p-2 gap-2`}>
        <Providers>
          {/* Main 3-column area */}
          <div className="flex-1 flex min-h-0 gap-2 overflow-hidden">
            <LeftSidebar />
            
            <main className="flex-1 bg-brand-surface rounded-3xl overflow-y-auto scrollbar-hide border border-white/5 relative">
              {children}
            </main>
            
            <RightSidebar />
          </div>
          
          {/* Bottom Player */}
          <BottomPlayer />
          
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
