import { useState, useEffect } from "react";
import { FeaturedStatsResponseType } from "@/shared/types";

export function useFeaturedStats() {
  const [data, setData] = useState<FeaturedStatsResponseType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/featured-stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch featured stats");
      }
      
      const result: FeaturedStatsResponseType = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch once on component mount
    fetchFeaturedStats();
  }, []);

  return { data, loading, error, refetch: fetchFeaturedStats };
}
