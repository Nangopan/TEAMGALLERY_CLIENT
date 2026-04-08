"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { UploadCloud, Image as ImageIcon, X, Loader2, Trash2, Eye } from "lucide-react";

// ShadCN UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// --- PREVIEW SUB-COMPONENT (FOR UPLOADING) ---
function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative aspect-square rounded border overflow-hidden group">
      {preview && <img src={preview} alt="preview" className="object-cover w-full h-full" />}
      <button 
        onClick={onRemove}
        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const [gallery, setGallery] = useState({ images: [], quota: 5, used: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // --- MODAL STATES ---
  const [viewImage, setViewImage] = useState<any>(null); // For the Lightbox
  const [deleteId, setDeleteId] = useState<string | null>(null); // For the Delete Confirmation

  useEffect(() => {
    setIsMounted(true);
    if (session?.user) fetchGallery();
  }, [session]);

  const fetchGallery = async () => {
    const res = await fetch("http://localhost:4000/api/images", {
      headers: { "Authorization": `Bearer ${session?.user?.accessToken}` }
    });
    if (res.ok) {
      setGallery(await res.json());
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(`http://localhost:4000/api/images/${deleteId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.user?.accessToken}` }
    });

    if (res.ok) {
      toast.success("Image permanently removed.");
      fetchGallery();
    } else {
      toast.error("Failed to delete image.");
    }
    setDeleteId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      const remaining = gallery.quota - gallery.used;
      if (filesArray.length > remaining) {
        toast.error(`Quota full. Only ${remaining} slots left.`);
        return;
      }
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    try {
      const fileData = selectedFiles.map(f => ({ name: f.name, type: f.type }));
      const presignRes = await fetch("http://localhost:4000/api/images/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.user?.accessToken}` },
        body: JSON.stringify({ files: fileData })
      });

      const presignedData = await presignRes.json();
      await Promise.all(presignedData.map(async (item: any, index: number) => {
        await fetch(item.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": selectedFiles[index].type },
          body: selectedFiles[index],
        });
      }));

      await fetch("http://localhost:4000/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.user?.accessToken}` },
        body: JSON.stringify({ uploadedUrls: presignedData.map((d: any) => d.url) }),
      });

      toast.success("Vault updated!");
      setSelectedFiles([]);
      fetchGallery();
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold">My Image Vault</h1>
        <p className="text-gray-500">Securely store and preview your private images.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* --- UPLOAD SECTION --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Plan</CardTitle>
              <CardDescription>{gallery.used} / {gallery.quota} images stored</CardDescription>
              <div className="w-full bg-gray-100 h-2 mt-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-700" 
                  style={{ width: `${(gallery.used / gallery.quota) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer group">
                <input type="file" multiple className="hidden" id="file-up" onChange={handleFileChange} accept="image/*" />
                <label htmlFor="file-up" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="h-10 w-10 text-gray-300 group-hover:text-blue-500 transition-colors mb-2" />
                  <span className="text-sm font-semibold">Drop images here</span>
                  <span className="text-xs text-gray-400">JPG or PNG only</span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {selectedFiles.map((file, i) => (
                      <ImagePreview 
                        key={i} 
                        file={file} 
                        onRemove={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} 
                      />
                    ))}
                  </div>
                  <Button className="w-full" onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin mr-2" /> : null}
                    {isUploading ? "Syncing to S3..." : `Upload ${selectedFiles.length} Images`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* --- GALLERY SECTION --- */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Gallery</CardTitle>
            <CardDescription>Click an image to view it full size.</CardDescription>
          </CardHeader>
          <CardContent>
            {gallery.images.length === 0 ? (
              <div className="text-center py-24 text-gray-300">
                 <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                 <p>No files found in your vault.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.images.map((img: any) => (
                  <div key={img.id} className="aspect-square rounded-lg border overflow-hidden relative group bg-gray-50 shadow-sm cursor-pointer">
                    <img src={img.url} alt="Vault" className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                    
                    {/* Action Overlay - Now with better visibility */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button size="icon" variant="secondary" className="rounded-full h-9 w-9" onClick={() => setViewImage(img)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="rounded-full h-9 w-9" onClick={() => setDeleteId(img.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- IMAGE VIEW LIGHTBOX (DIALOG) --- */}
      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-black/90 border-none">
          <DialogHeader className="hidden">
            <DialogTitle>Image View</DialogTitle>
            <DialogDescription>Full size preview</DialogDescription>
          </DialogHeader>
          {viewImage && (
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              <img 
                src={viewImage.url} 
                alt="Full View" 
                className="max-w-full max-h-full object-contain shadow-2xl" 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 text-white hover:bg-white/20" 
                onClick={() => setViewImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION (ALERT DIALOG) --- */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This image will be permanently deleted from our database and AWS S3 storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={executeDelete}>
              Yes, delete image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}