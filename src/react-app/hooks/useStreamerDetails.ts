import { useState, useEffect } from "react";
import { StreamerDetailsResponseType } from "@/shared/types";

export function useStreamerDetails(streamerIdentifier: string | number | null) {
  const [data, setData] = useState<StreamerDetailsResponseType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamerIdentifier) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchStreamerDetails() {
      try {
        setLoading(true);
        setError(null);
        
        // Encode the identifier for URL safety (handles both names and IDs)
        const encodedIdentifier = encodeURIComponent(streamerIdentifier!.toString());
        const response = await fetch(`/api/streamers/${encodedIdentifier}/details`);
        
        console.log(`🔍 Fetching streamer details for: ${streamerIdentifier}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch streamer details");
        }
        
        const result: StreamerDetailsResponseType = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStreamerDetails();
  }, [streamerIdentifier]);

  return { data, loading, error };
}
