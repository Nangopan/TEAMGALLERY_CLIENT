"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreateOrganisationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: "", admin_name: "", admin_email: ""
  });
  const [newAdminCredentials, setNewAdminCredentials] = useState<{email: string, pass: string} | null>(null);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("http://localhost:4000/api/organisations", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.user?.accessToken}`
      },
      body: JSON.stringify(formData),
    });

   if (res.ok) {
      const data = await res.json();
      setNewAdminCredentials({ email: data.adminEmail, pass: data.tempPassword });
      setFormData({ name: "", admin_name: "", admin_email: "" });
      toast.success("Organisation successfully created!"); // <--- SUCCESS TOAST
    } else {
      console.error("Failed to create org:", await res.text());
      toast.error("Failed to create organisation."); // <--- ERROR TOAST
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Onboard New Organisation</h1>
        <Button variant="outline" asChild>
          <Link href="/po-dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      {newAdminCredentials ? (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Organisation Created Successfully!</CardTitle>
            <CardDescription className="text-green-700">
              Please provide these credentials to the new administrator securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">Admin Email: {newAdminCredentials.email}</p>
            <p className="font-medium">Temporary Password: <span className="font-mono bg-white px-2 py-1 border rounded">{newAdminCredentials.pass}</span></p>
            <Button className="mt-4 w-full" asChild>
               <Link href="/po-dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Company & Admin Details</CardTitle>
            <CardDescription>This will generate the company environment and the master admin account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOrg} className="space-y-6">
              <div className="space-y-2">
                <Label>Organisation Name</Label>
                <Input required placeholder="e.g., Stark Industries" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Admin Name</Label>
                  <Input required placeholder="e.g., Tony Stark" value={formData.admin_name} onChange={(e) => setFormData({...formData, admin_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Default Admin Email</Label>
                  <Input required type="email" placeholder="tony@stark.com" value={formData.admin_email} onChange={(e) => setFormData({...formData, admin_email: e.target.value})} />
                </div>
              </div>
              <Button type="submit" className="w-full">Create & Generate Admin Account</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}