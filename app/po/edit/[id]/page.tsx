"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EditOrganisation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🟢 Validation States
  const [errors, setErrors] = useState({ name: "", phone: "" });

  useEffect(() => {
    if (status === "loading") return; 
    if (!session?.user?.token) { setLoading(false); return; }

    async function fetchOrg() {
      try {
        const res = await fetch(`http://localhost:4000/api/organisations/${id}`, {
          headers: { Authorization: `Bearer ${session.user.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setName(data.name || "");
          setAddress(data.address || "");
          setPhone(data.phone || "");
        }
      } catch (error) {
        toast.error("Backend not reachable.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [id, session, status]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🟢 Validate
    const newErrors = { name: "", phone: "" };
    let hasError = false;
    if (/\d/.test(name)) { newErrors.name = "Name cannot contain numbers."; hasError = true; }
    if (!/^\d{10}$/.test(phone)) { newErrors.phone = "Phone must be exactly 10 digits."; hasError = true; }

    if (hasError) { setErrors(newErrors); return; }

    setSaving(true);
    try {
      const res = await fetch(`http://localhost:4000/api/organisations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.token}`,
        },
        body: JSON.stringify({ name, address, phone }),
      });

      if (res.ok) {
        toast.success("Organization updated!");
        router.push("/po/dashboard");
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to update");
      }
    } catch (error) {
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <Link href="/po/dashboard" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8 text-zinc-900 tracking-tight">Edit Organization Details</h1>
      
      <form onSubmit={handleUpdate} className="space-y-6 p-8 bg-white border border-violet-100 rounded-[2rem] shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-bold text-zinc-700 ml-1">Organisation Name</Label>
          <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setErrors({...errors, name: ""}) }} className={`h-12 rounded-xl bg-zinc-50/50 ${errors.name ? 'border-red-500' : ''}`} />
          {errors.name && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm font-bold text-zinc-700 ml-1">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 rounded-xl bg-zinc-50/50" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-bold text-zinc-700 ml-1">Contact Phone</Label>
          <Input id="phone" value={phone} onChange={(e) => { setPhone(e.target.value); setErrors({...errors, phone: ""}) }} className={`h-12 rounded-xl bg-zinc-50/50 ${errors.phone ? 'border-red-500' : ''}`} />
          {errors.phone && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {errors.phone}</p>}
        </div>
        
        <Button type="submit" disabled={saving} className="w-full h-12 bg-violet-600 rounded-xl shadow-md transition-all active:scale-[0.98]">
          {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
        </Button>
      </form>
    </div>
  );
}