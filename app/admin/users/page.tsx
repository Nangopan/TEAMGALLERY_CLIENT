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
import { Trash2, UserPlus, Loader2, Copy, RefreshCw, AlertTriangle, Edit, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

function UserManagementContent() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const searchParams = useSearchParams();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [editFormData, setEditFormData] = useState({ id: "", name: "", email: "", password: "" });
  
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 Validation States
  const [addErrors, setAddErrors] = useState({ name: "", email: "" });
  const [editErrors, setEditErrors] = useState({ name: "", email: "" });

  const fetchUsers = () => {
    fetch("http://localhost:4000/api/users", {
      headers: { "Authorization": `Bearer ${session?.user?.token}` }
    })
    .then(res => res.json())
    .then(setUsers);
  };

  useEffect(() => { if (session?.user?.token) fetchUsers(); }, [session]);

  const handleGeneratePassword = (type: 'add' | 'edit') => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const specialChars = "!@#$%^&*";
    let pass = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    pass += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    if (type === 'add') setFormData({ ...formData, password: pass });
    else setEditFormData({ ...editFormData, password: pass });
    toast.info("Secure password generated.");
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddErrors({ name: "", email: "" });
    let hasError = false;

    // 🟢 Validation: No numbers in name + Email regex
    if (/\d/.test(formData.name)) { setAddErrors(p => ({...p, name: "Full name cannot contain numbers."})); hasError = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setAddErrors(p => ({...p, email: "Please enter a valid business email."})); hasError = true; }

    if (hasError) return;
    if (!formData.password) { toast.error("Please generate a password first."); return; }

    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.user?.token}` },
        body: JSON.stringify({ name: formData.name, email: formData.email, tempPassword: formData.password })
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
    } finally { setIsLoading(false); }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrors({ name: "", email: "" });
    let hasError = false;

    if (/\d/.test(editFormData.name)) { setEditErrors(p => ({...p, name: "Name cannot contain numbers."})); hasError = true; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) { setEditErrors(p => ({...p, email: "Invalid email format."})); hasError = true; }

    if (hasError) return;

    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/users/${editFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.user?.token}` },
        body: JSON.stringify({ name: editFormData.name, email: editFormData.email, tempPassword: editFormData.password || undefined })
      });
      if (res.ok) {
        toast.success("User updated successfully!");
        setIsEditModalOpen(false);
        fetchUsers();
      }
    } finally { setIsLoading(false); }
  };

  const handleDelete = async (userId: string) => {
    const res = await fetch(`http://localhost:4000/api/users/${userId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.user?.token}` }
    });
    if (res.ok) { 
      fetchUsers(); 
      toast.success("User removed successfully"); 
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <Link href="/admin/dashboard" className="flex items-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors w-fit font-bold text-sm uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 rounded-xl">
          <UserPlus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* ADD USER MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bold">New Team Account</DialogTitle></DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Full Name</Label>
              <Input required value={formData.name} onChange={e => {setFormData({...formData, name: e.target.value}); setAddErrors({...addErrors, name: ""})}} className={`rounded-xl h-12 ${addErrors.name ? 'border-red-500' : ''}`} />
              {addErrors.name && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {addErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Email Address</Label>
              <Input required type="email" value={formData.email} onChange={e => {setFormData({...formData, email: e.target.value}); setAddErrors({...addErrors, email: ""})}} className={`rounded-xl h-12 ${addErrors.email ? 'border-red-500' : ''}`} />
              {addErrors.email && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {addErrors.email}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 h-12 rounded-xl font-bold">Finalize & Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT USER MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
          <DialogHeader><DialogTitle className="text-xl font-bold">Update Member</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input required value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className={editErrors.name ? "border-red-500" : ""} />
              {editErrors.name && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {editErrors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input required type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className={editErrors.email ? "border-red-500" : ""} />
              {editErrors.email && <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1"><AlertCircle size={12}/> {editErrors.email}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-violet-600 h-12 rounded-xl font-bold">Update Member Info</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* USERS TABLE WITH ALERTDIALOG RESTORED */}
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
            {users.map((u: any) => (
              <TableRow key={u.id} className="group hover:bg-violet-50/20 transition-colors">
                <TableCell className="pl-8 font-semibold text-zinc-900">{u.name}</TableCell>
                <TableCell className="text-zinc-500 font-medium">{u.email}</TableCell>
                <TableCell className="text-right pr-8 space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => {setEditFormData({id: u.id, name: u.name, email: u.email, password: ""}); setIsEditModalOpen(true)}} className="h-9 w-9 rounded-full text-zinc-300 hover:text-violet-600 transition-all"><Edit className="h-4 w-4" /></Button>
                  
                  {/* 🟢 RESTORED: AlertDialog for Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-zinc-300 hover:text-red-600 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2rem]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete <strong>{u.name}</strong>. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-red-600 hover:bg-red-700 rounded-xl">Delete Member</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
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