"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "", email: "", tempPassword: ""
  });

  useEffect(() => {
    if (session?.user) fetchUsers();
  }, [session]);

  const fetchUsers = async () => {
    // 🚨 BUG FIX: Using accessToken instead of id
    const res = await fetch("http://localhost:4000/api/users", {
      headers: { "Authorization": `Bearer ${session?.user?.accessToken}` } 
    });
    
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    } else {
      console.error("Failed to fetch users:", await res.text());
    }
  };

  // 🌟 NEW FEATURE: Password Generator
  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const specials = "!@#$%^&*()_+";
    
    // Guarantee at least one special character
    let password = specials[Math.floor(Math.random() * specials.length)];
    
    // Fill the remaining 7 slots with random alphanumeric characters
    for (let i = 0; i < 7; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the string so the special character isn't always first
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData({ ...formData, tempPassword: password });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tempPassword) {
      alert("Please generate a password first!");
      return;
    }

    // 🚨 BUG FIX: Using accessToken instead of id
    const res = await fetch("http://localhost:4000/api/users", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.user?.accessToken}`
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setFormData({ name: "", email: "", tempPassword: "" });
      setIsModalOpen(false); 
      fetchUsers(); 
    } else {
      console.error("Failed to create user:", await res.text());
      alert("Failed to create user. Check the console.");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>+ Add New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Onboard New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              
              {/* 🌟 NEW FEATURE: Auto-Generate UI */}
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <div className="flex space-x-2">
                  <Input 
                    required 
                    readOnly 
                    value={formData.tempPassword} 
                    placeholder="Click generate..." 
                    className="bg-gray-50 font-mono"
                  />
                  <Button type="button" variant="outline" onClick={generateRandomPassword}>
                    Generate
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full">Create User</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organisation Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Image Quota</TableHead>
                <TableHead>Joined Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500 py-4">No users found in your organisation.</TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.image_quota} / 5 Free</TableCell>
                    <TableCell suppressHydrationWarning>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}