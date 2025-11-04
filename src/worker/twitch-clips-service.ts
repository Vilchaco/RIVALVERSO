// Twitch Clips Service - Gestión completa de clips con votaciones
// Implementa las mejores prácticas de Twitch para embeds según documentación oficial
import { getTwitchAppToken } from './index';

export interface TwitchClipData {
  id: string;
  url: string;
  embed_url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  creator_id: string;
  creator_name: string;
  video_id: string;
  game_id: string;
  language: string;
  title: string;
  view_count: number;
  created_at: string;
  thumbnail_url: string;
  duration: number;
}

export interface VotingLimits {
  max_votes_per_day: number;
  max_votes_per_clip_per_day: number;
  cooldown_minutes: number;
}

export class TwitchClipsService {
  private db: any;
  private env: any;
  
  // Configuración del sistema de votación
  private votingLimits: VotingLimits = {
    max_votes_per_day: 10,        // Máximo 10 votos por día por usuario
    max_votes_per_clip_per_day: 1, // Solo 1 voto por clip por día
    cooldown_minutes: 5           // 5 minutos entre votos
  };

  constructor(env: any, db: any) {
    this.env = env;
    this.db = db;
  }

  // Extraer ID del clip desde URL de Twitch
  extractClipId(clipUrl: string): string | null {
    try {
      const url = new URL(clipUrl);
      
      // Diferentes formatos de URL de clips de Twitch
      if (url.hostname === 'clips.twitch.tv') {
        // https://clips.twitch.tv/ClipSlug
        return url.pathname.substring(1);
      } else if (url.hostname === 'www.twitch.tv' || url.hostname === 'twitch.tv') {
        // https://www.twitch.tv/broadcaster/clip/ClipSlug
        const pathParts = url.pathname.split('/');
        const clipIndex = pathParts.indexOf('clip');
        if (clipIndex !== -1 && clipIndex + 1 < pathParts.length) {
          return pathParts[clipIndex + 1];
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Obtener información del clip desde Twitch API
  async getClipData(clipId: string): Promise<{ success: boolean; clip?: TwitchClipData; error?: string }> {
    try {
      const token = await getTwitchAppToken(this.env);
      
      const response = await fetch(`https://api.twitch.tv/helix/clips?id=${clipId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': this.env.TWITCH_CLIENT_ID,
        }
      });

      if (!response.ok) {
        throw new Error(`Twitch API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as { data: any[] };
      
      if (!data.data || data.data.length === 0) {
        return {
          success: false,
          error: 'Clip no encontrado en Twitch'
        };
      }

      const clipData = data.data[0];
      
      // Generar embed_url correcta según documentación de Twitch para clips
      const embedUrl = `https://clips.twitch.tv/embed?clip=${clipData.id}&parent=rivalverso.mocha.app`;
      
      return {
        success: true,
        clip: {
          id: clipData.id,
          url: clipData.url,
          embed_url: embedUrl, // URL corregida para clips
          broadcaster_id: clipData.broadcaster_id,
          broadcaster_name: clipData.broadcaster_name,
          creator_id: clipData.creator_id,
          creator_name: clipData.creator_name,
          video_id: clipData.video_id,
          game_id: clipData.game_id,
          language: clipData.language,
          title: clipData.title,
          view_count: clipData.view_count,
          created_at: clipData.created_at,
          thumbnail_url: clipData.thumbnail_url,
          duration: clipData.duration,
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Verificar si el broadcaster está en nuestro challenge
  async findStreamerByTwitchName(broadcasterName: string): Promise<number | null> {
    try {
      const result = await this.db.prepare(`
        SELECT id FROM streamers 
        WHERE LOWER(twitch_username) = LOWER(?)
      `).bind(broadcasterName).first();
      
      return result ? result.id : null;
    } catch (error) {
      console.error('Error finding streamer:', error);
      return null;
    }
  }

  // Generar identificador único para votante (evita votos múltiples)
  generateVoterIdentifier(ip: string, userAgent: string): string {
    // Crear hash simple pero único basado en IP + User Agent
    const combined = `${ip}_${userAgent}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `voter_${Math.abs(hash)}`;
  }

  // Verificar límites de votación
  async checkVotingLimits(voterIdentifier: string, clipId: number): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    try {
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Verificar votos del día
      const dailyVotesResult = await this.db.prepare(`
        SELECT COUNT(*) as count FROM clip_votes 
        WHERE voter_identifier = ? AND created_at >= ?
      `).bind(voterIdentifier, dayStart.toISOString()).first();
      
      const dailyVotes = dailyVotesResult?.count || 0;
      
      if (dailyVotes >= this.votingLimits.max_votes_per_day) {
        return {
          allowed: false,
          reason: `Has alcanzado el límite diario de ${this.votingLimits.max_votes_per_day} votos`,
          remaining: 0
        };
      }

      // Verificar si ya votó este clip hoy
      const clipVoteResult = await this.db.prepare(`
        SELECT COUNT(*) as count FROM clip_votes 
        WHERE voter_identifier = ? AND clip_id = ? AND created_at >= ?
      `).bind(voterIdentifier, clipId, dayStart.toISOString()).first();
      
      const clipVotes = clipVoteResult?.count || 0;
      
      if (clipVotes >= this.votingLimits.max_votes_per_clip_per_day) {
        return {
          allowed: false,
          reason: 'Ya votaste este clip hoy',
          remaining: this.votingLimits.max_votes_per_day - dailyVotes
        };
      }

      // Verificar cooldown
      const lastVoteResult = await this.db.prepare(`
        SELECT created_at FROM clip_votes 
        WHERE voter_identifier = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `).bind(voterIdentifier).first();
      
      if (lastVoteResult) {
        const lastVoteTime = new Date(lastVoteResult.created_at);
        const cooldownEnd = new Date(lastVoteTime.getTime() + (this.votingLimits.cooldown_minutes * 60 * 1000));
        
        if (now < cooldownEnd) {
          const remainingMinutes = Math.ceil((cooldownEnd.getTime() - now.getTime()) / (60 * 1000));
          return {
            allowed: false,
            reason: `Debes esperar ${remainingMinutes} minutos antes de votar nuevamente`,
            remaining: this.votingLimits.max_votes_per_day - dailyVotes
          };
        }
      }

      return {
        allowed: true,
        remaining: this.votingLimits.max_votes_per_day - dailyVotes
      };
    } catch (error) {
      console.error('Error checking voting limits:', error);
      return {
        allowed: false,
        reason: 'Error verificando límites de votación'
      };
    }
  }

  // Actualizar estadísticas de clip
  async updateClipStats(clipId: number): Promise<void> {
    try {
      const statsResult = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_votes,
          SUM(CASE WHEN vote_type = 'upvote' THEN 1 ELSE 0 END) as upvotes,
          SUM(CASE WHEN vote_type = 'downvote' THEN 1 ELSE 0 END) as downvotes
        FROM clip_votes 
        WHERE clip_id = ?
      `).bind(clipId).first();
      
      const upvotes = Number(statsResult?.upvotes || 0);
      const downvotes = Number(statsResult?.downvotes || 0);
      const totalVotes = Number(statsResult?.total_votes || 0);
      const voteScore = upvotes - downvotes;
      
      await this.db.prepare(`
        INSERT OR REPLACE INTO clip_stats (
          clip_id, total_votes, upvotes, downvotes, vote_score, last_updated
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(clipId, totalVotes, upvotes, downvotes, voteScore).run();
      
    } catch (error) {
      console.error('Error updating clip stats:', error);
    }
  }

  // Obtener votación del usuario para un clip
  async getUserVote(voterIdentifier: string, clipId: number): Promise<'upvote' | 'downvote' | null> {
    try {
      const result = await this.db.prepare(`
        SELECT vote_type FROM clip_votes 
        WHERE voter_identifier = ? AND clip_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(voterIdentifier, clipId).first();
      
      return result ? result.vote_type : null;
    } catch (error) {
      console.error('Error getting user vote:', error);
      return null;
    }
  }

  // Obtener clips con estadísticas y votación del usuario
  async getClipsWithStats(options: {
    limit?: number;
    offset?: number;
    status?: string;
    category?: string;
    streamer_id?: number;
    order_by?: 'newest' | 'votes' | 'views';
    voter_identifier?: string;
  } = {}): Promise<{ clips: any[]; total: number }> {
    try {
      const {
        limit = 20,
        offset = 0,
        status = 'approved',
        category,
        streamer_id,
        order_by = 'votes',
        voter_identifier
      } = options;

      // Build WHERE clause
      const conditions: string[] = ['c.status = ?'];
      const bindings: any[] = [status];

      if (category && category !== 'all') {
        conditions.push('c.category = ?');
        bindings.push(category);
      }

      if (streamer_id) {
        conditions.push('c.streamer_id = ?');
        bindings.push(streamer_id);
      }

      const whereClause = conditions.join(' AND ');

      // Order by clause
      let orderClause = 'c.created_at DESC';
      if (order_by === 'votes') {
        orderClause = 'COALESCE(cs.vote_score, 0) DESC, c.created_at DESC';
      } else if (order_by === 'views') {
        orderClause = 'c.view_count DESC, c.created_at DESC';
      }

      // Get total count
      const countResult = await this.db.prepare(`
        SELECT COUNT(*) as total 
        FROM twitch_clips c 
        WHERE ${whereClause}
      `).bind(...bindings).first();

      const total = countResult?.total || 0;

      // Get clips with stats
      const clipsResult = await this.db.prepare(`
        SELECT 
          c.*,
          cs.total_votes,
          cs.upvotes,
          cs.downvotes,
          cs.vote_score,
          cs.views as stats_views,
          s.name as streamer_name,
          s.avatar_url as streamer_avatar
        FROM twitch_clips c
        LEFT JOIN clip_stats cs ON c.id = cs.clip_id
        LEFT JOIN streamers s ON c.streamer_id = s.id
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ? OFFSET ?
      `).bind(...bindings, limit, offset).all();

      const clips = [];
      
      for (const row of clipsResult.results || []) {
        let userVote = null;
        if (voter_identifier) {
          userVote = await this.getUserVote(voter_identifier, row.id);
        }

        clips.push({
          ...row,
          stats: {
            clip_id: row.id,
            total_votes: row.total_votes || 0,
            upvotes: row.upvotes || 0,
            downvotes: row.downvotes || 0,
            vote_score: row.vote_score || 0,
            views: row.stats_views || row.view_count || 0,
            last_updated: new Date().toISOString()
          },
          user_vote: userVote,
          streamer_info: row.streamer_id ? {
            name: row.streamer_name || 'Streamer desconocido',
            avatar_url: row.streamer_avatar
          } : null
        });
      }

      return { clips, total };
    } catch (error) {
      console.error('Error getting clips with stats:', error);
      return { clips: [], total: 0 };
    }
  }
}
