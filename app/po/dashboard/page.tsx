"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, Building2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PODashboard() {
  const { data: session ,status} = useSession();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
 const router = useRouter();
  useEffect(() => {
    // Wait for session to be fully loaded
    if (status === "authenticated") {
      fetchOrgs();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [session, status]);
 const fetchOrgs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organisations`, {
        headers: { 
          // 🚨 FIX: Use .token to match the NextAuth fix we did earlier
          "Authorization": `Bearer ${session?.user?.token}` 
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
      } else {
        toast.error("Unauthorized: Please log out and back in.");
      }
    } catch (error) {
      toast.error("Failed to connect to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`http://localhost:4000/api/organisations/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${session?.user?.accessToken}` }
    });
    
    if (res.ok) {
      toast.success("Organization permanently deleted.");
      fetchOrgs();
    } else {
      toast.error("Failed to delete organization.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Owner Dashboard</h1>
          <p className="text-muted-foreground">Manage tenant organizations.</p>
        </div>
        <Button asChild>
          <Link href="/po/create">+ Create Organization</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Organization Name</TableHead>
                <TableHead>Admin Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((org: any) => (
                <TableRow key={org.id}>
                  <TableCell>
                    {org.logo_url ? (
                      <img src={org.logo_url} alt="logo" className="h-10 w-10 rounded-md object-cover border" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center"><Building2 className="h-5 w-5 text-gray-400" /></div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.admin?.email || 'N/A'}</TableCell>
                  <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => router.push(`/po/edit/${org.id}`)}><Edit className="h-4 w-4" /></Button>
                    
                    {/* SHADCN ALERT DIALOG FOR DELETE */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{org.name}</strong>, their admin account, all users, and all uploaded images. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(org.id)} className="bg-red-600 hover:bg-red-700">
                            Yes, delete organization
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}