"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // For nice success/error popups
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditOrganisation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session ,status} = useSession();
  
  // Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Fetch the existing data
useEffect(() => {
  // 1. Wait for NextAuth to finish loading the session
  if (status === "loading") return; 

  // 2. If loaded, but no token is found, stop loading and show an error
  if (!session?.user?.token) {
    toast.error("Session token missing. Check NextAuth configuration.");
    setLoading(false);
    return;
  }

  async function fetchOrg() {
    try {
      const res = await fetch(`http://localhost:4000/api/organisations/${id}`, {
        headers: {
          Authorization: `Bearer ${session.user.token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
      } else {
        toast.error("Failed to load organization data");
      }
    } catch (error) {
      toast.error("Backend not reachable. Is the Express server running?");
    } finally {
      // 3. Guarantee that loading is turned off, even if it fails
      setLoading(false);
    }
  }

  fetchOrg();
}, [id, session, status]);

  // 2. Submit the Updates
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`http://localhost:4000/api/organisations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({
          name,
          address,
          phone,
          // logo_url: logoUrl -> If you add logo editing later, include it here
        }),
      });

      if (res.ok) {
        toast.success("Organization updated successfully!");
        router.push("/po/dashboard"); // Send them back to the table
        router.refresh(); // Force Next.js to re-fetch the table data
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update");
      }
    } catch (error) {
      toast.error("A network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      
      {/* Back Button */}
      <Link href="/po/dashboard" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8 text-zinc-900 tracking-tight">Edit organisation's name</h1>
      
      <form onSubmit={handleUpdate} className="space-y-6 p-8 bg-white border border-violet-100 rounded-[2rem] shadow-sm">
        
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-bold text-zinc-700 ml-1">Organisation Name</Label>
          <Input 
            id="name"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required
            className="h-12 rounded-xl border-violet-100 bg-zinc-50/50 focus-visible:ring-violet-500/20"
          />
        </div>

        {/* Address Field */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-bold text-zinc-700 ml-1">Address</Label>
          <Input 
            id="address"
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            className="h-12 rounded-xl border-violet-100 bg-zinc-50/50 focus-visible:ring-violet-500/20"
          />
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-bold text-zinc-700 ml-1">Contact Phone</Label>
          <Input 
            id="phone"
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
            className="h-12 rounded-xl border-violet-100 bg-zinc-50/50 focus-visible:ring-violet-500/20"
          />
        </div>
        
        {/* Submit Button */}
        <Button 
          type="submit" 
          disabled={saving}
          className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </form>
    </div>
  );
}