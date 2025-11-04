import { StreamerType } from "@/shared/types";
import { CircleDot, ExternalLink, User } from "lucide-react";
import { useNavigate } from "react-router";

interface StreamerListItemProps {
  streamer: StreamerType;
  position: number;
}

export default function StreamerListItem({ streamer, position }: StreamerListItemProps) {
  const navigate = useNavigate();
  const winRate = streamer.games_played > 0 ? ((streamer.wins / streamer.games_played) * 100).toFixed(1) : "0.0";

  const getRankColor = (rank: string | null) => {
    if (!rank) return "text-gray-400";
    // One Above All - Rainbow/Supreme
    if (rank.includes("One Above All") || rank.includes("Uno Sobre Todos")) return "text-red-500";
    // Eternity - Purple/Pink
    if (rank.includes("Eternity") || rank.includes("Eternidad")) return "text-pink-400";
    // Celestial - Orange/Gold
    if (rank.includes("Celestial")) return "text-orange-400";
    // Grandmaster - Purple
    if (rank.includes("Grandmaster") || rank.includes("Gran Maestro")) return "text-rivalverso-purple-light";
    // Diamond - Cyan
    if (rank.includes("Diamond") || rank.includes("Diamante")) return "text-cyan-400";
    // Platinum - Emerald
    if (rank.includes("Platinum") || rank.includes("Platino")) return "text-emerald-400"; 
    // Gold - Yellow
    if (rank.includes("Gold") || rank.includes("Oro")) return "text-rivalverso-green";
    // Silver - Gray
    if (rank.includes("Silver") || rank.includes("Plata")) return "text-gray-300";
    // Bronze - Orange
    if (rank.includes("Bronze") || rank.includes("Bronce")) return "text-orange-500";
    return "text-gray-400";
  };

  const getRankGradient = (rank: string | null) => {
    if (!rank) return "from-gray-600 to-gray-700";
    // One Above All - Red/Rainbow gradient
    if (rank.includes("One Above All") || rank.includes("Uno Sobre Todos")) return "from-red-500 to-red-600";
    // Eternity - Purple/Pink gradient
    if (rank.includes("Eternity") || rank.includes("Eternidad")) return "from-pink-500 to-pink-600";
    // Celestial - Orange/Gold gradient
    if (rank.includes("Celestial")) return "from-orange-500 to-orange-600";
    // Grandmaster - Purple gradient
    if (rank.includes("Grandmaster") || rank.includes("Gran Maestro")) return "from-rivalverso-purple-light to-rivalverso-purple-dark";
    // Diamond - Cyan gradient
    if (rank.includes("Diamond") || rank.includes("Diamante")) return "from-cyan-500 to-cyan-600";
    // Platinum - Emerald gradient
    if (rank.includes("Platinum") || rank.includes("Platino")) return "from-emerald-500 to-emerald-600";
    // Gold - Green gradient
    if (rank.includes("Gold") || rank.includes("Oro")) return "from-rivalverso-green to-rivalverso-green-light";
    // Silver - Gray gradient
    if (rank.includes("Silver") || rank.includes("Plata")) return "from-gray-400 to-gray-500";
    // Bronze - Orange gradient
    if (rank.includes("Bronze") || rank.includes("Bronce")) return "from-orange-500 to-orange-600";
    return "from-gray-600 to-gray-700";
  };

  const getPositionStyle = (pos: number) => {
    if (pos === 1) return {
      background: "linear-gradient(135deg, #58d129, #6fe83f)",
      color: "#000000",
      border: "2px solid #58d129",
      boxShadow: "0 0 12px rgba(88, 209, 41, 0.6)"
    };
    if (pos === 2) return {
      background: "linear-gradient(135deg, #B3B3B3, #E5E5E5)",
      color: "#0C0C0C",
      border: "2px solid #B3B3B3",
      boxShadow: "0 0 8px rgba(179, 179, 179, 0.4)"
    };
    if (pos === 3) return {
      background: "linear-gradient(135deg, #891fd3, #b84ddb)",
      color: "#FFFFFF",
      border: "2px solid #891fd3",
      boxShadow: "0 0 8px rgba(137, 31, 211, 0.4)"
    };
    return {
      background: "#1A1A1A",
      color: "#B3B3B3",
      border: "1px solid #2F2F2F"
    };
  };

  const getRowBorder = (pos: number) => {
    if (pos === 1) return "border-rivalverso-green/50 shadow-rivalverso-green/20";
    if (pos === 2) return "border-gray-400/50 shadow-gray-400/20";
    if (pos === 3) return "border-rivalverso-purple-light/50 shadow-rivalverso-purple/20";
    return "border-gray-800";
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

  const positionStyle = getPositionStyle(position);

  return (
    <div 
      onClick={() => navigate(`/streamer/${encodeURIComponent(streamer.name)}`)}
      className={`relative bg-gradient-to-r from-rivalverso-black via-gray-950 to-rivalverso-black border ${getRowBorder(position)} rounded-xl p-3 sm:p-5 hover:bg-gradient-to-r hover:from-gray-900 hover:via-gray-850 hover:to-gray-900 transition-all duration-300 cursor-pointer hover:scale-102 hover:shadow-2xl group`}
    >
      {/* Rank Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getRankGradient(streamer.rank)} opacity-5 rounded-xl pointer-events-none`} />
      
      <div className="relative">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Position */}
          <div 
            className="w-14 h-14 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-lg font-bold flex-shrink-0 font-oswald shadow-lg"
            style={positionStyle}
          >
            {position}
          </div>

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`absolute inset-0 bg-gradient-to-r ${getRankGradient(streamer.rank)} rounded-xl blur-sm opacity-30`} />
            <img 
              src={streamer.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face"} 
              alt={streamer.name}
              className="relative w-20 h-20 sm:w-16 sm:h-16 rounded-xl object-cover border-2 border-gray-600 group-hover:border-gray-500 transition-colors"
            />
            {/* Removed avatar live indicator to avoid redundancy with the main live indicator */}
          </div>

          {/* Info Columns - Responsive Layout */}
          <div className="flex-1 min-w-0">
            
            {/* Desktop/Tablet Layout */}
            <div className="hidden sm:flex items-center gap-4 lg:gap-8">
              {/* Left Column: Name & IGN */}
              <div className="flex-shrink-0 min-w-0 w-48 lg:w-64">
                <div className="flex items-center gap-2 lg:gap-3 mb-2">
                  <h3 className="text-lg lg:text-xl font-bold text-white truncate font-montserrat group-hover:text-rivalverso-green transition-colors">{streamer.name}</h3>
                  {/* Live/Offline Indicator */}
                  <div className={`flex items-center gap-1 text-xs px-2 lg:px-3 py-1 rounded-full border font-semibold font-montserrat transition-all duration-200 ${
                    streamer.is_live 
                      ? 'bg-red-600/20 text-red-400 border-red-600/30 animate-pulse' 
                      : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                  }`}>
                    <CircleDot className="w-3 h-3" />
                    <span className="hidden lg:inline">{streamer.is_live ? 'LIVE' : 'OFFLINE'}</span>
                    <span className="lg:hidden">{streamer.is_live ? 'L' : 'OFF'}</span>
                  </div>
                </div>
                
                {/* IGN - Secondary Info */}
                {streamer.ingame_username && (
                  <div className="flex items-center gap-1 text-sm text-gray-400 font-montserrat">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{streamer.ingame_username}</span>
                  </div>
                )}
              </div>

              {/* Right Column: RANK */}
              <div className="flex-shrink-0 w-64 lg:w-80">
                <div className={`text-lg lg:text-xl font-bold font-montserrat ${getRankColor(streamer.rank)} flex items-center gap-3 lg:gap-4`}>
                  {/* Rank Icon */}
                  <div className="w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center">
                    {getRankImageUrl(streamer.rank) ? (
                      <img 
                        src={getRankImageUrl(streamer.rank)!} 
                        alt={`${streamer.rank} icon`} 
                        className="w-12 h-12 lg:w-16 lg:h-16 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Sin rango</span>
                      </div>
                    )}
                  </div>
                  {/* Rank Text */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-lg lg:text-xl truncate">{streamer.rank || "Sin rango"}</span>
                    {/* RS Points */}
                    {streamer.rank_score > 0 && (
                      <div className="text-sm text-gray-400 font-oswald">
                        {streamer.rank_score.toLocaleString()} RS
                      </div>
                    )}
                    {/* Position Change Indicator */}
                    {streamer.previous_position && streamer.previous_position !== position && (
                      <div className={`text-sm font-semibold ${
                        streamer.previous_position > position 
                          ? 'text-rivalverso-green' 
                          : 'text-red-400'
                      } flex items-center gap-1`}>
                        {streamer.previous_position > position ? '↗' : '↘'}
                        {streamer.previous_position > position 
                          ? `+${streamer.previous_position - position}` 
                          : `${position - streamer.previous_position}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden">
              {/* Top Row: Name + Live Status */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-white truncate font-montserrat group-hover:text-rivalverso-green transition-colors flex-1 mr-3">{streamer.name}</h3>
                <div className={`flex items-center gap-1 text-sm px-3 py-2 rounded-full border font-semibold font-montserrat transition-all duration-200 flex-shrink-0 ${
                  streamer.is_live 
                    ? 'bg-red-600/20 text-red-400 border-red-600/30 animate-pulse' 
                    : 'bg-gray-600/20 text-gray-400 border-gray-600/30'
                }`}>
                  <CircleDot className="w-4 h-4" />
                  <span>{streamer.is_live ? 'LIVE' : 'OFF'}</span>
                </div>
              </div>

              {/* Middle Row: Rank Info */}
              <div className="flex items-center gap-4 mb-3">
                {/* Rank Icon */}
                <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                  {getRankImageUrl(streamer.rank) ? (
                    <img 
                      src={getRankImageUrl(streamer.rank)!} 
                      alt={`${streamer.rank} icon`} 
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-sm">?</span>
                    </div>
                  )}
                </div>
                
                {/* Rank Text + Details */}
                <div className="flex-1 min-w-0">
                  <div className={`text-lg font-bold font-montserrat ${getRankColor(streamer.rank)} truncate`}>
                    {streamer.rank || "Sin rango"}
                  </div>
                  {/* RS Points */}
                  {streamer.rank_score > 0 && (
                    <div className="text-base text-gray-300 font-oswald">
                      {streamer.rank_score.toLocaleString()} RS
                    </div>
                  )}
                  {/* Position Change */}
                  {streamer.previous_position && streamer.previous_position !== position && (
                    <div className={`text-sm font-semibold ${
                      streamer.previous_position > position 
                        ? 'text-rivalverso-green' 
                        : 'text-red-400'
                    } flex items-center gap-1`}>
                      {streamer.previous_position > position ? '↗' : '↘'}
                      {streamer.previous_position > position 
                        ? `+${streamer.previous_position - position}` 
                        : `${position - streamer.previous_position}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: IGN + Stats */}
              <div className="flex items-center justify-between">
                {/* IGN */}
                {streamer.ingame_username && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 font-montserrat">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-[150px]">{streamer.ingame_username}</span>
                  </div>
                )}
                
                {/* Stats */}
                <div className="text-right">
                  <div className="text-lg font-bold text-white font-oswald">{winRate}%</div>
                  <div className="text-sm text-gray-300 font-montserrat">{Math.floor(streamer.wins)}/{Math.floor(streamer.games_played)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - Desktop */}
          <div className="hidden lg:flex items-center gap-12 text-center">
            <div className="w-20">
              <div className="text-xl font-bold text-rivalverso-purple-light font-oswald group-hover:scale-110 transition-transform">{Math.floor(streamer.games_played)}</div>
              <div className="text-xs text-gray-500 font-montserrat">Partidas</div>
            </div>
            <div className="w-20">
              <div className="text-xl font-bold text-white font-oswald group-hover:scale-110 transition-transform">{Math.floor(streamer.wins)}</div>
              <div className="text-xs text-gray-500 font-montserrat">Victorias</div>
            </div>
            <div className="w-24">
              <div className="text-xl font-bold text-white font-oswald group-hover:scale-110 transition-transform">{winRate}%</div>
              <div className="text-xs text-gray-500 font-montserrat">Winrate</div>
            </div>
          </div>

          {/* Stats - Tablet */}
          <div className="hidden md:flex lg:hidden items-center gap-8 text-center">
            <div className="w-20">
              <div className="text-lg font-bold text-rivalverso-purple-light font-oswald">{Math.floor(streamer.games_played)}</div>
              <div className="text-xs text-gray-500 font-montserrat">Partidas</div>
            </div>
            <div className="w-20">
              <div className="text-lg font-bold text-rivalverso-green font-oswald">{Math.floor(streamer.wins)}</div>
              <div className="text-xs text-gray-500 font-montserrat">Victorias</div>
            </div>
            <div className="w-20">
              <div className="text-lg font-bold text-white font-oswald">{winRate}%</div>
              <div className="text-xs text-gray-500 font-montserrat">Winrate</div>
            </div>
          </div>

          {/* Stats - Mobile (now handled in mobile layout above) */}

          {/* Quick Stream Link - Always present but only functional when live - Hidden on mobile */}
          <div className="hidden sm:flex flex-shrink-0">
            {streamer.is_live && streamer.stream_url ? (
              <a 
                href={streamer.stream_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 transition-all duration-200 p-3 hover:bg-red-600/10 rounded-xl hover:scale-110 group-hover:bg-red-600/5 block"
                onClick={(e) => e.stopPropagation()}
                title="Ver stream en vivo"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            ) : (
              <div className="p-3 opacity-0 pointer-events-none">
                <ExternalLink className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Mobile Stream Link - Positioned in live indicator */}
          {streamer.is_live && streamer.stream_url && (
            <div className="sm:hidden absolute top-3 right-3">
              <a 
                href={streamer.stream_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 transition-all duration-200 p-2 hover:bg-red-600/10 rounded-lg"
                onClick={(e) => e.stopPropagation()}
                title="Ver stream en vivo"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
