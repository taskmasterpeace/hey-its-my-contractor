"use client";

import { useState, KeyboardEvent } from "react";
import { Paperclip, Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void | Promise<void>;
  placeholder?: string;
}

export function MessageInput({
  onSendMessage,
  placeholder = "Message — anything here is searchable across the project",
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await onSendMessage(trimmed);
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
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={placeholder}
          rows={1}
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
          }}
        />
        <button
          type="button"
          title="Attach file (coming soon)"
          style={{
            padding: "10px 12px",
            background: "var(--ft-paper)",
            color: "var(--ft-steel)",
            border: "1px solid var(--ft-rule-2)",
            borderRadius: 3,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Paperclip size={16} />
        </button>
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          style={{
            padding: "10px 18px",
            background:
              !text.trim() || sending ? "var(--ft-steel-2)" : "var(--ft-ink)",
            color: "#fff",
            border: "none",
            borderRadius: 3,
            cursor: !text.trim() || sending ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            fontSize: 13.5,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Send size={14} />
          Send
        </button>
      </div>
    </div>
  );
}
