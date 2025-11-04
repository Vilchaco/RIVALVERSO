import { Hono } from 'hono';
import { PlayerUpdateService } from '../services/PlayerUpdateService';
import { AutoUpdateService } from '../services/AutoUpdateService';
import { ReportingService } from '../services/ReportingService';
import { adminAuthMiddleware } from '../auth';

type Env = {
  DB: any;
  MARVEL_RIVALS_API_KEY: string;
  [key: string]: any;
};

const api = new Hono<{ Bindings: Env }>();

// Initialize services
let playerService: PlayerUpdateService | null = null;
let autoUpdateService: AutoUpdateService | null = null;
let reportingService: ReportingService | null = null;

const getPlayerService = async (env: any, db: any) => {
  if (!playerService) {
    playerService = new PlayerUpdateService(env, db);
  }
  return playerService;
};

const getAutoUpdateService = async (env: any, db: any) => {
  if (!autoUpdateService) {
    autoUpdateService = new AutoUpdateService(env, db);
    await autoUpdateService.initialize();
  }
  return autoUpdateService;
};

const getReportingService = async (db: any) => {
  if (!reportingService) {
    reportingService = new ReportingService(db);
  }
  return reportingService;
};

  // Manual player update endpoint
api.post('/player/:username/update', adminAuthMiddleware, async (c) => {
  const startTime = Date.now();
  const logs: string[] = [];
  
  try {
    const username = c.req.param('username');
    const { force = false } = await c.req.json().catch(() => ({}));
    
    if (!username) {
      return c.json({ error: 'Username is required' }, 400);
    }

    logs.push(`🔄 Manual player update requested: ${username}${force ? ' (FORCED)' : ''}`);
    
    const service = await getPlayerService(c.env, c.env.DB);
    const result = await service.updatePlayerData(username, force);
    
    const duration = Date.now() - startTime;
    logs.push(`⌛ Operation completed in ${duration}ms`);
    logs.push(`📊 API calls made: ${result.apiCallsMade}`);
    
    return c.json({
      success: result.success,
      message: result.message,
      uuid: result.uuid,
      cached: result.cached,
      cooldownActive: result.cooldownActive,
      nextAllowedAt: result.nextAllowedAt,
      apiCallsMade: result.apiCallsMade,
      duration,
      logs: [...logs, ...((result as any).logs || [])]
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logs.push(`❌ Error: ${errorMsg}`);
    
    return c.json({
      success: false,
      error: errorMsg,
      duration,
      logs
    }, 500);
  }
});

  // Get player stats endpoint  
api.get('/player/:username/stats', adminAuthMiddleware, async (c) => {
    const startTime = Date.now();
    const logs: string[] = [];
    
    try {
      const username = c.req.param('username');
      
      if (!username) {
        return c.json({ error: 'Username is required' }, 400);
      }

      logs.push(`📊 Player stats requested: ${username}`);
      
      const service = await getPlayerService(c.env, c.env.DB);
      const result = await service.getPlayerStats(username);
      
      const duration = Date.now() - startTime;
      logs.push(`⌛ Operation completed in ${duration}ms`);
      logs.push(`📊 API calls made: ${result.apiCallsMade}`);
      
      return c.json({
        success: result.success,
        message: result.message,
        uuid: result.uuid,
        cached: result.cached,
        cooldownActive: result.cooldownActive,
        nextAllowedAt: result.nextAllowedAt,
        playerData: (result as any).playerData,
        apiCallsMade: result.apiCallsMade,
        duration,
        logs: [...logs, ...((result as any).logs || [])]
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`❌ Error: ${errorMsg}`);
      
      return c.json({
        success: false,
        error: errorMsg,
        duration,
        logs
      }, 500);
    }
  });

  // Get player UUID endpoint (lightweight)
  api.get('/player/:username/uuid', adminAuthMiddleware, async (c) => {
    const startTime = Date.now();
    const logs: string[] = [];
    
    try {
      const username = c.req.param('username');
      
      if (!username) {
        return c.json({ error: 'Username is required' }, 400);
      }

      logs.push(`🔍 Player UUID requested: ${username}`);
      
      const service = await getPlayerService(c.env, c.env.DB);
      const result = await service.getPlayerUUID(username);
      
      const duration = Date.now() - startTime;
      logs.push(`⌛ Operation completed in ${duration}ms`);
      logs.push(`📊 API calls made: ${result.apiCallsMade}`);
      
      return c.json({
        success: result.success,
        message: result.message,
        uuid: result.uuid,
        cached: result.cached,
        apiCallsMade: result.apiCallsMade,
        duration,
        logs: [...logs, ...((result as any).logs || [])]
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`❌ Error: ${errorMsg}`);
      
      return c.json({
        success: false,
        error: errorMsg,
        duration,
        logs
      }, 500);
    }
  });

  // Auto-update service management endpoints
  api.post('/auto-update/enable', adminAuthMiddleware, async (c) => {
    try {
      const service = await getAutoUpdateService(c.env, c.env.DB);
      await service.enable();
      
      return c.json({
        success: true,
        message: 'Auto-update service enabled successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enable auto-update'
      }, 500);
    }
  });

  api.post('/auto-update/disable', adminAuthMiddleware, async (c) => {
    try {
      const service = await getAutoUpdateService(c.env, c.env.DB);
      await service.disable();
      
      return c.json({
        success: true,
        message: 'Auto-update service disabled successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable auto-update'
      }, 500);
    }
  });

  api.get('/auto-update/status', adminAuthMiddleware, async (c) => {
    try {
      const service = await getAutoUpdateService(c.env, c.env.DB);
      const status = await service.getStatus();
      
      return c.json({
        success: true,
        ...status
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get auto-update status'
      }, 500);
    }
  });

  api.get('/auto-update/stats', adminAuthMiddleware, async (c) => {
    try {
      const service = await getAutoUpdateService(c.env, c.env.DB);
      const stats = await service.getStats();
      
      return c.json({
        success: true,
        stats
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get auto-update stats'
      }, 500);
    }
  });

  api.post('/auto-update/emergency-stop', adminAuthMiddleware, async (c) => {
    try {
      const service = await getAutoUpdateService(c.env, c.env.DB);
      await service.emergencyStop();
      
      return c.json({
        success: true,
        message: '🚨 EMERGENCY STOP activated - all operations cancelled'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate emergency stop'
      }, 500);
    }
  });

  api.post('/auto-update/clear-emergency', adminAuthMiddleware, async (c) => {
    try {
      const service = await getAutoUpdateService(c.env, c.env.DB);
      await service.clearEmergencyStop();
      
      return c.json({
        success: true,
        message: '✅ Emergency stop cleared - operations can resume'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear emergency stop'
      }, 500);
    }
  });

  // Manual trigger endpoints for testing
  api.post('/auto-update/trigger/:type', adminAuthMiddleware, async (c) => {
    try {
      const triggerType = c.req.param('type') as 'twitch' | 'players' | 'full';
      
      if (!['twitch', 'players', 'full'].includes(triggerType)) {
        return c.json({
          success: false,
          error: 'Invalid trigger type. Use: twitch, players, or full'
        }, 400);
      }

      const service = await getAutoUpdateService(c.env, c.env.DB);
      const result = await service.manualTrigger(triggerType);
      
      return c.json({
        success: result.success,
        message: `Manual ${triggerType} trigger completed`,
        summary: result.summary,
        duration: result.duration,
        apiCallsMade: result.apiCallsMade,
        logs: result.logs
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger manual update'
      }, 500);
    }
  });

  // Player service statistics
  api.get('/player-service/stats', adminAuthMiddleware, async (c) => {
    try {
      const service = await getPlayerService(c.env, c.env.DB);
      const stats = await service.getUpdateStats();
      
      return c.json({
        success: true,
        stats
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get player service stats'
      }, 500);
    }
  });

  // Cleanup old cache and logs
  api.post('/player-service/cleanup', adminAuthMiddleware, async (c) => {
    try {
      const { days = 30 } = await c.req.json().catch(() => ({}));
      
      const service = await getPlayerService(c.env, c.env.DB);
      const result = await service.cleanup(days);
      
      return c.json({
        success: true,
        message: `Cleanup completed: ${result.deletedCacheEntries} cache entries and ${result.deletedLogEntries} log entries deleted`,
        ...result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup player service data'
      }, 500);
    }
  });

  // Reporting service endpoints
  api.get('/logs', adminAuthMiddleware, async (c) => {
    try {
      const limit = parseInt(c.req.query('limit') || '100');
      const reporter = await getReportingService(c.env.DB);
      const logs = await reporter.getRecentLogs(limit);
      
      return c.json({
        success: true,
        logs
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get logs'
      }, 500);
    }
  });

  api.get('/logs/stats', adminAuthMiddleware, async (c) => {
    try {
      const hours = parseInt(c.req.query('hours') || '24');
      const reporter = await getReportingService(c.env.DB);
      const stats = await reporter.getStats(hours);
      
      return c.json({
        success: true,
        stats
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get log stats'
      }, 500);
    }
  });

  api.post('/logs/cleanup', adminAuthMiddleware, async (c) => {
    try {
      const { days = 30 } = await c.req.json().catch(() => ({}));
      const reporter = await getReportingService(c.env.DB);
      const deletedCount = await reporter.cleanup(days);
      
      return c.json({
        success: true,
        message: `Cleanup completed: ${deletedCount} logs deleted`,
        deletedCount
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup logs'
      }, 500);
    }
  });

  export default api;
