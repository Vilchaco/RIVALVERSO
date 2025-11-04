import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useStreamerDetails } from "@/react-app/hooks/useStreamerDetails";
import { useStreamerComparativeStats } from "@/react-app/hooks/useStreamerComparativeStats";
import { getHeroImageUrl, getHeroSignatureImageUrl } from "@/react-app/utils/heroImages";
import { Twitch, Youtube, Twitter, Instagram, CircleDot, X, Music, Trophy, Target, User, Calendar, Gamepad2, BarChart3, Swords, Heart, Clock, Flame, Star, ArrowLeft } from "lucide-react";
import ClipsGallery from "@/react-app/components/ClipsGallery";
import ComparativeStatsSection from "@/react-app/components/ComparativeStatsSection";
import MatchHistory from "@/react-app/components/MatchHistory";
import { getMexicoCityNow, formatToMexicoCityTime } from "@/react-app/utils/timezone";

export default function StreamerProfilePage() {
  const { streamerName } = useParams<{ streamerName: string }>();
  const navigate = useNavigate();
  
  // Decode the streamer name from URL
  const decodedStreamerName = streamerName ? decodeURIComponent(streamerName) : null;

  const { data: details, loading: detailsLoading, error: detailsError } = useStreamerDetails(decodedStreamerName);
  const { data: comparativeStats, loading: comparativeLoading, error: comparativeError } = useStreamerComparativeStats(decodedStreamerName);
  
  const streamer = details?.streamer;

  const [winRate, setWinRate] = useState("0.0");
  const [lastMatchTime, setLastMatchTime] = useState<{text: string; icon: any} | null>(null);

  useEffect(() => {
    if (streamer) {
      setWinRate(streamer.games_played > 0 ? ((streamer.wins / streamer.games_played) * 100).toFixed(1) : "0.0");
    }
  }, [streamer]);

  // Calculate last match time from match history
  useEffect(() => {
    if (details && details.match_history && details.match_history.length > 0) {
      const lastMatch = details.match_history[0]; // First match is most recent
      try {
        const matchDate = new Date(lastMatch.timestamp);
        const nowMexicoCity = getMexicoCityNow();
        const diffMs = nowMexicoCity.getTime() - matchDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let timeText = '';
        let iconComponent = Gamepad2;

        if (diffMins < 60) {
          timeText = `Hace ${diffMins}m`;
          iconComponent = Gamepad2;
        } else if (diffHours < 24) {
          timeText = `Hace ${diffHours}h`;
          iconComponent = Gamepad2;
        } else if (diffDays < 7) {
          timeText = `Hace ${diffDays}d`;
          iconComponent = Calendar;
        } else {
          timeText = formatToMexicoCityTime(matchDate, 'date');
          iconComponent = Calendar;
        }

        setLastMatchTime({ text: timeText, icon: iconComponent });
      } catch (error) {
        console.error('Error parsing last match date:', error);
        setLastMatchTime(null);
      }
    } else if (streamer) {
      // Fallback to updated_at if no match history
      const lastUpdated = new Date(streamer.updated_at);
      const nowMexicoCity = getMexicoCityNow();
      const daysSinceUpdate = Math.floor((nowMexicoCity.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      const fallbackText = daysSinceUpdate < 1 ? 'Hoy' : `Hace ${daysSinceUpdate} día${daysSinceUpdate !== 1 ? 's' : ''}`;
      setLastMatchTime({ text: fallbackText, icon: Calendar });
    }
  }, [details, streamer]);

  // DEBUG: Log match history information
  useEffect(() => {
    if (details) {
      console.log('🔍 DEBUG Match History:', {
        hasDetails: !!details,
        hasMatchHistory: !!details?.match_history,
        matchHistoryLength: details?.match_history?.length || 0,
        matchHistory: details?.match_history,
        streamerName: details?.streamer?.name
      });
    }
  }, [details]);

  // Funciones auxiliares para colores y URLs de imágenes
  const getRankColor = (rank: string | null) => {
    if (!rank) return "text-gray-400";
    if (rank.includes("One Above All") || rank.includes("Uno Sobre Todos")) return "text-red-500";
    if (rank.includes("Eternity") || rank.includes("Eternidad")) return "text-pink-400";
    if (rank.includes("Celestial")) return "text-orange-400";
    if (rank.includes("Grandmaster") || rank.includes("Gran Maestro")) return "text-rivalverso-purple-light";
    if (rank.includes("Diamond") || rank.includes("Diamante")) return "text-cyan-400";
    if (rank.includes("Platinum") || rank.includes("Platino")) return "text-emerald-400"; 
    if (rank.includes("Gold") || rank.includes("Oro")) return "text-rivalverso-green";
    if (rank.includes("Silver") || rank.includes("Plata")) return "text-gray-300";
    if (rank.includes("Bronze") || rank.includes("Bronce")) return "text-orange-500";
    return "text-gray-400";
  };

  const getRankGradient = (rank: string | null) => {
    if (!rank) return "from-gray-600 to-gray-700";
    if (rank.includes("One Above All") || rank.includes("Uno Sobre Todos")) return "from-red-500 to-red-600";
    if (rank.includes("Eternity") || rank.includes("Eternidad")) return "from-pink-500 to-pink-600";
    if (rank.includes("Celestial")) return "from-orange-500 to-orange-600";
    if (rank.includes("Grandmaster") || rank.includes("Gran Maestro")) return "from-rivalverso-purple-light to-rivalverso-purple-dark";
    if (rank.includes("Diamond") || rank.includes("Diamante")) return "from-cyan-500 to-cyan-600";
    if (rank.includes("Platinum") || rank.includes("Platino")) return "from-emerald-500 to-emerald-600";
    if (rank.includes("Gold") || rank.includes("Oro")) return "from-rivalverso-green to-rivalverso-green-light";
    if (rank.includes("Silver") || rank.includes("Plata")) return "from-gray-400 to-gray-500";
    if (rank.includes("Bronze") || rank.includes("Bronce")) return "from-orange-500 to-orange-600";
    return "from-gray-600 to-gray-700";
  };

  const getRankImageUrl = (rank: string | null) => {
    if (!rank) return null;
    const lowerRank = rank.toLowerCase();
    if (lowerRank.includes("one above all") || lowerRank.includes("uno sobre todos")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/9-One-Above-All-Rank.webp";
    }
    if (lowerRank.includes("eternity") || lowerRank.includes("eternidad")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/8-Eternity-Rank.webp";
    }
    if (lowerRank.includes("celestial")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/7-Celestial-Rank.webp";
    }
    if (lowerRank.includes("grandmaster") || lowerRank.includes("gran maestro")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/6-Grandmaster-Rank.webp";
    }
    if (lowerRank.includes("diamond") || lowerRank.includes("diamante")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/5-Diamond-Rank.webp";
    }
    if (lowerRank.includes("platinum") || lowerRank.includes("platino")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/4-Platinum-Rank.webp";
    }
    if (lowerRank.includes("gold") || lowerRank.includes("oro")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/3-Gold-Rank.webp";
    }
    if (lowerRank.includes("silver") || lowerRank.includes("plata")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/2-Silver-Rank.png";
    }
    if (lowerRank.includes("bronze") || lowerRank.includes("bronce")) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/1-Bronze-Rank.webp";
    }
    return null;
  };

  const getRoleImageUrl = (roleName: string) => {
    const lowerRole = roleName.toLowerCase();
    if (lowerRole.includes('vanguard') || lowerRole.includes('vanguardia')) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Vanguard.png";
    }
    if (lowerRole.includes('duelist') || lowerRole.includes('duelista')) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Duelist.png";
    }
    if (lowerRole.includes('strategist') || lowerRole.includes('estratega')) {
      return "https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Strategist.png";
    }
    return null;
  };

  if (detailsLoading) {
    return (
      <div className="min-h-screen bg-rivalverso-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rivalverso-purple-light mx-auto mb-4"></div>
          <p className="text-white text-lg font-montserrat">Cargando perfil del streamer...</p>
        </div>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className="min-h-screen bg-rivalverso-black flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-montserrat">Error: {detailsError}</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 px-6 py-3 bg-rivalverso-purple-light hover:bg-rivalverso-purple-dark text-white rounded-lg font-montserrat transition-colors"
          >
            Volver al Ranking
          </button>
        </div>
      </div>
    );
  }

  if (!streamer) {
    return (
      <div className="min-h-screen bg-rivalverso-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg font-montserrat">Streamer no encontrado.</p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-4 px-6 py-3 bg-rivalverso-purple-light hover:bg-rivalverso-purple-dark text-white rounded-lg font-montserrat transition-colors"
          >
            Volver al Ranking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rivalverso-black">
      {/* RIVALVERSO Background with overlay */}
      <div className="absolute inset-0">
        <img 
          src="https://mocha-cdn.com/0199440f-b65f-7cab-a552-eca69173e4c7/Back-rivals.png" 
          alt="RIVALVERSO Background"
          className="w-full h-full object-cover"
          style={{
            objectPosition: 'center 50%',
            filter: 'brightness(0.2) contrast(1.2) saturate(1.1)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-rivalverso-black/70 via-rivalverso-black/50 to-rivalverso-black/80"></div>
        <div className={`absolute inset-0 bg-gradient-to-r ${getRankGradient(streamer.rank)} opacity-10`}></div>
      </div>

      {/* Navigation Header */}
      <div className="relative z-10 pt-8 pb-4">
        <div className="container mx-auto px-4 max-w-7xl">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors p-3 hover:bg-white/5 rounded-xl backdrop-blur-sm border border-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-montserrat font-semibold">Volver al Ranking</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-7xl pb-20">
        
        {/* Hero Section */}
        <section className="mb-12">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-12">
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64">
                <div className={`absolute inset-0 bg-gradient-to-br ${getRankGradient(streamer.rank)} rounded-full blur-2xl opacity-50 scale-110`} />
                <img 
                  src={streamer.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face"} 
                  alt={streamer.name}
                  className="relative w-full h-full rounded-full object-cover border-4 border-white/20 shadow-2xl backdrop-blur-sm"
                />

                {/* Live Indicator */}
                {streamer.is_live && (
                  <div className="absolute -bottom-2 -right-2 flex items-center gap-2 bg-red-600 text-white text-sm px-4 py-2 rounded-full animate-pulse font-montserrat font-bold shadow-lg">
                    <CircleDot className="w-4 h-4" />
                    EN VIVO
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 text-center lg:text-left">
              {/* Name and Title */}
              <div className="mb-6">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-montserrat mb-2 tracking-wider">
                  {streamer.name}
                </h1>
                <p className="text-xl text-gray-300 font-montserrat">Marvel Rivals SoloQ Challenge</p>
              </div>
              
              {/* Rank Section */}
              <div className={`flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 mb-8 ${getRankColor(streamer.rank)}`}>
                {getRankImageUrl(streamer.rank) && (
                  <img 
                    src={getRankImageUrl(streamer.rank)!} 
                    alt={`${streamer.rank} icon`} 
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                  />
                )}
                <div className="text-center lg:text-left">
                  <div className="text-3xl sm:text-4xl font-bold font-montserrat mb-2">{streamer.rank || "Sin rango"}</div>
                  {/* Puntos RS */}
                  {streamer.rank_score > 0 && (
                    <div className="text-xl text-gray-300 font-oswald">
                      {Math.round(streamer.rank_score).toLocaleString()} RS
                    </div>
                  )}
                  {/* Position Change Indicator */}
                  {streamer.previous_position && (
                    <div className={`text-lg font-semibold mt-2 ${
                      streamer.previous_position > 0 
                        ? 'text-rivalverso-green' 
                        : 'text-red-400'
                    } flex items-center justify-center lg:justify-start gap-2`}>
                      <span className="text-2xl">{streamer.previous_position > 0 ? '↗' : '↘'}</span>
                      <span>
                        {streamer.previous_position > 0 
                          ? `+${streamer.previous_position} posiciones` 
                          : `${Math.abs(streamer.previous_position)} posiciones`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto lg:mx-0">
                {streamer.ingame_username && (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 bg-rivalverso-purple-light/30 rounded-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-300 font-montserrat">Usuario en el juego</div>
                      <div className="text-lg text-white font-semibold font-oswald">{streamer.ingame_username}</div>
                    </div>
                  </div>
                )}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-rivalverso-green/30 rounded-lg">
                    {lastMatchTime ? <lastMatchTime.icon className="w-5 h-5 text-white" /> : <Calendar className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <div className="text-xs text-gray-300 font-montserrat">
                      {details?.match_history && details.match_history.length > 0 ? 'Última partida jugada' : 'Datos actualizados'}
                    </div>
                    <div className="text-lg text-white font-semibold font-oswald">
                      {lastMatchTime?.text || 'Sin datos'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {streamer.twitch_username && (
                <a 
                  href={`https://twitch.tv/${streamer.twitch_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white transition-all duration-200 px-4 py-3 rounded-lg hover:scale-105 font-montserrat"
                >
                  <Twitch className="w-5 h-5" />
                  <span>Twitch</span>
                </a>
              )}
              {streamer.youtube_username && (
                <a 
                  href={`https://youtube.com/@${streamer.youtube_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-300 hover:text-white transition-all duration-200 px-4 py-3 rounded-lg hover:scale-105 font-montserrat"
                >
                  <Youtube className="w-5 h-5" />
                  <span>YouTube</span>
                </a>
              )}
              {streamer.twitter_username && (
                <a 
                  href={`https://twitter.com/${streamer.twitter_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white transition-all duration-200 px-4 py-3 rounded-lg hover:scale-105 font-montserrat"
                >
                  <Twitter className="w-5 h-5" />
                  <span>Twitter</span>
                </a>
              )}
              {streamer.instagram_username && (
                <a 
                  href={`https://instagram.com/${streamer.instagram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-pink-600/20 hover:bg-pink-600 border border-pink-500/30 hover:border-pink-500 text-pink-300 hover:text-white transition-all duration-200 px-4 py-3 rounded-lg hover:scale-105 font-montserrat"
                >
                  <Instagram className="w-5 h-5" />
                  <span>Instagram</span>
                </a>
              )}
              {streamer.tiktok_username && (
                <a 
                  href={`https://tiktok.com/@${streamer.tiktok_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-gray-600/20 hover:bg-gray-600 border border-gray-500/30 hover:border-gray-500 text-gray-300 hover:text-white transition-all duration-200 px-4 py-3 rounded-lg hover:scale-105 font-montserrat"
                >
                  <Music className="w-5 h-5" />
                  <span>TikTok</span>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Primary Stats Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-bebas tracking-wider mb-4">
              ESTADÍSTICAS PRINCIPALES
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-rivalverso-green to-rivalverso-purple-light mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Partidas Jugadas */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-purple-light/30 rounded-full">
                  <Gamepad2 className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2 font-oswald">{Math.floor(streamer.games_played)}</div>
              <div className="text-lg text-rivalverso-purple-light font-montserrat font-semibold">Partidas Jugadas</div>
              <div className="text-sm text-gray-300 mt-2 font-montserrat">Sin límite diario</div>
            </div>

            {/* Victorias */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-green/30 rounded-full">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2 font-oswald">{Math.floor(streamer.wins)}</div>
              <div className="text-lg text-rivalverso-green font-montserrat font-semibold">Victorias</div>
              <div className="text-sm text-gray-300 mt-2 font-montserrat">Challenge de 2 semanas</div>
            </div>

            {/* Winrate */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-yellow-500/30 rounded-full">
                  <BarChart3 className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2 font-oswald">{winRate}%</div>
              <div className="text-lg text-yellow-300 font-montserrat font-semibold">Tasa de Victoria</div>
              <div className="text-sm text-gray-300 mt-2 font-montserrat">Efectividad total</div>
            </div>
          </div>
        </section>

        {/* Detailed KDA Stats */}
        {!detailsLoading && details && (details.streamer.kda_ratio > 0 || details.streamer.kills > 0) && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-bebas tracking-wider mb-4 flex items-center justify-center gap-3">
                <Target className="w-8 h-8 text-yellow-400" /> ESTADÍSTICAS DETALLADAS
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-rivalverso-green to-rivalverso-purple-light mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <Swords className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1 font-oswald">{details.streamer.kills.toLocaleString()}</div>
                <div className="text-sm text-red-400 font-montserrat">Eliminaciones</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <X className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1 font-oswald">{details.streamer.deaths.toLocaleString()}</div>
                <div className="text-sm text-gray-400 font-montserrat">Muertes</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <Heart className="w-8 h-8 text-rivalverso-purple-light mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1 font-oswald">{details.streamer.assists.toLocaleString()}</div>
                <div className="text-sm text-rivalverso-purple-light font-montserrat">Asistencias</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <Star className="w-8 h-8 text-rivalverso-green mx-auto mb-3" />
                <div className="text-2xl font-bold text-white mb-1 font-oswald">{details.streamer.kda_ratio.toFixed(2)}</div>
                <div className="text-sm text-rivalverso-green font-montserrat">KDA Ratio</div>
              </div>
            </div>
            {details.streamer.time_played > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <Clock className="w-8 h-8 text-rivalverso-purple-light mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white mb-1 font-oswald">{Math.floor(details.streamer.time_played / 3600)}h</div>
                  <div className="text-sm text-rivalverso-purple-light font-montserrat">Tiempo Jugado</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <Flame className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white mb-1 font-oswald">{(details.streamer.total_damage / 1000000).toFixed(1)}M</div>
                  <div className="text-sm text-orange-400 font-montserrat">Daño Total</div>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <Heart className="w-8 h-8 text-rivalverso-green mx-auto mb-3" />
                  <div className="text-2xl font-bold text-white mb-1 font-oswald">{(details.streamer.total_healing / 1000000).toFixed(1)}M</div>
                  <div className="text-sm text-rivalverso-green font-montserrat">Curación Total</div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Top Heroes */}
        {!detailsLoading && details && details.hero_stats && details.hero_stats.length > 0 && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-bebas tracking-wider mb-4 flex items-center justify-center gap-3">
                <Star className="w-8 h-8 text-rivalverso-green" />
                TOP HÉROES FAVORITOS
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-rivalverso-green to-rivalverso-purple-light mx-auto rounded-full"></div>
            </div>
            <div className="space-y-4">
              {details.hero_stats.slice(0, 5).map((hero, index) => (
                <div key={hero.hero_name} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 relative overflow-hidden group hover:border-rivalverso-green/50 transition-colors">
                  {/* Hero Signature Background */}
                  {getHeroSignatureImageUrl(hero.hero_name) && (
                    <div className="absolute inset-0 opacity-[0.05] group-hover:opacity-[0.1] flex items-center justify-center transition-opacity">
                      <img 
                        src={getHeroSignatureImageUrl(hero.hero_name)!} 
                        alt={`${hero.hero_name} signature`}
                        className="w-full h-full object-contain object-center scale-110 filter grayscale opacity-70"
                      />
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold ${
                          index === 0 ? 'bg-rivalverso-green text-rivalverso-black shadow-lg' :
                          index === 1 ? 'bg-gray-400 text-rivalverso-black shadow-lg' :
                          index === 2 ? 'bg-rivalverso-purple-light text-rivalverso-white shadow-lg' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          #{index + 1}
                        </div>
                        
                        {/* Hero Avatar */}
                        {getHeroImageUrl(hero.hero_name) && (
                          <div className="relative">
                            <div className="absolute inset-0 bg-rivalverso-green/20 rounded-lg blur-sm"></div>
                            <img 
                              src={getHeroImageUrl(hero.hero_name)!} 
                              alt={hero.hero_name}
                              className="relative w-20 h-20 object-cover rounded-lg border-2 border-rivalverso-green/30 shadow-xl"
                            />
                          </div>
                        )}
                        
                        <div>
                          <div className="text-xl font-bold text-white font-montserrat group-hover:text-rivalverso-green transition-colors">
                            {hero.hero_name}
                          </div>
                          <div className="text-gray-300 font-montserrat">
                            {Math.floor(hero.matches_played)} partidas • {hero.win_rate.toFixed(1)}% WR
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl text-white font-oswald font-bold">{hero.kda_ratio.toFixed(2)} KDA</div>
                        <div className="text-gray-400 font-montserrat">
                          {hero.kills}/{hero.deaths}/{hero.assists}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Role Performance */}
        {!detailsLoading && details && details.role_stats && details.role_stats.length > 0 && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-bebas tracking-wider mb-4 flex items-center justify-center gap-3">
                <Target className="w-8 h-8 text-rivalverso-purple-light" /> RENDIMIENTO POR ROL
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-rivalverso-green to-rivalverso-purple-light mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {details.role_stats.map((role) => {
                const roleImageUrl = getRoleImageUrl(role.role_name);

                return (
                  <div key={role.role_name} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      {roleImageUrl ? (
                        <img 
                          src={roleImageUrl} 
                          alt={`${role.role_name} icon`} 
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Target className="w-8 h-8 text-gray-400" />
                      )}
                      <div className="text-xl font-bold text-white font-montserrat">{role.role_name}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-montserrat">Partidas:</span>
                        <span className="text-white font-oswald font-bold">{Math.floor(role.matches_played)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-montserrat">Win Rate:</span>
                        <span className="text-rivalverso-green font-oswald font-bold">{role.win_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300 font-montserrat">KDA:</span>
                        <span className="text-yellow-400 font-oswald font-bold">{role.kda_ratio.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Comparative Stats Section */}
        {!comparativeLoading && !comparativeError && comparativeStats && (
          <ComparativeStatsSection 
            comparativeStats={comparativeStats} 
            streamerName={streamer.name}
          />
        )}

        {/* Match History Section */}
        {!detailsLoading && details && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-bebas tracking-wider mb-4 flex items-center justify-center gap-3">
                <Calendar className="w-8 h-8 text-rivalverso-purple-light" /> HISTORIAL DE PARTIDAS
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-rivalverso-green to-rivalverso-purple-light mx-auto rounded-full"></div>
            </div>
            
            <MatchHistory 
              matches={details.match_history || []} 
              streamerName={streamer.name}
              currentRankScore={streamer.rank_score}
            />
          </section>
        )}

        {/* Streamer-Specific Clips Gallery */}
        {!detailsLoading && details && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-bebas tracking-wider mb-4 flex items-center justify-center gap-3">
                <Trophy className="w-8 h-8 text-rivalverso-green" /> CLIPS DESTACADOS
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-rivalverso-green to-rivalverso-purple-light mx-auto rounded-full"></div>
            </div>
            <ClipsGallery streamerId={streamer.id} showSubmitForm={false} />
          </section>
        )}
      </div>
    </div>
  );
}
