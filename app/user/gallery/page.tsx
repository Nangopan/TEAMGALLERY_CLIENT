"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function GalleryPage() {
  const { data: session } = useSession();
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (session?.user) fetchImages();
  }, [session]);

  const fetchImages = async () => {
    const res = await fetch("http://localhost:4000/api/images", {
      headers: { "Authorization": `Bearer ${session?.user?.token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setImages(data.images);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/images/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session?.user?.accessToken}` }
      });

      if (res.ok) {
        toast.success("Image deleted successfully");
        setImages(images.filter((img: any) => img.id !== id)); // Remove from UI instantly
      } else {
        toast.error("Failed to delete image");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Personal Gallery</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img: any) => (
          <Card key={img.id} className="overflow-hidden group relative">
            <CardContent className="p-0">
              <img 
                src={img.url} 
                alt="Gallery item" 
                className="aspect-square object-cover w-full group-hover:scale-105 transition-transform duration-300" 
              />
              
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-xs font-medium mb-2">
                  Uploaded by {img.user?.name || "Unknown"}
                </p>
                
                <div className="flex gap-2">
                  {/* 1. View Full Button (Safe Link) */}
                  <a href={img.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-1" /> View
                    </Button>
                  </a>

                  {/* 2. Delete Button with ShadCN Alert */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove the image from S3 and our database. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(img.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-lg">
          No images found. Head over to the Upload page to start your gallery!
        </div>
      )}
    </div>
  );
}