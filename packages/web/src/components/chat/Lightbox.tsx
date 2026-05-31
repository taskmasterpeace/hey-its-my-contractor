"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";

export interface LightboxImage {
  url: string;
  filename: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [images.length, onClose]);

  if (images.length === 0) return null;
  const current = images[index];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 12, 22, 0.92)",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: "14px 18px",
          color: "rgba(255,255,255,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 480,
            }}
          >
            {current.filename}
          </div>
          {images.length > 1 && (
            <div
              className="mono"
              style={{
                fontSize: 10,
                opacity: 0.6,
                letterSpacing: "0.1em",
                marginTop: 3,
              }}
            >
              {index + 1} / {images.length}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <a
            href={current.url}
            download={current.filename}
            target="_blank"
            rel="noopener noreferrer"
            title="Download"
            style={lightboxButtonStyle()}
          >
            <Download size={16} />
          </a>
          <button onClick={onClose} title="Close" style={lightboxButtonStyle()}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 60px 20px",
          position: "relative",
        }}
      >
        <img
          src={current.url}
          alt={current.filename}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        />

        {index > 0 && (
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            title="Previous"
            style={navButtonStyle("left")}
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {index < images.length - 1 && (
          <button
            onClick={() => setIndex((i) => Math.min(i + 1, images.length - 1))}
            title="Next"
            style={navButtonStyle("right")}
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}

function lightboxButtonStyle(): React.CSSProperties {
  return {
    width: 34,
    height: 34,
    borderRadius: 4,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    textDecoration: "none",
    fontFamily: "inherit",
  };
}

function navButtonStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    [side]: 12,
    width: 44,
    height: 44,
    borderRadius: 44,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontFamily: "inherit",
  } as React.CSSProperties;
}
