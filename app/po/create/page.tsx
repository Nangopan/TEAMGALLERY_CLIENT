"use client";

import Link from "next/link"; 
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadCloud, Loader2, Copy, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CreateOrgPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    adminName: "",
    adminEmail: ""
  });

  // 🟢 Validation States
  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    adminName: "",
    adminEmail: "",
    file: ""
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors(prev => ({ ...prev, file: "" }));
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      
      // 🟢 Image type check
      if (!selected.type.startsWith("image/")) {
        setErrors(prev => ({ ...prev, file: "Please upload an image file (PNG, JPG, etc.)" }));
        return;
      }
      
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🟢 Reset and Validate
    const newErrors = { name: "", phone: "", adminName: "", adminEmail: "", file: "" };
    let hasError = false;

    if (/\d/.test(formData.name)) { newErrors.name = "Organization name cannot contain numbers."; hasError = true; }
    if (!/^\d{10}$/.test(formData.phone)) { newErrors.phone = "Phone number must be exactly 10 digits."; hasError = true; }
    if (/\d/.test(formData.adminName)) { newErrors.adminName = "Admin name cannot contain numbers."; hasError = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) { newErrors.adminEmail = "Please enter a valid email address."; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      let finalLogoUrl = null;
      if (file) {
        const preRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organisations/presign`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${session?.user?.token}` 
          },
          body: JSON.stringify({ fileName: file.name, fileType: file.type })
        });
        if (!preRes.ok) throw new Error("Logo upload initialization failed.");
        const { uploadUrl, url } = await preRes.json();
        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        finalLogoUrl = url;
      }

      const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organisations`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${session?.user?.token}` 
        },
        body: JSON.stringify({ ...formData, logo_url: finalLogoUrl })
      });

      if (!orgRes.ok) {
        const errorData = await orgRes.json();
        throw new Error(errorData.error || "Failed to create organization"); 
      }

      const data = await orgRes.json();
      setCredentials({ email: formData.adminEmail, password: data.tempPassword });
      setShowModal(true);
    } catch (err: any) {
      toast.error(err.message); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/po/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors w-fit font-bold text-sm uppercase tracking-widest mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <Dialog open={showModal} onOpenChange={(open) => !open && router.push("/po/dashboard")}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="bg-green-100 p-3 rounded-full mb-2"><CheckCircle2 className="h-8 w-8 text-green-600" /></div>
            <DialogTitle className="text-2xl font-bold">Workspace Deployed!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-zinc-400">Admin Email</Label>
                <div className="flex items-center justify-between font-mono text-sm bg-white p-2 rounded-lg border mt-1">
                  <span>{credentials.email}</span>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(credentials.email); toast.success("Copied!"); }}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-zinc-400">Temp Password</Label>
                <div className="flex items-center justify-between font-mono text-sm bg-white p-2 rounded-lg border mt-1">
                  <span className="text-violet-600 font-bold">{credentials.password}</span>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(credentials.password); toast.success("Copied!"); }}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter><Button className="w-full bg-violet-600 rounded-xl" onClick={() => router.push("/po/dashboard")}>I have saved the credentials</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="rounded-[2rem] border-violet-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Onboard New Organization</CardTitle>
          <CardDescription>Setup the tenant workspace and generate their initial Admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">1. Organization Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Organization Name *</Label>
                  <Input required placeholder="Acme Corp" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`rounded-xl ${errors.name ? 'border-red-500' : ''}`} />
                  {errors.name && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone (10 Digits)</Label>
                  <Input required placeholder="9876543210" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`rounded-xl ${errors.phone ? 'border-red-500' : ''}`} />
                  {errors.phone && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label>HQ Address</Label>
                  <Input required placeholder="123 Tech Lane" onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label>Organization Logo</Label>
                <div className="flex items-center gap-4">
                  {preview ? <img src={preview} alt="preview" className="h-20 w-20 rounded-lg object-cover border-2 shadow-sm" /> : <div className="h-20 w-20 rounded-lg bg-gray-50 border-2 border-dashed flex items-center justify-center text-gray-400"><UploadCloud className="h-6 w-6" /></div>}
                  <Input type="file" accept="image/*" onChange={handleFileChange} className={`max-w-xs rounded-xl ${errors.file ? 'border-red-500' : ''}`} />
                </div>
                {errors.file && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {errors.file}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">2. Initial Admin Account</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Admin Full Name *</Label>
                  <Input required placeholder="Jane Doe" value={formData.adminName} onChange={e => setFormData({...formData, adminName: e.target.value})} className={`rounded-xl ${errors.adminName ? 'border-red-500' : ''}`} />
                  {errors.adminName && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {errors.adminName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Admin Email *</Label>
                  <Input required type="email" placeholder="jane@acmecorp.com" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} className={`rounded-xl ${errors.adminEmail ? 'border-red-500' : ''}`} />
                  {errors.adminEmail && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {errors.adminEmail}</p>}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-violet-600 rounded-xl" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deploy Organization Workspace"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}