export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  level: LogLevel;
  operation: string;
  message: string;
  details?: any;
  duration_ms?: number;
}

export class ReportingService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  private getEmoji(level: LogLevel): string {
    return { info: 'Info', warn: 'Warning', error: 'Error', success: 'Success' }[level] || 'Log';
  }

  async log(entry: LogEntry): Promise<void> {
    const { level, operation, message, details, duration_ms } = entry;
    const emoji = this.getEmoji(level);
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    console.log(`${emoji} [${timestamp}] ${operation}: ${message}`, details || '');

    try {
      await this.db.prepare(`
        INSERT INTO logs (level, operation, message, details, duration_ms)
        VALUES (?, ?, ?, ?, ?)
      `).bind(level, operation, message, details ? JSON.stringify(details) : null, duration_ms || 0).run();
    } catch (e) {
      console.error('DB log failed:', e);
    }
  }

  info(op: string, msg: string, details?: any) { return this.log({ level: 'info', operation: op, message: msg, details }); }
  warn(op: string, msg: string, details?: any) { return this.log({ level: 'warn', operation: op, message: msg, details }); }
  error(op: string, msg: string, details?: any) { return this.log({ level: 'error', operation: op, message: msg, details }); }
  success(op: string, msg: string, details?: any, duration_ms?: number) {
    return this.log({ level: 'success', operation: op, message: msg, details, duration_ms });
  }

  async getRecentLogs(limit: number = 100): Promise<any[]> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?
      `).bind(limit).all();
      return result.results || [];
    } catch (error) {
      console.error('Error fetching recent logs:', error);
      return [];
    }
  }

  async getStats(hours: number = 24): Promise<any> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const result = await this.db.prepare(`
        SELECT 
          level,
          COUNT(*) as count,
          AVG(duration_ms) as avg_duration
        FROM logs 
        WHERE timestamp > ?
        GROUP BY level
      `).bind(cutoff).all();

      const total = await this.db.prepare(`
        SELECT COUNT(*) as total FROM logs WHERE timestamp > ?
      `).bind(cutoff).first();

      return {
        period_hours: hours,
        total_logs: total?.total || 0,
        by_level: result.results || [],
        cutoff_time: cutoff
      };
    } catch (error) {
      console.error('Error fetching log stats:', error);
      return {
        period_hours: hours,
        total_logs: 0,
        by_level: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async cleanup(days: number = 30): Promise<number> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const result = await this.db.prepare(`
        DELETE FROM logs WHERE timestamp < ?
      `).bind(cutoff).run();

      return result.meta.changes || 0;
    } catch (error) {
      console.error('Error cleaning up logs:', error);
      return 0;
    }
  }
}
