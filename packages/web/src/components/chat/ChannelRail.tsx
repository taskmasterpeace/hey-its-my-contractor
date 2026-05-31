"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  Plus,
  Hash,
  MessageCircle,
  Search,
  Check,
  X,
  MoreVertical,
  Settings,
  Trash2,
} from "lucide-react";
import type { Channel, ChatUser } from "@/hooks/useChatRealtime";

interface ChannelRailProps {
  channels: Channel[];
  members: Map<string, ChatUser>;
  currentUserId: string;
  activeChannelId: string | null;
  onlineUserIds: Set<string>;
  onSelect: (channelId: string) => void;
  onCreateDM: (otherUserId: string) => Promise<void>;
  onCreateGroup: (name: string, participants: string[]) => Promise<void>;
  onManageGroup: (channel: Channel) => void;
  onDeleteGroup: (channel: Channel) => Promise<void>;
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

function initialsFor(name: string | null | undefined) {
  const n = (name || "").trim();
  if (!n) return "?";
  const parts = n.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function displayNameOf(u: ChatUser | undefined, fallback: string) {
  if (!u) return fallback;
  return u.fullName || u.email?.split("@")[0] || fallback;
}

function formatPreviewTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (d.toDateString() === yesterday) return "Yest";
  const days = (now.getTime() - d.getTime()) / 86400000;
  if (days < 7) {
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dmPartnerId(channel: Channel, currentUserId: string): string | null {
  if (channel.type !== "direct") return null;
  return (channel.participants ?? []).find((p) => p !== currentUserId) ?? null;
}

function channelLabel(
  channel: Channel,
  currentUserId: string,
  members: Map<string, ChatUser>
): string {
  if (channel.type === "direct") {
    const otherId = dmPartnerId(channel, currentUserId);
    return otherId
      ? displayNameOf(members.get(otherId), "Direct message")
      : "Direct message";
  }
  return channel.name || "Untitled";
}

export function ChannelRail({
  channels,
  members,
  currentUserId,
  activeChannelId,
  onlineUserIds,
  onSelect,
  onCreateDM,
  onCreateGroup,
  onManageGroup,
  onDeleteGroup,
}: ChannelRailProps) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [menuChannelId, setMenuChannelId] = useState<string | null>(null);

  const { rooms, dms, dmPartnerSet } = useMemo(() => {
    const rooms: Channel[] = [];
    const dms: Channel[] = [];
    const dmPartnerSet = new Set<string>();
    for (const c of channels) {
      if (c.type === "direct") {
        dms.push(c);
        const other = dmPartnerId(c, currentUserId);
        if (other) dmPartnerSet.add(other);
      } else {
        rooms.push(c);
      }
    }
    return { rooms, dms, dmPartnerSet };
  }, [channels, currentUserId]);

  // People you could DM but haven't yet.
  const peopleDirectory = useMemo(() => {
    return Array.from(members.values())
      .filter((m) => m.id !== currentUserId)
      .filter((m) => !dmPartnerSet.has(m.id))
      .sort((a, b) =>
        (a.fullName || a.email || "").localeCompare(b.fullName || b.email || "")
      );
  }, [members, currentUserId, dmPartnerSet]);

  // Close kebab when clicking elsewhere.
  useEffect(() => {
    const onClick = () => setMenuChannelId(null);
    if (menuChannelId) {
      window.addEventListener("click", onClick);
      return () => window.removeEventListener("click", onClick);
    }
  }, [menuChannelId]);

  return (
    <aside
      style={{
        width: 300,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--ft-paper)",
        borderRight: "1px solid var(--ft-rule)",
        minHeight: 0,
      }}
    >
      {/* Rail header */}
      <div
        style={{
          padding: "16px 18px 12px",
          borderBottom: "1px solid var(--ft-rule)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ft-steel)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Messages
          </div>
          <button
            onClick={() => setComposerOpen(true)}
            title="New conversation"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 10px",
              fontSize: 12,
              fontWeight: 600,
              background: "var(--ft-ink)",
              color: "#fff",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Plus size={13} />
            New
          </button>
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--ft-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          Project chat
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <RailSection title="Channels" count={rooms.length}>
          {rooms.length === 0 ? (
            <EmptyRow text="No channels yet" />
          ) : (
            rooms.map((c) => {
              const isCreator = c.type === "group" && c.createdBy === currentUserId;
              return (
                <RailRow
                  key={c.id}
                  active={c.id === activeChannelId}
                  onClick={() => onSelect(c.id)}
                  left={
                    <RoomIcon
                      name={channelLabel(c, currentUserId, members)}
                      kind={c.type === "project" ? "project" : "group"}
                    />
                  }
                  title={channelLabel(c, currentUserId, members)}
                  subtitle={previewText(c)}
                  time={formatPreviewTime(c.lastMessage?.createdAt)}
                  unread={c.unreadCount ?? 0}
                  menuOpen={menuChannelId === c.id}
                  renderMenu={
                    isCreator
                      ? () => (
                          <RowMenu
                            open={menuChannelId === c.id}
                            onOpen={(e) => {
                              e.stopPropagation();
                              setMenuChannelId(c.id);
                            }}
                            onClose={() => setMenuChannelId(null)}
                            items={[
                              {
                                label: "Manage members",
                                icon: Settings,
                                onClick: () => {
                                  setMenuChannelId(null);
                                  onManageGroup(c);
                                },
                              },
                              {
                                label: "Delete group",
                                icon: Trash2,
                                danger: true,
                                onClick: async () => {
                                  setMenuChannelId(null);
                                  if (
                                    confirm(
                                      `Delete "${c.name}"? This removes the group and all its messages for everyone.`
                                    )
                                  ) {
                                    await onDeleteGroup(c);
                                  }
                                },
                              },
                            ]}
                          />
                        )
                      : undefined
                  }
                />
              );
            })
          )}
        </RailSection>

        {dms.length > 0 && (
          <RailSection title="Direct messages" count={dms.length}>
            {dms.map((c) => {
              const otherId = dmPartnerId(c, currentUserId);
              const other = otherId ? members.get(otherId) : undefined;
              const name = channelLabel(c, currentUserId, members);
              return (
                <RailRow
                  key={c.id}
                  active={c.id === activeChannelId}
                  onClick={() => onSelect(c.id)}
                  left={
                    <PersonAvatar
                      id={otherId || c.id}
                      name={name}
                      online={otherId ? onlineUserIds.has(otherId) : false}
                    />
                  }
                  title={name}
                  subtitle={previewText(c) || other?.email || ""}
                  time={formatPreviewTime(c.lastMessage?.createdAt)}
                  unread={c.unreadCount ?? 0}
                />
              );
            })}
          </RailSection>
        )}

        {/* People directory — start a new DM with anyone you haven't yet */}
        {peopleDirectory.length > 0 && (
          <RailSection title="People on this project" count={peopleDirectory.length}>
            {peopleDirectory.map((m) => {
              const name = m.fullName || m.email?.split("@")[0] || "Unknown";
              return (
                <button
                  key={m.id}
                  onClick={async () => {
                    await onCreateDM(m.id);
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr auto",
                    gap: 10,
                    alignItems: "center",
                    padding: "8px 18px 8px 15px",
                    borderLeft: "3px solid transparent",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--ft-paper-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <PersonAvatar
                    id={m.id}
                    name={name}
                    online={onlineUserIds.has(m.id)}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ft-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ft-steel)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {onlineUserIds.has(m.id) ? "Online · click to message" : "Click to message"}
                    </div>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: "var(--ft-steel)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    DM
                  </span>
                </button>
              );
            })}
          </RailSection>
        )}
      </div>

      {composerOpen && (
        <NewConversationComposer
          currentUserId={currentUserId}
          existingDMs={dms}
          people={Array.from(members.values()).filter(
            (m) => m.id !== currentUserId
          )}
          onClose={() => setComposerOpen(false)}
          onCreateDM={async (otherId) => {
            await onCreateDM(otherId);
            setComposerOpen(false);
          }}
          onCreateGroup={async (name, participants) => {
            await onCreateGroup(name, participants);
            setComposerOpen(false);
          }}
        />
      )}
    </aside>
  );
}

function previewText(c: Channel) {
  const lm = c.lastMessage;
  if (!lm) return "";
  if (!lm.content) return "Sent an attachment";
  return lm.content;
}

function RailSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: "10px 0 4px" }}>
      <div
        className="mono"
        style={{
          padding: "0 18px 6px",
          fontSize: 9,
          color: "var(--ft-steel)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{title}</span>
        <span style={{ color: "var(--ft-steel-2)" }}>{count}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "10px 18px 14px",
        fontSize: 12,
        color: "var(--ft-steel-2)",
        fontStyle: "italic",
      }}
    >
      {text}
    </div>
  );
}

function RailRow({
  active,
  onClick,
  left,
  title,
  subtitle,
  time,
  unread,
  renderMenu,
  menuOpen,
}: {
  active: boolean;
  onClick: () => void;
  left: React.ReactNode;
  title: string;
  subtitle: string;
  time: string;
  unread: number;
  renderMenu?: () => React.ReactNode;
  menuOpen?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: active ? "var(--ft-paper-2)" : hover ? "var(--ft-paper-2)" : "transparent",
        borderLeft: `3px solid ${active ? "var(--ft-yellow)" : "transparent"}`,
        transition: "background 80ms ease",
      }}
    >
      <button
        onClick={onClick}
        style={{
          display: "grid",
          gridTemplateColumns: "32px 1fr auto",
          gap: 10,
          alignItems: "center",
          padding: "10px 18px 10px 15px",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          background: "transparent",
          fontFamily: "inherit",
          width: "100%",
        }}
      >
        <div>{left}</div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: unread > 0 ? 700 : 500,
              color: "var(--ft-ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: unread > 0 ? "var(--ft-ink-soft)" : "var(--ft-steel)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 2,
            }}
          >
            {subtitle || <span style={{ color: "var(--ft-steel-2)" }}>—</span>}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <span
            className="mono"
            style={{ fontSize: 10, color: "var(--ft-steel)" }}
          >
            {time}
          </span>
          {unread > 0 && (
            <span
              className="mono"
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "var(--ft-yellow)",
                color: "var(--ft-yellow-ink)",
                padding: "1px 7px",
                borderRadius: 10,
                minWidth: 18,
                textAlign: "center",
                letterSpacing: "0.04em",
              }}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </button>
      {renderMenu && (hover || menuOpen) && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 5,
          }}
        >
          {renderMenu()}
        </div>
      )}
    </div>
  );
}

function RoomIcon({ name, kind }: { name: string; kind: "project" | "group" }) {
  const Icon = kind === "project" ? Hash : MessageCircle;
  return (
    <div
      title={name}
      style={{
        width: 32,
        height: 32,
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
      <Icon size={14} />
    </div>
  );
}

function PersonAvatar({
  id,
  name,
  online,
}: {
  id: string;
  name: string;
  online: boolean;
}) {
  return (
    <div style={{ position: "relative", width: 32, height: 32 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 32,
          background: colorFor(id),
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        {initialsFor(name)}
      </div>
      {online && (
        <span
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: 9,
            height: 9,
            borderRadius: 9,
            background: "#27AE60",
            border: "2px solid var(--ft-paper)",
          }}
        />
      )}
    </div>
  );
}

// ============================ ROW MENU (kebab) ============================

function RowMenu({
  open,
  onOpen,
  onClose,
  items,
}: {
  open: boolean;
  onOpen: (e: React.MouseEvent) => void;
  onClose: () => void;
  items: Array<{
    label: string;
    icon: typeof Settings;
    onClick: () => void;
    danger?: boolean;
  }>;
}) {
  return (
    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => (open ? onClose() : onOpen(e))}
        title="More"
        style={{
          width: 24,
          height: 24,
          borderRadius: 3,
          background: open ? "var(--ft-paper)" : "rgba(255,255,255,0.6)",
          border: "1px solid var(--ft-rule-2)",
          color: "var(--ft-steel)",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
        }}
      >
        <MoreVertical size={13} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: 4,
            minWidth: 160,
            background: "var(--ft-paper)",
            border: "1px solid var(--ft-rule)",
            borderRadius: 4,
            boxShadow: "0 8px 24px rgba(26,35,51,0.14)",
            display: "flex",
            flexDirection: "column",
            padding: 4,
            zIndex: 20,
          }}
        >
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.label}
                onClick={it.onClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  fontSize: 13,
                  color: it.danger ? "var(--ft-rust)" : "var(--ft-ink)",
                  background: "transparent",
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--ft-paper-2)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <Icon size={13} />
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================ COMPOSER ============================

function NewConversationComposer({
  currentUserId,
  existingDMs,
  people,
  onClose,
  onCreateDM,
  onCreateGroup,
}: {
  currentUserId: string;
  existingDMs: Channel[];
  people: ChatUser[];
  onClose: () => void;
  onCreateDM: (otherUserId: string) => Promise<void>;
  onCreateGroup: (name: string, participants: string[]) => Promise<void>;
}) {
  const [mode, setMode] = useState<"dm" | "group">("dm");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 30);
  }, [mode]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dmPartners = useMemo(() => {
    const set = new Set<string>();
    for (const d of existingDMs) {
      for (const p of d.participants ?? []) {
        if (p !== currentUserId) set.add(p);
      }
    }
    return set;
  }, [existingDMs, currentUserId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people
      .filter((p) => {
        if (!q) return true;
        const n = (p.fullName || p.email || "").toLowerCase();
        return n.includes(q);
      })
      .sort((a, b) => {
        const an = a.fullName || a.email || "";
        const bn = b.fullName || b.email || "";
        return an.localeCompare(bn);
      });
  }, [people, query]);

  const togglePick = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (busy) return;
    if (mode === "group") {
      if (!name.trim() || picked.size === 0) return;
      setBusy(true);
      try {
        await onCreateGroup(name.trim(), Array.from(picked));
      } finally {
        setBusy(false);
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,35,51,0.32)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 440,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--ft-paper)",
          border: "1px solid var(--ft-rule)",
          borderRadius: 6,
          boxShadow: "0 12px 40px rgba(26,35,51,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px 12px",
            borderBottom: "1px solid var(--ft-rule)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ft-steel)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              New conversation
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
              {mode === "dm" ? "Send a direct message" : "Create a group"}
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ft-steel)",
              padding: 4,
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "inherit",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            padding: "10px 18px",
            gap: 6,
            borderBottom: "1px solid var(--ft-rule)",
          }}
        >
          <ModeChip active={mode === "dm"} onClick={() => setMode("dm")}>
            Direct message
          </ModeChip>
          <ModeChip active={mode === "group"} onClick={() => setMode("group")}>
            Group
          </ModeChip>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "12px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {mode === "group" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name — e.g. Kitchen crew"
              style={{
                padding: "10px 12px",
                border: "1px solid var(--ft-rule-2)",
                borderRadius: 3,
                fontSize: 13,
                fontFamily: "inherit",
                background: "var(--ft-paper)",
                color: "var(--ft-ink)",
                outline: "none",
              }}
            />
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              border: "1px solid var(--ft-rule-2)",
              borderRadius: 3,
              background: "var(--ft-paper-2)",
            }}
          >
            <Search size={14} style={{ color: "var(--ft-steel)" }} />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "dm" ? "Search project members…" : "Add people…"
              }
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: 13,
                fontFamily: "inherit",
                color: "var(--ft-ink)",
                outline: "none",
              }}
            />
            {mode === "group" && picked.size > 0 && (
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--ft-steel)",
                  letterSpacing: "0.06em",
                }}
              >
                {picked.size} picked
              </span>
            )}
          </div>
        </div>

        {/* People list */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 8px 8px" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "16px 14px",
                color: "var(--ft-steel-2)",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {people.length === 0
                ? "No one else on this project yet."
                : "No matches"}
            </div>
          ) : (
            filtered.map((p) => {
              const personName =
                p.fullName || p.email?.split("@")[0] || "Unknown";
              const isPicked = picked.has(p.id);
              const hasDM = mode === "dm" && dmPartners.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={async () => {
                    if (mode === "dm") {
                      if (busy) return;
                      setBusy(true);
                      try {
                        await onCreateDM(p.id);
                      } finally {
                        setBusy(false);
                      }
                    } else {
                      togglePick(p.id);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 10px",
                    border: "none",
                    background: isPicked
                      ? "var(--ft-hi-vis-soft)"
                      : "transparent",
                    cursor: "pointer",
                    borderRadius: 3,
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!isPicked)
                      e.currentTarget.style.background = "var(--ft-paper-2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isPicked)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 30,
                      background: colorFor(p.id),
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {initialsFor(personName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--ft-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {personName}
                    </div>
                    {p.email && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--ft-steel)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.email}
                      </div>
                    )}
                  </div>
                  {hasDM && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 9,
                        color: "var(--ft-steel-2)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      OPEN DM
                    </span>
                  )}
                  {mode === "group" && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 3,
                        border: `1.5px solid ${
                          isPicked ? "var(--ft-hi-vis-deep)" : "var(--ft-rule-2)"
                        }`,
                        background: isPicked ? "var(--ft-hi-vis-deep)" : "transparent",
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isPicked && <Check size={12} />}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer for group create */}
        {mode === "group" && (
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--ft-rule)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              background: "var(--ft-paper-2)",
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: "8px 14px",
                background: "var(--ft-paper)",
                color: "var(--ft-ink)",
                border: "1px solid var(--ft-rule-2)",
                borderRadius: 3,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || picked.size === 0 || busy}
              style={{
                padding: "8px 16px",
                background:
                  !name.trim() || picked.size === 0 || busy
                    ? "var(--ft-steel-2)"
                    : "var(--ft-ink)",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                cursor:
                  !name.trim() || picked.size === 0 || busy
                    ? "not-allowed"
                    : "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {busy ? "Creating…" : `Create group · ${picked.size + 1}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 600,
        background: active ? "var(--ft-ink)" : "transparent",
        color: active ? "#fff" : "var(--ft-steel)",
        border: `1px solid ${active ? "var(--ft-ink)" : "var(--ft-rule-2)"}`,
        borderRadius: 3,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}
