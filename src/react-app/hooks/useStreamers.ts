import { useState, useEffect } from "react";
import { StreamersResponseType, StreamerType } from "@/shared/types";

export function useStreamers(orderBy?: 'id' | 'rank') {
  const [streamers, setStreamers] = useState<StreamerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreamers = async () => {
    try {
      setLoading(true);
      
      // Build URL with order parameter if specified
      let url = "/api/streamers";
      if (orderBy) {
        url += `?order_by=${orderBy}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch streamers");
      }
      
      const data: StreamersResponseType = await response.json();
      setStreamers(data.streamers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once on component mount, or when orderBy changes
    fetchStreamers();
  }, [orderBy]);

  return { streamers, loading, error, refetch: fetchStreamers };
}
