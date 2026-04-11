"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Eye, 
  EyeOff, 
  GalleryVerticalEnd, 
  Loader2, 
  Lock ,AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({ email: "" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: "Please enter a valid email address." });
      setLoading(false);
      return;
    }

     if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-zinc-900">
      {/* --- Left Side: Branding (Hidden on Mobile) --- */}
      <div className="relative hidden w-0 flex-1 lg:block bg-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-zinc-950" />
        <div className="relative z-20 flex h-full flex-col p-12 text-white/90">
          <div className="flex items-center text-xl font-bold tracking-tight">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <GalleryVerticalEnd className="h-6 w-6 text-white" />
            </div>
            TeamGallery
          </div>
          <div className="mt-auto max-w-md">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight">
              A smarter way to <br />
              <span className="text-indigo-400">manage assets.</span>
            </h2>
            <p className="mt-4 text-zinc-400 leading-relaxed">
              The internal repository for organizational images, accessible across all teams and departments.
            </p>
          </div>
        </div>
      </div>

      {/* --- Right Side: Login Column --- */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 lg:flex-none lg:px-24 xl:px-48 bg-white lg:bg-transparent">
        
        {/* The Form Box */}
        <div className="w-full max-w-md bg-white p-10 rounded-[2rem] border-2 border-zinc-900/10 shadow-[10px_10px_0px_0px_rgba(24,24,27,0.08)]">
          <div className="mb-10 text-center">
            {/* Centered with Tailwind text-center instead of style string */}
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 text-center">
              TeamGallery
            </h1>
            <p className="text-sm text-zinc-500 mt-1 text-center">Enter your Credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-semibold text-zinc-700 ml-1">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className={`h-12 border-zinc-200 rounded-2xl bg-zinc-50/50 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all ${fieldErrors.email ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : ''}`}/>
           {fieldErrors.email && (
                <p className="text-[11px] text-red-500 font-bold flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={12} /> {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-sm font-semibold text-zinc-700">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-12 border-zinc-200 rounded-2xl bg-zinc-50/50 pr-12 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50/50 p-4 text-red-600">
                <Lock size={16} className="shrink-0" />
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "LOGIN"
              )}
            </Button>
          </form>
        </div>

        {/* Welcome Text below the Form Box */}
        <div className="mt-12 text-center">
          <p className="text-sm font-semibold text-zinc-400 tracking-wide uppercase">
            Welcome to <span className="text-zinc-900">TeamGallery</span>
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-zinc-300" />
            <p className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold">
              Secure Cloud Repository
            </p>
            <div className="h-1 w-1 rounded-full bg-zinc-300" />
          </div>
        </div>

      </div>
    </div>
  );
}