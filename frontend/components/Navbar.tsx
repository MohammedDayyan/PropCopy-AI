"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchCredits } from "@/lib/api";
import { Zap, Home, Plus, CreditCard, LogOut, Menu, X, Building2 } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [inTrial, setInTrial] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ email: data.user.email });
        fetchCredits()
          .then((c) => {
            setCredits(c.credits_remaining);
            setInTrial(c.in_trial);
            setDaysLeft(c.days_remaining);
          })
          .catch(() => {});
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/generate", label: "Generate", icon: Plus },
    { href: "/billing", label: "Billing", icon: CreditCard },
  ];

  if (!user) return null;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border)",
        background: "rgba(10, 11, 15, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "var(--foreground)",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: "linear-gradient(135deg, #f59e0b, #f97316)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Building2 size={18} color="#0a0b0f" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>
            PropCopy<span style={{ color: "var(--accent)" }}> AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="hidden md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                color: pathname === href ? "var(--foreground)" : "var(--muted)",
                background: pathname === href ? "var(--surface-2)" : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Credits Badge + User */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Credits */}
          <Link
            href="/billing"
            style={{ textDecoration: "none" }}
            title={inTrial ? `Trial: ${daysLeft} days left` : ""}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 20,
                background: "var(--accent-muted)",
                border: "1px solid rgba(245,158,11,0.2)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <Zap size={13} color="var(--accent)" />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {credits !== null ? credits : "—"}
              </span>
              {inTrial && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginLeft: 2,
                  }}
                >
                  · {daysLeft}d trial
                </span>
              )}
            </div>
          </Link>

          {/* Avatar + Sign Out */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f59e0b33, #f9731633)",
                border: "1px solid rgba(245,158,11,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <button
              onClick={handleSignOut}
              className="btn-ghost"
              style={{ padding: "6px 10px" }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="btn-ghost md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ padding: "6px" }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
          className="md:hidden"
        >
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                color: pathname === href ? "var(--foreground)" : "var(--muted)",
                background: pathname === href ? "var(--surface-2)" : "transparent",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
