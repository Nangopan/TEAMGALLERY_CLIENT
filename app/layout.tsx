import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./provider";
import { Toaster } from "@/components/ui/sonner";
import Navbar from "@/components/Navbar"; // 1. Import Navbar
import Footer from "@/components/Footer"; // 2. Import Footer
import PushSubscriptionManager from "@/components/PushSubscriptionManager";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeamGallery | Internal Asset Management",
  description: "Secure organizational image repository and gallery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
        <Providers>
          {/* 3. Navbar appears at the very top */}
          <PushSubscriptionManager />
          <Navbar />

          {/* 4. Main wrapper with flex-grow pushes footer down */}
          <main className="flex-grow w-full">
            {children}
          </main>

          {/* 5. Footer appears at the very bottom */}
          <Footer />
        </Providers>

        {/* Feedback & Scripts */}
        <Toaster position="top-center" richColors />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </body>
    </html>
  );
}