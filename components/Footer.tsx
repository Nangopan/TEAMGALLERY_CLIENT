"use client";

import { useSession } from "next-auth/react";

export default function Footer() {
  const { data: session } = useSession();
  
  if (!session) return null;

  return (
    <footer className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 py-6 text-white/80">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm font-medium">
          &copy; {new Date().getFullYear()} <span className="text-white font-bold">TeamGallery</span>. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
          <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
          <span className="hover:text-white cursor-pointer transition-colors">Support</span>
        </div>
      </div>
    </footer>
  );
}