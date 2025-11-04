import z from "zod";

export const HeroStatsSchema = z.object({
  id: z.number(),
  streamer_id: z.number(),
  hero_name: z.string(),
  matches_played: z.number(),
  matches_won: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  kd_ratio: z.number(),
  kda_ratio: z.number(),
  time_played: z.number(),
  total_damage: z.number(),
  total_healing: z.number(),
  win_rate: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const RoleStatsSchema = z.object({
  id: z.number(),
  streamer_id: z.number(),
  role_name: z.string(),
  matches_played: z.number(),
  matches_won: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  kd_ratio: z.number(),
  kda_ratio: z.number(),
  time_played: z.number(),
  total_damage: z.number(),
  total_healing: z.number(),
  win_rate: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const StreamerSchema = z.object({
  id: z.number(),
  name: z.string(),
  rank: z.string().nullable(),
  rank_score: z.number(),
  games_played: z.number(),
  wins: z.number(),
  kd_ratio: z.number(),
  kda_ratio: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  time_played: z.number(),
  total_damage: z.number(),
  total_healing: z.number(),
  twitch_username: z.string().nullable(),
  youtube_username: z.string().nullable(),
  twitter_username: z.string().nullable(),
  instagram_username: z.string().nullable(),
  tiktok_username: z.string().nullable(),
  ingame_username: z.string().nullable(),
  is_live: z.boolean(),
  stream_platform: z.string().nullable(),
  stream_url: z.string().nullable(),
  avatar_url: z.string().nullable(),
  marvel_rivals_uid: z.string().nullable(),
  profile_url: z.string().nullable(),
  previous_position: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  hero_stats: z.array(HeroStatsSchema).optional(),
  role_stats: z.array(RoleStatsSchema).optional(),
});

export type HeroStatsType = z.infer<typeof HeroStatsSchema>;
export type RoleStatsType = z.infer<typeof RoleStatsSchema>;
export type StreamerType = z.infer<typeof StreamerSchema>;

export const MatchHistoryEntrySchema = z.object({
  matchId: z.string(),
  result: z.enum(['win', 'loss']),
  heroPlayed: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  score: z.number(),
  scoreChange: z.number(), // RS change (rank score change) - positive/negative
  timestamp: z.string(),
  duration: z.number().optional(),
  gameMode: z.string().optional(),
});

export type MatchHistoryEntryType = z.infer<typeof MatchHistoryEntrySchema>;

export const StreamersResponseSchema = z.object({
  streamers: z.array(StreamerSchema),
});

export const StreamerDetailsResponseSchema = z.object({
  streamer: StreamerSchema,
  hero_stats: z.array(HeroStatsSchema),
  role_stats: z.array(RoleStatsSchema),
  match_history: z.array(MatchHistoryEntrySchema).optional(),
});

export const FeaturedStatsResponseSchema = z.object({
  highest_kda: StreamerSchema.nullable(),
  most_time_played: StreamerSchema.nullable(),
  most_kills: StreamerSchema.nullable(),
  highest_winrate: StreamerSchema.nullable(),
  most_popular_hero: z.object({
    hero_name: z.string(),
    total_matches: z.number(),
    streamers_count: z.number(),
  }).nullable(),
  hero_leaders: z.array(z.object({
    hero_name: z.string(),
    streamer: StreamerSchema,
    matches_played: z.number(),
    win_rate: z.number(),
    kda_ratio: z.number(),
  })),
  role_leaders: z.array(z.object({
    role_name: z.string(),
    streamer: StreamerSchema,
    matches_played: z.number(),
    win_rate: z.number(),
    kda_ratio: z.number(),
  })),
});

export type StreamersResponseType = z.infer<typeof StreamersResponseSchema>;
export type StreamerDetailsResponseType = z.infer<typeof StreamerDetailsResponseSchema>;
export type FeaturedStatsResponseType = z.infer<typeof FeaturedStatsResponseSchema>;
