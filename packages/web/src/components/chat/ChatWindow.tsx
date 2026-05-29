"use client";

import { useRef, useEffect, useMemo } from "react";
import type { Channel, Message, ChatUser } from "@/hooks/useChatRealtime";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

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

function initialsForId(id: string, nameLookup: Map<string, string>) {
  const name = nameLookup.get(id) || "";
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return id.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface ChatWindowProps {
  channel: Channel;
  messages: Message[];
  members: Map<string, ChatUser>;
  currentUserId: string;
  onlineUserIds: Set<string>;
  reads: Map<string, string>; // userId -> lastReadAt ISO
  messagesReady: boolean;
  onSendMessage: (content: string) => void | Promise<void>;
  onEditMessage: (messageId: string, content: string) => void | Promise<void>;
  onDeleteMessage: (messageId: string) => void | Promise<void>;
}

export function ChatWindow({
  channel,
  messages,
  members,
  currentUserId,
  onlineUserIds,
  reads,
  messagesReady,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
}: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // userId -> name (project members first, supplemented by names seen in messages)
  const nameLookup = useMemo(() => {
    const m = new Map<string, string>();
    for (const [id, info] of members.entries()) {
      const n = info.fullName || info.email?.split("@")[0];
      if (n) m.set(id, n);
    }
    for (const msg of messages) {
      if (m.has(msg.userId)) continue;
      const n = msg.user.fullName || msg.user.email?.split("@")[0];
      if (n) m.set(msg.userId, n);
    }
    return m;
  }, [members, messages]);

  // Online members (self first, then others)
  const onlineList = useMemo(() => {
    const others = Array.from(onlineUserIds).filter((id) => id !== currentUserId);
    return onlineUserIds.has(currentUserId)
      ? [currentUserId, ...others]
      : others;
  }, [onlineUserIds, currentUserId]);

  // Find the last own message and compute who's read it
  const lastOwnMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].userId === currentUserId) return messages[i].id;
    }
    return null;
  }, [messages, currentUserId]);

  const readersByMessageId = useMemo(() => {
    const result = new Map<
      string,
      Array<{ id: string; name: string }>
    >();
    if (!lastOwnMessageId) return result;
    const lastOwn = messages.find((m) => m.id === lastOwnMessageId);
    if (!lastOwn) return result;
    const lastOwnTime = new Date(lastOwn.createdAt).getTime();
    const list: Array<{ id: string; name: string }> = [];
    for (const [uid, lastReadIso] of reads.entries()) {
      if (uid === currentUserId) continue;
      if (new Date(lastReadIso).getTime() >= lastOwnTime) {
        list.push({ id: uid, name: nameLookup.get(uid) || uid.slice(0, 6) });
      }
    }
    result.set(lastOwnMessageId, list);
    return result;
  }, [lastOwnMessageId, messages, reads, currentUserId, nameLookup]);

  // Group messages by date
  const groups = useMemo(() => {
    const out: Array<{ date: string; messages: Message[] }> = [];
    for (const m of messages) {
      const dateKey = new Date(m.createdAt).toDateString();
      const last = out[out.length - 1];
      if (last && last.date === dateKey) last.messages.push(m);
      else out.push({ date: dateKey, messages: [m] });
    }
    return out;
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--ft-rule)",
          background: "var(--ft-paper)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ft-steel)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Messages
          </div>
          <div style={{ fontSize: 12, color: "var(--ft-steel)", marginTop: 4 }}>
            {channel.participants?.length ?? 0} members
          </div>
        </div>

        {/* Presence: avatar stack + N online */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {onlineList.length > 0 && (
            <div style={{ display: "flex", alignItems: "center" }}>
              {onlineList.slice(0, 4).map((uid, i) => {
                const isSelf = uid === currentUserId;
                return (
                  <div
                    key={uid}
                    title={isSelf ? "You" : nameLookup.get(uid) || "online"}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 24,
                      background: colorFor(uid),
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 600,
                      border: isSelf
                        ? "2px solid var(--ft-hi-vis)"
                        : "2px solid var(--ft-paper)",
                      marginLeft: i === 0 ? 0 : -7,
                      position: "relative",
                    }}
                  >
                    {isSelf ? "YOU" : initialsForId(uid, nameLookup)}
                  </div>
                );
              })}
              {onlineList.length > 4 && (
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ft-steel)",
                    marginLeft: 4,
                  }}
                >
                  +{onlineList.length - 4}
                </span>
              )}
            </div>
          )}
          <span
            className="mono"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "5px 9px",
              borderRadius: 100,
              background:
                onlineList.length > 0
                  ? "var(--ft-hi-vis-soft)"
                  : "var(--ft-paper-2)",
              color:
                onlineList.length > 0
                  ? "var(--ft-hi-vis-deep)"
                  : "var(--ft-steel)",
              border: `1px solid ${
                onlineList.length > 0
                  ? "var(--ft-hi-vis-soft)"
                  : "var(--ft-rule)"
              }`,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 6,
                background:
                  onlineList.length > 0
                    ? "var(--ft-yellow)"
                    : "var(--ft-steel-2)",
                boxShadow:
                  onlineList.length > 0
                    ? "0 0 0 3px rgba(255,218,41,0.28)"
                    : "none",
              }}
            />
            {onlineList.length} online
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: "var(--ft-paper-2)",
        }}
      >
        {!messagesReady ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ft-steel-2)",
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 10, letterSpacing: "0.12em" }}
            >
              LOADING MESSAGES…
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ft-steel)",
              gap: 6,
            }}
          >
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.12em" }}>
              NO MESSAGES YET
            </div>
            <div style={{ fontSize: 14 }}>
              Start the conversation — anything here is searchable across the project.
            </div>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.date} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                className="mono"
                style={{
                  alignSelf: "center",
                  fontSize: 11,
                  color: "var(--ft-steel)",
                  letterSpacing: "0.08em",
                }}
              >
                — {formatDateLabel(g.date)} —
              </div>
              {g.messages.map((m, idx) => {
                const prev = idx > 0 ? g.messages[idx - 1] : null;
                const showHeader =
                  !prev ||
                  prev.userId !== m.userId ||
                  new Date(m.createdAt).getTime() -
                    new Date(prev.createdAt).getTime() >
                    5 * 60 * 1000;
                const resolvedUser =
                  m.user.fullName || m.user.email
                    ? m.user
                    : members.get(m.userId) ?? m.user;
                return (
                  <MessageBubble
                    key={m.id}
                    message={{ ...m, user: resolvedUser }}
                    isOwnMessage={m.userId === currentUserId}
                    showHeader={showHeader}
                    readers={readersByMessageId.get(m.id) ?? []}
                    onEdit={onEditMessage}
                    onDelete={onDeleteMessage}
                  />
                );
              })}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
