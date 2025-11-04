import { useEffect } from "react";
import { useStreamers } from "@/react-app/hooks/useStreamers";
import { useGlobalMatchHistory } from "@/react-app/hooks/useGlobalMatchHistory";
import StreamerListItem from "@/react-app/components/StreamerListItem";
import FeaturedStats from "@/react-app/components/FeaturedStats";
import GlobalMatchHistory from "@/react-app/components/GlobalMatchHistory";

import { Trophy, Target, Zap, Shield, Users, Clock, BarChart3, Award, GamepadIcon } from "lucide-react";

export default function Home() {
  const { streamers, loading, error } = useStreamers();
  const { matches: globalMatches, loading: matchesLoading } = useGlobalMatchHistory();
  

  useEffect(() => {
    // Helvetica Neue is a system font, no need to load externally
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-rivalverso-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rivalverso-purple-light mx-auto mb-4"></div>
          <p className="text-white text-lg font-montserrat">Cargando clasificación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rivalverso-black flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-montserrat">Error: {error}</p>
        </div>
      </div>
    );
  }

  const liveStreamers = streamers.filter(s => s.is_live).length;
  const totalGames = streamers.reduce((sum, s) => sum + s.games_played, 0);
  const totalWins = streamers.reduce((sum, s) => sum + s.wins, 0);
  const totalHours = streamers.reduce((sum, s) => sum + s.time_played, 0) / 3600; // Convert seconds to hours
  
  // Debug para verificar que solo contamos streamers reales
  console.log(`📊 Estadísticas Home calculadas:`, {
    streamersCount: streamers.length,
    liveStreamers,
    totalGames,
    totalWins,
    streamerNames: streamers.map(s => s.name)
  });

  

  

  return (
    <div className="min-h-screen bg-rivalverso-black">

      {/* 1. HERO SECTION - RIVALVERSO Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* RIVALVERSO Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://mocha-cdn.com/0199440f-b65f-7cab-a552-eca69173e4c7/Back-rivals.png" 
            alt="RIVALVERSO Background"
            className="w-full h-full object-cover"
            style={{
              objectPosition: 'center 50%',
              filter: 'brightness(0.4) contrast(1.2) saturate(1.1)'
            }}
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-rivalverso-black/60 via-rivalverso-black/40 to-rivalverso-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-rivalverso-purple-light/[0.05] via-transparent to-rivalverso-green/[0.05]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-bold mb-4 sm:mb-6 text-white tracking-wider" 
              style={{ 
                fontFamily: 'Helvetica Neue, Helvetica, sans-serif', 
                fontWeight: 700, 
                textShadow: '0 0 20px rgba(137, 31, 211, 0.8), 0 0 40px rgba(137, 31, 211, 0.4)' 
              }}>
            RIVALVERSO
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8" 
              style={{ 
                fontFamily: 'Helvetica Neue, Helvetica, sans-serif',
                fontWeight: 700,
                background: 'linear-gradient(45deg, #891fd3, #58d129, #891fd3)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'gradientShift 3s ease-in-out infinite'
              }}>
            MARVEL RIVALS CHALLENGE
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed font-montserrat font-medium px-2">
            La competencia más épica de Marvel Rivals ha comenzado
          </p>
          <div className="mt-8 sm:mt-12 flex flex-col gap-4 sm:gap-6 items-center">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-rivalverso-black/50 backdrop-blur-sm border border-rivalverso-purple-light/30 rounded-2xl px-4 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 sm:gap-3">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-rivalverso-green" />
                <span className="text-lg sm:text-2xl font-bold text-rivalverso-green font-oswald text-center">20 STREAMERS COMPITIENDO</span>
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-rivalverso-green" />
              </div>
            </div>
            
            <a 
              href="/clips"
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-rivalverso-purple-light/80 backdrop-blur-sm border border-rivalverso-purple-light/30 rounded-2xl px-4 sm:px-8 py-3 sm:py-4 hover:bg-rivalverso-green hover:border-rivalverso-green transition-all duration-300 group w-full sm:w-auto"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">🎬</span>
                <span className="text-lg sm:text-xl font-bold text-white font-oswald group-hover:text-black text-center">VER CLIPS ÉPICOS</span>
                <span className="text-xl sm:text-2xl">🏆</span>
              </div>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-1 h-16 bg-gradient-to-b from-rivalverso-green to-transparent rounded-full"></div>
        </div>
      </section>

      {/* 2. NORMAS BÁSICAS SECTION */}
      <section className="relative py-20 bg-gradient-to-r from-rivalverso-purple-dark via-rivalverso-purple-light to-rivalverso-green">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-5 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white font-bebas tracking-wider">
              REGLAS DEL CHALLENGE
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-rivalverso-green to-rivalverso-purple-light mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Regla 1 */}
            <div className="bg-rivalverso-black/30 backdrop-blur-sm border border-rivalverso-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-green/20 rounded-full">
                  <Users className="w-10 h-10 text-rivalverso-green" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-montserrat">20 Streamers</h3>
              <p className="text-white leading-relaxed font-montserrat">
                Los mejores creadores de contenido hispanos compiten con cuentas completamente nuevas
              </p>
            </div>

            {/* Regla 2 */}
            <div className="bg-rivalverso-black/30 backdrop-blur-sm border border-rivalverso-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-green/20 rounded-full">
                  <Clock className="w-10 h-10 text-rivalverso-green" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-montserrat">2 Semanas</h3>
              <p className="text-white leading-relaxed font-montserrat">
                Duración completa del challenge. Cada día cuenta para alcanzar la cima
              </p>
            </div>

            {/* Regla 3 */}
            <div className="bg-rivalverso-black/30 backdrop-blur-sm border border-rivalverso-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-green/20 rounded-full">
                  <Zap className="w-10 h-10 text-rivalverso-green" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-montserrat">Sin Límites</h3>
              <p className="text-white leading-relaxed font-montserrat">
                No hay límite de partidas diarias. La dedicación y habilidad marcan la diferencia
              </p>
            </div>

            {/* Regla 4 */}
            <div className="bg-rivalverso-black/30 backdrop-blur-sm border border-rivalverso-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-green/20 rounded-full">
                  <GamepadIcon className="w-10 h-10 text-rivalverso-green" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-montserrat">Solo Queue</h3>
              <p className="text-white leading-relaxed font-montserrat">
                Únicamente partidas clasificatorias en solitario. Prohibido jugar en grupo
              </p>
            </div>

            {/* Regla 5 */}
            <div className="bg-rivalverso-black/30 backdrop-blur-sm border border-rivalverso-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-green/20 rounded-full">
                  <Shield className="w-10 h-10 text-rivalverso-green" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-montserrat">Fair Play</h3>
              <p className="text-white leading-relaxed font-montserrat">
                Respeto, deportividad y juego limpio. La comunidad está vigilando
              </p>
            </div>

            {/* Regla 6 */}
            <div className="bg-rivalverso-black/30 backdrop-blur-sm border border-rivalverso-white/20 rounded-2xl p-8 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-green/20 rounded-full">
                  <Award className="w-10 h-10 text-rivalverso-green" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-montserrat">Máximo Rango</h3>
              <p className="text-white leading-relaxed font-montserrat">
                El objetivo: alcanzar el rango más alto posible. Solo los mejores llegarán a la cima
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ESTADÍSTICAS GENERALES SECTION */}
      <section className="relative py-20 bg-gradient-to-r from-gray-900 via-rivalverso-black to-gray-800">
        {/* Subtle background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rivalverso-purple-light/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rivalverso-green/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-5 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white font-bebas tracking-wider">
              ESTADÍSTICAS GLOBALES
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-rivalverso-purple-light to-rivalverso-green mx-auto rounded-full"></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {/* Live Streamers Card */}
            <div className="bg-gradient-to-br from-red-900/40 via-red-800/30 to-red-900/40 border border-red-500/30 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-red-400/50 hover:shadow-2xl hover:scale-105 group">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-red-400/20 rounded-full group-hover:bg-red-400/30 transition-colors animate-pulse">
                  <Zap className="w-10 h-10 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="text-5xl font-bold text-white mb-3 font-oswald group-hover:text-red-400 transition-colors">{liveStreamers}</div>
              <div className="text-red-300 font-montserrat text-lg font-semibold">Streaming Ahora</div>
              <div className="text-sm text-red-400 mt-2 font-montserrat animate-pulse">● EN VIVO</div>
            </div>
            
            {/* Total Games Card */}
            <div className="bg-gradient-to-br from-rivalverso-green/40 via-rivalverso-green-light/30 to-rivalverso-green/40 border border-rivalverso-green/30 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-rivalverso-green hover:shadow-2xl hover:scale-105 group">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-rivalverso-green/20 rounded-full group-hover:bg-rivalverso-green/30 transition-colors">
                  <Target className="w-10 h-10 text-rivalverso-green group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="text-5xl font-bold text-white mb-3 font-oswald group-hover:text-rivalverso-green transition-colors">{Math.floor(totalGames).toLocaleString()}</div>
              <div className="text-rivalverso-green font-montserrat text-lg font-semibold">Partidas Jugadas</div>
              <div className="text-sm text-rivalverso-green mt-2 font-montserrat">Total acumulado</div>
            </div>

            {/* Total Hours Card */}
            <div className="bg-gradient-to-br from-blue-900/40 via-blue-800/30 to-blue-900/40 border border-blue-500/30 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-blue-400/50 hover:shadow-2xl hover:scale-105 group">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-blue-400/20 rounded-full group-hover:bg-blue-400/30 transition-colors">
                  <Clock className="w-10 h-10 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="text-5xl font-bold text-white mb-3 font-oswald group-hover:text-blue-400 transition-colors">{Math.floor(totalHours).toLocaleString()}h</div>
              <div className="text-blue-300 font-montserrat text-lg font-semibold">Horas Jugadas</div>
              <div className="text-sm text-blue-400 mt-2 font-montserrat">Total acumulado</div>
            </div>
            
            {/* Winrate Global Card */}
            <div className="bg-gradient-to-br from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 border border-yellow-500/30 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-yellow-400/50 hover:shadow-2xl hover:scale-105 group">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-yellow-400/20 rounded-full group-hover:bg-yellow-400/30 transition-colors">
                  <BarChart3 className="w-10 h-10 text-yellow-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="text-5xl font-bold text-white mb-3 font-oswald group-hover:text-yellow-400 transition-colors">{((totalWins / Math.max(1, totalGames)) * 100).toFixed(1)}%</div>
              <div className="text-yellow-300 font-montserrat text-lg font-semibold">Winrate Global</div>
              <div className="text-sm text-yellow-400 mt-2 font-montserrat">{Math.floor(totalWins).toLocaleString()} victorias</div>
            </div>
          </div>

          {/* Featured Stats Section */}
          <FeaturedStats />
        </div>
      </section>

      {/* 4. RANKING SECTION */}
      <section className="relative py-20 bg-gradient-to-r from-rivalverso-black via-gray-950 to-rivalverso-black">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-rivalverso-green/3 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-rivalverso-purple-light/3 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-5 max-w-6xl">
          <div className="text-center mb-16">
            <div className="text-center mb-8">
              <h2 className="text-5xl md:text-6xl font-bold text-center font-bebas tracking-wider text-white" 
                  style={{ 
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.4)'
                  }}>
                🏆 CLASIFICACIÓN ACTUAL
              </h2>
            </div>
            <div className="w-32 h-1 bg-gradient-to-r from-rivalverso-green to-rivalverso-purple-light mx-auto rounded-full"></div>
          </div>
          
          
          
          <div className="space-y-3">
            {streamers.map((streamer, index) => (
              <StreamerListItem 
                key={streamer.id} 
                streamer={streamer} 
                position={index + 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. ACTIVIDAD RECIENTE SECTION */}
      <section className="relative py-20 bg-gradient-to-r from-gray-900 via-rivalverso-black to-gray-800">
        {/* Subtle background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rivalverso-purple-light/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rivalverso-green/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-5 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white font-bebas tracking-wider">
              ACTIVIDAD RECIENTE
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-rivalverso-purple-light to-rivalverso-green mx-auto rounded-full"></div>
          </div>

          {matchesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rivalverso-purple-light mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg font-montserrat">Cargando partidas recientes...</p>
            </div>
          ) : globalMatches.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/40 backdrop-blur-sm border border-gray-700 rounded-3xl">
              <Clock className="w-20 h-20 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-300 mb-4 font-montserrat">No hay partidas recientes registradas</h3>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto font-montserrat">
                Las partidas aparecerán aquí cuando los streamers jueguen Marvel Rivals. 
                ¡Mantente atento para ver la actividad en tiempo real del challenge!
              </p>
            </div>
          ) : (
            <div className="bg-gray-900/40 backdrop-blur-sm border border-gray-700 rounded-3xl p-8">
              <div className="mb-6">
                <p className="text-gray-400 text-lg text-center font-montserrat">
                  Últimas {globalMatches.length} partidas jugadas por los streamers del challenge
                </p>
              </div>
              <GlobalMatchHistory 
                matches={globalMatches} 
                isLoading={matchesLoading}
              />
            </div>
          )}
        </div>
      </section>

      

      

      {/* Add gradient animation keyframe */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
