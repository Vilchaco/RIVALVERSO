import { useState, useEffect } from 'react';

interface Log { 
  id: number; 
  timestamp: string; 
  level: string; 
  operation: string; 
  message: string; 
  details: string | null; 
  duration_ms: number; 
}

export default function LogsViewer() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/logs');
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
      }
      
      const data = await res.json();
      
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (e) {
      console.error('Error fetching logs:', e);
      setError(e instanceof Error ? e.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      const i = setInterval(fetchLogs, 5000);
      return () => clearInterval(i);
    }
  }, [autoRefresh]);

  const filtered = logs.filter(l => {
    if (filter !== 'all' && l.level !== filter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) && !l.operation.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const color = (l: string) => ({
    info: 'bg-cyan-100 text-cyan-800',
    warn: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    success: 'bg-green-100 text-green-800'
  })[l] || 'bg-gray-100';

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">System Logs</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error fetching logs: {error}
        </div>
      )}
      
      <div className="flex gap-2 mb-4 flex-wrap">
        <input 
          placeholder="Buscar..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="px-3 py-1 border rounded" 
        />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-1 border rounded">
          <option value="all">Todos</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
          <option value="success">Success</option>
        </select>
        <button 
          onClick={() => setAutoRefresh(!autoRefresh)} 
          className={`px-3 py-1 rounded ${autoRefresh ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
        </button>
        <button 
          onClick={fetchLogs} 
          disabled={loading}
          className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>
      
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nivel</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hora</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Operación</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mensaje</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Duración</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {loading ? 'Cargando logs...' : error ? 'Error cargando logs' : 'No hay logs que mostrar'}
                </td>
              </tr>
            ) : (
              filtered.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${color(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{formatTime(log.timestamp)}</td>
                  <td className="px-4 py-2 text-sm font-medium">{log.operation}</td>
                  <td className="px-4 py-2 text-sm max-w-md">
                    <div className="truncate">{log.message}</div>
                    {log.details && (
                      <details className="mt-1 text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">detalles</summary>
                        <pre className="p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40 mt-1">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(JSON.parse(log.details), null, 2)}
                        </pre>
                      </details>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm">{log.duration_ms > 0 ? `${log.duration_ms}ms` : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Mostrando {filtered.length} de {logs.length} logs
      </div>
    </div>
  );
}
