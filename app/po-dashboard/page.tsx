"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner"; // Modern Toast Notifications

// Dialog Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ProductOwnerDashboard() {
  const { data: session } = useSession();
  const [orgs, setOrgs] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Modal States
  const [editOrg, setEditOrg] = useState<{ id: string, name: string } | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user) fetchOrgs();
  }, [session]);

  const fetchOrgs = async () => {
    const res = await fetch("http://localhost:4000/api/organisations", {
      headers: { "Authorization": `Bearer ${session?.user?.accessToken}` } 
    });
    
    if (res.ok) {
      setOrgs(await res.json());
    } else {
      toast.error("Failed to load organisations.");
    }
  };

  const executeDelete = async () => {
    if (!deleteOrg) return;

    const res = await fetch(`http://localhost:4000/api/organisations/${deleteOrg.id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.user?.accessToken}` } 
    });

    if (res.ok) {
      toast.success(`${deleteOrg.name} has been deleted.`);
      fetchOrgs(); 
    } else {
      toast.error("Failed to delete. Make sure there are no users attached.");
    }
    setDeleteOrg(null); // Close the modal
  };

  const executeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrg) return;

    const res = await fetch(`http://localhost:4000/api/organisations/${editOrg.id}`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.user?.accessToken}` 
      },
      body: JSON.stringify({ name: editOrg.name })
    });

    if (res.ok) {
      toast.success("Organisation updated successfully.");
      fetchOrgs();
      setEditOrg(null); // Close the modal
    } else {
      toast.error("Failed to update organisation.");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Owner Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage all active tenants on the platform.</p>
        </div>
        
        <Button asChild>
          <Link href="/po-dashboard/create">+ Create Organisation</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Organisations</CardTitle>
          <CardDescription>A complete list of all companies currently using the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Primary Admin Email</TableHead>
                <TableHead>Onboarded Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">No organisations have been created yet.</TableCell>
                </TableRow>
              ) : (
                orgs.map((org: any) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-semibold">{org.name}</TableCell>
                    <TableCell>{org.admin?.email || "No Admin Linked"}</TableCell>
                    <TableCell suppressHydrationWarning>
                      {isMounted ? new Date(org.created_at).toLocaleDateString() : "..."}
                    </TableCell>
                    <TableCell>
                      {/* PERFECTLY ALIGNED ACTION BUTTONS */}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => setEditOrg({ id: org.id, name: org.name })}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="outline" size="icon" className="border-red-200 hover:bg-red-50" onClick={() => setDeleteOrg({ id: org.id, name: org.name })}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- EDIT MODAL --- */}
      <Dialog open={!!editOrg} onOpenChange={(open) => !open && setEditOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organisation</DialogTitle>
          </DialogHeader>
          <form onSubmit={executeEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Organisation Name</Label>
              <Input 
                required 
                value={editOrg?.name || ""} 
                onChange={(e) => setEditOrg(prev => prev ? { ...prev, name: e.target.value } : null)} 
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditOrg(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- DELETE CONFIRMATION ALERT --- */}
      <AlertDialog open={!!deleteOrg} onOpenChange={(open) => !open && setDeleteOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteOrg?.name}</strong>. This action cannot be undone, and will fail if there are active users assigned to this organisation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOrg(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={executeDelete}>
              Yes, delete company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}