"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, CheckCheck, Inbox, Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns"; // 
import { toast } from "sonner";

export default function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!session?.user?.token) return;
    try {
      const res = await fetch("http://localhost:4000/api/notifications", {
        headers: { "Authorization": `Bearer ${session.user.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to load notifications");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [session]);

  const markAllAsRead = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/notifications/read-all", {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${session?.user?.token}` }
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        toast.success("Inbox cleared");
      }
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-all group">
          <Bell className="w-5 h-5 text-white/90 group-hover:text-white" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-indigo-500">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-[2rem] overflow-hidden shadow-2xl border-violet-100" align="end">
        <div className="bg-violet-600 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold">Team Alerts</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-[10px] uppercase font-bold hover:bg-white/20 text-white border border-white/30 rounded-lg">
              <CheckCheck className="w-3 h-3 mr-1" /> Clear All
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-zinc-200" />
              <p className="text-xs font-medium text-zinc-400">Your inbox is clear.</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <div
                key={n.id}
                className={`p-4 border-b border-zinc-50 last:border-0 flex gap-3 transition-colors ${!n.is_read ? 'bg-violet-50/50' : 'hover:bg-zinc-50'}`}
              >
                <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!n.is_read ? 'bg-violet-600' : 'bg-transparent'}`} />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-zinc-800 leading-snug">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}