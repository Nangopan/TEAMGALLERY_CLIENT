"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function PushSubscriptionManager() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.token) {
      handleSubscription();
    }
  }, [status, session]);

  const handleSubscription = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Ask for permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // Get or Create Subscription
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      // Save to Backend
      await fetch("http://localhost:4000/api/users/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.user.token}`
        },
        body: JSON.stringify(sub)
      });
    } catch (err) {
      console.error("Push registration error:", err);
    }
  };

  // Helper for VAPID key conversion
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return null;
}