"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Copy, Check, ArrowLeft, Image as ImageIcon, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface PropertyImage {
  id: string;
  storage_path: string;
  ai_analysis: string;
  created_at: string;
}

export default function ImageViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [image, setImage] = useState<PropertyImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadImageDetails() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("property_images")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setImage(data);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load image details or unauthorized");
      } finally {
        setLoading(false);
      }
    }
    loadImageDetails();
  }, [id]);

  const copyDescription = async () => {
    if (!image?.ai_analysis) return;
    try {
      await navigator.clipboard.writeText(image.ai_analysis);
      setCopied(true);
      toast.success("Description copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy description");
    }
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-ref.supabase.co";

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--foreground)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "16px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "between", flexWrap: "wrap", gap: "16px" }}>
          <button
            onClick={() => window.close()}
            className="btn-secondary"
            style={{ padding: "8px 16px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={14} /> Close Tab
          </button>
          
          <h1 style={{ fontSize: "18px", fontWeight: 800 }}>Image Detail Viewer</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ border: "3px solid var(--surface-3)", borderTop: "3px solid var(--accent)", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--muted)" }}>Loading details...</p>
          </div>
        ) : !image ? (
          <div className="card" style={{ padding: "40px", textAlign: "center", maxWidth: "450px" }}>
            <ImageIcon size={48} color="var(--danger)" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Image Not Found</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px" }}>
              The image listing could not be found or you do not have permission to view it.
            </p>
          </div>
        ) : (
          <div 
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
              gap: "32px", 
              maxWidth: "1100px", 
              width: "100%",
              alignItems: "start"
            }}
            className="animate-fade-in-up"
          >
            {/* Left: Image Card */}
            <div className="card accent-glow" style={{ overflow: "hidden", background: "#000", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "350px", maxHeight: "600px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${supabaseUrl}/storage/v1/object/public/property-images/${image.storage_path}`}
                alt="Full property preview"
                style={{ maxWidth: "100%", maxHeight: "600px", objectFit: "contain", display: "block" }}
              />
            </div>

            {/* Right: Description Card */}
            <div className="card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={18} color="var(--accent)" /> Description
                </h2>
                <button
                  onClick={copyDescription}
                  className="btn-primary"
                  style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {copied ? (
                    <>
                      <Check size={14} color="#000" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Description
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
                  minHeight: "200px",
                  whiteSpace: "pre-wrap"
                }}
              >
                {image.ai_analysis || "No description generated for this image."}
              </div>

              <div style={{ fontSize: "12px", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                Created on: {new Date(image.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
