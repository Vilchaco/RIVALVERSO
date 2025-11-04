import { useState, useEffect } from "react";
import { ClipWithStatsType } from "@/shared/clip-types";
import { ChevronUp, ChevronDown, Eye, User, Plus, Filter } from "lucide-react";
import ClipPlayer from "./ClipPlayer";

interface ClipsGalleryProps {
  initialClips?: ClipWithStatsType[];
  showSubmitForm?: boolean;
  streamerId?: number;
}

export default function ClipsGallery({ initialClips = [], showSubmitForm = true, streamerId }: ClipsGalleryProps) {
  const [clips, setClips] = useState<ClipWithStatsType[]>(initialClips);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    order_by: 'votes' as 'newest' | 'votes' | 'views',
    search: ''
  });
  const [expandedClip, setExpandedClip] = useState<number | null>(null);
  const [submissionData, setSubmissionData] = useState({
    clip_url: '',
    category: 'general',
    description: '',
    submitted_by: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar clips
  const loadClips = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        order_by: filters.order_by,
        category: filters.category,
        limit: '20'
      });

      if (streamerId) {
        queryParams.append('streamer_id', streamerId.toString());
      }

      const response = await fetch(`/api/clips?${queryParams}`);
      if (!response.ok) throw new Error('Error cargando clips');
      
      const data = await response.json();
      setClips(data.clips || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialClips.length === 0 || streamerId) {
      loadClips();
    }
  }, [filters.order_by, filters.category, streamerId]);

  // Enviar voto
  const handleVote = async (clipId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const response = await fetch(`/api/clips/${clipId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote_type: voteType })
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el clip en el estado
        setClips(prevClips => 
          prevClips.map(clip => 
            clip.id === clipId 
              ? {
                  ...clip,
                  stats: {
                    ...clip.stats!,
                    vote_score: data.new_vote_score || clip.stats!.vote_score
                  },
                  user_vote: data.user_vote
                }
              : clip
          )
        );
      } else {
        alert(data.message || 'Error al votar');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error de conexión al votar');
    }
  };

  // Enviar nuevo clip
  const handleSubmitClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionData.clip_url.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/clips/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('¡Clip enviado! Será revisado por los administradores antes de aparecer en la galería.');
        setShowSubmitModal(false);
        setSubmissionData({
          clip_url: '',
          category: 'general',
          description: '',
          submitted_by: ''
        });
      } else {
        alert(data.message || 'Error enviando clip');
      }
    } catch (error) {
      console.error('Error submitting clip:', error);
      alert('Error de conexión al enviar clip');
    } finally {
      setSubmitting(false);
    }
  };

  

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-rivalverso-green font-bebas">CLIPS DESTACADOS</h2>
          <p className="text-gray-300 font-montserrat">Los mejores momentos del SoloQ Challenge</p>
        </div>
        
        {showSubmitForm && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 bg-rivalverso-green hover:bg-rivalverso-green-light text-black hover:text-black font-bold py-3 px-6 rounded-lg font-montserrat transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Enviar Clip
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-montserrat focus:outline-none focus:border-rivalverso-purple-light"
          >
            <option value="all">Todas las categorías</option>
            <option value="general">General</option>
            <option value="epic_play">Jugada Épica</option>
            <option value="funny">Divertido</option>
            <option value="clutch">Clutch</option>
            <option value="fail">Fail</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm font-montserrat">Ordenar:</span>
          <select
            value={filters.order_by}
            onChange={(e) => setFilters(prev => ({ ...prev, order_by: e.target.value as any }))}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white font-montserrat focus:outline-none focus:border-rivalverso-purple-light"
          >
            <option value="votes">Más votados</option>
            <option value="newest">Más recientes</option>
            <option value="views">Más vistos</option>
          </select>
        </div>
      </div>

      {/* Lista de clips */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rivalverso-purple-light"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 font-montserrat">{error}</p>
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 font-montserrat">No hay clips disponibles todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <div key={clip.id} className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden hover:border-rivalverso-purple-light/50 transition-colors">
              {/* Reproductor de clip mejorado */}
              <ClipPlayer
                clip={{
                  id: clip.id,
                  title: clip.title,
                  embed_url: clip.embed_url,
                  thumbnail_url: clip.thumbnail_url || undefined,
                  duration: clip.duration,
                  broadcaster_name: clip.broadcaster_name
                }}
                autoplay={expandedClip === clip.id}
                onClose={() => setExpandedClip(null)}
              />

              {/* Información del clip */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white font-montserrat mb-2 line-clamp-2">
                      {clip.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 font-montserrat">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        {clip.broadcaster_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-gray-400" />
                        {clip.view_count.toLocaleString()}
                      </div>
                    </div>

                    {clip.streamer_info && (
                      <div className="mt-2 flex items-center gap-2">
                        <img 
                          src={clip.streamer_info.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop&crop=face"} 
                          alt={clip.streamer_info.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-rivalverso-green text-sm font-montserrat font-semibold">
                          {clip.streamer_info.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Votación */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleVote(clip.id, 'upvote')}
                      className={`p-2 rounded-lg transition-colors ${
                        clip.user_vote === 'upvote' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-800 text-gray-400 hover:bg-green-600 hover:text-white'
                      }`}
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    
                    <span className={`font-bold text-lg font-montserrat ${
                      (clip.stats?.vote_score || 0) > 0 ? 'text-green-400' :
                      (clip.stats?.vote_score || 0) < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {clip.stats?.vote_score || 0}
                    </span>
                    
                    <button
                      onClick={() => handleVote(clip.id, 'downvote')}
                      className={`p-2 rounded-lg transition-colors ${
                        clip.user_vote === 'downvote' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-800 text-gray-400 hover:bg-red-600 hover:text-white'
                      }`}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {clip.description && (
                  <p className="text-gray-300 text-sm font-montserrat line-clamp-2">
                    {clip.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de envío de clip */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white font-montserrat mb-4">Enviar Clip</h3>
            
            <form onSubmit={handleSubmitClip} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                  URL del Clip de Twitch *
                </label>
                <input
                  type="url"
                  value={submissionData.clip_url}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, clip_url: e.target.value }))}
                  placeholder="https://clips.twitch.tv/..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-rivalverso-purple-light"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                  Categoría
                </label>
                <select
                  value={submissionData.category}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-rivalverso-purple-light"
                >
                  <option value="general">General</option>
                  <option value="epic_play">Jugada Épica</option>
                  <option value="funny">Divertido</option>
                  <option value="clutch">Clutch</option>
                  <option value="fail">Fail</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                  Descripción (opcional)
                </label>
                <textarea
                  value={submissionData.description}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe por qué este clip es increíble..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-rivalverso-purple-light resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                  Tu nombre (opcional)
                </label>
                <input
                  type="text"
                  value={submissionData.submitted_by}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, submitted_by: e.target.value }))}
                  placeholder="Tu nombre o username"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-rivalverso-purple-light"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg font-montserrat transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rivalverso-green hover:bg-rivalverso-green-light text-black hover:text-black font-bold py-3 px-4 rounded-lg font-montserrat transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
