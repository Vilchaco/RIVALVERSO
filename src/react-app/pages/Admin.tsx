import { useState, useEffect } from "react";
import { useStreamers } from "@/react-app/hooks/useStreamers";
import { useAdminAuth } from "@/react-app/hooks/useAdminAuth";
import AdminLogin from "@/react-app/components/AdminLogin";
import { Save, RefreshCw, LogOut, Shield, Trash2, Users, Play, Pause, Zap, Radio, Download, Upload, Clock, X, Plus, BarChart3, Calendar, AlertTriangle, Settings, Database, Activity } from "lucide-react";
import ReportingDashboard from "@/react-app/components/ReportingDashboard";
import { formatToMexicoCityTime, convertUTCToMexicoCityLocal, convertMexicoCityToUTC } from "@/react-app/utils/timezone";
import LogsViewer from '../components/LogsViewer';

export default function Admin() {
  // UI State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Clases estandarizadas para botones
  const buttonBaseClasses = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 font-montserrat whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonVariants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-300 border border-gray-600"
  };

  const { isAuthenticated, isLoading: authLoading, login, logout } = useAdminAuth();
  const { streamers, loading, error } = useStreamers('id');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [updateData, setUpdateData] = useState<Record<number, {
    rank: string;
    rank_score: number;
    games_played: number;
    wins: number;
    is_live: boolean;
    stream_url: string;
    ingame_username: string;
    twitch_username: string;
    youtube_username: string;
    tiktok_username: string;
    twitter_username: string;
    instagram_username: string;
  }>>({});
  const [importingTwitchAvatars, setImportingTwitchAvatars] = useState<Record<number, boolean>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Live status update states
  const [updatingLiveStatus, setUpdatingLiveStatus] = useState(false);
  
  // Import/Export states
  const [exporting, setExporting] = useState(false);

  // Marvel Rivals Steps states
  const [updatingUIDs, setUpdatingUIDs] = useState(false);
  const [updatingAPI, setUpdatingAPI] = useState(false);
  const [updatingPlayers, setUpdatingPlayers] = useState(false);
  const [stepLogs, setStepLogs] = useState<Record<string, string[]>>({});
  const [showStepLogsModal, setShowStepLogsModal] = useState<string | null>(null);
  
  // Individual Marvel Rivals Steps states
  const [individualStepStates, setIndividualStepStates] = useState<Record<number, {
    updatingUID: boolean;
    updatingAPI: boolean;
    updatingPlayer: boolean;
  }>>({});
  const [individualStepLogs, setIndividualStepLogs] = useState<Record<string, string[]>>({});
  const [showIndividualLogsModal, setShowIndividualLogsModal] = useState<string | null>(null);
  
  // Marvel Rivals Season Configuration
  const [currentSeason, setCurrentSeason] = useState('3.5');
  const [newSeason, setNewSeason] = useState('3.5');
  const [updatingSeason, setUpdatingSeason] = useState(false);
  
  // Competition Start Date Configuration
  const [competitionStartDate, setCompetitionStartDate] = useState<string>('');
  const [newCompetitionStartDate, setNewCompetitionStartDate] = useState<string>('');
  const [updatingCompetitionDate, setUpdatingCompetitionDate] = useState(false);
  
  // Applications management states
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  // Manual streamer addition states
  const [showAddStreamerModal, setShowAddStreamerModal] = useState(false);
  const [addingStreamer, setAddingStreamer] = useState(false);
  const [newStreamerData, setNewStreamerData] = useState({
    name: '',
    ingame_username: '',
    twitch_username: '',
    youtube_username: '',
    twitter_username: '',
    instagram_username: '',
    tiktok_username: ''
  });

  // Import streamers states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importData, setImportData] = useState('');
  const [importMode, setImportMode] = useState('create_only');

  // Intelligent Auto-Update service states
  const [intelligentAutoUpdateStatus, setIntelligentAutoUpdateStatus] = useState<any>(null);
  const [intelligentAutoUpdateLoading, setIntelligentAutoUpdateLoading] = useState(false);

  // Reporting Dashboard states
  const [showReportingDashboard, setShowReportingDashboard] = useState(false);
  
  // General loading state for actions
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  
  // Clips management states
  const [pendingClips, setPendingClips] = useState<any[]>([]);
  const [loadingPendingClips, setLoadingPendingClips] = useState(false);
  const [showClipsModal, setShowClipsModal] = useState(false);

  // Bulk avatar import states
  const [bulkImportingAvatars, setBulkImportingAvatars] = useState(false);

  // Application management functions
  const approveApplication = async (applicationId: number, applicantName: string) => {
    if (!confirm(`¿Aprobar la solicitud de "${applicantName}"? Esto creará un nuevo streamer en el challenge.`)) {
      return;
    }

    setApprovingId(applicationId);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        alert(`¡Solicitud de "${applicantName}" aprobada exitosamente!`);
        await fetchApplications(); // Reload applications
      } else {
        const data = await response.json();
        alert(`Error aprobando solicitud: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Error de conexión al aprobar solicitud');
    } finally {
      setApprovingId(null);
    }
  };

  const rejectApplication = async (applicationId: number, applicantName: string) => {
    const reason = prompt(`¿Por qué rechazas la solicitud de "${applicantName}"?\n\n(Este motivo será registrado para referencia):`);
    
    if (reason === null) {
      return; // User cancelled
    }

    setRejectingId(applicationId);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reason.trim() || 'Sin motivo especificado' })
      });

      if (response.ok) {
        alert(`Solicitud de "${applicantName}" rechazada.`);
        await fetchApplications(); // Reload applications
      } else {
        const data = await response.json();
        alert(`Error rechazando solicitud: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Error de conexión al rechazar solicitud');
    } finally {
      setRejectingId(null);
    }
  };

  // Load intelligent auto-update status
  const loadIntelligentAutoUpdateStatus = async () => {
    try {
      setIntelligentAutoUpdateLoading(true);
      const response = await fetch('/api/admin/intelligent-auto-update/status', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setIntelligentAutoUpdateStatus(data);
      } else {
        console.error('Failed to load intelligent auto-update status');
      }
    } catch (error) {
      console.error('Error loading intelligent auto-update status:', error);
    } finally {
      setIntelligentAutoUpdateLoading(false);
    }
  };

  // Fetch intelligent auto-update status
  const fetchIntelligentAutoUpdateStatus = async () => {
    try {
      const response = await fetch('/api/admin/intelligent-auto-update/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIntelligentAutoUpdateStatus(data);
      } else {
        console.error('Error fetching intelligent auto-update status');
      }
    } catch (error) {
      console.error('Error fetching intelligent auto-update status:', error);
    }
  };

  // Enable intelligent auto-update
  const enableIntelligentAutoUpdate = async () => {
    setIntelligentAutoUpdateLoading(true);
    try {
      const response = await fetch('/api/admin/intelligent-auto-update/enable', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchIntelligentAutoUpdateStatus();
        alert('🚀 Sistema Inteligente activado con rate limit management avanzado');
      } else {
        const data = await response.json();
        alert(`Error activando sistema inteligente: ${data.error}`);
      }
    } catch (error) {
      alert('Error de conexión al activar sistema inteligente');
    } finally {
      setIntelligentAutoUpdateLoading(false);
    }
  };

  // Disable intelligent auto-update
  const disableIntelligentAutoUpdate = async () => {
    setIntelligentAutoUpdateLoading(true);
    try {
      const response = await fetch('/api/admin/intelligent-auto-update/disable', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await fetchIntelligentAutoUpdateStatus();
        alert('🛑 Sistema Inteligente desactivado');
      } else {
        const data = await response.json();
        alert(`Error desactivando sistema inteligente: ${data.error}`);
      }
    } catch (error) {
      alert('Error de conexión al desactivar sistema inteligente');
    } finally {
      setIntelligentAutoUpdateLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      const response = await fetch('/api/admin/applications', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Process applications and ensure marvel_rivals_data is properly parsed
        const processedApplications = (data.applications || []).map((app: any) => ({
          ...app,
          marvel_rivals_data: app.marvel_rivals_data ? 
            (typeof app.marvel_rivals_data === 'string' ? 
              (() => {
                try {
                  return JSON.parse(app.marvel_rivals_data);
                } catch (error) {
                  console.error('Error parsing marvel_rivals_data:', error);
                  return null;
                }
              })() : 
              app.marvel_rivals_data
            ) : null
        }));
        setApplications(processedApplications);
      } else {
        console.error('Error fetching applications:', response.statusText);
        // Show error to user instead of silent failure
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        alert(`Error cargando solicitudes: ${errorData.error || response.statusText}`);
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Show error to user
      alert(`Error de conexión al cargar solicitudes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    // Initialize update data with current streamer data
    const initialData: Record<number, any> = {};
    streamers.forEach(streamer => {
      initialData[streamer.id] = {
        rank: streamer.rank || "",
        rank_score: streamer.rank_score || 0,
        games_played: streamer.games_played,
        wins: streamer.wins,
        is_live: streamer.is_live,
        stream_url: streamer.stream_url || "",
        ingame_username: streamer.ingame_username || "",
        twitch_username: streamer.twitch_username || "",
        youtube_username: streamer.youtube_username || "",
        tiktok_username: streamer.tiktok_username || "",
        twitter_username: streamer.twitter_username || "",
        instagram_username: streamer.instagram_username || ""
      };
    });
    setUpdateData(initialData);
  }, [streamers]);

  // Fetch current season configuration
  const fetchSeasonConfig = async () => {
    try {
      const response = await fetch('/api/admin/season-config', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const season = data.season || '3.5';
        setCurrentSeason(season);
        setNewSeason(season);
      }
    } catch (error) {
      console.error('Error fetching season config:', error);
    }
  };

  // Fetch current competition configuration
  const fetchCompetitionConfig = async () => {
    try {
      const response = await fetch('/api/admin/competition-config', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const competitionStartUTC = data.competition_start_timestamp;
        
        if (competitionStartUTC) {
          // Convert UTC to Mexico City time for display in datetime-local input
          const mexicoCityLocal = convertUTCToMexicoCityLocal(competitionStartUTC);
          setCompetitionStartDate(competitionStartUTC);
          setNewCompetitionStartDate(mexicoCityLocal);
        } else {
          setCompetitionStartDate('');
          setNewCompetitionStartDate('');
        }
      }
    } catch (error) {
      console.error('Error fetching competition config:', error);
    }
  };

  // Update season configuration
  const updateSeasonConfig = async () => {
    if (!newSeason.trim()) {
      alert('El número de temporada no puede estar vacío');
      return;
    }

    setUpdatingSeason(true);
    
    try {
      const response = await fetch('/api/admin/season-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ season: newSeason.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentSeason(newSeason.trim());
        alert(`Temporada actualizada a: ${newSeason.trim()}`);
      } else {
        alert(`Error actualizando temporada: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating season:', error);
      alert('Error de conexión al actualizar temporada');
    } finally {
      setUpdatingSeason(false);
    }
  };

  // Update competition start date configuration
  const updateCompetitionConfig = async () => {
    if (!newCompetitionStartDate.trim()) {
      alert('La fecha de inicio de competición no puede estar vacía');
      return;
    }

    // Show ultra-sensitive warning
    const confirmMessage = `🚨 CONFIGURACIÓN ULTRA SENSIBLE 🚨

¿Estás seguro de que quieres establecer la fecha de inicio de competición?

📅 Nueva fecha: ${new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  weekday: 'long'
}).format(new Date(newCompetitionStartDate))} (Ciudad de México)

⚠️ IMPORTANTE: ${competitionStartDate ? 'Cambiar' : 'Establecer'} esta fecha ${competitionStartDate ? 'REINICIARÁ TODAS LAS ESTADÍSTICAS' : 'filtrará las partidas válidas'} para la competición.

${competitionStartDate ? `🔥 SE ELIMINARÁN:
• Todas las estadísticas de héroes y roles
• Todo el historial de partidas 
• Todos los rangos y puntos RS
• Todas las métricas KDA y daño

✅ SE CONSERVARÁN:
• Nombres de streamers
• Redes sociales
• Avatares
• Estados de live/offline` : `💡 PRIMERA CONFIGURACIÓN:
• Se establecerá la fecha de inicio
• Solo partidas jugadas DESPUÉS de esta fecha contarán
• Los datos existentes se filtrarán automáticamente`}

¿Continuar?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Second confirmation for changes (not for first-time setup)
    if (competitionStartDate) {
      const secondConfirm = `🚨 ÚLTIMA CONFIRMACIÓN 🚨

¿Estás ABSOLUTAMENTE seguro de que quieres CAMBIAR la fecha de inicio?

Esta acción REINICIARÁ todas las estadísticas de la competición y es IRREVERSIBLE.

¿Proceder con el RESET ULTRA SENSIBLE?`;
      
      if (!confirm(secondConfirm)) {
        return;
      }
    }

    setUpdatingCompetitionDate(true);
    
    try {
      // Convert Mexico City time to UTC for storage
      const utcTimestamp = convertMexicoCityToUTC(newCompetitionStartDate);
      
      const response = await fetch('/api/admin/competition-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ competition_start_timestamp: utcTimestamp })
      });

      const data = await response.json();

      if (response.ok) {
        setCompetitionStartDate(utcTimestamp);
        
        const successMessage = `✅ FECHA DE INICIO ${competitionStartDate ? 'CAMBIADA' : 'CONFIGURADA'} EXITOSAMENTE

📅 Nueva fecha: ${formatToMexicoCityTime(utcTimestamp, 'datetime')} (Ciudad de México)

${data.reset_applied ? `🔥 RESET APLICADO:
• Todas las estadísticas reiniciadas
• Solo partidas desde esta fecha contarán
• Streamers listos para nueva competición` : `💡 CONFIGURACIÓN INICIAL:
• Fecha de inicio establecida
• Filtrado automático activado
• Datos válidos desde esta fecha`}

La página se recargará automáticamente.`;

        alert(successMessage);
        
        // Reload page to show changes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert(`Error configurando fecha de competición: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating competition config:', error);
      alert('Error de conexión al configurar fecha de competición');
    } finally {
      setUpdatingCompetitionDate(false);
    }
  };

  // Individual Marvel Rivals Steps handlers
  const handleIndividualUID = async (streamerId: number, streamerName: string) => {
    setIndividualStepStates(prev => ({
      ...prev,
      [streamerId]: { ...prev[streamerId], updatingUID: true }
    }));
    
    const logKey = `uid_${streamerId}`;
    setIndividualStepLogs(prev => ({ ...prev, [logKey]: [] }));
    
    try {
      const response = await fetch(`/api/admin/streamer/${streamerId}/update-uid`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setIndividualStepLogs(prev => ({ ...prev, [logKey]: data.logs || [] }));
        alert(`UID actualizado para ${streamerName}: ${data.message}`);
        
        // Reload page after successful update
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert(`Error actualizando UID para ${streamerName}: ${data.error || 'Error desconocido'}`);
        if (data.logs) {
          setIndividualStepLogs(prev => ({ ...prev, [logKey]: data.logs }));
        }
      }
    } catch (error) {
      console.error('Error updating individual UID:', error);
      alert(`Error de conexión al actualizar UID para ${streamerName}`);
    } finally {
      setIndividualStepStates(prev => ({
        ...prev,
        [streamerId]: { ...prev[streamerId], updatingUID: false }
      }));
    }
  };

  const handleIndividualAPI = async (streamerId: number, streamerName: string) => {
    setIndividualStepStates(prev => ({
      ...prev,
      [streamerId]: { ...prev[streamerId], updatingAPI: true }
    }));
    
    const logKey = `api_${streamerId}`;
    setIndividualStepLogs(prev => ({ ...prev, [logKey]: [] }));
    
    try {
      const response = await fetch(`/api/admin/streamer/${streamerId}/update-api`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setIndividualStepLogs(prev => ({ ...prev, [logKey]: data.logs || [] }));
        alert(`API ${data.success ? 'actualizada' : 'falló'} para ${streamerName}: ${data.message}`);
      } else {
        alert(`Error actualizando API para ${streamerName}: ${data.error || 'Error desconocido'}`);
        if (data.logs) {
          setIndividualStepLogs(prev => ({ ...prev, [logKey]: data.logs }));
        }
      }
    } catch (error) {
      console.error('Error updating individual API:', error);
      alert(`Error de conexión al actualizar API para ${streamerName}`);
    } finally {
      setIndividualStepStates(prev => ({
        ...prev,
        [streamerId]: { ...prev[streamerId], updatingAPI: false }
      }));
    }
  };

  const handleIndividualPlayer = async (streamerId: number, streamerName: string) => {
    setIndividualStepStates(prev => ({
      ...prev,
      [streamerId]: { ...prev[streamerId], updatingPlayer: true }
    }));
    
    const logKey = `player_${streamerId}`;
    setIndividualStepLogs(prev => ({ ...prev, [logKey]: [] }));
    
    try {
      const response = await fetch(`/api/admin/streamer/${streamerId}/update-player`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setIndividualStepLogs(prev => ({ ...prev, [logKey]: data.logs || [] }));
        alert(`Jugador actualizado para ${streamerName}: ${data.message}`);
        
        // Reload page after successful update
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert(`Error actualizando jugador para ${streamerName}: ${data.error || 'Error desconocido'}`);
        if (data.logs) {
          setIndividualStepLogs(prev => ({ ...prev, [logKey]: data.logs }));
        }
      }
    } catch (error) {
      console.error('Error updating individual player:', error);
      alert(`Error de conexión al actualizar jugador para ${streamerName}`);
    } finally {
      setIndividualStepStates(prev => ({
        ...prev,
        [streamerId]: { ...prev[streamerId], updatingPlayer: false }
      }));
    }
  };

  // Load pending clips for moderation
  const loadPendingClips = async () => {
    setLoadingPendingClips(true);
    try {
      const response = await fetch('/api/admin/clips/pending', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingClips(data.clips || []);
      } else {
        console.error('Error loading pending clips');
        setPendingClips([]);
      }
    } catch (error) {
      console.error('Error loading pending clips:', error);
      setPendingClips([]);
    } finally {
      setLoadingPendingClips(false);
    }
  };

  const clearConsoleLogs = async () => {
    try {
      setIsLoadingAction(true);
      
      const response = await fetch('/api/admin/clear-console-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Console logs cleared successfully');
        // Refresh data
        await fetchIntelligentAutoUpdateStatus();
      } else {
        alert(result.error || 'Failed to clear console logs');
      }
    } catch (error) {
      console.error('Error clearing console logs:', error);
      alert('Failed to clear console logs');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const clearReportingHistory = async () => {
    if (!confirm('¿Estás seguro de que quieres borrar todo el histórico de reporting? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsLoadingAction(true);
      
      const response = await fetch('/api/admin/clear-reporting-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Reporting history cleared successfully. ${result.deletedCount || 0} reports deleted.`);
      } else {
        alert(result.error || 'Failed to clear reporting history');
      }
    } catch (error) {
      console.error('Error clearing reporting history:', error);
      alert('Failed to clear reporting history');
    } finally {
      setIsLoadingAction(false);
    }
  };
  
  // Moderate clip (approve/reject)
  const moderateClip = async (clipId: number, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch(`/api/admin/clips/${clipId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        alert(`Clip ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`);
        await loadPendingClips(); // Reload pending clips
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Operación fallida'}`);
      }
    } catch (error) {
      console.error('Error moderating clip:', error);
      alert('Error de conexión al moderar clip');
    }
  };

  // Delete clip permanently
  const deleteClip = async (clipId: number, clipTitle: string, broadcasterName: string) => {
    if (!confirm(`¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE este clip?\n\n"${clipTitle}" de ${broadcasterName}\n\n⚠️ Esta acción no se puede deshacer y eliminará:\n• El clip\n• Todos los votos\n• Todas las estadísticas\n\n¿Continuar?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clips/${clipId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Clip eliminado exitosamente');
        await loadPendingClips(); // Reload pending clips
      } else {
        const data = await response.json();
        alert(`Error eliminando clip: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error deleting clip:', error);
      alert('Error de conexión al eliminar clip');
    }
  };

  // Fetch applications on component mount (only once when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchSeasonConfig();
      fetchCompetitionConfig();
      loadIntelligentAutoUpdateStatus();
      loadPendingClips();
    }
  }, [isAuthenticated]);

  // Periodic refresh of intelligent auto-update status
  useEffect(() => {
    if (isAuthenticated) {
      const statusInterval = setInterval(fetchIntelligentAutoUpdateStatus, 15000); // Every 15 seconds
      return () => clearInterval(statusInterval);
    }
  }, [isAuthenticated]);

  const handleUpdate = async (streamerId: number) => {
    setUpdatingId(streamerId);
    
    try {
      const response = await fetch(`/api/update-streamer-stats/${streamerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData[streamerId])
      });

      const data = await response.json();

      if (response.ok) {
        // Refetch streamers data instead of full reload
        setTimeout(() => {
          window.location.reload(); // Simplified - just reload after update
        }, 1500);
      } else {
        alert(`Error actualizando las estadísticas: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInputChange = (streamerId: number, field: string, value: string | number | boolean) => {
    setUpdateData(prev => ({
      ...prev,
      [streamerId]: {
        ...prev[streamerId],
        [field]: value
      }
    }));
  };

  const handleImportTwitchAvatar = async (streamerId: number) => {
    setImportingTwitchAvatars(prev => ({ ...prev, [streamerId]: true }));

    try {
      const response = await fetch(`/api/import-twitch-avatar/${streamerId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Avatar de Twitch importado correctamente para ${data.twitch_user?.display_name || 'el usuario'}`);
        // Refresh the page to show the new image
        window.location.reload();
      } else {
        alert(`Error importando avatar de Twitch: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error importing Twitch avatar:', error);
      alert('Error importando el avatar de Twitch. Por favor intenta de nuevo.');
    } finally {
      setImportingTwitchAvatars(prev => ({ ...prev, [streamerId]: false }));
    }
  };

  // Bulk import Twitch avatars for all streamers
  const handleBulkImportTwitchAvatars = async () => {
    const streamersWithTwitch = streamers.filter(s => s.twitch_username && s.twitch_username.trim() !== '');
    
    if (streamersWithTwitch.length === 0) {
      alert('No hay streamers con usernames de Twitch configurados para importar avatares.');
      return;
    }

    const confirmMessage = `🖼️ IMPORTACIÓN MASIVA DE AVATARES\n\n¿Importar avatares de Twitch para ${streamersWithTwitch.length} streamers?\n\nEsto:\n• Obtendrá las fotos de perfil desde Twitch\n• Reemplazará los avatares actuales\n• Puede tardar varios minutos\n\n⚠️ Streamers con Twitch: ${streamersWithTwitch.map(s => s.name).join(', ')}\n\n¿Continuar?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkImportingAvatars(true);
    
    try {
      const response = await fetch('/api/admin/bulk-import-twitch-avatars', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        const successMessage = `✅ IMPORTACIÓN MASIVA COMPLETADA\n\n• ${data.summary.successful} avatares importados exitosamente\n• ${data.summary.errors} errores\n• ${data.summary.skipped} saltados\n\nLa página se recargará para mostrar los nuevos avatares.`;
        
        alert(successMessage);
        
        // Reload page to show the new avatars
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert(`Error en importación masiva: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error in bulk avatar import:', error);
      alert('Error de conexión en importación masiva de avatares');
    } finally {
      setBulkImportingAvatars(false);
    }
  };

  const handleDeleteStreamer = async (streamerId: number, streamerName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a "${streamerName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(streamerId);
    try {
      const response = await fetch(`/api/streamers/${streamerId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Streamer eliminado correctamente');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error eliminando streamer: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error deleting streamer:', error);
      alert('Error eliminando el streamer. Por favor intenta de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLiveStatusUpdate = async () => {
    setUpdatingLiveStatus(true);
    
    try {
      const response = await fetch('/api/update-live-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Estado actualizado: ${data.stats?.live || 0} streamers en vivo`);
        
        // Reload page after a short delay to show fresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert(`Error actualizando estado: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating live status:', error);
      alert(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUpdatingLiveStatus(false);
    }
  };

  const handleCancelAllOperations = async () => {
    if (!confirm('🚨 EMERGENCIA: ¿Estás seguro de que quieres CANCELAR TODAS las operaciones API en progreso?\n\nEsto hará:\n• Cancelar auto-updates\n• Limpiar rate limits individuales\n• Resetear operaciones colgadas\n• Permitir nuevas operaciones inmediatamente')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/emergency/cancel-all-operations', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        alert('🚨 EMERGENCIA COMPLETADA: Todas las operaciones canceladas y estados limpiados');
        
        // Refresh page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
      } else {
        alert(`Error en cancelación de emergencia: ${data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      alert('Error conectando con el servidor para cancelación de emergencia');
    }
  };

  // Marvel Rivals Steps handlers
  const handleUpdateUIDs = async () => {
    setUpdatingUIDs(true);
    setStepLogs(prev => ({ ...prev, uids: [] }));
    
    try {
      const response = await fetch('/api/admin/update-uids', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setStepLogs(prev => ({ ...prev, uids: data.logs || [] }));
        alert(`UIDs actualizados: ${data.summary?.successful || 0} exitosos, ${data.summary?.errors || 0} errores${data.summary?.skipped ? `, ${data.summary.skipped} ya tenían UID` : ''}`);
        window.location.reload();
      } else {
        alert(`Error actualizando UIDs: ${data.error || 'Error desconocido'}`);
        if (data.logs) {
          setStepLogs(prev => ({ ...prev, uids: data.logs }));
        }
      }
    } catch (error) {
      console.error('Error updating UIDs:', error);
      alert('Error de conexión al actualizar UIDs');
    } finally {
      setUpdatingUIDs(false);
    }
  };

  const handleUpdateAPI = async () => {
    if (!confirm('⚠️ Actualización de API\n\nEsta operación solo se puede ejecutar cada 30 minutos por jugador.\n\n¿Continuar?')) {
      return;
    }

    setUpdatingAPI(true);
    setStepLogs(prev => ({ ...prev, api: [] }));
    
    try {
      const response = await fetch('/api/admin/update-api', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setStepLogs(prev => ({ ...prev, api: data.logs || [] }));
        alert(`API actualizada: ${data.summary?.successful || 0} exitosos, ${data.summary?.errors || 0} errores/rate limited`);
      } else {
        alert(`Error actualizando API: ${data.error || 'Error desconocido'}`);
        if (data.logs) {
          setStepLogs(prev => ({ ...prev, api: data.logs }));
        }
      }
    } catch (error) {
      console.error('Error updating API:', error);
      alert('Error de conexión al actualizar API');
    } finally {
      setUpdatingAPI(false);
    }
  };

  const handleUpdatePlayers = async () => {
    setUpdatingPlayers(true);
    setStepLogs(prev => ({ ...prev, players: [] }));
    
    try {
      const response = await fetch('/api/admin/update-players', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setStepLogs(prev => ({ ...prev, players: data.logs || [] }));
        alert(`Jugadores actualizados: ${data.summary?.successful || 0} exitosos, ${data.summary?.errors || 0} errores`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        alert(`Error actualizando jugadores: ${data.error || 'Error desconocido'}`);
        if (data.logs) {
          setStepLogs(prev => ({ ...prev, players: data.logs }));
        }
      }
    } catch (error) {
      console.error('Error updating players:', error);
      alert('Error de conexión al actualizar jugadores');
    } finally {
      setUpdatingPlayers(false);
    }
  };

  // Export streamers to JSON
  const handleExportStreamers = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/export-streamers', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create and download JSON file
        const jsonString = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `streamers-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`Exportación exitosa: ${data.data.total_streamers} streamers exportados`);
      } else {
        const errorData = await response.json();
        alert(`Error exportando streamers: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error exporting streamers:', error);
      alert('Error exportando streamers. Por favor intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  // Add new streamer manually
  const handleAddStreamer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStreamerData.name.trim()) {
      alert('El nombre del streamer es obligatorio');
      return;
    }

    setAddingStreamer(true);
    
    try {
      const response = await fetch('/api/streamers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newStreamerData)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`¡Streamer "${newStreamerData.name}" añadido exitosamente!`);
        setShowAddStreamerModal(false);
        setNewStreamerData({
          name: '',
          ingame_username: '',
          twitch_username: '',
          youtube_username: '',
          twitter_username: '',
          instagram_username: '',
          tiktok_username: ''
        });
        window.location.reload();
      } else {
        alert(`Error añadiendo streamer: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error añadiendo streamer:', error);
      alert('Error de conexión al añadir streamer');
    } finally {
      setAddingStreamer(false);
    }
  };

  // Import streamers from JSON
  const handleImportStreamers = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!importData.trim()) {
      alert('Debes proporcionar datos JSON para importar');
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(importData);
    } catch (error) {
      alert('JSON inválido. Por favor verifica el formato.');
      return;
    }

    if (!parsedData.streamers || !Array.isArray(parsedData.streamers)) {
      alert('El JSON debe contener un array "streamers"');
      return;
    }

    // Confirmación extra para modo destructivo
    if (importMode === 'delete_and_create') {
      const confirmMessage = `🚨 CONFIRMACIÓN DESTRUCTIVA 🚨\n\n¿Estás ABSOLUTAMENTE SEGURO de que quieres:\n\n• ELIMINAR TODOS los ${streamers.length} streamers actuales\n• ELIMINAR TODAS sus estadísticas\n• CREAR únicamente los ${parsedData.streamers.length} streamers del JSON\n\n⚠️ ESTA ACCIÓN ES IRREVERSIBLE\n\n¿Continuar con el REEMPLAZO COMPLETO?`;
      
      if (!confirm(confirmMessage)) {
        return;
      }
      
      const secondConfirm = `🚨 ÚLTIMA CONFIRMACIÓN 🚨\n\n¿Proceder con la ELIMINACIÓN TOTAL y recreación?\n\nEsta es tu última oportunidad para cancelar.`;
      
      if (!confirm(secondConfirm)) {
        return;
      }
    }

    setImporting(true);
    
    try {
      const response = await fetch('/api/admin/import-streamers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          streamers: parsedData.streamers,
          import_mode: importMode
        })
      });

      const data = await response.json();

      if (response.ok) {
        let message;
        if (importMode === 'delete_and_create') {
          message = `🔄 REEMPLAZO COMPLETO EXITOSO:\n\n• ${data.summary.deleted || 0} streamers eliminados\n• ${data.summary.created} streamers creados\n• ${data.summary.errors} errores\n\n✅ Base de datos completamente reemplazada`;
        } else {
          message = `Importación completada: ${data.summary.created} creados, ${data.summary.updated} actualizados, ${data.summary.errors} errores`;
        }
        
        alert(message);
        setShowImportModal(false);
        setImportData('');
        window.location.reload();
      } else {
        alert(`Error en importación: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error importando streamers:', error);
      alert('Error de conexión al importar streamers');
    } finally {
      setImporting(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg font-montserrat">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={login} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg font-montserrat">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <p className="text-lg font-montserrat">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-montserrat">Panel de Administración</h1>
                <p className="text-gray-400 text-sm font-montserrat">
                  {streamers.length} streamers • {streamers.filter(s => s.is_live).length} en vivo
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className={`${buttonBaseClasses} ${buttonVariants.danger}`}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl p-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Control Panel
          </button>
          <button
            onClick={() => setActiveTab('streamers')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'streamers' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Streamers ({streamers.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'system' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Sistema
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'logs' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            System Logs
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Auto-Update Status */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    intelligentAutoUpdateStatus?.enabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-montserrat">Auto-Update Inteligente</h3>
                    <p className="text-gray-400 text-sm font-montserrat">
                      Estado: {intelligentAutoUpdateStatus?.enabled ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {intelligentAutoUpdateStatus?.enabled ? (
                    <button
                      onClick={disableIntelligentAutoUpdate}
                      disabled={intelligentAutoUpdateLoading}
                      className={`${buttonBaseClasses} ${buttonVariants.danger}`}
                    >
                      {intelligentAutoUpdateLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )}
                      Deshabilitar
                    </button>
                  ) : (
                    <button
                      onClick={enableIntelligentAutoUpdate}
                      disabled={intelligentAutoUpdateLoading}
                      className={`${buttonBaseClasses} ${buttonVariants.success}`}
                    >
                      {intelligentAutoUpdateLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Habilitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Marvel Rivals API */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white font-montserrat mb-4">Marvel Rivals API</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleUpdateUIDs}
                  disabled={updatingUIDs || updatingAPI || updatingPlayers}
                  className={`${buttonBaseClasses} ${buttonVariants.primary} h-12 relative`}
                >
                  {updatingUIDs ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>🆔</>
                  )}
                  <span>Actualizar UIDs</span>
                  {stepLogs.uids && stepLogs.uids.length > 0 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStepLogsModal('uids');
                      }}
                      className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-blue-400 cursor-pointer"
                    >
                      📋
                    </div>
                  )}
                </button>
                
                <button
                  onClick={handleUpdateAPI}
                  disabled={updatingAPI || updatingUIDs || updatingPlayers}
                  className={`${buttonBaseClasses} ${buttonVariants.warning} h-12 relative`}
                >
                  {updatingAPI ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>🔄</>
                  )}
                  <span>Actualizar API</span>
                  {stepLogs.api && stepLogs.api.length > 0 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStepLogsModal('api');
                      }}
                      className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-orange-400 cursor-pointer"
                    >
                      📋
                    </div>
                  )}
                </button>
                
                <button
                  onClick={handleUpdatePlayers}
                  disabled={updatingPlayers || updatingUIDs || updatingAPI}
                  className={`${buttonBaseClasses} ${buttonVariants.success} h-12 relative`}
                >
                  {updatingPlayers ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>📊</>
                  )}
                  <span>Actualizar Jugadores</span>
                  {stepLogs.players && stepLogs.players.length > 0 && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStepLogsModal('players');
                      }}
                      className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hover:bg-green-400 cursor-pointer"
                    >
                      📋
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <button
                onClick={async () => {
                  if (loadingApplications) return;
                  await fetchApplications();
                  setShowApplicationsModal(true);
                }}
                disabled={loadingApplications}
                className={`${buttonBaseClasses} ${buttonVariants.primary} h-20 flex-col relative`}
              >
                <Clock className="w-6 h-6 mb-1" />
                <span className="text-sm">Solicitudes</span>
                {applications.length > 0 && !loadingApplications && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {applications.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleLiveStatusUpdate}
                disabled={updatingLiveStatus}
                className={`${buttonBaseClasses} ${buttonVariants.danger} h-20 flex-col`}
              >
                {updatingLiveStatus ? (
                  <RefreshCw className="w-6 h-6 mb-1 animate-spin" />
                ) : (
                  <Radio className="w-6 h-6 mb-1" />
                )}
                <span className="text-sm">Actualizar Live</span>
              </button>

              <button
                onClick={async () => {
                  await loadPendingClips();
                  setShowClipsModal(true);
                }}
                disabled={loadingPendingClips}
                className={`${buttonBaseClasses} ${buttonVariants.secondary} h-20 flex-col relative`}
              >
                <span className="text-2xl mb-1">🎬</span>
                <span className="text-sm">Clips</span>
                {pendingClips.length > 0 && !loadingPendingClips && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {pendingClips.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`${buttonBaseClasses} ${buttonVariants.warning} h-20 flex-col`}
              >
                <Activity className="w-6 h-6 mb-1" />
                <span className="text-sm">System Logs</span>
              </button>

              <button
                onClick={() => setShowReportingDashboard(true)}
                className={`${buttonBaseClasses} ${buttonVariants.ghost} h-20 flex-col`}
              >
                <BarChart3 className="w-6 h-6 mb-1" />
                <span className="text-sm">Reporting</span>
              </button>
            </div>

            {/* System Maintenance */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white font-montserrat mb-4">Mantenimiento del Sistema</h3>
              
              {/* Emergency cancellation status */}
              {intelligentAutoUpdateStatus?.emergencyCancellation && (
                <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-red-300 font-medium">🚨 CANCELACIÓN DE EMERGENCIA ACTIVA</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('¿Permitir que las operaciones se reanuden? Esto desactivará la cancelación de emergencia.')) {
                          try {
                            const response = await fetch('/api/admin/emergency/clear-cancellation', {
                              method: 'POST',
                              credentials: 'include'
                            });
                            
                            if (response.ok) {
                              alert('✅ Cancelación de emergencia desactivada - las operaciones pueden reanudarse');
                              await fetchIntelligentAutoUpdateStatus();
                            } else {
                              alert('❌ Error desactivando cancelación de emergencia');
                            }
                          } catch (error) {
                            alert('❌ Error de conexión');
                          }
                        }
                      }}
                      className={`${buttonBaseClasses} ${buttonVariants.success} text-sm`}
                    >
                      ✅ Reanudar Operaciones
                    </button>
                  </div>
                  <p className="text-red-300 text-sm mt-2">
                    Las operaciones automáticas están bloqueadas. Haz click en "Reanudar" para permitir que continúen.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={clearConsoleLogs}
                  disabled={isLoadingAction}
                  className={`${buttonBaseClasses} ${buttonVariants.secondary}`}
                >
                  {isLoadingAction ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Clear Console Logs
                </button>
                
                <button
                  onClick={clearReportingHistory}
                  disabled={isLoadingAction}
                  className={`${buttonBaseClasses} ${buttonVariants.danger}`}
                >
                  {isLoadingAction ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  Clear Reporting History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Streamers Tab */}
        {activeTab === 'streamers' && (
          <div className="space-y-6">
            {/* Streamers Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white font-montserrat">Gestión de Streamers</h3>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setShowAddStreamerModal(true)}
                    className={`${buttonBaseClasses} ${buttonVariants.success}`}
                  >
                    <Plus className="w-4 h-4" />
                    Añadir
                  </button>
                  <button
                    onClick={handleBulkImportTwitchAvatars}
                    disabled={bulkImportingAvatars}
                    className={`${buttonBaseClasses} ${buttonVariants.warning}`}
                  >
                    {bulkImportingAvatars ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>📸</span>
                    )}
                    Avatares Bulk
                  </button>
                  <button
                    onClick={handleExportStreamers}
                    disabled={exporting}
                    className={`${buttonBaseClasses} ${buttonVariants.primary}`}
                  >
                    {exporting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Exportar
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className={`${buttonBaseClasses} ${buttonVariants.secondary}`}
                  >
                    <Upload className="w-4 h-4" />
                    Importar
                  </button>
                </div>
              </div>
            </div>

            {/* Streamers List */}
            <div className="space-y-4">
              {streamers.map((streamer) => {
                const winRate = streamer.games_played > 0 ? ((streamer.wins / streamer.games_played) * 100).toFixed(1) : "0.0";
                const rankScore = streamer.rank_score || 0;
                
                return (
                  <div key={streamer.id} className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={streamer.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face"} 
                          alt={streamer.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="text-lg font-bold text-white font-montserrat">{streamer.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-400">
                            <span>ID: {streamer.id}</span>
                            {streamer.marvel_rivals_uid ? (
                              <span 
                                className="text-emerald-400 font-mono cursor-pointer hover:bg-emerald-900/20 px-2 py-1 rounded transition-colors"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const element = e.currentTarget as HTMLElement;
                                  if (!element || !streamer.marvel_rivals_uid) return;
                                  
                                  try {
                                    await navigator.clipboard.writeText(streamer.marvel_rivals_uid);
                                    // Store original text before any async operations
                                    const originalText = element.textContent;
                                    if (originalText) {
                                      element.textContent = '✅ Copiado!';
                                      setTimeout(() => {
                                        // Check if element still exists and has the copied text
                                        if (element && element.textContent === '✅ Copiado!') {
                                          element.textContent = originalText;
                                        }
                                      }, 1500);
                                    }
                                  } catch (error) {
                                    console.error('Error copying UID:', error);
                                    alert('Error copiando UID al portapapeles');
                                  }
                                }}
                                title="Click para copiar UID completo"
                              >
                                🆔 {streamer.marvel_rivals_uid}
                              </span>
                            ) : (
                              <span className="text-red-400">❌ Sin UID</span>
                            )}
                            {rankScore > 0 && (
                              <span className="text-blue-400">🎯 {rankScore.toLocaleString()} RS</span>
                            )}
                            <span className="text-green-400">⚡ {winRate}% WR</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdate(streamer.id)}
                          disabled={updatingId === streamer.id}
                          className={`${buttonBaseClasses} ${buttonVariants.primary}`}
                        >
                          {updatingId === streamer.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Actualizar
                        </button>
                        <button
                          onClick={() => handleDeleteStreamer(streamer.id, streamer.name)}
                          disabled={deletingId === streamer.id}
                          className={`${buttonBaseClasses} ${buttonVariants.danger}`}
                        >
                          {deletingId === streamer.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Compact Streamer Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">IGN Marvel Rivals</label>
                        <input
                          type="text"
                          value={updateData[streamer.id]?.ingame_username || ""}
                          onChange={(e) => handleInputChange(streamer.id, 'ingame_username', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Twitch</label>
                        <input
                          type="text"
                          value={updateData[streamer.id]?.twitch_username || ""}
                          onChange={(e) => handleInputChange(streamer.id, 'twitch_username', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Rango</label>
                        <input
                          type="text"
                          value={updateData[streamer.id]?.rank || ""}
                          onChange={(e) => handleInputChange(streamer.id, 'rank', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Puntos RS</label>
                        <input
                          type="number"
                          value={updateData[streamer.id]?.rank_score || 0}
                          onChange={(e) => handleInputChange(streamer.id, 'rank_score', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Individual Actions */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleIndividualUID(streamer.id, streamer.name)}
                        disabled={individualStepStates[streamer.id]?.updatingUID}
                        className={`${buttonBaseClasses} ${buttonVariants.ghost} text-xs px-2 py-1`}
                      >
                        {individualStepStates[streamer.id]?.updatingUID ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          '🆔'
                        )}
                        UID
                      </button>
                      <button
                        onClick={() => handleIndividualAPI(streamer.id, streamer.name)}
                        disabled={individualStepStates[streamer.id]?.updatingAPI}
                        className={`${buttonBaseClasses} ${buttonVariants.ghost} text-xs px-2 py-1`}
                      >
                        {individualStepStates[streamer.id]?.updatingAPI ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          '🔄'
                        )}
                        API
                      </button>
                      <button
                        onClick={() => handleIndividualPlayer(streamer.id, streamer.name)}
                        disabled={individualStepStates[streamer.id]?.updatingPlayer}
                        className={`${buttonBaseClasses} ${buttonVariants.ghost} text-xs px-2 py-1`}
                      >
                        {individualStepStates[streamer.id]?.updatingPlayer ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          '📊'
                        )}
                        Stats
                      </button>
                      {updateData[streamer.id]?.twitch_username && (
                        <button
                          onClick={() => handleImportTwitchAvatar(streamer.id)}
                          disabled={importingTwitchAvatars[streamer.id]}
                          className={`${buttonBaseClasses} ${buttonVariants.ghost} text-xs px-2 py-1`}
                        >
                          {importingTwitchAvatars[streamer.id] ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            '📸'
                          )}
                          Avatar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Season Config */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white font-montserrat mb-4">Temporada Marvel Rivals</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Número de Temporada</label>
                  <input
                    type="text"
                    value={newSeason}
                    onChange={(e) => setNewSeason(e.target.value)}
                    placeholder="ej: 3.5, 4.0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-400 mt-1">Actual: {currentSeason}</p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={updateSeasonConfig}
                    disabled={updatingSeason || newSeason.trim() === currentSeason}
                    className={`${buttonBaseClasses} ${buttonVariants.primary}`}
                  >
                    {updatingSeason ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Actualizar
                  </button>
                </div>
              </div>
            </div>

            {/* Competition Date Config */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white font-montserrat mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Fecha de Inicio de Competición (Ultra Sensible)
              </h3>
              
              {competitionStartDate && (
                <div className="bg-green-900/20 border border-green-500/40 rounded-lg p-3 mb-4">
                  <p className="text-green-400 text-sm font-montserrat">
                    <strong>📅 Configurado:</strong> {formatToMexicoCityTime(competitionStartDate, 'datetime')} (CDMX)
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {competitionStartDate ? 'Nueva Fecha' : 'Fecha de Inicio'}
                  </label>
                  <input
                    type="datetime-local"
                    value={newCompetitionStartDate}
                    onChange={(e) => setNewCompetitionStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-sm text-red-400 mt-1">⚠️ Hora de Ciudad de México (GMT-6)</p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={updateCompetitionConfig}
                    disabled={updatingCompetitionDate || !newCompetitionStartDate.trim()}
                    className={`${buttonBaseClasses} ${competitionStartDate ? buttonVariants.danger : buttonVariants.warning}`}
                  >
                    {updatingCompetitionDate ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Calendar className="w-4 h-4" />
                    )}
                    {competitionStartDate ? 'CAMBIAR' : 'Establecer'}
                  </button>
                </div>
              </div>

              {competitionStartDate && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mt-4">
                  <p className="text-red-300 text-sm font-montserrat">
                    <strong>⚠️ ADVERTENCIA:</strong> Cambiar la fecha reiniciará TODAS las estadísticas. Esta acción es IRREVERSIBLE.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <LogsViewer />
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* Emergency Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white font-montserrat mb-4">Acciones de Emergencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleCancelAllOperations}
                  className={`${buttonBaseClasses} ${buttonVariants.danger} h-12`}
                >
                  <span>🛑</span>
                  Cancelar Todas las Operaciones
                </button>
                
                <button
                  onClick={async () => {
                    if (confirm('🧹 ¿Limpiar estadísticas huérfanas?\n\nEsto eliminará estadísticas de streamers que ya no existen.')) {
                      try {
                        const response = await fetch('/api/admin/cleanup-orphaned-stats', {
                          method: 'POST',
                          credentials: 'include'
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                          alert(`✅ Limpieza completada:\n• ${data.cleaned_hero_stats} estadísticas de héroes eliminadas\n• ${data.cleaned_role_stats} estadísticas de roles eliminadas`);
                          window.location.reload();
                        } else {
                          alert(`❌ Error: ${data.error}`);
                        }
                      } catch (error) {
                        alert('❌ Error de conexión');
                      }
                    }
                  }}
                  className={`${buttonBaseClasses} ${buttonVariants.secondary} h-12`}
                >
                  <span>🧹</span>
                  Limpiar Stats Huérfanas
                </button>
              </div>
            </div>

            {/* Season Reset */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white font-montserrat mb-4">Reset de Temporada</h3>
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-300 text-sm font-montserrat">
                  <strong>⚠️ ADVERTENCIA:</strong> Esto eliminará TODAS las estadísticas de TODOS los streamers pero conservará sus perfiles y redes sociales.
                </p>
              </div>
              <button
                onClick={async () => {
                  const confirmMessage = `🎮 ¿RESETEAR TEMPORADA COMPLETA?\n\n⚠️ IRREVERSIBLE - Eliminará:\n• Todos los rangos\n• Todas las estadísticas\n• Todo el historial\n\n✅ Conservará:\n• Streamers y redes sociales\n• Avatares\n\n¿Continuar?`;
                  
                  if (confirm(confirmMessage) && confirm('🚨 ÚLTIMA CONFIRMACIÓN 🚨\n\n¿Proceder con el RESET TOTAL?')) {
                    try {
                      const response = await fetch('/api/admin/season-reset', {
                        method: 'POST',
                        credentials: 'include'
                      });
                      
                      const data = await response.json();
                      
                      if (response.ok) {
                        alert(`✅ RESET COMPLETADO:\n\n• ${data.summary.streamers_reset} streamers reseteados\n• ${data.summary.hero_stats_deleted} stats de héroes eliminadas\n• ${data.summary.role_stats_deleted} stats de roles eliminadas\n\n🎮 ¡Listos para nueva temporada!`);
                        setTimeout(() => window.location.reload(), 2000);
                      } else {
                        alert(`❌ Error: ${data.error}`);
                      }
                    } catch (error) {
                      alert('❌ Error de conexión');
                    }
                  }
                }}
                className={`${buttonBaseClasses} ${buttonVariants.danger} h-12`}
              >
                <span>🔄</span>
                Reset Temporada Completa
              </button>
            </div>
          </div>
        )}

        {/* Add Streamer Modal */}
        {showAddStreamerModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white font-montserrat">Añadir Streamer</h2>
                <button
                  onClick={() => setShowAddStreamerModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddStreamer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nombre del Streamer *</label>
                  <input
                    type="text"
                    value={newStreamerData.name}
                    onChange={(e) => setNewStreamerData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">IGN Marvel Rivals</label>
                    <input
                      type="text"
                      value={newStreamerData.ingame_username}
                      onChange={(e) => setNewStreamerData(prev => ({ ...prev, ingame_username: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Twitch</label>
                    <input
                      type="text"
                      value={newStreamerData.twitch_username}
                      onChange={(e) => setNewStreamerData(prev => ({ ...prev, twitch_username: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddStreamerModal(false)}
                    className={`${buttonBaseClasses} ${buttonVariants.secondary}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addingStreamer}
                    className={`${buttonBaseClasses} ${buttonVariants.success}`}
                  >
                    {addingStreamer ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Añadir Streamer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Streamers Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white font-montserrat">Importar Streamers</h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleImportStreamers} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Modo de Importación</label>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="create_only">Solo crear nuevos</option>
                    <option value="update_existing">Solo actualizar existentes</option>
                    <option value="create_and_update">Crear y actualizar</option>
                    <option value="delete_and_create">🗑️ BORRAR TODOS y crear (DESTRUCTIVO)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Datos JSON</label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder='{"streamers": [{"name": "Streamer1", "ingame_username": "IGN1", ...}]}'
                    className="w-full h-64 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className={`${buttonBaseClasses} ${buttonVariants.secondary}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={importing}
                    className={`${buttonBaseClasses} ${
                      importMode === 'delete_and_create' ? buttonVariants.danger : buttonVariants.primary
                    }`}
                  >
                    {importing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {importMode === 'delete_and_create' ? 'Borrar y Crear' : 'Importar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Solicitudes Pendientes Modal */}
        {showApplicationsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white font-montserrat">Solicitudes Pendientes ({applications.length})</h2>
                <button
                  onClick={() => setShowApplicationsModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">✅</span>
                    <p className="text-white font-montserrat text-lg">¡No hay solicitudes pendientes!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {applications.map((application) => (
                      <div key={application.id} className="bg-gray-700 rounded-lg p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">{application.name}</h3>
                            <div className="space-y-2 text-sm text-gray-300">
                              <p><strong>IGN:</strong> {application.ingame_username}</p>
                              <p><strong>Twitch:</strong> {application.twitch_username || 'N/A'}</p>
                              <p><strong>Enviado:</strong> {formatToMexicoCityTime(application.created_at, 'datetime')}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => approveApplication(application.id, application.name)}
                              disabled={approvingId === application.id}
                              className={`${buttonBaseClasses} ${buttonVariants.success} flex-1`}
                            >
                              {approvingId === application.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <span>✅</span>
                              )}
                              Aprobar
                            </button>
                            <button
                              onClick={() => rejectApplication(application.id, application.name)}
                              disabled={rejectingId === application.id}
                              className={`${buttonBaseClasses} ${buttonVariants.danger} flex-1`}
                            >
                              {rejectingId === application.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <span>❌</span>
                              )}
                              Rechazar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clips Moderation Modal */}
        {showClipsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white font-montserrat">Clips Pendientes ({pendingClips.length})</h2>
                <button
                  onClick={() => setShowClipsModal(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6">
                {pendingClips.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl mb-4 block">🎉</span>
                    <p className="text-white font-montserrat text-lg">¡No hay clips pendientes!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingClips.map((clip) => (
                      <div key={clip.id} className="bg-gray-700 rounded-lg p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                              {clip.thumbnail_url ? (
                                <img src={clip.thumbnail_url} alt={clip.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="w-16 h-16 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <a href={clip.embed_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-sm">
                              🔗 Ver en Twitch
                            </a>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">{clip.title}</h3>
                            <div className="space-y-2 text-sm text-gray-300 mb-4">
                              <p><strong>Broadcaster:</strong> {clip.broadcaster_name}</p>
                              <p><strong>Categoría:</strong> {clip.category}</p>
                              <p><strong>Vistas:</strong> {clip.view_count.toLocaleString()}</p>
                              <p><strong>Enviado:</strong> {formatToMexicoCityTime(clip.created_at, 'datetime')}</p>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => moderateClip(clip.id, 'approve')}
                                className={`${buttonBaseClasses} ${buttonVariants.success} flex-1`}
                              >
                                <span>✅</span>
                                Aprobar
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Motivo del rechazo (opcional):');
                                  if (reason !== null) moderateClip(clip.id, 'reject', reason);
                                }}
                                className={`${buttonBaseClasses} ${buttonVariants.danger} flex-1`}
                              >
                                <span>❌</span>
                                Rechazar
                              </button>
                            </div>
                            <button
                              onClick={() => deleteClip(clip.id, clip.title, clip.broadcaster_name)}
                              className={`${buttonBaseClasses} ${buttonVariants.secondary} w-full mt-2`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step Logs Modal */}
        {showStepLogsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white font-montserrat">
                  Logs de {showStepLogsModal === 'uids' ? 'UIDs' : showStepLogsModal === 'api' ? 'API' : 'Jugadores'}
                </h2>
                <button
                  onClick={() => setShowStepLogsModal(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="bg-black/30 border border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {stepLogs[showStepLogsModal]?.join('\n') || 'No hay logs disponibles'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Individual Step Logs Modal */}
        {showIndividualLogsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white font-montserrat">
                  Logs Individual
                </h2>
                <button
                  onClick={() => setShowIndividualLogsModal(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="bg-black/30 border border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {individualStepLogs[showIndividualLogsModal]?.join('\n') || 'No hay logs disponibles'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Reporting Dashboard Modal */}
        <ReportingDashboard 
          isOpen={showReportingDashboard}
          onClose={() => setShowReportingDashboard(false)}
        />

      </div>
    </div>
  );
}
