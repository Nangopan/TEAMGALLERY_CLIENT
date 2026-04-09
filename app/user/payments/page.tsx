"use client";

import { useState } from "react"; // Added
import { useRouter } from "next/navigation"; // Added
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react"; // Added Loader2

export default function PaymentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // Added

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/payments/order", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.user?.token}` }
      });
      const order = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "TeamGallery",
        description: "Buy 5 Extra Image Slots",
        handler: async function (response: any) {
          // ACTUAL VERIFICATION CALL
          const verifyRes = await fetch("http://localhost:4000/api/payments/verify", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session?.user?.token}` 
            },
            body: JSON.stringify(response)
          });

          if (verifyRes.ok) {
            toast.success("Payment Successful! Quota updated.");
            router.push("/user/dashboard");
          } else {
            toast.error("Verification failed.");
          }
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            toast.info("Payment cancelled.");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', async function (response: any) {
        toast.error("Payment Failed: " + response.error.description);
        await fetch("http://localhost:4000/api/payments/fail", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.user?.token}` 
          },
          body: JSON.stringify({ order_id: order.id })
        });
        setIsLoading(false);
      });

      rzp.open();
    } catch (error) {
      toast.error("Could not initiate payment.");
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Card className="border-2 border-blue-100 rounded-[2rem] shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-50 p-3 rounded-full w-fit mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Upgrade Your Vault</CardTitle>
          <CardDescription>Get more space for your team's memories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-zinc-50 p-6 rounded-2xl text-center border">
            <h4 className="text-4xl font-black text-zinc-900">₹100</h4>
            <p className="text-sm text-zinc-500 mt-2">+5 Additional Image Slots</p>
          </div>
          
          <Button 
            className="w-full h-12 text-lg bg-violet-600 hover:bg-violet-700 rounded-xl transition-all" 
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>
          
          <p className="text-[10px] text-center text-zinc-400 uppercase tracking-widest font-bold">
            Secure Razorpay Checkout
          </p>
        </CardContent>
      </Card>
    </div>
  );
}