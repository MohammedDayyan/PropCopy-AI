"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon, FileText } from "lucide-react";

interface ImageUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
}

export default function ImageUploadZone({
  files,
  onFilesChange,
  maxFiles = 5,
}: ImageUploadZoneProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = maxFiles - files.length;
      const toAdd = accepted.slice(0, remaining);
      const newPreviews = toAdd.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      setPreviews((prev) => [...prev, ...newPreviews]);
      onFilesChange([...files, ...toAdd]);
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const newPreviews = previews.filter((_, i) => i !== index);
    const newFiles = files.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onFilesChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic"],
    },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  return (
    <div>
      {/* Drop Zone */}
      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)",
            padding: "32px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragActive ? "var(--accent-muted)" : "var(--surface-2)",
            transition: "all 0.2s ease",
            position: "relative",
          }}
        >
          <input {...getInputProps()} />
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: isDragActive ? "rgba(245,158,11,0.2)" : "var(--surface-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              transition: "all 0.2s",
            }}
          >
            <Upload
              size={22}
              color={isDragActive ? "var(--accent)" : "var(--muted)"}
            />
          </div>
          {isDragActive ? (
            <p style={{ color: "var(--accent)", fontWeight: 600 }}>Drop images here…</p>
          ) : (
            <>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>
                Drag & drop property images
              </p>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                or{" "}
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                  browse files
                </span>{" "}
                · JPEG, PNG, WebP · Max {maxFiles} images
              </p>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  fontSize: 12,
                  color: "var(--muted)",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <ImageIcon size={12} />
                  Property photos
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <FileText size={12} />
                  Floor plans / brochures
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Image Previews */}
      {previews.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
            marginTop: 16,
          }}
        >
          {previews.map((preview, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                borderRadius: "var(--radius)",
                overflow: "hidden",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                aspectRatio: "1",
              }}
              className="animate-fade-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={`Property image ${index + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              {/* Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.4)",
                  opacity: 0,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-end",
                  padding: 6,
                  transition: "opacity 0.2s",
                }}
                className="image-overlay"
              />
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "rgba(10,11,15,0.85)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  color: "var(--muted)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--danger)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--muted)")
                }
              >
                <X size={12} />
              </button>
              {/* Label */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "4px 8px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.8)",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                Image {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Count indicator */}
      {files.length > 0 && (
        <p
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          {files.length} of {maxFiles} images selected
          {files.length >= maxFiles && (
            <span style={{ color: "var(--accent)", marginLeft: 6 }}>
              (max reached)
            </span>
          )}
        </p>
      )}
    </div>
  );
}
