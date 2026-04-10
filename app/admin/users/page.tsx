"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
// Added Edit icon to imports
import { Trash2, UserPlus, Loader2, Copy, RefreshCw, AlertTriangle, Edit,ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
const dashboardPath = "/admin/dashboard";

function UserManagementContent() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const searchParams = useSearchParams();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // 🟢 Added Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: "", name: "", email: "", password: "" });

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const fetchUsers = () => {
    fetch("http://localhost:4000/api/users", {
      headers: { "Authorization": `Bearer ${session?.user?.token}` }
    })
    .then(res => res.json())
    .then(setUsers);
  };

  useEffect(() => {
    if (session?.user?.token) fetchUsers();
  }, [session]);

  const handleGeneratePassword = (type: 'add' | 'edit') => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const specialChars = "!@#$%^&*";
    let pass = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    pass += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    if (type === 'add') setFormData({ ...formData, password: pass });
    else setEditFormData({ ...editFormData, password: pass });
    
    toast.info("Secure password generated.");
  };

  const handleCopyPassword = (pass: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    toast.success("Password copied to clipboard");
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password) {
        toast.error("Please generate a password first.");
        return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.user?.token}` 
        },
        body: JSON.stringify({ 
            name: formData.name, 
            email: formData.email, 
            tempPassword: formData.password 
        })
      });

      if (res.ok) {
        toast.success("Team member onboarded!");
        setIsAddModalOpen(false);
        fetchUsers();
        setFormData({ name: "", email: "", password: "" });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create user");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 Added handleUpdateUser Function
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/users/${editFormData.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.user?.token}` 
        },
        body: JSON.stringify({ 
            name: editFormData.name, 
            email: editFormData.email, 
            tempPassword: editFormData.password || undefined 
        })
      });

      if (res.ok) {
        toast.success("User updated successfully!");
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    const res = await fetch(`http://localhost:4000/api/users/${userId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.user?.token}` }
    });
    if (res.ok) { 
      fetchUsers(); 
      toast.success("User removed successfully"); 
    } else {
      toast.error("Failed to delete user.");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <Link 
        href={dashboardPath} 
        className="flex items-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors w-fit font-bold text-sm uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 rounded-xl">
          <UserPlus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* --- ADD USER MODAL --- */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Team Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Full Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" className="rounded-xl h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Email Address</Label>
              <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@company.com" className="rounded-xl h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Security Credentials</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input readOnly value={formData.password} placeholder="Click generate below..." className="rounded-xl h-12 bg-zinc-100 font-mono text-sm flex-1 cursor-not-allowed" />
                    <Button type="button" variant="outline" size="icon" onClick={() => handleCopyPassword(formData.password)} disabled={!formData.password} className="h-12 w-12 rounded-xl shrink-0 border-violet-100 text-violet-600 hover:bg-violet-50">
                        <Copy size={18} />
                    </Button>
                </div>
                <Button type="button" onClick={() => handleGeneratePassword('add')} className="w-full bg-zinc-900 hover:bg-black text-white h-10 rounded-xl text-xs font-bold gap-2">
                    <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Generate Secure Password
                </Button>
              </div>
            </div>
            {formData.password && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                    <div className="text-[11px] leading-tight text-amber-900">
                        <p className="font-black mb-1 uppercase tracking-tighter">Copy Required</p>
                        <p className="opacity-80">The password is visible above. Copy it now and provide it to the user.</p>
                    </div>
                </div>
            )}
            <Button type="submit" disabled={isLoading || !formData.password} className="w-full bg-violet-600 hover:bg-violet-700 h-12 rounded-xl mt-2 font-bold shadow-lg shadow-violet-200">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Finalize & Save Member"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🟢 --- EDIT USER MODAL --- */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Update Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Full Name</Label>
              <Input required value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="rounded-xl h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Email Address</Label>
              <Input required type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="rounded-xl h-12 bg-zinc-50/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-zinc-400 uppercase ml-1 tracking-widest">Update Password (Optional)</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input readOnly value={editFormData.password} placeholder="Leave blank to keep current" className="rounded-xl h-12 bg-zinc-100 font-mono text-sm flex-1 cursor-not-allowed" />
                    <Button type="button" variant="outline" size="icon" onClick={() => handleCopyPassword(editFormData.password)} disabled={!editFormData.password} className="h-12 w-12 rounded-xl shrink-0 border-violet-100 text-violet-600 hover:bg-violet-50">
                        <Copy size={18} />
                    </Button>
                </div>
                <Button type="button" onClick={() => handleGeneratePassword('edit')} className="w-full bg-zinc-900 hover:bg-black text-white h-10 rounded-xl text-xs font-bold gap-2">
                    <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Generate New Password
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 h-12 rounded-xl mt-2 font-bold shadow-lg shadow-violet-200">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : "Update Member Info"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- USERS TABLE --- */}
      <div className="bg-white border border-violet-100 rounded-[3rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50/50">
            <TableRow>
              <TableHead className="pl-8 py-5 font-bold text-zinc-800">Team Member</TableHead>
              <TableHead className="font-bold text-zinc-800">Email Address</TableHead>
              <TableHead className="text-right pr-8 font-bold text-zinc-800">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-zinc-400">No team members currently active.</TableCell>
                </TableRow>
            ) : (
                users.map((u: any) => (
                    <TableRow key={u.id} className="group hover:bg-violet-50/20 transition-colors">
                      <TableCell className="pl-8 font-semibold text-zinc-900">{u.name}</TableCell>
                      <TableCell className="text-zinc-500 font-medium">{u.email}</TableCell>
                      <TableCell className="text-right pr-8 space-x-1">
                        {/* 🟢 Edit Button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 rounded-full text-zinc-300 hover:text-violet-600 hover:bg-violet-50 transition-all"
                          onClick={() => {
                            setEditFormData({ id: u.id, name: u.name, email: u.email, password: "" });
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-zinc-300 hover:text-red-600 hover:bg-red-50 transition-all">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove <strong>{u.name}</strong> from your organization. 
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(u.id)}
                                className="bg-red-600 hover:bg-red-700 rounded-xl"
                              >
                                Delete Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function UserManagement() {
    return (
        <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin text-violet-600" /></div>}>
            <UserManagementContent />
        </Suspense>
    );
}