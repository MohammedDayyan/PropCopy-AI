"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { initUser, signupUser } from "@/lib/api";
import { Building2, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(isSignUp ? "Creating account..." : "Signing in...");

    try {
      if (isSignUp) {
  await signupUser({ email, password });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data?.user) {
    toast.success("Account created successfully! Welcome to PropCopy AI.", { id: toastId });
    router.push("/dashboard");
  }
} else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          // Run credits initialization just in case they are a new user signing in
          try {
            await initUser();
          } catch (initErr) {
            console.error("User init check completed");
          }
          toast.success("Signed in successfully!", { id: toastId });
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An authentication error occurred", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        padding: "24px",
      }}
    >
      <div
        className="card accent-glow animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "32px",
          background: "var(--surface)",
        }}
      >
        {/* Brand Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "linear-gradient(135deg, #f59e0b, #f97316)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <Building2 size={24} color="#0a0b0f" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em" }}>
            PropCopy<span style={{ color: "var(--accent)" }}> AI</span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>
            {isSignUp ? "Create your agent account" : "Sign in to manage properties"}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="tab-list" style={{ marginBottom: "24px" }}>
          <button
            onClick={() => setIsSignUp(false)}
            className={`tab-item ${!isSignUp ? "active" : ""}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`tab-item ${isSignUp ? "active" : ""}`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="agent@propcopy.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                style={{ paddingLeft: "42px" }}
                disabled={loading}
              />
              <Mail size={16} color="var(--muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "13px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                style={{ paddingLeft: "42px" }}
                disabled={loading}
              />
              <Lock size={16} color="var(--muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }} disabled={loading}>
            {loading ? (
              "Please wait..."
            ) : isSignUp ? (
              <>
                <UserPlus size={16} /> Create Account
              </>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/" style={{ fontSize: "13px", color: "var(--muted)", textDecoration: "none" }} className="hover:text-white">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
