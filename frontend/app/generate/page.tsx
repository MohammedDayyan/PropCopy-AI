"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImageUploadZone from "@/components/ImageUploadZone";
import ResultsDashboard from "@/components/ResultsDashboard";
import TrialBanner from "@/components/TrialBanner";
import { supabase } from "@/lib/supabaseClient";
import { processProperty, uploadImageToSupabase, fetchCredits } from "@/lib/api";
import { Building2, Sparkles, Wand2, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function GeneratePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [bulletPoints, setBulletPoints] = useState("");
  const [creditsInfo, setCreditsInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // Pipeline states
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast.error("Please sign in to access generator");
        router.push("/login");
      } else {
        setUser(user);
        loadCredits();
      }
    });
  }, [router]);

  const loadCredits = async () => {
    try {
      const data = await fetchCredits();
      setCreditsInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please upload at least one property image or floor plan");
      return;
    }
    if (!bulletPoints.trim()) {
      toast.error("Please enter some raw bullet points or notes about the property");
      return;
    }

    if (creditsInfo && creditsInfo.credits_remaining <= 0) {
      toast.error("You are out of credits! Please purchase a pack to continue.");
      router.push("/billing");
      return;
    }

    setGenerating(true);
    setResults(null);

    try {
      // Step 1: Uploading files to Supabase Storage
      setGenerationStep("Uploading images to Supabase storage...");
      const uploadedPaths: string[] = [];
      for (const file of files) {
        const path = await uploadImageToSupabase(file, user.id);
        uploadedPaths.push(path);
      }

      // Step 2: Processing property through backend pipeline
      setGenerationStep("Analyzing images via Groq Vision API & Synthesizing copies...");
      const res = await processProperty({
        image_paths: uploadedPaths,
        raw_bullet_points: bulletPoints,
      });

      setResults(res);
      toast.success("Marketing copy generated successfully!");
      
      // Reload credits info
      await loadCredits();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate property copies. Please try again.");
    } finally {
      setGenerating(false);
      setGenerationStep("");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: "800px", width: "100%", margin: "0 auto", padding: "32px 24px" }}>
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
            <Sparkles color="var(--accent)" /> Generate Property Copy
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>
            Upload photos and enter basic specs. The system will handle OCR text extraction and visual copywriting.
          </p>
        </div>

        {generating ? (
          /* Loading Pipeline State */
          <div
            className="card accent-glow animate-fade-in-up"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--surface)",
            }}
          >
            <Loader2 size={48} className="animate-spin" color="var(--accent)" style={{ margin: "0 auto 24px" }} />
            <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>AI Engine is working...</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", maxWidth: "450px", margin: "0 auto 16px", lineHeight: "1.6" }}>
              {generationStep}
            </p>
            <div style={{ fontSize: "11px", color: "var(--muted)", display: "flex", justifyContent: "center", gap: "12px" }}>
              <span>1. Image Upload</span>
              <ChevronRight size={12} />
              <span style={{ color: generationStep.includes("Analyzing") ? "var(--accent)" : "var(--muted)" }}>2. Vision OCR & Captions</span>
              <ChevronRight size={12} />
              <span style={{ color: generationStep.includes("Synthesizing") ? "var(--accent)" : "var(--muted)" }}>3. Copy Generation</span>
            </div>
          </div>
        ) : results ? (
          /* Results View */
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
            <div
              style={{
                background: "rgba(34, 197, 94, 0.08)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                padding: "16px 20px",
                borderRadius: "var(--radius)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                color: "#a7f3d0",
                fontSize: "14px",
              }}
            >
              <CheckCircle2 size={20} color="var(--success)" />
              <span>
                Copy generated successfully! <strong>1 credit</strong> has been deducted from your balance.
              </span>
            </div>

            <ResultsDashboard assets={results} />

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setResults(null);
                  setFiles([]);
                  setBulletPoints("");
                }}
                className="btn-secondary"
              >
                Generate Another
              </button>
              <button onClick={() => router.push("/dashboard")} className="btn-primary">
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Form Input */
          <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
            {/* Step 1: Upload */}
            <div className="card" style={{ padding: "24px", background: "var(--surface)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>1. Upload Property Images</h3>
              <ImageUploadZone files={files} onFilesChange={setFiles} maxFiles={5} />
            </div>

            {/* Step 2: Details */}
            <div className="card" style={{ padding: "24px", background: "var(--surface)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>2. Tell Us About the Listing</h3>
              <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
                Add basic specs, layout features, location highlights, or price range. Indian terms like BHK, Carpet Area, Vastu status, Varthur Road, etc. are automatically recognized.
              </p>
              <textarea
                placeholder="Example: 3 BHK east facing vastu compliant flat in Sobha Dream Acres, Balagere, Bangalore. 1200 sqft carpet area. Closed parking, modular kitchen, chimney installed. 5 mins walk to upcoming metro. Asking price 1.2 Crore."
                value={bulletPoints}
                onChange={(e) => setBulletPoints(e.target.value)}
                className="textarea"
                required
              />
            </div>

            {/* Submit */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn-primary" style={{ padding: "12px 28px", fontSize: "15px" }}>
                <Wand2 size={16} /> Generate Copy (1 Credit)
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
