// Auto-update service - SIMPLE VERSION WITHOUT RECOVERY SYSTEMS
// No timeouts, no locks, no recovery systems - just basic functionality

export interface AutoUpdateConfig {
  enabled: boolean;
  intervalMinutes: number;
  nextUpdateTime: string | null;
  lastUpdateTime: string | null;
  lastUpdateLogs: string[];
  updateHistory: AutoUpdateHistoryEntry[];
  isUpdating: boolean;
}

export interface AutoUpdateHistoryEntry {
  id: string;
  timestamp: string;
  type: 'auto' | 'manual_batch' | 'manual_individual';
  logs: string[];
  results?: {
    total: number;
    successful: number;
    errors: number;
  };
  duration?: number;
  streamer_name?: string;
}

export class AutoUpdateService {
  private db: any;
  private env: any;
  
  constructor(env: any, db: any) {
    this.env = env;
    this.db = db;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Simple AutoUpdateService...');
      
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS app_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      
      console.log('✅ Simple AutoUpdateService initialized');
    } catch (error) {
      console.error('❌ Error initializing AutoUpdateService:', error);
    }
  }

  async getConfig(): Promise<AutoUpdateConfig> {
    try {
      const configResult = await this.db.prepare(`
        SELECT value FROM app_config WHERE key = 'auto_update_config'
      `).first().catch(() => null);
      
      if (configResult && configResult.value) {
        const config = JSON.parse(configResult.value);
        return {
          enabled: config.enabled || false,
          intervalMinutes: config.intervalMinutes || 15,
          nextUpdateTime: config.nextUpdateTime || null,
          lastUpdateTime: config.lastUpdateTime || null,
          lastUpdateLogs: config.lastUpdateLogs || [],
          updateHistory: config.updateHistory || [],
          isUpdating: config.isUpdating || false,
        };
      }
      
      return {
        enabled: false,
        intervalMinutes: 15,
        nextUpdateTime: null,
        lastUpdateTime: null,
        lastUpdateLogs: [],
        updateHistory: [],
        isUpdating: false,
      };
    } catch (error) {
      console.error('Error getting auto-update config:', error);
      return {
        enabled: false,
        intervalMinutes: 15,
        nextUpdateTime: null,
        lastUpdateTime: null,
        lastUpdateLogs: [],
        updateHistory: [],
        isUpdating: false,
      };
    }
  }

  async saveConfig(config: AutoUpdateConfig): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO app_config (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind('auto_update_config', JSON.stringify(config)).run();
      
      console.log('✅ Auto-update config saved');
    } catch (error) {
      console.error('❌ Error saving auto-update config:', error);
    }
  }

  async enable(): Promise<void> {
    console.log('🔄 Enabling auto-update...');
    
    const config = await this.getConfig();
    
    config.enabled = true;
    config.isUpdating = false;
    config.lastUpdateTime = new Date().toISOString();
    await this.saveConfig(config);
    
    const nextUpdateTime = new Date();
    nextUpdateTime.setMinutes(nextUpdateTime.getMinutes() + config.intervalMinutes);
    config.nextUpdateTime = nextUpdateTime.toISOString();
    await this.saveConfig(config);
    
    console.log('✅ Auto-update enabled');
  }

  async disable(): Promise<void> {
    console.log('🔄 Disabling auto-update...');
    
    const config = await this.getConfig();
    config.enabled = false;
    config.nextUpdateTime = null;
    config.isUpdating = false;
    
    await this.saveConfig(config);
    
    console.log('✅ Auto-update disabled');
  }

  async checkAndRunUpdateIfNeeded(): Promise<{ executed: boolean; logs?: string[]; error?: string }> {
    try {
      const config = await this.getConfig();
      
      if (!config.enabled) {
        return { executed: false };
      }

      if (config.isUpdating) {
        return { executed: false };
      }
      
      if (!config.nextUpdateTime) {
        const nextUpdateTime = new Date();
        nextUpdateTime.setMinutes(nextUpdateTime.getMinutes() + config.intervalMinutes);
        config.nextUpdateTime = nextUpdateTime.toISOString();
        await this.saveConfig(config);
        return { executed: false };
      }
      
      const now = new Date();
      const nextUpdate = new Date(config.nextUpdateTime);
      
      const shouldUpdate = now >= nextUpdate;
      
      if (!shouldUpdate) {
        return { executed: false };
      }
      
      console.log('⏰ Time for auto-update, executing...');
      
      const updateResult = await this.executeUpdate();
      
      const updatedConfig = await this.getConfig();
      updatedConfig.lastUpdateTime = now.toISOString();
      updatedConfig.lastUpdateLogs = updateResult.logs;
      updatedConfig.isUpdating = false;
      
      const historyEntry: AutoUpdateHistoryEntry = {
        id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now.toISOString(),
        type: 'auto',
        logs: updateResult.logs,
        results: updateResult.summary,
        duration: updateResult.duration
      };
      
      updatedConfig.updateHistory = [historyEntry, ...updatedConfig.updateHistory].slice(0, 50);
      
      const nextUpdateTime = new Date();
      nextUpdateTime.setMinutes(nextUpdateTime.getMinutes() + updatedConfig.intervalMinutes);
      updatedConfig.nextUpdateTime = nextUpdateTime.toISOString();
      
      await this.saveConfig(updatedConfig);
      
      console.log(`✅ Auto-update completed. Next update: ${nextUpdateTime.toISOString()}`);
      return { executed: true, logs: updateResult.logs };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error in checkAndRunUpdateIfNeeded:', errorMsg);
      
      const config = await this.getConfig();
      config.isUpdating = false;
      config.lastUpdateLogs = [`❌ Error: ${errorMsg}`];
      await this.saveConfig(config);
      
      return { executed: false, error: errorMsg };
    }
  }

  async checkAndRunUpdate(): Promise<{ executed: boolean; logs?: string[]; error?: string }> {
    return this.checkAndRunUpdateIfNeeded();
  }

  private async executeUpdate(): Promise<{ logs: string[]; summary: any; duration: number }> {
    const startTime = Date.now();
    const logs: string[] = [];
    
    logs.push(`🤖 Auto-update iniciado a las ${new Date().toLocaleString('es-ES')}`);
    logs.push(`🚀 SIMPLE VERSION - Sin sistemas de recuperación`);
    
    try {
      const updateId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logs.push(`🔄 Ejecutando actualización automática...`);
      logs.push(`🆔 Update ID: ${updateId}`);
      
      const streamersResult = await this.db.prepare("SELECT * FROM streamers ORDER BY name").all();
      const streamers = streamersResult.results;
      
      if (!streamers || streamers.length === 0) {
        logs.push('⚠️ No streamers found for auto-update');
        return { 
          logs, 
          summary: { total: 0, successful: 0, errors: 0 }, 
          duration: Date.now() - startTime 
        };
      }

      let successCount = 0;
      let errorCount = 0;
      
      logs.push(`🎮 Procesando ${streamers.length} streamers...`);
      
      const result = await this.updateStreamersLiveStatus();
      logs.push(...result.logs);
      logs.push(`📺 Twitch Status: ${result.updated} cambios, ${result.live}/${result.total} en vivo`);
      
      for (let i = 0; i < streamers.length; i++) {
        const streamer = streamers[i];
        const streamerIndex = i + 1;
        
        try {
          logs.push(`📍 [${streamerIndex}/${streamers.length}] ${streamer.name}:`);
          
          const ingameUsername = streamer.ingame_username as string | null;
          
          if (ingameUsername && typeof ingameUsername === 'string' && ingameUsername.trim() !== '') {
            logs.push(`   🎮 IGN: ${ingameUsername} - actualizando desde API...`);
            
            try {
              const apiData = await this.getPlayerStats(ingameUsername);
              
              if (apiData && apiData.success && apiData.player) {
                logs.push(`   ✅ Datos obtenidos exitosamente`);
                
                let rank = streamer.rank;
                let gamesPlayed = Number(streamer.games_played) || 0;
                let wins = Number(streamer.wins) || 0;
                let kdRatio = 0, kdaRatio = 0, kills = 0, deaths = 0, assists = 0;
                let timePlayed = 0, totalDamage = 0, totalHealing = 0;
                
                if (apiData.player.rank) {
                  rank = apiData.player.rank;
                  logs.push(`   🏆 Rango: ${rank}`);
                }
                
                if (apiData.player.gamesPlayed && apiData.player.gamesPlayed > 0) {
                  gamesPlayed = apiData.player.gamesPlayed;
                  wins = apiData.player.wins || 0;
                  
                  if (apiData.player.overview) {
                    kills = Number(apiData.player.overview.kills || 0);
                    deaths = Number(apiData.player.overview.deaths || 0);
                    assists = Number(apiData.player.overview.assists || 0);
                    kdRatio = Number(apiData.player.overview.kdRatio || 0);
                    kdaRatio = Number(apiData.player.overview.kdaRatio || 0);
                    timePlayed = Number(apiData.player.overview.timePlayed || 0);
                    totalDamage = Number(apiData.player.overview.totalHeroDamage || 0);
                    totalHealing = Number(apiData.player.overview.totalHeroHeal || 0);
                  }
                  
                  logs.push(`   📈 Stats: ${gamesPlayed} games, ${wins} wins, ${((wins / gamesPlayed) * 100).toFixed(1)}% WR`);
                }

                if (apiData.player.heroes && Object.keys(apiData.player.heroes).length > 0) {
                  await this.db.prepare("DELETE FROM streamer_hero_stats WHERE streamer_id = ?").bind(streamer.id).run();
                  
                  for (const [heroName, heroStats] of Object.entries(apiData.player.heroes)) {
                    const stats = heroStats as Record<string, unknown>;
                    const heroWinRate = stats.matchesPlayed && Number(stats.matchesPlayed) > 0 ? 
                      ((Number(stats.matchesWon) || 0) / Number(stats.matchesPlayed)) * 100 : 0;
                    
                    await this.db.prepare(`
                      INSERT OR REPLACE INTO streamer_hero_stats (
                        streamer_id, hero_name, matches_played, matches_won, kills, deaths, assists,
                        kd_ratio, kda_ratio, time_played, total_damage, total_healing, win_rate
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                      streamer.id, heroName, stats.matchesPlayed || 0, stats.matchesWon || 0,
                      stats.kills || 0, stats.deaths || 0, stats.assists || 0,
                      stats.kdRatio || 0, stats.kdaRatio || 0, stats.timePlayed || 0,
                      stats.totalHeroDamage || 0, stats.totalHeroHeal || 0, heroWinRate
                    ).run();
                  }
                  logs.push(`   🦸 ${Object.keys(apiData.player.heroes).length} héroes actualizados`);
                }

                if (apiData.player.roles && Object.keys(apiData.player.roles).length > 0) {
                  await this.db.prepare("DELETE FROM streamer_role_stats WHERE streamer_id = ?").bind(streamer.id).run();
                  
                  for (const [roleName, roleStats] of Object.entries(apiData.player.roles)) {
                    const stats = roleStats as Record<string, unknown>;
                    const roleWinRate = stats.matchesPlayed && Number(stats.matchesPlayed) > 0 ? 
                      ((Number(stats.matchesWon) || 0) / Number(stats.matchesPlayed)) * 100 : 0;
                    
                    await this.db.prepare(`
                      INSERT OR REPLACE INTO streamer_role_stats (
                        streamer_id, role_name, matches_played, matches_won, kills, deaths, assists,
                        kd_ratio, kda_ratio, time_played, total_damage, total_healing, win_rate
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                      streamer.id, roleName, stats.matchesPlayed || 0, stats.matchesWon || 0,
                      stats.kills || 0, stats.deaths || 0, stats.assists || 0,
                      stats.kdRatio || 0, stats.kdaRatio || 0, stats.timePlayed || 0,
                      stats.totalHeroDamage || 0, stats.totalHeroHeal || 0, roleWinRate
                    ).run();
                  }
                  logs.push(`   🎭 ${Object.keys(apiData.player.roles).length} roles actualizados`);
                }
                
                const currentRankingQuery = await this.db.prepare(`
                  SELECT id, ROW_NUMBER() OVER (
                    ORDER BY 
                      CASE 
                        WHEN rank LIKE '%One Above All%' OR rank LIKE '%Uno Sobre Todos%' THEN 90
                        WHEN rank LIKE '%Eternity%' OR rank LIKE '%Eternidad%' THEN 80
                        WHEN rank LIKE '%Celestial III%' THEN 73
                        WHEN rank LIKE '%Celestial II%' THEN 74
                        WHEN rank LIKE '%Celestial I%' THEN 75
                        WHEN rank LIKE '%Celestial%' THEN 70
                        WHEN rank LIKE '%Grandmaster III%' OR rank LIKE '%Gran Maestro III%' THEN 63
                        WHEN rank LIKE '%Grandmaster II%' OR rank LIKE '%Gran Maestro II%' THEN 64
                        WHEN rank LIKE '%Grandmaster I%' OR rank LIKE '%Gran Maestro I%' THEN 65
                        WHEN rank LIKE '%Grandmaster%' OR rank LIKE '%Gran Maestro%' THEN 60
                        WHEN rank LIKE '%Diamond III%' OR rank LIKE '%Diamante III%' THEN 53
                        WHEN rank LIKE '%Diamond II%' OR rank LIKE '%Diamante II%' THEN 54
                        WHEN rank LIKE '%Diamond I%' OR rank LIKE '%Diamante I%' THEN 55
                        WHEN rank LIKE '%Diamond%' OR rank LIKE '%Diamante%' THEN 50
                        WHEN rank LIKE '%Platinum III%' OR rank LIKE '%Platino III%' THEN 43
                        WHEN rank LIKE '%Platinum II%' OR rank LIKE '%Platino II%' THEN 44
                        WHEN rank LIKE '%Platinum I%' OR rank LIKE '%Platino I%' THEN 45
                        WHEN rank LIKE '%Platinum%' OR rank LIKE '%Platino%' THEN 40
                        WHEN rank LIKE '%Gold III%' OR rank LIKE '%Oro III%' THEN 33
                        WHEN rank LIKE '%Gold II%' OR rank LIKE '%Oro II%' THEN 34
                        WHEN rank LIKE '%Gold I%' OR rank LIKE '%Oro I%' THEN 35
                        WHEN rank LIKE '%Gold%' OR rank LIKE '%Oro%' THEN 30
                        WHEN rank LIKE '%Silver III%' OR rank LIKE '%Plata III%' THEN 23
                        WHEN rank LIKE '%Silver II%' OR rank LIKE '%Plata II%' THEN 24
                        WHEN rank LIKE '%Silver I%' OR rank LIKE '%Plata I%' THEN 25
                        WHEN rank LIKE '%Silver%' OR rank LIKE '%Plata%' THEN 20
                        WHEN rank LIKE '%Bronze III%' OR rank LIKE '%Bronce III%' THEN 13
                        WHEN rank LIKE '%Bronze II%' OR rank LIKE '%Bronce II%' THEN 14
                        WHEN rank LIKE '%Bronze I%' OR rank LIKE '%Bronce I%' THEN 15
                        WHEN rank LIKE '%Bronze%' OR rank LIKE '%Bronce%' THEN 10
                        ELSE 0
                      END DESC,
                      rank_score DESC,
                      wins DESC,
                      games_played ASC
                  ) as current_position
                  FROM streamers
                `).all();
                
                const currentPositionData = currentRankingQuery.results.find((row: Record<string, unknown>) => Number(row.id) === Number(streamer.id));
                const currentPosition = currentPositionData ? Number(currentPositionData.current_position) : null;
                
                await this.db.prepare(`
                  UPDATE streamers 
                  SET 
                    rank = ?,
                    games_played = ?,
                    wins = ?,
                    kd_ratio = ?,
                    kda_ratio = ?,
                    kills = ?,
                    deaths = ?,
                    assists = ?,
                    time_played = ?,
                    total_damage = ?,
                    total_healing = ?,
                    previous_position = ?,
                    updated_at = CURRENT_TIMESTAMP
                  WHERE id = ?
                `).bind(
                  rank, gamesPlayed, wins, kdRatio, kdaRatio, kills, deaths, 
                  assists, timePlayed, totalDamage, totalHealing, 
                  currentPosition, streamer.id
                ).run();
                
                successCount++;
                logs.push(`   💾 ${streamer.name} actualizado exitosamente`);
                
              } else {
                logs.push(`   ❌ Fallo en API: ${apiData?.error || 'Error desconocido'}`);
                successCount++;
              }
            } catch (apiError) {
              const errorMsg = apiError instanceof Error ? apiError.message : 'Error desconocido';
              logs.push(`   ❌ Error en API: ${errorMsg}`);
              errorCount++;
            }
          } else {
            logs.push(`   ⚠️ Sin IGN configurado`);
            successCount++;
          }
          
        } catch (error) {
          errorCount++;
          logs.push(`   ❌ Error procesando streamer: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
      
      const duration = Date.now() - startTime;
      
      logs.push(`\n🏁 Auto-update completado`);
      logs.push(`✅ Exitosos: ${successCount}/${streamers.length}`);
      logs.push(`❌ Errores: ${errorCount}/${streamers.length}`);
      logs.push(`⌛ Duración: ${(duration/1000).toFixed(1)} segundos`);
      
      return {
        logs,
        summary: {
          total: streamers.length,
          successful: successCount,
          errors: errorCount
        },
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`❌ Critical error: ${errorMsg}`);
      
      return {
        logs,
        summary: {
          total: 0,
          successful: 0,
          errors: 1
        },
        duration
      };
    }
  }

  private async getCurrentSeason(): Promise<string> {
    try {
      const result = await this.db.prepare(`
        SELECT value FROM app_config WHERE key = 'marvel_rivals_season'
      `).first();
      
      return result?.value || '3.5';
    } catch (error) {
      console.error('Error getting season config:', error);
      return '3.5';
    }
  }

  private async getPlayerStats(username: string) {
    try {
      const currentSeason = await this.getCurrentSeason();
      console.log(`🚀 Auto-update: Getting data for ${username} (Season ${currentSeason})`);
      
      const { MarvelRivalsAPI } = await import('./marvel-rivals-api');
      
      const playerData = await MarvelRivalsAPI.fetchUser(username, this.env.MARVEL_RIVALS_API_KEY, currentSeason);
      
      const gamesPlayed = playerData.overview.matchesPlayed || 0;
      const wins = playerData.overview.matchesWon || 0;
      
      const heroesObject: Record<string, any> = {};
      playerData.heroes.forEach(hero => {
        heroesObject[hero.heroName] = {
          matchesPlayed: hero.matchesPlayed || 0,
          matchesWon: hero.matchesWon || 0,
          kills: hero.kills || 0,
          deaths: hero.deaths || 0,
          assists: hero.assists || 0,
          kdRatio: hero.kdRatio || 0,
          kdaRatio: hero.kdaRatio || 0,
          timePlayed: hero.timePlayed || 0,
          totalHeroDamage: hero.totalHeroDamage || 0,
          totalHeroHeal: hero.totalHeroHeal || 0
        };
      });
      
      const rolesObject: Record<string, any> = {};
      playerData.roles.forEach(role => {
        rolesObject[role.roleName] = {
          matchesPlayed: role.matchesPlayed || 0,
          matchesWon: role.matchesWon || 0,
          kills: role.kills || 0,
          deaths: role.deaths || 0,
          assists: role.assists || 0,
          kdRatio: role.kdRatio || 0,
          kdaRatio: role.kdaRatio || 0,
          timePlayed: role.timePlayed || 0,
          totalHeroDamage: role.totalHeroDamage || 0,
          totalHeroHeal: role.totalHeroHeal || 0
        };
      });
      
      return {
        success: true,
        player: {
          username: playerData.playerInfo.username,
          uuid: playerData.playerInfo.uuid,
          avatar: playerData.playerInfo.avatar,
          rank: playerData.playerInfo.rank,
          peakRank: playerData.playerInfo.rank,
          level: playerData.playerInfo.level,
          gamesPlayed: Number(gamesPlayed),
          wins: Number(wins),
          overview: playerData.overview,
          heroes: heroesObject,
          roles: rolesObject,
          rankHistory: playerData.rankHistory,
          matchHistory: playerData.matchHistory,
          _autoUpdateNewApi: true
        }
      };
    } catch (error) {
      console.error(`Auto-update API error for ${username}:`, error);
      
      let errorMessage = "Error conectando con Marvel Rivals API";
      
      if (error instanceof Error) {
        const errorStr = error.message.toLowerCase();
        
        if (errorStr.includes('jugador no encontrado')) {
          errorMessage = `Jugador "${username}" no encontrado en Marvel Rivals`;
        } else if (errorStr.includes('api key inválida')) {
          errorMessage = "Error de configuración: API Key inválida";
        } else if (errorStr.includes('rate limit') || errorStr.includes('debe esperar')) {
          errorMessage = `RATE LIMIT: ${error.message}`;
        } else if (errorStr.includes('timeout')) {
          errorMessage = "Timeout - API muy lenta";
        } else if (errorStr.includes('network') || errorStr.includes('fetch')) {
          errorMessage = "Error de red al conectar con API";
        } else {
          errorMessage = `API error: ${error.message}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  private async updateStreamersLiveStatus(): Promise<{ updated: number; live: number; total: number; logs: string[] }> {
    const { updateStreamersLiveStatus } = await import('./index');
    const result = await updateStreamersLiveStatus(this.env, this.db);
    return result;
  }

  async getStatus(): Promise<{
    enabled: boolean;
    nextUpdateTime: string | null;
    lastUpdateTime: string | null;
    timeUntilNext: number;
    lastUpdateLogs: string[];
    updateHistory: AutoUpdateHistoryEntry[];
    isUpdating: boolean;
  }> {
    const config = await this.getConfig();
    
    let timeUntilNext = 0;
    if (config.enabled && config.nextUpdateTime && !config.isUpdating) {
      const now = new Date();
      const next = new Date(config.nextUpdateTime);
      timeUntilNext = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
    }
    
    return {
      enabled: config.enabled,
      nextUpdateTime: config.nextUpdateTime,
      lastUpdateTime: config.lastUpdateTime,
      timeUntilNext,
      lastUpdateLogs: config.lastUpdateLogs,
      updateHistory: config.updateHistory,
      isUpdating: config.isUpdating || false,
    };
  }

  async resetStuckState(): Promise<void> {
    console.log('🔧 Resetting auto-update state...');
    const config = await this.getConfig();
    config.isUpdating = false;
    await this.saveConfig(config);
    console.log('✅ Auto-update state reset');
  }

  async addHistoryEntry(entry: Omit<AutoUpdateHistoryEntry, 'duration'> & { duration?: number }): Promise<void> {
    try {
      const config = await this.getConfig();
      config.updateHistory = [entry, ...config.updateHistory];
      config.updateHistory = config.updateHistory.slice(0, 50);
      await this.saveConfig(config);
    } catch (error) {
      console.error('❌ Error adding history entry:', error);
    }
  }

  async getUpdateHistory(): Promise<AutoUpdateHistoryEntry[]> {
    try {
      const config = await this.getConfig();
      return config.updateHistory || [];
    } catch (error) {
      console.error('❌ Error getting update history:', error);
      return [];
    }
  }
}
