"use client";

import { useEffect, useState, useCallback } from "react";
import type { EnhancedMeetingData } from "@contractor-platform/types";
import meetingsDataService from "@/services/meetings.service";

export function useProjectMeetings(projectId: string) {
  const [meetings, setMeetings] = useState<EnhancedMeetingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch meetings on mount and when projectId changes
  const fetchMeetings = useCallback(async () => {
    if (!projectId) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await meetingsDataService.fetchProjectMeetings(projectId);
      setMeetings(data);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch meetings"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!projectId) return;

    // Initial fetch
    fetchMeetings();

    // Set up real-time subscription
    const unsubscribe = meetingsDataService.subscribeToProjectMeetings(
      projectId,
      (updatedMeetings) => {
        setMeetings(updatedMeetings);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [projectId, fetchMeetings]);

  // Manual refetch function
  const refetch = useCallback(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return {
    meetings,
    loading,
    error,
    refetch,
  };
}
