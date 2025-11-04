import { TrendingUp, Award, BarChart3, Target, Users, Zap, Trophy, Medal, Star, Crown } from "lucide-react";
import { ComparativeStats } from "@/react-app/hooks/useStreamerComparativeStats";

interface ComparativeStatsSectionProps {
  comparativeStats: ComparativeStats;
  streamerName: string;
}

export default function ComparativeStatsSection({ comparativeStats, streamerName }: ComparativeStatsSectionProps) {
  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "text-rivalverso-green";
    if (percentile >= 75) return "text-yellow-400";
    if (percentile >= 50) return "text-blue-400";
    if (percentile >= 25) return "text-orange-400";
    return "text-gray-400";
  };

  const getPercentileGradient = (percentile: number) => {
    if (percentile >= 90) return "from-rivalverso-green/20 to-rivalverso-green-light/10";
    if (percentile >= 75) return "from-yellow-500/20 to-yellow-400/10";
    if (percentile >= 50) return "from-blue-500/20 to-blue-400/10";
    if (percentile >= 25) return "from-orange-500/20 to-orange-400/10";
    return "from-gray-600/20 to-gray-500/10";
  };

  const getPercentileDescription = (percentile: number) => {
    if (percentile >= 95) return "Elite";
    if (percentile >= 90) return "Excelente";
    if (percentile >= 75) return "Muy Bueno";
    if (percentile >= 50) return "Por Encima del Promedio";
    if (percentile >= 25) return "Promedio";
    return "Necesita Mejorar";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white font-montserrat mb-6 flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-rivalverso-purple-light" />
        Comparativa vs el Challenge
      </h2>

      {/* Ranking Position Card */}
      <div className="bg-gradient-to-r from-rivalverso-purple-dark/20 to-rivalverso-purple-light/20 border border-rivalverso-purple-light/30 rounded-xl p-6 mb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Crown className="w-8 h-8 text-rivalverso-purple-light" />
          <h3 className="text-2xl font-bold text-white font-montserrat">Posición en el Ranking</h3>
        </div>
        
        <div className="text-5xl font-bold text-white mb-2 font-oswald">
          #{comparativeStats.ranking_position}
        </div>
        <div className="text-lg text-gray-300 font-montserrat">
          de {comparativeStats.total_streamers} streamers
        </div>
        
        {comparativeStats.ranking_position <= 3 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-rivalverso-green">
            <Medal className="w-5 h-5" />
            <span className="font-bold font-montserrat">
              {comparativeStats.ranking_position === 1 ? "¡LÍDER DEL CHALLENGE!" :
               comparativeStats.ranking_position === 2 ? "¡SUBCAMPEÓN!" :
               "¡EN EL PODIO!"}
            </span>
          </div>
        )}
      </div>

      {/* Percentiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* KDA Percentile */}
        <div className={`bg-gradient-to-r ${getPercentileGradient(comparativeStats.percentiles.kda_ratio)} border border-gray-600 rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <Target className={`w-6 h-6 ${getPercentileColor(comparativeStats.percentiles.kda_ratio)}`} />
            <div>
              <div className="text-lg font-bold text-white font-montserrat">KDA</div>
              <div className={`text-sm font-oswald ${getPercentileColor(comparativeStats.percentiles.kda_ratio)}`}>
                Top {(100 - comparativeStats.percentiles.kda_ratio).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-300 font-montserrat">
            {getPercentileDescription(comparativeStats.percentiles.kda_ratio)}
          </div>
          <div className="text-xs text-gray-500 font-montserrat mt-1">
            Mejor que {comparativeStats.better_than_count.kda_ratio} streamers
          </div>
        </div>

        {/* Winrate Percentile */}
        <div className={`bg-gradient-to-r ${getPercentileGradient(comparativeStats.percentiles.win_rate)} border border-gray-600 rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className={`w-6 h-6 ${getPercentileColor(comparativeStats.percentiles.win_rate)}`} />
            <div>
              <div className="text-lg font-bold text-white font-montserrat">Winrate</div>
              <div className={`text-sm font-oswald ${getPercentileColor(comparativeStats.percentiles.win_rate)}`}>
                Top {(100 - comparativeStats.percentiles.win_rate).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-300 font-montserrat">
            {getPercentileDescription(comparativeStats.percentiles.win_rate)}
          </div>
          <div className="text-xs text-gray-500 font-montserrat mt-1">
            Mejor que {comparativeStats.better_than_count.win_rate} streamers
          </div>
        </div>

        {/* Kills Percentile */}
        <div className={`bg-gradient-to-r ${getPercentileGradient(comparativeStats.percentiles.kills)} border border-gray-600 rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <Zap className={`w-6 h-6 ${getPercentileColor(comparativeStats.percentiles.kills)}`} />
            <div>
              <div className="text-lg font-bold text-white font-montserrat">Eliminaciones</div>
              <div className={`text-sm font-oswald ${getPercentileColor(comparativeStats.percentiles.kills)}`}>
                Top {(100 - comparativeStats.percentiles.kills).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-300 font-montserrat">
            {getPercentileDescription(comparativeStats.percentiles.kills)}
          </div>
          <div className="text-xs text-gray-500 font-montserrat mt-1">
            Mejor que {comparativeStats.better_than_count.kills} streamers
          </div>
        </div>

        {/* Time Played Percentile */}
        <div className={`bg-gradient-to-r ${getPercentileGradient(comparativeStats.percentiles.time_played)} border border-gray-600 rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <Trophy className={`w-6 h-6 ${getPercentileColor(comparativeStats.percentiles.time_played)}`} />
            <div>
              <div className="text-lg font-bold text-white font-montserrat">Dedicación</div>
              <div className={`text-sm font-oswald ${getPercentileColor(comparativeStats.percentiles.time_played)}`}>
                Top {(100 - comparativeStats.percentiles.time_played).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-300 font-montserrat">
            {getPercentileDescription(comparativeStats.percentiles.time_played)}
          </div>
        </div>

        {/* Damage Percentile */}
        <div className={`bg-gradient-to-r ${getPercentileGradient(comparativeStats.percentiles.total_damage)} border border-gray-600 rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <Star className={`w-6 h-6 ${getPercentileColor(comparativeStats.percentiles.total_damage)}`} />
            <div>
              <div className="text-lg font-bold text-white font-montserrat">Daño Total</div>
              <div className={`text-sm font-oswald ${getPercentileColor(comparativeStats.percentiles.total_damage)}`}>
                Top {(100 - comparativeStats.percentiles.total_damage).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-300 font-montserrat">
            {getPercentileDescription(comparativeStats.percentiles.total_damage)}
          </div>
        </div>

        {/* Rank Score Percentile */}
        <div className={`bg-gradient-to-r ${getPercentileGradient(comparativeStats.percentiles.rank_score)} border border-gray-600 rounded-xl p-4`}>
          <div className="flex items-center gap-3 mb-3">
            <Award className={`w-6 h-6 ${getPercentileColor(comparativeStats.percentiles.rank_score)}`} />
            <div>
              <div className="text-lg font-bold text-white font-montserrat">Puntos RS</div>
              <div className={`text-sm font-oswald ${getPercentileColor(comparativeStats.percentiles.rank_score)}`}>
                Top {(100 - comparativeStats.percentiles.rank_score).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-300 font-montserrat">
            {getPercentileDescription(comparativeStats.percentiles.rank_score)}
          </div>
          <div className="text-xs text-gray-500 font-montserrat mt-1">
            Mejor que {comparativeStats.better_than_count.rank_score} streamers
          </div>
        </div>
      </div>

      {/* Challenge Averages Comparison */}
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-600 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white font-montserrat">vs Promedio del Challenge</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400 font-montserrat mb-1">KDA Promedio</div>
            <div className="text-lg text-white font-oswald">{comparativeStats.challenge_averages.kda_ratio.toFixed(2)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400 font-montserrat mb-1">Winrate Promedio</div>
            <div className="text-lg text-white font-oswald">{comparativeStats.challenge_averages.win_rate.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400 font-montserrat mb-1">Eliminaciones Promedio</div>
            <div className="text-lg text-white font-oswald">{formatNumber(comparativeStats.challenge_averages.kills)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400 font-montserrat mb-1">Horas Promedio</div>
            <div className="text-lg text-white font-oswald">{Math.floor(comparativeStats.challenge_averages.time_played / 3600)}h</div>
          </div>
        </div>
      </div>

      {/* Top Performer Badges */}
      {(comparativeStats.top_performers.is_top_kda || 
        comparativeStats.top_performers.is_top_winrate || 
        comparativeStats.top_performers.is_top_kills || 
        comparativeStats.top_performers.is_top_time_played || 
        comparativeStats.top_performers.is_top_damage) && (
        <div className="mt-6 bg-gradient-to-r from-rivalverso-green/20 to-rivalverso-green-light/10 border border-rivalverso-green/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Medal className="w-6 h-6 text-rivalverso-green" />
            <h3 className="text-xl font-bold text-white font-montserrat">🏆 {streamerName} es Top Performer</h3>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {comparativeStats.top_performers.is_top_kda && (
              <div className="bg-rivalverso-green/20 border border-rivalverso-green/40 rounded-lg px-3 py-2 text-sm font-montserrat text-rivalverso-green">
                🎯 Top {comparativeStats.top_performers.top_percentage_kda || 10}% en KDA
              </div>
            )}
            {comparativeStats.top_performers.is_top_winrate && (
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-3 py-2 text-sm font-montserrat text-yellow-400">
                📈 Top {comparativeStats.top_performers.top_percentage_winrate || 10}% en Winrate
              </div>
            )}
            {comparativeStats.top_performers.is_top_kills && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2 text-sm font-montserrat text-red-400">
                ⚔️ Top {comparativeStats.top_performers.top_percentage_kills || 10}% en Eliminaciones
              </div>
            )}
            {comparativeStats.top_performers.is_top_time_played && (
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg px-3 py-2 text-sm font-montserrat text-blue-400">
                ⏰ Top {comparativeStats.top_performers.top_percentage_time_played || 10}% en Dedicación
              </div>
            )}
            {comparativeStats.top_performers.is_top_damage && (
              <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg px-3 py-2 text-sm font-montserrat text-orange-400">
                💥 Top {comparativeStats.top_performers.top_percentage_damage || 10}% en Daño
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
