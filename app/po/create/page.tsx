"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UploadCloud, Loader2, Copy, CheckCircle2 } from "lucide-react";
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

  // Modal & Credential State
  const [showModal, setShowModal] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  // Form State
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalLogoUrl = null;

      // 1. S3 Upload Logic
      if (file) {
        const preRes = await fetch("http://localhost:4000/api/organisations/presign", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${session?.user?.token}` 
          },
          body: JSON.stringify({ fileName: file.name, fileType: file.type })
        });
        const { uploadUrl, url } = await preRes.json();
        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        finalLogoUrl = url;
      }

      // 2. Create Org
      const orgRes = await fetch("http://localhost:4000/api/organisations", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${session?.user?.token}` 
        },
        body: JSON.stringify({ ...formData, logo_url: finalLogoUrl })
      });

      if (!orgRes.ok) throw new Error(await orgRes.text());

      const data = await orgRes.json();

      // 3. Show Success Modal
      setCredentials({ email: formData.adminEmail, password: data.tempPassword });
      setShowModal(true);

    } catch (err: any) {
      console.error("Creation Error:", err);
      toast.error("Failed to create organization.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* SUCCESS MODAL */}
      <Dialog open={showModal} onOpenChange={(open) => {
        if (!open) router.push("/po/dashboard");
        setShowModal(open);
      }}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="bg-green-100 p-3 rounded-full mb-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-bold">Workspace Deployed!</DialogTitle>
            <DialogDescription>
              Please save these credentials securely.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-zinc-400">Admin Email</Label>
                <div className="flex items-center justify-between font-mono text-sm bg-white p-2 rounded-lg border mt-1">
                  <span>{credentials.email}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(credentials.email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-zinc-400">Temp Password</Label>
                <div className="flex items-center justify-between font-mono text-sm bg-white p-2 rounded-lg border mt-1">
                  <span className="text-violet-600 font-bold">{credentials.password}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(credentials.password)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full bg-violet-600 rounded-xl" onClick={() => router.push("/po/dashboard")}>
              I have saved the credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MAIN FORM */}
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
                  <Input required placeholder="Acme Corp" onChange={e => setFormData({...formData, name: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input placeholder="+1 555-0100" onChange={e => setFormData({...formData, phone: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>HQ Address</Label>
                  <Input placeholder="123 Tech Lane" onChange={e => setFormData({...formData, address: e.target.value})} className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Organization Logo</Label>
                <div className="flex items-center gap-4">
                  {preview ? (
                    <img src={preview} alt="preview" className="h-20 w-20 rounded-lg object-cover border-2 shadow-sm" />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-gray-50 border-2 border-dashed flex items-center justify-center text-gray-400">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs rounded-xl" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">2. Initial Admin Account</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Admin Full Name *</Label>
                  <Input required placeholder="Jane Doe" onChange={e => setFormData({...formData, adminName: e.target.value})} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Admin Email *</Label>
                  <Input required type="email" placeholder="jane@acmecorp.com" onChange={e => setFormData({...formData, adminEmail: e.target.value})} className="rounded-xl" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-violet-600 rounded-xl" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Deploy Organization Workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}