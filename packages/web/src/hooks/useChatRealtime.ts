"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatUser {
  id: string;
  fullName: string | null;
  email: string | null;
}

export interface ChatAttachment {
  id: string;
  type: "image" | "file";
  url: string;
  filename: string;
  size: number;
  mime: string;
  path?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: string; // 'project' | 'group' | 'direct'
  participants?: string[];
  createdBy?: string | null;
  lastMessage?: {
    content: string | null;
    createdAt: string;
    userId?: string;
  } | null;
  unreadCount?: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  editedAt: string | null;
  userId: string;
  user: ChatUser;
  attachments: ChatAttachment[];
}

export interface ReadReceipt {
  userId: string;
  lastReadAt: string;
}

interface CreateChannelInput {
  type: "group" | "direct";
  participants: string[]; // user ids (creator gets auto-added)
  name?: string;
}

interface UpdateChannelInput {
  channelId: string;
  name?: string;
  participants?: string[];
}

interface UseChatRealtimeReturn {
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  members: Map<string, ChatUser>;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  selectChannel: (channelId: string) => void;
  createChannel: (input: CreateChannelInput) => Promise<Channel | null>;
  updateChannel: (input: UpdateChannelInput) => Promise<Channel | null>;
  deleteChannel: (channelId: string) => Promise<boolean>;
  refreshChannels: () => Promise<void>;
  onlineUserIds: Set<string>;
  reads: Map<string, string>;
  loading: boolean;
  messagesReady: boolean;
}

const PRESENCE_KEY_PREFIX = "user:";

export function useChatRealtime(projectId: string): UseChatRealtimeReturn {
  const { user } = useAuth();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Map<string, ChatUser>>(new Map());
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [reads, setReads] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [messagesReady, setMessagesReady] = useState(false);

  const realtimeRef = useRef<RealtimeChannel | null>(null);
  const railRtRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());
  const membersRef = useRef<Map<string, ChatUser>>(new Map());
  const activeChannelIdRef = useRef<string | null>(null);

  // Keep refs in sync so realtime callbacks see the latest state without re-subscribing.
  membersRef.current = members;
  activeChannelIdRef.current = activeChannel?.id ?? null;

  const fetchChannels = useCallback(async (): Promise<Channel[]> => {
    if (!projectId) return [];
    const res = await fetch(`/api/project/${projectId}/chat`);
    if (!res.ok) return [];
    const body = await res.json();
    const list: Channel[] = (body.channels ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type ?? "project",
      participants: c.participants ?? [],
      createdBy: c.createdBy ?? c.created_by ?? null,
      lastMessage: c.lastMessage
        ? {
            content: c.lastMessage.content,
            createdAt: c.lastMessage.createdAt ?? c.lastMessage.created_at,
            userId: c.lastMessage.userId ?? c.lastMessage.user_id,
          }
        : null,
      unreadCount: c.unreadCount ?? 0,
      updatedAt: c.updatedAt ?? c.updated_at ?? new Date().toISOString(),
    }));
    setChannels(list);
    return list;
  }, [projectId]);

  // ---------- 1. Fetch channels + members on mount ----------
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [list, teamRes] = await Promise.all([
          fetchChannels(),
          fetch(`/api/project/${projectId}/team`),
        ]);

        if (cancelled) return;
        if (list.length > 0) setActiveChannel((prev) => prev ?? list[0]);

        if (teamRes.ok) {
          const teamBody = await teamRes.json();
          const memberList = (teamBody.data ?? teamBody.members ?? []) as Array<{
            id: string;
            fullName: string | null;
            email: string | null;
          }>;
          const map = new Map<string, ChatUser>();
          for (const m of memberList) {
            map.set(m.id, {
              id: m.id,
              fullName: m.fullName,
              email: m.email,
            });
          }
          if (!cancelled) setMembers(map);
        }
      } catch (err) {
        console.error("[useChatRealtime] init:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, fetchChannels]);

  // ---------- 2. Fetch messages + reads when active channel changes ----------
  useEffect(() => {
    if (!projectId || !activeChannel) return;
    let cancelled = false;
    setMessagesReady(false);

    (async () => {
      setLoading(true);
      try {
        const [msgRes, readRes] = await Promise.all([
          fetch(
            `/api/project/${projectId}/chat/${activeChannel.id}/messages?limit=50`
          ),
          fetch(`/api/project/${projectId}/chat/${activeChannel.id}/reads`),
        ]);

        if (!msgRes.ok) throw new Error("Failed to fetch messages");
        const msgBody = await msgRes.json();
        const list: Message[] = (msgBody.messages ?? []).map((m: any) => ({
          id: m.id,
          content: m.content,
          type: m.type ?? "text",
          createdAt: m.createdAt,
          editedAt: m.editedAt ?? null,
          userId: m.user?.id ?? m.userId,
          user: m.user ?? {
            id: m.userId,
            fullName: null,
            email: null,
          },
          attachments: Array.isArray(m.attachments) ? m.attachments : [],
        }));
        if (cancelled) return;
        setMessages(list);

        if (readRes.ok) {
          const readBody = await readRes.json();
          const map = new Map<string, string>();
          for (const r of readBody.reads ?? []) {
            map.set(r.userId, r.lastReadAt);
          }
          if (!cancelled) setReads(map);
        }
      } catch (err) {
        console.error("[useChatRealtime] fetchMessages:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setMessagesReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, activeChannel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- 3. Realtime subscription: messages + presence + reads (per active channel) ----------
  useEffect(() => {
    if (!activeChannel || !user) return;

    const supabase = supabaseRef.current;
    const channelId = activeChannel.id;
    const presenceKey = `${PRESENCE_KEY_PREFIX}${user.id}`;

    const rc = supabase
      .channel(`chat:${channelId}`, {
        config: { presence: { key: presenceKey } },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const r = payload.new as Record<string, any>;
          const memberInfo = membersRef.current.get(r.user_id);
          const incoming: Message = {
            id: r.id,
            content: r.content,
            type: r.type ?? "text",
            createdAt: r.created_at,
            editedAt: r.edited_at ?? null,
            userId: r.user_id,
            user: memberInfo ?? {
              id: r.user_id,
              fullName: null,
              email: null,
            },
            attachments: Array.isArray(r.attachments) ? r.attachments : [],
          };
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const r = payload.new as Record<string, any>;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === r.id
                ? { ...m, content: r.content, editedAt: r.edited_at ?? null }
                : m
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          // No filter: Postgres only includes the primary key in DELETE payloads
          // (unless REPLICA IDENTITY FULL is set), so a `channel_id=eq.X` filter
          // never matches. Match by id in the handler instead.
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          const r = payload.old as Record<string, any>;
          const id = r?.id;
          if (!id) return;
          setMessages((prev) => prev.filter((m) => m.id !== id));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_channel_reads",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const r = (payload.new ?? payload.old) as Record<string, any>;
          if (!r?.user_id) return;
          setReads((prev) => {
            const next = new Map(prev);
            if (payload.eventType === "DELETE") {
              next.delete(r.user_id);
            } else {
              next.set(r.user_id, r.last_read_at);
            }
            return next;
          });
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = rc.presenceState() as Record<
          string,
          Array<{ user_id?: string }>
        >;
        const ids = new Set<string>();
        for (const key of Object.keys(state)) {
          const id = key.startsWith(PRESENCE_KEY_PREFIX)
            ? key.slice(PRESENCE_KEY_PREFIX.length)
            : key;
          ids.add(id);
        }
        setOnlineUserIds(ids);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await rc.track({ user_id: user.id, online_at: Date.now() });
        }
      });

    realtimeRef.current = rc;
    return () => {
      supabase.removeChannel(rc);
      realtimeRef.current = null;
    };
  }, [activeChannel?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- 3b. Rail-level realtime: update last message + unread for ALL channels in the project ----------
  useEffect(() => {
    if (!user || channels.length === 0) return;
    const supabase = supabaseRef.current;
    const channelIds = channels.map((c) => c.id);

    const rc = supabase.channel(`chat-rail:${projectId}`);

    for (const cid of channelIds) {
      rc.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${cid}`,
        },
        (payload) => {
          const r = payload.new as Record<string, any>;
          const isOwn = r.user_id === user.id;
          const isActive = activeChannelIdRef.current === cid;
          setChannels((prev) =>
            prev.map((c) =>
              c.id === cid
                ? {
                    ...c,
                    lastMessage: {
                      content: r.content,
                      createdAt: r.created_at,
                      userId: r.user_id,
                    },
                    // Don't bump unread for own sends or for the currently-open channel.
                    unreadCount:
                      isOwn || isActive ? c.unreadCount ?? 0 : (c.unreadCount ?? 0) + 1,
                  }
                : c
            )
          );
        }
      );
      rc.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_channel_reads",
          filter: `channel_id=eq.${cid}`,
        },
        (payload) => {
          const r = (payload.new ?? payload.old) as Record<string, any>;
          if (r?.user_id !== user.id) return;
          // Our own read marker moved — zero out unread for that channel.
          setChannels((prev) =>
            prev.map((c) => (c.id === cid ? { ...c, unreadCount: 0 } : c))
          );
        }
      );
    }

    rc.subscribe();
    railRtRef.current = rc;

    return () => {
      supabase.removeChannel(rc);
      railRtRef.current = null;
    };
  }, [user?.id, projectId, channels.map((c) => c.id).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- 3c. Realtime: chat_channels CRUD at project scope ----------
  useEffect(() => {
    if (!user || !projectId) return;
    const supabase = supabaseRef.current;
    const rc = supabase.channel(`chat-channels:${projectId}`);

    const refreshAndSwitchIfGone = async (deletedId?: string) => {
      const list = await fetchChannels();
      if (deletedId && activeChannelIdRef.current === deletedId) {
        const fallback =
          list.find((c) => c.type === "project") ?? list[0] ?? null;
        setActiveChannel(fallback);
      }
    };

    rc.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_channels",
        filter: `project_id=eq.${projectId}`,
      },
      () => {
        fetchChannels();
      }
    );
    rc.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "chat_channels",
        filter: `project_id=eq.${projectId}`,
      },
      () => {
        fetchChannels();
      }
    );
    rc.on(
      "postgres_changes",
      {
        // No project_id filter: DELETE payloads only carry the primary key
        // (REPLICA IDENTITY DEFAULT). Match locally — we already only know
        // about channels in this project so an unknown id is a no-op.
        event: "DELETE",
        schema: "public",
        table: "chat_channels",
      },
      (payload) => {
        const row = payload.old as Record<string, unknown> | undefined;
        const id = (row?.id as string | undefined) ?? undefined;
        if (!id) return;
        refreshAndSwitchIfGone(id);
      }
    );

    rc.subscribe();
    return () => {
      supabase.removeChannel(rc);
    };
  }, [user?.id, projectId, fetchChannels]);

  // ---------- 4. Mark channel read on open + on new message ----------
  useEffect(() => {
    if (!projectId || !activeChannel || !user) return;

    // Clear the local unread badge immediately so the user sees instant feedback.
    setChannels((prev) =>
      prev.map((c) =>
        c.id === activeChannel.id && (c.unreadCount ?? 0) !== 0
          ? { ...c, unreadCount: 0 }
          : c
      )
    );

    // Debounce the POST a touch so rapid channel switching doesn't hammer the server.
    const timer = setTimeout(() => {
      fetch(
        `/api/project/${projectId}/chat/${activeChannel.id}/reads`,
        { method: "POST" }
      ).catch((err) =>
        console.error("[useChatRealtime] markRead:", err)
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [projectId, activeChannel?.id, messages.length, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- 5. selectChannel ----------
  const selectChannel = useCallback(
    (channelId: string) => {
      const found = channels.find((c) => c.id === channelId) ?? null;
      if (!found) return;
      setActiveChannel(found);
      // Zero the unread badge on click so it never visually lingers, regardless
      // of when the read POST commits or the chat_channel_reads broadcast lands.
      setChannels((prev) =>
        prev.map((c) =>
          c.id === channelId && (c.unreadCount ?? 0) !== 0
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    },
    [channels]
  );

  // ---------- 5b. createChannel ----------
  const createChannel = useCallback(
    async (input: CreateChannelInput): Promise<Channel | null> => {
      if (!projectId) return null;
      try {
        const res = await fetch(`/api/project/${projectId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("[createChannel]", body.error || res.statusText);
          return null;
        }
        const body = await res.json();
        const raw = body.channel;
        const created: Channel = {
          id: raw.id,
          name: raw.name,
          type: raw.type ?? "group",
          participants: raw.participants ?? [],
          lastMessage: null,
          unreadCount: 0,
          updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
        };

        setChannels((prev) => {
          const existing = prev.find((c) => c.id === created.id);
          if (existing) return prev;
          return [...prev, created];
        });
        setActiveChannel(created);
        return created;
      } catch (err) {
        console.error("[createChannel]", err);
        return null;
      }
    },
    [projectId]
  );

  // ---------- 5c. updateChannel ----------
  const updateChannel = useCallback(
    async (input: UpdateChannelInput): Promise<Channel | null> => {
      if (!projectId) return null;
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.participants !== undefined) body.participants = input.participants;

      try {
        const res = await fetch(
          `/api/project/${projectId}/chat/${input.channelId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          console.error("[updateChannel]", b.error || res.statusText);
          return null;
        }
        const b = await res.json();
        const raw = b.channel;
        const updated: Channel = {
          id: raw.id,
          name: raw.name,
          type: raw.type ?? "group",
          participants: raw.participants ?? [],
          createdBy: raw.createdBy ?? raw.created_by ?? null,
          updatedAt:
            raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
        };
        setChannels((prev) =>
          prev.map((c) =>
            c.id === updated.id
              ? { ...c, name: updated.name, participants: updated.participants }
              : c
          )
        );
        setActiveChannel((prev) =>
          prev && prev.id === updated.id
            ? { ...prev, name: updated.name, participants: updated.participants }
            : prev
        );
        return updated;
      } catch (err) {
        console.error("[updateChannel]", err);
        return null;
      }
    },
    [projectId]
  );

  // ---------- 5d. deleteChannel ----------
  const deleteChannel = useCallback(
    async (channelId: string): Promise<boolean> => {
      if (!projectId) return false;
      try {
        const res = await fetch(
          `/api/project/${projectId}/chat/${channelId}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const b = await res.json().catch(() => ({}));
          console.error("[deleteChannel]", b.error || res.statusText);
          return false;
        }
        setChannels((prev) => {
          const next = prev.filter((c) => c.id !== channelId);
          // If we just deleted the active channel, fall back to the project channel.
          if (activeChannelIdRef.current === channelId) {
            const fallback =
              next.find((c) => c.type === "project") ?? next[0] ?? null;
            setActiveChannel(fallback);
          }
          return next;
        });
        return true;
      } catch (err) {
        console.error("[deleteChannel]", err);
        return false;
      }
    },
    [projectId]
  );

  const refreshChannels = useCallback(async () => {
    await fetchChannels();
  }, [fetchChannels]);

  // ---------- 6. sendMessage ----------
  const sendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!activeChannel || !user) return;
      const trimmed = content.trim();
      const hasFiles = !!files && files.length > 0;
      if (!trimmed && !hasFiles) return;

      const optimisticId = `optimistic-${Date.now()}`;
      const memberInfo = membersRef.current.get(user.id);
      const optimistic: Message = {
        id: optimisticId,
        content: trimmed,
        type: hasFiles ? "file" : "text",
        createdAt: new Date().toISOString(),
        editedAt: null,
        userId: user.id,
        user: memberInfo ?? {
          id: user.id,
          fullName:
            (user.user_metadata?.full_name as string | undefined) ??
            (user.user_metadata?.name as string | undefined) ??
            null,
          email: user.email ?? null,
        },
        attachments: hasFiles
          ? files!.map((f) => ({
              id: `optimistic-att-${f.name}-${f.size}`,
              type: f.type.startsWith("image/") ? "image" : "file",
              url: URL.createObjectURL(f),
              filename: f.name,
              size: f.size,
              mime: f.type,
            }))
          : [],
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        let uploadedAttachments: ChatAttachment[] = [];
        if (hasFiles) {
          uploadedAttachments = await Promise.all(
            files!.map(async (f) => {
              const fd = new FormData();
              fd.append("file", f);
              const upRes = await fetch(
                `/api/project/${projectId}/chat/upload`,
                { method: "POST", body: fd }
              );
              if (!upRes.ok) {
                const body = await upRes.json().catch(() => ({}));
                throw new Error(body.error || "Upload failed");
              }
              const body = await upRes.json();
              return body.attachment;
            })
          );
        }

        const res = await fetch(
          `/api/project/${projectId}/chat/${activeChannel.id}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: trimmed,
              attachments: uploadedAttachments,
            }),
          }
        );
        if (!res.ok) throw new Error("Failed to send");
        const body = await res.json();
        const saved = body.message ?? body;

        // Revoke optimistic blob URLs.
        for (const a of optimistic.attachments) {
          if (a.url.startsWith("blob:")) URL.revokeObjectURL(a.url);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? {
                  ...optimistic,
                  id: saved.id,
                  createdAt: saved.createdAt ?? saved.created_at,
                  attachments: uploadedAttachments,
                }
              : m
          )
        );
      } catch (err) {
        console.error("[useChatRealtime] sendMessage:", err);
        for (const a of optimistic.attachments) {
          if (a.url.startsWith("blob:")) URL.revokeObjectURL(a.url);
        }
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    },
    [activeChannel, user, projectId]
  );

  // ---------- 7. editMessage ----------
  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!activeChannel || !content.trim()) return;
      const previous = messages.find((m) => m.id === messageId);
      if (!previous) return;

      const nowIso = new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content, editedAt: nowIso } : m
        )
      );

      try {
        const res = await fetch(
          `/api/project/${projectId}/chat/${activeChannel.id}/messages/${messageId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          }
        );
        if (!res.ok) throw new Error("Failed to edit");
      } catch (err) {
        console.error("[useChatRealtime] editMessage:", err);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? previous : m))
        );
      }
    },
    [activeChannel, messages, projectId]
  );

  // ---------- 8. deleteMessage ----------
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!activeChannel) return;
      const previous = messages;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        const res = await fetch(
          `/api/project/${projectId}/chat/${activeChannel.id}/messages/${messageId}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to delete");
      } catch (err) {
        console.error("[useChatRealtime] deleteMessage:", err);
        setMessages(previous);
      }
    },
    [activeChannel, messages, projectId]
  );

  return {
    channels,
    activeChannel,
    messages,
    members,
    sendMessage,
    editMessage,
    deleteMessage,
    selectChannel,
    createChannel,
    updateChannel,
    deleteChannel,
    refreshChannels,
    onlineUserIds,
    reads,
    loading,
    messagesReady,
  };
}
