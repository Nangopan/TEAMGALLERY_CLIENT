"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

export default function PaymentPage() {
  const { data: session } = useSession();

  const handlePayment = async () => {
    try {
      // 0. Check if Razorpay loaded
      if (!(window as any).Razorpay) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        return;
      }

      // 1. Create Order on Backend
      const res = await fetch("http://localhost:4000/api/payments/order", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.user?.accessToken}` }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create order");
      }
      
      const order = await res.json();

      // 2. Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: order.currency,
        name: "TeamGallery",
        description: "Buy 5 Extra Image Slots",
        order_id: order.id,
        handler: function (response: any) {
          toast.success("Payment Successful! Your quota will be updated shortly.");
        },
        prefill: { email: session?.user?.email },
        theme: { color: "#2563eb" },
      };

      const rzp = new (window as any).Razorpay(options);
      
      // Catch modal closing errors
      rzp.on('payment.failed', function (response: any) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });

      rzp.open();
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast.error(error.message || "Something went wrong.");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card className="border-2 border-blue-100">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-50 p-3 rounded-full w-fit mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Upgrade Your Vault</CardTitle>
          <CardDescription>Get more space for your team's memories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-xl text-center">
            <h4 className="text-4xl font-bold">₹100</h4>
            <p className="text-sm text-muted-foreground mt-2">+5 Additional Image Slots</p>
          </div>
          <Button className="w-full h-12 text-lg" onClick={handlePayment}>
            Pay Now with Razorpay
          </Button>
          <p className="text-[10px] text-center text-muted-foreground">
            Securely processed by Razorpay. Credits are added instantly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}