"use client";

import { useRef, useEffect, useMemo } from "react";
import { Hash, Users as UsersIcon, AtSign } from "lucide-react";
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
  onSendMessage: (content: string, files?: File[]) => void | Promise<void>;
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

  // userId -> display name (members + names seen in messages)
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

  // Resolve title / subtitle / kind based on channel type
  const { title, subtitle, kindLabel, KindIcon, memberIds } = useMemo(() => {
    const participants = channel.participants ?? [];
    if (channel.type === "direct") {
      const otherId = participants.find((p) => p !== currentUserId);
      const other = otherId ? members.get(otherId) : undefined;
      const otherName =
        other?.fullName || other?.email?.split("@")[0] || "Direct message";
      const otherEmail = other?.email || "";
      const isOnline = otherId ? onlineUserIds.has(otherId) : false;
      return {
        title: otherName,
        subtitle: isOnline ? "Online now" : otherEmail || "Direct message",
        kindLabel: "DIRECT",
        KindIcon: AtSign,
        memberIds: participants,
      };
    }
    if (channel.type === "group") {
      return {
        title: channel.name || "Group",
        subtitle: `${participants.length} members`,
        kindLabel: "GROUP",
        KindIcon: UsersIcon,
        memberIds: participants,
      };
    }
    // 'project' (or fallback)
    // For project type, participants stores everyone-on-project; if empty, fall back to known members.
    const ids = participants.length > 0 ? participants : Array.from(members.keys());
    return {
      title: channel.name || "Project chat",
      subtitle: `${ids.length} members · project channel`,
      kindLabel: "CHANNEL",
      KindIcon: Hash,
      memberIds: ids,
    };
  }, [channel, currentUserId, members, onlineUserIds]);

  // Online list scoped to channel membership (self first, then others)
  const onlineList = useMemo(() => {
    const set = new Set(memberIds);
    const onlineInChannel = Array.from(onlineUserIds).filter((id) => set.has(id));
    const others = onlineInChannel.filter((id) => id !== currentUserId);
    return onlineInChannel.includes(currentUserId)
      ? [currentUserId, ...others]
      : others;
  }, [memberIds, onlineUserIds, currentUserId]);

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
          padding: "14px 24px",
          borderBottom: "1px solid var(--ft-rule)",
          background: "var(--ft-paper)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0, display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              background: "var(--ft-paper-2)",
              border: "1px solid var(--ft-rule)",
              color: "var(--ft-ink)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <KindIcon size={16} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--ft-ink)",
                  letterSpacing: "-0.005em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  margin: 0,
                }}
              >
                {title}
              </h2>
              <span
                className="mono"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  padding: "2px 6px",
                  background: "var(--ft-paper-2)",
                  color: "var(--ft-steel)",
                  border: "1px solid var(--ft-rule)",
                  borderRadius: 3,
                  flexShrink: 0,
                }}
              >
                {kindLabel}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ft-steel)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </div>
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
          <MessagesLoadingSkeleton />
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
            <div style={{ fontSize: 14, maxWidth: 360, textAlign: "center" }}>
              {channel.type === "direct"
                ? `Say hi to ${title}. Anything here stays between the two of you.`
                : "Start the conversation — anything here is searchable across the project."}
            </div>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.date} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  alignSelf: "center",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  maxWidth: 480,
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--ft-rule)" }} />
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ft-steel)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {formatDateLabel(g.date)}
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--ft-rule)" }} />
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

      <MessageInput
        onSendMessage={onSendMessage}
        placeholder={
          channel.type === "direct"
            ? `Message ${title}`
            : `Message #${channel.name || "channel"}`
        }
      />
    </div>
  );
}

function MessagesLoadingSkeleton() {
  // Mix of own + other bubbles, varied widths, so the loading state looks like a real conversation.
  const layout: Array<{ mine: boolean; widths: number[]; header: boolean }> = [
    { mine: false, widths: [62, 40], header: true },
    { mine: true, widths: [52], header: true },
    { mine: false, widths: [70, 48, 30], header: true },
    { mine: true, widths: [44], header: true },
  ];
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        opacity: 0.9,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          maxWidth: 360,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--ft-rule)" }} />
        <div className="ft-skel" style={{ height: 10, width: 60 }} />
        <div style={{ flex: 1, height: 1, background: "var(--ft-rule)" }} />
      </div>
      {layout.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: row.mine ? "row-reverse" : "row",
            gap: 10,
            alignItems: "flex-end",
          }}
        >
          <div style={{ width: 28, flexShrink: 0 }}>
            {row.header && (
              <div
                className="ft-skel"
                style={{ width: 28, height: 28, borderRadius: 28 }}
              />
            )}
          </div>
          <div style={{ maxWidth: 480, minWidth: 220, flex: "0 1 480px" }}>
            {row.header && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: row.mine ? "flex-end" : "flex-start",
                  marginBottom: 6,
                }}
              >
                <div className="ft-skel" style={{ height: 10, width: 78 }} />
                <div className="ft-skel" style={{ height: 10, width: 36 }} />
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                alignItems: row.mine ? "flex-end" : "flex-start",
              }}
            >
              {row.widths.map((w, j) => (
                <div
                  key={j}
                  className="ft-skel"
                  style={{
                    height: 36,
                    width: `${w}%`,
                    borderRadius: 3,
                    minWidth: 70,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
