"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Maximize2, User, ArrowLeft, Trash2, Loader2, Filter } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminGallery() {
  const { data: session } = useSession();
  const [images, setImages] = useState([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [members, setMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [loading, setLoading] = useState(true);

  const dashboardPath = session?.user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";

  useEffect(() => {
    if (session?.user?.token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images/members`, {
        headers: { "Authorization": `Bearer ${session.user.token}` }
      })
      .then(res => res.json())
      .then(setMembers);
    }
  }, [session]);

  const fetchImages = () => {
    if (!session?.user?.token) return;
    setLoading(true);
    
    const queryParam = selectedUser !== "all" ? `?uploaderId=${selectedUser}` : "";
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images${queryParam}`, {
      headers: { "Authorization": `Bearer ${session.user.token}` }
    })
    .then(res => res.json())
    .then(data => {
      setImages(data.images || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchImages();
  }, [session, selectedUser]);

  const handleDelete = async (imageId: string) => {
    setIsDeleting(imageId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images/${imageId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session?.user?.token}` }
      });

      if (res.ok) {
        toast.success("Image removed from vault");
        setImages(prev => prev.filter((img: any) => img.id !== imageId));
      } else {
        toast.error("Failed to delete image");
      }
    } catch (err) {
      toast.error("Network error occurred");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Link 
            href={dashboardPath} 
            className="flex items-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors w-fit font-bold text-sm uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Organization Gallery</h1>
        </div>

        {/* 🟢 FILTER DROPDOWN */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-violet-100 shadow-sm">
          <Filter className="w-4 h-4 text-violet-600 ml-2" />
          <select 
            className="bg-transparent text-sm font-bold outline-none pr-4 cursor-pointer text-zinc-700"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="all">All Team Members</option>
            {/* 🟢 THE FIX: Filter out the Admin by ID and remove the "(Me)" label */}
            {members
              .filter((m: any) => m.id !== session?.user?.id) 
              .map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-violet-600" /></div>
      ) : images.length === 0 ? (
        <div className="text-center p-20 border-2 border-dashed rounded-[3rem] text-zinc-400 font-medium">
          No images found for this selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img: any) => (
            <Card key={img.id} className="overflow-hidden group relative rounded-3xl border-violet-100 transition-all hover:shadow-xl">
              <CardContent className="p-0 aspect-square relative">
                <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4 gap-2">
                  
                  {session?.user?.role === 'admin' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="absolute top-4 right-4 rounded-full h-9 w-9 shadow-lg">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2rem]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the photo from the organization's S3 storage and database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(img.id)}
                            className="bg-red-600 hover:bg-red-700 rounded-xl"
                          >
                            {isDeleting === img.id ? <Loader2 className="animate-spin h-4 w-4" /> : "Delete Permanently"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                    <User className="w-3 h-3" /> {img.user?.name || "Member"}
                  </div>
                  
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
      )}
    </div>
  );
}