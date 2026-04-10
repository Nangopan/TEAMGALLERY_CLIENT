"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
// Added Tag icon
import { Trash2, ExternalLink, User, Globe, LayoutGrid, Filter, X, Loader2, Tag,ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ImageCard = ({ img, currentUserId, onDelete }: { img: any, currentUserId: string, onDelete: (id: string) => void }) => {
  const isOwner = img.uploaded_by === currentUserId;

  return (
    <Card className="overflow-hidden group relative rounded-2xl border-zinc-100 transition-all hover:shadow-lg">
      <CardContent className="p-0 aspect-square relative">
        <img 
          src={img.url} 
          alt="Vault item" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-4">
          <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
            <User size={10} /> {img.user?.name || "Team Member"}
          </p>
          <div className="flex gap-2">
            <a href={img.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="secondary" size="sm" className="w-full rounded-lg text-xs font-bold">
                <ExternalLink className="h-3 w-3 mr-1" /> View
              </Button>
            </a>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="rounded-lg">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2rem]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                    <AlertDialogDescription>This file will be removed from the cloud and database.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(img.id)} className="bg-red-600 rounded-xl">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState([]);
  const [members, setMembers] = useState([]);
  const [filterUserId, setFilterUserId] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const dashboardPath = session?.user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";


  const fetchGalleryData = async () => {
    if (!session?.user?.token) return;
    setLoading(true);
    try {
      const [imgRes, memRes] = await Promise.all([
        fetch("http://localhost:4000/api/images", {
          headers: { Authorization: `Bearer ${session.token || session.user.token}` }
        }),
        fetch("http://localhost:4000/api/images/members", {
          headers: { Authorization: `Bearer ${session.token || session.user.token}` }
        })
      ]);

      if (imgRes.ok) {
        const imgData = await imgRes.json();
        setImages(imgData.images || []);
      }
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData.filter((m: any) => m.role === 'user' || !m.role));
      }
    } catch (error) {
      toast.error("Network error: Could not load vault.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchGalleryData();
    }
  }, [status, session]);

  const myImages = useMemo(() => 
    images.filter((img: any) => img.uploaded_by === session?.user?.id), 
  [images, session]);

  // 🟢 NEW: Filter images where the current user's ID exists in the tags array
  const taggedImages = useMemo(() => 
    images.filter((img: any) => img.tags && img.tags.includes(session?.user?.id)),
  [images, session]);

  const teamImages = useMemo(() => {
    if (filterUserId === "all") return images;
    return images.filter((img: any) => 
      img.uploaded_by === filterUserId || (img.tags && img.tags.includes(filterUserId))
    );
  }, [images, filterUserId]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/images/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.user?.token}` }
      });
      if (res.ok) {
        toast.success("Image deleted.");
        setImages(prev => prev.filter(img => img.id !== id));
      }
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  if (loading && status !== "unauthenticated") {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin text-violet-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Link 
        href={dashboardPath} 
        className="flex items-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors w-fit font-bold text-sm uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">Vault Gallery</h1>
        <p className="text-muted-foreground text-sm">Organizational assets and team contributions.</p>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <TabsList className="bg-zinc-100 p-1 rounded-xl h-11 w-fit border shadow-inner">
            <TabsTrigger value="all" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm">
              <Globe className="w-4 h-4 mr-2" /> Team Photos
            </TabsTrigger>
            {/* 🟢 NEW TRIGGER: Tagged Photos */}
            <TabsTrigger value="tagged" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm">
              <Tag className="w-4 h-4 mr-2" /> Tagged
            </TabsTrigger>
            <TabsTrigger value="mine" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm">
              <User className="w-4 h-4 mr-2" /> My Uploads
            </TabsTrigger>
          </TabsList>
          
          {/* Conditional Filter - Only show on "All" tab */}
          {activeTab === "all" && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-xl shadow-sm">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <select 
                  className="bg-transparent text-xs font-bold text-zinc-600 outline-none cursor-pointer pr-2"
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                >
                  <option value="all">Filter by Member</option>
                  {members.map((member: any) => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
                {filterUserId !== "all" && (
                  <button onClick={() => setFilterUserId("all")} className="hover:bg-zinc-100 p-0.5 rounded-md transition-colors">
                    <X className="w-3 h-3 text-zinc-500" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <TabsContent value="all" className="mt-0 outline-none">
          {teamImages.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed rounded-[3rem] text-zinc-400 bg-zinc-50/30">
              <p className="font-medium">No results found in the organizational vault.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {teamImages.map((img: any) => (
                <ImageCard key={img.id} img={img} currentUserId={session?.user?.id} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 🟢 NEW CONTENT: Tagged Photos */}
        <TabsContent value="tagged" className="mt-0 outline-none">
          {taggedImages.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-zinc-50/30 text-zinc-400">
              <p className="font-medium">You haven't been tagged in any photos yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {taggedImages.map((img: any) => (
                <ImageCard key={img.id} img={img} currentUserId={session?.user?.id} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-0 outline-none">
          {myImages.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-zinc-50/50">
              <LayoutGrid className="mx-auto mb-4 text-zinc-200" size={48} />
              <p className="text-zinc-500 font-bold">You haven't contributed any assets yet.</p>
              <Button asChild variant="link" className="text-violet-600 mt-2 font-bold">
                <Link href="/user/upload">Go to Upload Page</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {myImages.map((img: any) => (
                <ImageCard key={img.id} img={img} currentUserId={session?.user?.id} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}