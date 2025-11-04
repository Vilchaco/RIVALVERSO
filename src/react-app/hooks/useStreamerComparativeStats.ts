import { useState, useEffect } from "react";

export interface ComparativeStats {
  ranking_position: number;
  total_streamers: number;
  percentiles: {
    kda_ratio: number;
    win_rate: number;
    kills: number;
    time_played: number;
    total_damage: number;
    rank_score: number;
  };
  challenge_averages: {
    kda_ratio: number;
    win_rate: number;
    kills: number;
    deaths: number;
    assists: number;
    time_played: number;
    total_damage: number;
    total_healing: number;
    games_played: number;
  };
  top_performers: {
    is_top_kda: boolean;
    is_top_winrate: boolean;
    is_top_kills: boolean;
    is_top_time_played: boolean;
    is_top_damage: boolean;
    top_percentage_kda?: number;
    top_percentage_winrate?: number;
    top_percentage_kills?: number;
    top_percentage_time_played?: number;
    top_percentage_damage?: number;
  };
  better_than_count: {
    kda_ratio: number;
    win_rate: number;
    kills: number;
    rank_score: number;
  };
}

export function useStreamerComparativeStats(streamerIdentifier: string | number | null) {
  const [data, setData] = useState<ComparativeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamerIdentifier) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    async function fetchComparativeStats() {
      try {
        setLoading(true);
        setError(null);
        
        // Encode the identifier for URL safety (handles both names and IDs)
        const encodedIdentifier = encodeURIComponent(streamerIdentifier!.toString());
        const response = await fetch(`/api/streamers/${encodedIdentifier}/comparative-stats`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch comparative stats");
        }
        
        const result: ComparativeStats = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchComparativeStats();
  }, [streamerIdentifier]);

  return { data, loading, error };
}
