"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, UserPlus } from "lucide-react";

export default function UploadPage() {
  const { data: session } = useSession();
  
  // States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [members, setMembers] = useState([]);
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({ used: 0, quota: 5 });

  // Fetch Org Members & Quota on Load
  useEffect(() => {
    if (!session?.user?.accessToken) return;

    // Fetch teammates for tagging
    fetch("http://localhost:4000/api/images/members", {
      headers: { "Authorization": `Bearer ${session.user.token}` }
    }).then(res => res.json()).then(setMembers);

    // Fetch current quota status
    fetch("http://localhost:4000/api/images", {
      headers: { "Authorization": `Bearer ${session.user.token}` }
    }).then(res => res.json()).then(data => setStats({ used: data.used, quota: data.quota }));
  }, [session]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
      const remainingSlots = stats.quota - stats.used;

      if (selectedFiles.length + filesArray.length > remainingSlots) {
        toast.error(`Quota limit! You only have ${remainingSlots} slots left.`);
        return;
      }

      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      // 1. Get Presigned URLs
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

      // 2. Upload to S3
      await Promise.all(presignedData.map(async (item: any, i: number) => {
        await fetch(item.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": selectedFiles[i].type },
          body: selectedFiles[i],
        });
      }));

      // 3. Save to DB with Tagged Users
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
      // Refresh local quota
      setStats(prev => ({ ...prev, used: prev.used + selectedFiles.length }));
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Images</h1>
        <p className="text-muted-foreground">Add new photos to your organization's vault.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Selection & Tagging */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Tag Members
                </label>
                <select 
                  multiple 
                  className="w-full border rounded-md p-2 h-40 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={taggedUsers}
                  onChange={(e) => setTaggedUsers(Array.from(e.target.selectedOptions, o => o.value))}
                >
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id} className="p-1">{m.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground italic">Hold Ctrl (Cmd) to select multiple members.</p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleUpload} 
                disabled={selectedFiles.length === 0 || isUploading}
              >
                {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} Images`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: The Preview Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div 
            className="border-2 border-dashed rounded-xl p-12 text-center hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer relative"
          >
            <input 
              type="file" 
              multiple 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={handleFileChange} 
              accept="image/*" 
            />
            <UploadCloud className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Click to browse or drag and drop</h3>
            <p className="text-sm text-gray-500">PNG, JPG, or JPEG (Max remaining: {stats.quota - stats.used})</p>
          </div>

          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-lg border bg-white overflow-hidden group shadow-sm">
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