"use client";

import {
  Copy,
  Check,
  Video,
  Mail,
  Megaphone,
  Download,
  ChevronLeft,
  ChevronRight,
  Hash,
  Camera,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

interface PropertyImage {
  storage_path: string;
  ai_analysis?: string;
}

interface ResultsDashboardProps {
  assets: any;
  propertyImages?: PropertyImage[];
  rawBulletPoints?: string;
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-ref.supabase.co";

function buildPublicUrl(path: string, bucket: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function detectCreativeType(assets: any): string {
  if (assets.creative_type) return assets.creative_type;
  const ip = assets.instagram_post || assets.instagram_reel;
  if (ip && Object.keys(ip).length > 0) return "instagram";
  if (assets.banner_poster && Object.keys(assets.banner_poster).length > 0) return "banner";
  if (assets.email_brochure && Object.keys(assets.email_brochure).length > 0) return "email";
  return "";
}

/** Parse raw notes into clean bullet points */
function parseBulletPoints(text: string): string[] {
  return text
    .split(/\n|•|\-|,(?=\s[A-Z])/)
    .map((s) => s.replace(/^[\s•\-*]+/, "").trim())
    .filter((s) => s.length > 8 && s.length < 140)
    .slice(0, 16);
}

/** Truncate a string to a word boundary */
function truncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text || "";
  return text.slice(0, maxLen).replace(/\s\S*$/, "") + "…";
}

// ── Slide types ────────────────────────────────────────────────────────────────

interface CoverSlide {
  kind: "cover";
  img1: string;
  img2: string;
}
interface ImageSlide {
  kind: "image";
  img: string;
  aiCaption: string;
  bulletPoints: string[];
  index: number; // 1-based display index
  total: number;
}
interface CtaSlide {
  kind: "cta";
}

type Slide = CoverSlide | ImageSlide | CtaSlide;

export default function ResultsDashboard({
  assets,
  propertyImages,
  rawBulletPoints,
}: ResultsDashboardProps) {
  const [copiedPost, setCopiedPost] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [slide, setSlide] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);

  const type = detectCreativeType(assets);

  // ── Derive URLs ──────────────────────────────────────────────────────────────
  const imageUrls: string[] = assets.image_urls?.length
    ? assets.image_urls
    : (propertyImages || []).map((img) =>
        buildPublicUrl(img.storage_path, "property-images")
      );

  const primaryImage = imageUrls[0] || "";
  const secondImage = imageUrls[1] || primaryImage;

  const logoUrl: string | undefined =
    assets.logo_url ||
    (assets.logo_storage_path
      ? buildPublicUrl(assets.logo_storage_path, "brand-assets")
      : undefined);

  // ── Instagram data ────────────────────────────────────────────────────────────
  const reel = assets.instagram_reel || assets.instagram_post || {};
  const brandHandle = reel?.brand_handle || "@brand";

  // ── Build slides ──────────────────────────────────────────────────────────────
  const slides: Slide[] = (() => {
    const bullets = parseBulletPoints(rawBulletPoints || "");
    const result: Slide[] = [];

    // Slide 0 — Cover: first 2 images
    result.push({ kind: "cover", img1: primaryImage, img2: secondImage });

    // Remaining images (index 2 onwards)
    const remainingImgs = imageUrls.slice(2);
    const remainingProps = propertyImages?.slice(2) || [];
    const totalImageSlides = remainingImgs.length;

    remainingImgs.forEach((imgUrl, idx) => {
      const propImg = remainingProps[idx];
      // Distribute bullet points evenly across image slides
      const perSlide = Math.max(2, Math.ceil(bullets.length / Math.max(totalImageSlides, 1)));
      const start = idx * perSlide;
      result.push({
        kind: "image",
        img: imgUrl,
        aiCaption: propImg?.ai_analysis
          ? truncate(propImg.ai_analysis, 110)
          : "",
        bulletPoints: bullets.slice(start, start + perSlide),
        index: idx + 2, // display as "02, 03, ..."
        total: totalImageSlides + 2, // cover + images + cta
      });
    });

    // Final CTA slide
    result.push({ kind: "cta" });
    return result;
  })();

  const totalSlides = slides.length;
  const prevSlide = () => setSlide((s) => Math.max(0, s - 1));
  const nextSlide = () => setSlide((s) => Math.min(totalSlides - 1, s + 1));

  // ── Instagram Caption ─────────────────────────────────────────────────────────
  const bullets = parseBulletPoints(rawBulletPoints || "");
  const instagramCaption = buildInstagramCaption(reel, bullets, rawBulletPoints);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const copyCaption = async () => {
    await navigator.clipboard.writeText(instagramCaption);
    setCopiedCaption(true);
    toast.success("Caption copied!");
    setTimeout(() => setCopiedCaption(false), 1800);
  };

  const copyPostData = async () => {
    const instagramData = reel;
    await navigator.clipboard.writeText(JSON.stringify(instagramData, null, 2));
    setCopiedPost(true);
    toast.success("Post data copied!");
    setTimeout(() => setCopiedPost(false), 1800);
  };

  const handleDownload = async () => {
    if (!slideRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(slideRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: "#000",
      });
      const link = document.createElement("a");
      link.download = `propcopy-insta-slide-${slide + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(`Slide ${slide + 1} downloaded!`);
    } catch {
      toast.error("Download failed. Try right-clicking to save.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Render non-instagram types ────────────────────────────────────────────────
  if (type === "banner") {
    return (
      <BannerSection
        imageUrl={primaryImage}
        logoUrl={logoUrl}
        banner={assets.banner_poster}
      />
    );
  }
  if (type === "email") {
    return (
      <EmailSection
        imageUrl={primaryImage}
        logoUrl={logoUrl}
        email={assets.email_brochure}
      />
    );
  }
  if (!type) {
    return (
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>
          Marketing copy generation is pending or failed for this listing.
        </p>
      </div>
    );
  }

  // ── INSTAGRAM CAROUSEL ────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Post Card ─────────────────────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          overflow: "hidden",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Profile row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {logoUrl ? (
              <img
                src={logoUrl}
                crossOrigin="anonymous"
                alt="logo"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--accent)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #f97316)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Camera size={18} color="#000" />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{brandHandle}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Real Estate</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#3b82f6",
                cursor: "pointer",
              }}
            >
              Follow
            </span>
            <MoreHorizontal size={18} color="var(--muted)" />
          </div>
        </div>

        {/* ── Carousel ──────────────────────────────────────────────────────────── */}
        <div style={{ position: "relative" }}>
          {/* Slide frame */}
          <div
            ref={slideRef}
            style={{
              width: "100%",
              aspectRatio: "4 / 5",
              overflow: "hidden",
              position: "relative",
              background: "#050505",
            }}
          >
            {slides[slide]?.kind === "cover" && (
              <CoverSlideView
                s={slides[slide] as CoverSlide}
                logoUrl={logoUrl}
                reel={reel}
              />
            )}
            {slides[slide]?.kind === "image" && (
              <ImageSlideView
                s={slides[slide] as ImageSlide}
                logoUrl={logoUrl}
                brandHandle={brandHandle}
              />
            )}
            {slides[slide]?.kind === "cta" && (
              <CtaSlideView
                reel={reel}
                logoUrl={logoUrl}
                brandHandle={brandHandle}
              />
            )}

            {/* Slide counter badge */}
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)",
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Camera size={10} />
              {slide + 1} / {totalSlides}
            </div>
          </div>

          {/* Navigation arrows */}
          {slide > 0 && (
            <button
              onClick={prevSlide}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                zIndex: 10,
              }}
            >
              <ChevronLeft size={18} color="#000" />
            </button>
          )}
          {slide < totalSlides - 1 && (
            <button
              onClick={nextSlide}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.92)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                zIndex: 10,
              }}
            >
              <ChevronRight size={18} color="#000" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 5,
            padding: "10px 0 4px",
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 18 : 6,
                height: 6,
                borderRadius: 99,
                background: i === slide ? "var(--accent)" : "var(--surface-3)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>

        {/* Action bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px 12px",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <Heart size={22} color="var(--muted)" strokeWidth={1.5} style={{ cursor: "pointer" }} />
            <MessageCircle size={22} color="var(--muted)" strokeWidth={1.5} style={{ cursor: "pointer" }} />
            <Send size={22} color="var(--muted)" strokeWidth={1.5} style={{ cursor: "pointer" }} />
          </div>
          <Bookmark size={22} color="var(--muted)" strokeWidth={1.5} style={{ cursor: "pointer" }} />
        </div>

        {/* Slide actions */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 16px 14px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="btn-secondary"
            onClick={handleDownload}
            disabled={downloading}
            style={{ fontSize: 12, padding: "6px 12px", flex: 1, justifyContent: "center" }}
          >
            <Download size={13} />
            {downloading ? "Saving…" : `Download Slide ${slide + 1}`}
          </button>
          <button
            className="btn-secondary"
            onClick={copyPostData}
            style={{ fontSize: 12, padding: "6px 12px", flex: 1, justifyContent: "center" }}
          >
            {copiedPost ? <Check size={13} /> : <Copy size={13} />}
            Copy Post Data
          </button>
        </div>
      </div>

      {/* ── Instagram Caption / Post Description ─────────────────────────────── */}
      <div
        className="card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <Hash size={14} color="var(--accent)" />
            Instagram Post Description
          </h3>
          <button
            className="btn-secondary"
            onClick={copyCaption}
            style={{ fontSize: 12, padding: "6px 14px" }}
          >
            {copiedCaption ? <Check size={13} /> : <Copy size={13} />}
            Copy Caption
          </button>
        </div>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 13,
            lineHeight: 1.75,
            color: "var(--foreground)",
            fontFamily: "'Inter', sans-serif",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "16px 18px",
            margin: 0,
          }}
        >
          {instagramCaption}
        </pre>
      </div>
    </div>
  );
}

// ── Build Instagram Caption ────────────────────────────────────────────────────
function buildInstagramCaption(reel: any, bullets: string[], rawNotes?: string): string {
  const handle = reel?.brand_handle || "";
  const headline = reel?.headline || "";
  const highlight = reel?.highlight || "";
  const existingCaption = reel?.caption || "";

  const keyPoints = bullets.slice(0, 6).map((b) => `✅ ${b}`).join("\n");

  const body = existingCaption
    ? existingCaption
    : rawNotes
    ? truncate(rawNotes, 200)
    : "";

  const hashtags = [
    "#RealEstate", "#PropertyIndia", "#DreamHome", "#HomeBuyers",
    "#IndianRealEstate", "#PropertyForSale", "#LuxuryHomes",
    "#InvestInRealty", "#MagicBricks", "#99acres",
  ].join(" ");

  return [
    headline ? `🏠 ${headline}` : "",
    highlight ? `✨ ${highlight}` : "",
    "",
    body,
    "",
    keyPoints ? "📌 Key Highlights:" : "",
    keyPoints,
    "",
    "📲 Interested? DM us or drop a comment below!",
    "📞 Schedule a free site visit today.",
    "",
    hashtags,
    "",
    handle ? handle : "",
  ]
    .filter((line) => line !== undefined && !(line === "" && false)) // keep empty lines for spacing
    .join("\n")
    .replace(/\n{3,}/g, "\n\n") // max 2 consecutive newlines
    .trim();
}

// ── Slide Components ───────────────────────────────────────────────────────────

function CoverSlideView({
  s,
  logoUrl,
  reel,
}: {
  s: CoverSlide;
  logoUrl?: string;
  reel: any;
}) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* 2-image collage */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%" }}>
        <img
          crossOrigin="anonymous"
          src={s.img1}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <img
          crossOrigin="anonymous"
          src={s.img2}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 35%, rgba(0,0,0,0.5) 60%, #000 85%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 22,
          textAlign: "center",
          color: "#fff",
        }}
      >
        {logoUrl && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <img
              crossOrigin="anonymous"
              src={logoUrl}
              alt="logo"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(255,255,255,0.8)",
              }}
            />
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, marginBottom: 6 }}>
          {reel?.brand_handle || "@brand"}
        </div>
        {reel?.headline && (
          <h2
            style={{
              fontSize: "clamp(20px, 5.5vw, 32px)",
              lineHeight: 1,
              fontWeight: 950,
              textTransform: "uppercase",
              marginBottom: 6,
              letterSpacing: "-0.02em",
            }}
          >
            {reel.headline}
          </h2>
        )}
        {reel?.highlight && (
          <div
            style={{
              color: "#ff3333",
              fontSize: "clamp(16px, 4.5vw, 26px)",
              fontWeight: 900,
              textTransform: "uppercase",
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            {reel.highlight}
          </div>
        )}
        {reel?.supporting_text && (
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", opacity: 0.9 }}>
            {reel.supporting_text}
          </p>
        )}
      </div>
    </div>
  );
}

function ImageSlideView({
  s,
  logoUrl,
  brandHandle,
}: {
  s: ImageSlide;
  logoUrl?: string;
  brandHandle: string;
}) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <img
        crossOrigin="anonymous"
        src={s.img}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      {/* Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 30%, rgba(0,0,0,0.6) 58%, #000 88%)",
        }}
      />

      {/* Top-left logo */}
      {logoUrl && (
        <div style={{ position: "absolute", top: 14, left: 14 }}>
          <img
            crossOrigin="anonymous"
            src={logoUrl}
            alt="logo"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1.5px solid rgba(255,255,255,0.7)",
            }}
          />
        </div>
      )}

      {/* Bottom content */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          color: "#fff",
        }}
      >
        {/* Bullet points */}
        {s.bulletPoints.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 10px", display: "flex", flexDirection: "column", gap: 5 }}>
            {s.bulletPoints.map((bp, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                }}
              >
                <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}>●</span>
                <span>{bp}</span>
              </li>
            ))}
          </ul>
        )}

        {/* AI caption / image description */}
        {s.aiCaption && (
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
              fontStyle: "italic",
              lineHeight: 1.45,
              margin: "0 0 8px",
              borderLeft: "2px solid var(--accent)",
              paddingLeft: 8,
            }}
          >
            {s.aiCaption}
          </p>
        )}

        {/* Brand handle */}
        <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.65, letterSpacing: "0.05em" }}>
          {brandHandle}
        </div>
      </div>
    </div>
  );
}

function CtaSlideView({
  reel,
  logoUrl,
  brandHandle,
}: {
  reel: any;
  logoUrl?: string;
  brandHandle: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(145deg, #0a0b0f 0%, #111827 60%, #1a0a00 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Subtle glow */}
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          pointerEvents: "none",
        }}
      />

      {logoUrl ? (
        <img
          crossOrigin="anonymous"
          src={logoUrl}
          alt="logo"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2.5px solid var(--accent)",
            marginBottom: 18,
          }}
        />
      ) : (
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f59e0b, #f97316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
          <Camera size={28} color="#000" />
        </div>
      )}

      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
        Your Dream Home Awaits
      </p>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: "#fff",
          lineHeight: 1.15,
          marginBottom: 14,
        }}
      >
        {reel?.headline || "Find Your Perfect Property"}
      </h2>

      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 24, maxWidth: 280 }}>
        {reel?.supporting_text || "Schedule a free site visit. DM us or call today."}
      </p>

      <div
        style={{
          background: "var(--accent)",
          color: "#000",
          fontWeight: 800,
          fontSize: 12,
          padding: "10px 24px",
          borderRadius: 40,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        📲 DM to Book a Site Visit
      </div>

      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em" }}>
        {brandHandle}
      </div>
    </div>
  );
}

// ── Banner & Email (unchanged) ─────────────────────────────────────────────────

function BannerSection({
  imageUrl,
  logoUrl,
  banner,
}: {
  imageUrl?: string;
  logoUrl?: string;
  banner: any;
}) {
  const [downloading, setDownloading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!ref.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(ref.current, { useCORS: true, allowTaint: true, scale: 2 });
      const link = document.createElement("a");
      link.download = "propcopy-banner.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Downloaded!");
    } catch {
      toast.error("Download failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card accent-glow" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8 }}>
        <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Megaphone size={18} /> Generated Banner / Poster
        </strong>
        <button className="btn-secondary" onClick={handleDownload} disabled={downloading} style={{ fontSize: 12 }}>
          <Download size={13} /> {downloading ? "Saving…" : "Download"}
        </button>
      </div>
      <div ref={ref} style={{ aspectRatio: "16/7", borderRadius: 8, overflow: "hidden", position: "relative", background: "#050505" }}>
        <img crossOrigin="anonymous" src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.25))" }} />
        <div style={{ position: "absolute", left: 32, top: 32, bottom: 32, maxWidth: 480, color: "white" }}>
          {logoUrl && <img crossOrigin="anonymous" src={logoUrl} alt="logo" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.8)", marginBottom: 8 }} />}
          <h2 style={{ fontSize: 42, lineHeight: 1, fontWeight: 900, marginBottom: 12 }}>{banner?.headline}</h2>
          <p style={{ fontSize: 18, marginBottom: 20 }}>{banner?.subheadline}</p>
          <button className="btn-primary">{banner?.cta || "Learn More"}</button>
          <p style={{ fontSize: 12, opacity: 0.75, marginTop: 18 }}>{banner?.footer_note}</p>
        </div>
      </div>
    </div>
  );
}

function EmailSection({
  imageUrl,
  logoUrl,
  email,
}: {
  imageUrl?: string;
  logoUrl?: string;
  email: any;
}) {
  return (
    <div className="card accent-glow" style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <strong style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Mail size={18} /> Generated Email Brochure
        </strong>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", background: "#ffffff", color: "#111827", borderRadius: 8, overflow: "hidden" }}>
        <img crossOrigin="anonymous" src={imageUrl} alt="" style={{ width: "100%", height: 260, objectFit: "cover" }} />
        <div style={{ padding: 28 }}>
          {logoUrl && <img crossOrigin="anonymous" src={logoUrl} alt="logo" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: "50%", marginBottom: 14 }} />}
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{email?.preheader}</div>
          <h2 style={{ fontSize: 28, lineHeight: 1.15, marginBottom: 12 }}>{email?.subject}</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 22 }}>{email?.intro}</p>
          {(email?.sections || []).map((section: any, i: number) => (
            <div key={i} style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, marginTop: 16 }}>
              <h3 style={{ fontSize: 17, marginBottom: 6 }}>{section.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#374151" }}>{section.body}</p>
            </div>
          ))}
          <button style={{ marginTop: 24, background: "#111827", color: "white", border: "none", borderRadius: 6, padding: "12px 18px", fontWeight: 800 }}>
            {email?.cta || "Contact Us"}
          </button>
          <p style={{ marginTop: 20, fontSize: 13, color: "#6b7280" }}>{email?.signature}</p>
        </div>
      </div>
    </div>
  );
}
