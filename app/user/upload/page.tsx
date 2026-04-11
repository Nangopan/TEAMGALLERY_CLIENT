"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, UserPlus, ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [members, setMembers] = useState([]);
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({ used: 0, quota: 5 });
  const [fileError, setFileError] = useState("");

  const dashboardPath = session?.user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";

  useEffect(() => {
    if (!session?.user?.token) return;

    fetch("http://localhost:4000/api/images/members", {
      headers: { "Authorization": `Bearer ${session.user.token}` }
    }).then(res => res.json()).then(setMembers);

    fetch("http://localhost:4000/api/images", {
      headers: { "Authorization": `Bearer ${session.user.token}` }
    }).then(res => res.json()).then(data => setStats({ used: data.used, quota: data.quota }));
  }, [session]);

  // 🟢 NEW: Toggle function for selecting/deselecting users
  const handleUserToggle = (userId: string) => {
    setTaggedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    if (e.target.files) {
      const rawFiles = Array.from(e.target.files);
      const invalidFiles = rawFiles.filter(f => !f.type.startsWith("image/"));
      const validImages = rawFiles.filter(f => f.type.startsWith("image/"));

      if (invalidFiles.length > 0) {
        setFileError("Only image files (PNG, JPG, JPEG) are permitted.");
        return; 
      }

      const remainingSlots = stats.quota - stats.used;
      if (selectedFiles.length + validImages.length > remainingSlots) {
        toast.error(`Quota limit! You only have ${remainingSlots} slots left.`);
        return;
      }

      setSelectedFiles(prev => [...prev, ...validImages]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) setFileError("");
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      const fileData = selectedFiles.map(f => ({ name: f.name, type: f.type }));
      const presignRes = await fetch("http://localhost:4000/api/images/presign", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.user?.token}` 
        },
        body: JSON.stringify({ files: fileData })
      });
      const presignedData = await presignRes.json();

      await Promise.all(presignedData.map(async (item: any, i: number) => {
        await fetch(item.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": selectedFiles[i].type },
          body: selectedFiles[i],
        });
      }));

      await fetch("http://localhost:4000/api/images", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.user?.token}`
        },
        body: JSON.stringify({ 
          uploadedUrls: presignedData.map((d: any) => d.url),
          taggedUserIds: taggedUsers 
        }),
      });

      toast.success("Images uploaded and team notified!");
      setSelectedFiles([]);
      setTaggedUsers([]);
      router.refresh();
      setStats(prev => ({ ...prev, used: prev.used + selectedFiles.length }));
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link 
        href={dashboardPath} 
        className="flex items-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors w-fit font-bold text-sm uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Images</h1>
        <p className="text-muted-foreground">Add new photos to your organization's vault.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2rem] border-violet-100 shadow-sm">
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-bold flex items-center gap-2 text-zinc-700 uppercase tracking-tighter">
                  <UserPlus className="h-4 w-4" /> Tag Members
                </label>

                {/* 🟢 NEW: Tagged User Badges visible above the filter */}
                {taggedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                    {taggedUsers.map(id => {
                      const member = members.find((m: any) => m.id === id);
                      return (
                        <span key={id} className="flex items-center gap-1 bg-violet-600 text-white pl-2 pr-1 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider animate-in zoom-in-95 duration-200">
                          {member?.name}
                          <button onClick={() => handleUserToggle(id)} className="hover:bg-white/20 rounded-md p-0.5 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* 🟢 NEW: Interactive List instead of native multi-select */}
                <div className="w-full border rounded-xl overflow-hidden bg-zinc-50/50">
                  <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                    {members
                      .filter((m: any) => m.id !== session?.user?.id) // 🟢 Filter out logged-in user
                      .map((m: any) => {
                        const isSelected = taggedUsers.includes(m.id);
                        return (
                          <div 
                            key={m.id}
                            onClick={() => handleUserToggle(m.id)}
                            className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-semibold transition-all ${
                              isSelected 
                                ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                                : 'hover:bg-zinc-100 text-zinc-500'
                            }`}
                          >
                            {m.name}
                            {isSelected && <X className="h-3 w-3" />}
                          </div>
                        );
                      })}
                    {members.length <= 1 && (
                       <p className="p-4 text-center text-[10px] text-zinc-400 font-medium">No other members available.</p>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Click a member to tag/untag them.</p>
              </div>

              <Button 
                className="w-full bg-violet-600 rounded-xl h-11 shadow-lg shadow-violet-100" 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0 || isUploading}
              >
                {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Images`}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div 
            className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center hover:bg-gray-50 transition-all cursor-pointer relative ${fileError ? 'border-red-500 bg-red-50/10' : 'border-gray-200 hover:border-violet-400'}`}
          >
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileChange} 
              accept="image/*" 
            />
            <UploadCloud className={`h-12 w-12 mx-auto mb-4 ${fileError ? 'text-red-400' : 'text-violet-400'}`} />
            <h3 className="text-lg font-medium">Click to browse or drag and drop</h3>
            <p className="text-sm text-gray-500">PNG, JPG, or JPEG (Max remaining: {stats.quota - stats.used})</p>
          </div>
          
          {fileError && (
            <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={12} /> {fileError}
            </p>
          )}

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-3xl border bg-white overflow-hidden group shadow-sm">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="preview" 
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="h-8 w-8 rounded-full" 
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}