import { Calendar, Trophy, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getHeroImageUrl } from "@/react-app/utils/heroImages";
import { formatTimeAgoMexicoCity } from "@/react-app/utils/timezone";

interface MatchHistoryEntry {
  matchId: string;
  result: 'win' | 'loss';
  heroPlayed: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  scoreChange: number; // RS change - positivo/negativo
  timestamp: string;
  duration?: number; // Duración en segundos
  gameMode?: string;
  mapName?: string;
  mapImageUrl?: string;
}

interface MatchHistoryProps {
  matches: MatchHistoryEntry[];
  streamerName: string;
  currentRankScore?: number; // RS actual del streamer para calcular RS históricos
}

export default function MatchHistory({ matches, streamerName, currentRankScore = 0 }: MatchHistoryProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-montserrat mb-2">
              Sin Historial Disponible
            </h3>
            <p className="text-gray-400 font-montserrat">
              Las partidas de {streamerName} aparecerán aquí cuando estén disponibles desde la API de Marvel Rivals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular estadísticas del historial
  const totalMatches = matches.length;
  const wins = matches.filter(m => m.result === 'win').length;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);
  const totalDeaths = matches.reduce((sum, m) => sum + m.deaths, 0);
  const totalAssists = matches.reduce((sum, m) => sum + m.assists, 0);
  const avgKDA = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : 0;

  // Héroe más jugado
  const heroCount = matches.reduce((acc, match) => {
    acc[match.heroPlayed] = (acc[match.heroPlayed] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostPlayedHero = Object.entries(heroCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Desconocido';

  // Racha actual
  let currentStreak = 0;
  let streakType: 'win' | 'loss' | null = null;
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    if (i === 0) {
      currentStreak = 1;
      streakType = match.result;
    } else if (match.result === streakType) {
      currentStreak++;
    } else {
      break;
    }
  }

  

  return (
    <div className="space-y-6">
      {/* Estadísticas del Historial */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white font-oswald mb-1">{totalMatches}</div>
          <div className="text-sm text-gray-400 font-montserrat">Partidas</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold font-oswald mb-1 ${winRate >= 60 ? 'text-green-400' : winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {winRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400 font-montserrat">Winrate</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400 font-oswald mb-1">{avgKDA.toFixed(2)}</div>
          <div className="text-sm text-gray-400 font-montserrat">KDA Promedio</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold font-oswald mb-1 ${
            streakType === 'win' ? 'text-green-400' : 'text-red-400'
          }`}>
            {currentStreak}{streakType === 'win' ? 'W' : 'L'}
          </div>
          <div className="text-sm text-gray-400 font-montserrat">Racha</div>
        </div>
      </div>

      {/* Héroe Más Jugado */}
      {mostPlayedHero !== 'Desconocido' && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            {getHeroImageUrl(mostPlayedHero) && (
              <img 
                src={getHeroImageUrl(mostPlayedHero)!} 
                alt={mostPlayedHero}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <div className="text-white font-montserrat font-semibold">Héroe Más Jugado</div>
              <div className="text-rivalverso-green font-oswald text-lg">
                {mostPlayedHero} ({heroCount[mostPlayedHero]} partidas)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Partidas - NUEVO DISEÑO */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-white font-montserrat flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rivalverso-purple-light" />
          Últimas 10 Partidas
        </h3>
        
        {/* Header de la tabla */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="grid grid-cols-12 gap-4 items-center text-xs font-bold text-gray-400 uppercase tracking-wider font-montserrat">
            <div className="col-span-1 text-center">Resultado</div>
            <div className="col-span-3">Héroe</div>
            <div className="col-span-2 text-center">RS Change</div>
            <div className="col-span-2 text-center">KDA</div>
            <div className="col-span-2 text-center">Mapa</div>
            <div className="col-span-2 text-center">Tiempo</div>
          </div>
        </div>

        {/* Partidas */}
        <div className="space-y-2">
          {matches.map((match, index) => {
            // Calcular RS que tenía el jugador en esa partida
            const scoreChangesAfterThis = matches.slice(0, index).reduce((sum, m) => sum + (m.scoreChange || 0), 0);
            const historicalRankScore = currentRankScore - scoreChangesAfterThis;
            
            return (
              <div 
                key={match.matchId || index}
                className="bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-xl p-4 hover:bg-gray-800/80 hover:border-gray-600 transition-all duration-200 group"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Resultado - Más compacto */}
                  <div className="col-span-1 flex justify-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg font-bold text-sm ${
                      match.result === 'win' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {match.result === 'win' ? 'W' : 'L'}
                    </div>
                  </div>

                  {/* Héroe - Mejor layout */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      {getHeroImageUrl(match.heroPlayed) && (
                        <div className="relative">
                          <img 
                            src={getHeroImageUrl(match.heroPlayed)!} 
                            alt={match.heroPlayed}
                            className="w-10 h-10 rounded-lg object-cover border border-gray-600 group-hover:border-gray-500 transition-colors"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-montserrat font-semibold text-sm truncate">
                          {match.heroPlayed}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RS Change - Más prominente */}
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
                      {historicalRankScore > 0 ? `${Math.round(historicalRankScore).toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                  
                  {/* KDA - Más limpio */}
                  <div className="col-span-2 text-center">
                    <div className="text-yellow-400 font-oswald font-bold text-lg">
                      {match.deaths > 0 ? ((match.kills + match.assists) / match.deaths).toFixed(2) : '∞'}
                    </div>
                    <div className="text-xs text-gray-400 font-montserrat">
                      {match.kills}/{match.deaths}/{match.assists}
                    </div>
                  </div>

                  {/* Mapa - Layout horizontal */}
                  <div className="col-span-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {match.mapImageUrl && (
                        <img 
                          src={match.mapImageUrl} 
                          alt={match.mapName || 'Mapa'}
                          className="w-8 h-8 rounded-md object-cover border border-gray-600 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="min-w-0">
                        {match.mapName && (
                          <div className="text-xs text-gray-300 font-montserrat truncate">
                            {match.mapName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tiempo - Más organizado */}
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
