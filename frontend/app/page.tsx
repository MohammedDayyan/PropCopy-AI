"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Building2, ArrowRight, Zap, Eye, Copy, RefreshCw, Smartphone, Monitor } from "lucide-react";

export default function LandingPage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)", color: "var(--foreground)" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(10, 11, 15, 0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
            height: "70px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                background: "linear-gradient(135deg, #f59e0b, #f97316)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={20} color="#0a0b0f" />
            </div>
            <span style={{ fontWeight: 800, fontSize: "20px", letterSpacing: "-0.03em" }}>
              PropCopy<span style={{ color: "var(--accent)" }}> AI</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {session ? (
              <Link href="/dashboard" className="btn-primary">
                Go to Dashboard <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-ghost">
                  Sign In
                </Link>
                <Link href="/login" className="btn-primary">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          maxWidth: "900px",
          margin: "0 auto",
          position: "relative",
        }}
        className="animate-fade-in-up"
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)",
            zIndex: -1,
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "inline-flex", marginBottom: "16px" }}>
          <span className="badge badge-accent animate-pulse-glow" style={{ gap: "6px" }}>
            <Zap size={12} /> Indian Real Estate Copywriter
          </span>
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: "24px",
            letterSpacing: "-0.03em",
          }}
        >
          Generate High-Converting Real Estate Copy from{" "}
          <span className="gradient-text">Property Photos</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 2.5vw, 19px)",
            color: "var(--muted)",
            maxWidth: "680px",
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Upload property pictures or floor plans. Our multimodal AI extracts room features, dimensions, and materials, automatically crafting beautiful MLS listings, email blasts, and social scripts localized for the Indian market.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/login" className="btn-primary" style={{ padding: "14px 28px", fontSize: "16px" }}>
            Start Your 7-Day Free Trial <ArrowRight size={16} />
          </Link>
          <span style={{ fontSize: "14px", color: "var(--muted)" }}>No credit card required · Includes 5 free generations</span>
        </div>
      </section>

      {/* Feature Walkthrough */}
      <section style={{ padding: "40px 24px", background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: "48px", fontSize: "28px" }}>
            The Perfect <span className="gradient-text">Mobile-to-Desktop</span> Agent Workflow
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }} className="stagger">
            <div className="card" style={{ padding: "28px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Smartphone size={20} color="var(--accent)" />
              </div>
              <h3 style={{ marginBottom: "8px", fontSize: "18px" }}>1. Snap & Upload on Site</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                Walk through the property, take photos on your smartphone, and upload them directly to our mobile-responsive website. No app store downloads needed.
              </p>
            </div>

            <div className="card" style={{ padding: "28px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Eye size={20} color="var(--accent)" />
              </div>
              <h3 style={{ marginBottom: "8px", fontSize: "18px" }}>2. Multimodal AI Analysis</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                Our Groq Vision models scan images. They do OCR on floor plans to find exact carpet areas, and look at photos to note modular kitchens, Italian marble, Vastu compliance, and premium details.
              </p>
            </div>

            <div className="card" style={{ padding: "28px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <Monitor size={20} color="var(--accent)" />
              </div>
              <h3 style={{ marginBottom: "8px", fontSize: "18px" }}>3. Copy-Paste on Desktop</h3>
              <p style={{ color: "var(--muted)", fontSize: "14px" }}>
                Switch over to your laptop, log into your dashboard, and instantly copy the generated MLS description, email blasts, and Instagram captions to post on Magicbricks, WhatsApp, or Instagram.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Indian Localization highlight */}
      <section style={{ padding: "64px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center" }}>
          <div>
            <span className="badge badge-accent" style={{ marginBottom: "12px" }}>Custom Built for India</span>
            <h2 style={{ fontSize: "32px", marginBottom: "20px" }}>Localized for Indian Broker Terminology</h2>
            <p style={{ color: "var(--muted)", marginBottom: "16px", lineHeight: "1.6" }}>
              Generic copywriting tools talk about "yards", "condos", and "bathrooms". PropCopy AI knows how Indian real estate transactions work.
            </p>
            <ul style={{ listStyleType: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Zap size={14} color="var(--accent)" /> Outputs custom BHK specifications (1 BHK, 2 BHK, 3 BHK)
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Zap size={14} color="var(--accent)" /> Correctly references "Carpet Area" and "Super Built-up Area" in Sq. Ft.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Zap size={14} color="var(--accent)" /> Translates details to Vastu-compliant copy & Society Amenities
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Zap size={14} color="var(--accent)" /> Highlights proximity to Metro stations, Tech Parks, and IT Corridors
              </li>
            </ul>
          </div>

          <div className="card accent-glow" style={{ padding: "32px", background: "var(--surface-2)" }}>
            <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase" }}>Example Output</span>
            <hr className="divider" style={{ margin: "12px 0" }} />
            <h4 style={{ color: "#fff", marginBottom: "6px" }}>Luxurious 3 BHK Apartment in Whitefield, Bangalore</h4>
            <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "1.6" }}>
              "Boasting a spacious carpet area of 1,450 sq.ft., this East-facing, Vastu-compliant apartment offers a grand layout. The modular kitchen is fitted with granite countertops. Situated just 10 mins from ITPL Tech Park and the upcoming Metro Station, this gated community provides top-tier amenities..."
            </p>
          </div>
        </div>
      </section>

      {/* Flat Pricing Section */}
      <section style={{ padding: "80px 24px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>Simple, Credit-Based Pricing</h2>
          <p style={{ color: "var(--muted)", marginBottom: "40px" }}>
            No subscriptions or hidden fees. We support UPI, credit/debit cards, and NetBanking via Razorpay.
          </p>

          <div className="card accent-glow" style={{ padding: "40px", border: "2px solid var(--accent)", position: "relative" }}>
            <span style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--accent)", color: "#000", fontSize: "11px", fontWeight: 800, padding: "3px 12px", borderRadius: "10px", textTransform: "uppercase" }}>
              Most Popular
            </span>
            <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>Starter Pack</h3>
            <div style={{ margin: "16px 0" }}>
              <span style={{ fontSize: "40px", fontWeight: 800, color: "#fff" }}>₹499</span>
              <span style={{ color: "var(--muted)" }}> / flat fee</span>
            </div>
            <ul style={{ listStyleType: "none", padding: 0, margin: "24px 0", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Zap size={14} color="var(--accent)" /> 20 Full Property Copy Generations
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Zap size={14} color="var(--accent)" /> Multimodal Vision Analysis (up to 5 images per listing)
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Zap size={14} color="var(--accent)" /> Access to MLS, Instagram, Email & Facebook ad templates
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <Zap size={14} color="var(--accent)" /> Credits never expire
              </li>
            </ul>

            <Link href="/login" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Get 5 Free Credits First <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: "auto", borderTop: "1px solid var(--border)", padding: "40px 24px", background: "var(--background)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ fontSize: "14px", color: "var(--muted)" }}>
            © {new Date().getFullYear()} PropCopy AI. All rights reserved. Built for Indian Realtors.
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
            <Link href="/login" style={{ color: "var(--muted)", textDecoration: "none" }} className="hover:text-white">Sign In</Link>
            <Link href="/login" style={{ color: "var(--muted)", textDecoration: "none" }} className="hover:text-white">Free Trial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
