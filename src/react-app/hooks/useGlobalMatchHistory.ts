import { useState, useEffect } from "react";

export interface GlobalMatchHistoryEntry {
  matchId: string;
  result: 'win' | 'loss';
  heroPlayed: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  scoreChange: number;
  timestamp: string;
  duration?: number;
  gameMode?: string;
  mapName?: string;
  mapImageUrl?: string;
  streamerName: string;
  streamerId: number;
  streamerAvatarUrl?: string;
}

export interface GlobalMatchHistoryResponse {
  success: boolean;
  matches: GlobalMatchHistoryEntry[];
  total: number;
}

export function useGlobalMatchHistory() {
  const [matches, setMatches] = useState<GlobalMatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalMatchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/global-match-history");
      
      if (!response.ok) {
        throw new Error("Failed to fetch global match history");
      }
      
      const data: GlobalMatchHistoryResponse = await response.json();
      
      if (data.success) {
        setMatches(data.matches);
        setError(null);
      } else {
        throw new Error("Failed to fetch global match history");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalMatchHistory();
  }, []);

  return { 
    matches, 
    loading, 
    error, 
    refetch: fetchGlobalMatchHistory 
  };
}
