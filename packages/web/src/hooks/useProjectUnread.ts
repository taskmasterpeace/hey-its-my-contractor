"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useProjectUnread(projectId: string | null | undefined) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const supabaseRef = useRef(createClient());
  const rtRef = useRef<RealtimeChannel | null>(null);

  const fetchCount = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/project/${projectId}/chat/unread`);
      if (!res.ok) return;
      const body = await res.json();
      setUnreadCount(body.unreadCount ?? 0);
      setChannelIds(body.channelIds ?? []);
    } catch (err) {
      console.error("[useProjectUnread] fetch:", err);
    }
  }, [projectId]);

  // Initial fetch + window focus refresh
  useEffect(() => {
    fetchCount();
    const onFocus = () => fetchCount();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchCount]);

  // Realtime: increment on new messages from others, refetch on read updates.
  useEffect(() => {
    if (!user || channelIds.length === 0) return;
    const supabase = supabaseRef.current;
    const rc = supabase.channel(`project-unread:${projectId}`);

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
          const r = payload.new as Record<string, unknown>;
          if (r.user_id !== user.id) {
            setUnreadCount((c) => c + 1);
          }
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
          const r = (payload.new ?? payload.old) as Record<string, unknown>;
          if (r?.user_id === user.id) {
            fetchCount();
          }
        }
      );
    }

    rc.subscribe();
    rtRef.current = rc;

    return () => {
      supabase.removeChannel(rc);
      rtRef.current = null;
    };
  }, [user?.id, projectId, channelIds.join(","), fetchCount]); // eslint-disable-line react-hooks/exhaustive-deps

  return { unreadCount };
}
