"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import TrialBanner from "@/components/TrialBanner";
import ResultsDashboard from "@/components/ResultsDashboard";
import { fetchCredits, fetchProperties, fetchProperty, updateProperty } from "@/lib/api";
import { Building2, Plus, Calendar, ChevronRight, Sparkles, LayoutGrid, Edit3, Save, X, Image as ImageIcon, Copy } from "lucide-react";
import toast from "react-hot-toast";

interface PropertyImage {
  id: string;
  storage_path: string;
  ai_analysis: string;
  created_at: string;
}

interface Property {
  id: string;
  raw_bullet_points: string;
  created_at: string;
  marketing_assets?: Array<{
    mls_description: string;
    instagram_script: string;
    email_blast: string;
    facebook_ad: string;
  }>;
  property_images?: PropertyImage[];
}

export default function Dashboard() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [creditsInfo, setCreditsInfo] = useState<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleGenerateClick = (e: React.MouseEvent) => {
    if (creditsInfo && creditsInfo.credits_remaining <= 0) {
      e.preventDefault();
      toast.error("Free trial over! Please buy credits first.");
      router.push("/billing");
    }
  };

  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editMls, setEditMls] = useState("");
  const [editInsta, setEditInsta] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFb, setEditFb] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [pData, cData] = await Promise.all([fetchProperties(), fetchCredits()]);
        setProperties(pData.properties || []);
        setCreditsInfo(cData);

        // Auto-select the first property if available
        if (pData.properties && pData.properties.length > 0) {
          handleSelectProperty(pData.properties[0]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleSelectProperty = async (property: Property) => {
    setLoadingDetails(true);
    setIsEditing(false); // Reset edit state
    try {
      setSelectedProperty(property); // Set basic properties first
      const fullProperty = await fetchProperty(property.id);
      setSelectedProperty(fullProperty);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load full property details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const startEditing = () => {
    if (!selectedProperty) return;
    setEditNotes(selectedProperty.raw_bullet_points || "");
    const asset = selectedProperty.marketing_assets?.[0] || {
      mls_description: "",
      instagram_script: "",
      email_blast: "",
      facebook_ad: "",
    };
    setEditMls(asset.mls_description || "");
    setEditInsta(asset.instagram_script || "");
    setEditEmail(asset.email_blast || "");
    setEditFb(asset.facebook_ad || "");
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedProperty) return;
    const toastId = toast.loading("Saving changes...");
    try {
      const updated = await updateProperty(selectedProperty.id, {
        raw_bullet_points: editNotes,
        mls_description: editMls,
        instagram_script: editInsta,
        email_blast: editEmail,
        facebook_ad: editFb,
      });

      // Update in property sidebar list
      setProperties((prev) =>
        prev.map((p) => (p.id === selectedProperty.id ? { ...p, raw_bullet_points: editNotes } : p))
      );

      setSelectedProperty(updated);
      setIsEditing(false);
      toast.success("Listing updated successfully!", { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update property", { id: toastId });
    }
  };

  const handleCopyImgDesc = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Description copied!");
    } catch (err) {
      toast.error("Failed to copy description");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getExcerpt = (text: string) => {
    if (!text) return "";
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-ref.supabase.co";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--background)" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: "1200px", width: "100%", margin: "0 auto", padding: "32px 24px" }}>
        {creditsInfo && (
          <TrialBanner
            creditsRemaining={creditsInfo.credits_remaining}
            inTrial={creditsInfo.in_trial}
            daysRemaining={creditsInfo.days_remaining}
            trialExpired={creditsInfo.trial_expired}
          />
        )}

        {/* Dashboard Title & Call to Action */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800 }}>Properties Listings</h1>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>
              View, edit, and copy generated marketing materials for your listings.
            </p>
          </div>

          <Link href="/generate" className="btn-primary" onClick={handleGenerateClick}>
            <Plus size={16} /> New Property Copy
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div
              style={{
                border: "3px solid var(--surface-3)",
                borderTop: "3px solid var(--accent)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "var(--muted)" }}>Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          /* Empty State */
          <div
            className="card accent-glow"
            style={{
              padding: "64px 24px",
              textAlign: "center",
              maxWidth: "500px",
              margin: "48px auto 0",
              background: "var(--surface)",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "var(--accent-muted)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <Sparkles size={24} color="var(--accent)" />
            </div>
            <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>No property copies yet</h3>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
              Upload floor plans or photos to generate high-converting MLS listings, instagram scripts, email blasts, and Facebook ads.
            </p>
            <Link href="/generate" className="btn-primary" style={{ display: "inline-flex" }} onClick={handleGenerateClick}>
              Generate Copy Now <Plus size={16} />
            </Link>
          </div>
        ) : (
          /* Main Layout with side selection */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "32px",
              alignItems: "start",
            }}
          >
            {/* Sidebar list of properties */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <LayoutGrid size={14} /> Select Property
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  maxHeight: "600px",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {properties.map((property) => {
                  const isSelected = selectedProperty?.id === property.id;
                  return (
                    <div
                      key={property.id}
                      onClick={() => handleSelectProperty(property)}
                      className="card glass-hover"
                      style={{
                        padding: "16px",
                        cursor: "pointer",
                        border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: isSelected ? "var(--surface-3)" : "var(--surface)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "var(--accent-muted)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            color: "var(--accent)",
                            fontWeight: 700,
                          }}
                        >
                          <Building2 size={11} /> Property
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Calendar size={11} /> {formatDate(property.created_at)}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: "13px",
                          marginTop: "12px",
                          color: isSelected ? "var(--foreground)" : "var(--muted)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          lineHeight: "1.5",
                        }}
                      >
                        {property.raw_bullet_points || "No raw description available."}
                      </p>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "var(--accent)",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                            fontWeight: 600,
                          }}
                        >
                          View details <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content preview pane */}
            <div style={{ gridColumn: "span 2" }}>
              {selectedProperty ? (
                <div>
                  {/* Property Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span className="badge badge-accent">Selected Listing</span>
                        <span style={{ fontSize: "13px", color: "var(--muted)" }}>
                          ID: {selectedProperty.id.substring(0, 8)}...
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={11} /> Created: {formatDate(selectedProperty.created_at)}
                      </span>
                    </div>

                    {!isEditing ? (
                      <button onClick={startEditing} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                        <Edit3 size={14} /> Edit Listing
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => setIsEditing(false)} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                          <X size={14} /> Cancel
                        </button>
                        <button onClick={handleSaveChanges} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                          <Save size={14} /> Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  {loadingDetails ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                      <div
                        style={{
                          border: "3px solid var(--surface-3)",
                          borderTop: "3px solid var(--accent)",
                          borderRadius: "50%",
                          width: "30px",
                          height: "30px",
                          animation: "spin 1s linear infinite",
                          margin: "0 auto 12px",
                        }}
                      />
                      <p style={{ color: "var(--muted)", fontSize: "13px" }}>Loading details...</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }} className="animate-fade-in">
                      
                      {/* 1. Property Images View */}
                      {selectedProperty.property_images && selectedProperty.property_images.length > 0 && (
                        <div className="card" style={{ padding: "20px", background: "var(--surface)" }}>
                          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <ImageIcon size={16} color="var(--accent)" /> Property Images & AI Analysis
                          </h3>
                          <div
                            style={{
                              display: "flex",
                              gap: "16px",
                              overflowX: "auto",
                              paddingBottom: "8px",
                            }}
                          >
                            {selectedProperty.property_images.map((img) => (
                              <div
                                key={img.id}
                                style={{
                                  minWidth: "180px",
                                  width: "180px",
                                  flexShrink: 0,
                                  background: "var(--surface-2)",
                                  borderRadius: "var(--radius)",
                                  overflow: "hidden",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                <a
                                  href={`/image/${img.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: "block", width: "100%", height: "120px", position: "relative", background: "#000", cursor: "pointer" }}
                                  title="Click to view full image and copy description"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`${supabaseUrl}/storage/v1/object/public/property-images/${img.storage_path}`}
                                    alt="Property upload"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </a>
                                <div style={{ padding: "10px", fontSize: "11px", color: "var(--muted)", minHeight: "60px" }}>
                                  <span 
                                    style={{ 
                                      fontWeight: 600, 
                                      color: "var(--foreground)", 
                                      display: "flex", 
                                      justifyContent: "space-between", 
                                      alignItems: "center", 
                                      marginBottom: "4px" 
                                    }}
                                  >
                                    Description:
                                    <button 
                                      onClick={() => handleCopyImgDesc(img.ai_analysis)}
                                      style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer", padding: "2px" }}
                                      title="Copy Description"
                                    >
                                      <Copy size={11} />
                                    </button>
                                  </span>
                                  <p
                                    style={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                      lineHeight: "1.4",
                                    }}
                                    title={img.ai_analysis}
                                  >
                                    {img.ai_analysis || "No description generated."}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Original Notes View (Read vs Edit) */}
                      <div className="card" style={{ padding: "20px", background: "var(--surface)" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Original Notes</h3>
                        {!isEditing ? (
                          <p
                            style={{
                              background: "var(--surface-2)",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius)",
                              padding: "12px 16px",
                              color: "var(--muted)",
                              fontSize: "13px",
                              lineHeight: "1.6",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {selectedProperty.raw_bullet_points}
                          </p>
                        ) : (
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="textarea"
                            style={{ minHeight: "100px" }}
                          />
                        )}
                      </div>

                      {/* 3. Marketing Copy View (Read vs Edit) */}
                      {!isEditing ? (
                        selectedProperty.marketing_assets && selectedProperty.marketing_assets.length > 0 ? (
                          <ResultsDashboard
                            assets={selectedProperty.marketing_assets[0]}
                            propertyImages={selectedProperty.property_images}
                          />
                        ) : (
                          <div className="card" style={{ padding: "32px", textAlign: "center" }}>
                            <p style={{ color: "var(--muted)" }}>Marketing copy generation is pending or failed for this listing.</p>
                          </div>
                        )
                      ) : (
                        /* Full Editor Mode */
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                          <div className="card" style={{ padding: "20px" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "var(--accent)" }}>
                              Edit Generated Marketing Copies
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                              <div>
                                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                                  MLS LISTING DESCRIPTION
                                </label>
                                <textarea value={editMls} onChange={(e) => setEditMls(e.target.value)} className="textarea" />
                              </div>

                              <div>
                                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                                  INSTAGRAM REELS / POST SCRIPT
                                </label>
                                <textarea value={editInsta} onChange={(e) => setEditInsta(e.target.value)} className="textarea" />
                              </div>

                              <div>
                                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                                  EMAIL BLAST
                                </label>
                                <textarea value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="textarea" />
                              </div>

                              <div>
                                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                                  FACEBOOK / META AD COPY
                                </label>
                                <textarea value={editFb} onChange={(e) => setEditFb(e.target.value)} className="textarea" />
                              </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                              <button onClick={() => setIsEditing(false)} className="btn-secondary">
                                Cancel
                              </button>
                              <button onClick={handleSaveChanges} className="btn-primary">
                                <Save size={16} /> Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
                  Select a property from the list to view generated marketing copies.
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
