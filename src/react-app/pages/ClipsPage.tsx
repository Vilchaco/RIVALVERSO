import { useState, useEffect } from "react";
import ClipsGallery from "@/react-app/components/ClipsGallery";
import { ClipWithStatsType } from "@/shared/clip-types";
import { Trophy, Zap, Crown, Star, Home, ArrowLeft } from "lucide-react";

export default function ClipsPage() {
  const [topClips, setTopClips] = useState<ClipWithStatsType[]>([]);
  const [weeklyWinner, setWeeklyWinner] = useState<ClipWithStatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar top clips
        const clipsResponse = await fetch('/api/clips?order_by=votes&limit=3');
        if (clipsResponse.ok) {
          const clipsData = await clipsResponse.json();
          setTopClips(clipsData.clips || []);
          
          // Cargar ganador semanal (simulado por ahora)
          if (clipsData.clips && clipsData.clips.length > 0) {
            setWeeklyWinner(clipsData.clips[0]);
          }
        }
      } catch (error) {
        console.error('Error loading clips data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-rivalverso-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rivalverso-purple-light mx-auto mb-4"></div>
          <p className="text-rivalverso-white text-lg font-montserrat">Cargando clips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rivalverso-black">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 bg-gradient-to-r from-gray-950 via-rivalverso-black to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rivalverso-green/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rivalverso-purple-light/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-5 max-w-6xl">
          {/* Navigation Button */}
          <div className="mb-8 sm:mb-12">
            <a 
              href="/"
              className="inline-flex items-center gap-2 sm:gap-3 bg-rivalverso-black/50 backdrop-blur-sm border border-rivalverso-purple-light/30 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 hover:bg-rivalverso-green hover:border-rivalverso-green transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-rivalverso-green group-hover:text-black transition-colors" />
              <Home className="w-5 h-5 sm:w-6 sm:h-6 text-rivalverso-purple-light group-hover:text-black transition-colors" />
              <span className="text-white font-bold font-montserrat text-sm sm:text-base group-hover:text-black transition-colors">
                VOLVER AL RANKING
              </span>
            </a>
          </div>

          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 text-rivalverso-green font-bebas tracking-wider">
              🎬 CLIPS ÉPICOS
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed font-montserrat px-4">
              Los mejores momentos del Marvel Rivals SoloQ Challenge
            </p>
            <div className="mt-6 sm:mt-8 flex justify-center px-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 bg-rivalverso-black/50 backdrop-blur-sm border border-rivalverso-green/30 rounded-2xl px-4 sm:px-8 py-3 sm:py-4">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-rivalverso-green" />
                <span className="text-lg sm:text-2xl font-bold text-rivalverso-green font-oswald text-center">VOTA TUS FAVORITOS</span>
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-rivalverso-green" />
              </div>
            </div>
          </div>

          {/* Weekly Winner Banner (si hay ganador) */}
          {weeklyWinner && (
            <div className="mb-12 sm:mb-16">
              <div className="bg-gradient-to-r from-rivalverso-green/40 via-rivalverso-green-light/40 to-rivalverso-green/40 border border-rivalverso-green/50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-rivalverso-green" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-rivalverso-green font-bebas text-center">CLIP DE LA SEMANA</h2>
                    <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-rivalverso-green hidden sm:block" />
                  </div>
                </div>
                
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-lg sm:text-xl font-bold text-rivalverso-white font-montserrat mb-2">
                    {weeklyWinner.title}
                  </h3>
                  <p className="text-sm sm:text-base text-rivalverso-green font-montserrat mb-3 sm:mb-4">
                    Por: {weeklyWinner.broadcaster_name} • {weeklyWinner.stats?.vote_score || 0} votos
                  </p>
                  
                  {weeklyWinner.streamer_info && (
                    <div className="flex items-center justify-center gap-3 bg-rivalverso-black/30 rounded-xl p-3 sm:p-4">
                      <img 
                        src={weeklyWinner.streamer_info.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop&crop=face"} 
                        alt={weeklyWinner.streamer_info.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-rivalverso-green"
                      />
                      <div className="text-left">
                        <p className="text-rivalverso-green font-bold font-montserrat text-sm sm:text-base">
                          🏆 Ganador de la semana
                        </p>
                        <p className="text-rivalverso-white font-montserrat text-sm sm:text-base">
                          {weeklyWinner.streamer_info.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Top Clips Preview */}
          {topClips.length > 0 && (
            <div className="mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-rivalverso-white font-bebas mb-6 sm:mb-8">
                🌟 TOP 3 MÁS VOTADOS
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {topClips.map((clip, index) => (
                  <div key={clip.id} className="relative">
                    <div className={`absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-rivalverso-white font-bold text-base sm:text-lg z-10 ${
                      index === 0 ? 'bg-gradient-to-r from-rivalverso-green to-rivalverso-green-light text-rivalverso-black' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                      'bg-gradient-to-r from-rivalverso-purple-light to-rivalverso-purple-dark'
                    }`}>
                      {index + 1}
                    </div>
                    
                    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden hover:border-rivalverso-green/50 transition-colors">
                      <div className="relative aspect-video bg-rivalverso-black">
                        <img 
                          src={clip.thumbnail_url || "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop"} 
                          alt={clip.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-rivalverso-black/30 flex items-center justify-center hover:bg-rivalverso-black/20 transition-colors group cursor-pointer">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rivalverso-green rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-rivalverso-black" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 sm:p-4">
                        <h3 className="font-bold text-rivalverso-white font-montserrat mb-2 line-clamp-2 text-sm sm:text-base">
                          {clip.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs sm:text-sm font-montserrat truncate mr-2">
                            {clip.broadcaster_name}
                          </span>
                          <div className="flex items-center gap-1 text-rivalverso-green font-bold text-sm">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                            {clip.stats?.vote_score || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Clips Gallery */}
      <section className="py-12 sm:py-20 bg-gradient-to-r from-rivalverso-black via-gray-950 to-rivalverso-black">
        <div className="container mx-auto px-4 sm:px-5 max-w-6xl">
          <ClipsGallery showSubmitForm={true} />
        </div>
      </section>

      {/* Info Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-gray-950 via-rivalverso-black to-gray-950 border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-5 max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-rivalverso-green font-bebas mb-6">
            CÓMO FUNCIONA
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rivalverso-purple-light rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-rivalverso-white font-bold text-lg sm:text-xl">1</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-rivalverso-white font-montserrat mb-2">Envía tu Clip</h3>
              <p className="text-gray-300 font-montserrat text-sm">
                Comparte la URL de tu clip favorito de Twitch del SoloQ Challenge
              </p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rivalverso-green rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-rivalverso-black font-bold text-lg sm:text-xl">2</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-rivalverso-white font-montserrat mb-2">Vota</h3>
              <p className="text-gray-300 font-montserrat text-sm">
                Vota por tus clips favoritos. Máximo 10 votos por día por usuario
              </p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rivalverso-green rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-rivalverso-black font-bold text-lg sm:text-xl">3</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-rivalverso-white font-montserrat mb-2">Gana</h3>
              <p className="text-gray-300 font-montserrat text-sm">
                El clip más votado cada semana gana una recompensa especial
              </p>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-rivalverso-green/20 border border-rivalverso-green/30 rounded-xl">
            <p className="text-rivalverso-green font-montserrat text-sm sm:text-base">
              <strong>🎯 Reglas:</strong> Solo clips de streamers del challenge • Máximo 10 votos por día • 
              Clips deben ser aprobados por moderadores • No spam ni contenido inapropiado
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
