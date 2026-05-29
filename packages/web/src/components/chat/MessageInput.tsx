"use client";

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import { Paperclip, Send, X, FileText } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => void | Promise<void>;
  placeholder?: string;
}

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 5;
const ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageInput({
  onSendMessage,
  placeholder = "Message — anything here is searchable across the project",
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build blob URLs for image previews and clean them up when files change.
  const previewUrls = useMemo(
    () =>
      files.map((f) =>
        f.type.startsWith("image/") ? URL.createObjectURL(f) : null
      ),
    [files]
  );
  useEffect(() => {
    return () => {
      for (const u of previewUrls) {
        if (u) URL.revokeObjectURL(u);
      }
    };
  }, [previewUrls]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const list = Array.from(incoming);
    const next: File[] = [...files];
    let nextError: string | null = null;
    for (const f of list) {
      if (next.length >= MAX_FILES) {
        nextError = `Max ${MAX_FILES} files per message`;
        break;
      }
      if (f.size > MAX_SIZE_BYTES) {
        nextError = `${f.name} is over 25 MB`;
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    setError(nextError);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const send = async () => {
    const trimmed = text.trim();
    if (sending) return;
    if (!trimmed && files.length === 0) return;

    setSending(true);
    const filesToSend = files;
    setText("");
    setFiles([]);
    setError(null);
    try {
      await onSendMessage(trimmed, filesToSend.length > 0 ? filesToSend : undefined);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      style={{
        padding: "14px 24px",
        borderTop: "1px solid var(--ft-rule)",
        background: "var(--ft-paper-2)",
      }}
    >
      {/* Staging area — clearly indicates files are queued but not yet sent */}
      {files.length > 0 && (
        <div
          style={{
            marginBottom: 10,
            padding: "10px 12px",
            background: "var(--ft-paper)",
            border: "1px dashed var(--ft-hi-vis)",
            borderRadius: 4,
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ft-hi-vis-deep)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 6,
                  background: "var(--ft-yellow)",
                  boxShadow: "0 0 0 3px rgba(255,218,41,0.28)",
                }}
              />
              {files.length} {files.length === 1 ? "file" : "files"} ready · not
              sent yet
            </span>
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ft-steel-2)",
                letterSpacing: "0.06em",
              }}
            >
              press Send to share
            </span>
          </div>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
          >
            {files.map((f, i) => {
              const isImage = f.type.startsWith("image/");
              const previewUrl = previewUrls[i];
              return (
                <div
                  key={`${f.name}-${f.size}-${i}`}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: isImage ? 0 : "6px 8px 6px 10px",
                    background: "var(--ft-paper-2)",
                    border: "1px solid var(--ft-rule-2)",
                    borderRadius: 3,
                    fontSize: 12,
                    color: "var(--ft-ink)",
                    maxWidth: isImage ? 88 : 280,
                    overflow: "hidden",
                  }}
                >
                  {isImage && previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={f.name}
                      title={f.name}
                      style={{
                        display: "block",
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <>
                      <FileText
                        size={14}
                        style={{ color: "var(--ft-steel)" }}
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 180,
                        }}
                        title={f.name}
                      >
                        {f.name}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 10, color: "var(--ft-steel)" }}
                      >
                        {formatSize(f.size)}
                      </span>
                    </>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    title="Remove"
                    style={{
                      position: isImage ? "absolute" : "static",
                      top: isImage ? 4 : undefined,
                      right: isImage ? 4 : undefined,
                      padding: 2,
                      background: isImage
                        ? "rgba(26,35,51,0.7)"
                        : "transparent",
                      border: "none",
                      borderRadius: isImage ? 3 : 0,
                      cursor: "pointer",
                      color: isImage ? "#fff" : "var(--ft-steel)",
                      display: "inline-flex",
                      alignItems: "center",
                      fontFamily: "inherit",
                    }}
                  >
                    <X size={isImage ? 12 : 14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ft-rust)",
            marginBottom: 8,
            letterSpacing: "0.04em",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={
            files.length > 0
              ? "Add a caption (optional)…"
              : placeholder
          }
          rows={1}
          disabled={sending}
          style={{
            flex: 1,
            padding: "12px 14px",
            border: "1px solid var(--ft-rule-2)",
            borderRadius: 3,
            fontFamily: "inherit",
            fontSize: 14,
            lineHeight: 1.4,
            background: "var(--ft-paper)",
            color: "var(--ft-ink)",
            resize: "none",
            minHeight: 44,
            maxHeight: 160,
            outline: "none",
            opacity: sending ? 0.6 : 1,
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          style={{ display: "none" }}
          onChange={(e) => {
            addFiles(e.target.files);
            // Reset so re-selecting same file fires onChange.
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || files.length >= MAX_FILES}
          title="Attach file"
          style={{
            padding: "10px 12px",
            background: "var(--ft-paper)",
            color: "var(--ft-steel)",
            border: "1px solid var(--ft-rule-2)",
            borderRadius: 3,
            cursor:
              sending || files.length >= MAX_FILES ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            opacity: sending || files.length >= MAX_FILES ? 0.5 : 1,
          }}
        >
          <Paperclip size={16} />
        </button>
        <button
          onClick={send}
          disabled={sending || (!text.trim() && files.length === 0)}
          style={{
            padding: "10px 18px",
            background:
              sending || (!text.trim() && files.length === 0)
                ? "var(--ft-steel-2)"
                : files.length > 0
                ? "var(--ft-yellow)"
                : "var(--ft-ink)",
            color:
              files.length > 0 && !sending && (text.trim() || files.length > 0)
                ? "var(--ft-yellow-ink)"
                : "#fff",
            border: "none",
            borderRadius: 3,
            cursor:
              sending || (!text.trim() && files.length === 0)
                ? "not-allowed"
                : "pointer",
            fontFamily: "inherit",
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            boxShadow:
              files.length > 0 && !sending
                ? "0 0 0 3px rgba(255,218,41,0.28)"
                : "none",
          }}
        >
          <Send size={14} />
          {sending
            ? "Sending…"
            : files.length > 0
            ? `Send ${files.length}`
            : "Send"}
        </button>
      </div>
    </div>
  );
}
