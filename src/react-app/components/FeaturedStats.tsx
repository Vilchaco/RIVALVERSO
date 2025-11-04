import { useFeaturedStats } from "@/react-app/hooks/useFeaturedStats";
import { getHeroImageUrl, getHeroSignatureImageUrl } from "@/react-app/utils/heroImages";
import { Trophy, Clock, Swords, BarChart3, Star, Medal, Shield, Flame, TrendingUp } from "lucide-react";

export default function FeaturedStats() {
  const { data, loading, error } = useFeaturedStats();

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rivalverso-purple-light mx-auto mb-4"></div>
          <p className="text-gray-400 font-montserrat">Cargando estadísticas destacadas...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Curious Stats Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-8 h-8 text-rivalverso-green" />
            <h3 className="text-3xl font-bold text-white font-bebas">ESTADÍSTICAS DESTACADAS</h3>
            <Star className="w-8 h-8 text-rivalverso-green" />
          </div>
          <p className="text-gray-300 font-montserrat">Los mejores rendimientos del Challenge</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Highest KDA */}
          {data.highest_kda && (
            <div className="bg-gradient-to-br from-rivalverso-green/20 to-rivalverso-green-light/20 border border-rivalverso-green/30 rounded-xl p-4 sm:p-6 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-rivalverso-green/10 rounded-full">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-rivalverso-green" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 font-oswald">
                {data.highest_kda.kda_ratio.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-montserrat mb-1 sm:mb-2">Mejor KDA</div>
              <div className="text-sm sm:text-lg font-bold text-white font-montserrat">
                {data.highest_kda.name}
              </div>
              <div className="text-xs text-gray-500 font-montserrat mt-1">
                {data.highest_kda.kills}/{data.highest_kda.deaths}/{data.highest_kda.assists}
              </div>
            </div>
          )}

          {/* Most Time Played */}
          {data.most_time_played && (
            <div className="bg-gradient-to-br from-rivalverso-purple-dark/20 to-rivalverso-purple-light/20 border border-rivalverso-purple-light/30 rounded-xl p-4 sm:p-6 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-rivalverso-purple-light/10 rounded-full">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-rivalverso-purple-light" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 font-oswald">
                {Math.floor(data.most_time_played.time_played / 3600)}h
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-montserrat mb-1 sm:mb-2">Mayor Tiempo</div>
              <div className="text-sm sm:text-lg font-bold text-white font-montserrat">
                {data.most_time_played.name}
              </div>
              <div className="text-xs text-gray-500 font-montserrat mt-1">
                {Math.floor(data.most_time_played.games_played)} partidas
              </div>
            </div>
          )}

          {/* Most Kills */}
          {data.most_kills && (
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl p-4 sm:p-6 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-red-400/10 rounded-full">
                  <Swords className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 font-oswald">
                {data.most_kills.kills.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-montserrat mb-1 sm:mb-2">Más Eliminaciones</div>
              <div className="text-sm sm:text-lg font-bold text-white font-montserrat">
                {data.most_kills.name}
              </div>
              <div className="text-xs text-gray-500 font-montserrat mt-1">
                {(data.most_kills.kills / data.most_kills.games_played).toFixed(1)} por partida
              </div>
            </div>
          )}

          {/* Highest Winrate */}
          {data.highest_winrate && (
            <div className="bg-gradient-to-br from-rivalverso-green/20 to-rivalverso-green-light/20 border border-rivalverso-green/30 rounded-xl p-4 sm:p-6 text-center hover:scale-105 transition-transform">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-rivalverso-green/10 rounded-full">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-rivalverso-green" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 font-oswald">
                {((data.highest_winrate.wins / data.highest_winrate.games_played) * 100).toFixed(1)}%
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-montserrat mb-1 sm:mb-2">Mejor Winrate</div>
              <div className="text-sm sm:text-lg font-bold text-white font-montserrat">
                {data.highest_winrate.name}
              </div>
              <div className="text-xs text-gray-500 font-montserrat mt-1">
                {Math.floor(data.highest_winrate.wins)}/{Math.floor(data.highest_winrate.games_played)} partidas
              </div>
            </div>
          )}
        </div>

        {/* Most Popular Hero - Enhanced with Hero Signature */}
        {data.most_popular_hero && (
          <div className="mt-8 bg-gradient-to-r from-rivalverso-purple-dark/20 to-rivalverso-purple-light/20 border border-rivalverso-purple-light/30 rounded-xl p-8 text-center relative overflow-hidden">
            {/* Hero Signature Background */}
            {getHeroSignatureImageUrl(data.most_popular_hero.hero_name) && (
              <div className="absolute inset-0 opacity-[0.1] flex items-center justify-center pointer-events-none">
                <img 
                  src={getHeroSignatureImageUrl(data.most_popular_hero.hero_name)!} 
                  alt={`${data.most_popular_hero.hero_name} signature`}
                  className="w-full h-full object-contain object-center scale-110 filter grayscale opacity-70"
                />
              </div>
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Medal className="w-8 h-8 text-white" />
                <h4 className="text-2xl font-bold text-white font-montserrat">Héroe Más Popular</h4>
                <Medal className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex items-center justify-center gap-6 mb-4">
                {/* Hero Image */}
                {getHeroImageUrl(data.most_popular_hero.hero_name) && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-rivalverso-purple-light/20 rounded-full blur-xl"></div>
                    <img 
                      src={getHeroImageUrl(data.most_popular_hero.hero_name)!} 
                      alt={data.most_popular_hero.hero_name}
                      className="relative w-24 h-24 object-cover rounded-full border-4 border-rivalverso-purple-light/50 shadow-2xl"
                    />
                  </div>
                )}
                
                <div>
                  <div className="text-4xl font-bold text-white mb-2 font-oswald">
                    {data.most_popular_hero.hero_name}
                  </div>
                  <div className="text-gray-300 font-montserrat text-lg">
                    {Math.round(data.most_popular_hero.total_matches).toLocaleString()} partidas jugadas
                  </div>
                  <div className="text-white font-montserrat">
                    por {data.most_popular_hero.streamers_count} streamers
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hero Leaders */}
      {data.hero_leaders && data.hero_leaders.length > 0 && (
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flame className="w-8 h-8 text-white" />
              <h3 className="text-3xl font-bold text-white font-bebas">LÍDERES POR HÉROE</h3>
              <Flame className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-300 font-montserrat">Los mejores jugadores con héroes específicos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.hero_leaders.slice(0, 6).map((leader, index) => (
              <div key={`${leader.hero_name}-${leader.streamer.id}`} 
                   className="bg-rivalverso-black/30 border border-gray-600 rounded-xl p-4 sm:p-6 hover:border-rivalverso-green/50 transition-colors relative overflow-hidden group">
                {/* Hero Signature Background */}
                {getHeroSignatureImageUrl(leader.hero_name) && (
                  <div className="absolute inset-0 opacity-[0.08] group-hover:opacity-[0.15] flex items-center justify-center transition-opacity">
                    <img 
                      src={getHeroSignatureImageUrl(leader.hero_name)!} 
                      alt={`${leader.hero_name} signature`}
                      className="w-full h-full object-contain object-center scale-110 filter grayscale opacity-70"
                    />
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index < 3 ? 'bg-gradient-to-r from-rivalverso-green to-rivalverso-green-light text-rivalverso-black' : 'bg-gray-600 text-gray-300'
                    }`}>
                      #{index + 1}
                    </div>
                    
                    {/* Hero Avatar */}
                    {getHeroImageUrl(leader.hero_name) && (
                      <div className="relative">
                        <img 
                          src={getHeroImageUrl(leader.hero_name)!} 
                          alt={leader.hero_name}
                          className="w-12 h-12 object-cover rounded-lg border-2 border-rivalverso-green/30"
                        />
                      </div>
                    )}
                    
                    <div>
                      <div className="text-lg font-bold text-white font-montserrat">
                        {leader.hero_name}
                      </div>
                      <div className="text-sm text-gray-400 font-montserrat">
                        {leader.streamer.name}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400 font-montserrat">Partidas:</span>
                    <span className="text-sm text-white font-oswald">{Math.floor(leader.matches_played)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400 font-montserrat">Win Rate:</span>
                    <span className="text-sm text-white font-oswald">{leader.win_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400 font-montserrat">KDA:</span>
                    <span className="text-sm text-white font-oswald">{leader.kda_ratio.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Leaders */}
      {data.role_leaders && data.role_leaders.length > 0 && (
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-white" />
              <h3 className="text-3xl font-bold text-white font-bebas">LÍDERES POR ROL</h3>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-300 font-montserrat">Los mejores en cada especialización</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {data.role_leaders.map((leader) => {
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
              
              const getRoleColor = (roleName: string) => {
                if (roleName.toLowerCase().includes('vanguard') || roleName.toLowerCase().includes('vanguardia')) return 'blue';
                if (roleName.toLowerCase().includes('duelist') || roleName.toLowerCase().includes('duelista')) return 'red';
                if (roleName.toLowerCase().includes('strategist') || roleName.toLowerCase().includes('estratega')) return 'green';
                return 'purple';
              };

              const roleImageUrl = getRoleImageUrl(leader.role_name);
              const color = getRoleColor(leader.role_name);

              return (
                <div key={`${leader.role_name}-${leader.streamer.id}`} 
                     className={`bg-gradient-to-br from-${color}-900/20 to-${color}-800/20 border border-${color}-500/30 rounded-xl p-6`}>
                  <div className="text-center mb-4">
                    <div className="flex justify-center mb-3">
                      <div className={`p-3 bg-${color}-400/10 rounded-full`}>
                        {roleImageUrl ? (
                          <img 
                            src={roleImageUrl} 
                            alt={`${leader.role_name} icon`} 
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <TrendingUp className={`w-8 h-8 text-${color}-400`} />
                        )}
                      </div>
                    </div>
                    <div className={`text-xl font-bold text-${color}-400 font-montserrat mb-1`}>
                      {leader.role_name}
                    </div>
                    <div className="text-lg font-bold text-white font-montserrat">
                      {leader.streamer.name}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400 font-montserrat">Partidas:</span>
                      <span className="text-sm text-rivalverso-white font-oswald">{Math.floor(leader.matches_played)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400 font-montserrat">Win Rate:</span>
                      <span className={`text-sm text-${color}-400 font-oswald`}>{leader.win_rate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400 font-montserrat">KDA:</span>
                      <span className="text-sm text-rivalverso-green font-oswald">{leader.kda_ratio.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
