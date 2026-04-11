"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Image as ImageIcon, ChevronRight, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import ChangePasswordModal from "@/components/ChangePasswordModal"; // Import the modal
import { Lock } from "lucide-react";

export default function UserMainDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({ used: 0, quota: 5 });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    async function fetchStats() {
      try {
        // 🟢 FIX: Added a timestamp to the URL to prevent browser caching
        const res = await fetch(`http://localhost:4000/api/images?t=${Date.now()}`, {
          headers: { 
            "Authorization": `Bearer ${session?.user?.token}`,
            "Cache-Control": "no-cache" // Force fresh data
          }
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Dashboard Data Received:", data); // 🔍 Debug: Check your console!

          // 🟢 FIX: Fallback calculation if data.used is undefined
          const usedCount = data.used !== undefined ? data.used : (data.images?.length || 0);
          const quotaLimit = data.quota || 5;

          setStats({ 
            used: usedCount, 
            quota: quotaLimit 
          });
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setFetching(false);
      }
    }

    if (session?.user?.token) {
      fetchStats();
    } else if (status === "unauthenticated") {
      setFetching(false);
    }
  }, [session, status]);

  const percentage = Math.min((stats.used / stats.quota) * 100, 100);
 const strokeDasharray = 502.6; 
const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;
  if (status === "loading" || fetching) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Vault Dashboard</h1>
        <p className="text-zinc-500 font-medium">Welcome back, {session?.user?.name}</p>
      </div>

      {/* Main Quota Section (Radial) */}
      <Card className="rounded-[3rem] border-none bg-white shadow-xl shadow-violet-100/50 overflow-hidden">
        <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          
          {/* Circular Progress Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle
                cx="96" cy="96" r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-zinc-100"
              />
              <circle
                cx="96" cy="96" r="80"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={strokeDasharray}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                strokeLinecap="round"
                className="text-violet-600"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-black text-zinc-900">{stats.used}</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">of {stats.quota} used</span>
            </div>
          </div>

          {/* Quota Details */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">Storage Capacity</h2>
              <p className="text-zinc-500 mt-1">Your organization has allocated you {stats.quota} slots for high-resolution images.</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="bg-zinc-50 px-4 py-2 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Available</p>
                <p className="text-lg font-bold text-zinc-700">{stats.quota - stats.used} Slots</p>
              </div>
              <div className="bg-zinc-50 px-4 py-2 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Usage</p>
                <p className="text-lg font-bold text-violet-600">{Math.round(percentage)}% Full</p>
              </div>
            </div>

            <Button asChild className="w-full md:w-auto rounded-2xl bg-violet-600 hover:bg-violet-700 h-12 px-8 shadow-lg shadow-violet-200">
              <Link href="/user/payments" className="gap-2">
                <Zap className="w-4 h-4 fill-white" /> Upgrade Storage
              </Link>
            </Button>

            <ChangePasswordModal>
    <Button variant="outline" className="w-full md:w-auto rounded-2xl border-zinc-200 text-zinc-500 h-12 px-8 hover:bg-zinc-50 transition-all">
      <Lock className="w-4 h-4 mr-2" /> Change Password
    </Button>
  </ChangePasswordModal>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/user/upload" className="group">
          <Card className="rounded-[2.5rem] border-2 border-transparent group-hover:border-violet-100 group-hover:bg-violet-50/30 transition-all duration-300">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-violet-600 p-4 rounded-3xl shadow-lg shadow-violet-200 text-white">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Upload Content</h3>
                  <p className="text-sm text-zinc-500">Add new photos to the vault</p>
                </div>
              </div>
              <div className="bg-zinc-100 p-2 rounded-full group-hover:bg-violet-600 group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/user/gallery" className="group">
          <Card className="rounded-[2.5rem] border-2 border-transparent group-hover:border-violet-100 group-hover:bg-violet-50/30 transition-all duration-300">
            <CardContent className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="bg-zinc-900 p-4 rounded-3xl shadow-lg shadow-zinc-200 text-white">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">Browse Vault</h3>
                  <p className="text-sm text-zinc-500">View team and personal gallery</p>
                </div>
              </div>
              <div className="bg-zinc-100 p-2 rounded-full group-hover:bg-violet-600 group-hover:text-white transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}