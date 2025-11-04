import { Calendar, Clock, TrendingUp, TrendingDown, Minus, User } from "lucide-react";
import { getHeroImageUrl } from "@/react-app/utils/heroImages";
import { GlobalMatchHistoryEntry } from "@/react-app/hooks/useGlobalMatchHistory";
import { formatTimeAgoMexicoCity } from "@/react-app/utils/timezone";

interface GlobalMatchHistoryProps {
  matches: GlobalMatchHistoryEntry[];
  isLoading: boolean;
}

export default function GlobalMatchHistory({ matches, isLoading }: GlobalMatchHistoryProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rivalverso-purple-light mx-auto mb-4"></div>
        <p className="text-gray-400 font-montserrat">Cargando partidas recientes...</p>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-montserrat mb-2">
              Sin Actividad Reciente
            </h3>
            <p className="text-gray-400 font-montserrat">
              Las partidas aparecerán aquí cuando los streamers jueguen Marvel Rivals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  

  return (
    <div className="space-y-6">
      {/* Lista de Partidas Globales */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-white font-montserrat flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rivalverso-purple-light" />
          Últimas {matches.length} Partidas del Challenge
        </h3>
        
        {/* Header de la tabla */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="grid grid-cols-12 gap-4 items-center text-xs font-bold text-gray-400 uppercase tracking-wider font-montserrat">
            <div className="col-span-1 text-center">Resultado</div>
            <div className="col-span-3">Streamer</div>
            <div className="col-span-2">Héroe</div>
            <div className="col-span-2 text-center">RS Change</div>
            <div className="col-span-2 text-center">KDA</div>
            <div className="col-span-2 text-center">Tiempo</div>
          </div>
        </div>

        {/* Partidas */}
        <div className="space-y-2">
          {matches.map((match, index) => {
            return (
              <div 
                key={match.matchId || index}
                className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-800/80 hover:border-gray-600 transition-all duration-200 group"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Resultado */}
                  <div className="col-span-1 flex justify-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg font-bold text-sm ${
                      match.result === 'win' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {match.result === 'win' ? 'W' : 'L'}
                    </div>
                  </div>

                  {/* Streamer */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      {match.streamerAvatarUrl ? (
                        <img 
                          src={match.streamerAvatarUrl} 
                          alt={match.streamerName}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-600 group-hover:border-gray-500 transition-colors"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-rivalverso-purple-dark/50 border border-gray-600 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-montserrat font-semibold text-sm truncate">
                          {match.streamerName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Héroe */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      {getHeroImageUrl(match.heroPlayed) && (
                        <div className="relative">
                          <img 
                            src={getHeroImageUrl(match.heroPlayed)!} 
                            alt={match.heroPlayed}
                            className="w-8 h-8 rounded-lg object-cover border border-gray-600 group-hover:border-gray-500 transition-colors"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-montserrat font-medium text-xs truncate">
                          {match.heroPlayed}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RS Change */}
                  <div className="col-span-2 text-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold font-oswald ${
                      match.scoreChange > 0 ? 'bg-green-600/20 text-green-400' : 
                      match.scoreChange < 0 ? 'bg-red-600/20 text-red-400' : 'bg-gray-600/20 text-gray-400'
                    }`}>
                      {match.scoreChange > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          <span>+{Math.round(match.scoreChange)}</span>
                        </>
                      ) : match.scoreChange < 0 ? (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          <span>{Math.round(match.scoreChange)}</span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-3 h-3" />
                          <span>±0</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-montserrat mt-1">
                      {match.score > 0 ? `${Math.round(match.score).toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                  
                  {/* KDA */}
                  <div className="col-span-2 text-center">
                    <div className="text-yellow-400 font-oswald font-bold text-lg">
                      {match.deaths > 0 ? ((match.kills + match.assists) / match.deaths).toFixed(2) : '∞'}
                    </div>
                    <div className="text-xs text-gray-400 font-montserrat">
                      {match.kills}/{match.deaths}/{match.assists}
                    </div>
                  </div>

                  {/* Tiempo */}
                  <div className="col-span-2 text-center">
                    {match.duration && (
                      <div className="text-sm text-white font-oswald font-bold">
                        {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 font-montserrat flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgoMexicoCity(match.timestamp)}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
