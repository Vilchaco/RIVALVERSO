import { PlayerUpdateService } from './PlayerUpdateService';
import { ReportingService } from './ReportingService';

interface CycleState {
  lastTwitchUpdate: number;
  lastFullUpdateCycle: number;
  isRunning: boolean;
  currentCycleId: string | null;
}

interface CycleResult {
  success: boolean;
  summary: {
    total: number;
    successful: number;
    errors: number;
    skipped: number;
  };
  logs: string[];
  duration: number;
  apiCallsMade: number;
}

export class AutoUpdateService {
  private env: any;
  private db: any;
  private playerService: PlayerUpdateService;
  private reporter: ReportingService;
  private cycleState: CycleState;

  constructor(env: any, db: any) {
    this.env = env;
    this.db = db;
    this.playerService = new PlayerUpdateService(env, db);
    this.reporter = new ReportingService(db);
    
    // Initialize cycle state
    this.cycleState = {
      lastTwitchUpdate: 0,
      lastFullUpdateCycle: 0,
      isRunning: false,
      currentCycleId: null
    };
  }

  async initialize(): Promise<void> {
    await this.reporter.info('AutoUpdateService', 'Inicializando servicio...');
    
    // Load persistent state from database
    await this.loadPersistentState();
    
    await this.reporter.success('AutoUpdateService', 'Servicio inicializado correctamente');
  }

  /**
   * Main orchestrator method - called by cron triggers
   */
  async checkAndExecuteIfNeeded(): Promise<void> {
    try {
      // Check for emergency cancellation
      if (await this.checkForEmergencyCancellation()) {
        await this.reporter.warn('AutoUpdate', 'Cancelación de emergencia activa - saltando');
        return;
      }

      // Check if auto-update is enabled
      if (!await this.isAutoUpdateEnabled()) {
        await this.reporter.info('AutoUpdate', 'Auto-update deshabilitado - saltando');
        return;
      }

      // Prevent overlapping cycles
      if (this.cycleState.isRunning) {
        await this.reporter.warn('AutoUpdate', 'Ciclo ya en ejecución - saltando');
        return;
      }

      const currentTime = Date.now();
      
      // Mark as running
      this.cycleState.isRunning = true;
      this.cycleState.currentCycleId = this.generateCycleId();
      await this.savePersistentState();

      try {
        await this.executeCycle(currentTime);
      } finally {
        // Always clear running state
        this.cycleState.isRunning = false;
        this.cycleState.currentCycleId = null;
        await this.savePersistentState();
      }
    } catch (error) {
      console.error('❌ Error in auto-update orchestrator:', error);
      
      // Clear running state on error
      this.cycleState.isRunning = false;
      this.cycleState.currentCycleId = null;
      await this.savePersistentState();
    }
  }

  /**
   * Execute auto-update cycle with intelligent timing
   */
  private async executeCycle(currentTime: number): Promise<void> {
    const startTime = Date.now();
    const logs: string[] = [];
    let totalApiCalls = 0;
    let operationsExecuted = 0;

    try {
      logs.push('🔄 Starting intelligent auto-update cycle');
      logs.push(`⏰ Cycle time: ${new Date(currentTime).toISOString()}`);

      // 1. Twitch Live Status Update (every 5 minutes)
      if (currentTime - this.cycleState.lastTwitchUpdate >= 5 * 60 * 1000) {
        if (await this.checkForEmergencyCancellation()) {
          logs.push('🚨 Emergency cancellation detected - stopping cycle');
          return;
        }

        try {
          logs.push('📺 Updating Twitch live status...');
          const twitchResult = await this.updateTwitchLiveStatus();
          
          this.cycleState.lastTwitchUpdate = currentTime;
          await this.savePersistentState();
          
          logs.push(`✅ Twitch status updated: ${twitchResult.updated} changes, ${twitchResult.live}/${twitchResult.total} live`);
          operationsExecuted++;
        } catch (error) {
          logs.push(`❌ Twitch update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // 2. Full Player Update Cycle (every 35 minutes to allow margin beyond 30min API cooldown)
      if (currentTime - this.cycleState.lastFullUpdateCycle >= 35 * 60 * 1000) {
        if (await this.checkForEmergencyCancellation()) {
          logs.push('🚨 Emergency cancellation detected - stopping cycle');
          return;
        }

        try {
          logs.push('🎮 Starting full player update cycle (35min interval)...');
          const updateResult = await this.executeFullPlayerUpdateCycle();
          
          totalApiCalls += updateResult.apiCallsMade;
          this.cycleState.lastFullUpdateCycle = currentTime;
          await this.savePersistentState();
          
          logs.push(`✅ Player updates completed: ${updateResult.summary.successful}/${updateResult.summary.total} successful`);
          logs.push(`📊 API calls made: ${updateResult.apiCallsMade}`);
          logs.push(...updateResult.logs);
          operationsExecuted++;
        } catch (error) {
          logs.push(`❌ Player update cycle failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (operationsExecuted === 0) {
        logs.push('⏳ No operations due - waiting for next cycle');
        const nextTwitch = Math.max(0, 5 * 60 * 1000 - (currentTime - this.cycleState.lastTwitchUpdate));
        const nextUpdate = Math.max(0, 35 * 60 * 1000 - (currentTime - this.cycleState.lastFullUpdateCycle));
        logs.push(`   Next Twitch update: ${Math.round(nextTwitch / 60000)}min`);
        logs.push(`   Next player update: ${Math.round(nextUpdate / 60000)}min`);
      } else {
        const duration = Date.now() - startTime;
        logs.push(`✅ Cycle completed: ${operationsExecuted} operations in ${duration}ms`);
      }

      // Report to centralized system only if operations were executed
      if (operationsExecuted > 0) {
        const duration = Date.now() - startTime;
        await this.reporter.success('AutoUpdate', 'Ciclo completado', {
          operationsExecuted,
          totalApiCalls,
          logs
        }, duration);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logs.push(`❌ Cycle error: ${errorMsg}`);
      
      await this.reporter.error('AutoUpdate', 'Error en ciclo', {
        operationsExecuted,
        totalApiCalls,
        logs,
        error: errorMsg,
        duration
      });
    }
  }

  /**
   * Execute full player update cycle for all streamers
   */
  private async executeFullPlayerUpdateCycle(): Promise<CycleResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    let totalApiCalls = 0;
    let successful = 0;
    let errors = 0;
    let skipped = 0;

    try {
      // Get all streamers with ingame usernames
      const streamersResult = await this.db.prepare(`
        SELECT id, name, ingame_username 
        FROM streamers 
        WHERE ingame_username IS NOT NULL AND ingame_username != ''
      `).all();

      const streamers = streamersResult.results;
      logs.push(`📋 Found ${streamers.length} streamers with Marvel Rivals usernames`);

      if (streamers.length === 0) {
        return {
          success: true,
          summary: { total: 0, successful: 0, errors: 0, skipped: 0 },
          logs: ['⚠️ No streamers with Marvel Rivals usernames found'],
          duration: Date.now() - startTime,
          apiCallsMade: 0
        };
      }

      // Process each streamer
      for (let i = 0; i < streamers.length; i++) {
        const streamer = streamers[i];
        
        // Check for emergency cancellation before each streamer
        if (await this.checkForEmergencyCancellation()) {
          logs.push(`🚨 Emergency cancellation detected - stopping at streamer ${i + 1}/${streamers.length}`);
          break;
        }

        try {
          logs.push(`🔄 [${i + 1}/${streamers.length}] Updating ${streamer.name} (${streamer.ingame_username})`);
          
          // Use new PlayerUpdateService
          const updateResult = await this.playerService.updatePlayerData(streamer.ingame_username, false);
          totalApiCalls += updateResult.apiCallsMade;

          if (updateResult.success) {
            // Update streamer in database with new data
            await this.updateStreamerFromResult(streamer.id, updateResult);
            successful++;
            logs.push(`   ✅ ${streamer.name} updated successfully`);
          } else if (updateResult.cooldownActive) {
            skipped++;
            logs.push(`   ⏰ ${streamer.name} skipped - cooldown active until ${updateResult.nextAllowedAt}`);
          } else {
            errors++;
            logs.push(`   ❌ ${streamer.name} failed: ${updateResult.message || updateResult.error}`);
          }

          // Small delay between streamers to be respectful to the API
          if (i < streamers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          errors++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          logs.push(`   ❌ ${streamer.name} error: ${errorMsg}`);
        }
      }

      const duration = Date.now() - startTime;
      const total = streamers.length;

      logs.push(`🏁 Player update cycle completed:`);
      logs.push(`   ✅ Successful: ${successful}/${total}`);
      logs.push(`   ⏰ Skipped (cooldown): ${skipped}/${total}`);
      logs.push(`   ❌ Errors: ${errors}/${total}`);
      logs.push(`   📊 Total API calls: ${totalApiCalls}`);
      logs.push(`   ⌛ Duration: ${Math.round(duration / 1000)}s`);

      return {
        success: true,
        summary: { total, successful, errors, skipped },
        logs,
        duration,
        apiCallsMade: totalApiCalls
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      logs.push(`❌ Critical error in player update cycle: ${errorMsg}`);

      return {
        success: false,
        summary: { total: 0, successful, errors: errors + 1, skipped },
        logs,
        duration,
        apiCallsMade: totalApiCalls
      };
    }
  }

  /**
   * Update Twitch live status for all streamers
   */
  private async updateTwitchLiveStatus(): Promise<{ updated: number; live: number; total: number }> {
    // Import the existing Twitch functionality
    const { updateStreamersLiveStatus } = await import('../index');
    return await updateStreamersLiveStatus(this.env, this.db);
  }

  /**
   * Update streamer data in database from PlayerUpdateService result
   */
  private async updateStreamerFromResult(streamerId: number, _result: any): Promise<void> {
    try {
      // This would be enhanced to parse the player data and update streamer stats
      // For now, just update the timestamp to indicate successful update
      await this.db.prepare(`
        UPDATE streamers 
        SET updated_at = CURRENT_TIMESTAMP,
            last_api_update_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(streamerId).run();
      
    } catch (error) {
      console.error(`Error updating streamer ${streamerId} in database:`, error);
      // Non-critical error - continue with next streamer
    }
  }

  /**
   * Load persistent state from database
   */
  private async loadPersistentState(silent: boolean = false): Promise<void> {
    try {
      const result = await this.db.prepare(`
        SELECT value FROM app_config WHERE key = 'auto_update_cycle_state'
      `).first();

      if (result && result.value) {
        const state = JSON.parse(result.value);
        this.cycleState = {
          lastTwitchUpdate: state.lastTwitchUpdate || 0,
          lastFullUpdateCycle: state.lastFullUpdateCycle || 0,
          isRunning: false, // Always start as not running after restart
          currentCycleId: null
        };
        if (!silent) {
          await this.reporter.info('AutoUpdateService', 'Estado persistente cargado', { state: this.cycleState });
        }
      } else {
        // Initialize default state
        this.cycleState = {
          lastTwitchUpdate: 0,
          lastFullUpdateCycle: 0,
          isRunning: false,
          currentCycleId: null
        };
        if (!silent) {
          await this.reporter.info('AutoUpdateService', 'Estado inicial configurado', { state: this.cycleState });
        }
      }
    } catch (error) {
      await this.reporter.error('AutoUpdateService', 'Error cargando estado persistente', { error: error instanceof Error ? error.message : 'Unknown' });
      // Continue with default state
      this.cycleState = {
        lastTwitchUpdate: 0,
        lastFullUpdateCycle: 0,
        isRunning: false,
        currentCycleId: null
      };
    }
  }

  /**
   * Save persistent state to database
   */
  private async savePersistentState(): Promise<void> {
    try {
      const stateToSave = {
        lastTwitchUpdate: this.cycleState.lastTwitchUpdate,
        lastFullUpdateCycle: this.cycleState.lastFullUpdateCycle,
        lastSaved: Date.now()
      };

      await this.db.prepare(`
        INSERT OR REPLACE INTO app_config (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind('auto_update_cycle_state', JSON.stringify(stateToSave)).run();

    } catch (error) {
      console.error('❌ Error saving persistent state:', error);
    }
  }

  /**
   * Check if auto-update is enabled
   */
  private async isAutoUpdateEnabled(): Promise<boolean> {
    try {
      const result = await this.db.prepare(`
        SELECT value FROM app_config WHERE key = 'auto_update_enabled'
      `).first();

      return result && result.value === 'true';
    } catch (error) {
      console.error('Error checking auto-update status:', error);
      return false;
    }
  }

  /**
   * Check if auto-update is enabled (public method for status checks)
   */
  async isEnabled(): Promise<boolean> {
    return await this.isAutoUpdateEnabled();
  }

  /**
   * Check for emergency cancellation
   */
  private async checkForEmergencyCancellation(): Promise<boolean> {
    try {
      const result = await this.db.prepare(`
        SELECT value FROM app_config WHERE key = 'emergency_cancel_all_operations'
      `).first();

      return result && result.value === 'true';
    } catch (error) {
      console.error('Error checking emergency cancellation:', error);
      return false;
    }
  }

  /**
   * Generate unique cycle ID for tracking
   */
  private generateCycleId(): string {
    return `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable auto-update service
   */
  async enable(): Promise<void> {
    await this.db.prepare(`
      INSERT OR REPLACE INTO app_config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind('auto_update_enabled', 'true').run();

    // Clear any emergency cancellation
    await this.db.prepare(`
      DELETE FROM app_config WHERE key = 'emergency_cancel_all_operations'
    `).run();

    // Reset cycle state
    this.cycleState = {
      lastTwitchUpdate: 0,
      lastFullUpdateCycle: 0,
      isRunning: false,
      currentCycleId: null
    };
    await this.savePersistentState();

    console.log('✅ Auto-Update Service enabled');
  }

  /**
   * Disable auto-update service
   */
  async disable(): Promise<void> {
    await this.db.prepare(`
      INSERT OR REPLACE INTO app_config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind('auto_update_enabled', 'false').run();

    // Clear running state
    this.cycleState.isRunning = false;
    this.cycleState.currentCycleId = null;
    await this.savePersistentState();

    console.log('✅ Auto-Update Service disabled');
  }

  /**
   * Emergency stop all operations
   */
  async emergencyStop(): Promise<void> {
    console.log('🚨 EMERGENCY STOP: Auto-Update Service');

    // Set emergency flag
    await this.db.prepare(`
      INSERT OR REPLACE INTO app_config (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind('emergency_cancel_all_operations', 'true').run();

    // Clear running state
    this.cycleState.isRunning = false;
    this.cycleState.currentCycleId = null;
    await this.savePersistentState();

    console.log('✅ Emergency stop activated');
  }

  /**
   * Clear emergency stop
   */
  async clearEmergencyStop(): Promise<void> {
    await this.db.prepare(`
      DELETE FROM app_config WHERE key = 'emergency_cancel_all_operations'
    `).run();

    console.log('✅ Emergency stop cleared - operations can resume');
  }

  /**
   * Get current service status
   */
  async getStatus(): Promise<{
    enabled: boolean;
    isRunning: boolean;
    emergencyStop: boolean;
    lastTwitchUpdate: number;
    lastFullUpdateCycle: number;
    currentCycleId: string | null;
    nextTwitchUpdate: number;
    nextFullUpdate: number;
  }> {
    // Load persistent state before getting status (silent mode for status checks)
    await this.loadPersistentState(true);
    
    const enabled = await this.isAutoUpdateEnabled();
    const emergencyStop = await this.checkForEmergencyCancellation();

    return {
      enabled,
      isRunning: this.cycleState.isRunning,
      emergencyStop,
      lastTwitchUpdate: this.cycleState.lastTwitchUpdate,
      lastFullUpdateCycle: this.cycleState.lastFullUpdateCycle,
      currentCycleId: this.cycleState.currentCycleId,
      nextTwitchUpdate: this.cycleState.lastTwitchUpdate + (5 * 60 * 1000),
      nextFullUpdate: this.cycleState.lastFullUpdateCycle + (35 * 60 * 1000)
    };
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    playerService: any;
    cycleStats: {
      totalCycles: number;
      lastCycleTime: number;
      averageCycleDuration: number;
    };
  }> {
    const playerStats = await this.playerService.getUpdateStats();

    return {
      playerService: playerStats,
      cycleStats: {
        totalCycles: 0, // This could be tracked in the future
        lastCycleTime: Math.max(this.cycleState.lastTwitchUpdate, this.cycleState.lastFullUpdateCycle),
        averageCycleDuration: 0 // This could be calculated from historical data
      }
    };
  }

  /**
   * Manual trigger for testing
   */
  async manualTrigger(operationType: 'twitch' | 'players' | 'full'): Promise<CycleResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    let totalApiCalls = 0;

    try {
      logs.push(`🔧 Manual trigger: ${operationType}`);

      switch (operationType) {
        case 'twitch':
          const twitchResult = await this.updateTwitchLiveStatus();
          logs.push(`✅ Twitch update: ${twitchResult.updated} changes, ${twitchResult.live}/${twitchResult.total} live`);
          return {
            success: true,
            summary: { total: 1, successful: 1, errors: 0, skipped: 0 },
            logs,
            duration: Date.now() - startTime,
            apiCallsMade: 0
          };

        case 'players':
          return await this.executeFullPlayerUpdateCycle();

        case 'full':
          // Execute both
          const twitchRes = await this.updateTwitchLiveStatus();
          logs.push(`✅ Twitch: ${twitchRes.updated} changes, ${twitchRes.live}/${twitchRes.total} live`);
          
          const playerRes = await this.executeFullPlayerUpdateCycle();
          logs.push(...playerRes.logs);
          totalApiCalls += playerRes.apiCallsMade;

          return {
            success: true,
            summary: {
              total: 1 + playerRes.summary.total,
              successful: 1 + playerRes.summary.successful,
              errors: playerRes.summary.errors,
              skipped: playerRes.summary.skipped
            },
            logs,
            duration: Date.now() - startTime,
            apiCallsMade: totalApiCalls
          };

        default:
          throw new Error(`Unknown operation type: ${operationType}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`❌ Manual trigger error: ${errorMsg}`);

      return {
        success: false,
        summary: { total: 1, successful: 0, errors: 1, skipped: 0 },
        logs,
        duration: Date.now() - startTime,
        apiCallsMade: totalApiCalls
      };
    }
  }
}
