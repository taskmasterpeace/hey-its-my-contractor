"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileType2,
} from "lucide-react";
import type {
  Message,
  ChatUser,
  ChatAttachment,
} from "@/hooks/useChatRealtime";
import { Lightbox } from "./Lightbox";

interface ReadViewer {
  id: string;
  name: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showHeader: boolean;
  readers: ReadViewer[];
  onEdit?: (messageId: string, content: string) => void | Promise<void>;
  onDelete?: (messageId: string) => void | Promise<void>;
}

const AVATAR_PALETTE = [
  "#2D5A6A",
  "#7A4E2A",
  "#4A3A00",
  "#3E5C2F",
  "#5A2D6A",
  "#6A2D3E",
];

function colorFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function initialsFor(user: ChatUser | { fullName?: string | null; email?: string | null }) {
  const name = user.fullName || user.email || "";
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function displayName(user: ChatUser) {
  return user.fullName || user.email?.split("@")[0] || "Unknown";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExt(filename: string) {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i + 1).toUpperCase() : "FILE";
}

function fileBadge(mime: string, filename: string) {
  const ext = fileExt(filename);
  if (mime === "application/pdf" || ext === "PDF") {
    return { tint: "#C9472D", soft: "#FBE8E2", icon: FileType2 };
  }
  if (
    ext === "XLS" || ext === "XLSX" || ext === "CSV" ||
    mime.includes("spreadsheet") || mime === "text/csv"
  ) {
    return { tint: "#1E6E3A", soft: "#E2F0E6", icon: FileSpreadsheet };
  }
  if (ext === "DOC" || ext === "DOCX" || mime.includes("word")) {
    return { tint: "#1B4FA8", soft: "#E6EEFB", icon: FileText };
  }
  return { tint: "#54607A", soft: "#EEF2F8", icon: FileText };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// =================== Image grid + file list ===================

function ImageTile({
  attachment,
  width,
  height,
  onOpen,
  overlayCount,
}: {
  attachment: ChatAttachment;
  width: number;
  height: number;
  onOpen: () => void;
  overlayCount?: number;
}) {
  return (
    <button
      onClick={onOpen}
      title={attachment.filename}
      style={{
        position: "relative",
        width,
        height,
        border: "1px solid var(--ft-rule)",
        padding: 0,
        background: "var(--ft-paper-2)",
        cursor: "pointer",
        borderRadius: 3,
        overflow: "hidden",
        fontFamily: "inherit",
      }}
    >
      <img
        src={attachment.url}
        alt={attachment.filename}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {overlayCount && overlayCount > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8,12,22,0.55)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          +{overlayCount}
        </div>
      )}
    </button>
  );
}

function ImageGrid({
  images,
  onOpen,
}: {
  images: ChatAttachment[];
  onOpen: (index: number) => void;
}) {
  if (images.length === 0) return null;

  // 1 image: single, contain-style up to 320 wide
  if (images.length === 1) {
    const a = images[0];
    return (
      <button
        onClick={() => onOpen(0)}
        title={a.filename}
        style={{
          padding: 0,
          border: "1px solid var(--ft-rule)",
          background: "var(--ft-paper-2)",
          cursor: "pointer",
          borderRadius: 3,
          overflow: "hidden",
          maxWidth: 360,
          fontFamily: "inherit",
        }}
      >
        <img
          src={a.url}
          alt={a.filename}
          style={{
            display: "block",
            maxWidth: 360,
            maxHeight: 360,
            width: "100%",
            height: "auto",
            objectFit: "cover",
          }}
        />
      </button>
    );
  }

  if (images.length === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, maxWidth: 360 }}>
        {images.map((a, i) => (
          <ImageTile
            key={a.id}
            attachment={a}
            width={178}
            height={178}
            onOpen={() => onOpen(i)}
          />
        ))}
      </div>
    );
  }

  if (images.length === 3) {
    // 1 large left + 2 stacked right
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "236px 116px",
          gap: 4,
          maxWidth: 360,
        }}
      >
        <ImageTile
          attachment={images[0]}
          width={236}
          height={236}
          onOpen={() => onOpen(0)}
        />
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4 }}>
          <ImageTile attachment={images[1]} width={116} height={116} onOpen={() => onOpen(1)} />
          <ImageTile attachment={images[2]} width={116} height={116} onOpen={() => onOpen(2)} />
        </div>
      </div>
    );
  }

  // 4+ images: 2x2; if more than 4 show +N on the last tile
  const visible = images.slice(0, 4);
  const extra = images.length - 4;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 4,
        maxWidth: 360,
      }}
    >
      {visible.map((a, i) => (
        <ImageTile
          key={a.id}
          attachment={a}
          width={178}
          height={178}
          onOpen={() => onOpen(i)}
          overlayCount={i === 3 && extra > 0 ? extra : undefined}
        />
      ))}
    </div>
  );
}

function FileCard({
  attachment,
  isOwnMessage,
}: {
  attachment: ChatAttachment;
  isOwnMessage: boolean;
}) {
  const { tint, soft, icon: Icon } = fileBadge(attachment.mime, attachment.filename);
  const ext = fileExt(attachment.filename);
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.filename}
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        gap: 0,
        background: isOwnMessage ? "var(--ft-ink-soft)" : "var(--ft-paper)",
        color: isOwnMessage ? "var(--ft-paper)" : "var(--ft-ink)",
        border: `1px solid ${isOwnMessage ? "var(--ft-ink-soft)" : "var(--ft-rule)"}`,
        borderRadius: 4,
        textDecoration: "none",
        maxWidth: 360,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: 44,
          background: isOwnMessage ? "var(--ft-ink)" : soft,
          color: tint,
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          padding: "8px 6px",
        }}
      >
        <Icon size={18} />
        <span
          className="mono"
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.06em",
            marginTop: 4,
            color: isOwnMessage ? "var(--ft-paper)" : tint,
          }}
        >
          {ext}
        </span>
      </div>
      <div style={{ minWidth: 0, flex: 1, padding: "8px 12px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {attachment.filename}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: isOwnMessage ? "var(--ft-rail-ink-soft)" : "var(--ft-steel)",
            letterSpacing: "0.06em",
            marginTop: 2,
          }}
        >
          {formatSize(attachment.size)}
        </div>
      </div>
      <div
        style={{
          padding: "8px 12px",
          display: "inline-flex",
          alignItems: "center",
          color: isOwnMessage ? "var(--ft-paper)" : "var(--ft-steel)",
          flexShrink: 0,
        }}
      >
        <Download size={14} />
      </div>
    </a>
  );
}

// =================== Bubble ===================

export function MessageBubble({
  message,
  isOwnMessage,
  showHeader,
  readers,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isOptimistic = message.id.startsWith("optimistic-");

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(message.content);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(message.content);
  };

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === message.content) {
      cancelEdit();
      return;
    }
    setEditing(false);
    await onEdit?.(message.id, trimmed);
  };

  const handleEditKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;
    await onDelete?.(message.id);
  };

  const images = (message.attachments ?? []).filter((a) => a.type === "image");
  const files = (message.attachments ?? []).filter((a) => a.type !== "image");
  const lightboxImages = images.map((a) => ({ url: a.url, filename: a.filename }));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isOwnMessage ? "row-reverse" : "row",
        gap: 10,
        alignItems: "flex-end",
        opacity: isOptimistic ? 0.6 : 1,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar (only at top of group) */}
      <div style={{ width: 28, flexShrink: 0 }}>
        {showHeader && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 28,
              background: colorFor(message.userId),
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {initialsFor(message.user)}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 480, minWidth: 0 }}>
        {/* Header: name + time */}
        {showHeader && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: isOwnMessage ? "flex-end" : "flex-start",
              marginBottom: 4,
              alignItems: "baseline",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--ft-steel)" }}>
              {isOwnMessage ? "You" : displayName(message.user)}
            </span>
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--ft-steel)" }}
            >
              {formatTime(message.createdAt)}
            </span>
            {message.editedAt && (
              <span
                className="mono"
                style={{ fontSize: 10, color: "var(--ft-steel-2)" }}
              >
                · edited
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div style={{ position: "relative" }}>
          {editing ? (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--ft-paper)",
                border: "1px solid var(--ft-hi-vis)",
                borderRadius: 3,
              }}
            >
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleEditKey}
                rows={Math.min(6, Math.max(1, draft.split("\n").length))}
                style={{
                  width: "100%",
                  minWidth: 240,
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                  fontSize: 14,
                  lineHeight: 1.45,
                  fontFamily: "inherit",
                  color: "var(--ft-ink)",
                  background: "transparent",
                }}
              />
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 6,
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ft-steel-2)",
                    marginRight: "auto",
                  }}
                >
                  enter to save · esc to cancel
                </span>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    background: "var(--ft-paper)",
                    color: "var(--ft-ink)",
                    border: "1px solid var(--ft-rule-2)",
                    borderRadius: 3,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "inherit",
                  }}
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={saveEdit}
                  style={{
                    padding: "5px 10px",
                    fontSize: 12,
                    background: "var(--ft-ink)",
                    color: "#fff",
                    border: "1px solid var(--ft-ink)",
                    borderRadius: 3,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "inherit",
                  }}
                >
                  <Check size={12} /> Save
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: isOwnMessage ? "flex-end" : "flex-start",
              }}
            >
              {message.content && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: isOwnMessage
                      ? "var(--ft-ink)"
                      : "var(--ft-paper)",
                    color: isOwnMessage ? "var(--ft-paper)" : "var(--ft-ink)",
                    border: isOwnMessage ? "none" : "1px solid var(--ft-rule)",
                    borderRadius: 3,
                    fontSize: 14,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {message.content}
                </div>
              )}

              {images.length > 0 && (
                <ImageGrid
                  images={images}
                  onOpen={(idx) => setLightboxIndex(idx)}
                />
              )}

              {files.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%", alignItems: isOwnMessage ? "flex-end" : "flex-start" }}>
                  {files.map((a) => (
                    <FileCard
                      key={a.id}
                      attachment={a}
                      isOwnMessage={isOwnMessage}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hover actions (own message only, not while editing or optimistic) */}
          {hover && isOwnMessage && !editing && !isOptimistic && (
            <div
              style={{
                position: "absolute",
                top: -14,
                right: 4,
                display: "flex",
                gap: 0,
                background: "var(--ft-paper)",
                border: "1px solid var(--ft-rule-2)",
                borderRadius: 3,
                boxShadow: "0 2px 8px rgba(26,35,51,0.08)",
              }}
            >
              <button
                onClick={startEdit}
                title="Edit"
                style={{
                  padding: "4px 8px",
                  background: "transparent",
                  border: "none",
                  borderRight: "1px solid var(--ft-rule)",
                  cursor: "pointer",
                  color: "var(--ft-steel)",
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "inherit",
                }}
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={handleDelete}
                title="Delete"
                style={{
                  padding: "4px 8px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ft-rust)",
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "inherit",
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Read receipts: avatar stack of viewers (only on last own message) */}
        {readers.length > 0 && (
          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 9, color: "var(--ft-steel-2)" }}
            >
              SEEN
            </span>
            <div style={{ display: "flex" }}>
              {readers.slice(0, 5).map((r, i) => (
                <div
                  key={r.id}
                  title={r.name}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 16,
                    background: colorFor(r.id),
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 600,
                    border: "1.5px solid var(--ft-paper-2)",
                    marginLeft: i === 0 ? 0 : -5,
                    flexShrink: 0,
                  }}
                >
                  {initialsFor({ fullName: r.name })}
                </div>
              ))}
              {readers.length > 5 && (
                <span
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "var(--ft-steel-2)",
                    marginLeft: 4,
                    alignSelf: "center",
                  }}
                >
                  +{readers.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
