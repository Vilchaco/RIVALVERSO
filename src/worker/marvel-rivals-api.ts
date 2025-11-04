// Marvel Rivals API Client - Nueva implementación usando marvelrivalsapi.com
// Reemplaza completamente la API anterior de tracker.gg

export type PlayerInfo = {
  username: string;
  uuid: string;
  level: number;
  rank?: string;
  score?: number;
  avatar?: string;
  banner?: string;
};

export type OverviewStats = {
  matchesPlayed?: number;
  matchesWon?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  kdRatio?: number;
  kdaRatio?: number;
  timePlayed?: number;
  totalHeroDamage?: number;
  totalHeroHeal?: number;
  totalDamageTaken?: number;
  totalMvp?: number;
  totalSvp?: number;
  maxKillStreak?: number;
  overallKd?: number;
  overallKda?: number;
  [key: string]: unknown;
};

export type HeroStats = {
  heroName: string;
  matchesPlayed?: number;
  matchesWon?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  kdRatio?: number;
  kdaRatio?: number;
  timePlayed?: number;
  totalHeroDamage?: number;
  totalHeroHeal?: number;
  totalDamageTaken?: number;
  winRate?: number;
  [key: string]: unknown;
};

export type RoleStats = {
  roleName: string;
  matchesPlayed?: number;
  matchesWon?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  kdRatio?: number;
  kdaRatio?: number;
  timePlayed?: number;
  totalHeroDamage?: number;
  totalHeroHeal?: number;
  totalDamageTaken?: number;
  winRate?: number;
  [key: string]: unknown;
};

export type RankHistory = {
  season: string;
  rank: string;
  score: number;
  wins: number;
};

export type MatchHistoryEntry = {
  matchId: string;
  result: 'win' | 'loss';
  heroPlayed: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  scoreChange: number; // RS change (rank score change) - positive/negative  
  timestamp: string;
  mapName?: string;
  mapImageUrl?: string;
};

export type PlayerData = {
  playerInfo: PlayerInfo;
  overview: OverviewStats;
  heroes: HeroStats[];
  roles: RoleStats[];
  rankHistory?: RankHistory[];
  matchHistory?: MatchHistoryEntry[];
};

class MarvelRivalsAPI {
  private apiKey: string;
  private baseUrl = 'https://marvelrivalsapi.com';
  private season: string;

  constructor(apiKey: string, season: string = '4') {
    this.apiKey = apiKey;
    this.season = season;
  }

  private async makeRequest(endpoint: string, params?: URLSearchParams, abortSignal?: AbortSignal): Promise<any> {
    const url = params ? `${this.baseUrl}${endpoint}?${params.toString()}` : `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 Marvel Rivals API request: ${url}`);
    console.log(`🔑 API Key disponible: ${this.apiKey ? 'SI' : 'NO'} (${this.apiKey?.length || 0} chars)`);
    
    // Marvel Rivals API espera x-api-key header específicamente (lowercase según documentación oficial)
    const headers = {
      'x-api-key': this.apiKey,
      'Accept': 'application/json',
      'User-Agent': 'Marvel Rivals SoloQ Challenge - Mocha App'
    };
    
    console.log(`📋 Headers enviados (formato oficial):`, {
      'x-api-key': this.apiKey?.substring(0, 10) + '...' + this.apiKey?.substring(-4),
      'Accept': headers.Accept,
      'User-Agent': headers['User-Agent']
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: abortSignal
    });

    // 🚦 SMART RATE LIMITING: Leer headers de rate limit antes de procesar errores
    const rateLimitHeaders = this.extractRateLimitHeaders(response);
    if (rateLimitHeaders) {
      console.log(`🚦 Rate Limit Info:`, rateLimitHeaders);
      
      // Si quedan pocos requests, mostrar advertencia
      if (rateLimitHeaders.remaining <= 1) {
        console.warn(`⚠️ Rate limit muy cerca: ${rateLimitHeaders.remaining}/${rateLimitHeaders.limit} requests restantes`);
        console.warn(`⏰ Reset en: ${rateLimitHeaders.resetTime} (${rateLimitHeaders.secondsUntilReset}s)`);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      const responseHeaders = Object.fromEntries(response.headers.entries());
      
      console.error(`❌ API Error ${response.status}: ${errorText}`);
      console.error(`📋 Response headers:`, responseHeaders);
      console.error(`🔍 Response status text: ${response.statusText}`);
      
      if (response.status === 429) {
        // Usar información de rate limit headers si está disponible
        let waitTimeInfo = '';
        let waitTimeMinutes = 30; // Default fallback
        
        if (rateLimitHeaders) {
          const waitTimeSeconds = rateLimitHeaders.secondsUntilReset;
          waitTimeMinutes = Math.ceil(waitTimeSeconds / 60);
          waitTimeInfo = ` (${waitTimeMinutes} minutos exactos según headers)`;
          console.log(`🚦 Rate limit calculado desde headers: ${waitTimeSeconds}s = ${waitTimeMinutes}min`);
        } else {
          // Fallback: Parse JSON error response
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.message && typeof errorData.message === 'string') {
              const timeMatch = errorData.message.match(/(\d+)\s+minutes?/i);
              if (timeMatch) {
                waitTimeMinutes = parseInt(timeMatch[1]);
                waitTimeInfo = ` (${waitTimeMinutes} minutos desde mensaje de error)`;
              }
            }
          } catch (parseError) {
            console.log('Could not parse 429 error response, using default wait time');
            waitTimeInfo = ` (${waitTimeMinutes} minutos por defecto)`;
          }
        }
        
        throw new Error(`Rate limit: Debes esperar ${waitTimeMinutes} minutos antes de actualizar este jugador nuevamente${waitTimeInfo}`);
      } else if (response.status === 404) {
        throw new Error(`Jugador no encontrado en Marvel Rivals`);
      } else if (response.status === 401 || response.status === 403) {
        throw new Error(`API Key inválida o sin permisos - Status: ${response.status} - ${errorText}`);
      } else {
        throw new Error(`Error de la API: ${response.status} - ${response.statusText} - ${errorText}`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ Non-JSON response:', textResponse.substring(0, 200));
      throw new Error(`API devolvió contenido no válido: ${contentType}`);
    }

    let data;
    try {
      const rawText = await response.text();
      console.log(`📄 Raw response (first 500 chars): ${rawText.substring(0, 500)}...`);
      data = JSON.parse(rawText);
      
      // DEBUGGING COMPLETO: Usar JSON.stringify para ver objetos anidados
      console.log(`✅ Parsed JSON data (JSON.stringify):`, JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      throw new Error(`Error parseando respuesta de la API: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
    }

    return data;
  }

  // 🚦 Extraer información de rate limiting de los headers de respuesta
  private extractRateLimitHeaders(response: Response): {
    limit: number;
    remaining: number;
    reset: number;
    resetTime: string;
    secondsUntilReset: number;
  } | null {
    try {
      const limit = response.headers.get('x-ratelimit-limit');
      const remaining = response.headers.get('x-ratelimit-remaining'); 
      const reset = response.headers.get('x-ratelimit-reset');
      
      if (!limit || !remaining || !reset) {
        return null;
      }
      
      const limitNum = parseInt(limit);
      const remainingNum = parseInt(remaining);
      const resetTimestamp = parseInt(reset);
      
      // Convertir timestamp Unix a fecha legible
      const resetDate = new Date(resetTimestamp * 1000);
      const now = new Date();
      const secondsUntilReset = Math.max(0, Math.floor((resetDate.getTime() - now.getTime()) / 1000));
      
      return {
        limit: limitNum,
        remaining: remainingNum,
        reset: resetTimestamp,
        resetTime: resetDate.toISOString(),
        secondsUntilReset: secondsUntilReset
      };
    } catch (error) {
      console.log('Error parsing rate limit headers:', error);
      return null;
    }
  }

  // Paso 1: SOLO obtener UID del jugador - NO hace updates ni fetches de datos
  async findPlayer(username: string, abortSignal?: AbortSignal): Promise<{ uuid: string; username: string }> {
    console.log(`🔍 BUSCANDO UID para jugador: ${username}`);
    
    try {
      // SOLO llamada a find-player - NO update, NO fetch data
      const data = await this.makeRequest(`/api/v1/find-player/${encodeURIComponent(username)}`, undefined, abortSignal);
      
      if (!data || !data.uid) {
        throw new Error(`No se encontró UID para el jugador "${username}"`);
      }

      console.log(`✅ UID encontrado para ${username}: ${data.uid}`);
      return {
        uuid: data.uid, // La API devuelve 'uid' pero mantenemos 'uuid' internamente por compatibilidad
        username: data.name || username // La API devuelve 'name' no 'username'
      };
    } catch (error) {
      console.error(`❌ Error buscando UID para ${username}:`, error);
      throw error;
    }
  }

  // Paso 2: Actualizar datos del jugador (solo cada 30 minutos)
  async updatePlayer(query: string, abortSignal?: AbortSignal): Promise<{ success: boolean; message?: string; waitTime?: number; rateLimitInfo?: any }> {
    console.log(`🔄 Actualizando datos del jugador: ${query}`);
    
    try {
      const data = await this.makeRequest(`/api/v1/player/${encodeURIComponent(query)}/update`, undefined, abortSignal);
      
      if (data.error && data.wait_time) {
        console.log(`⏰ Debe esperar ${data.wait_time} segundos antes de actualizar`);
        return {
          success: false,
          message: `Debe esperar ${Math.ceil(data.wait_time / 60)} minutos antes de actualizar este jugador`,
          waitTime: data.wait_time
        };
      }

      console.log(`✅ Jugador actualizado exitosamente: ${query}`);
      return {
        success: true,
        message: 'Jugador actualizado exitosamente'
      };
    } catch (error) {
      console.error(`❌ Error actualizando jugador ${query}:`, error);
      
      // Si es un error de rate limit, extraer el tiempo de espera si está disponible
      if (error instanceof Error && error.message.includes('Rate limit')) {
        // Extract wait time from the error message if it contains specific minutes
        let waitTimeSeconds = 1800; // 30 minutes default
        const minutesMatch = error.message.match(/(\d+)\s+minutos/);
        if (minutesMatch) {
          const minutes = parseInt(minutesMatch[1]);
          waitTimeSeconds = minutes * 60;
          console.log(`🕐 Tiempo de espera extraído del error: ${minutes} minutos (${waitTimeSeconds} segundos)`);
        }
        
        return {
          success: false,
          message: error.message,
          waitTime: waitTimeSeconds
        };
      }
      
      throw error;
    }
  }

  // Rate limiting storage for player stats (3 requests per minute)
  private static playerStatsRateLimit = new Map<string, { requests: number; resetTime: number }>();

  // Método para obtener SOLO stats sin actualizar (evita duplicaciones) - RATE LIMITED 3 req/min
  async getPlayerStats(uid: string, seasonNum?: number): Promise<any> {
    const actualSeason = seasonNum || parseFloat(this.season) || 4;
    console.log(`📊 Obteniendo datos completos del jugador: ${uid} (Season ${actualSeason})`);
    
    // 🚦 RATE LIMITING: 3 requests per minute per UID
    const rateLimitKey = `player_stats_${uid}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 3;
    
    let rateLimitData = MarvelRivalsAPI.playerStatsRateLimit.get(rateLimitKey);
    
    // Initialize or reset rate limit data if window has passed
    if (!rateLimitData || now >= rateLimitData.resetTime) {
      rateLimitData = {
        requests: 0,
        resetTime: now + windowMs
      };
      MarvelRivalsAPI.playerStatsRateLimit.set(rateLimitKey, rateLimitData);
    }
    
    // Check if rate limit is exceeded
    if (rateLimitData.requests >= maxRequests) {
      const waitTimeMs = rateLimitData.resetTime - now;
      const waitTimeSeconds = Math.ceil(waitTimeMs / 1000);
      console.warn(`🚦 RATE LIMIT: Player stats para ${uid} excedió 3 req/min - debe esperar ${waitTimeSeconds}s`);
      throw new Error(`Rate limit de player stats: Debe esperar ${waitTimeSeconds} segundos antes de obtener stats de este jugador nuevamente (3 req/min)`);
    }
    
    // Increment request count
    rateLimitData.requests++;
    console.log(`🚦 Rate limit player stats: ${rateLimitData.requests}/${maxRequests} requests usados para ${uid} (reset en ${Math.ceil((rateLimitData.resetTime - now) / 1000)}s)`);
    
    try {
      const params = new URLSearchParams({
        season: actualSeason.toString()
      });
      
      const data = await this.makeRequest(`/api/v2/player/${encodeURIComponent(uid)}`, params);
      
      if (!data || !data.player) {
        throw new Error(`No se encontraron datos para el jugador "${uid}"`);
      }

      console.log(`✅ Datos completos obtenidos para ${uid} (${rateLimitData.requests}/${maxRequests} rate limit)`);
      return data;
    } catch (error) {
      console.error(`❌ Error obteniendo datos de ${uid}:`, error);
      throw error;
    }
  }

  // Método principal que orquesta todo el proceso - OPTIMIZADO PARA EVITAR REDUNDANCIAS
  static async fetchUser(username: string, apiKey: string, season: string = '4', db?: any, abortSignal?: AbortSignal): Promise<PlayerData> {
    const api = new MarvelRivalsAPI(apiKey, season);
    
    try {
      console.log(`🚀 Iniciando proceso LEGACY completo para: ${username}`);
      console.log('⚠️ ADVERTENCIA: Método legacy - considera usar getPlayerStats para solo obtener datos');
      console.log(`🚦 Rate limiting inteligente activado - detecta headers automáticamente`);
      
      // Paso 1: Obtener UID (solo necesario la primera vez - API devuelve 'uid')
      const playerInfo = await api.findPlayer(username, abortSignal);
      
      // Paso 2: PRIMERO intentar actualizar datos del jugador
      try {
        const updateResult = await api.updatePlayer(playerInfo.uuid, abortSignal);
        
        if (!updateResult.success && updateResult.waitTime) {
          console.log(`⚠️ No se puede actualizar ahora, obteniendo datos existentes`);
          console.log(`🚦 Rate limit detectado: esperar ${Math.ceil(updateResult.waitTime / 60)} minutos`);
        } else if (updateResult.success) {
          console.log(`✅ Jugador actualizado exitosamente: ${playerInfo.uuid}`);
        }
      } catch (updateError) {
        // Si no se puede actualizar por rate limit, continuar sin actualizar
        const errorMessage = updateError instanceof Error ? updateError.message : 'Error desconocido';
        if (errorMessage.includes('Rate limit') || errorMessage.includes('esperar')) {
          console.log('⚠️ No se puede actualizar ahora, obteniendo datos existentes');
          const waitMinutes = api.extractWaitTimeFromError ? api.extractWaitTimeFromError(errorMessage) : 30;
          console.log(`🚦 Rate limit detectado: esperar ${Math.round(waitMinutes/60)} minutos`);
        } else {
          throw updateError; // Si es otro tipo de error, propagarlo
        }
      }
      
      // Paso 3: Obtener datos completos
      const rawData = await api.getPlayerStats(playerInfo.uuid, parseFloat(season));
      
      // Parsear y estructurar los datos (with competition filtering if db is provided)
      const playerData = await api.parsePlayerData(rawData, playerInfo, db);
      
      console.log(`✅ Proceso completo exitoso para: ${username}`);
      return playerData;
      
    } catch (error) {
      console.error(`❌ Error en proceso completo para ${username}:`, error);
      throw error;
    }
  }

  // Helper method to extract wait time from error messages
  private extractWaitTimeFromError(errorMessage: string): number {
    let waitTimeSeconds = 1800; // 30 minutes default
    const minutesMatch = errorMessage.match(/(\d+)\s+minutos/);
    if (minutesMatch) {
      const minutes = parseInt(minutesMatch[1]);
      waitTimeSeconds = minutes * 60;
    }
    return waitTimeSeconds;
  }

  // Parsear los datos del JSON de Season 4 a nuestra estructura - SOLO DATOS RANKED
  public async parsePlayerData(rawData: any, playerInfo: { uuid: string; username: string }, db?: any): Promise<PlayerData> {
    const player = rawData.player || {};
    // CORREGIDO: Las stats ranked están anidadas dentro de overall_stats.ranked
    const rankedStats = rawData.overall_stats?.ranked || {}; 
    const heroesRanked = rawData.heroes_ranked || []; // USAR LLAVE 'heroes_ranked' ESPECÍFICA
    
    console.log(`🏆 Procesando datos RANKED ÚNICAMENTE para ${playerInfo.username}`);
    console.log(`📊 Héroes ranked encontrados: ${heroesRanked.length}`);
    console.log(`🎯 Ranked stats disponibles: ${Object.keys(rankedStats).length} categorías`);
    console.log(`🔍 Secciones disponibles en rawData: ${Object.keys(rawData).join(', ')}`);
    console.log(`🔍 overall_stats disponible: ${rawData.overall_stats ? 'SÍ' : 'NO'}`);
    console.log(`🔍 overall_stats.ranked disponible: ${rawData.overall_stats?.ranked ? 'SÍ' : 'NO'}`);
    
    // Log detallado para debugging
    if (rawData.overall_stats?.ranked) {
      console.log(`✅ overall_stats.ranked encontrado con keys: ${Object.keys(rankedStats).join(', ')}`);
      console.log(`📊 Ranked data: total_matches=${rankedStats.total_matches}, total_wins=${rankedStats.total_wins}`);
    } else {
      console.log(`⚠️ overall_stats.ranked NO encontrado. Usando overall_stats como fallback`);
    }
    
    // FALLBACK: Si no hay ranked anidado, usar overall_stats pero indicarlo claramente
    const statsSource = rankedStats && Object.keys(rankedStats).length > 0 ? rankedStats : rawData.overall_stats || {};
    const dataSourceType = rankedStats && Object.keys(rankedStats).length > 0 ? 'RANKED ANIDADO' : 'OVERALL (fallback)';
    
    console.log(`📊 Usando fuente de datos: ${dataSourceType}`);
    
    // Información básica del jugador - MAPEO CORRECTO CON PUNTOS RS
    const parsedPlayerInfo: PlayerInfo = {
      username: playerInfo.username,
      uuid: playerInfo.uuid,
      level: parseInt(player.level || '0'),
      rank: player.rank?.rank || null, // player.rank.rank = "Platinum II"
      score: parseInt((player.rank?.score || '0').toString().replace(/,/g, '')), // CORREGIDO: Extraer puntos RS del score
      avatar: player.icon?.player_icon || null,
      banner: player.icon?.banner || null
    };

    console.log(`🏆 Rank data extraído: ${parsedPlayerInfo.rank} con ${parsedPlayerInfo.score} RS`);

    // Estadísticas generales - MAPEO DESDE LLAVE 'overall_stats.ranked' (o fallback a overall)
    const overview: OverviewStats = {
      matchesPlayed: statsSource.total_matches || 0,
      matchesWon: statsSource.total_wins || 0,
      kills: statsSource.total_kills || 0,
      deaths: statsSource.total_deaths || 0,
      assists: statsSource.total_assists || 0,
      kdRatio: statsSource.total_deaths > 0 ? (statsSource.total_kills / statsSource.total_deaths) : 0,
      kdaRatio: statsSource.total_deaths > 0 ? ((statsSource.total_kills + statsSource.total_assists) / statsSource.total_deaths) : 0,
      timePlayed: statsSource.total_time_played_raw || 0,
      totalHeroDamage: 0, // Se calculará sumando desde heroes_ranked
      totalHeroHeal: 0, // Se calculará sumando desde heroes_ranked
      totalDamageTaken: 0, // Se calculará sumando desde heroes_ranked
      totalMvp: statsSource.total_mvp || 0,
      totalSvp: statsSource.total_svp || 0,
      maxKillStreak: 0 // No disponible en ranked directo
    };

    // Estadísticas de héroes - DESDE heroes_ranked
    const heroes: HeroStats[] = [];
    
    heroesRanked.forEach((hero: any) => {
      // DEPURACIÓN AVANZADA: Log completo del héroe desde la API
      console.log(`🔍 Procesando héroe desde API:`, {
        hero_id: hero.hero_id,
        hero_name: hero.hero_name,
        hero_class: hero.hero_class,
        matches: hero.matches,
        wins: hero.wins,
        full_hero_object: hero
      });
      
      // FILTRO CRÍTICO: Solo incluir héroes con partidas jugadas Y nombre válido
      if (hero.matches > 0) {
        // MAPEO ESPECIAL: Detectar héroes específicos por ID cuando la API devuelve "Unknown"
        let heroName = hero.hero_name;
        let heroClass = hero.hero_class;
        
        // ANGELA FIX: hero_id 1056 = "Angela" (Vanguard)
        if (hero.hero_id === 1056 || hero.hero_id === '1056') {
          if (!hero.hero_name || hero.hero_name.trim() === '' || hero.hero_name.toLowerCase() === 'unknown') {
            console.log(`🔧 MAPEO ESPECIAL: Detectado hero_id 1056 con nombre "${hero.hero_name}" -> mapeando a "Angela"`);
            heroName = 'Angela';
            heroClass = 'Vanguard';
            console.log(`   ✅ Angela mapeada correctamente: nombre="${heroName}", class="${heroClass}"`);
          }
        }
        
        // VALIDACIÓN: Rechazar héroes con nombres "Unknown" o inválidos desde la API (después del mapeo especial)
        if (!heroName || heroName.trim() === '' || heroName.toLowerCase() === 'unknown') {
          console.warn(`⚠️ HÉROE RECHAZADO: héroe con nombre inválido/Unknown desde API:`, hero);
          console.warn(`   • hero_id: ${hero.hero_id}`);
          console.warn(`   • hero_name: "${hero.hero_name}" -> "${heroName}"`);
          console.warn(`   • hero_class: "${hero.hero_class}" -> "${heroClass}"`);
          console.warn(`   • matches: ${hero.matches}`);
          console.warn(`   • ACCIÓN: Saltando este héroe para evitar "Unknown" en la BD`);
          return; // Saltar este héroe completamente
        }
        
        // Limpiar nombre del héroe y convertir a formato consistente (usar el heroName ya mapeado)
        const cleanedHeroName = this.cleanHeroName(heroName);
        
        // SEGUNDA VALIDACIÓN: Después de limpiar, verificar que no sea "Unknown"
        if (cleanedHeroName === 'Unknown' || cleanedHeroName.toLowerCase() === 'unknown') {
          console.warn(`⚠️ HÉROE RECHAZADO POST-LIMPIEZA: "${heroName}" -> "${cleanedHeroName}"`);
          console.warn(`   • hero_id: ${hero.hero_id}`);
          console.warn(`   • ACCIÓN: Saltando para evitar "Unknown" en la BD`);
          return; // Saltar este héroe completamente
        }
        
        const winRate = hero.matches > 0 ? (hero.wins / hero.matches) * 100 : 0;
        const kdRatio = hero.deaths > 0 ? hero.kills / hero.deaths : 0;
        const kdaRatio = hero.deaths > 0 ? (hero.kills + hero.assists) / hero.deaths : 0;
        
        console.log(`✅ HÉROE VÁLIDO ACEPTADO: "${hero.hero_name}" -> "${cleanedHeroName}"`);
        if (hero.hero_id === 1056 || hero.hero_id === '1056') {
          console.log(`   🎯 ANGELA CONFIRMADA: ID ${hero.hero_id} mapeada exitosamente`);
        }
        
        heroes.push({
          heroName: cleanedHeroName,
          matchesPlayed: hero.matches || 0,
          matchesWon: hero.wins || 0,
          kills: hero.kills || 0,
          deaths: hero.deaths || 0,
          assists: hero.assists || 0,
          kdRatio: kdRatio,
          kdaRatio: kdaRatio,
          timePlayed: hero.play_time || 0,
          totalHeroDamage: hero.damage || 0,
          totalHeroHeal: hero.heal || 0,
          totalDamageTaken: hero.damage_taken || 0,
          winRate: winRate
        });
      }
    });

    console.log(`🦸 Héroes RANKED procesados (solo con partidas): ${heroes.length}`);

    // CALCULAR TOTALES SUMANDO DESDE HEROES_RANKED
    let totalHeroDamageSum = 0;
    let totalHeroHealSum = 0;
    let totalDamageTakenSum = 0;
    
    heroesRanked.forEach((hero: any) => {
      if (hero.matches > 0) { // Solo incluir héroes con partidas jugadas
        totalHeroDamageSum += hero.damage || 0;
        totalHeroHealSum += hero.heal || 0;
        totalDamageTakenSum += hero.damage_taken || 0;
      }
    });
    
    // Asignar los totales calculados al overview
    overview.totalHeroDamage = totalHeroDamageSum;
    overview.totalHeroHeal = totalHeroHealSum;
    overview.totalDamageTaken = totalDamageTakenSum;
    
    console.log(`📊 Totales calculados desde heroes_ranked:`);
    console.log(`   • Daño total: ${totalHeroDamageSum.toLocaleString()}`);
    console.log(`   • Curación total: ${totalHeroHealSum.toLocaleString()}`);
    console.log(`   • Daño recibido total: ${totalDamageTakenSum.toLocaleString()}`);
    console.log(`   • Calculado desde ${heroesRanked.filter((h: any) => h.matches > 0).length} héroes con partidas`);

    // Estadísticas de roles - CALCULAR DESDE heroes_ranked agrupando por roles
    const roles: RoleStats[] = [];
    const roleMap: Record<string, any> = {};
    
    // Mapeo de héroes a roles (basado en Marvel Rivals)
    const heroToRole: Record<string, string> = {
      // Vanguard
      'hulk': 'Vanguard',
      'captain america': 'Vanguard', 
      'captain-america': 'Vanguard',
      'doctor strange': 'Vanguard',
      'doctor-strange': 'Vanguard',
      'groot': 'Vanguard',
      'magneto': 'Vanguard',
      'peni parker': 'Vanguard',
      'peni-parker': 'Vanguard',
      'the thing': 'Vanguard',
      'the-thing': 'Vanguard',
      'thor': 'Vanguard',
      'venom': 'Vanguard',
      'angela': 'Vanguard', // CONFIRMADO: Angela es Vanguard
      
      // Duelist
      'black panther': 'Duelist',
      'black-panther': 'Duelist',
      'black widow': 'Duelist',
      'black-widow': 'Duelist',
      'blade': 'Duelist',
      'emma frost': 'Duelist',
      'emma-frost': 'Duelist',
      'hawkeye': 'Duelist',
      'hela': 'Duelist',
      'human torch': 'Duelist',
      'human-torch': 'Duelist',
      'iron fist': 'Duelist',
      'iron-fist': 'Duelist',
      'iron man': 'Duelist',
      'iron-man': 'Duelist',
      'magik': 'Duelist',
      'moon knight': 'Duelist',
      'moon-knight': 'Duelist',
      'namor': 'Duelist',
      'phoenix': 'Duelist',
      'psylocke': 'Duelist',
      'scarlet witch': 'Duelist',
      'scarlet-witch': 'Duelist',
      'spider-man': 'Duelist',
      'spiderman': 'Duelist',
      'spider man': 'Duelist',
      'squirrel girl': 'Duelist',
      'squirrel-girl': 'Duelist',
      'star-lord': 'Duelist',
      'star lord': 'Duelist',
      'storm': 'Duelist',
      'the punisher': 'Duelist',
      'the-punisher': 'Duelist',
      'ultron': 'Duelist',
      'winter soldier': 'Duelist',
      'winter-soldier': 'Duelist',
      'wolverine': 'Duelist',
      
      // Strategist
      'adam warlock': 'Strategist',
      'adam-warlock': 'Strategist',
      'cloak & dagger': 'Strategist',
      'cloak and dagger': 'Strategist',
      'cloak-and-dagger': 'Strategist',
      'invisible woman': 'Strategist',
      'invisible-woman': 'Strategist',
      'jeff the land shark': 'Strategist',
      'jeff-the-land-shark': 'Strategist',
      'jeff': 'Strategist',
      'loki': 'Strategist',
      'luna snow': 'Strategist',
      'luna-snow': 'Strategist',
      'mantis': 'Strategist',
      'mister fantastic': 'Strategist',
      'mister-fantastic': 'Strategist',
      'rocket raccoon': 'Strategist',
      'rocket-raccoon': 'Strategist',
      'rocket': 'Strategist'
    };
    
    // Agrupar héroes por rol
    heroesRanked.forEach((hero: any) => {
      if (hero.matches > 0) {
        // MAPEO ESPECIAL PARA ROLES: Aplicar el mismo mapeo que en heroes
        let heroNameForRole = hero.hero_name;
        
        // ANGELA FIX PARA ROLES: hero_id 1056 = "Angela" (Vanguard)
        if (hero.hero_id === 1056 || hero.hero_id === '1056') {
          if (!hero.hero_name || hero.hero_name.trim() === '' || hero.hero_name.toLowerCase() === 'unknown') {
            console.log(`🔧 ROLE MAPPING - MAPEO ESPECIAL: Detectado hero_id 1056 -> "Angela" para roles`);
            heroNameForRole = 'Angela';
          }
        }
        
        // VALIDACIÓN PRIMERA: Rechazar héroes con nombres "Unknown" o inválidos desde la API (después del mapeo)
        if (!heroNameForRole || heroNameForRole.trim() === '' || heroNameForRole.toLowerCase() === 'unknown') {
          console.warn(`⚠️ ROLE MAPPING - HÉROE RECHAZADO: héroe con nombre inválido/Unknown desde API:`, {
            hero_id: hero.hero_id,
            hero_name: hero.hero_name,
            mapped_name: heroNameForRole,
            hero_class: hero.hero_class,
            matches: hero.matches
          });
          return; // Saltar este héroe para roles también
        }
        
        const cleanedHeroName = this.cleanHeroName(heroNameForRole);
        
        // VALIDACIÓN SEGUNDA: Después de limpiar, verificar que no sea "Unknown"
        if (cleanedHeroName === 'Unknown' || cleanedHeroName.toLowerCase() === 'unknown') {
          console.warn(`⚠️ ROLE MAPPING - HÉROE RECHAZADO POST-LIMPIEZA: "${heroNameForRole}" -> "${cleanedHeroName}"`);
          console.warn(`   • hero_id: ${hero.hero_id}`);
          return; // Saltar este héroe para roles también
        }
        
        const heroNameLowerForRole = cleanedHeroName.toLowerCase();
        
        console.log(`🔍 Mapeando héroe: "${hero.hero_name}" -> mapeado: "${heroNameForRole}" -> limpio: "${cleanedHeroName}" -> buscar rol: "${heroNameLowerForRole}"`);
        if (hero.hero_id === 1056 || hero.hero_id === '1056') {
          console.log(`   🎯 ANGELA ROLE MAPPING: ID ${hero.hero_id} -> "${cleanedHeroName}" -> buscando role...`);
        }
        
        const roleName = heroToRole[heroNameLowerForRole] || 'Unknown';
        
        if (roleName === 'Unknown') {
          console.error(`❌ HÉROE NO MAPEADO: "${cleanedHeroName}" (original: "${hero.hero_name}", mapeado: "${heroNameForRole}") no encontrado en mapeo de roles`);
          console.error(`🔍 hero_id: ${hero.hero_id}`);
          console.error(`🔍 Héroe sin mapear se saltará para evitar rol "Unknown"`);
          console.error(`🔍 Claves similares disponibles que empiecen con '${heroNameLowerForRole.charAt(0)}':`, 
            Object.keys(heroToRole).filter(k => k.startsWith(heroNameLowerForRole.charAt(0))));
          console.error(`🔍 TODAS las claves disponibles:`, Object.keys(heroToRole).sort());
          return; // CRÍTICO: Saltar este héroe si no se puede mapear el rol
        } else {
          console.log(`✅ Héroe "${cleanedHeroName}" mapeado a rol: ${roleName}`);
          if (hero.hero_id === 1056 || hero.hero_id === '1056') {
            console.log(`   🎯 ANGELA ROLE CONFIRMADO: ID ${hero.hero_id} -> role "${roleName}"`);
          }
        }
        
        if (!roleMap[roleName]) {
          roleMap[roleName] = {
            matchesPlayed: 0,
            matchesWon: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
            timePlayed: 0,
            totalHeroDamage: 0,
            totalHeroHeal: 0,
            totalDamageTaken: 0
          };
        }
        
        roleMap[roleName].matchesPlayed += hero.matches || 0;
        roleMap[roleName].matchesWon += hero.wins || 0;
        roleMap[roleName].kills += hero.kills || 0;
        roleMap[roleName].deaths += hero.deaths || 0;
        roleMap[roleName].assists += hero.assists || 0;
        roleMap[roleName].timePlayed += hero.play_time || 0;
        roleMap[roleName].totalHeroDamage += hero.damage || 0;
        roleMap[roleName].totalHeroHeal += hero.heal || 0;
        roleMap[roleName].totalDamageTaken += hero.damage_taken || 0;
      }
    });
    
    // Convertir a array de roles
    Object.entries(roleMap).forEach(([roleName, roleData]: [string, any]) => {
      if (roleData.matchesPlayed > 0) {
        const kdRatio = roleData.deaths > 0 ? roleData.kills / roleData.deaths : 0;
        const kdaRatio = roleData.deaths > 0 ? (roleData.kills + roleData.assists) / roleData.deaths : 0;
        const winRate = roleData.matchesPlayed > 0 ? (roleData.matchesWon / roleData.matchesPlayed) * 100 : 0;
        
        roles.push({
          roleName: this.normalizeRoleName(roleName),
          matchesPlayed: roleData.matchesPlayed,
          matchesWon: roleData.matchesWon,
          kills: roleData.kills,
          deaths: roleData.deaths,
          assists: roleData.assists,
          kdRatio: kdRatio,
          kdaRatio: kdaRatio,
          timePlayed: roleData.timePlayed,
          totalHeroDamage: roleData.totalHeroDamage,
          totalHeroHeal: roleData.totalHeroHeal,
          totalDamageTaken: roleData.totalDamageTaken,
          winRate: winRate
        });
      }
    });

    console.log(`🎭 Roles RANKED calculados desde heroes_ranked: ${roles.length}`);

    // Historial de rangos - DESDE rank_history
    const rankHistory: RankHistory[] = [];
    if (rawData.rank_history && Array.isArray(rawData.rank_history)) {
      rawData.rank_history.forEach((_rankEntry: any) => {
        rankHistory.push({
          season: 'Current', // La API no especifica temporada claramente
          rank: 'Unknown', // Necesitaríamos más datos para extraer el rango
          score: 0,
          wins: 0
        });
      });
    }

    // Get competition start timestamp for filtering (if database is available)
    let competitionStartUTC: string | null = null;
    if (db) {
      try {
        const { getCompetitionStartTimestamp } = await import('./competition-filter');
        competitionStartUTC = await getCompetitionStartTimestamp(db);
        
        if (competitionStartUTC) {
          console.log(`🗓️ Competition filtering enabled: matches must be after ${competitionStartUTC}`);
          console.log(`🇲🇽 Competition start in Mexico City: ${new Intl.DateTimeFormat('es-MX', {
            timeZone: 'America/Mexico_City',
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            weekday: 'long'
          }).format(new Date(competitionStartUTC))}`);
        } else {
          console.log(`📊 No competition start date configured - using all matches`);
        }
      } catch (error) {
        console.warn('Could not load competition filtering (non-critical):', error);
      }
    }

    // Historial de partidas - DESDE match_history
    const matchHistory: MatchHistoryEntry[] = [];
    if (rawData.match_history && Array.isArray(rawData.match_history)) {
      console.log(`📊 Procesando historial de partidas: ${rawData.match_history.length} partidas encontradas`);
      
      // Primero: Intentar obtener partidas ranked con score_change
      const rankedMatches = rawData.match_history
        .filter((match: any) => {
          const playerPerformance = match.player_performance;
          if (playerPerformance && playerPerformance.player_uid === Number(playerInfo.uuid)) {
            const hasScoreChange = playerPerformance.score_change !== undefined && playerPerformance.score_change !== null;
            return hasScoreChange;
          }
          return false;
        });
      
      console.log(`🏆 Partidas ranked encontradas (con score_change): ${rankedMatches.length}`);
      
      // FALLBACK: Si no hay partidas ranked con score_change, usar todas las partidas pero con score_change = 0
      let matchesToProcess = rankedMatches;
      if (rankedMatches.length === 0) {
        console.log(`⚠️ No hay partidas con score_change - usando todas las partidas como fallback`);
        matchesToProcess = rawData.match_history.slice(0, 10); // Usar todas, limitado a 10
      }
      
      const processedMatches = matchesToProcess
        .slice(0, 10) // Limitar a 10 partidas más recientes
        .map((match: any, index: number) => {
          console.log(`🔍 DEBUG: Procesando partida ${index + 1}:`, {
            match_uid: match.match_uid,
            winner_side: match.winner_side,
            player_performance_keys: match.player_performance ? Object.keys(match.player_performance) : 'No player_performance',
            player_uid_en_data: match.player_performance?.player_uid
          });
          
          // Procesar datos de la partida
          const playerPerformance = match.player_performance;
          let result: 'win' | 'loss' = 'loss';
          let heroPlayed = 'Unknown';
          let kills = 0;
          let deaths = 0;
          let assists = 0;
          let score = 0;
          let scoreChange = 0;
          
          // CORREGIDO: player_performance es un objeto directo, no un mapa de UUIDs
          if (playerPerformance && playerPerformance.player_uid === Number(playerInfo.uuid)) {
            console.log(`🔍 DEBUG: Player data encontrado para partida ${index + 1}:`, {
              hero_name: playerPerformance.hero_name,
              kills: playerPerformance.kills,
              deaths: playerPerformance.deaths,
              assists: playerPerformance.assists,
              score: playerPerformance.score || 'N/A',
              score_change: playerPerformance.score_change,
              winner_side: playerPerformance.winner_side || 'N/A',
              camp: playerPerformance.camp,
              is_win: playerPerformance.is_win
            });
            
            // Determinar resultado basado en is_win o comparando camp con winner_side
            if (playerPerformance.is_win && typeof playerPerformance.is_win === 'object') {
              result = playerPerformance.is_win.is_win ? 'win' : 'loss';
            } else if (playerPerformance.camp !== undefined && match.winner_side !== undefined) {
              result = playerPerformance.camp === match.winner_side ? 'win' : 'loss';
            } else {
              result = 'loss'; // Default fallback
            }
            
            heroPlayed = this.cleanHeroName(playerPerformance.hero_name || 'Unknown');
            
            kills = playerPerformance.kills || 0;
            deaths = playerPerformance.deaths || 0;
            assists = playerPerformance.assists || 0;
            score = playerPerformance.score || 0;
            scoreChange = playerPerformance.score_change || 0; // RS change - positivo/negativo (0 si no disponible)
            
            console.log(`✅ DATOS EXTRAÍDOS CORRECTAMENTE - Partida ${index + 1}:`, {
              result,
              heroPlayed,
              kills,
              deaths,
              assists,
              scoreChange
            });
          }
          
          // Extraer información del mapa y duración usando la base de datos oficial de mapas
          let mapName = null;
          let mapImageUrl = null;
          let duration = null;
          
          if (match.map_id) {
            // Usar la base de datos oficial de mapas de Marvel Rivals
            const mapInfo = getMapInfoFromId(match.map_id);
            if (mapInfo) {
              mapName = mapInfo.name;
              mapImageUrl = mapInfo.imageUrl;
              console.log(`🗺️ DEBUG: Mapa oficial encontrado en partida ${index + 1}: ID ${match.map_id} -> ${mapName} -> ${mapImageUrl}`);
            } else {
              // Fallback si no encontramos el mapa en nuestra base de datos
              mapName = `Map ${match.map_id}`;
              console.log(`🗺️ DEBUG: Mapa no encontrado en base de datos, usando fallback: ${mapName}`);
            }
          }
          
          // Fallback adicional: usar map_thumbnail si no hay map_id o no se encontró en la BD
          if (!mapImageUrl && match.map_thumbnail) {
            mapImageUrl = `https://marvelrivalsapi.com${match.map_thumbnail}`;
            console.log(`🗺️ DEBUG: Usando map_thumbnail como fallback en partida ${index + 1}: ${mapImageUrl}`);
          }
          
          if (match.duration) {
            duration = Math.round(match.duration); // Convertir a segundos enteros
            console.log(`⏱️ DEBUG: Duración detectada en partida ${index + 1}: ${duration} segundos`);
          }

          const processedMatch = {
            matchId: match.match_uid || `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            result,
            heroPlayed,
            kills,
            deaths,
            assists,
            score,
            scoreChange,
            timestamp: match.match_time_stamp ? new Date(match.match_time_stamp * 1000).toISOString() : new Date().toISOString(),
            mapName,
            mapImageUrl
          };
          
          console.log(`✅ DEBUG: Partida ${index + 1} procesada:`, processedMatch);
          return processedMatch;
        });
      
      console.log(`🏆 Partidas procesadas: ${processedMatches.length}/10 (prioridad a ranked con score_change)`);
      
      // Apply competition filtering if enabled
      if (competitionStartUTC) {
        const { filterMatchesForCompetition, logCompetitionFiltering } = await import('./competition-filter');
        const filterResult = filterMatchesForCompetition(processedMatches, competitionStartUTC);
        
        logCompetitionFiltering(processedMatches.length, filterResult.competitionMatches, competitionStartUTC);
        
        if (filterResult.competitionMatches < processedMatches.length) {
          console.log(`🗓️ Competition filter: ${filterResult.competitionMatches}/${processedMatches.length} matches valid`);
          console.log(`❌ Filtered out: ${filterResult.invalidMatches.length} matches before competition start`);
        }
        
        matchHistory.push(...filterResult.validMatches);
      } else {
        matchHistory.push(...processedMatches);
      }
    }

    console.log(`🏆 DATOS RANKED procesados exitosamente (fuente: ${dataSourceType}):`);
    console.log(`   • ${overview.matchesPlayed} partidas RANKED (llave: overall_stats.ranked.total_matches)`);
    console.log(`   • ${overview.matchesWon} victorias RANKED (llave: overall_stats.ranked.total_wins)`);
    console.log(`   • ${overview.kills}/${overview.deaths}/${overview.assists} KDA RANKED`);
    console.log(`   • ${heroes.length} héroes RANKED con partidas (llave: heroes_ranked)`);
    console.log(`   • ${roles.length} roles RANKED calculados desde heroes_ranked`);
    console.log(`   • ${rankHistory.length} entradas historial de rangos`);
    console.log(`   • ${matchHistory.length} partidas en historial`);
    
    // ADVERTENCIA si usamos fallback
    if (dataSourceType.includes('fallback')) {
      console.log(`⚠️ ADVERTENCIA: No se encontró llave 'overall_stats.ranked', usando overall_stats completo`);
      console.log(`⚠️ Las estadísticas pueden incluir partidas no rankeadas`);
    } else {
      console.log(`✅ CONFIRMADO: Usando datos EXCLUSIVAMENTE de partidas RANKED desde overall_stats.ranked`);
    }

    return {
      playerInfo: parsedPlayerInfo,
      overview,
      heroes,
      roles,
      rankHistory: rankHistory.length > 0 ? rankHistory : undefined,
      matchHistory: matchHistory.length > 0 ? matchHistory : undefined
    };
  }

  // Limpiar y normalizar nombres de héroes
  private cleanHeroName(heroName: string): string {
    if (!heroName) return 'Unknown';
    
    // Casos especiales para héroes con nombres específicos
    const lowerName = heroName.toLowerCase().trim();
    
    // Mapeo específico para casos problemáticos
    const specialCases: Record<string, string> = {
      // Casos especiales confirmados
      'angela': 'Angela',
      'blade': 'Blade',
      'emma frost': 'Emma Frost',
      'emma-frost': 'Emma Frost',
      'human torch': 'Human Torch',
      'human-torch': 'Human Torch',
      'iron fist': 'Iron Fist',
      'iron-fist': 'Iron Fist',
      'moon knight': 'Moon Knight',
      'moon-knight': 'Moon Knight',
      'phoenix': 'Phoenix',
      'ultron': 'Ultron',
      
      // Casos con artículos y conectores
      'cloak & dagger': 'Cloak & Dagger',
      'cloak and dagger': 'Cloak & Dagger',
      'cloak_dagger': 'Cloak & Dagger',
      'cloak-dagger': 'Cloak & Dagger',
      'jeff the land shark': 'Jeff the Land Shark',
      'jeff_the_land_shark': 'Jeff the Land Shark',
      'jeff-the-land-shark': 'Jeff the Land Shark',
      'mister fantastic': 'Mister Fantastic',
      'mr fantastic': 'Mister Fantastic',
      'mr. fantastic': 'Mister Fantastic',
      'the thing': 'The Thing',
      'the_thing': 'The Thing',
      'the-thing': 'The Thing',
      'the punisher': 'The Punisher',
      'the_punisher': 'The Punisher',
      'the-punisher': 'The Punisher',
      
      // Variaciones de nombres compuestos
      'adam warlock': 'Adam Warlock',
      'adam-warlock': 'Adam Warlock',
      'black panther': 'Black Panther',
      'black-panther': 'Black Panther',
      'black widow': 'Black Widow',
      'black-widow': 'Black Widow',
      'captain america': 'Captain America',
      'captain-america': 'Captain America',
      'doctor strange': 'Doctor Strange',
      'doctor-strange': 'Doctor Strange',
      'dr strange': 'Doctor Strange',
      'dr. strange': 'Doctor Strange',
      'invisible woman': 'Invisible Woman',
      'invisible-woman': 'Invisible Woman',
      'iron man': 'Iron Man',
      'iron-man': 'Iron Man',
      'luna snow': 'Luna Snow',
      'luna-snow': 'Luna Snow',
      'peni parker': 'Peni Parker',
      'peni-parker': 'Peni Parker',
      'rocket raccoon': 'Rocket Raccoon',
      'rocket-raccoon': 'Rocket Raccoon',
      'scarlet witch': 'Scarlet Witch',
      'scarlet-witch': 'Scarlet Witch',
      'spider-man': 'Spider-Man',
      'spiderman': 'Spider-Man',
      'spider man': 'Spider-Man',
      'squirrel girl': 'Squirrel Girl',
      'squirrel-girl': 'Squirrel Girl',
      'star-lord': 'Star-Lord',
      'star lord': 'Star-Lord',
      'winter soldier': 'Winter Soldier',
      'winter-soldier': 'Winter Soldier'
    };
    
    if (specialCases[lowerName]) {
      return specialCases[lowerName];
    }
    
    // Convertir a formato Title Case y limpiar caracteres especiales
    return heroName
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/[^a-zA-Z0-9\s\-&]/g, '') // Mantener letras, números, espacios, guiones y &
      .trim();
  }

  // Normalizar nombres de roles
  private normalizeRoleName(roleName: string): string {
    if (!roleName) return 'Unknown';
    
    const roleMap: Record<string, string> = {
      'strategist': 'Strategist',
      'vanguard': 'Vanguard', 
      'duelist': 'Duelist'
    };
    
    const normalized = roleName.toLowerCase().trim();
    return roleMap[normalized] || roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase();
  }
}

// Map data utilities for Marvel Rivals maps
const MARVEL_RIVALS_MAPS_LOOKUP = new Map([
  [1032, { name: "Yggdrasill Path", image: "/rivals/maps/map_1032.png" }],
  [1034, { name: "Shin-Shibuya", image: "/rivals/maps/map_1034.png" }],
  [1101, { name: "Hall of Djalia", image: "/rivals/maps/map_1101.png" }],
  [1118, { name: "Sanctum Sanctorum", image: "/rivals/maps/map_1118.png" }],
  [1148, { name: "Spider-Islands", image: "/rivals/maps/map_1148.png" }],
  [1155, { name: "Bifrost Garden", image: "/rivals/maps/map_1155.png" }],
  [1156, { name: "Throne Room", image: "/rivals/maps/map_1156.png" }],
  [1161, { name: "Stellar Spaceport", image: "/rivals/maps/map_1161.png" }],
  [1162, { name: "Imperial Institute of Science", image: "/rivals/maps/map_1162.png" }],
  [1169, { name: "Warrior Falls", image: "/rivals/maps/map_1169.png" }],
  [1170, { name: "Royal Palace", image: "/rivals/maps/map_1170.png" }],
  [1201, { name: "Midtown", image: "/rivals/maps/map_1201.png" }],
  [1230, { name: "Shin-Shibuya", image: "/rivals/maps/map_1230.png" }],
  [1231, { name: "Yggdrasill Path", image: "/rivals/maps/map_1231.png" }],
  [1235, { name: "Birnin T'Challa", image: "/rivals/maps/map_1235.png" }],
  [1236, { name: "Royal Palace", image: "/rivals/maps/map_1236.png" }],
  [1240, { name: "Symbiotic Surface", image: "/rivals/maps/map_1240.png" }],
  [1243, { name: "Super-Soldier Factory", image: "/rivals/maps/map_1243.png" }],
  [1244, { name: "Frozen Airfield", image: "/rivals/maps/map_1244.png" }],
  [1245, { name: "Spider-Islands", image: "/rivals/maps/map_1245.png" }],
  [1246, { name: "Ninomaru", image: "/rivals/maps/map_1246.png" }],
  [1254, { name: "Royal Palace", image: "/rivals/maps/map_1254.png" }],
  [1267, { name: "Hall of Djalia", image: "/rivals/maps/map_1267.png" }],
  [1272, { name: "Birnin T'Challa", image: "/rivals/maps/map_1272.png" }],
  [1287, { name: "Hell's Heaven", image: "/rivals/maps/map_1287.png" }],
  [1288, { name: "Hell's Heaven", image: "/rivals/maps/map_1288.png" }],
  [1289, { name: "Dancing Stage", image: "/rivals/maps/map_1289.png" }],
  [1290, { name: "Symbiotic Surface", image: "/rivals/maps/map_1290.png" }],
  [1291, { name: "Midtown", image: "/rivals/maps/map_1291.png" }],
  [1292, { name: "Central Park", image: "/rivals/maps/map_1292.png" }],
  [1217, { name: "Central Park", image: "/rivals/maps/map_1217.png" }],
  [1302, { name: "Birnin T'Challa", image: "/rivals/maps/map_1302.png" }],
  [1304, { name: "Krakoa", image: "/rivals/maps/map_1304.png" }],
  [1309, { name: "Krakoa", image: "/rivals/maps/map_1309.png" }],
  [1310, { name: "Krakoa", image: "/rivals/maps/map_1310.png" }],
  [1273, { name: "Grove", image: "/rivals/maps/map_1273.png" }],
  [1281, { name: "Carousel", image: "/rivals/maps/map_1281.png" }],
  [1286, { name: "Arakko", image: "/rivals/maps/map_1286.png" }],
  [1294, { name: "Celestial Codex", image: "/rivals/maps/map_1294.png" }],
  [1295, { name: "Celestial Vault", image: "/rivals/maps/map_1295.png" }],
  [1296, { name: "Celestial Hand", image: "/rivals/maps/map_1296.png" }],
  [1311, { name: "Arakko", image: "/rivals/maps/map_1311.png" }],
  [1312, { name: "Ninomaru", image: "/rivals/maps/map_1312.png" }],
  [1313, { name: "Ninomaru", image: "/rivals/maps/map_1313.png" }],
  [1314, { name: "Digital Duel Grounds", image: "/rivals/maps/map_1314.png" }],
  [1317, { name: "Celestial Husk", image: "/rivals/maps/map_1317.png" }],
  [1318, { name: "Celestial Husk", image: "/rivals/maps/map_1318.png" }]
]);

function getMapInfoFromId(mapId: number): { name: string; imageUrl: string } | null {
  const mapData = MARVEL_RIVALS_MAPS_LOOKUP.get(mapId);
  if (mapData) {
    return {
      name: mapData.name,
      imageUrl: `https://marvelrivalsapi.com${mapData.image}`
    };
  }
  return null;
}

export { MarvelRivalsAPI };
