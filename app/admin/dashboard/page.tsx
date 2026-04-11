"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Image as ImageIcon, UserPlus, Grid3X3 } from "lucide-react";
import Link from "next/link";
import { ShieldAlert,Lock } from "lucide-react"; 
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function AdminOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ users: 0, images: 0 });

  useEffect(() => {
    if (session?.user?.token) {
      Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, { headers: { "Authorization": `Bearer ${session.user.token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images`, { headers: { "Authorization": `Bearer ${session.user.token}` } })
      ])
      .then(async ([usersRes, imagesRes]) => {
        const users = await usersRes.json();
        const imagesData = await imagesRes.json();
        setStats({ users: users.length, images: imagesData.images?.length || 0 });
      });
    }
  }, [session]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Organization Overview</h1>
          {/* <p className="text-muted-foreground">Managing {session?.user?.organization_id} workspace</p> */}
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3">
         <ChangePasswordModal>
    <Button variant="outline" className="rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-50">
      <Lock className="w-4 h-4 mr-2" /> Change Password
    </Button>
  </ChangePasswordModal>

          <Button asChild variant="outline" className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50">
            <Link href="/admin/gallery">
              <Grid3X3 className="w-4 h-4 mr-2" /> View Gallery
            </Link>
          </Button>
          <Button asChild className="bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md">
            <Link href="/admin/users">
              <UserPlus className="w-4 h-4 mr-2" /> Add Team Member
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-[2rem] border-violet-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Team Size</CardTitle>
            <Users className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-zinc-900">{stats.users}</div>
            <p className="text-xs text-muted-foreground mt-1">Active users in your organization</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-violet-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Storage Used</CardTitle>
            <ImageIcon className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-zinc-900">{stats.images}</div>
            <p className="text-xs text-muted-foreground mt-1">Assets uploaded by the team</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}