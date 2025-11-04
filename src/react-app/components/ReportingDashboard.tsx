import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, Download, Search, RefreshCw, Activity, Eye, X } from "lucide-react";
import { formatToMexicoCityTime } from "@/react-app/utils/timezone";

interface SystemMetrics {
  average_operation_duration: number;
  success_rate_24h: number;
  success_rate_7d: number;
  total_operations_today: number;
  marvel_rivals_api_health: 'healthy' | 'degraded' | 'down';
  twitch_api_health: 'healthy' | 'degraded' | 'down';
  last_auto_update: string | null;
  last_manual_operation: string | null;
  last_error: string | null;
  operations_trend_7d: Array<{ date: string; count: number; success_rate: number }>;
  error_trend_24h: Array<{ hour: string; error_count: number }>;
  database_health: 'healthy' | 'issues';
  system_uptime_hours: number;
}

interface OperationReport {
  id: string;
  timestamp: string;
  operation_type: string;
  operation_subtype?: string;
  status: 'success' | 'partial_success' | 'failure' | 'in_progress';
  streamer_id?: number;
  streamer_name?: string;
  duration_ms: number;
  summary: {
    total: number;
    successful: number;
    errors: number;
    skipped?: number;
  };
  logs: string[];
  error_details?: string;
  triggered_by: string;
  user_context?: string;
  api_calls_made?: number;
  rate_limit_hits?: number;
  retry_attempts?: number;
  season_version?: string;
}

interface ReportingDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportingDashboard({ isOpen, onClose }: ReportingDashboardProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [reports, setReports] = useState<OperationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'console'>('overview');
  const [consoleLogs, setConsoleLogs] = useState<Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    context?: string;
  }>>([]);
  const [consoleFilter, setConsoleFilter] = useState<string>('all');
  const [consoleSearch, setConsoleSearch] = useState<string>('');
  const [autoScrollConsole, setAutoScrollConsole] = useState<boolean>(true);
  const [lastLogCount, setLastLogCount] = useState<number>(0);
  const [filters, setFilters] = useState({
    operation_type: '',
    operation_subtype: '',
    status: '',
    date_from: '',
    date_to: '',
    search_term: ''
  });
  const [selectedReport, setSelectedReport] = useState<OperationReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Estilos base para botones y componentes
  const buttonBaseClasses = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 font-montserrat whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonVariants = {
    primary: "bg-rivalverso-purple-light hover:bg-rivalverso-purple-dark text-rivalverso-white",
    green: "bg-green-600 hover:bg-green-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    gray: "bg-gray-600 hover:bg-gray-700 text-white",
  };

  const statusColors = {
    success: 'text-green-400 bg-green-900/30 border-green-500/30',
    partial_success: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30',
    failure: 'text-red-400 bg-red-900/30 border-red-500/30',
    in_progress: 'text-blue-400 bg-blue-900/30 border-blue-500/30'
  };

  // Cargar métricas del sistema
  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system-metrics', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      } else {
        console.error('Error loading system metrics');
      }
    } catch (error) {
      console.error('Error loading system metrics:', error);
    }
  };

  // Cargar reportes con filtros
  const loadReports = async () => {
    setReportLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.operation_type) params.append('operation_type', filters.operation_type);
      if (filters.operation_subtype) params.append('operation_subtype', filters.operation_subtype);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      if (filters.search_term) params.append('search_term', filters.search_term);
      params.append('limit', '50');

      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        console.error('Error loading reports');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setReportLoading(false);
    }
  };

  // Exportar reportes como CSV
  const exportReports = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.operation_type) params.append('operation_type', filters.operation_type);
      if (filters.operation_subtype) params.append('operation_subtype', filters.operation_subtype);
      if (filters.status) params.append('status', filters.status);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await fetch(`/api/admin/reports/export/csv?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const csvData = await response.text();
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting reports:', error);
    }
  };

  // Cargar datos inicial
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([loadMetrics(), loadReports()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen]);

  // Recargar reportes cuando cambien los filtros
  useEffect(() => {
    if (isOpen && !loading) {
      loadReports();
    }
  }, [filters]);

  // Cargar logs de consola en tiempo real
  const loadConsoleLogs = async () => {
    try {
      const response = await fetch('/api/admin/console-logs', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setConsoleLogs(data.logs || []);
      } else {
        console.error('Error loading console logs');
      }
    } catch (error) {
      console.error('Error loading console logs:', error);
    }
  };

  // Limpiar logs de consola
  const clearConsoleLogs = async () => {
    try {
      const response = await fetch('/api/admin/console-logs/clear', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setConsoleLogs([]);
        setLastLogCount(0);
      }
    } catch (error) {
      console.error('Error clearing console logs:', error);
    }
  };

  // Copy console logs to clipboard
  const copyConsoleLogs = async () => {
    try {
      const text = consoleLogs.map(log => {
        const timestamp = formatToMexicoCityTime(log.timestamp, 'datetime');
        const applicationType = log.context || 'application';
        return `${timestamp}\t${applicationType}\t${log.message}`;
      }).join('\n');
      
      await navigator.clipboard.writeText(text);
      alert('Logs copiados al portapapeles');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Error copiando al portapapeles');
    }
  };

  // Export console logs as text file
  const exportConsoleLogs = () => {
    try {
      const text = consoleLogs.map(log => {
        const timestamp = formatToMexicoCityTime(log.timestamp, 'datetime');
        const applicationType = log.context || 'application';
        return `${timestamp}\t${applicationType}\t${log.message}`;
      }).join('\n');
      
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `rivalverso_console_logs_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert('Error exportando logs');
    }
  };

  // Auto-refresh cada 30 segundos para reports, cada 3 segundos para consola
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        loadMetrics();
        if (activeTab === 'reports') {
          loadReports();
        } else if (activeTab === 'console') {
          loadConsoleLogs();
        }
      }, activeTab === 'console' ? 3000 : 30000);

      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  // Handle auto-scroll when new logs arrive
  useEffect(() => {
    if (autoScrollConsole && consoleLogs.length > lastLogCount) {
      const consoleElement = document.getElementById('console-output');
      if (consoleElement) {
        consoleElement.scrollTop = consoleElement.scrollHeight;
      }
    }
    setLastLogCount(consoleLogs.length);
  }, [consoleLogs, autoScrollConsole, lastLogCount]);

  // Cargar consola inicial
  useEffect(() => {
    if (isOpen && activeTab === 'console') {
      loadConsoleLogs();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-rivalverso-purple-light mx-auto mb-4" />
          <p className="text-white font-montserrat">Cargando sistema de reporting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-montserrat">Sistema de Reporting</h2>
              <p className="text-gray-400 font-montserrat text-sm">Monitoreo, métricas y logs del sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadMetrics();
                loadReports();
              }}
              className={`${buttonBaseClasses} ${buttonVariants.blue}`}
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            <button
              onClick={onClose}
              className={`${buttonBaseClasses} ${buttonVariants.gray}`}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-montserrat font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'text-rivalverso-green border-b-2 border-rivalverso-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Resumen General
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-6 py-3 font-montserrat font-semibold transition-colors ${
              activeTab === 'reports'
                ? 'text-rivalverso-green border-b-2 border-rivalverso-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Reportes de Operaciones
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`px-6 py-3 font-montserrat font-semibold transition-colors ${
              activeTab === 'console'
                ? 'text-rivalverso-green border-b-2 border-rivalverso-green'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🖥️ Consola
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && metrics && (
            <div className="space-y-6">
              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white font-montserrat">Éxito 24h</h3>
                      <p className="text-green-400 text-2xl font-bold">{metrics.success_rate_24h.toFixed(1)}%</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">7d: {metrics.success_rate_7d.toFixed(1)}%</p>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-8 h-8 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white font-montserrat">Duración Promedio</h3>
                      <p className="text-blue-400 text-2xl font-bold">{(metrics.average_operation_duration / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Por operación</p>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="w-8 h-8 text-purple-400" />
                    <div>
                      <h3 className="text-lg font-bold text-white font-montserrat">Ops Hoy</h3>
                      <p className="text-purple-400 text-2xl font-bold">{metrics.total_operations_today}</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Total del día</p>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tendencia de operaciones */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white font-montserrat mb-4">Tendencia de Operaciones (7 días)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics.operations_trend_7d}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Operaciones"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="success_rate" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="% Éxito"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Errores por hora */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white font-montserrat mb-4">Errores por Hora (24h)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.error_trend_24h}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="hour" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Bar dataKey="error_count" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Filtros */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white font-montserrat">Filtros</h3>
                  <button
                    onClick={exportReports}
                    className={`${buttonBaseClasses} ${buttonVariants.green}`}
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Tipo de Operación</label>
                    <select
                      value={filters.operation_type}
                      onChange={(e) => setFilters(prev => ({ ...prev, operation_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="">Todos</option>
                      <option value="continuous_auto_update">🔄 Auto Update Continuo</option>
                      <option value="auto_update">📅 Auto Update (Legacy)</option>
                      <option value="manual_update">👤 Manual Update</option>
                      <option value="live_status">📺 Live Status</option>
                      <option value="twitch_avatars">🎭 Twitch Avatars</option>
                      <option value="marvel_rivals_api">🎮 Marvel Rivals API</option>
                      <option value="streamer_management">👥 Gestión Streamers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Subtipo de Acción</label>
                    <select
                      value={filters.operation_subtype}
                      onChange={(e) => setFilters(prev => ({ ...prev, operation_subtype: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="">Todos</option>
                      <option value="system_enabled">System Enabled</option>
                      <option value="system_disabled">System Disabled</option>
                      <option value="system_reset">System Reset</option>
                      <option value="cycle_phase_complete">Cycle Phase Complete</option>
                      <option value="full_cycle_complete">Full Cycle Complete</option>
                      <option value="player_stats_individual">Player Stats Individual</option>
                      <option value="player_update_individual">Player Update Individual</option>
                      <option value="twitch_live_status">Twitch Live Status</option>
                      <option value="uid_update">UID Update</option>
                      <option value="api_update">API Update</option>
                      <option value="player_update">Player Update</option>
                      <option value="individual">Individual</option>
                      <option value="batch">Batch</option>
                      <option value="manual_debug">Manual Debug</option>
                      <option value="emergency_cancel">Emergency Cancel</option>
                      <option value="cleanup_orphaned">Cleanup Orphaned</option>
                      <option value="season_reset">Season Reset</option>
                      <option value="streamer_creation">Streamer Creation</option>
                      <option value="streamer_update">Streamer Update</option>
                      <option value="streamer_deletion">Streamer Deletion</option>
                      <option value="avatar_import">Avatar Import</option>
                      <option value="bulk_avatar_import">Bulk Avatar Import</option>
                      <option value="live_status_update">Live Status Update</option>
                      <option value="data_export">Data Export</option>
                      <option value="data_import">Data Import</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Estado</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="">Todos</option>
                      <option value="success">Éxito</option>
                      <option value="partial_success">Éxito Parcial</option>
                      <option value="failure">Error</option>
                      <option value="in_progress">En Progreso</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Desde</label>
                    <input
                      type="datetime-local"
                      value={filters.date_from}
                      onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Buscar</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar en logs..."
                        value={filters.search_term}
                        onChange={(e) => setFilters(prev => ({ ...prev, search_term: e.target.value }))}
                        className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de reportes */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white font-montserrat mb-4">
                  Reportes de Operaciones
                  {reportLoading && <RefreshCw className="inline w-4 h-4 animate-spin ml-2" />}
                </h3>
                <div className="space-y-3">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[report.status]}`}>
                            {report.status === 'success' ? '✅ Éxito' : 
                             report.status === 'partial_success' ? '⚠️ Parcial' : 
                             report.status === 'failure' ? '❌ Error' : '🔄 En Progreso'}
                          </div>
                          <div>
                            <span className="text-white font-semibold">
                              {report.operation_type.replace('_', ' ')}
                              {report.operation_subtype && ` (${report.operation_subtype})`}
                            </span>
                            {report.streamer_name && (
                              <span className="text-gray-400 ml-2">
                                • {report.streamer_name}
                                {report.status === 'failure' && report.error_details && (
                                  <span className="text-red-400 ml-1 text-xs font-mono">
                                    [{report.error_details.includes('Rate limit') ? 'RATE_LIMIT' : 
                                      report.error_details.includes('no encontrado') ? 'NOT_FOUND' : 
                                      report.error_details.includes('API Key') ? 'API_KEY_ERROR' : 'ERROR'}]
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <div>{formatToMexicoCityTime(report.timestamp, 'datetime')}</div>
                          <div>{(report.duration_ms / 1000).toFixed(1)}s • {report.summary.total} ops</div>
                          <div className="text-blue-400 text-xs">👁️ Click para ver detalles</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reports.length === 0 && !reportLoading && (
                    <div className="text-center py-8 text-gray-400">
                      No se encontraron reportes con los filtros seleccionados
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'console' && (
            <div className="space-y-6">
              {/* Console Header */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-mono">&gt;</span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-montserrat">Terminal de Sistema</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoScroll"
                        checked={autoScrollConsole}
                        onChange={(e) => setAutoScrollConsole(e.target.checked)}
                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <label htmlFor="autoScroll" className="text-sm text-gray-400 font-montserrat">
                        Auto-scroll
                      </label>
                    </div>
                    <button
                      onClick={copyConsoleLogs}
                      className={`${buttonBaseClasses} ${buttonVariants.blue}`}
                    >
                      📋 Copiar
                    </button>
                    <button
                      onClick={exportConsoleLogs}
                      className={`${buttonBaseClasses} ${buttonVariants.green}`}
                    >
                      📄 Exportar
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('¿Limpiar todos los logs de la consola?\n\nEsto eliminará todo el historial de operaciones del sistema.')) {
                          await clearConsoleLogs();
                        }
                      }}
                      className={`${buttonBaseClasses} ${buttonVariants.red}`}
                    >
                      🗑️ Limpiar
                    </button>
                  </div>
                </div>
                
                {/* Console Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Nivel de Log</label>
                    <select
                      value={consoleFilter}
                      onChange={(e) => setConsoleFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="all">Todos los niveles</option>
                      <option value="info">ℹ️ Info</option>
                      <option value="warn">⚠️ Warn</option>
                      <option value="error">❌ Error</option>
                      <option value="debug">🔍 Debug</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Buscar en logs</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Filtrar mensajes..."
                        value={consoleSearch}
                        onChange={(e) => setConsoleSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Terminal Output - Estilo Mocha Terminal */}
              <div className="bg-black border border-gray-700 rounded-xl overflow-hidden">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-3 text-gray-400 text-sm font-mono">RIVALVERSO Challenge - Terminal</span>
                  <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                </div>
                
                <div 
                  id="console-output"
                  className="h-[500px] overflow-y-auto p-4 font-mono text-sm bg-black"
                  style={{ 
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4B5563 #000000'
                  }}
                >
                  {consoleLogs
                    .filter(log => consoleFilter === 'all' || log.level === consoleFilter)
                    .filter(log => !consoleSearch || log.message.toLowerCase().includes(consoleSearch.toLowerCase()) || log.context?.toLowerCase().includes(consoleSearch.toLowerCase()))
                    .map((log, index) => {
                      // Formato Mocha Terminal: timestamp\tapplication_type\tmessage
                      const timestamp = formatToMexicoCityTime(log.timestamp, 'datetime');
                      const applicationType = log.context || 'application';
                      
                      return (
                        <div key={index} className="flex items-start text-gray-300 hover:bg-gray-900/20 transition-colors group font-mono text-xs leading-relaxed py-0.5">
                          <span className="text-gray-500 whitespace-nowrap select-all mr-4 flex-shrink-0 w-48">
                            {timestamp}
                          </span>
                          <span className="text-blue-400 whitespace-nowrap mr-4 flex-shrink-0 w-24 truncate">
                            {applicationType}
                          </span>
                          <span className={`flex-1 min-w-0 whitespace-pre-wrap break-all ${
                            log.level === 'info' ? 'text-gray-300' :
                            log.level === 'warn' ? 'text-yellow-300' :
                            log.level === 'error' ? 'text-red-300' :
                            'text-purple-300'
                          }`}>
                            {log.message}
                          </span>
                        </div>
                      );
                    })}
                  
                  {consoleLogs.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-500 text-lg mb-2">🖥️</div>
                      <p className="text-gray-400 font-montserrat">No hay logs disponibles</p>
                      <p className="text-gray-500 text-sm font-montserrat mt-1">Los logs del sistema aparecerán aquí en tiempo real</p>
                      <p className="text-gray-600 text-xs font-montserrat mt-2">Formato: timestamp → application → message</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Console Stats */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-400 font-oswald">
                      {consoleLogs.filter(log => log.level === 'info').length}
                    </div>
                    <div className="text-xs text-gray-400 font-montserrat">Info</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400 font-oswald">
                      {consoleLogs.filter(log => log.level === 'warn').length}
                    </div>
                    <div className="text-xs text-gray-400 font-montserrat">Warnings</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-400 font-oswald">
                      {consoleLogs.filter(log => log.level === 'error').length}
                    </div>
                    <div className="text-xs text-gray-400 font-montserrat">Errors</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-400 font-oswald">
                      {consoleLogs.filter(log => log.level === 'debug').length}
                    </div>
                    <div className="text-xs text-gray-400 font-montserrat">Debug</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-gray-300 font-oswald">
                      {consoleLogs.length}
                    </div>
                    <div className="text-xs text-gray-400 font-montserrat">Total</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalles del Reporte */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-montserrat">
                    Detalles del Reporte
                  </h2>
                  <p className="text-gray-400 font-montserrat text-sm">
                    {selectedReport.operation_type} • {selectedReport.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className={`${buttonBaseClasses} ${buttonVariants.gray}`}
              >
                <X className="w-4 h-4" />
                Cerrar
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Información General */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div><span className="text-gray-400">ID:</span> <span className="text-white font-mono text-sm">{selectedReport.id}</span></div>
                    <div><span className="text-gray-400">Tipo:</span> <span className="text-white">{selectedReport.operation_type}</span></div>
                    <div><span className="text-gray-400">Subtipo:</span> <span className="text-white">{selectedReport.operation_subtype || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Estado:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold border ${statusColors[selectedReport.status]}`}>
                        {selectedReport.status === 'success' ? '✅ Éxito' : 
                         selectedReport.status === 'partial_success' ? '⚠️ Parcial' : 
                         selectedReport.status === 'failure' ? '❌ Error' : '🔄 En Progreso'}
                      </span>
                    </div>
                    <div><span className="text-gray-400">Streamer:</span> <span className="text-white">{selectedReport.streamer_name || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Triggered By:</span> <span className="text-white">{selectedReport.triggered_by}</span></div>
                  </div>
                  <div className="space-y-3">
                    <div><span className="text-gray-400">Timestamp:</span> <span className="text-white font-mono text-sm">{formatToMexicoCityTime(selectedReport.timestamp, 'datetime')}</span></div>
                    <div><span className="text-gray-400">Duración:</span> <span className="text-white">{(selectedReport.duration_ms / 1000).toFixed(1)}s</span></div>
                    <div><span className="text-gray-400">Total Operaciones:</span> <span className="text-white">{selectedReport.summary.total}</span></div>
                    <div><span className="text-gray-400">Exitosas:</span> <span className="text-green-400">{selectedReport.summary.successful}</span></div>
                    <div><span className="text-gray-400">Errores:</span> <span className="text-red-400">{selectedReport.summary.errors}</span></div>
                    <div><span className="text-gray-400">Llamadas API:</span> <span className="text-white">{selectedReport.api_calls_made || 0}</span></div>
                  </div>
                </div>

                {/* Contexto de Usuario */}
                {selectedReport.user_context && (
                  <div className="mb-6">
                    <h4 className="text-md font-bold text-blue-400 mb-2">Contexto de Usuario</h4>
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <pre className="text-blue-300 text-sm whitespace-pre-wrap">{selectedReport.user_context}</pre>
                    </div>
                  </div>
                )}

                {/* Detalles del Error */}
                {selectedReport.error_details && (
                  <div className="mb-6">
                    <h4 className="text-md font-bold text-red-400 mb-2">Detalles del Error</h4>
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <pre className="text-red-300 text-sm whitespace-pre-wrap">{selectedReport.error_details}</pre>
                    </div>
                  </div>
                )}

                {/* Logs de la Operación */}
                <div>
                  <h4 className="text-md font-bold text-white mb-2">Logs de la Operación</h4>
                  <div className="bg-black border border-gray-600 rounded-lg overflow-hidden">
                    <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="ml-3 text-gray-400 text-sm font-mono">Operation Logs - {selectedReport.id}</span>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                      <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                        {selectedReport.logs.join('\n')}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Métricas Adicionales */}
                {(selectedReport.rate_limit_hits || selectedReport.retry_attempts || selectedReport.season_version) && (
                  <div>
                    <h4 className="text-md font-bold text-purple-400 mb-2">Métricas Adicionales</h4>
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {selectedReport.rate_limit_hits && (
                          <div>
                            <span className="text-gray-400">Rate Limits:</span>
                            <span className="text-yellow-400 ml-2">{selectedReport.rate_limit_hits}</span>
                          </div>
                        )}
                        {selectedReport.retry_attempts && (
                          <div>
                            <span className="text-gray-400">Reintentos:</span>
                            <span className="text-orange-400 ml-2">{selectedReport.retry_attempts}</span>
                          </div>
                        )}
                        {selectedReport.season_version && (
                          <div>
                            <span className="text-gray-400">Temporada:</span>
                            <span className="text-purple-400 ml-2">{selectedReport.season_version}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
