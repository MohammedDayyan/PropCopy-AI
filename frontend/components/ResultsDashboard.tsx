"use client";

import { Copy, Check, Video, Mail, Megaphone, Download } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

interface ResultsDashboardProps {
  assets: any;
  /** Optional: property_images rows from Supabase (dashboard context) */
  propertyImages?: Array<{ storage_path: string }>;
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-ref.supabase.co";

function buildPublicUrl(path: string, bucket: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Detect creative_type from the DB row when it's not explicitly set */
function detectCreativeType(assets: any): string {
  if (assets.creative_type) return assets.creative_type;
  const ip = assets.instagram_post || assets.instagram_reel;
  if (ip && Object.keys(ip).length > 0) return "instagram";
  if (assets.banner_poster && Object.keys(assets.banner_poster).length > 0) return "banner";
  if (assets.email_brochure && Object.keys(assets.email_brochure).length > 0) return "email";
  return "";
}

export default function ResultsDashboard({
  assets,
  propertyImages,
}: ResultsDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Derive type
  const type = detectCreativeType(assets);

  // Derive image URLs — prefer live response image_urls, fall back to DB storage paths
  const imageUrls: string[] = assets.image_urls?.length
    ? assets.image_urls
    : (propertyImages || []).map((img) =>
        buildPublicUrl(img.storage_path, "property-images")
      );

  const primaryImage = imageUrls[0];
  const secondImage = imageUrls[1] || primaryImage;

  // Derive logo URL — prefer live response logo_url, fall back to DB logo_storage_path
  const logoUrl: string | undefined =
    assets.logo_url ||
    (assets.logo_storage_path
      ? buildPublicUrl(assets.logo_storage_path, "brand-assets")
      : undefined);

  const copyText = async () => {
    const instagramData = assets.instagram_reel || assets.instagram_post || {};
    const copyableAssets = {
      ...assets,
      instagram_post: instagramData,
      instagram_reel: instagramData,
    };
    const text = JSON.stringify(copyableAssets, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    try {
      // Dynamically import html2canvas to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `propcopy-${type}-post.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Download failed. Try right-clicking the preview to save.");
    } finally {
      setDownloading(false);
    }
  };

  if (!type) {
    return (
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>
          Marketing copy generation is pending or failed for this listing.
        </p>
      </div>
    );
  }

  return (
    <div className="card accent-glow" style={{ padding: 20 }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {type === "instagram" && <Video size={18} />}
          {type === "banner" && <Megaphone size={18} />}
          {type === "email" && <Mail size={18} />}
          Generated {type === "instagram" ? "Instagram Post" : type === "banner" ? "Banner / Poster" : "Email Brochure"}
        </strong>

        <div style={{ display: "flex", gap: 8 }}>
          {/* Download button — only for instagram and banner */}
          {(type === "instagram" || type === "banner") && (
            <button
              className="btn-secondary"
              onClick={handleDownload}
              disabled={downloading}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Download size={14} />
              {downloading ? "Saving…" : "Download"}
            </button>
          )}
          <button className="btn-secondary" onClick={copyText}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            Copy Text
          </button>
        </div>
      </div>

      {/* Preview */}
      <div ref={previewRef}>
        {type === "instagram" && (
          <InstagramReelPreview
            imageUrl={primaryImage}
            secondImageUrl={secondImage}
            logoUrl={logoUrl}
            reel={assets.instagram_reel || assets.instagram_post}
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
    </div>
  );
}

function LogoBlock({ logoUrl }: { logoUrl?: string }) {
  if (!logoUrl) return null;

  return (
    <img
      src={logoUrl}
      alt="Company logo"
      crossOrigin="anonymous"
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
        <img crossOrigin="anonymous" src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <img crossOrigin="anonymous" src={secondImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
      <img crossOrigin="anonymous" src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />

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
      <img crossOrigin="anonymous" src={imageUrl} alt="" style={{ width: "100%", height: 260, objectFit: "cover" }} />

      <div style={{ padding: 28 }}>
        {logoUrl && (
          <img
            crossOrigin="anonymous"
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