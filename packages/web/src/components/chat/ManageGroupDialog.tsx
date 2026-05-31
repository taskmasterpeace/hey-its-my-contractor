"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Search, Trash2, Check } from "lucide-react";
import type { Channel, ChatUser } from "@/hooks/useChatRealtime";

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

function initialsFor(name: string) {
  const parts = name.split(/[\s@.]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function nameOf(u: ChatUser) {
  return u.fullName || u.email?.split("@")[0] || "Unknown";
}

interface ManageGroupDialogProps {
  channel: Channel;
  members: Map<string, ChatUser>; // all project members
  currentUserId: string;
  onClose: () => void;
  onUpdate: (input: { name?: string; participants?: string[] }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function ManageGroupDialog({
  channel,
  members,
  currentUserId,
  onClose,
  onUpdate,
  onDelete,
}: ManageGroupDialogProps) {
  const [name, setName] = useState(channel.name);
  const [participants, setParticipants] = useState<string[]>(
    () => channel.participants ?? []
  );
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const isCreator = channel.createdBy === currentUserId;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (picking) setTimeout(() => searchRef.current?.focus(), 30);
  }, [picking]);

  const memberRows = useMemo(() => {
    return participants
      .map((id) => members.get(id))
      .filter((u): u is ChatUser => !!u)
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  }, [participants, members]);

  const addableMembers = useMemo(() => {
    const set = new Set(participants);
    const q = query.trim().toLowerCase();
    return Array.from(members.values())
      .filter((m) => !set.has(m.id))
      .filter((m) => {
        if (!q) return true;
        const n = (m.fullName || m.email || "").toLowerCase();
        return n.includes(q);
      })
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  }, [members, participants, query]);

  const dirty =
    name.trim() !== channel.name ||
    JSON.stringify([...participants].sort()) !==
      JSON.stringify([...(channel.participants ?? [])].sort());

  const handleSave = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      const updates: { name?: string; participants?: string[] } = {};
      if (name.trim() !== channel.name) updates.name = name.trim();
      if (
        JSON.stringify([...participants].sort()) !==
        JSON.stringify([...(channel.participants ?? [])].sort())
      ) {
        updates.participants = participants;
      }
      await onUpdate(updates);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const removeMember = (id: string) => {
    if (id === currentUserId) return; // creator can't remove self
    setParticipants((prev) => prev.filter((p) => p !== id));
  };

  const addMember = (id: string) => {
    setParticipants((prev) => (prev.includes(id) ? prev : [...prev, id]));
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
        zIndex: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: 460,
          maxHeight: "85vh",
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
            padding: "16px 18px",
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
              Manage group
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>
              {channel.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--ft-steel)",
              padding: 4,
              fontFamily: "inherit",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Name */}
          <label
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ft-steel)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            Group name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isCreator}
              style={{
                padding: "9px 12px",
                border: "1px solid var(--ft-rule-2)",
                borderRadius: 3,
                fontSize: 13,
                fontFamily: "inherit",
                background: isCreator ? "var(--ft-paper)" : "var(--ft-paper-2)",
                color: "var(--ft-ink)",
                outline: "none",
                letterSpacing: "0",
                textTransform: "none",
              }}
            />
          </label>

          {/* Members section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--ft-steel)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Members · {participants.length}
              </span>
              {isCreator && (
                <button
                  onClick={() => setPicking((p) => !p)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: picking ? "var(--ft-ink)" : "var(--ft-paper-2)",
                    color: picking ? "#fff" : "var(--ft-ink)",
                    border: `1px solid ${picking ? "var(--ft-ink)" : "var(--ft-rule-2)"}`,
                    borderRadius: 3,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <Plus size={12} />
                  Add people
                </button>
              )}
            </div>

            <div
              style={{
                border: "1px solid var(--ft-rule)",
                borderRadius: 4,
                maxHeight: 200,
                overflowY: "auto",
                background: "var(--ft-paper)",
              }}
            >
              {memberRows.length === 0 ? (
                <div
                  style={{
                    padding: "12px 14px",
                    color: "var(--ft-steel-2)",
                    fontSize: 12,
                  }}
                >
                  No members
                </div>
              ) : (
                memberRows.map((m) => {
                  const display = nameOf(m);
                  const isSelf = m.id === currentUserId;
                  const isOwner = channel.createdBy === m.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderBottom: "1px solid var(--ft-rule)",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 28,
                          background: colorFor(m.id),
                          color: "#fff",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {initialsFor(display)}
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
                          {display}
                          {isSelf && (
                            <span
                              className="mono"
                              style={{
                                fontSize: 9,
                                color: "var(--ft-steel)",
                                letterSpacing: "0.08em",
                                marginLeft: 6,
                              }}
                            >
                              YOU
                            </span>
                          )}
                          {isOwner && !isSelf && (
                            <span
                              className="mono"
                              style={{
                                fontSize: 9,
                                color: "var(--ft-steel)",
                                letterSpacing: "0.08em",
                                marginLeft: 6,
                              }}
                            >
                              OWNER
                            </span>
                          )}
                        </div>
                        {m.email && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--ft-steel)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {m.email}
                          </div>
                        )}
                      </div>
                      {isCreator && !isSelf && (
                        <button
                          onClick={() => removeMember(m.id)}
                          title="Remove from group"
                          style={{
                            padding: "4px 8px",
                            background: "transparent",
                            color: "var(--ft-rust)",
                            border: "1px solid var(--ft-rule-2)",
                            borderRadius: 3,
                            cursor: "pointer",
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: "inherit",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <X size={11} />
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add picker (only when toggled) */}
            {isCreator && picking && (
              <div
                style={{
                  border: "1px solid var(--ft-rule)",
                  borderRadius: 4,
                  background: "var(--ft-paper-2)",
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    border: "1px solid var(--ft-rule-2)",
                    borderRadius: 3,
                    background: "var(--ft-paper)",
                  }}
                >
                  <Search size={13} style={{ color: "var(--ft-steel)" }} />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search project members…"
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      outline: "none",
                      fontFamily: "inherit",
                      fontSize: 13,
                      color: "var(--ft-ink)",
                    }}
                  />
                </div>
                <div style={{ maxHeight: 160, overflowY: "auto" }}>
                  {addableMembers.length === 0 ? (
                    <div
                      style={{
                        padding: "10px 8px",
                        color: "var(--ft-steel-2)",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      Everyone on this project is already in the group.
                    </div>
                  ) : (
                    addableMembers.map((m) => {
                      const display = nameOf(m);
                      return (
                        <button
                          key={m.id}
                          onClick={() => addMember(m.id)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "6px 8px",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: 3,
                            textAlign: "left",
                            fontFamily: "inherit",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = "var(--ft-paper)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 24,
                              background: colorFor(m.id),
                              color: "#fff",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 9,
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                          >
                            {initialsFor(display)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--ft-ink)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {display}
                            </div>
                          </div>
                          <Plus size={14} style={{ color: "var(--ft-steel)" }} />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Danger zone */}
        {isCreator && (
          <div
            style={{
              padding: "12px 18px",
              borderTop: "1px solid var(--ft-rule)",
              background: "var(--ft-paper-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {confirmingDelete ? (
              <>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ft-rust)",
                    letterSpacing: "0.04em",
                  }}
                >
                  This permanently removes the group + all messages.
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    disabled={busy}
                    style={{
                      padding: "6px 10px",
                      background: "var(--ft-paper)",
                      color: "var(--ft-ink)",
                      border: "1px solid var(--ft-rule-2)",
                      borderRadius: 3,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "inherit",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    style={{
                      padding: "6px 12px",
                      background: "var(--ft-rust)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 3,
                      cursor: busy ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Trash2 size={12} />
                    Delete group
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  style={{
                    padding: "6px 10px",
                    background: "transparent",
                    color: "var(--ft-rust)",
                    border: "1px solid var(--ft-rust)",
                    borderRadius: 3,
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Trash2 size={12} />
                  Delete group
                </button>
                <button
                  onClick={handleSave}
                  disabled={!dirty || busy}
                  style={{
                    padding: "7px 14px",
                    background: !dirty || busy ? "var(--ft-steel-2)" : "var(--ft-ink)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 3,
                    cursor: !dirty || busy ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "inherit",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Check size={13} />
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
