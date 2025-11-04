import { AutoUpdateService } from './services/AutoUpdateService';

/**
 * Cron handler for auto-update system
 * This replaces the old scheduled function and integrates with the new architecture
 */
export async function handleAutoUpdateCron(env: any): Promise<void> {
  console.log(`🕐 AutoUpdate Cron Trigger: ${new Date().toISOString()}`);
  
  try {
    // Initialize auto-update service
    const autoUpdateService = new AutoUpdateService(env, env.DB);
    await autoUpdateService.initialize();
    
    console.log(`⚡ Running Auto-Update with new architecture`);
    
    // Execute the intelligent auto-update cycle
    await autoUpdateService.checkAndExecuteIfNeeded();
    
    console.log(`✅ Auto-Update cron execution completed successfully`);
    
  } catch (error) {
    console.error(`❌ Critical auto-update cron error:`, error);
    
    // Try to log error to simple reporting service
    try {
      const { ReportingService } = await import('./services/ReportingService');
      const reporter = new ReportingService(env.DB);
      
      await reporter.error('AutoUpdateCron', 'Error en ejecución de cron', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (reportingError) {
      console.error(`❌ Failed to log cron error to reporting service:`, reportingError);
    }
  }
}
