"use client";

import Link from "next/link";
import { AlertTriangle, Zap, ArrowRight } from "lucide-react";

interface TrialBannerProps {
  creditsRemaining: number;
  inTrial: boolean;
  daysRemaining: number;
  trialExpired: boolean;
}

export default function TrialBanner({
  creditsRemaining,
  inTrial,
  daysRemaining,
  trialExpired,
}: TrialBannerProps) {
  if (creditsRemaining <= 0) {
    return (
      <div
        style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#fca5a5",
          padding: "12px 24px",
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} color="var(--danger)" />
          <span>
            <strong>Out of Credits:</strong> You have 0 credits remaining. Please buy more credits to generate copy.
          </span>
        </div>
        <Link href="/billing" className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px", background: "var(--danger)", color: "#fff" }}>
          Buy Credits <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  if (trialExpired) {
    return (
      <div
        style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#fca5a5",
          padding: "12px 24px",
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} color="var(--danger)" />
          <span>
            <strong>Trial Expired:</strong> Your 7-day free trial has expired. Upgrade your account to continue generating copy.
          </span>
        </div>
        <Link href="/billing" className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }}>
          Buy Credits <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  if (inTrial) {
    return (
      <div
        style={{
          background: "var(--accent-muted)",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          color: "#fde047",
          padding: "12px 24px",
          borderRadius: "var(--radius)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Zap size={16} color="var(--accent)" />
          <span>
            <strong>Free Trial Active:</strong> You have <strong>{creditsRemaining} free generation{creditsRemaining !== 1 ? "s" : ""}</strong> left. Your trial ends in <strong>{daysRemaining} day{daysRemaining !== 1 ? "s" : ""}</strong>.
          </span>
        </div>
        <Link href="/billing" className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", border: "1px solid rgba(245, 158, 11, 0.3)", color: "var(--accent)" }}>
          View Pricing Pack
        </Link>
      </div>
    );
  }

  return null;
}
