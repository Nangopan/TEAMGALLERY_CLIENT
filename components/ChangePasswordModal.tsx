"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, ShieldCheck, AlertCircle } from "lucide-react"; // 🟢 Added AlertCircle
import { toast } from "sonner";

export default function ChangePasswordModal({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ currentEmail: "", currentPassword: "", newPassword: "" });

  // 🟢 State for field-specific error messages
  const [errors, setErrors] = useState({
    currentEmail: "",
    currentPassword: "",
    newPassword: "",
  });

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

// Inside ChangePasswordModal.tsx 

const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  setErrors({ currentEmail: "", currentPassword: "", newPassword: "" });
  let hasError = false;
  const newErrors = { currentEmail: "", currentPassword: "", newPassword: "" };

  // 🟢 Trim the email for validation
  const trimmedEmail = form.currentEmail.trim();

  if (!validateEmail(trimmedEmail)) {
    newErrors.currentEmail = "Please enter a valid email address.";
    hasError = true;
  }
  
  // ... (rest of your length validations)

  if (hasError) {
    setErrors(newErrors);
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/change-password`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.user?.token}` 
      },
      // 🟢 Send trimmed data to backend
      body: JSON.stringify({
        ...form,
        currentEmail: trimmedEmail
      })
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Security updated successfully!");
      setOpen(false);
      setForm({ currentEmail: "", currentPassword: "", newPassword: "" });
    } else {
      // Logic for displaying field-specific errors remains the same
      const errorMessage = data.error || "Update failed.";
      if (errorMessage.toLowerCase().includes("email")) {
        setErrors(prev => ({ ...prev, currentEmail: errorMessage }));
      } else if (errorMessage.toLowerCase().includes("current password")) {
        setErrors(prev => ({ ...prev, currentPassword: errorMessage }));
      } else {
        toast.error(errorMessage);
      }
    }
  } catch (err) {
    toast.error("Network error. Please try again later.");
  } finally {
    setLoading(false);
  }
};

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setErrors({ currentEmail: "", currentPassword: "", newPassword: "" }); // Clear errors on close
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="rounded-[2.5rem] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShieldCheck className="text-violet-600" /> Security Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="space-y-5 pt-4">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Confirm Email</Label>
            <Input 
              required 
              type="email" 
              value={form.currentEmail} 
              onChange={e => setForm({...form, currentEmail: e.target.value})} 
              className={`rounded-xl h-12 bg-zinc-50 border-zinc-100 transition-all ${errors.currentEmail ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-violet-500'}`} 
            />
            {errors.currentEmail && (
              <p className="flex items-center gap-1 text-[11px] font-bold text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={12} /> {errors.currentEmail}
              </p>
            )}
          </div>

          {/* Current Password Input */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Current Password</Label>
            <Input 
              required 
              type="password" 
              value={form.currentPassword} 
              onChange={e => setForm({...form, currentPassword: e.target.value})} 
              className={`rounded-xl h-12 bg-zinc-50 border-zinc-100 transition-all ${errors.currentPassword ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-violet-500'}`} 
            />
            {errors.currentPassword && (
              <p className="flex items-center gap-1 text-[11px] font-bold text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={12} /> {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password Input */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">New Password</Label>
            <Input 
              required 
              type="password" 
              value={form.newPassword} 
              onChange={e => setForm({...form, newPassword: e.target.value})} 
              className={`rounded-xl h-12 bg-zinc-50 border-zinc-100 transition-all ${errors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-violet-500'}`} 
            />
            {errors.newPassword && (
              <p className="flex items-center gap-1 text-[11px] font-bold text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={12} /> {errors.newPassword}
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 h-12 rounded-xl font-bold shadow-lg shadow-violet-100 transition-all active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Update Credentials"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}