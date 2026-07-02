"use client";

import { Copy, Check, Video, Mail, Megaphone } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface ResultsDashboardProps {
  assets: any;
}

export default function ResultsDashboard({ assets }: ResultsDashboardProps) {
  const [copied, setCopied] = useState(false);

  const primaryImage = assets.image_urls?.[0];
  const secondImage = assets.image_urls?.[1] || primaryImage;
  const logoUrl = assets.logo_url;
  const type = assets.creative_type;

  const copyText = async () => {
    const text = JSON.stringify(assets, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card accent-glow" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {type === "instagram" && <Video size={18} />}
          {type === "banner" && <Megaphone size={18} />}
          {type === "email" && <Mail size={18} />}
          Generated {type}
        </strong>

        <button className="btn-secondary" onClick={copyText}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          Copy Text
        </button>
      </div>

      {type === "instagram" && (
        <InstagramReelPreview
          imageUrl={primaryImage}
          secondImageUrl={secondImage}
          logoUrl={logoUrl}
          reel={assets.instagram_reel}
        />
      )}

      {type === "banner" && (
        <BannerPreview
          imageUrl={primaryImage}
          logoUrl={logoUrl}
          banner={assets.banner_poster}
        />
      )}

      {type === "email" && (
        <EmailPreview
          imageUrl={primaryImage}
          logoUrl={logoUrl}
          email={assets.email_brochure}
        />
      )}
    </div>
  );
}

function LogoBlock({ logoUrl }: { logoUrl?: string }) {
  if (!logoUrl) return null;

  return (
    <img
      src={logoUrl}
      alt="Company logo"
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        objectFit: "cover",
        border: "2px solid rgba(255,255,255,0.8)",
        marginBottom: 8,
      }}
    />
  );
}

function InstagramReelPreview({
  imageUrl,
  secondImageUrl,
  logoUrl,
  reel,
}: {
  imageUrl?: string;
  secondImageUrl?: string;
  logoUrl?: string;
  reel: any;
}) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 430,
        aspectRatio: "9 / 16",
        margin: "0 auto",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        background: "#050505",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "58%" }}>
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <img src={secondImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.45) 55%, #000 76%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 24,
          textAlign: "center",
          color: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <LogoBlock logoUrl={logoUrl} />
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          {reel?.brand_handle || "@brand"}
        </div>

        <h2
          style={{
            fontSize: "clamp(24px, 7vw, 38px)",
            lineHeight: 0.95,
            fontWeight: 950,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {reel?.headline}
        </h2>

        <div
          style={{
            color: "#ff2a2a",
            fontSize: "clamp(20px, 6vw, 32px)",
            lineHeight: 1,
            fontWeight: 950,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          {reel?.highlight}
        </div>

        <p style={{ fontSize: 16, fontWeight: 800, textTransform: "uppercase" }}>
          {reel?.supporting_text}
        </p>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          border: "1px solid rgba(255,255,255,0.16)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

function BannerPreview({
  imageUrl,
  logoUrl,
  banner,
}: {
  imageUrl?: string;
  logoUrl?: string;
  banner: any;
}) {
  return (
    <div
      style={{
        aspectRatio: "16 / 7",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        background: "#050505",
      }}
    >
      <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.25))",
        }}
      />

      <div style={{ position: "absolute", left: 32, top: 32, bottom: 32, maxWidth: 480, color: "white" }}>
        <LogoBlock logoUrl={logoUrl} />

        <h2 style={{ fontSize: 42, lineHeight: 1, fontWeight: 900, marginBottom: 12 }}>
          {banner?.headline}
        </h2>

        <p style={{ fontSize: 18, marginBottom: 20 }}>{banner?.subheadline}</p>

        <button className="btn-primary">{banner?.cta || "Learn More"}</button>

        <p style={{ fontSize: 12, opacity: 0.75, marginTop: 18 }}>{banner?.footer_note}</p>
      </div>
    </div>
  );
}

function EmailPreview({
  imageUrl,
  logoUrl,
  email,
}: {
  imageUrl?: string;
  logoUrl?: string;
  email: any;
}) {
  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        background: "#ffffff",
        color: "#111827",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <img src={imageUrl} alt="" style={{ width: "100%", height: 260, objectFit: "cover" }} />

      <div style={{ padding: 28 }}>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Company logo"
            style={{ width: 54, height: 54, objectFit: "cover", borderRadius: "50%", marginBottom: 14 }}
          />
        )}

        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          {email?.preheader}
        </div>

        <h2 style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 12 }}>
          {email?.subject}
        </h2>

        <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 22 }}>
          {email?.intro}
        </p>

        {(email?.sections || []).map((section: any, index: number) => (
          <div key={index} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, marginTop: 16 }}>
            <h3 style={{ fontSize: 17, marginBottom: 6 }}>{section.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#374151" }}>{section.body}</p>
          </div>
        ))}

        <button
          style={{
            marginTop: 24,
            background: "#111827",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "12px 18px",
            fontWeight: 800,
          }}
        >
          {email?.cta || "Contact Us"}
        </button>

        <p style={{ marginTop: 20, fontSize: 13, color: "#6b7280" }}>
          {email?.signature}
        </p>
      </div>
    </div>
  );
}