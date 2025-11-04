import { MarvelRivalsAPI } from '../marvel-rivals-api';
import { ReportingService } from './ReportingService';

interface PlayerCacheEntry {
  id: number;
  ingame_username: string;
  marvel_rivals_uuid: string;
  last_verified_at: string;
}

interface PlayerUpdateLogEntry {
  id: number;
  marvel_rivals_uuid: string;
  update_type: string;
  last_update_at: string;
  next_allowed_at: string;
  cooldown_seconds: number;
  api_response_status: string;
  api_response_message: string;
}

interface UpdateResult {
  success: boolean;
  uuid?: string;
  cached: boolean;
  cooldownActive?: boolean;
  nextAllowedAt?: string;
  message?: string;
  error?: string;
  apiCallsMade: number;
}

export class PlayerUpdateService {
  private db: any;
  private api: MarvelRivalsAPI;
  private updating = new Set<string>(); // In-memory lock per player to prevent race conditions
  private reporter: ReportingService;

  constructor(env: any, db: any) {
    this.db = db;
    this.api = new MarvelRivalsAPI(env.MARVEL_RIVALS_API_KEY, this.getCurrentSeason());
    this.reporter = new ReportingService(db);
  }

  private getCurrentSeason(): string {
    // This will be enhanced to read from database config
    return '4'; // Default season
  }

  /**
   * Get or cache player UUID - This replaces repeated findPlayer calls
   * Maximum 1 API call per player (only if not cached)
   */
  async getPlayerUUID(ingameUsername: string): Promise<UpdateResult> {
    const normalizedUsername = ingameUsername.trim();
    
    // Check if already being processed
    if (this.updating.has(normalizedUsername)) {
      return {
        success: false,
        cached: false,
        message: 'Player update already in progress',
        error: 'Race condition prevented - update in progress',
        apiCallsMade: 0
      };
    }

    try {
      // Set lock
      this.updating.add(normalizedUsername);

      // First check cache
      const cached = await this.getCachedPlayerUUID(normalizedUsername);
      if (cached) {
        await this.reporter.info('GetPlayerUUID', 'Cache HIT', { username: normalizedUsername, uuid: cached.marvel_rivals_uuid });
        return {
          success: true,
          uuid: cached.marvel_rivals_uuid,
          cached: true,
          message: 'Retrieved from cache',
          apiCallsMade: 0
        };
      }

      await this.reporter.info('GetPlayerUUID', 'Cache MISS - llamando API', { username: normalizedUsername });

      // Cache miss - call API to get UUID
      try {
        const playerInfo = await this.api.findPlayer(normalizedUsername);
        
        // Cache the result
        await this.cachePlayerUUID(normalizedUsername, playerInfo.uuid);
        
        await this.reporter.success('GetPlayerUUID', 'UUID obtenido y cacheado', { username: normalizedUsername, uuid: playerInfo.uuid });
        
        return {
          success: true,
          uuid: playerInfo.uuid,
          cached: false,
          message: 'Retrieved from API and cached',
          apiCallsMade: 1
        };
      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown API error';
        await this.reporter.error('GetPlayerUUID', 'Error API', { username: normalizedUsername, error: errorMessage });
        
        return {
          success: false,
          cached: false,
          error: errorMessage,
          message: `Failed to get player UUID: ${errorMessage}`,
          apiCallsMade: 1
        };
      }
    } finally {
      // Always release lock
      this.updating.delete(normalizedUsername);
    }
  }

  /**
   * Update player data with intelligent cooldown management
   * Maximum 1-2 API calls per player (UUID + update/stats if cooldown allows)
   */
  async updatePlayerData(ingameUsername: string, forceUpdate: boolean = false): Promise<UpdateResult> {
    const normalizedUsername = ingameUsername.trim();
    const start = Date.now();
    
    // Check if already being processed
    if (this.updating.has(normalizedUsername)) {
      await this.reporter.warn('UpdatePlayer', 'Ya en proceso', { username: normalizedUsername });
      return {
        success: false,
        cached: false,
        message: 'Player update already in progress',
        error: 'Race condition prevented - update in progress',
        apiCallsMade: 0
      };
    }

    this.updating.add(normalizedUsername);
    try {
      let totalApiCalls = 0;
      await this.reporter.info('UpdatePlayer', 'Iniciando', { username: normalizedUsername, forced: forceUpdate });

      // Step 1: Get UUID (may use cache)
      const uuidResult = await this.getPlayerUUID(normalizedUsername);
      totalApiCalls += uuidResult.apiCallsMade;
      
      if (!uuidResult.success || !uuidResult.uuid) {
        const duration = Date.now() - start;
        await this.reporter.error('UpdatePlayer', 'Error obteniendo UUID', { username: normalizedUsername, error: uuidResult.error, duration_ms: duration });
        return {
          ...uuidResult,
          apiCallsMade: totalApiCalls
        };
      }

      const uuid = uuidResult.uuid;
      await this.reporter.info('UpdatePlayer', 'UUID obtenido', { username: normalizedUsername, uuid, cached: uuidResult.cached });

      // Step 2: Check cooldown for player_update unless forced
      if (!forceUpdate) {
        const cooldownCheck = await this.checkUpdateCooldown(uuid, 'player_update');
        if (cooldownCheck.cooldownActive) {
          await this.reporter.warn('UpdatePlayer', 'Cooldown activo', { username: normalizedUsername, nextAllowed: cooldownCheck.nextAllowedAt });
          
          return {
            success: false,
            uuid: uuid,
            cached: uuidResult.cached,
            cooldownActive: true,
            nextAllowedAt: cooldownCheck.nextAllowedAt,
            message: `Update cooldown active. Next update allowed at ${cooldownCheck.nextAllowedAt}`,
            apiCallsMade: totalApiCalls
          };
        }
      }

      // Step 3: Attempt player update
      try {
        const updateResult = await this.api.updatePlayer(uuid);
        
        if (updateResult.success) {
          // Log successful update
          await this.logPlayerUpdate(uuid, 'player_update', 'success', 'Player updated successfully');
          
          // Step 4: Get updated stats
          await this.api.getPlayerStats(uuid);
          totalApiCalls += 2; // updatePlayer + getPlayerStats
          
          const duration = Date.now() - start;
          await this.reporter.success('UpdatePlayer', 'Completado', { username: normalizedUsername, uuid }, duration);
          
          return {
            success: true,
            uuid: uuid,
            cached: uuidResult.cached,
            cooldownActive: false,
            message: 'Player updated and stats retrieved successfully',
            apiCallsMade: totalApiCalls
          };
        } else {
          // Update failed (likely rate limited)
          const cooldownSeconds = updateResult.waitTime || 1800; // 30 min default
          await this.logPlayerUpdate(uuid, 'player_update', 'rate_limited', updateResult.message || 'Rate limited', cooldownSeconds);
          
          totalApiCalls += 1; // updatePlayer call
          const duration = Date.now() - start;
          await this.reporter.warn('UpdatePlayer', 'Rate limit', { username: normalizedUsername, message: updateResult.message, cooldownSeconds, duration_ms: duration });
          
          return {
            success: false,
            uuid: uuid,
            cached: uuidResult.cached,
            cooldownActive: true,
            nextAllowedAt: new Date(Date.now() + (cooldownSeconds * 1000)).toISOString(),
            message: updateResult.message || 'Rate limit exceeded',
            apiCallsMade: totalApiCalls
          };
        }
      } catch (updateError) {
        // API error during update
        const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown update error';
        await this.logPlayerUpdate(uuid, 'player_update', 'error', errorMessage);
        
        totalApiCalls += 1; // Failed updatePlayer call
        const duration = Date.now() - start;
        await this.reporter.error('UpdatePlayer', errorMessage, { username: normalizedUsername, uuid, error: updateError instanceof Error ? updateError.stack : undefined, duration_ms: duration });
        
        return {
          success: false,
          uuid: uuid,
          cached: uuidResult.cached,
          error: errorMessage,
          message: `Update failed: ${errorMessage}`,
          apiCallsMade: totalApiCalls
        };
      }
    } finally {
      this.updating.delete(normalizedUsername);
    }
  }

  /**
   * Get player stats only (without updating) - respects rate limits
   * Maximum 1-2 API calls per player (UUID if not cached + stats if cooldown allows)
   */
  async getPlayerStats(ingameUsername: string): Promise<UpdateResult & { playerData?: any }> {
    const normalizedUsername = ingameUsername.trim();
    
    // Check if already being processed
    if (this.updating.has(normalizedUsername)) {
      return {
        success: false,
        cached: false,
        message: 'Player update already in progress',
        error: 'Race condition prevented - update in progress',
        apiCallsMade: 0
      };
    }

    try {
      // Set lock
      this.updating.add(normalizedUsername);
      let totalApiCalls = 0;

      console.log(`📊 Getting player stats for ${normalizedUsername}`);

      // Step 1: Get UUID (may use cache)
      const uuidResult = await this.getPlayerUUID(normalizedUsername);
      totalApiCalls += uuidResult.apiCallsMade;
      
      if (!uuidResult.success || !uuidResult.uuid) {
        return {
          ...uuidResult,
          apiCallsMade: totalApiCalls
        };
      }

      const uuid = uuidResult.uuid;
      console.log(`✅ UUID obtained for stats query ${normalizedUsername}: ${uuid} (${uuidResult.cached ? 'cached' : 'API call'})`);

      // Step 2: Check cooldown for player_stats
      const cooldownCheck = await this.checkUpdateCooldown(uuid, 'player_stats');
      if (cooldownCheck.cooldownActive) {
        console.log(`⏰ Stats cooldown active for ${normalizedUsername} (${uuid})`);
        console.log(`   Next allowed: ${cooldownCheck.nextAllowedAt}`);
        
        return {
          success: false,
          uuid: uuid,
          cached: uuidResult.cached,
          cooldownActive: true,
          nextAllowedAt: cooldownCheck.nextAllowedAt,
          message: `Stats cooldown active. Next query allowed at ${cooldownCheck.nextAllowedAt}`,
          apiCallsMade: totalApiCalls
        };
      }

      // Step 3: Get player stats
      console.log(`📊 Fetching stats for ${normalizedUsername} (${uuid})`);
      try {
        const playerData = await this.api.getPlayerStats(uuid);
        totalApiCalls += 1;
        
        // Log successful stats retrieval
        await this.logPlayerUpdate(uuid, 'player_stats', 'success', 'Player stats retrieved successfully');
        
        console.log(`✅ Player stats retrieved for ${normalizedUsername}`);
        
        return {
          success: true,
          uuid: uuid,
          cached: uuidResult.cached,
          cooldownActive: false,
          message: 'Player stats retrieved successfully',
          playerData: playerData,
          apiCallsMade: totalApiCalls
        };
      } catch (statsError) {
        const errorMessage = statsError instanceof Error ? statsError.message : 'Unknown stats error';
        
        // Check if it's a rate limit error
        if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit')) {
          // Extract wait time if available
          let cooldownSeconds = 180; // 3 minutes default for stats
          const minutesMatch = errorMessage.match(/(\d+)\s+minutos?/);
          if (minutesMatch) {
            cooldownSeconds = parseInt(minutesMatch[1]) * 60;
          }
          
          await this.logPlayerUpdate(uuid, 'player_stats', 'rate_limited', errorMessage, cooldownSeconds);
          
          return {
            success: false,
            uuid: uuid,
            cached: uuidResult.cached,
            cooldownActive: true,
            nextAllowedAt: new Date(Date.now() + (cooldownSeconds * 1000)).toISOString(),
            message: errorMessage,
            apiCallsMade: totalApiCalls
          };
        } else {
          // Other API error
          await this.logPlayerUpdate(uuid, 'player_stats', 'error', errorMessage);
          
          console.error(`❌ Player stats error for ${normalizedUsername}:`, errorMessage);
          
          return {
            success: false,
            uuid: uuid,
            cached: uuidResult.cached,
            error: errorMessage,
            message: `Stats retrieval failed: ${errorMessage}`,
            apiCallsMade: totalApiCalls
          };
        }
      }
    } finally {
      // Always release lock
      this.updating.delete(normalizedUsername);
    }
  }

  /**
   * Get cached player UUID if available and recent
   */
  private async getCachedPlayerUUID(ingameUsername: string): Promise<PlayerCacheEntry | null> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM player_cache 
        WHERE ingame_username = ? 
        AND last_verified_at > datetime('now', '-7 days')
      `).bind(ingameUsername).first();
      
      return result as PlayerCacheEntry | null;
    } catch (error) {
      console.error('Error checking player cache:', error);
      return null;
    }
  }

  /**
   * Cache player UUID
   */
  private async cachePlayerUUID(ingameUsername: string, uuid: string): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO player_cache (ingame_username, marvel_rivals_uuid, last_verified_at, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(ingameUsername, uuid).run();
      
      console.log(`💾 Cached UUID for ${ingameUsername}: ${uuid}`);
    } catch (error) {
      console.error('Error caching player UUID:', error);
      // Non-critical error - continue without caching
    }
  }

  /**
   * Check if player update is allowed (respects cooldowns)
   */
  private async checkUpdateCooldown(uuid: string, updateType: string): Promise<{
    cooldownActive: boolean;
    nextAllowedAt?: string;
    lastUpdate?: string;
  }> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM player_update_log 
        WHERE marvel_rivals_uuid = ? AND update_type = ?
        ORDER BY last_update_at DESC 
        LIMIT 1
      `).bind(uuid, updateType).first() as PlayerUpdateLogEntry | null;
      
      if (!result) {
        // No previous update - allowed
        return { cooldownActive: false };
      }
      
      const nextAllowed = new Date(result.next_allowed_at);
      const now = new Date();
      
      if (now < nextAllowed) {
        // Cooldown still active
        return {
          cooldownActive: true,
          nextAllowedAt: result.next_allowed_at,
          lastUpdate: result.last_update_at
        };
      } else {
        // Cooldown expired - allowed
        return {
          cooldownActive: false,
          lastUpdate: result.last_update_at
        };
      }
    } catch (error) {
      console.error('Error checking update cooldown:', error);
      // On error, allow the update
      return { cooldownActive: false };
    }
  }

  /**
   * Log player update attempt with cooldown tracking
   */
  private async logPlayerUpdate(
    uuid: string, 
    updateType: string, 
    status: string, 
    message: string, 
    cooldownSeconds?: number
  ): Promise<void> {
    try {
      const defaultCooldown = updateType === 'player_update' ? 1800 : 180; // 30min for updates, 3min for stats
      const actualCooldown = cooldownSeconds || defaultCooldown;
      const nextAllowedAt = new Date(Date.now() + (actualCooldown * 1000)).toISOString();
      
      await this.db.prepare(`
        INSERT OR REPLACE INTO player_update_log (
          marvel_rivals_uuid, update_type, last_update_at, next_allowed_at, 
          cooldown_seconds, api_response_status, api_response_message, updated_at
        ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(uuid, updateType, nextAllowedAt, actualCooldown, status, message).run();
      
      console.log(`📝 Logged ${updateType} for ${uuid}: ${status} (next allowed: ${nextAllowedAt})`);
    } catch (error) {
      console.error('Error logging player update:', error);
      // Non-critical error - continue without logging
    }
  }

  /**
   * Get player update statistics
   */
  async getUpdateStats(): Promise<{
    totalCachedPlayers: number;
    totalUpdateLogs: number;
    playersOnCooldown: number;
    oldestCacheEntry: string | null;
  }> {
    try {
      const cacheStats = await this.db.prepare(`
        SELECT COUNT(*) as total, MIN(last_verified_at) as oldest 
        FROM player_cache
      `).first();
      
      const logStats = await this.db.prepare(`
        SELECT COUNT(*) as total 
        FROM player_update_log
      `).first();
      
      const cooldownStats = await this.db.prepare(`
        SELECT COUNT(*) as total 
        FROM player_update_log 
        WHERE next_allowed_at > CURRENT_TIMESTAMP
      `).first();
      
      return {
        totalCachedPlayers: Number(cacheStats?.total) || 0,
        totalUpdateLogs: Number(logStats?.total) || 0,
        playersOnCooldown: Number(cooldownStats?.total) || 0,
        oldestCacheEntry: cacheStats?.oldest || null
      };
    } catch (error) {
      console.error('Error getting update stats:', error);
      return {
        totalCachedPlayers: 0,
        totalUpdateLogs: 0,
        playersOnCooldown: 0,
        oldestCacheEntry: null
      };
    }
  }

  /**
   * Clear old cache entries and logs (maintenance)
   */
  async cleanup(daysToKeep: number = 30): Promise<{
    deletedCacheEntries: number;
    deletedLogEntries: number;
  }> {
    try {
      // Clear old cache entries
      const cacheResult = await this.db.prepare(`
        DELETE FROM player_cache 
        WHERE last_verified_at < datetime('now', '-${daysToKeep} days')
      `).run();
      
      // Clear old log entries  
      const logResult = await this.db.prepare(`
        DELETE FROM player_update_log 
        WHERE created_at < datetime('now', '-${daysToKeep} days')
      `).run();
      
      const deletedCache = cacheResult.meta?.changes || 0;
      const deletedLogs = logResult.meta?.changes || 0;
      
      console.log(`🧹 Cleanup completed: ${deletedCache} cache entries, ${deletedLogs} log entries deleted`);
      
      return {
        deletedCacheEntries: deletedCache,
        deletedLogEntries: deletedLogs
      };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return {
        deletedCacheEntries: 0,
        deletedLogEntries: 0
      };
    }
  }
}
