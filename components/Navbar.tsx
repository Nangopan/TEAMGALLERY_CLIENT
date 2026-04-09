"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  GalleryVerticalEnd
} from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  // Medium Contrast Badge (Semi-transparent)
  const getRoleBadge = (role: string) => {
    return "bg-white/20 text-white border-white/30 backdrop-blur-sm";
  };

  if (!session) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-violet-500 via-indigo-500 to-violet-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left: Branding */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-white p-1.5 rounded-lg transition-transform group-hover:scale-105">
              <GalleryVerticalEnd className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">TeamGallery</span>
          </Link>

          {/* Right: User Info & Actions */}
          <div className="flex items-center gap-6">
            
            {/* Unified Identity - Role rendered ONCE here */}
            <div className="hidden md:flex items-center gap-3 border-r border-white/20 pr-6">
              {/* <span className="text-sm font-semibold text-white/90">
                {user?.name || "Member"}
              </span> */}
              <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(user?.role)}`}>
                {user?.role?.replace("_", " ")}
              </div>
            </div>

            {/* Logout */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/90 hover:bg-white/10 hover:text-white transition-colors"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline font-medium text-xs uppercase tracking-widest">Logout</span>
            </Button>
          </div>

        </div>
      </div>
    </nav>
  );
}