import z from "zod";

// Twitch Clips Schema
export const TwitchClipSchema = z.object({
  id: z.number(),
  clip_id: z.string(),
  title: z.string(),
  broadcaster_name: z.string(),
  streamer_id: z.number().nullable(),
  category: z.string(),
  description: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  embed_url: z.string(),
  view_count: z.number(),
  duration: z.number(),
  language: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  submitted_by: z.string().nullable(),
  submitted_ip: z.string().nullable(),
  admin_notes: z.string().nullable(),
  approved_at: z.string().nullable(),
  approved_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ClipVoteSchema = z.object({
  id: z.number(),
  clip_id: z.number(),
  voter_identifier: z.string(),
  vote_type: z.enum(['upvote', 'downvote']),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string(),
});

export const ClipStatsSchema = z.object({
  clip_id: z.number(),
  total_votes: z.number(),
  upvotes: z.number(),
  downvotes: z.number(),
  vote_score: z.number(),
  views: z.number(),
  last_updated: z.string(),
});

// Combined clip with stats
export const ClipWithStatsSchema = TwitchClipSchema.extend({
  stats: ClipStatsSchema.optional(),
  user_vote: z.enum(['upvote', 'downvote']).nullable().optional(),
  streamer_info: z.object({
    name: z.string(),
    avatar_url: z.string().nullable(),
  }).nullable().optional(),
});

// API Request/Response schemas
export const SubmitClipRequestSchema = z.object({
  clip_url: z.string().url(),
  category: z.string().optional().default('general'),
  description: z.string().optional(),
  submitted_by: z.string().optional(),
});

export const VoteClipRequestSchema = z.object({
  vote_type: z.enum(['upvote', 'downvote']),
});

export const ClipsListResponseSchema = z.object({
  clips: z.array(ClipWithStatsSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  has_more: z.boolean(),
});

export const ClipSubmissionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  clip_id: z.number().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const VoteResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  new_vote_score: z.number().optional(),
  user_vote: z.enum(['upvote', 'downvote']).nullable().optional(),
});

// Type exports
export type TwitchClipType = z.infer<typeof TwitchClipSchema>;
export type ClipVoteType = z.infer<typeof ClipVoteSchema>;
export type ClipStatsType = z.infer<typeof ClipStatsSchema>;
export type ClipWithStatsType = z.infer<typeof ClipWithStatsSchema>;
export type SubmitClipRequestType = z.infer<typeof SubmitClipRequestSchema>;
export type VoteClipRequestType = z.infer<typeof VoteClipRequestSchema>;
export type ClipsListResponseType = z.infer<typeof ClipsListResponseSchema>;
export type ClipSubmissionResponseType = z.infer<typeof ClipSubmissionResponseSchema>;
export type VoteResponseType = z.infer<typeof VoteResponseSchema>;
