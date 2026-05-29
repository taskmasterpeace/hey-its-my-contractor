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

export interface Channel {
  id: string;
  name: string;
  type: string;
  participants?: string[];
  lastMessage?: { content: string | null; createdAt: string } | null;
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
}

export interface ReadReceipt {
  userId: string;
  lastReadAt: string;
}

interface UseChatRealtimeReturn {
  channels: Channel[];
  activeChannel: Channel | null;
  messages: Message[];
  members: Map<string, ChatUser>;
  sendMessage: (content: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  selectChannel: (channelId: string) => void;
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
  const supabaseRef = useRef(createClient());
  const membersRef = useRef<Map<string, ChatUser>>(new Map());

  // Keep ref in sync so realtime callbacks see the latest map without re-subscribing.
  membersRef.current = members;

  // ---------- 1. Fetch channels + members on mount ----------
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [chRes, teamRes] = await Promise.all([
          fetch(`/api/project/${projectId}/chat`),
          fetch(`/api/project/${projectId}/team`),
        ]);

        if (!chRes.ok) throw new Error("Failed to fetch channels");
        const chBody = await chRes.json();
        const list: Channel[] = chBody.channels ?? [];
        if (cancelled) return;
        setChannels(list);
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
        console.error("[useChatRealtime] fetchChannels:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

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

  // ---------- 3. Realtime subscription: messages + presence + reads ----------
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
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const r = payload.old as Record<string, any>;
          setMessages((prev) => prev.filter((m) => m.id !== r.id));
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

  // ---------- 4. Mark channel read on open + on new message ----------
  useEffect(() => {
    if (!projectId || !activeChannel || !user) return;
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
      setActiveChannel(found);
    },
    [channels]
  );

  // ---------- 6. sendMessage ----------
  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeChannel || !user || !content.trim()) return;

      const optimisticId = `optimistic-${Date.now()}`;
      const memberInfo = membersRef.current.get(user.id);
      const optimistic: Message = {
        id: optimisticId,
        content,
        type: "text",
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
      };
      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await fetch(
          `/api/project/${projectId}/chat/${activeChannel.id}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          }
        );
        if (!res.ok) throw new Error("Failed to send");
        const body = await res.json();
        const saved = body.message ?? body;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? {
                  ...optimistic,
                  id: saved.id,
                  createdAt: saved.createdAt ?? saved.created_at,
                }
              : m
          )
        );
      } catch (err) {
        console.error("[useChatRealtime] sendMessage:", err);
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
    onlineUserIds,
    reads,
    loading,
    messagesReady,
  };
}
