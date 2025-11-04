import { Hono } from "hono";
import { cors } from "hono/cors";
import { StreamersResponseSchema } from "@/shared/types";
import { MarvelRivalsAPI } from "./marvel-rivals-api";
import { 
  adminAuthMiddleware, 
  verifyAdminCredentials, 
  createAdminSession, 
  clearAdminSession 
} from "./auth";


import { cleanupOrphanedStats } from "./cleanup-orphaned-stats";
import { TwitchClipsService } from "./twitch-clips-service";

import { handleAutoUpdateCron } from "./AutoUpdateCron";
import { 
  SubmitClipRequestSchema, 
  VoteClipRequestSchema,
  ClipsListResponseSchema,
  ClipSubmissionResponseSchema,
  VoteResponseSchema
} from "@/shared/clip-types";

// Twitch API Integration
interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
  is_mature: boolean;
}

interface TwitchStreamResponse {
  data: TwitchStream[];
  pagination?: {
    cursor?: string;
  };
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Get App Access Token from Twitch - UNIFIED FUNCTION
export async function getTwitchAppToken(env: Env): Promise<string> {
  try {
    console.log('🔑 Obteniendo token de aplicación de Twitch...');
    addConsoleLog('info', 'Solicitando token de aplicación de Twitch', 'Twitch API');
    
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'client_id': env.TWITCH_CLIENT_ID,
        'client_secret': env.TWITCH_CLIENT_SECRET,
        'grant_type': 'client_credentials'
      })
    });

    if (!response.ok) {
      throw new Error(`Twitch token request failed: ${response.status} ${response.statusText}`);
    }

    // Enhanced JSON parsing with error handling for HTML responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('❌ Twitch token API returned non-JSON response:', contentType, textResponse.substring(0, 200));
      
      if (textResponse.toLowerCase().includes('<html>') || textResponse.toLowerCase().includes('<!doctype')) {
        throw new Error(`Twitch token API devolvió página HTML en lugar de datos JSON (posible error de servidor)`);
      }
      
      throw new Error(`Twitch token API devolvió contenido inválido: ${contentType || 'unknown'}`);
    }

    let data: TwitchTokenResponse;
    try {
      const rawText = await response.text();
      
      // Check if response starts with HTML
      if (rawText.trim().toLowerCase().startsWith('<html>') || rawText.trim().toLowerCase().startsWith('<!doctype')) {
        console.error('❌ Twitch token API returned HTML page:', rawText.substring(0, 200));
        throw new Error(`Twitch token API devolvió página HTML en lugar de datos JSON`);
      }
      
      data = JSON.parse(rawText) as TwitchTokenResponse;
    } catch (parseError) {
      console.error('❌ JSON parsing error for Twitch token:', parseError);
      throw new Error(`Error parseando respuesta del token de Twitch: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
    }

    if (!data || !data.access_token) {
      throw new Error('Token de acceso no encontrado en la respuesta de Twitch');
    }

    console.log('✅ Token de Twitch obtenido exitosamente');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error obteniendo token de Twitch:', error);
    throw error;
  }
}

// Get Twitch user profile information
async function getTwitchUserProfile(username: string, env: Env): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    console.log(`🔍 Obteniendo perfil de Twitch para: ${username}`);
    
    const token = await getTwitchAppToken(env);
    
    const params = new URLSearchParams();
    params.append('login', username.toLowerCase());
    
    const url = `https://api.twitch.tv/helix/users?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': env.TWITCH_CLIENT_ID,
      }
    });

    if (!response.ok) {
      throw new Error(`Twitch users API failed: ${response.status} ${response.statusText}`);
    }

    // Enhanced JSON parsing with error handling for HTML responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error(`❌ Twitch API returned non-JSON response for ${username}:`, contentType, textResponse.substring(0, 200));
      
      if (textResponse.toLowerCase().includes('<html>') || textResponse.toLowerCase().includes('<!doctype')) {
        return {
          success: false,
          error: `Twitch API devolvió página HTML en lugar de datos JSON (posible error de servidor o mantenimiento)`
        };
      }
      
      return {
        success: false,
        error: `Twitch API devolvió contenido inválido: ${contentType || 'unknown'}`
      };
    }

    let data: { data: any[] };
    try {
      const rawText = await response.text();
      
      // Check if response starts with HTML
      if (rawText.trim().toLowerCase().startsWith('<html>') || rawText.trim().toLowerCase().startsWith('<!doctype')) {
        console.error(`❌ Twitch API returned HTML page for ${username}:`, rawText.substring(0, 200));
        return {
          success: false,
          error: `Twitch API devolvió página HTML en lugar de datos JSON (posible error temporal)`
        };
      }
      
      data = JSON.parse(rawText) as { data: any[] };
    } catch (parseError) {
      console.error(`❌ JSON parsing error for Twitch user ${username}:`, parseError);
      return {
        success: false,
        error: `Error parseando respuesta de Twitch: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`
      };
    }
    
    if (!data || !data.data || data.data.length === 0) {
      return {
        success: false,
        error: `Usuario "${username}" no encontrado en Twitch`
      };
    }
    
    const user = data.data[0];
    console.log(`✅ Perfil de Twitch obtenido para ${username}:`, {
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      profile_image_url: user.profile_image_url
    });
    
    return {
      success: true,
      user: user
    };
    
  } catch (error) {
    console.error(`❌ Error obteniendo perfil de Twitch para ${username}:`, error);
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    return {
      success: false,
      error: `Error conectando con Twitch: ${errorMsg}`
    };
  }
}

// A CAÑÓN: Twitch check completo con todos los datos
export async function checkTwitchStreams(usernames: string[], env: Env): Promise<Map<string, TwitchStream | null>> {
  const results = new Map<string, TwitchStream | null>();
  
  if (usernames.length === 0) {
    return results;
  }

  try {
    console.log(`🚀 A CAÑÓN: Verificando estado COMPLETO de ${usernames.length} streamers en Twitch con toda la metadata...`);
    
    const token = await getTwitchAppToken(env);
    
    // Twitch API allows up to 100 usernames per request
    const chunkedUsernames = [];
    for (let i = 0; i < usernames.length; i += 100) {
      chunkedUsernames.push(usernames.slice(i, i + 100));
    }
    
    for (const chunk of chunkedUsernames) {
      try {
        // Normalize usernames and clean them for Twitch API
        const normalizedChunk = chunk.map(username => {
          // Remove spaces and special characters that Twitch doesn't allow
          return username.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
        });
        
        console.log(`🔍 Chunk original:`, chunk);
        console.log(`🔍 Chunk normalizado:`, normalizedChunk);
        
        const params = new URLSearchParams();
        normalizedChunk.forEach(username => params.append('user_login', username));
        
        const url = `https://api.twitch.tv/helix/streams?${params.toString()}`;
        console.log(`🌐 Twitch API URL:`, url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Client-Id': env.TWITCH_CLIENT_ID,
          }
        });

        if (!response.ok) {
          throw new Error(`Twitch streams API failed: ${response.status} ${response.statusText}`);
        }

        // Enhanced JSON parsing with error handling for HTML responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('❌ Twitch streams API returned non-JSON response:', contentType, textResponse.substring(0, 200));
          
          if (textResponse.toLowerCase().includes('<html>') || textResponse.toLowerCase().includes('<!doctype')) {
            throw new Error(`Twitch streams API devolvió página HTML en lugar de datos JSON`);
          }
          
          throw new Error(`Twitch streams API devolvió contenido inválido: ${contentType || 'unknown'}`);
        }

        let data: TwitchStreamResponse;
        try {
          const rawText = await response.text();
          
          // Check if response starts with HTML
          if (rawText.trim().toLowerCase().startsWith('<html>') || rawText.trim().toLowerCase().startsWith('<!doctype')) {
            console.error('❌ Twitch streams API returned HTML page:', rawText.substring(0, 200));
            throw new Error(`Twitch streams API devolvió página HTML en lugar de datos JSON`);
          }
          
          data = JSON.parse(rawText) as TwitchStreamResponse;
        } catch (parseError) {
          console.error('❌ JSON parsing error for Twitch streams:', parseError);
          throw new Error(`Error parseando respuesta de streams de Twitch: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`);
        }
        
        console.log(`📡 Twitch API response COMPLETA:`, {
          total_results: data.data.length,
          live_streamers: data.data.map(s => s.user_login),
          queried_usernames: normalizedChunk,
          full_stream_data: data.data.map(s => ({
            user: s.user_login,
            title: s.title,
            viewers: s.viewer_count,
            game: s.game_name
          }))
        });
        
        // Initialize all usernames as offline (map both original and normalized)
        chunk.forEach((originalUsername, index) => {
          const normalizedUsername = normalizedChunk[index];
          const originalNormalized = originalUsername.toLowerCase().trim();
          
          // Map both the original normalized and the cleaned version
          results.set(originalNormalized, null);
          if (normalizedUsername !== originalNormalized) {
            results.set(normalizedUsername, null);
          }
          
          console.log(`🔍 Inicializando ${originalUsername} (orig norm: ${originalNormalized}, clean: ${normalizedUsername}) como OFFLINE`);
        });
        
        // Set live streamers - need to map back to both original and cleaned usernames
        data.data.forEach(stream => {
          const streamUsername = stream.user_login.toLowerCase();
          
          // Find which of our usernames this stream corresponds to
          chunk.forEach((originalUsername, index) => {
            const normalizedUsername = normalizedChunk[index];
            const originalNormalized = originalUsername.toLowerCase().trim();
            
            // Check if this stream matches either the original normalized or cleaned version
            if (streamUsername === normalizedUsername || streamUsername === originalNormalized) {
              // A CAÑÓN: SIEMPRE objeto completo con todos los datos
              const streamObject = stream;
              
              results.set(originalNormalized, streamObject);
              if (normalizedUsername !== originalNormalized) {
                results.set(normalizedUsername, streamObject);
              }
              
              console.log(`🔍 Twitch API COMPLETA: ${streamUsername} está LIVE - mapeado a ${originalUsername}`);
              console.log(`   • Título: "${stream.title}"`);
              console.log(`   • Viewers: ${stream.viewer_count.toLocaleString()}`);
              console.log(`   • Juego: ${stream.game_name}`);
              console.log(`   • Empezó: ${stream.started_at}`);
            }
          });
        });
        
        console.log(`📊 Chunk procesado COMPLETO: ${data.data.length} streamers en vivo de ${chunk.length} verificados`);
        
        // SIN DELAYS ENTRE CHUNKS - A CAÑÓN
        if (chunkedUsernames.length > 1) {
          console.log(`⚡ Sin delays entre chunks de Twitch - procesando inmediatamente`);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando chunk de Twitch:`, error);
        
        // Mark all usernames in this chunk as unknown/offline
        chunk.forEach((originalUsername) => {
          const originalNormalized = originalUsername.toLowerCase().trim();
          const cleanedUsername = originalUsername.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
          
          results.set(originalNormalized, null);
          if (cleanedUsername !== originalNormalized) {
            results.set(cleanedUsername, null);
          }
        });
      }
    }
    
    const liveCount = Array.from(results.values()).filter(stream => stream !== null).length;
    console.log(`✅ Verificación de Twitch completada: ${liveCount}/${usernames.length} streamers en vivo`);
    
    console.log(`📋 Resultado final COMPLETO del Map:`, Array.from(results.entries()));
    
  } catch (error) {
    console.error('❌ Error general en verificación de Twitch:', error);
    // Mark all usernames as unknown/offline with proper normalization
    usernames.forEach(username => {
      const originalNormalized = username.toLowerCase().trim();
      const cleanedUsername = username.toLowerCase().trim().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
      
      results.set(originalNormalized, null);
      if (cleanedUsername !== originalNormalized) {
        results.set(cleanedUsername, null);
      }
    });
  }
  
  return results;
}

// Helper function to process and validate images
async function processImage(imageBuffer: ArrayBuffer, mimeType: string): Promise<string> {
  try {
    // Create image bitmap from buffer
    const imageData = new Uint8Array(imageBuffer);
    
    // Convert to base64 for storage
    let binary = '';
    const len = imageData.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(imageData[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    // Calculate the size after base64 encoding
    const base64SizeKB = base64.length / 1024;
    const originalSizeKB = imageBuffer.byteLength / 1024;
    
    console.log(`Image processing: Original size: ${originalSizeKB.toFixed(2)}KB, Base64 size: ${base64SizeKB.toFixed(2)}KB`);
    
    // Base64 encoding increases size by ~33%, so we need to account for this
    // For a 1MB original file, base64 will be ~1.33MB
    // We'll allow up to 1.5MB in base64 to accommodate 1MB original files
    const maxBase64SizeKB = 1500; // 1.5MB in base64
    
    if (base64SizeKB > maxBase64SizeKB) {
      throw new Error(`Image too large after encoding (${base64SizeKB.toFixed(2)}KB). Please use an image smaller than 1MB.`);
    }
    
    return dataUrl;
    
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", cors());

// API v2 mounting removed - using direct routes only

// Simple ReportingService instance
let reportingService: any = null;

// Initialize simple reporting service 
async function getReportingService(env: any) {
  if (!reportingService) {
    const { ReportingService } = await import('./services/ReportingService');
    reportingService = new ReportingService(env.DB);
  }
  return reportingService;
}

// Update live status for all streamers using Twitch API - UNIFIED FUNCTION
export async function updateStreamersLiveStatus(env: any, db: any): Promise<{ updated: number; live: number; total: number; logs: string[] }> {
  const logs: string[] = [];
  logs.push('🔄 Iniciando actualización de estado en vivo...');
  
  try {
    // Get all streamers with Twitch usernames
    const streamersResult = await db.prepare(`
      SELECT id, name, twitch_username, is_live 
      FROM streamers 
      WHERE twitch_username IS NOT NULL AND twitch_username != ''
    `).all();
    
    const streamers = streamersResult.results;
    
    if (streamers.length === 0) {
      logs.push('⚠️ No se encontraron streamers con usernames de Twitch configurados');
      return { updated: 0, live: 0, total: 0, logs };
    }
    
    logs.push(`📋 Encontrados ${streamers.length} streamers con Twitch configurado`);
    logs.push(`📋 Streamers: ${streamers.map((s: any) => `${s.name}(@${s.twitch_username})`).join(', ')}`);
    
    // Extract Twitch usernames and normalize them
    const twitchUsernames = streamers.map((s: any) => s.twitch_username.trim());
    logs.push(`📡 Usernames a verificar: ${twitchUsernames.join(', ')}`);
    
    // Check live status on Twitch
    const twitchStreams = await checkTwitchStreams(twitchUsernames, env);
    logs.push(`📊 Respuesta de Twitch API recibida con ${Array.from(twitchStreams.entries()).length} entradas`);
    
    let updatedCount = 0;
    let liveCount = 0;
    
    // Update each streamer's live status
    for (const streamer of streamers) {
      const originalUsername = streamer.twitch_username;
      const normalizedUsername = originalUsername.toLowerCase().trim();
      const twitchStream = twitchStreams.get(normalizedUsername);
      const isLive = twitchStream !== null;
      const currentIsLive = Boolean(streamer.is_live);
      
      logs.push(`🔍 Verificando ${streamer.name}:`);
      logs.push(`   • Original: @${originalUsername}`);
      logs.push(`   • Normalizado: @${normalizedUsername}`);
      logs.push(`   • Estado actual en DB: ${currentIsLive ? 'LIVE' : 'OFFLINE'}`);
      logs.push(`   • Estado en Twitch: ${isLive ? 'LIVE' : 'OFFLINE'}`);
      logs.push(`   • Map contiene clave: ${twitchStreams.has(normalizedUsername)}`);
      
      // SIEMPRE actualizar el estado, no solo cuando hay cambios
      const streamUrl = isLive ? `https://twitch.tv/${originalUsername}` : null;
      
      await db.prepare(`
        UPDATE streamers 
        SET 
          is_live = ?,
          stream_url = ?,
          stream_platform = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        isLive ? 1 : 0,
        streamUrl,
        isLive ? 'twitch' : null,
        streamer.id
      ).run();
      
      if (isLive !== currentIsLive) {
        updatedCount++;
        const statusChange = isLive ? 'OFFLINE → LIVE' : 'LIVE → OFFLINE';
        logs.push(`📺 ${streamer.name}: ${statusChange}`);
        
        if (isLive && twitchStream) {
          logs.push(`   • Título: ${twitchStream.title}`);
          logs.push(`   • Viewers: ${twitchStream.viewer_count.toLocaleString()}`);
          logs.push(`   • Juego: ${twitchStream.game_name}`);
        }
      } else {
        logs.push(`✅ ${streamer.name}: Sin cambios (${isLive ? 'LIVE' : 'OFFLINE'})`);
      }
      
      if (isLive) {
        liveCount++;
      }
    }
    
    if (updatedCount === 0) {
      logs.push('✅ No hubo cambios en el estado de ningún streamer');
    } else {
      logs.push(`✅ ${updatedCount} streamers actualizados`);
    }
    
    logs.push(`📊 Resumen final: ${liveCount}/${streamers.length} streamers en vivo`);
    logs.push(`🔍 Debug Map final: ${JSON.stringify(Array.from(twitchStreams.entries()), null, 2)}`);
    
    return {
      updated: updatedCount,
      live: liveCount,
      total: streamers.length,
      logs
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error actualizando estado en vivo: ${errorMsg}`);
    console.error('Error completo en updateStreamersLiveStatus:', error);
    throw error;
  }
}

// Admin authentication endpoints
app.post("/api/admin/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    if (!verifyAdminCredentials(username, password)) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const sessionToken = createAdminSession(c);
    
    return c.json({ 
      success: true, 
      message: "Admin logged in successfully",
      sessionToken 
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/api/admin/logout", async (c) => {
  clearAdminSession(c);
  return c.json({ success: true, message: "Admin logged out successfully" });
});

app.get("/api/admin/verify", adminAuthMiddleware, async (c) => {
  return c.json({ success: true, authenticated: true });
});

// SISTEMA SIMPLE DE LOGS - Solo usando ReportingService + LogsViewer

// CONSOLE LOGS ENDPOINTS - Sistema de consola en tiempo real para producción

// Simple in-memory console logs storage (se resetea con cada deploy)
let consoleLogs: Array<{
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
}> = [];

// Helper function to add log to console
function addConsoleLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: string) {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context || 'application'
  };
  
  consoleLogs.push(log);
  
  // Keep only last 20,000 logs for extensive debugging
  if (consoleLogs.length > 20000) {
    consoleLogs = consoleLogs.slice(-20000);
  }
}

// INTERCEPT ALL CONSOLE LOGS - Capturar todos los logs del sistema
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleDebug = console.debug;

console.log = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  addConsoleLog('info', message, 'application');
  originalConsoleLog(...args);
};

console.error = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  addConsoleLog('error', message, 'application');
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  addConsoleLog('warn', message, 'application');
  originalConsoleWarn(...args);
};

console.debug = (...args: any[]) => {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  addConsoleLog('debug', message, 'application');
  originalConsoleDebug(...args);
};

// Initialize with system startup logs
addConsoleLog('info', 'Sistema de consola inicializado', 'Console');
addConsoleLog('info', 'Worker de Marvel Rivals SoloQ Challenge iniciado', 'System');
addConsoleLog('debug', 'Interceptación de console logs activada - capturando todos los logs del sistema', 'System');

// Get console logs
app.get("/api/admin/console-logs", adminAuthMiddleware, async (c) => {
  try {
    return c.json({
      success: true,
      logs: consoleLogs.slice(-5000), // Return last 5000 logs (of the 20,000 stored)
      total: consoleLogs.length
    });
  } catch (error) {
    console.error("Error getting console logs:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get console logs" 
    }, 500);
  }
});

// Clear console logs
app.post("/api/admin/console-logs/clear", adminAuthMiddleware, async (c) => {
  try {
    const previousCount = consoleLogs.length;
    consoleLogs = [];
    
    // Add log about clearing
    addConsoleLog('info', `Console logs limpiados por administrador (${previousCount} logs eliminados)`, 'Console');
    
    return c.json({
      success: true,
      message: `${previousCount} logs eliminados exitosamente`,
      cleared_count: previousCount
    });
  } catch (error) {
    console.error("Error clearing console logs:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to clear console logs" 
    }, 500);
  }
});

// Logs debug endpoint
app.get("/api/logs", adminAuthMiddleware, async (c) => {
  try {
    const reporter = await getReportingService(c.env);
    const logs = await reporter.getRecentLogs(100);
    
    return c.json({
      success: true,
      logs: logs
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch logs"
    }, 500);
  }
});

app.get("/api/admin/debug-logs", adminAuthMiddleware, async (c) => {
  try {
    const reporter = await getReportingService(c.env);
    const stats = await reporter.getStats(24);
    
    return c.json({
      success: true,
      message: 'Sistema de logs funcionando correctamente',
      stats: stats,
      logs: ['✅ Sistema de logs operativo']
    });
  } catch (error) {
    console.error("Error in debug logs:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to debug logs system",
      logs: [`❌ Error ejecutando debug: ${error instanceof Error ? error.message : 'Unknown'}`]
    }, 500);
  }
});

// Clear console logs endpoint
app.post('/api/admin/clear-console-logs', adminAuthMiddleware, async (c) => {
  try {
    // Clear in-memory console logs
    const previousCount = consoleLogs.length;
    consoleLogs = [];
    
    // Add log about clearing
    addConsoleLog('info', `Console logs limpiados por administrador (${previousCount} logs eliminados)`, 'Console');
    
    return c.json({ 
      success: true, 
      message: 'Console logs cleared successfully',
      cleared_count: previousCount
    });
  } catch (error) {
    console.error('Error clearing console logs:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Clear logs endpoint (removed reporting system)
app.post('/api/admin/clear-logs', adminAuthMiddleware, async (c) => {
  try {
    const reporter = await getReportingService(c.env);
    const deletedCount = await reporter.cleanup(0); // Delete all logs
    
    console.log(`🧹 Logs cleared by admin: ${deletedCount} logs deleted`);
    
    return c.json({ 
      success: true, 
      message: `Logs cleared successfully. ${deletedCount} logs deleted.`,
      deletedCount: deletedCount
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Clear logs data 
app.post("/api/admin/clear-logs-data", adminAuthMiddleware, async (c) => {
  const logs: string[] = [];
  
  try {
    const db = c.env.DB;
    
    logs.push('🧹 Iniciando limpieza de logs...');
    
    // Get count of logs before deletion
    const countResult = await db.prepare("SELECT COUNT(*) as count FROM logs").first();
    const logCount = Number(countResult?.count) || 0;
    
    logs.push(`📊 Logs encontrados: ${logCount}`);
    
    if (logCount === 0) {
      logs.push('ℹ️ No hay logs para eliminar');
      return c.json({ 
        success: true, 
        message: "No había logs para eliminar",
        logs,
        summary: {
          deleted_logs: 0
        }
      });
    }
    
    // Delete all logs
    const deleteResult = await db.prepare("DELETE FROM logs").run();
    const deletedCount = deleteResult.meta.changes || 0;
    
    logs.push(`🗑️ ${deletedCount} logs eliminados`);
    
    logs.push('✅ Tabla de logs completamente limpia');
    logs.push('🎯 Sistema de logs listo para nuevas pruebas');
    
    return c.json({
      success: true,
      message: `Limpieza completada: ${deletedCount} logs eliminados`,
      logs: logs,
      summary: {
        deleted_logs: deletedCount
      }
    });
    
  } catch (error) {
    console.error("Error clearing logs data:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error limpiando logs: ${errorMessage}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs: logs
    }, 500);
  }
});



// AUTO-UPDATE management endpoints (using new architecture)
app.post("/api/admin/auto-update/enable", adminAuthMiddleware, async (c) => {
  try {
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    await service.initialize();
    await service.enable();
    
    return c.json({ 
      success: true, 
      message: "Auto-Update enabled successfully" 
    });
  } catch (error) {
    console.error("Error enabling auto-update:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to enable auto-update" 
    }, 500);
  }
});

app.post("/api/admin/auto-update/disable", adminAuthMiddleware, async (c) => {
  try {
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    await service.initialize();
    await service.disable();
    
    return c.json({ 
      success: true, 
      message: "Auto-Update disabled successfully" 
    });
  } catch (error) {
    console.error("Error disabling auto-update:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to disable auto-update" 
    }, 500);
  }
});

app.get("/api/admin/auto-update/status", adminAuthMiddleware, async (c) => {
  try {
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    // Don't initialize on status check - just get the status from database
    const status = await service.getStatus();
    
    return c.json({ 
      success: true, 
      ...status 
    });
  } catch (error) {
    console.error("Error getting auto-update status:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get auto-update status" 
    }, 500);
  }
});

app.post("/api/admin/auto-update/reset", adminAuthMiddleware, async (c) => {
  try {
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    await service.initialize();
    
    // Clear any stuck states
    await service.clearEmergencyStop();
    
    return c.json({ 
      success: true, 
      message: "Auto-Update state reset successfully" 
    });
  } catch (error) {
    console.error("Error resetting auto-update state:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to reset auto-update state" 
    }, 500);
  }
});

// Legacy endpoints for backward compatibility
app.post("/api/admin/intelligent-auto-update/enable", adminAuthMiddleware, async (c) => {
  try {
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    await service.initialize();
    await service.enable();
    
    return c.json({ 
      success: true, 
      message: "Auto-Update Inteligente activado exitosamente" 
    });
  } catch (error) {
    console.error("Error enabling auto-update:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to enable auto-update" 
    }, 500);
  }
});

app.post("/api/admin/intelligent-auto-update/disable", adminAuthMiddleware, async (c) => {
  try {
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    await service.initialize();
    await service.disable();
    
    return c.json({ 
      success: true, 
      message: "Auto-Update Inteligente desactivado exitosamente" 
    });
  } catch (error) {
    console.error("Error disabling auto-update:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to disable auto-update" 
    }, 500);
  }
});

app.get("/api/admin/intelligent-auto-update/status", adminAuthMiddleware, async (c) => {
  try {
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    // Don't initialize on status check - just get the status from database
    const status = await service.getStatus();
    
    return c.json({ 
      success: true, 
      ...status 
    });
  } catch (error) {
    console.error("Error getting auto-update status:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get auto-update status" 
    }, 500);
  }
});

app.post("/api/admin/intelligent-auto-update/reset", adminAuthMiddleware, async (c) => {
  try {
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    await service.initialize();
    
    // Clear any stuck states
    await service.clearEmergencyStop();
    
    return c.json({ 
      success: true, 
      message: "Estado del Auto-Update Inteligente reseteado exitosamente" 
    });
  } catch (error) {
    console.error("Error resetting auto-update state:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to reset auto-update state" 
    }, 500);
  }
});



// EMERGENCY: Cancel all ongoing API operations (using new architecture)
app.post("/api/admin/emergency/cancel-all-operations", adminAuthMiddleware, async (c) => {
  const logs: string[] = [];
  
  try {
    logs.push('🚨 EMERGENCY: Cancelling all operations...');
    logs.push('⏰ Timestamp: ' + new Date().toISOString());
    
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    await service.initialize();
    
    // Use the new emergency stop system
    logs.push('🔄 Activating emergency stop...');
    await service.emergencyStop();
    logs.push('   ✅ Emergency stop activated');
    
    logs.push('🏁 Emergency cancellation completed');
    logs.push('✅ All operations cancelled');
    logs.push('🔄 Operations will be blocked until emergency flag is cleared');
    
    return c.json({
      success: true,
      message: "🚨 EMERGENCY: All operations cancelled",
      logs: logs
    });
    
  } catch (error) {
    console.error("Error in emergency cancel:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Critical error: ${errorMessage}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs: logs
    }, 500);
  }
});

// Clear emergency cancellation (allow operations to resume)
app.post("/api/admin/emergency/clear-cancellation", adminAuthMiddleware, async (c) => {
  const logs: string[] = [];
  
  try {
    logs.push('🔄 Clearing emergency cancellation...');
    logs.push('⏰ Timestamp: ' + new Date().toISOString());
    
    const { AutoUpdateService } = await import("./services/AutoUpdateService");
    const service = new AutoUpdateService(c.env, c.env.DB);
    await service.initialize();
    await service.clearEmergencyStop();
    
    logs.push('✅ Emergency cancellation cleared');
    logs.push('🔄 Operations can now resume normally');
    
    return c.json({
      success: true,
      message: "✅ Emergency cancellation cleared - operations can resume",
      logs: logs
    });
    
  } catch (error) {
    console.error("Error clearing emergency cancellation:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error clearing cancellation: ${errorMessage}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs: logs
    }, 500);
  }
});

// Legacy endpoint - Use new API endpoints instead
app.post("/api/admin/update-uids", adminAuthMiddleware, async (c) => {
  return c.json({
    success: false,
    message: "This endpoint has been deprecated. Use /api/v2/auto-update/trigger/players instead",
    error: "Endpoint deprecated - use new architecture"
  }, 410);
});

// Legacy endpoint - Use new API endpoints instead
app.post("/api/admin/update-api", adminAuthMiddleware, async (c) => {
  return c.json({
    success: false,
    message: "This endpoint has been deprecated. Use /api/v2/auto-update/trigger/players instead",
    error: "Endpoint deprecated - use new architecture"
  }, 410);
});

// Legacy endpoint - Use new API endpoints instead
app.post("/api/admin/update-players", adminAuthMiddleware, async (c) => {
  return c.json({
    success: false,
    message: "This endpoint has been deprecated. Use /api/v2/auto-update/trigger/players instead",
    error: "Endpoint deprecated - use new architecture"
  }, 410);
});

// INDIVIDUAL STREAMER MARVEL RIVALS STEPS

// Legacy endpoint - Use new API endpoints instead
app.post("/api/admin/streamer/:id/update-uid", adminAuthMiddleware, async (c) => {
  const streamerId = c.req.param("id");
  return c.json({
    success: false,
    message: `This endpoint has been deprecated. Use /api/v2/player/{username}/uuid instead`,
    error: "Endpoint deprecated - use new architecture",
    streamerId: streamerId
  }, 410);
});

// Legacy endpoint - Use new API endpoints instead
app.post("/api/admin/streamer/:id/update-api", adminAuthMiddleware, async (c) => {
  const streamerId = c.req.param("id");
  return c.json({
    success: false,
    message: `This endpoint has been deprecated. Use /api/v2/player/{username}/update instead`,
    error: "Endpoint deprecated - use new architecture",
    streamerId: streamerId
  }, 410);
});

// Legacy endpoint - Use new API endpoints instead
app.post("/api/admin/streamer/:id/update-player", adminAuthMiddleware, async (c) => {
  const streamerId = c.req.param("id");
  return c.json({
    success: false,
    message: `This endpoint has been deprecated. Use /api/v2/player/{username}/stats instead`,
    error: "Endpoint deprecated - use new architecture",
    streamerId: streamerId
  }, 410);
});

// Get/Set season configuration
app.get("/api/admin/season-config", adminAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT value FROM app_config WHERE key = 'marvel_rivals_season'
    `).first();
    
    const season = result?.value || '3.5'; // Default to 3.5 if not set
    
    return c.json({ 
      success: true, 
      season: season 
    });
  } catch (error) {
    console.error("Error getting season config:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get season config" 
    }, 500);
  }
});

app.post("/api/admin/season-config", adminAuthMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { season } = body;
    
    if (!season || typeof season !== 'string' || !season.trim()) {
      return c.json({ error: "Season number is required" }, 400);
    }
    
    const db = c.env.DB;
    
    // Save season configuration
    await db.prepare(`
      INSERT OR REPLACE INTO app_config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind('marvel_rivals_season', season.trim()).run();
    
    return c.json({ 
      success: true, 
      message: `Season updated to: ${season.trim()}`,
      season: season.trim()
    });
  } catch (error) {
    console.error("Error updating season config:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update season config" 
    }, 500);
  }
});

// Get/Set competition start date configuration
app.get("/api/admin/competition-config", adminAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT value FROM app_config WHERE key = 'competition_start_timestamp'
    `).first();
    
    const competitionStartUTC = result?.value || null;
    
    return c.json({ 
      success: true, 
      competition_start_timestamp: competitionStartUTC
    });
  } catch (error) {
    console.error("Error getting competition config:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get competition config" 
    }, 500);
  }
});

app.post("/api/admin/competition-config", adminAuthMiddleware, async (c) => {
  const startTime = Date.now();
  const logs: string[] = [];
  
  try {
    const body = await c.req.json();
    const { competition_start_timestamp } = body;
    
    if (!competition_start_timestamp || typeof competition_start_timestamp !== 'string') {
      return c.json({ error: "Competition start timestamp is required" }, 400);
    }
    
    // Validate that it's a valid ISO timestamp
    const startDate = new Date(competition_start_timestamp);
    if (isNaN(startDate.getTime())) {
      return c.json({ error: "Invalid timestamp format" }, 400);
    }
    
    const db = c.env.DB;
    
    logs.push('🔄 CONFIGURANDO FECHA DE INICIO DE COMPETICIÓN...');
    logs.push(`📅 Nueva fecha de inicio (UTC): ${competition_start_timestamp}`);
    logs.push(`🇲🇽 Fecha en Ciudad de México: ${new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      weekday: 'long'
    }).format(startDate)}`);
    
    // Check if there was a previous competition start date
    const previousResult = await db.prepare(`
      SELECT value FROM app_config WHERE key = 'competition_start_timestamp'
    `).first();
    
    const previousStartDate = previousResult?.value;
    const isFirstTimeSetup = !previousStartDate;
    const hasChanged = previousStartDate !== competition_start_timestamp;
    
    if (isFirstTimeSetup) {
      logs.push('🆕 Primera configuración de fecha de inicio - no se resetearán datos');
      logs.push('💡 Los datos existentes se mantendrán y solo se filtrarán desde esta fecha');
    } else if (hasChanged) {
      logs.push('⚠️ CAMBIO DE FECHA DETECTADO - Se aplicará RESET ULTRA SENSIBLE');
      logs.push(`📅 Fecha anterior: ${previousStartDate}`);
      logs.push(`📅 Fecha nueva: ${competition_start_timestamp}`);
      logs.push('🚨 REINICIANDO TODAS LAS ESTADÍSTICAS DE LA COMPETICIÓN...');
      
      // ULTRA SENSITIVE RESET: Reset all competition statistics
      logs.push('\n🗑️ PASO 1: Eliminando todas las estadísticas de héroes...');
      const heroStatsResult = await db.prepare("DELETE FROM streamer_hero_stats").run();
      const deletedHeroStats = heroStatsResult.meta.changes || 0;
      logs.push(`✅ ${deletedHeroStats} estadísticas de héroes eliminadas`);
      
      logs.push('🗑️ PASO 2: Eliminando todas las estadísticas de roles...');
      const roleStatsResult = await db.prepare("DELETE FROM streamer_role_stats").run();
      const deletedRoleStats = roleStatsResult.meta.changes || 0;
      logs.push(`✅ ${deletedRoleStats} estadísticas de roles eliminadas`);
      
      logs.push('🗑️ PASO 3: Eliminando todo el historial de partidas...');
      const matchHistoryResult = await db.prepare("DELETE FROM streamer_match_history").run();
      const deletedMatches = matchHistoryResult.meta.changes || 0;
      logs.push(`✅ ${deletedMatches} partidas del historial eliminadas`);
      
      logs.push('🔄 PASO 4: Reseteando estadísticas principales de streamers...');
      const streamersResult = await db.prepare(`
        UPDATE streamers 
        SET 
          rank = NULL,
          rank_score = 0,
          games_played = 0,
          wins = 0,
          kd_ratio = 0,
          kda_ratio = 0,
          kills = 0,
          deaths = 0,
          assists = 0,
          time_played = 0,
          total_damage = 0,
          total_healing = 0,
          previous_position = NULL,
          marvel_rivals_cooldown_until = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE id IS NOT NULL
      `).run();
      const resetStreamers = streamersResult.meta.changes || 0;
      logs.push(`✅ ${resetStreamers} streamers reseteados a estadísticas de competición nueva`);
      
      logs.push('\n✅ RESET ULTRA SENSIBLE COMPLETADO');
      logs.push('🔥 TODAS las estadísticas de la competición han sido eliminadas');
      logs.push('💡 CONSERVADO: Nombres, redes sociales, avatares, estado live');
      logs.push('🎯 El sistema ahora contabilizará solo partidas desde la nueva fecha');
    } else {
      logs.push('✅ Fecha no cambió - sin reset necesario');
    }
    
    // Save the new competition start date
    await db.prepare(`
      INSERT OR REPLACE INTO app_config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind('competition_start_timestamp', competition_start_timestamp).run();
    
    logs.push('\n💾 Nueva fecha de inicio guardada en configuración');
    logs.push('✅ Configuración de competición actualizada exitosamente');
    
    // Add to simple logging
    try {
      const reporter = await getReportingService(c.env);
      await reporter.success('CompetitionConfig', 'Fecha de competición configurada', {
        timestamp: competition_start_timestamp,
        isFirstTime: isFirstTimeSetup,
        hasChanged: hasChanged
      }, Date.now() - startTime);
    } catch (reportingError) {
      logs.push('⚠️ Note: No se pudo registrar en logs (no crítico)');
    }
    
    return c.json({ 
      success: true, 
      message: isFirstTimeSetup 
        ? "Fecha de inicio de competición configurada exitosamente"
        : "Fecha de inicio cambiada y estadísticas reseteadas exitosamente",
      competition_start_timestamp: competition_start_timestamp,
      reset_applied: hasChanged && !isFirstTimeSetup,
      logs: logs
    });
  } catch (error) {
    console.error("Error updating competition config:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error configurando fecha de competición: ${errorMessage}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs: logs
    }, 500);
  }
});

// Season reset endpoint - resets all streamer stats to zero
app.post("/api/admin/season-reset", adminAuthMiddleware, async (c) => {
  const startTime = Date.now();
  const logs: string[] = [];
  
  try {
    const db = c.env.DB;
    
    logs.push('🔄 Iniciando RESET DE TEMPORADA - Marvel Rivals Season Reset...');
    logs.push('⚠️ ADVERTENCIA: Esta acción reseteará TODAS las estadísticas de TODOS los streamers');
    
    // Get count of streamers before reset
    const streamerCountResult = await db.prepare("SELECT COUNT(*) as count FROM streamers").first();
    const streamerCount = Number(streamerCountResult?.count) || 0;
    
    logs.push(`📊 Streamers encontrados: ${streamerCount}`);
    
    if (streamerCount === 0) {
      logs.push('⚠️ No hay streamers para resetear');
      return c.json({ 
        success: false, 
        error: "No streamers found to reset",
        logs 
      });
    }
    
    // Get hero stats count
    const heroStatsResult = await db.prepare("SELECT COUNT(*) as count FROM streamer_hero_stats").first();
    const heroStatsCount = Number(heroStatsResult?.count) || 0;
    
    // Get role stats count  
    const roleStatsResult = await db.prepare("SELECT COUNT(*) as count FROM streamer_role_stats").first();
    const roleStatsCount = Number(roleStatsResult?.count) || 0;
    
    logs.push(`📊 Estadísticas de héroes a resetear: ${heroStatsCount}`);
    logs.push(`📊 Estadísticas de roles a resetear: ${roleStatsCount}`);
    
    logs.push('\n🗑️ PASO 1: Eliminando todas las estadísticas de héroes...');
    await db.prepare("DELETE FROM streamer_hero_stats").run();
    logs.push(`✅ ${heroStatsCount} estadísticas de héroes eliminadas`);
    
    logs.push('🗑️ PASO 2: Eliminando todas las estadísticas de roles...');
    await db.prepare("DELETE FROM streamer_role_stats").run();
    logs.push(`✅ ${roleStatsCount} estadísticas de roles eliminadas`);
    
    logs.push('🔄 PASO 3: Reseteando estadísticas principales de streamers...');
    await db.prepare(`
      UPDATE streamers 
      SET 
        rank = NULL,
        games_played = 0,
        wins = 0,
        kd_ratio = 0,
        kda_ratio = 0,
        kills = 0,
        deaths = 0,
        assists = 0,
        time_played = 0,
        total_damage = 0,
        total_healing = 0,
        previous_position = NULL,
        updated_at = CURRENT_TIMESTAMP
    `).run();
    logs.push(`✅ ${streamerCount} streamers reseteados a estadísticas de temporada nueva`);
    
    logs.push('\n🎮 PASO 4: Manteniendo información esencial...');
    logs.push('✅ Nombres de streamers conservados');
    logs.push('✅ Usernames de redes sociales conservados');
    logs.push('✅ Estados de live/offline conservados');
    logs.push('✅ Fotos de perfil conservadas');
    
    const duration = Date.now() - startTime;
    
    logs.push(`\n🏁 RESET DE TEMPORADA COMPLETADO`);
    logs.push(`📊 Resumen:`);
    logs.push(`   • ${streamerCount} streamers reseteados`);
    logs.push(`   • ${heroStatsCount} estadísticas de héroes eliminadas`);
    logs.push(`   • ${roleStatsCount} estadísticas de roles eliminadas`);
    logs.push(`   • Todos los rangos eliminados`);
    logs.push(`   • Todas las partidas, victorias y estadísticas en 0`);
    logs.push(`⌛ Duración: ${(duration/1000).toFixed(1)} segundos`);
    logs.push(`🎮 ¡Listos para la nueva temporada de Marvel Rivals!`);
    
    // Add to simple logging
    try {
      const reporter = await getReportingService(c.env);
      await reporter.success('SeasonReset', 'Reset completado', {
        streamersReset: streamerCount,
        heroStatsDeleted: heroStatsCount,
        roleStatsDeleted: roleStatsCount
      }, duration);
      logs.push(`📝 Reset registrado en logs`);
    } catch (historyError) {
      logs.push(`⚠️ Note: No se pudo registrar en logs (no bloquea): ${historyError instanceof Error ? historyError.message : 'Unknown'}`);
    }
    
    return c.json({ 
      success: true, 
      message: `Season Reset completado: ${streamerCount} streamers reseteados, ${heroStatsCount + roleStatsCount} estadísticas eliminadas`,
      logs: logs,
      summary: {
        streamers_reset: streamerCount,
        hero_stats_deleted: heroStatsCount,
        role_stats_deleted: roleStatsCount,
        duration_seconds: duration / 1000
      }
    });
    
  } catch (error) {
    console.error("Error in season reset:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error crítico en reset de temporada: ${errorMessage}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs: logs
    }, 500);
  }
});

// Clean orphaned statistics (utility endpoint for fixing data consistency)
app.post("/api/admin/cleanup-orphaned-stats", adminAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const result = await cleanupOrphanedStats(db);
    
    return c.json({ 
      success: true, 
      message: `Cleanup completed: ${result.cleanedHeroStats} hero stats and ${result.cleanedRoleStats} role stats removed`,
      cleaned_hero_stats: result.cleanedHeroStats,
      cleaned_role_stats: result.cleanedRoleStats,
      logs: result.logs
    });
  } catch (error) {
    console.error("Error cleaning orphaned stats:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to cleanup orphaned stats" 
    }, 500);
  }
});

// =============================================================================
// TWITCH CLIPS ENDPOINTS - Sistema de clips votables
// =============================================================================

// Get clips with voting and filtering
app.get("/api/clips", async (c) => {
  try {
    const db = c.env.DB;
    const clipsService = new TwitchClipsService(c.env, db);
    
    // Parse query parameters
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');
    const category = c.req.query('category') || 'all';
    const streamer_id = c.req.query('streamer_id') ? parseInt(c.req.query('streamer_id')!) : undefined;
    const order_by = (c.req.query('order_by') || 'votes') as 'newest' | 'votes' | 'views';
    
    // Generate voter identifier for voting status
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';
    const voterIdentifier = clipsService.generateVoterIdentifier(clientIP, userAgent);
    
    const result = await clipsService.getClipsWithStats({
      limit: Math.min(limit, 50), // Max 50 clips per request
      offset,
      category: category !== 'all' ? category : undefined,
      streamer_id,
      order_by,
      voter_identifier: voterIdentifier
    });
    
    return c.json(ClipsListResponseSchema.parse({
      clips: result.clips,
      total: result.total,
      page: Math.floor(offset / limit) + 1,
      limit,
      has_more: offset + limit < result.total
    }));
  } catch (error) {
    console.error("Error getting clips:", error);
    return c.json({ error: "Failed to get clips" }, 500);
  }
});

// Submit new clip
app.post("/api/clips/submit", async (c) => {
  try {
    const db = c.env.DB;
    const clipsService = new TwitchClipsService(c.env, db);
    
    // Parse and validate request
    const rawBody = await c.req.json();
    const validatedBody = SubmitClipRequestSchema.parse(rawBody);
    
    // Get client information
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    
    // Extract clip ID from URL
    const clipId = clipsService.extractClipId(validatedBody.clip_url);
    if (!clipId) {
      return c.json(ClipSubmissionResponseSchema.parse({
        success: false,
        message: "URL de clip inválida. Debe ser una URL válida de Twitch clips."
      }), 400);
    }
    
    // Check if clip already exists
    const existingClip = await db.prepare("SELECT id FROM twitch_clips WHERE clip_id = ?").bind(clipId).first();
    if (existingClip) {
      return c.json(ClipSubmissionResponseSchema.parse({
        success: false,
        message: "Este clip ya fue enviado anteriormente."
      }), 409);
    }
    
    // Get clip data from Twitch
    const clipData = await clipsService.getClipData(clipId);
    if (!clipData.success || !clipData.clip) {
      return c.json(ClipSubmissionResponseSchema.parse({
        success: false,
        message: clipData.error || "No se pudo obtener información del clip desde Twitch."
      }), 400);
    }
    
    // Check if broadcaster is in our challenge
    const streamerId = await clipsService.findStreamerByTwitchName(clipData.clip.broadcaster_name);
    
    // Insert clip into database
    const result = await db.prepare(`
      INSERT INTO twitch_clips (
        clip_id, title, broadcaster_name, streamer_id, category, description,
        thumbnail_url, embed_url, view_count, duration, language, status,
        submitted_by, submitted_ip, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      clipId,
      clipData.clip.title,
      clipData.clip.broadcaster_name,
      streamerId,
      validatedBody.category,
      validatedBody.description || null,
      clipData.clip.thumbnail_url,
      clipData.clip.embed_url,
      clipData.clip.view_count,
      clipData.clip.duration,
      clipData.clip.language,
      'pending', // Requires admin approval
      validatedBody.submitted_by || null,
      clientIP
    ).run();
    
    // Initialize clip stats
    await db.prepare(`
      INSERT INTO clip_stats (clip_id, total_votes, upvotes, downvotes, vote_score, views)
      VALUES (?, 0, 0, 0, 0, 0)
    `).bind(result.meta.last_row_id).run();
    
    return c.json(ClipSubmissionResponseSchema.parse({
      success: true,
      message: streamerId 
        ? "¡Clip enviado exitosamente! Será revisado por los administradores antes de aparecer públicamente."
        : "Clip enviado. Nota: El streamer no está en el challenge actual, pero el clip será revisado.",
      clip_id: Number(result.meta.last_row_id),
      status: 'pending'
    }));
  } catch (error) {
    console.error("Error submitting clip:", error);
    if (error instanceof Error && error.message.includes('parse')) {
      return c.json(ClipSubmissionResponseSchema.parse({
        success: false,
        message: "Datos de solicitud inválidos."
      }), 400);
    }
    return c.json(ClipSubmissionResponseSchema.parse({
      success: false,
      message: "Error interno del servidor."
    }), 500);
  }
});

// Vote on a clip
app.post("/api/clips/:id/vote", async (c) => {
  try {
    const clipId = parseInt(c.req.param("id"));
    if (isNaN(clipId)) {
      return c.json(VoteResponseSchema.parse({
        success: false,
        message: "ID de clip inválido."
      }), 400);
    }
    
    const db = c.env.DB;
    const clipsService = new TwitchClipsService(c.env, db);
    
    // Parse and validate request
    const rawBody = await c.req.json();
    const validatedBody = VoteClipRequestSchema.parse(rawBody);
    
    // Check if clip exists and is approved
    const clip = await db.prepare("SELECT id, status FROM twitch_clips WHERE id = ?").bind(clipId).first();
    if (!clip) {
      return c.json(VoteResponseSchema.parse({
        success: false,
        message: "Clip no encontrado."
      }), 404);
    }
    
    if (clip.status !== 'approved') {
      return c.json(VoteResponseSchema.parse({
        success: false,
        message: "Solo puedes votar clips aprobados."
      }), 403);
    }
    
    // Generate voter identifier
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';
    const voterIdentifier = clipsService.generateVoterIdentifier(clientIP, userAgent);
    
    // Check voting limits
    const limitCheck = await clipsService.checkVotingLimits(voterIdentifier, clipId);
    if (!limitCheck.allowed) {
      return c.json(VoteResponseSchema.parse({
        success: false,
        message: limitCheck.reason || "No puedes votar en este momento."
      }), 429);
    }
    
    // Check if user already voted this clip (remove previous vote if different)
    const existingVote = await clipsService.getUserVote(voterIdentifier, clipId);
    
    if (existingVote === validatedBody.vote_type) {
      return c.json(VoteResponseSchema.parse({
        success: false,
        message: "Ya votaste este clip con esa opción."
      }), 409);
    }
    
    // Remove existing vote if any
    if (existingVote) {
      await db.prepare("DELETE FROM clip_votes WHERE voter_identifier = ? AND clip_id = ?")
        .bind(voterIdentifier, clipId).run();
    }
    
    // Insert new vote
    await db.prepare(`
      INSERT INTO clip_votes (clip_id, voter_identifier, vote_type, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).bind(clipId, voterIdentifier, validatedBody.vote_type, clientIP, userAgent).run();
    
    // Update clip stats
    await clipsService.updateClipStats(clipId);
    
    // Get updated stats
    const statsResult = await db.prepare("SELECT vote_score FROM clip_stats WHERE clip_id = ?").bind(clipId).first();
    const newVoteScore = statsResult?.vote_score || 0;
    
    return c.json(VoteResponseSchema.parse({
      success: true,
      message: `¡Voto registrado! Te quedan ${limitCheck.remaining || 0} votos hoy.`,
      new_vote_score: newVoteScore,
      user_vote: validatedBody.vote_type
    }));
  } catch (error) {
    console.error("Error voting on clip:", error);
    if (error instanceof Error && error.message.includes('parse')) {
      return c.json(VoteResponseSchema.parse({
        success: false,
        message: "Datos de votación inválidos."
      }), 400);
    }
    return c.json(VoteResponseSchema.parse({
      success: false,
      message: "Error interno del servidor."
    }), 500);
  }
});

// Admin: Get pending clips for approval
app.get("/api/admin/clips/pending", adminAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    const clipsService = new TwitchClipsService(c.env, db);
    
    const result = await clipsService.getClipsWithStats({
      status: 'pending',
      order_by: 'newest',
      limit: 100
    });
    
    return c.json({
      success: true,
      clips: result.clips,
      total: result.total
    });
  } catch (error) {
    console.error("Error getting pending clips:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get pending clips" 
    }, 500);
  }
});

// Admin: Approve or reject clip
app.post("/api/admin/clips/:id/:action", adminAuthMiddleware, async (c) => {
  try {
    const clipId = parseInt(c.req.param("id"));
    const action = c.req.param("action"); // 'approve' or 'reject'
    
    if (isNaN(clipId) || !['approve', 'reject'].includes(action)) {
      return c.json({ error: "Invalid parameters" }, 400);
    }
    
    const db = c.env.DB;
    
    // Get admin notes if provided
    const body = await c.req.json().catch(() => ({}));
    const adminNotes = body.notes || null;
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // Update clip status
    await db.prepare(`
      UPDATE twitch_clips 
      SET status = ?, admin_notes = ?, approved_at = CURRENT_TIMESTAMP, approved_by = 'admin', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newStatus, adminNotes, clipId).run();
    
    return c.json({
      success: true,
      message: `Clip ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente.`
    });
  } catch (error) {
    console.error("Error moderating clip:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to moderate clip" 
    }, 500);
  }
});

// Admin: Delete clip permanently
app.delete("/api/admin/clips/:id", adminAuthMiddleware, async (c) => {
  try {
    const clipId = parseInt(c.req.param("id"));
    
    if (isNaN(clipId)) {
      return c.json({ error: "Invalid clip ID" }, 400);
    }
    
    const db = c.env.DB;
    
    // Check if clip exists
    const clip = await db.prepare("SELECT title, broadcaster_name FROM twitch_clips WHERE id = ?").bind(clipId).first();
    
    if (!clip) {
      return c.json({ error: "Clip not found" }, 404);
    }
    
    // Delete clip votes first (foreign key relationship)
    await db.prepare("DELETE FROM clip_votes WHERE clip_id = ?").bind(clipId).run();
    
    // Delete clip stats
    await db.prepare("DELETE FROM clip_stats WHERE clip_id = ?").bind(clipId).run();
    
    // Delete the clip itself
    await db.prepare("DELETE FROM twitch_clips WHERE id = ?").bind(clipId).run();
    
    return c.json({
      success: true,
      message: `Clip "${clip.title}" de ${clip.broadcaster_name} eliminado permanentemente.`
    });
  } catch (error) {
    console.error("Error deleting clip:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete clip" 
    }, 500);
  }
});

// Admin: Get clips statistics
app.get("/api/admin/clips/stats", adminAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    
    // Get basic counts
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_clips,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_clips,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_clips,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_clips
      FROM twitch_clips
    `).first();
    
    // Get voting stats
    const voteStats = await db.prepare(`
      SELECT 
        COUNT(*) as total_votes,
        COUNT(DISTINCT voter_identifier) as unique_voters
      FROM clip_votes
    `).first();
    
    // Get top clips
    const topClips = await db.prepare(`
      SELECT c.title, c.broadcaster_name, cs.vote_score
      FROM twitch_clips c
      LEFT JOIN clip_stats cs ON c.id = cs.clip_id
      WHERE c.status = 'approved'
      ORDER BY cs.vote_score DESC
      LIMIT 5
    `).all();
    
    return c.json({
      success: true,
      stats: {
        ...stats,
        ...voteStats,
        top_clips: topClips.results || []
      }
    });
  } catch (error) {
    console.error("Error getting clips stats:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to get clips stats" 
    }, 500);
  }
});

// Update live status for all streamers
app.post("/api/update-live-status", adminAuthMiddleware, async (c) => {
  const startTime = Date.now();
  
  try {
    const db = c.env.DB;
    
    const result = await updateStreamersLiveStatus(c.env, db);
    
    // Add to simple logging 
    try {
      const reporter = await getReportingService(c.env);
      const duration = Date.now() - startTime;
      
      await reporter.success('TwitchUpdate', 'Live status actualizado manualmente', {
        updated: result.updated,
        live: result.live,
        total: result.total
      }, duration);
      console.log('✅ Manual Live Status update logged');
    } catch (historyError) {
      console.log('Note: Failed to log Live Status update (non-blocking):', historyError);
    }
    
    return c.json({
      success: true,
      message: `Live status updated: ${result.updated} changes, ${result.live}/${result.total} live`,
      logs: result.logs,
      stats: {
        updated: result.updated,
        live: result.live,
        total: result.total
      }
    });
  } catch (error) {
    console.error("Error updating live status:", error);
    
    const errorLogs = [`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`];
    
    // Add error to simple logging
    try {
      const reporter = await getReportingService(c.env);
      
      await reporter.error('TwitchUpdate', 'Error en live status manual', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('✅ Live Status error logged');
    } catch (historyError) {
      console.log('Note: Failed to log Live Status error (non-blocking):', historyError);
    }
    
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update live status",
      logs: errorLogs
    }, 500);
  }
});

// Helper function to get current season configuration
async function getCurrentSeason(db: any): Promise<string> {
  try {
    const result = await db.prepare(`
      SELECT value FROM app_config WHERE key = 'marvel_rivals_season'
    `).first();
    
    return result?.value || '3.5'; // Default to 3.5 if not set
  } catch (error) {
    console.error('Error getting season config:', error);
    return '3.5'; // Fallback to default
  }
}





// NUEVA API - Marvel Rivals API v2 con datos completos de Season configurable
async function getPlayerStats(username: string, env?: any) {
  try {
    // Get current season configuration
    const currentSeason = await getCurrentSeason(env.DB);
    console.log(`🚀 Nueva Marvel Rivals API: Obteniendo datos COMPLETOS para ${username} (Season ${currentSeason})`);
    console.log(`🔑 Verificando API Key en worker: ${env?.MARVEL_RIVALS_API_KEY ? 'DISPONIBLE' : 'FALTANTE'} (${env?.MARVEL_RIVALS_API_KEY?.length || 0} chars)`);
    
    if (!env?.MARVEL_RIVALS_API_KEY) {
      throw new Error('MARVEL_RIVALS_API_KEY no está configurada en el worker');
    }
    
    if (!env.MARVEL_RIVALS_API_KEY.trim()) {
      throw new Error('MARVEL_RIVALS_API_KEY está vacía o solo contiene espacios');
    }
    
    // Usar la nueva API de marvelrivalsapi.com con temporada configurable (with competition filtering)
    const playerData = await MarvelRivalsAPI.fetchUser(username, env.MARVEL_RIVALS_API_KEY.trim(), currentSeason, env?.DB);
    
    console.log(`✅ Datos COMPLETOS obtenidos para: ${username} (Season ${currentSeason})`);
    console.log(`📊 Player data overview:`, {
      username: playerData.playerInfo.username,
      uuid: playerData.playerInfo.uuid,
      rank: playerData.playerInfo.rank,
      level: playerData.playerInfo.level,
      season: currentSeason,
      heroesCount: playerData.heroes.length,
      rolesCount: playerData.roles.length,
      hasMatchHistory: !!playerData.matchHistory
    });
    
    // Mapear datos al formato esperado por el sistema existente
    const overview = playerData.overview;
    const gamesPlayed = overview.matchesPlayed || 0;
    const wins = overview.matchesWon || 0;
    
    // Convertir heroes array a object para compatibilidad
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
        totalHeroHeal: hero.totalHeroHeal || 0,
        totalDamageTaken: hero.totalDamageTaken || 0
      };
    });
    
    // Convertir roles array a object para compatibilidad
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
        totalHeroHeal: role.totalHeroHeal || 0,
        totalDamageTaken: role.totalDamageTaken || 0
      };
    });
    
    console.log(`Nueva API - Stats mapeados:`, {
      gamesPlayed,
      wins,
      timePlayed: overview.timePlayed,
      kills: overview.kills,
      deaths: overview.deaths,
      assists: overview.assists,
      kdRatio: overview.kdRatio,
      kdaRatio: overview.kdaRatio,
      heroesAvailable: Object.keys(heroesObject).length,
      rolesAvailable: Object.keys(rolesObject).length
    });
    
    return {
      success: true,
      player: {
        username: playerData.playerInfo.username,
        uuid: playerData.playerInfo.uuid,
        avatar: playerData.playerInfo.avatar,
        rank: playerData.playerInfo.rank,
        score: playerData.playerInfo.score, // CORREGIDO: Incluir puntos RS del score
        peakRank: playerData.playerInfo.rank, // Usar rank actual como peak por ahora
        level: playerData.playerInfo.level,
        gamesPlayed: Number(gamesPlayed),
        wins: Number(wins),
        overview: overview,
        heroes: heroesObject,
        roles: rolesObject,
        rankHistory: playerData.rankHistory,
        matchHistory: playerData.matchHistory,
        _newApiMode: true // Flag para identificar nueva API
      }
    };
  } catch (error) {
    console.error(`Error fetching player stats for ${username}:`, error);
    
    // Mensajes de error específicos para la nueva API
    let errorMessage = "Error desconocido al conectar con Marvel Rivals API";
    
    if (error instanceof Error) {
      const errorStr = error.message.toLowerCase();
      
      if (errorStr.includes('jugador no encontrado')) {
        errorMessage = `Jugador "${username}" no encontrado en Marvel Rivals`;
      } else if (errorStr.includes('api key inválida')) {
        errorMessage = "Error de configuración: API Key inválida";
      } else if (errorStr.includes('rate limit') || errorStr.includes('debe esperar')) {
        errorMessage = `⏱️ RATE LIMIT: ${error.message}`;
      } else if (errorStr.includes('timeout')) {
        errorMessage = `Timeout al conectar con Marvel Rivals API`;
      } else if (errorStr.includes('network') || errorStr.includes('fetch')) {
        errorMessage = "Error de red al conectar con Marvel Rivals API";
      } else {
        errorMessage = `Marvel Rivals API error: ${error.message}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// NUEVA FUNCIÓN LIGERA - Solo verificar que el IGN existe con UID (sin player_update ni player_stats)
async function verifyPlayerExists(username: string, env?: any) {
  try {
    // Get current season configuration
    const currentSeason = await getCurrentSeason(env.DB);
    console.log(`🔍 Verificación ligera de IGN: ${username} (Season ${currentSeason})`);
    console.log(`🎯 SOLO verificando que tenga UID - sin updates ni estadísticas completas`);
    
    if (!env?.MARVEL_RIVALS_API_KEY) {
      throw new Error('MARVEL_RIVALS_API_KEY no está configurada en el worker');
    }
    
    if (!env.MARVEL_RIVALS_API_KEY.trim()) {
      throw new Error('MARVEL_RIVALS_API_KEY está vacía o solo contiene espacios');
    }
    
    // SOLO usar findPlayer - no fetchUser ni updatePlayer ni getPlayerData
    const api = new MarvelRivalsAPI(env.MARVEL_RIVALS_API_KEY.trim(), currentSeason);
    const playerInfo = await api.findPlayer(username);
    
    console.log(`✅ UID verificado para: ${username}`);
    console.log(`📊 Player info básico:`, {
      username: playerInfo.username,
      uuid: playerInfo.uuid,
      season: currentSeason
    });
    
    return {
      success: true,
      player: {
        username: playerInfo.username,
        uuid: playerInfo.uuid,
        rank: null, // No obtenemos rango en verificación ligera
        gamesPlayed: null, // No obtenemos partidas en verificación ligera
        wins: null, // No obtenemos victorias en verificación ligera
        level: null, // No obtenemos nivel en verificación ligera
        _lightVerification: true // Flag para identificar verificación ligera
      }
    };
  } catch (error) {
    console.error(`Error verificando existencia del jugador ${username}:`, error);
    
    // Mensajes de error específicos para la verificación ligera
    let errorMessage = "Error desconocido al conectar con Marvel Rivals API";
    
    if (error instanceof Error) {
      const errorStr = error.message.toLowerCase();
      
      if (errorStr.includes('no se encontró uid') || errorStr.includes('jugador no encontrado')) {
        errorMessage = `Jugador "${username}" no encontrado en Marvel Rivals`;
      } else if (errorStr.includes('api key inválida')) {
        errorMessage = "Error de configuración: API Key inválida";
      } else if (errorStr.includes('rate limit') || errorStr.includes('debe esperar')) {
        errorMessage = `⏱️ RATE LIMIT: ${error.message}`;
      } else if (errorStr.includes('timeout')) {
        errorMessage = `Timeout al conectar con Marvel Rivals API`;
      } else if (errorStr.includes('network') || errorStr.includes('fetch')) {
        errorMessage = "Error de red al conectar con Marvel Rivals API";
      } else {
        errorMessage = `Marvel Rivals API error: ${error.message}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

app.get("/api/player-stats/:username", async (c) => {
  try {
    const username = c.req.param("username");
    
    if (!username) {
      return c.json({ error: "Username parameter is required" }, 400);
    }

    const playerData = await getPlayerStats(username, c.env);
    return c.json(playerData);
  } catch (error) {
    console.error("Error in player stats endpoint:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch player stats" 
    }, 500);
  }
});

// NUEVO ENDPOINT LIGERO - Solo verificar que el IGN existe (para formularios de registro)
app.get("/api/verify-player/:username", async (c) => {
  try {
    const username = c.req.param("username");
    
    if (!username) {
      return c.json({ error: "Username parameter is required" }, 400);
    }

    console.log(`🔍 Verificación ligera solicitada para: ${username}`);
    console.log(`🎯 Solo verificando existencia con UID - sin estadísticas completas`);
    
    const playerData = await verifyPlayerExists(username, c.env);
    return c.json(playerData);
  } catch (error) {
    console.error("Error in player verification endpoint:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to verify player" 
    }, 500);
  }
});

// Bulk import Twitch avatars for all streamers
app.post("/api/admin/bulk-import-twitch-avatars", adminAuthMiddleware, async (c) => {
  const startTime = Date.now();
  const logs: string[] = [];
  
  try {
    const db = c.env.DB;
    
    logs.push('🔄 Iniciando importación masiva de avatares desde Twitch...');
    
    // Get all streamers with Twitch usernames
    const streamersResult = await db.prepare(`
      SELECT id, name, twitch_username 
      FROM streamers 
      WHERE twitch_username IS NOT NULL AND twitch_username != ''
      ORDER BY name ASC
    `).all();
    
    const streamers = streamersResult.results;
    
    if (streamers.length === 0) {
      logs.push('⚠️ No se encontraron streamers con usernames de Twitch configurados');
      return c.json({ 
        success: false, 
        error: "No hay streamers con usernames de Twitch para importar avatares",
        logs 
      });
    }
    
    logs.push(`📋 Encontrados ${streamers.length} streamers con Twitch configurado`);
    logs.push(`📋 Streamers: ${streamers.map((s: any) => `${s.name}(@${s.twitch_username})`).join(', ')}`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each streamer with improved error handling
    for (let i = 0; i < streamers.length; i++) {
      const streamer = streamers[i];
      const streamerIndex = i + 1;
      
      try {
        logs.push(`\n📍 [${streamerIndex}/${streamers.length}] ${streamer.name} (@${streamer.twitch_username})`);
        
        // Get Twitch user profile with comprehensive error handling
        let twitchProfile;
        try {
          twitchProfile = await getTwitchUserProfile(streamer.twitch_username as string, c.env);
        } catch (profileError) {
          // Additional safety net for all types of errors
          const profileErrorMsg = profileError instanceof Error ? profileError.message : 'Error desconocido';
          logs.push(`   ❌ Error crítico obteniendo perfil de Twitch: ${profileErrorMsg}`);
          
          const errorStr = profileErrorMsg.toLowerCase();
          if (errorStr.includes('json') || errorStr.includes('html') || errorStr.includes('syntaxerror') || errorStr.includes('unexpected token')) {
            logs.push(`   🔧 Error de formato de respuesta: La API de Twitch devolvió datos corruptos o HTML`);
            logs.push(`   💡 Posible mantenimiento temporal de Twitch - continuando con el siguiente streamer...`);
          } else if (errorStr.includes('timeout')) {
            logs.push(`   ⏰ Timeout en la conexión con Twitch`);
          } else if (errorStr.includes('429') || errorStr.includes('rate limit')) {
            logs.push(`   ⏱️ Rate limit de Twitch detectado`);
          } else if (errorStr.includes('network') || errorStr.includes('fetch')) {
            logs.push(`   🌐 Error de red conectando con Twitch`);
          }
          
          errorCount++;
          continue;
        }
        
        if (!twitchProfile.success || !twitchProfile.user) {
          logs.push(`   ❌ Error obteniendo perfil: ${twitchProfile.error || 'Usuario no encontrado'}`);
          
          // Check for specific HTML errors
          if (twitchProfile.error?.includes('HTML')) {
            logs.push(`   🔧 Posible problema temporal de la API de Twitch - continuando con siguiente streamer`);
          }
          
          errorCount++;
          continue;
        }
        
        const profileImageUrl = twitchProfile.user.profile_image_url;
        
        if (!profileImageUrl) {
          logs.push(`   ⚠️ El usuario no tiene imagen de perfil en Twitch`);
          skippedCount++;
          continue;
        }
        
        logs.push(`   🔍 Imagen encontrada: ${profileImageUrl}`);
        
        // Update streamer avatar URL in database
        await db.prepare(`
          UPDATE streamers 
          SET 
            avatar_url = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(profileImageUrl, streamer.id).run();
        
        logs.push(`   ✅ Avatar actualizado exitosamente para ${streamer.name}`);
        logs.push(`      • Display Name: ${twitchProfile.user.display_name}`);
        logs.push(`      • Twitch ID: ${twitchProfile.user.id}`);
        
        successCount++;
        
        // Small delay between requests to be respectful to Twitch API
        if (i < streamers.length - 1) {
          logs.push(`   ⏳ Esperando 1 segundo antes del siguiente...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        logs.push(`   ❌ Error procesando ${streamer.name}: ${errorMsg}`);
        
        // Enhanced error logging for debugging
        if (error instanceof Error) {
          const errorStr = error.message.toLowerCase();
          if (errorStr.includes('html') || errorStr.includes('<!doctype') || errorStr.includes('<html>')) {
            logs.push(`   🔧 Error específico: La API de Twitch devolvió HTML en lugar de JSON`);
            logs.push(`   💡 Esto indica un problema temporal del servidor de Twitch`);
          } else if (errorStr.includes('json') || errorStr.includes('unexpected token')) {
            logs.push(`   🔧 Error específico: Problema parseando respuesta JSON`);
            logs.push(`   💡 La respuesta no tiene el formato esperado`);
          } else if (errorStr.includes('syntaxerror')) {
            logs.push(`   🔧 Error específico: Sintaxis inválida en respuesta de la API`);
            logs.push(`   💡 Posible corrupción de datos o mantenimiento del servidor`);
          }
        }
        
        errorCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    logs.push(`\n🏁 Importación masiva completada`);
    logs.push(`✅ Exitosos: ${successCount}/${streamers.length}`);
    logs.push(`❌ Errores: ${errorCount}/${streamers.length}`);
    logs.push(`⏭️ Saltados: ${skippedCount}/${streamers.length}`);
    logs.push(`⌛ Duración total: ${(duration/1000).toFixed(1)} segundos`);
    logs.push(`📊 Promedio por streamer: ${(duration/(1000*streamers.length)).toFixed(1)}s`);
    
    if (successCount > 0) {
      logs.push(`🔄 Recarga la página para ver las fotos actualizadas`);
    }
    
    // Add to simple logging
    try {
      const reporter = await getReportingService(c.env);
      await reporter.success('TwitchAvatars', 'Importación masiva completada', {
        total: streamers.length,
        successful: successCount,
        errors: errorCount,
        skipped: skippedCount
      }, duration);
      logs.push(`📝 Importación registrada en logs`);
    } catch (historyError) {
      logs.push(`⚠️ Note: No se pudo registrar en logs (no bloquea): ${historyError instanceof Error ? historyError.message : 'Unknown'}`);
    }
    
    return c.json({
      success: true,
      message: `Importación completada: ${successCount} exitosos, ${errorCount} errores, ${skippedCount} saltados`,
      logs: logs,
      summary: {
        total: streamers.length,
        successful: successCount,
        errors: errorCount,
        skipped: skippedCount
      }
    });
    
  } catch (error) {
    console.error("Error in bulk Twitch avatar import:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error crítico en importación masiva: ${errorMessage}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs: logs
    }, 500);
  }
});

// Import streamer avatar from Twitch
app.post("/api/import-twitch-avatar/:id", adminAuthMiddleware, async (c) => {
  try {
    const streamerId = c.req.param("id");
    const db = c.env.DB;
    
    if (!streamerId) {
      return c.json({ error: "Streamer ID is required" }, 400);
    }

    // Get streamer from database
    const streamer = await db.prepare("SELECT * FROM streamers WHERE id = ?").bind(streamerId).first();
    
    if (!streamer) {
      return c.json({ error: "Streamer not found" }, 404);
    }

    const twitchUsername = streamer.twitch_username as string | null;
    
    if (!twitchUsername || twitchUsername.trim() === '') {
      return c.json({ error: "El streamer no tiene un username de Twitch configurado" }, 400);
    }

    console.log(`🔄 Importando avatar de Twitch para ${streamer.name} (@${twitchUsername})`);

    try {
      // Get Twitch user profile
      const twitchProfile = await getTwitchUserProfile(twitchUsername, c.env);
      
      if (!twitchProfile.success || !twitchProfile.user) {
        return c.json({ 
          success: false, 
          error: twitchProfile.error || "No se pudo obtener el perfil de Twitch" 
        }, 400);
      }

      const profileImageUrl = twitchProfile.user.profile_image_url;
      
      if (!profileImageUrl) {
        return c.json({ 
          success: false, 
          error: "El usuario de Twitch no tiene una imagen de perfil disponible" 
        }, 400);
      }

      console.log(`📸 URL de imagen de perfil de Twitch: ${profileImageUrl}`);

      // Update streamer avatar URL in database with Twitch profile image URL
      await db.prepare(`
        UPDATE streamers 
        SET 
          avatar_url = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(profileImageUrl, streamerId).run();

      console.log(`✅ Avatar de Twitch importado exitosamente para ${streamer.name}`);

      return c.json({ 
        success: true, 
        message: "Avatar de Twitch importado exitosamente",
        avatar_url: profileImageUrl,
        twitch_user: {
          id: twitchProfile.user.id,
          login: twitchProfile.user.login,
          display_name: twitchProfile.user.display_name
        }
      });

    } catch (error) {
      console.error("Error importing Twitch avatar:", error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Error importando avatar de Twitch" 
      }, 500);
    }

  } catch (error) {
    console.error("Error in import Twitch avatar endpoint:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to import Twitch avatar" 
    }, 500);
  }
});

// Upload streamer avatar
app.post("/api/upload-streamer-avatar/:id", adminAuthMiddleware, async (c) => {
  try {
    const streamerId = c.req.param("id");
    const db = c.env.DB;
    
    if (!streamerId) {
      return c.json({ error: "Streamer ID is required" }, 400);
    }

    // Get streamer from database
    const streamer = await db.prepare("SELECT * FROM streamers WHERE id = ?").bind(streamerId).first();
    
    if (!streamer) {
      return c.json({ error: "Streamer not found" }, 404);
    }

    // Parse form data
    const formData = await c.req.formData();
    const imageFile = formData.get('image') as File | null;
    
    if (!imageFile) {
      return c.json({ error: "No image file provided" }, 400);
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return c.json({ error: "File must be an image" }, 400);
    }

    // Validate file size (max 1MB for avatars to prevent database issues)
    if (imageFile.size > 1 * 1024 * 1024) {
      return c.json({ error: "Image size must be less than 1MB for avatars. Please resize your image." }, 400);
    }

    // Convert file to ArrayBuffer and compress/resize
    const imageBuffer = await imageFile.arrayBuffer();
    
    try {
      // Process and validate the image
      const processedImage = await processImage(imageBuffer, imageFile.type);
      const avatarUrl = processedImage;

      // Update streamer avatar URL in database
      await db.prepare(`
        UPDATE streamers 
        SET 
          avatar_url = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(avatarUrl, streamerId).run();

      return c.json({ 
        success: true, 
        message: "Avatar uploaded successfully",
        avatar_url: avatarUrl
      });

    } catch (processingError) {
      console.error("Error processing image:", processingError);
      return c.json({ 
        error: processingError instanceof Error ? processingError.message : "Failed to process image" 
      }, 400);
    }

  } catch (error) {
    console.error("Error uploading avatar:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to upload avatar" 
    }, 500);
  }
});

app.post("/api/update-streamer-stats/:id", adminAuthMiddleware, async (c) => {
  const startTime = Date.now();
  let logs: string[] = [];
  
  try {
    // Initialize simple reporting and start operation logging
    const streamerId = c.req.param("id");
    logs.push(`🔄 Iniciando actualización para streamer ID: ${streamerId}`);
    
    // Log request information for debugging
    const contentType = c.req.header('content-type') || 'unknown';
    const requestUrl = c.req.url;
    const method = c.req.method;
    
    logs.push(`📡 Request info: ${method} ${requestUrl}`);
    logs.push(`📋 Content-Type: ${contentType}`);
    
    // Enhanced body parsing with detailed logging
    let rawBody: string = '';
    let body: any = {};
    
    try {
      // Read the request body directly (no clone needed in Cloudflare Workers/Hono)
      rawBody = await c.req.text();
      
      // Enhanced logging for debugging
      logs.push(`📝 Raw body length: ${rawBody.length} characters`);
      
      if (rawBody.length === 0) {
        logs.push(`⚠️ Empty body received (length: 0)`);
        body = {};
      } else {
        logs.push(`📝 Raw body preview (first 300 chars): ${rawBody.substring(0, 300)}${rawBody.length > 300 ? '...' : ''}`);
        
        // Log content type and other headers for debugging
        const allHeaders = {} as Record<string, string>;
        c.req.header() && Object.keys(c.req.header()).forEach(key => {
          allHeaders[key] = c.req.header(key) || '';
        });
        logs.push(`📋 Request headers: ${JSON.stringify(allHeaders, null, 2)}`);
        
        // Attempt JSON parsing with detailed error info
        try {
          body = JSON.parse(rawBody);
          logs.push(`✅ JSON parsing successful`);
          logs.push(`📊 Parsed body keys: ${Object.keys(body).join(', ')}`);
          logs.push(`🔢 Parsed body values preview: ${JSON.stringify(body, null, 2).substring(0, 500)}${JSON.stringify(body, null, 2).length > 500 ? '...' : ''}`);
        } catch (jsonError) {
          logs.push(`❌ JSON parsing failed: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
          logs.push(`🔍 Raw body causing JSON error (full): "${rawBody}"`);
          logs.push(`🔍 First 100 character codes: ${Array.from(rawBody.substring(0, 100)).map(c => `${c}(${c.charCodeAt(0)})`).join(', ')}`);
          logs.push(`🔍 Raw body type: ${typeof rawBody}`);
          logs.push(`🔍 Is raw body string: ${typeof rawBody === 'string'}`);
          logs.push(`🔍 Raw body constructor: ${rawBody.constructor.name}`);
          
          // Try to determine if it's malformed JSON
          if (rawBody.trim().startsWith('{') || rawBody.trim().startsWith('[')) {
            logs.push(`🔍 Appears to be JSON format but parsing failed`);
            // Try to find the issue
            const trimmed = rawBody.trim();
            logs.push(`🔍 Trimmed starts with: ${trimmed.charAt(0)}`);
            logs.push(`🔍 Trimmed ends with: ${trimmed.charAt(trimmed.length - 1)}`);
          } else {
            logs.push(`🔍 Raw body does not appear to be JSON format`);
          }
          
          throw new Error(`Failed to parse JSON body: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}. Raw body length: ${rawBody.length}. Raw body: "${rawBody}"`);
        }
      }
    } catch (bodyError) {
      logs.push(`❌ Critical error reading request body: ${bodyError instanceof Error ? bodyError.message : 'Unknown body error'}`);
      logs.push(`🔍 Body error type: ${bodyError instanceof Error ? bodyError.constructor.name : typeof bodyError}`);
      logs.push(`🔍 Body error stack: ${bodyError instanceof Error && bodyError.stack ? bodyError.stack.split('\n').slice(0, 5).join('\n   ') : 'No stack available'}`);
      throw bodyError;
    }
    
    const db = c.env.DB;
    
    if (!streamerId) {
      logs.push(`❌ Streamer ID faltante`);
      return c.json({ error: "Streamer ID is required", logs }, 400);
    }

    logs.push(`🔍 Buscando streamer con ID: ${streamerId}`);

    // Get streamer from database
    const streamer = await db.prepare("SELECT * FROM streamers WHERE id = ?").bind(streamerId).first();
    
    if (!streamer) {
      logs.push(`❌ Streamer no encontrado con ID: ${streamerId}`);
      return c.json({ error: "Streamer not found", logs }, 404);
    }

    logs.push(`✅ Streamer encontrado: ${streamer.name}`);

    // Get the ingame username from the body or use existing one
    const ingameUsername = body.ingame_username || streamer.ingame_username;
    
    let apiData: { success: boolean; player?: any; error?: string } | null = null;
    let rank = body.rank || streamer.rank;
    let gamesPlayed = body.games_played !== undefined ? body.games_played : streamer.games_played;
    let wins = body.wins !== undefined ? body.wins : streamer.wins;
    
    // Initialize rankScore variable first
    let rankScore = Number(body.rank_score || streamer.rank_score || 0);
    
    // Initialize detailed stats variables
    let kdRatio = 0, kdaRatio = 0, kills = 0, deaths = 0, assists = 0, timePlayed = 0, totalDamage = 0, totalHealing = 0;

    // If we have an ingame username, try to fetch data from Marvel Rivals API
    if (ingameUsername && ingameUsername.trim() !== '') {
      logs.push(`🎮 IGN detectado: ${ingameUsername}`);
      logs.push(`🌐 Intentando conectar con la API de Marvel Rivals...`);
      
      try {
        logs.push(`📡 Descargando datos COMPLETOS del jugador desde Marvel Rivals...`);
        logs.push(`⏳ Esperando respuesta de la API... (SIN timeouts - datos completos)`);
        
        apiData = await getPlayerStats(ingameUsername, c.env);
        
        if (apiData && apiData.success && apiData.player) {
          logs.push(`✅ ¡Conexión exitosa con Nueva Marvel Rivals API!`);
          logs.push(`📊 Información del jugador obtenida correctamente:`);
          logs.push(`   • Usuario encontrado: ${apiData.player.username}`);
          logs.push(`   • Rango actual: ${apiData.player.rank || 'No disponible'}`);
          logs.push(`   • Rango pico: ${apiData.player.peakRank || 'No disponible'}`);
          logs.push(`   • UUID del jugador: ${apiData.player.uuid}`);
          
          // Update data with API results if available
          if (apiData.player.rank) {
            const oldRank = rank || 'Sin rango';
            rank = apiData.player.rank;
            logs.push(`🏆 Rango actualizado automáticamente desde Nueva Marvel Rivals API:`);
            logs.push(`   • Anterior: ${oldRank}`);
            logs.push(`   • Nuevo: ${rank}`);
          } else {
            logs.push(`⚠️ El jugador no tiene rango disponible en Nueva Marvel Rivals API`);
          }
          
          // CORREGIDO: Extraer puntos RS desde el score del JSON
          if (apiData.player && apiData.player.score !== undefined && apiData.player.score > 0) {
            const oldScore = rankScore;
            rankScore = Number(apiData.player.score);
            logs.push(`🎯 Puntos RS actualizados desde Nueva Marvel Rivals API:`);
            logs.push(`   • Anterior: ${oldScore.toLocaleString()} RS`);
            logs.push(`   • Nuevo: ${rankScore.toLocaleString()} RS`);
          } else {
            logs.push(`⚠️ No hay puntos RS disponibles en Nueva Marvel Rivals API`);
          }
          
          // Update games and wins if available from API
          
          if (apiData.player.gamesPlayed && apiData.player.gamesPlayed > 0) {
            const oldGames = gamesPlayed;
            const oldWins = wins;
            gamesPlayed = apiData.player.gamesPlayed;
            wins = apiData.player.wins || 0;
            
            // Extract detailed stats from overview
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
            
            logs.push(`📈 Estadísticas de partidas actualizadas desde Nueva Marvel Rivals API:`);
            logs.push(`   • Partidas jugadas: ${oldGames} → ${gamesPlayed}`);
            logs.push(`   • Victorias: ${oldWins} → ${wins}`);
            logs.push(`   • Winrate: ${gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : '0.0'}%`);
            logs.push(`   • KDA: ${kills}/${deaths}/${assists} (${kdaRatio.toFixed(2)})`);
            logs.push(`   • Daño total: ${totalDamage.toLocaleString()}`);
            logs.push(`   • Curación total: ${totalHealing.toLocaleString()}`);
          } else {
            logs.push(`⚠️ Estadísticas de partidas no disponibles en Nueva Marvel Rivals API`);
            logs.push(`💡 Las partidas y victorias se mantendrán con los valores manuales`);
          }

          // Save hero stats if available
          if (apiData.player.heroes && Object.keys(apiData.player.heroes).length > 0) {
            logs.push(`🦸 Guardando estadísticas de héroes (${Object.keys(apiData.player.heroes).length} héroes):`);
            
            // Clear existing hero stats for this streamer
            await db.prepare("DELETE FROM streamer_hero_stats WHERE streamer_id = ?").bind(streamerId).run();
            
            for (const [heroName, heroStats] of Object.entries(apiData.player.heroes)) {
              const stats = heroStats as Record<string, unknown>;
              const matchesPlayed = Number(stats.matchesPlayed || 0);
              const matchesWon = Number(stats.matchesWon || 0);
              const heroWinRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;
              
              await db.prepare(`
                INSERT OR REPLACE INTO streamer_hero_stats (
                  streamer_id, hero_name, matches_played, matches_won, kills, deaths, assists,
                  kd_ratio, kda_ratio, time_played, total_damage, total_healing, win_rate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                streamerId, heroName, stats.matchesPlayed || 0, stats.matchesWon || 0,
                stats.kills || 0, stats.deaths || 0, stats.assists || 0,
                stats.kdRatio || 0, stats.kdaRatio || 0, stats.timePlayed || 0,
                stats.totalHeroDamage || 0, stats.totalHeroHeal || 0, heroWinRate
              ).run();
              
              logs.push(`   • ${heroName}: ${matchesPlayed} partidas, ${heroWinRate.toFixed(1)}% WR`);
            }
          }

          // Save role stats if available
          if (apiData.player.roles && Object.keys(apiData.player.roles).length > 0) {
            logs.push(`🎭 Guardando estadísticas de roles (${Object.keys(apiData.player.roles).length} roles):`);
            
            // Clear existing role stats for this streamer
            await db.prepare("DELETE FROM streamer_role_stats WHERE streamer_id = ?").bind(streamerId).run();
            
            for (const [roleName, roleStats] of Object.entries(apiData.player.roles)) {
              const stats = roleStats as Record<string, unknown>;
              const matchesPlayed = Number(stats.matchesPlayed || 0);
              const matchesWon = Number(stats.matchesWon || 0);
              const roleWinRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;
              
              await db.prepare(`
                INSERT OR REPLACE INTO streamer_role_stats (
                  streamer_id, role_name, matches_played, matches_won, kills, deaths, assists,
                  kd_ratio, kda_ratio, time_played, total_damage, total_healing, win_rate
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                streamerId, roleName, stats.matchesPlayed || 0, stats.matchesWon || 0,
                stats.kills || 0, stats.deaths || 0, stats.assists || 0,
                stats.kdRatio || 0, stats.kdaRatio || 0, stats.timePlayed || 0,
                stats.totalHeroDamage || 0, stats.totalHeroHeal || 0, roleWinRate
              ).run();
              
              logs.push(`   • ${roleName}: ${matchesPlayed} partidas, ${roleWinRate.toFixed(1)}% WR`);
            }
          }
          
          // Log available overview data
          if (apiData.player.overview && Object.keys(apiData.player.overview).length > 0) {
            logs.push(`📊 Datos adicionales disponibles en overview:`);
            Object.keys(apiData.player.overview).forEach(key => {
              if (apiData && apiData.player && apiData.player.overview[key] !== undefined && apiData.player.overview[key] !== null) {
                logs.push(`   • ${key}: ${apiData.player.overview[key]}`);
              }
            });
          }
          
        } else {
          logs.push(`❌ Fallo en Nueva Marvel Rivals API:`);
          logs.push(`   • Motivo: ${apiData?.error || 'Error desconocido'}`);
          
          // Special handling for rate limiting
          if (apiData?.error?.includes('Rate limit') || apiData?.error?.includes('debe esperar') || apiData?.error?.includes('429')) {
            logs.push(`⏱️ La Nueva API está aplicando rate limiting (30 minutos entre updates)`);
            logs.push(`💡 Recomendación: Espera el tiempo indicado antes del próximo update`);
            logs.push(`✋ Mientras tanto, puedes actualizar las estadísticas manualmente`);
          } else {
            logs.push(`💡 Tip: Verifica que el IGN "${ingameUsername}" sea correcto en Marvel Rivals`);
          }
          
          logs.push(`⚠️ No hay problema - continuando con actualización manual...`);
        }
      } catch (apiError) {
        const errorMsg = apiError instanceof Error ? apiError.message : 'Error desconocido';
        logs.push(`❌ Error crítico al conectar con Nueva Marvel Rivals API:`);
        logs.push(`   • Detalles: ${errorMsg}`);
        
        // Special handling for rate limiting errors
        if (errorMsg.includes('Rate limit') || errorMsg.includes('debe esperar') || errorMsg.includes('429')) {
          logs.push(`⏱️ La Nueva Marvel Rivals API está aplicando rate limiting (30 minutos entre updates)`);
          logs.push(`💡 Esto significa que debemos respetar el cooldown de 30 minutos por jugador`);
          logs.push(`⌛ Recomendación: Espera el tiempo indicado antes del próximo update`);
          logs.push(`🚫 Auto-update: Los cooldowns se respetan automáticamente`);
          logs.push(`✅ Solución: La nueva API maneja los límites automáticamente`);
        } else {
          logs.push(`🔧 Posibles causas: Nueva Marvel Rivals API caída, mantenimiento, API Key inválida, o problemas de red`);
        }
        
        logs.push(`⚠️ No hay problema - continuando con actualización manual...`);
      }
    } else {
      logs.push(`⚠️ No hay IGN configurado - actualizando solo datos manuales`);
      logs.push(`💡 Tip: Configura el IGN para obtener datos automáticos desde Nueva Marvel Rivals API`);
    }

    // Get other fields from body or use existing values
    const isLive = body.is_live !== undefined ? body.is_live : streamer.is_live;
    const streamUrl = body.stream_url || streamer.stream_url;
    const twitchUsername = body.twitch_username || streamer.twitch_username;
    const youtubeUsername = body.youtube_username || streamer.youtube_username;
    const tiktokUsername = body.tiktok_username || streamer.tiktok_username;
    const twitterUsername = body.twitter_username || streamer.twitter_username;
    const instagramUsername = body.instagram_username || streamer.instagram_username;

    // Check live status on Twitch if we have a Twitch username
    let finalIsLive = isLive;
    let finalStreamUrl = streamUrl;
    let finalStreamPlatform = null;
    
    if (twitchUsername && twitchUsername.trim() !== '') {
      logs.push(`📺 Verificando estado en vivo en Twitch para @${twitchUsername}...`);
      try {
        const twitchStreams = await checkTwitchStreams([twitchUsername], c.env);
        const normalizedUsername = twitchUsername.toLowerCase();
        const twitchStream = twitchStreams.get(normalizedUsername);
        const isTwitchLive = twitchStream !== null;
        
        logs.push(`🔍 Individual update: @${twitchUsername} (normalizado: ${normalizedUsername}) -> Twitch dice: ${isTwitchLive ? 'LIVE' : 'OFFLINE'}`);
        
        if (isTwitchLive && twitchStream) {
          finalIsLive = true;
          finalStreamUrl = `https://twitch.tv/${twitchUsername}`;
          finalStreamPlatform = 'twitch';
          logs.push(`✅ ${streamer.name} está EN VIVO en Twitch!`);
          logs.push(`   • Título: ${twitchStream.title}`);
          logs.push(`   • Viewers: ${twitchStream.viewer_count.toLocaleString()}`);
          logs.push(`   • Juego: ${twitchStream.game_name}`);
        } else {
          // CAMBIO: Siempre aplicar el estado de Twitch, no solo si no está manualmente configurado
          finalIsLive = false;
          finalStreamUrl = null;
          finalStreamPlatform = null;
          logs.push(`📴 ${streamer.name} está offline en Twitch`);
        }
      } catch (twitchError) {
        logs.push(`⚠️ Error verificando Twitch: ${twitchError instanceof Error ? twitchError.message : 'Error desconocido'}`);
        logs.push(`💡 Manteniendo estado manual configurado`);
      }
    } else {
      logs.push(`⚠️ No hay username de Twitch configurado - usando estado manual`);
    }

    logs.push(`💾 Guardando cambios en la base de datos...`);
    
    // Get current ranking position before updating to track changes
    const currentRankingQuery = await db.prepare(`
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
    
    const currentPositionData = currentRankingQuery.results.find((row: Record<string, unknown>) => Number(row.id) === Number(streamerId));
    const currentPosition = currentPositionData ? Number(currentPositionData.current_position) : null;
    
    // Update streamer in database with detailed stats, rank score and previous position
    await db.prepare(`
      UPDATE streamers 
      SET 
        rank = ?,
        rank_score = ?,
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
        is_live = ?,
        stream_url = ?,
        stream_platform = ?,
        ingame_username = ?,
        twitch_username = ?,
        youtube_username = ?,
        tiktok_username = ?,
        twitter_username = ?,
        instagram_username = ?,
        previous_position = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      rank,
      rankScore || 0,
      gamesPlayed,
      wins,
      kdRatio,
      kdaRatio,
      kills,
      deaths,
      assists,
      timePlayed,
      totalDamage,
      totalHealing,
      finalIsLive ? 1 : 0,
      finalStreamUrl,
      finalStreamPlatform,
      ingameUsername,
      twitchUsername,
      youtubeUsername,
      tiktokUsername,
      twitterUsername,
      instagramUsername,
      currentPosition,
      streamerId
    ).run();
    
    if (currentPosition) {
      logs.push(`📊 Posición actual en ranking guardada: #${currentPosition}`);
    }

    logs.push(`✅ Actualización completada exitosamente`);
    logs.push(`📋 Resumen de cambios:`);
    logs.push(`   • Rango: ${rank || 'No especificado'}`);
    logs.push(`   • Partidas jugadas: ${gamesPlayed}`);
    logs.push(`   • Victorias: ${wins}`);
    logs.push(`   • Winrate: ${gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : '0.0'}%`);
    logs.push(`   • Estado live: ${finalIsLive ? 'En vivo' : 'Offline'}${finalStreamPlatform ? ` (${finalStreamPlatform})` : ''}`);

    // Complete operation logging with simple service
    try {
      const reporter = await getReportingService(c.env);
      await reporter.success('StreamerUpdate', 'Actualización completada', {
        streamerId: Number(streamerId),
        rank: rank,
        gamesPlayed: gamesPlayed,
        wins: wins,
        apiCallsMade: apiData ? 1 : 0
      }, Date.now() - startTime);
    } catch (reportingError) {
      console.log('Note: Failed to log streamer update (non-blocking):', reportingError);
    }

    return c.json({ 
      success: true, 
      message: "Streamer stats updated successfully",
      logs: logs,
      stats: {
        rank: rank,
        games_played: gamesPlayed,
        wins: wins,
        is_live: isLive
      },
      api_data: apiData || undefined
    });
  } catch (error) {
    console.error("Error updating streamer stats:", error);
    
    // Add comprehensive error information to logs
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    
    logs.push(`❌ Error crítico: ${errorMessage}`);
    logs.push(`🔍 Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    
    if (error instanceof Error && error.stack) {
      logs.push(`📋 Stack trace:`);
      const stackLines = error.stack.split('\n').slice(0, 5); // First 5 lines of stack
      stackLines.forEach(line => logs.push(`   ${line.trim()}`));
    }
    
    // Log additional context
    logs.push(`🌐 Environment: ${c.env ? 'Available' : 'Missing'}`);
    logs.push(`🗄️ Database: ${c.env?.DB ? 'Available' : 'Missing'}`);
    logs.push(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs: logs,
      debug_info: {
        error_type: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString(),
        stack_trace: errorStack
      }
    }, 500);
  }
});

// Create new streamer
app.post("/api/streamers", adminAuthMiddleware, async (c) => {
  const startTime = Date.now();
  const logs: string[] = [];
  
  try {
    logs.push(`🔄 Iniciando creación de nuevo streamer`);
    
    // Enhanced body parsing with logging
    const contentType = c.req.header('content-type') || 'unknown';
    logs.push(`📋 Content-Type: ${contentType}`);
    
    let body: any = {};
    let rawBody: string = '';
    
    try {
      rawBody = await c.req.text();
      logs.push(`📝 Raw body length: ${rawBody.length} characters`);
      
      if (!rawBody.trim()) {
        logs.push(`⚠️ Empty body received for streamer creation`);
        body = {};
      } else {
        logs.push(`📝 Raw body content: ${rawBody.substring(0, 500)}${rawBody.length > 500 ? '...' : ''}`);
        body = JSON.parse(rawBody);
        logs.push(`✅ JSON parsing successful for streamer creation`);
        logs.push(`📊 Parsed body keys: ${Object.keys(body).join(', ')}`);
        logs.push(`📊 Parsed body values: ${JSON.stringify(body, null, 2)}`);
      }
    } catch (jsonError) {
      logs.push(`❌ JSON parsing failed in streamer creation: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
      logs.push(`🔍 Raw body that failed parsing: "${rawBody}"`);
      logs.push(`🔍 Content-Type header: ${contentType}`);
      throw new Error(`Failed to parse JSON body in streamer creation: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}. Raw body: "${rawBody}"`);
    }
    
    const db = c.env.DB;
    
    const { name, ingame_username, twitch_username, youtube_username, twitter_username, instagram_username, tiktok_username } = body as {
      name: string;
      ingame_username?: string;
      twitch_username?: string;
      youtube_username?: string;
      twitter_username?: string;
      instagram_username?: string;
      tiktok_username?: string;
    };
    
    if (!name) {
      logs.push(`❌ Nombre de streamer faltante`);
      return c.json({ error: "Streamer name is required", logs }, 400);
    }

    logs.push(`🔍 Verificando si existe streamer con nombre: ${name}`);

    // Check if streamer with same name already exists
    const existing = await db.prepare("SELECT id FROM streamers WHERE name = ?").bind(name).first();
    
    if (existing) {
      logs.push(`❌ Ya existe un streamer con el nombre: ${name} (ID: ${existing.id})`);
      return c.json({ error: "Streamer with this name already exists", logs }, 409);
    }

    logs.push(`✅ Nombre disponible, procediendo con la creación`);

    logs.push(`💾 Creando streamer en la base de datos...`);

    // Insert new streamer
    const result = await db.prepare(`
      INSERT INTO streamers (
        name, 
        ingame_username, 
        twitch_username, 
        youtube_username, 
        twitter_username, 
        instagram_username, 
        tiktok_username,
        games_played,
        wins,
        is_live,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      name,
      ingame_username || null,
      twitch_username || null,
      youtube_username || null,
      twitter_username || null,
      instagram_username || null,
      tiktok_username || null
    ).run();

    logs.push(`✅ Streamer creado exitosamente con ID: ${result.meta.last_row_id}`);

    // Add to simple logging
    try {
      const reporter = await getReportingService(c.env);
      await reporter.success('StreamerManagement', 'Streamer creado', {
        streamerId: result.meta.last_row_id,
        streamerName: name
      }, Date.now() - startTime);
    } catch (reportingError) {
      console.log('Note: Failed to add streamer creation to logs (non-blocking):', reportingError);
    }

    return c.json({ 
      success: true, 
      message: "Streamer created successfully",
      streamer_id: result.meta.last_row_id,
      logs
    });
  } catch (error) {
    console.error("Error creating streamer:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error creando streamer: ${errorMessage}`);
    
    if (error instanceof Error && error.stack) {
      logs.push(`📋 Stack trace:`);
      const stackLines = error.stack.split('\n').slice(0, 3);
      stackLines.forEach(line => logs.push(`   ${line.trim()}`));
    }
    
    // Add error to simple logging
    try {
      const reporter = await getReportingService(c.env);
      await reporter.error('StreamerManagement', 'Error creando streamer', {
        error: errorMessage
      });
    } catch (reportingError) {
      console.log('Note: Failed to add streamer creation error to logs (non-blocking):', reportingError);
    }
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs
    }, 500);
  }
});



// Export all streamers as JSON
app.get("/api/admin/export-streamers", adminAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    
    // Get all streamers with their data
    const streamersResult = await db.prepare(`
      SELECT * FROM streamers 
      ORDER BY name ASC
    `).all();
    
    const streamers = streamersResult.results.map((streamer: any) => ({
      name: streamer.name,
      ingame_username: streamer.ingame_username || null,
      marvel_rivals_uid: streamer.marvel_rivals_uid || null,
      twitch_username: streamer.twitch_username || null,
      youtube_username: streamer.youtube_username || null,
      twitter_username: streamer.twitter_username || null,
      instagram_username: streamer.instagram_username || null,
      tiktok_username: streamer.tiktok_username || null
    }));
    
    const exportData = {
      version: "1.0",
      export_date: new Date().toISOString(),
      total_streamers: streamers.length,
      streamers: streamers
    };
    
    return c.json({
      success: true,
      data: exportData
    });
    
  } catch (error) {
    console.error("Error exporting streamers:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to export streamers" 
    }, 500);
  }
});

// Import streamers from JSON
app.post("/api/admin/import-streamers", adminAuthMiddleware, async (c) => {
  const logs: string[] = [];
  
  try {
    logs.push('🔄 Iniciando importación de streamers...');
    
    // Parse the request body
    const body = await c.req.json();
    const { streamers, import_mode = 'create_only' } = body;
    
    if (!streamers || !Array.isArray(streamers)) {
      logs.push('❌ Datos inválidos: Se requiere un array de streamers');
      return c.json({ 
        success: false, 
        error: "Invalid data: 'streamers' array is required",
        logs 
      }, 400);
    }
    
    logs.push(`📊 Encontrados ${streamers.length} streamers en el JSON`);
    logs.push(`⚙️ Modo de importación: ${import_mode}`);
    
    const db = c.env.DB;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    let deleted = 0;

    // NUEVO: Modo "delete_and_create" - Borrar todos y crear desde cero
    if (import_mode === 'delete_and_create') {
      logs.push('\n🗑️ MODO DESTRUCTIVO: Eliminando TODOS los streamers existentes...');
      logs.push('⚠️ ADVERTENCIA: Esta operación es IRREVERSIBLE');
      
      try {
        // Get count of existing streamers before deletion
        const existingCountResult = await db.prepare("SELECT COUNT(*) as count FROM streamers").first();
        const existingCount = Number(existingCountResult?.count) || 0;
        
        logs.push(`📊 Streamers existentes encontrados: ${existingCount}`);
        
        if (existingCount > 0) {
          // Delete all hero stats first (foreign key relationship)
          const heroStatsResult = await db.prepare("DELETE FROM streamer_hero_stats").run();
          const deletedHeroStats = heroStatsResult.meta.changes || 0;
          logs.push(`   🗑️ ${deletedHeroStats} estadísticas de héroes eliminadas`);
          
          // Delete all role stats
          const roleStatsResult = await db.prepare("DELETE FROM streamer_role_stats").run();
          const deletedRoleStats = roleStatsResult.meta.changes || 0;
          logs.push(`   🗑️ ${deletedRoleStats} estadísticas de roles eliminadas`);
          
          // Delete all streamers
          const streamersResult = await db.prepare("DELETE FROM streamers").run();
          deleted = streamersResult.meta.changes || 0;
          logs.push(`   🗑️ ${deleted} streamers eliminados`);
          
          logs.push(`✅ Base de datos limpiada: ${deleted} streamers y ${deletedHeroStats + deletedRoleStats} estadísticas eliminadas`);
        } else {
          logs.push(`ℹ️ No había streamers para eliminar`);
        }
        
        logs.push('🎯 Procediendo a crear streamers desde el JSON...\n');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        logs.push(`❌ Error eliminando streamers existentes: ${errorMsg}`);
        errors++;
        return c.json({ 
          success: false, 
          error: `Error en eliminación masiva: ${errorMsg}`,
          logs 
        }, 500);
      }
    }
    
    // Process each streamer
    for (let i = 0; i < streamers.length; i++) {
      const streamerData = streamers[i];
      const index = i + 1;
      
      try {
        logs.push(`\n📍 [${index}/${streamers.length}] Procesando: ${streamerData.name || 'Sin nombre'}`);
        
        // Validate required fields
        if (!streamerData.name || typeof streamerData.name !== 'string' || streamerData.name.trim() === '') {
          logs.push(`   ❌ Error: Nombre requerido (posición ${index})`);
          errors++;
          continue;
        }
        
        const name = streamerData.name.trim();
        
        // Check if streamer already exists (solo para modos que no sean delete_and_create)
        let existing = null;
        if (import_mode !== 'delete_and_create') {
          existing = await db.prepare("SELECT id, name FROM streamers WHERE name = ?").bind(name).first();
        }
        
        if (existing) {
          if (import_mode === 'create_only') {
            logs.push(`   ⏭️ Ya existe "${name}" - saltando (modo: solo crear)`);
            skipped++;
            continue;
          } else if (import_mode === 'update_existing') {
            // Update existing streamer
            logs.push(`   🔄 Actualizando streamer existente: ${name}`);
            
            await db.prepare(`
              UPDATE streamers 
              SET 
                ingame_username = ?,
                marvel_rivals_uid = ?,
                twitch_username = ?,
                youtube_username = ?,
                twitter_username = ?,
                instagram_username = ?,
                tiktok_username = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(
              streamerData.ingame_username || null,
              streamerData.marvel_rivals_uid || null,
              streamerData.twitch_username || null,
              streamerData.youtube_username || null,
              streamerData.twitter_username || null,
              streamerData.instagram_username || null,
              streamerData.tiktok_username || null,
              existing.id
            ).run();
            
            logs.push(`   ✅ ${name} actualizado exitosamente`);
            updated++;
          } else { // create_and_update mode
            logs.push(`   🔄 Actualizando streamer existente: ${name} (modo: crear y actualizar)`);
            
            await db.prepare(`
              UPDATE streamers 
              SET 
                ingame_username = ?,
                marvel_rivals_uid = ?,
                twitch_username = ?,
                youtube_username = ?,
                twitter_username = ?,
                instagram_username = ?,
                tiktok_username = ?,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).bind(
              streamerData.ingame_username || null,
              streamerData.marvel_rivals_uid || null,
              streamerData.twitch_username || null,
              streamerData.youtube_username || null,
              streamerData.twitter_username || null,
              streamerData.instagram_username || null,
              streamerData.tiktok_username || null,
              existing.id
            ).run();
            
            logs.push(`   ✅ ${name} actualizado exitosamente`);
            updated++;
          }
        } else {
          // Create new streamer (o en modo delete_and_create siempre crear)
          const actionText = import_mode === 'delete_and_create' ? 'Creando streamer' : 'Creando nuevo streamer';
          logs.push(`   ➕ ${actionText}: ${name}`);
          
          const result = await db.prepare(`
            INSERT INTO streamers (
              name, 
              ingame_username, 
              marvel_rivals_uid,
              twitch_username, 
              youtube_username, 
              twitter_username, 
              instagram_username, 
              tiktok_username,
              games_played,
              wins,
              is_live,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).bind(
            name,
            streamerData.ingame_username || null,
            streamerData.marvel_rivals_uid || null,
            streamerData.twitch_username || null,
            streamerData.youtube_username || null,
            streamerData.twitter_username || null,
            streamerData.instagram_username || null,
            streamerData.tiktok_username || null
          ).run();
          
          logs.push(`   ✅ ${name} creado exitosamente (ID: ${result.meta.last_row_id})`);
          created++;
        }
        
      } catch (error) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        logs.push(`   ❌ Error procesando "${streamerData.name || 'Sin nombre'}": ${errorMsg}`);
      }
    }
    
    logs.push(`\n🏁 Importación completada:`);
    if (import_mode === 'delete_and_create') {
      logs.push(`🗑️ Eliminados: ${deleted} streamers previos`);
      logs.push(`✅ Creados: ${created} streamers nuevos`);
      logs.push(`❌ Errores: ${errors}`);
      logs.push(`📊 Total en JSON: ${streamers.length}`);
      logs.push(`🎯 Base de datos completamente reemplazada`);
    } else {
      logs.push(`✅ Creados: ${created}`);
      logs.push(`🔄 Actualizados: ${updated}`);
      logs.push(`⏭️ Saltados: ${skipped}`);
      logs.push(`❌ Errores: ${errors}`);
      logs.push(`📊 Total procesados: ${created + updated + skipped + errors}/${streamers.length}`);
    }
    
    // Add to simple logging
    try {
      const reporter = await getReportingService(c.env);
      await reporter.success('StreamerImport', 'Importación completada', {
        total: streamers.length,
        created: created,
        updated: updated,
        errors: errors,
        mode: import_mode
      });
    } catch (historyError) {
      console.log('Note: Failed to add import to logs (non-blocking):', historyError);
    }
    
    const successMessage = import_mode === 'delete_and_create' 
      ? `Reemplazo completo: ${deleted} eliminados, ${created} creados, ${errors} errores`
      : `Importación completada: ${created} creados, ${updated} actualizados, ${skipped} saltados, ${errors} errores`;

    return c.json({
      success: true,
      message: successMessage,
      logs: logs,
      summary: {
        total: streamers.length,
        created: created,
        updated: updated,
        skipped: skipped,
        deleted: deleted,
        errors: errors
      }
    });
    
  } catch (error) {
    console.error("Error importing streamers:", error);
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error crítico en importación: ${errorMsg}`);
    
    return c.json({ 
      success: false, 
      error: errorMsg,
      logs: logs
    }, 500);
  }
});

// Public streamer registration endpoint (no auth required) - Creates application for admin approval
app.post("/api/register-streamer", async (c) => {
  const logs: string[] = [];
  
  try {
    logs.push(`🔄 Iniciando solicitud de registro de nuevo streamer`);
    
    // Enhanced body parsing with logging
    const contentType = c.req.header('content-type') || 'unknown';
    logs.push(`📋 Content-Type: ${contentType}`);
    
    let body: any = {};
    let rawBody: string = '';
    
    try {
      rawBody = await c.req.text();
      logs.push(`📝 Raw body length: ${rawBody.length} characters`);
      
      if (!rawBody.trim()) {
        logs.push(`⚠️ Empty body received for public registration`);
        body = {};
      } else {
        body = JSON.parse(rawBody);
        logs.push(`✅ JSON parsing successful for public registration`);
        logs.push(`📊 Parsed body keys: ${Object.keys(body).join(', ')}`);
      }
    } catch (jsonError) {
      logs.push(`❌ JSON parsing failed in public registration: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`);
      logs.push(`🔍 Raw body that failed parsing: "${rawBody}"`);
      return c.json({ error: "Invalid JSON data", logs }, 400);
    }
    
    const db = c.env.DB;
    
    // Ensure applications table exists before proceeding
    await ensureApplicationsTableExists(db);
    
    const { 
      name, 
      ingame_username, 
      twitch_username, 
      youtube_username, 
      twitter_username, 
      instagram_username, 
      tiktok_username 
    } = body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      logs.push(`❌ Nombre de streamer faltante en registro público`);
      return c.json({ error: "El nombre del streamer es obligatorio", logs }, 400);
    }

    if (!ingame_username || !ingame_username.trim()) {
      logs.push(`❌ IGN de Marvel Rivals faltante en registro público`);
      return c.json({ error: "El IGN de Marvel Rivals es obligatorio", logs }, 400);
    }

    // Validate at least one social media account
    const socialAccounts = [
      twitch_username,
      youtube_username,
      twitter_username,
      instagram_username,
      tiktok_username
    ].filter(account => account && account.trim() !== '');

    if (socialAccounts.length === 0) {
      logs.push(`❌ Ninguna red social proporcionada en registro público`);
      return c.json({ error: "Debes proporcionar al menos una red social", logs }, 400);
    }

    logs.push(`🔍 Verificando que no exista solicitud previa o streamer activo: ${name}`);
    logs.push(`🔍 Verificando que el IGN no esté ya registrado: ${ingame_username}`);

    // Check if streamer with same name already exists in streamers or applications
    const existingStreamer = await db.prepare("SELECT id, name FROM streamers WHERE name = ?").bind(name.trim()).first();
    const existingApplication = await db.prepare("SELECT id, status FROM streamer_applications WHERE name = ? AND status = 'pending'").bind(name.trim()).first();
    
    // Check if IGN already exists in streamers or applications  
    const existingIGNStreamer = await db.prepare("SELECT id, name, ingame_username FROM streamers WHERE ingame_username = ?").bind(ingame_username.trim()).first();
    const existingIGNApplication = await db.prepare("SELECT id, name, status FROM streamer_applications WHERE ingame_username = ? AND status = 'pending'").bind(ingame_username.trim()).first();
    
    if (existingStreamer) {
      logs.push(`❌ Ya existe un streamer activo con el nombre: ${name} (ID: ${existingStreamer.id})`);
      return c.json({ error: "Ya existe un streamer con ese nombre en el challenge", logs }, 409);
    }

    if (existingApplication) {
      logs.push(`❌ Ya existe una solicitud pendiente con el nombre: ${name} (ID: ${existingApplication.id})`);
      return c.json({ error: "Ya tienes una solicitud pendiente de aprobación con ese nombre", logs }, 409);
    }

    if (existingIGNStreamer) {
      logs.push(`❌ Ya existe un streamer activo con el IGN: ${ingame_username} (Streamer: ${existingIGNStreamer.name}, ID: ${existingIGNStreamer.id})`);
      return c.json({ 
        error: `El IGN "${ingame_username}" ya está registrado por el streamer "${existingIGNStreamer.name}" en el challenge`, 
        logs 
      }, 409);
    }

    if (existingIGNApplication) {
      logs.push(`❌ Ya existe una solicitud pendiente con el IGN: ${ingame_username} (Solicitante: ${existingIGNApplication.name}, ID: ${existingIGNApplication.id})`);
      return c.json({ 
        error: `El IGN "${ingame_username}" ya tiene una solicitud pendiente de aprobación por "${existingIGNApplication.name}"`, 
        logs 
      }, 409);
    }

    logs.push(`🎮 Verificando cuenta de Marvel Rivals: ${ingame_username}`);

    let marvelRivalsData: any = null;
    // Verify Marvel Rivals account automatically
    try {
      const playerData = await getPlayerStats(ingame_username.trim(), c.env);
      
      if (!playerData.success || !playerData.player) {
        logs.push(`❌ No se pudo verificar la cuenta de Marvel Rivals: ${playerData.error}`);
        return c.json({ 
          error: `No se pudo verificar tu cuenta de Marvel Rivals: ${playerData.error || 'Cuenta no encontrada o no pública'}`,
          logs 
        }, 400);
      }

      marvelRivalsData = {
        username: playerData.player.username,
        rank: playerData.player.rank,
        gamesPlayed: playerData.player.gamesPlayed,
        wins: playerData.player.wins,
        uuid: playerData.player.uuid,
        verified_at: new Date().toISOString()
      };

      logs.push(`✅ Cuenta de Marvel Rivals verificada exitosamente:`);
      logs.push(`   • Jugador: ${playerData.player.username}`);
      logs.push(`   • Rango: ${playerData.player.rank || 'Sin rango'}`);
      logs.push(`   • Partidas: ${playerData.player.gamesPlayed || 0}`);
      logs.push(`   • UUID: ${playerData.player.uuid}`);

    } catch (verificationError) {
      const errorMsg = verificationError instanceof Error ? verificationError.message : 'Error desconocido';
      logs.push(`❌ Error verificando cuenta de Marvel Rivals: ${errorMsg}`);
      return c.json({ 
        error: `Error verificando tu cuenta de Marvel Rivals: ${errorMsg}. Asegúrate de que tu perfil sea público.`,
        logs 
      }, 400);
    }

    logs.push(`✅ Validaciones completadas - Nombre e IGN únicos verificados`);
    logs.push(`✅ Nombre "${name}" disponible`);
    logs.push(`✅ IGN "${ingame_username}" disponible`);
    logs.push(`📊 Redes sociales proporcionadas: ${socialAccounts.length}`);
    logs.push(`💾 Creando solicitud de registro...`);

    // Insert new application (not directly into streamers table)
    const result = await db.prepare(`
      INSERT INTO streamer_applications (
        name, 
        ingame_username, 
        twitch_username, 
        youtube_username, 
        twitter_username, 
        instagram_username, 
        tiktok_username,
        status,
        marvel_rivals_data,
        application_notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      name.trim(),
      ingame_username.trim(),
      twitch_username?.trim() || null,
      youtube_username?.trim() || null,
      twitter_username?.trim() || null,
      instagram_username?.trim() || null,
      tiktok_username?.trim() || null,
      marvelRivalsData ? JSON.stringify(marvelRivalsData) : '{}',
      `Registro público - ${socialAccounts.length} redes sociales - Verificado automáticamente`
    ).run();

    logs.push(`✅ Solicitud de registro creada exitosamente con ID: ${result.meta.last_row_id}`);
    logs.push(`⏳ Solicitud pendiente de aprobación por el administrador`);

    return c.json({ 
      success: true, 
      message: `¡Tu solicitud ha sido enviada exitosamente, ${name}! Un administrador revisará tu registro y te añadirá al Marvel Rivals SoloQ Challenge una vez aprobado.`,
      application_id: result.meta.last_row_id,
      status: "pending",
      logs
    });
  } catch (error) {
    console.error("Error in public streamer registration:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error crítico en registro público: ${errorMessage}`);
    
    if (error instanceof Error && error.stack) {
      logs.push(`📋 Stack trace:`);
      const stackLines = error.stack.split('\n').slice(0, 3);
      stackLines.forEach(line => logs.push(`   ${line.trim()}`));
    }
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs
    }, 500);
  }
});

// Get pending streamer applications with automatic table creation
app.get("/api/admin/applications", adminAuthMiddleware, async (c) => {
  try {
    const db = c.env.DB;
    
    // Always ensure the table exists first
    await ensureApplicationsTableExists(db);
    
    // Query applications
    const result = await db.prepare(`
      SELECT * FROM streamer_applications 
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `).all();

    if (!result || !result.results) {
      return c.json({ 
        success: true,
        applications: [],
        message: "No pending applications found"
      });
    }

    const applications = result.results.map((row: any) => ({
      ...row,
      marvel_rivals_data: row.marvel_rivals_data ? JSON.parse(row.marvel_rivals_data) : null
    }));

    console.log(`📋 Found ${applications.length} pending applications`);

    return c.json({ 
      success: true,
      applications
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch applications" 
    }, 500);
  }
});

// Helper function to ensure applications table exists
async function ensureApplicationsTableExists(db: any) {
  try {
    // Create the table and indexes if they don't exist
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS streamer_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ingame_username TEXT NOT NULL,
        twitch_username TEXT,
        youtube_username TEXT,
        twitter_username TEXT,
        instagram_username TEXT,
        tiktok_username TEXT,
        status TEXT DEFAULT 'pending',
        marvel_rivals_data TEXT,
        application_notes TEXT,
        rejection_reason TEXT,
        approved_at DATETIME,
        approved_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_applications_status ON streamer_applications(status)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_applications_name ON streamer_applications(name)`).run();
    await db.prepare(`CREATE INDEX IF NOT EXISTS idx_applications_created_at ON streamer_applications(created_at)`).run();
    
    console.log("✅ streamer_applications table ensured to exist");
  } catch (error) {
    console.error("Failed to ensure applications table exists:", error);
    throw error;
  }
}

// Approve streamer application
app.post("/api/admin/applications/:id/approve", adminAuthMiddleware, async (c) => {
  const logs: string[] = [];
  
  try {
    const applicationId = c.req.param("id");
    const db = c.env.DB;
    
    if (!applicationId) {
      return c.json({ error: "Application ID is required" }, 400);
    }

    logs.push(`🔄 Aprobando solicitud ID: ${applicationId}`);
    
    // Ensure applications table exists
    await ensureApplicationsTableExists(db);

    // Get application
    const application = await db.prepare("SELECT * FROM streamer_applications WHERE id = ? AND status = 'pending'").bind(applicationId).first();
    
    if (!application) {
      logs.push(`❌ Solicitud no encontrada o ya procesada: ID ${applicationId}`);
      return c.json({ error: "Application not found or already processed", logs }, 404);
    }

    logs.push(`✅ Solicitud encontrada: ${application.name}`);

    // Check if a streamer with the same name already exists (double-check)
    const existing = await db.prepare("SELECT id FROM streamers WHERE name = ?").bind(application.name).first();
    
    if (existing) {
      logs.push(`❌ Ya existe un streamer con el nombre: ${application.name} (ID: ${existing.id})`);
      return c.json({ error: "A streamer with this name already exists", logs }, 409);
    }

    // Parse Marvel Rivals data
    let marvelRivalsData = null;
    if (application.marvel_rivals_data) {
      try {
        marvelRivalsData = JSON.parse(application.marvel_rivals_data as string);
      } catch (error) {
        logs.push(`⚠️ Error parseando datos de Marvel Rivals, continuando sin ellos`);
      }
    }

    logs.push(`📊 Creando streamer en tabla principal...`);

    // Create streamer in main table
    const result = await db.prepare(`
      INSERT INTO streamers (
        name, 
        ingame_username, 
        twitch_username, 
        youtube_username, 
        twitter_username, 
        instagram_username, 
        tiktok_username,
        rank,
        games_played,
        wins,
        is_live,
        marvel_rivals_uid,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      application.name,
      application.ingame_username,
      application.twitch_username,
      application.youtube_username,
      application.twitter_username,
      application.instagram_username,
      application.tiktok_username,
      marvelRivalsData?.rank || null,
      marvelRivalsData?.gamesPlayed || 0,
      marvelRivalsData?.wins || 0,
      marvelRivalsData?.uuid || null
    ).run();

    logs.push(`✅ Streamer creado con ID: ${result.meta.last_row_id}`);

    // Update application status to approved
    await db.prepare(`
      UPDATE streamer_applications 
      SET 
        status = 'approved',
        approved_at = CURRENT_TIMESTAMP,
        approved_by = 'admin',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(applicationId).run();

    logs.push(`✅ Solicitud marcada como aprobada`);
    logs.push(`🎉 ${application.name} ha sido añadido exitosamente al SoloQ Challenge!`);

    return c.json({ 
      success: true, 
      message: `Solicitud de ${application.name} aprobada exitosamente`,
      streamer_id: result.meta.last_row_id,
      logs
    });
  } catch (error) {
    console.error("Error approving application:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error aprobando solicitud: ${errorMessage}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs
    }, 500);
  }
});

// Reject streamer application
app.post("/api/admin/applications/:id/reject", adminAuthMiddleware, async (c) => {
  const logs: string[] = [];
  
  try {
    const applicationId = c.req.param("id");
    const body = await c.req.json();
    const { reason } = body;
    const db = c.env.DB;
    
    if (!applicationId) {
      return c.json({ error: "Application ID is required" }, 400);
    }

    logs.push(`🔄 Rechazando solicitud ID: ${applicationId}`);
    
    // Ensure applications table exists
    await ensureApplicationsTableExists(db);
    if (reason) {
      logs.push(`📝 Motivo: ${reason}`);
    }

    // Get application
    const application = await db.prepare("SELECT * FROM streamer_applications WHERE id = ? AND status = 'pending'").bind(applicationId).first();
    
    if (!application) {
      logs.push(`❌ Solicitud no encontrada o ya procesada: ID ${applicationId}`);
      return c.json({ error: "Application not found or already processed", logs }, 404);
    }

    logs.push(`✅ Solicitud encontrada: ${application.name}`);

    // Update application status to rejected
    await db.prepare(`
      UPDATE streamer_applications 
      SET 
        status = 'rejected',
        rejection_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(reason || 'No reason provided', applicationId).run();

    logs.push(`❌ Solicitud rechazada: ${application.name}`);

    return c.json({ 
      success: true, 
      message: `Solicitud de ${application.name} rechazada`,
      logs
    });
  } catch (error) {
    console.error("Error rejecting application:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error rechazando solicitud: ${errorMessage}`);
    
    return c.json({ 
      success: false, 
      error: errorMessage,
      logs
    }, 500);
  }
});

// Delete streamer
app.delete("/api/streamers/:id", adminAuthMiddleware, async (c) => {
  const startTime = Date.now();
  const logs: string[] = [];
  
  try {
    const streamerId = c.req.param("id");
    const db = c.env.DB;
    
    if (!streamerId) {
      return c.json({ error: "Streamer ID is required" }, 400);
    }

    // Check if streamer exists
    const streamer = await db.prepare("SELECT name FROM streamers WHERE id = ?").bind(streamerId).first();
    
    if (!streamer) {
      return c.json({ error: "Streamer not found" }, 404);
    }

    logs.push(`🗑️ Eliminando streamer "${streamer.name}" y todas sus estadísticas relacionadas...`);
    
    // Delete hero stats
    const heroStatsResult = await db.prepare("DELETE FROM streamer_hero_stats WHERE streamer_id = ?").bind(streamerId).run();
    const deletedHeroStats = heroStatsResult.meta.changes || 0;
    logs.push(`   ✅ ${deletedHeroStats} estadísticas de héroes eliminadas`);
    
    // Delete role stats  
    const roleStatsResult = await db.prepare("DELETE FROM streamer_role_stats WHERE streamer_id = ?").bind(streamerId).run();
    const deletedRoleStats = roleStatsResult.meta.changes || 0;
    logs.push(`   ✅ ${deletedRoleStats} estadísticas de roles eliminadas`);
    
    // Delete streamer
    await db.prepare("DELETE FROM streamers WHERE id = ?").bind(streamerId).run();
    logs.push(`   ✅ Streamer principal eliminado`);

    // Add to simple logging
    try {
      const reporter = await getReportingService(c.env);
      await reporter.success('StreamerManagement', 'Streamer eliminado', {
        streamerId: Number(streamerId),
        streamerName: streamer.name,
        deletedStats: deletedHeroStats + deletedRoleStats
      }, Date.now() - startTime);
    } catch (reportingError) {
      console.log('Note: Failed to add streamer deletion to logs (non-blocking):', reportingError);
    }

    return c.json({ 
      success: true, 
      message: `Streamer "${streamer.name}" y todas sus estadísticas eliminados correctamente`
    });
  } catch (error) {
    console.error("Error deleting streamer:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    logs.push(`❌ Error eliminando streamer: ${errorMessage}`);
    
    // Add error to simple logging
    try {
      const reporter = await getReportingService(c.env);
      await reporter.error('StreamerManagement', 'Error eliminando streamer', {
        error: errorMessage
      });
    } catch (reportingError) {
      console.log('Note: Failed to add streamer deletion error to logs (non-blocking):', reportingError);
    }
    
    return c.json({ 
      success: false, 
      error: errorMessage
    }, 500);
  }
});

app.get("/api/streamers", async (c) => {
  try {
    const db = c.env.DB;
    
    // Check if admin wants to order by ID
    const orderBy = c.req.query('order_by');
    
    let orderClause = '';
    if (orderBy === 'id') {
      orderClause = 'ORDER BY id ASC';
    } else {
      // Default ranking order for public view
      orderClause = `ORDER BY 
        CASE 
          -- One Above All (highest - valor más alto)
          WHEN rank LIKE '%One Above All%' OR rank LIKE '%Uno Sobre Todos%' THEN 90
          -- Eternity
          WHEN rank LIKE '%Eternity%' OR rank LIKE '%Eternidad%' THEN 80
          -- Celestial
          WHEN rank LIKE '%Celestial III%' THEN 73
          WHEN rank LIKE '%Celestial II%' THEN 74
          WHEN rank LIKE '%Celestial I%' THEN 75
          WHEN rank LIKE '%Celestial%' THEN 70
          -- Grandmaster
          WHEN rank LIKE '%Grandmaster III%' OR rank LIKE '%Gran Maestro III%' THEN 63
          WHEN rank LIKE '%Grandmaster II%' OR rank LIKE '%Gran Maestro II%' THEN 64
          WHEN rank LIKE '%Grandmaster I%' OR rank LIKE '%Gran Maestro I%' THEN 65
          WHEN rank LIKE '%Grandmaster%' OR rank LIKE '%Gran Maestro%' THEN 60
          -- Diamond - ESPECÍFICOS PRIMERO (I es más alto que II, II más alto que III)
          WHEN rank LIKE '%Diamond III%' OR rank LIKE '%Diamante III%' THEN 53
          WHEN rank LIKE '%Diamond II%' OR rank LIKE '%Diamante II%' THEN 54
          WHEN rank LIKE '%Diamond I%' OR rank LIKE '%Diamante I%' THEN 55
          WHEN rank LIKE '%Diamond%' OR rank LIKE '%Diamante%' THEN 50
          -- Platinum - ESPECÍFICOS PRIMERO (I > II > III)
          WHEN rank LIKE '%Platinum III%' OR rank LIKE '%Platino III%' THEN 43
          WHEN rank LIKE '%Platinum II%' OR rank LIKE '%Platino II%' THEN 44
          WHEN rank LIKE '%Platinum I%' OR rank LIKE '%Platino I%' THEN 45
          WHEN rank LIKE '%Platinum%' OR rank LIKE '%Platino%' THEN 40
          -- Gold - ESPECÍFICOS PRIMERO (I > II > III)
          WHEN rank LIKE '%Gold III%' OR rank LIKE '%Oro III%' THEN 33
          WHEN rank LIKE '%Gold II%' OR rank LIKE '%Oro II%' THEN 34
          WHEN rank LIKE '%Gold I%' OR rank LIKE '%Oro I%' THEN 35
          WHEN rank LIKE '%Gold%' OR rank LIKE '%Oro%' THEN 30
          -- Silver - ESPECÍFICOS PRIMERO (I > II > III)
          WHEN rank LIKE '%Silver III%' OR rank LIKE '%Plata III%' THEN 23
          WHEN rank LIKE '%Silver II%' OR rank LIKE '%Plata II%' THEN 24
          WHEN rank LIKE '%Silver I%' OR rank LIKE '%Plata I%' THEN 25
          WHEN rank LIKE '%Silver%' OR rank LIKE '%Plata%' THEN 20
          -- Bronze - ESPECÍFICOS PRIMERO (I > II > III)
          WHEN rank LIKE '%Bronze III%' OR rank LIKE '%Bronce III%' THEN 13
          WHEN rank LIKE '%Bronze II%' OR rank LIKE '%Bronce II%' THEN 14
          WHEN rank LIKE '%Bronze I%' OR rank LIKE '%Bronce I%' THEN 15
          WHEN rank LIKE '%Bronze%' OR rank LIKE '%Bronce%' THEN 10
          -- Unranked or null (lowest - valor más bajo)
          ELSE 0
        END DESC,
        rank_score DESC,
        wins DESC,
        games_played ASC`;
    }
    
    const result = await db.prepare(`
      SELECT * FROM streamers 
      ${orderClause}
    `).all();

    const streamers = result.results.map((row) => {
      const previousPosition = row.previous_position ? Number(row.previous_position) : null;
      
      return {
        ...row,
        is_live: Boolean(row.is_live),
        games_played: Number(row.games_played),
        wins: Number(row.wins),
        kd_ratio: Number(row.kd_ratio || 0),
        kda_ratio: Number(row.kda_ratio || 0),
        kills: Number(row.kills || 0),
        deaths: Number(row.deaths || 0),
        assists: Number(row.assists || 0),
        time_played: Number(row.time_played || 0),
        total_damage: Number(row.total_damage || 0),
        total_healing: Number(row.total_healing || 0),
        rank_score: Number(row.rank_score || 0),
        previous_position: previousPosition,
      };
    });

    return c.json(StreamersResponseSchema.parse({ streamers }));
  } catch (error) {
    console.error("Error fetching streamers:", error);
    return c.json({ error: "Failed to fetch streamers" }, 500);
  }
});

// Get detailed streamer info with hero and role stats
app.get("/api/streamers/:id/details", async (c) => {
  try {
    const streamerId = c.req.param("id");
    const db = c.env.DB;
    
    if (!streamerId) {
      return c.json({ error: "Streamer ID is required" }, 400);
    }

    // Check if streamerId is numeric (old format) or a name (new format)
    const isNumeric = /^\d+$/.test(streamerId);
    let streamerResult;
    
    if (isNumeric) {
      // Get streamer by ID (backward compatibility)
      streamerResult = await db.prepare("SELECT * FROM streamers WHERE id = ?").bind(streamerId).first();
    } else {
      // Get streamer by name (new format)
      streamerResult = await db.prepare("SELECT * FROM streamers WHERE name = ?").bind(streamerId).first();
    }
    
    if (!streamerResult) {
      return c.json({ error: "Streamer not found" }, 404);
    }

    // Get hero stats
    const heroStatsResult = await db.prepare(`
      SELECT * FROM streamer_hero_stats 
      WHERE streamer_id = ? 
      ORDER BY matches_played DESC, win_rate DESC
    `).bind(streamerResult.id).all();

    // Get role stats
    const roleStatsResult = await db.prepare(`
      SELECT * FROM streamer_role_stats 
      WHERE streamer_id = ? 
      ORDER BY matches_played DESC, win_rate DESC
    `).bind(streamerResult.id).all();

    const streamer = {
      ...streamerResult,
      is_live: Boolean(streamerResult.is_live),
      games_played: Number(streamerResult.games_played),
      wins: Number(streamerResult.wins),
      kd_ratio: Number(streamerResult.kd_ratio || 0),
      kda_ratio: Number(streamerResult.kda_ratio || 0),
      kills: Number(streamerResult.kills || 0),
      deaths: Number(streamerResult.deaths || 0),
      assists: Number(streamerResult.assists || 0),
      time_played: Number(streamerResult.time_played || 0),
      total_damage: Number(streamerResult.total_damage || 0),
      total_healing: Number(streamerResult.total_healing || 0),
    };

    const heroStats = heroStatsResult.results.map(row => ({
      ...row,
      matches_played: Number(row.matches_played),
      matches_won: Number(row.matches_won),
      kills: Number(row.kills),
      deaths: Number(row.deaths),
      assists: Number(row.assists),
      kd_ratio: Number(row.kd_ratio),
      kda_ratio: Number(row.kda_ratio),
      time_played: Number(row.time_played),
      total_damage: Number(row.total_damage),
      total_healing: Number(row.total_healing),
      win_rate: Number(row.win_rate),
    }));

    const roleStats = roleStatsResult.results.map(row => ({
      ...row,
      matches_played: Number(row.matches_played),
      matches_won: Number(row.matches_won),
      kills: Number(row.kills),
      deaths: Number(row.deaths),
      assists: Number(row.assists),
      kd_ratio: Number(row.kd_ratio),
      kda_ratio: Number(row.kda_ratio),
      time_played: Number(row.time_played),
      total_damage: Number(row.total_damage),
      total_healing: Number(row.total_healing),
      win_rate: Number(row.win_rate),
    }));

    // Get match history from database (stored during player stats update cycle)
    let matchHistory: any[] = [];
    
    try {
      console.log(`📊 Obteniendo historial de partidas desde base de datos para streamer ${streamerResult.name} (ID: ${streamerResult.id})`);
      
      const matchHistoryResult = await db.prepare(`
        SELECT match_id, result, hero_played, kills, deaths, assists, score, 
               score_change, match_timestamp, duration, game_mode, map_name, map_image_url
        FROM streamer_match_history 
        WHERE streamer_id = ? 
        ORDER BY match_timestamp DESC
        LIMIT 10
      `).bind(streamerResult.id).all();

      if (matchHistoryResult && matchHistoryResult.results) {
        matchHistory = matchHistoryResult.results.map((row: any) => ({
          matchId: row.match_id,
          result: row.result,
          heroPlayed: row.hero_played,
          kills: Number(row.kills || 0),
          deaths: Number(row.deaths || 0),
          assists: Number(row.assists || 0),
          score: Number(row.score || 0),
          scoreChange: Number(row.score_change || 0), // RS change - positivo/negativo
          timestamp: row.match_timestamp,
          duration: row.duration ? Number(row.duration) : undefined,
          gameMode: row.game_mode || 'Competitive',
          mapName: row.map_name || undefined,
          mapImageUrl: row.map_image_url || undefined
        }));
        console.log(`✅ Historial obtenido desde DB: ${matchHistory.length} partidas`);
      } else {
        console.log(`ℹ️ No hay historial guardado para el streamer ${streamerResult.name} (ID: ${streamerResult.id})`);
      }
    } catch (error) {
      console.error(`❌ Error obteniendo historial desde DB para streamer ${streamerResult.name} (ID: ${streamerResult.id}):`, error);
      // Continue without match history
    }

    return c.json({
      streamer,
      hero_stats: heroStats,
      role_stats: roleStats,
      match_history: matchHistory
    });
  } catch (error) {
    console.error("Error fetching streamer details:", error);
    return c.json({ error: "Failed to fetch streamer details" }, 500);
  }
});

// Get global match history (latest 10 matches from all streamers)
app.get("/api/global-match-history", async (c) => {
  try {
    const db = c.env.DB;
    
    // Query the latest 10 matches from all streamers
    const result = await db.prepare(`
      SELECT 
        h.match_id,
        h.result,
        h.hero_played,
        h.kills,
        h.deaths,
        h.assists,
        h.score,
        h.score_change,
        h.match_timestamp,
        h.duration,
        h.game_mode,
        h.map_name,
        h.map_image_url,
        s.id as streamer_id,
        s.name as streamer_name,
        s.avatar_url as streamer_avatar_url
      FROM streamer_match_history h
      INNER JOIN streamers s ON h.streamer_id = s.id
      ORDER BY h.match_timestamp DESC
      LIMIT 10
    `).all();

    if (!result || !result.results) {
      return c.json({
        success: true,
        matches: [],
        total: 0
      });
    }

    const matches = result.results.map((row: any) => ({
      matchId: row.match_id,
      result: row.result,
      heroPlayed: row.hero_played,
      kills: Number(row.kills || 0),
      deaths: Number(row.deaths || 0),
      assists: Number(row.assists || 0),
      score: Number(row.score || 0),
      scoreChange: Number(row.score_change || 0),
      timestamp: row.match_timestamp,
      duration: row.duration ? Number(row.duration) : undefined,
      gameMode: row.game_mode || 'Competitive',
      mapName: row.map_name || undefined,
      mapImageUrl: row.map_image_url || undefined,
      streamerName: row.streamer_name,
      streamerId: row.streamer_id,
      streamerAvatarUrl: row.streamer_avatar_url
    }));

    return c.json({
      success: true,
      matches,
      total: matches.length
    });
  } catch (error) {
    console.error("Error fetching global match history:", error);
    return c.json({ 
      success: false,
      error: "Failed to fetch global match history" 
    }, 500);
  }
});

// Get comparative stats for a specific streamer
app.get("/api/streamers/:id/comparative-stats", async (c) => {
  try {
    const streamerId = c.req.param("id");
    const db = c.env.DB;
    
    if (!streamerId) {
      return c.json({ error: "Streamer ID is required" }, 400);
    }

    // Check if streamerId is numeric (old format) or a name (new format)
    const isNumeric = /^\d+$/.test(streamerId);
    let streamerResult;
    
    if (isNumeric) {
      // Get streamer by ID (backward compatibility)
      streamerResult = await db.prepare("SELECT * FROM streamers WHERE id = ?").bind(streamerId).first();
    } else {
      // Get streamer by name (new format)
      streamerResult = await db.prepare("SELECT * FROM streamers WHERE name = ?").bind(streamerId).first();
    }
    
    if (!streamerResult) {
      return c.json({ error: "Streamer not found" }, 404);
    }

    // Get all streamers for comparison (only with games played > 0)
    const allStreamersResult = await db.prepare(`
      SELECT 
        id, 
        games_played, 
        wins, 
        kda_ratio, 
        kills, 
        deaths, 
        assists, 
        time_played, 
        total_damage, 
        total_healing, 
        rank_score,
        ROW_NUMBER() OVER (
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
        ) as ranking_position
      FROM streamers 
      WHERE games_played > 0
    `).all();

    const allStreamers = allStreamersResult.results;
    const totalStreamers = allStreamers.length;

    // Find current streamer's position
    const currentStreamer = allStreamers.find((s: any) => s.id === Number(streamerId));
    if (!currentStreamer) {
      return c.json({ error: "Streamer not found in rankings" }, 404);
    }

    const currentPosition = currentStreamer.ranking_position;

    // Calculate percentiles for the current streamer
    const calculatePercentile = (metric: string, currentValue: number) => {
      const values = allStreamers
        .map((s: any) => Number(s[metric] || 0))
        .filter(v => v > 0)
        .sort((a, b) => a - b);
      
      if (values.length === 0) return 0;
      
      const index = values.findIndex(v => v >= currentValue);
      if (index === -1) return 100;
      
      return Math.round((index / values.length) * 100);
    };

    // Calculate win rate for current streamer
    const currentWinRate = Number(currentStreamer.games_played) > 0 ? 
      (Number(currentStreamer.wins) / Number(currentStreamer.games_played)) * 100 : 0;

    // Calculate win rates for all streamers for percentile calculation
    const winRates = allStreamers
      .map((s: any) => s.games_played > 0 ? (s.wins / s.games_played) * 100 : 0)
      .filter(wr => wr > 0)
      .sort((a, b) => a - b);

    const winRatePercentile = winRates.length > 0 ? 
      Math.round((winRates.findIndex(wr => wr >= currentWinRate) / winRates.length) * 100) : 0;

    const percentiles = {
      kda_ratio: calculatePercentile('kda_ratio', Number(currentStreamer.kda_ratio)),
      win_rate: winRatePercentile,
      kills: calculatePercentile('kills', Number(currentStreamer.kills)),
      time_played: calculatePercentile('time_played', Number(currentStreamer.time_played)),
      total_damage: calculatePercentile('total_damage', Number(currentStreamer.total_damage)),
      rank_score: calculatePercentile('rank_score', Number(currentStreamer.rank_score))
    };

    // Calculate challenge averages
    const avgGamesPlayed = allStreamers.reduce((sum, s) => sum + Number(s.games_played), 0) / totalStreamers;
    const totalWins = allStreamers.reduce((sum, s) => sum + Number(s.wins), 0);
    const totalGames = allStreamers.reduce((sum, s) => sum + Number(s.games_played), 0);
    const avgWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

    const challengeAverages = {
      kda_ratio: allStreamers.reduce((sum, s) => sum + Number(s.kda_ratio || 0), 0) / totalStreamers,
      win_rate: avgWinRate,
      kills: allStreamers.reduce((sum, s) => sum + Number(s.kills || 0), 0) / totalStreamers,
      deaths: allStreamers.reduce((sum, s) => sum + Number(s.deaths || 0), 0) / totalStreamers,
      assists: allStreamers.reduce((sum, s) => sum + Number(s.assists || 0), 0) / totalStreamers,
      time_played: allStreamers.reduce((sum, s) => sum + Number(s.time_played || 0), 0) / totalStreamers,
      total_damage: allStreamers.reduce((sum, s) => sum + Number(s.total_damage || 0), 0) / totalStreamers,
      total_healing: allStreamers.reduce((sum, s) => sum + Number(s.total_healing || 0), 0) / totalStreamers,
      games_played: avgGamesPlayed
    };

    // Calculate "better than" counts
    const betterThanCount = {
      kda_ratio: allStreamers.filter(s => Number(s.kda_ratio || 0) < Number(currentStreamer.kda_ratio || 0)).length,
      win_rate: allStreamers.filter(s => {
        const otherWinRate = Number(s.games_played) > 0 ? (Number(s.wins) / Number(s.games_played)) * 100 : 0;
        return otherWinRate < currentWinRate;
      }).length,
      kills: allStreamers.filter(s => Number(s.kills || 0) < Number(currentStreamer.kills || 0)).length,
      rank_score: allStreamers.filter(s => Number(s.rank_score || 0) < Number(currentStreamer.rank_score || 0)).length
    };

    // Determine top performer status (top 10% in any category)
    const topPerformers = {
      is_top_kda: percentiles.kda_ratio >= 90,
      is_top_winrate: percentiles.win_rate >= 90,
      is_top_kills: percentiles.kills >= 90,
      is_top_time_played: percentiles.time_played >= 90,
      is_top_damage: percentiles.total_damage >= 90,
      top_percentage_kda: percentiles.kda_ratio >= 90 ? 100 - percentiles.kda_ratio : undefined,
      top_percentage_winrate: percentiles.win_rate >= 90 ? 100 - percentiles.win_rate : undefined,
      top_percentage_kills: percentiles.kills >= 90 ? 100 - percentiles.kills : undefined,
      top_percentage_time_played: percentiles.time_played >= 90 ? 100 - percentiles.time_played : undefined,
      top_percentage_damage: percentiles.total_damage >= 90 ? 100 - percentiles.total_damage : undefined
    };

    return c.json({
      ranking_position: currentPosition,
      total_streamers: totalStreamers,
      percentiles,
      challenge_averages: challengeAverages,
      top_performers: topPerformers,
      better_than_count: betterThanCount
    });
  } catch (error) {
    console.error("Error fetching comparative stats:", error);
    return c.json({ error: "Failed to fetch comparative stats" }, 500);
  }
});

// Get featured/curious stats
app.get("/api/featured-stats", async (c) => {
  try {
    const db = c.env.DB;
    
    // CORREGIDO: Solo usar streamers que existen actualmente en la tabla streamers
    
    // Highest KDA
    const highestKdaResult = await db.prepare(`
      SELECT * FROM streamers 
      WHERE kda_ratio > 0 AND games_played >= 5
      ORDER BY kda_ratio DESC 
      LIMIT 1
    `).first();

    // Most time played
    const mostTimePlayedResult = await db.prepare(`
      SELECT * FROM streamers 
      WHERE time_played > 0
      ORDER BY time_played DESC 
      LIMIT 1
    `).first();

    // Most kills
    const mostKillsResult = await db.prepare(`
      SELECT * FROM streamers 
      WHERE kills > 0
      ORDER BY kills DESC 
      LIMIT 1
    `).first();

    // Highest winrate (minimum 10 games)
    const highestWinrateResult = await db.prepare(`
      SELECT * FROM streamers 
      WHERE games_played >= 10
      ORDER BY (CAST(wins AS REAL) / CAST(games_played AS REAL)) DESC 
      LIMIT 1
    `).first();

    // Most popular hero - CORREGIDO: Solo incluir streamers que existen actualmente
    const mostPopularHeroResult = await db.prepare(`
      SELECT 
        h.hero_name,
        SUM(h.matches_played) as total_matches,
        COUNT(DISTINCT h.streamer_id) as streamers_count
      FROM streamer_hero_stats h
      INNER JOIN streamers s ON h.streamer_id = s.id
      WHERE h.matches_played > 0
      GROUP BY h.hero_name
      ORDER BY total_matches DESC
      LIMIT 1
    `).first();

    // Hero leaders - CORREGIDO: Solo streamers existentes
    const heroLeadersResult = await db.prepare(`
      SELECT 
        h.hero_name,
        h.matches_played,
        h.win_rate,
        h.kda_ratio,
        s.*
      FROM streamer_hero_stats h
      INNER JOIN streamers s ON h.streamer_id = s.id
      WHERE h.matches_played >= 3
      ORDER BY h.win_rate DESC, h.kda_ratio DESC
      LIMIT 15
    `).all();

    // Role leaders - CORREGIDO: Solo streamers existentes
    const roleLeadersResult = await db.prepare(`
      SELECT 
        r.role_name,
        r.matches_played,
        r.win_rate,
        r.kda_ratio,
        s.*
      FROM streamer_role_stats r
      INNER JOIN streamers s ON r.streamer_id = s.id
      WHERE r.matches_played >= 5
      ORDER BY r.role_name, r.win_rate DESC, r.kda_ratio DESC
    `).all();

    const processStreamer = (row: any) => row ? {
      ...row,
      is_live: Boolean(row.is_live),
      games_played: Number(row.games_played),
      wins: Number(row.wins),
      kd_ratio: Number(row.kd_ratio || 0),
      kda_ratio: Number(row.kda_ratio || 0),
      kills: Number(row.kills || 0),
      deaths: Number(row.deaths || 0),
      assists: Number(row.assists || 0),
      time_played: Number(row.time_played || 0),
      total_damage: Number(row.total_damage || 0),
      total_healing: Number(row.total_healing || 0),
    } : null;

    // Group role leaders by role and take top 1 per role
    const roleLeadersGrouped: any[] = [];
    const rolesSeen = new Set();
    for (const row of roleLeadersResult.results) {
      if (!rolesSeen.has(row.role_name)) {
        roleLeadersGrouped.push({
          role_name: row.role_name,
          streamer: processStreamer(row),
          matches_played: Number(row.matches_played),
          win_rate: Number(row.win_rate),
          kda_ratio: Number(row.kda_ratio),
        });
        rolesSeen.add(row.role_name);
      }
    }

    // Group hero leaders and take top performers (limit to unique heroes)
    const heroLeadersGrouped: any[] = [];
    const heroesSeen = new Set();
    for (const row of heroLeadersResult.results) {
      if (!heroesSeen.has(row.hero_name) && heroLeadersGrouped.length < 5) {
        heroLeadersGrouped.push({
          hero_name: row.hero_name,
          streamer: processStreamer(row),
          matches_played: Number(row.matches_played),
          win_rate: Number(row.win_rate),
          kda_ratio: Number(row.kda_ratio),
        });
        heroesSeen.add(row.hero_name);
      }
    }

    return c.json({
      highest_kda: processStreamer(highestKdaResult),
      most_time_played: processStreamer(mostTimePlayedResult),
      most_kills: processStreamer(mostKillsResult),
      highest_winrate: processStreamer(highestWinrateResult),
      most_popular_hero: mostPopularHeroResult ? {
        hero_name: mostPopularHeroResult.hero_name,
        total_matches: Number(mostPopularHeroResult.total_matches),
        streamers_count: Number(mostPopularHeroResult.streamers_count),
      } : null,
      hero_leaders: heroLeadersGrouped,
      role_leaders: roleLeadersGrouped,
    });
  } catch (error) {
    console.error("Error fetching featured stats:", error);
    return c.json({ error: "Failed to fetch featured stats" }, 500);
  }
});

// Export AutoUpdateCron for wrangler.toml cron trigger
export const AutoUpdateCron = {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const reporter = new (await import('./services/ReportingService')).ReportingService(env.DB);
    await reporter.info('Cron', 'AutoUpdateCron disparado');
    
    try {
      const { AutoUpdateService } = await import("./services/AutoUpdateService");
      const autoUpdateService = new AutoUpdateService(env, env.DB);
      await autoUpdateService.initialize();
      await autoUpdateService.checkAndExecuteIfNeeded();
    } catch (error) {
      await reporter.error('Cron', 'Error en AutoUpdateCron', { error: error instanceof Error ? error.message : 'Unknown' });
    }
  }
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  // New cron handler using refactored architecture
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log(`🕐 Cron Trigger: ${_event.cron} at ${new Date().toISOString()}`);
    
    try {
      // Use new AutoUpdateService instead of legacy system
      const { AutoUpdateService } = await import("./services/AutoUpdateService");
      const autoUpdateService = new AutoUpdateService(env, env.DB);
      await autoUpdateService.initialize();
      
      console.log(`🚀 Using new AutoUpdateService for cron execution`);
      await autoUpdateService.checkAndExecuteIfNeeded();
      
      console.log(`✅ Cron execution completed using new architecture`);
    } catch (error) {
      console.error(`❌ Error in new cron architecture:`, error);
      
      // Fallback to legacy system if new architecture fails
      console.log(`🔄 Falling back to legacy cron handler`);
      await handleAutoUpdateCron(env);
    }
  }
};
