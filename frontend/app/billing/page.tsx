"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import TrialBanner from "@/components/TrialBanner";
import { supabase } from "@/lib/supabaseClient";
import { fetchCredits, createRazorpayOrder, verifyPayment } from "@/lib/api";
import { Zap, CreditCard, Sparkles, Check, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingPage() {
  const router = useRouter();
  const [creditsInfo, setCreditsInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast.error("Please sign in to access billing");
        router.push("/login");
      } else {
        setUser(user);
        loadCredits();
      }
    });

    // Load Razorpay Script dynamically
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // Cleanup script on unmount safely
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [router]);

  const loadCredits = async () => {
    try {
      const data = await fetchCredits();
      setCreditsInfo(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load credit details");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK failed to load. Please refresh the page.");
      return;
    }

    setBuying(true);
    const toastId = toast.loading("Initializing secure payment gateway...");

    try {
      // Step 1: Create Order on FastAPI backend
      const orderData = await createRazorpayOrder();

      // Step 2: Open Razorpay Checkout Widget
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "PropCopy AI",
        description: "Buy 20 Property Copy Generations",
        order_id: orderData.order_id,
        prefill: {
          email: user?.email || "",
        },
        theme: {
          color: "#f59e0b",
        },
        handler: async function (response: any) {
          const verifyToastId = toast.loading("Verifying payment transaction...", { id: toastId });
          try {
            // Step 3: Verify Razorpay Signature on backend
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment verified! 20 credits added.", { id: verifyToastId });
            loadCredits();
          } catch (verifyErr: any) {
            toast.error(verifyErr.message || "Payment verification failed", { id: verifyToastId });
          } finally {
            setBuying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setBuying(false);
            toast.dismiss(toastId);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to initialize checkout. Please try again.", { id: toastId });
      setBuying(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: "900px", width: "100%", margin: "0 auto", padding: "32px 24px" }}>
        {creditsInfo && (
          <TrialBanner
            creditsRemaining={creditsInfo.credits_remaining}
            inTrial={creditsInfo.in_trial}
            daysRemaining={creditsInfo.days_remaining}
            trialExpired={creditsInfo.trial_expired}
          />
        )}

        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
            <CreditCard color="var(--accent)" /> Billing & Credits
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>
            Check credit balances, view your trial status, and top up credits securely using UPI or cards.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{ border: "3px solid var(--surface-3)", borderTop: "3px solid var(--accent)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--muted)" }}>Loading balance...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px", alignItems: "start" }}>
            
            {/* Account Status Card */}
            <div className="card" style={{ padding: "28px", background: "var(--surface)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", textTransform: "uppercase", color: "var(--muted)", letterSpacing: "0.05em" }}>
                Account Balance
              </h3>
              
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "48px", fontWeight: 800, color: "#fff" }}>
                  {creditsInfo?.credits_remaining ?? 0}
                </span>
                <span style={{ color: "var(--muted)", fontSize: "14px", fontWeight: 600 }}>
                  credits remaining
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "var(--muted)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Free Trial Status:</span>
                  <span style={{ fontWeight: 600, color: creditsInfo?.in_trial ? "var(--success)" : "var(--danger)" }}>
                    {creditsInfo?.in_trial ? "Active" : "Expired"}
                  </span>
                </div>
                {creditsInfo?.in_trial && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Trial Days Left:</span>
                    <span style={{ fontWeight: 600, color: "#fff" }}>
                      {creditsInfo?.days_remaining} day{creditsInfo?.days_remaining !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Credits Package:</span>
                  <span style={{ fontWeight: 600, color: "#fff" }}>Non-expiring</span>
                </div>
              </div>
            </div>

            {/* Top Up Card */}
            <div className="card accent-glow" style={{ padding: "28px", background: "var(--surface)", border: "1px solid var(--accent)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                <span className="badge badge-accent">Pay-As-You-Go</span>
                <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                  <ShieldCheck size={12} /> SECURE GATEWAY
                </span>
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>20 Generation Credits</h3>
              <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "16px" }}>
                Perfect for listing active properties. Includes unlimited vision OCR uploads and 4 marketing assets.
              </p>

              <div style={{ margin: "16px 0" }}>
                <span style={{ fontSize: "36px", fontWeight: 800, color: "#fff" }}>₹499</span>
                <span style={{ color: "var(--muted)" }}> / pack (₹25 per listing)</span>
              </div>

              <ul style={{ listStyleType: "none", padding: 0, margin: "20px 0", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Check size={14} color="var(--accent)" /> 20 Full property generation credits
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Check size={14} color="var(--accent)" /> Accepts UPI (GPay, PhonePe, Paytm)
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Check size={14} color="var(--accent)" /> Instant credit activation
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Check size={14} color="var(--accent)" /> No recurring auto-debit hassle
                </li>
              </ul>

              <button
                onClick={handlePurchase}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={buying}
              >
                {buying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing Payment...
                  </>
                ) : (
                  <>
                    Buy 20 Credits <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
