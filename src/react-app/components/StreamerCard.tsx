import { StreamerType } from "@/shared/types";
import { ExternalLink, Twitch, Youtube, Twitter, Instagram, CircleDot, Music } from "lucide-react";

interface StreamerCardProps {
  streamer: StreamerType;
  position: number;
}

export default function StreamerCard({ streamer, position }: StreamerCardProps) {
  const winRate = streamer.games_played > 0 ? ((streamer.wins / streamer.games_played) * 100).toFixed(1) : "0.0";

  const getRankColor = (rank: string | null) => {
    if (!rank) return "text-gray-400";
    if (rank.includes("Diamante")) return "text-cyan-400";
    if (rank.includes("Platino")) return "text-emerald-400"; 
    if (rank.includes("Oro")) return "text-yellow-400";
    return "text-gray-400";
  };

  const getRankBorder = (rank: string | null) => {
    if (!rank) return "border-gray-600";
    if (rank.includes("Diamante")) return "border-cyan-500/30";
    if (rank.includes("Platino")) return "border-emerald-500/30";
    if (rank.includes("Oro")) return "border-yellow-500/30";
    return "border-gray-600";
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

  const getPositionBadge = (pos: number) => {
    if (pos === 1) return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-black";
    if (pos === 2) return "bg-gradient-to-r from-gray-400 to-gray-500 text-black";
    if (pos === 3) return "bg-gradient-to-r from-orange-500 to-orange-600 text-black";
    return "bg-gray-700 text-gray-300";
  };

  return (
    <div className={`relative bg-gray-900/80 backdrop-blur-sm border ${getRankBorder(streamer.rank)} rounded-xl p-6 hover:bg-gray-800/80 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
      {/* Position Badge */}
      <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full ${getPositionBadge(position)} flex items-center justify-center text-sm font-bold shadow-lg`}>
        {position}
      </div>

      {/* Live Indicator */}
      {streamer.is_live && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          <CircleDot className="w-3 h-3" />
          LIVE
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <img 
            src={streamer.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face"} 
            alt={streamer.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
          />
          {streamer.is_live && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-gray-900 animate-pulse" />
          )}
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-bold text-white truncate">{streamer.name}</h3>
            {streamer.is_live && streamer.stream_url && (
              <a 
                href={streamer.stream_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          
          <div className={`text-lg font-semibold mb-3 ${getRankColor(streamer.rank)} flex items-center gap-2`}>
            {getRankImageUrl(streamer.rank) && (
              <img 
                src={getRankImageUrl(streamer.rank)!} 
                alt={`${streamer.rank} icon`} 
                className="w-6 h-6 object-contain"
              />
            )}
            <div className="flex flex-col">
              <span>{streamer.rank || "Sin rango"}</span>
              {streamer.rank_score > 0 && (
                <span className="text-sm text-gray-400 font-oswald">
                  {streamer.rank_score.toLocaleString()} RS
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{Math.floor(streamer.games_played)}</div>
              <div className="text-xs text-gray-400">Partidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{Math.floor(streamer.wins)}</div>
              <div className="text-xs text-gray-400">Victorias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{winRate}%</div>
              <div className="text-xs text-gray-400">Winrate</div>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-3">
            {streamer.twitch_username && (
              <a 
                href={`https://twitch.tv/${streamer.twitch_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Twitch className="w-5 h-5" />
              </a>
            )}
            {streamer.youtube_username && (
              <a 
                href={`https://youtube.com/@${streamer.youtube_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            )}
            {streamer.twitter_username && (
              <a 
                href={`https://twitter.com/${streamer.twitter_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {streamer.instagram_username && (
              <a 
                href={`https://instagram.com/${streamer.instagram_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:text-pink-300 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            )}
            {streamer.tiktok_username && (
              <a 
                href={`https://tiktok.com/@${streamer.tiktok_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <Music className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
