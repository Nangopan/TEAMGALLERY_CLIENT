"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Maximize2, User , ArrowLeft} from "lucide-react";
import Link from "next/link"; // Added Link

export default function AdminGallery() {
  const { data: session } = useSession();
  const [images, setImages] = useState([]);
  const dashboardPath = session?.user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";


  useEffect(() => {
    if (session?.user?.token) {
      fetch("http://localhost:4000/api/images", {
        headers: { "Authorization": `Bearer ${session.user.token}` }
      })
      .then(res => res.json())
      .then(data => setImages(data.images || []));
    }
  }, [session]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <Link 
        href={dashboardPath} 
        className="flex items-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors w-fit font-bold text-sm uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8 tracking-tight">Organization Gallery</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img: any) => (
          <Card key={img.id} className="overflow-hidden group relative rounded-3xl border-violet-100 transition-all hover:shadow-xl">
            <CardContent className="p-0 aspect-square relative">
              <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
                <div className="flex items-center gap-2 text-white/80 text-xs mb-3">
                  <User className="w-3 h-3" /> {img.user?.name || "Member"}
                </div>
                
                {/* POPUP MODAL TRIGGER */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="w-full rounded-xl gap-2 font-bold">
                      <Maximize2 className="w-4 h-4" /> View Full
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <img src={img.url} className="w-full h-auto max-h-[90vh] object-contain rounded-2xl" />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}