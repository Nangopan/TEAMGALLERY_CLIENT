"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CreditCard, Loader2, AlertCircle,ArrowLeft, } from "lucide-react"; // Added AlertCircle
import Link from "next/link";

export default function PaymentPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // 🟢 Added state to track if a payment has failed previously
  const [isRetry, setIsRetry] = useState(false); 
  const dashboardPath = session?.user?.role === "admin" ? "/admin/dashboard" : "/user/dashboard";

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/order`, {
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
          const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify`, {
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
            setIsRetry(true); // 🟢 Set retry on verification failure
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
        
        // 🟢 Set retry state to true
        setIsRetry(true); 

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/fail`, {
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
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Link 
        href={dashboardPath} 
        className="flex items-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors w-fit font-bold text-sm uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      <Card className="border-2 border-blue-100 rounded-[2rem] shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-blue-50 p-3 rounded-full w-fit mb-4">
            {isRetry ? (
              <AlertCircle className="h-8 w-8 text-amber-500 animate-pulse" />
            ) : (
              <CreditCard className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isRetry ? "Payment Failed" : "Upgrade Your Vault"}
          </CardTitle>
          <CardDescription>
            {isRetry 
              ? "Something went wrong. Please try again to upgrade your slots." 
              : "Get more space for your team's memories."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={`p-6 rounded-2xl text-center border transition-colors ${isRetry ? 'bg-amber-50 border-amber-100' : 'bg-zinc-50 border-zinc-100'}`}>
            <h4 className="text-4xl font-black text-zinc-900">₹100</h4>
            <p className="text-sm text-zinc-500 mt-2">+5 Additional Image Slots</p>
          </div>
          
          <Button 
            className={`w-full h-12 text-lg rounded-xl transition-all ${isRetry ? 'bg-amber-600 hover:bg-amber-700' : 'bg-violet-600 hover:bg-violet-700'}`} 
            onClick={handlePayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Processing...
              </>
            ) : (
              // 🟢 Conditional Button Text
              isRetry ? "Retry Payment" : "Pay Now"
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