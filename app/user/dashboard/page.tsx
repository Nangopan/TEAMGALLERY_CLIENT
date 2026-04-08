// app/user/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // npx shadcn@latest add progress
import Link from "next/link";

export default function UserMainDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ used: 0, quota: 5 });

  useEffect(() => {
    fetch("http://localhost:4000/api/images", {
      headers: { "Authorization": `Bearer ${session?.user?.accessToken}` }
    }).then(res => res.json()).then(data => setStats({ used: data.used, quota: data.quota }));
  }, [session]);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Account Overview</h1>
      <Card>
        <CardHeader>
          <CardTitle>Storage Quota</CardTitle>
          <CardDescription>You have used {stats.used} of {stats.quota} available slots.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={(stats.used / stats.quota) * 100} className="h-4" />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Need more space? Buy 5 more slots for ₹100.</p>
            <Button asChild>
              <Link href="/user/payments">Upgrade Now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}