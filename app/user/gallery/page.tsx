"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GalleryPage() {
  const { data: session } = useSession();
  const [images, setImages] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (session?.user) fetchImages();
  }, [session, filter]);

  const fetchImages = async () => {
    const url = filter 
      ? `http://localhost:4000/api/images?tag=${filter}` 
      : "http://localhost:4000/api/images";
      
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${session?.user?.accessToken}` }
    });
    const data = await res.json();
    setImages(data.images);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Organization Gallery</h1>
          <p className="text-muted-foreground">Browse all images uploaded by your team.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by tag..." 
            className="pl-8" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">No images found.</div>
        ) : (
          images.map((img: any) => (
            <Card key={img.id} className="overflow-hidden group relative border-none shadow-md">
              <img src={img.url} alt="Vault" className="aspect-square object-cover w-full transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-xs font-medium">Uploaded by {img.uploader.name}</p>
                <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={() => window.open(img.url, '_blank')}>
                  <Eye className="h-4 w-4 mr-2" /> View Full
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}