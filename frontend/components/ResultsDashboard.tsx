"use client";

import { useState } from "react";
import { Copy, Check, FileText, Video, Mail, Megaphone } from "lucide-react";
import toast from "react-hot-toast";

interface MarketingAssets {
  mls_description: string;
  instagram_script: string;
  email_blast: string;
  facebook_ad: string;
}

interface ResultsDashboardProps {
  assets: MarketingAssets;
}

type TabType = "mls" | "instagram" | "email" | "facebook";

export default function ResultsDashboard({ assets }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("mls");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string, tab: TabType) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(tab);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      toast.error("Failed to copy text");
    }
  };

  const tabs = [
    { id: "mls" as TabType, label: "MLS listing", icon: FileText, content: assets.mls_description },
    { id: "instagram" as TabType, label: "Instagram Reels/Post", icon: Video, content: assets.instagram_script },
    { id: "email" as TabType, label: "Email Blast", icon: Mail, content: assets.email_blast },
    { id: "facebook" as TabType, label: "Facebook/Meta Ad", icon: Megaphone, content: assets.facebook_ad },
  ];

  const activeContent = tabs.find((t) => t.id === activeTab)?.content || "";

  return (
    <div className="card accent-glow overflow-hidden animate-fade-in-up" style={{ animationDelay: "100ms" }}>
      {/* Tabs list */}
      <div className="tab-list" style={{ margin: "16px" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-item ${isActive ? "active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: "0 24px 24px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase" }}>
            Generated Output ({activeTab})
          </span>
          <button
            onClick={() => copyToClipboard(activeContent, activeTab)}
            className="btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {copiedText === activeTab ? (
              <>
                <Check size={14} color="var(--success)" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Copy
              </>
            )}
          </button>
        </div>

        <div
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "20px",
            fontSize: "14px",
            lineHeight: "1.7",
            minHeight: "220px",
            whiteSpace: "pre-wrap",
            fontFamily: "inherit",
          }}
        >
          {activeContent || (
            <span style={{ color: "var(--muted)", fontStyle: "italic" }}>
              No content generated for this tab.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
