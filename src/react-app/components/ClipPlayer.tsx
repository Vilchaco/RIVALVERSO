import { useState, useEffect } from "react";
import { Play, X, Volume2, VolumeX } from "lucide-react";

interface ClipPlayerProps {
  clip: {
    id: number;
    title: string;
    embed_url: string;
    thumbnail_url?: string;
    duration: number;
    broadcaster_name: string;
  };
  autoplay?: boolean;
  onClose?: () => void;
  className?: string;
}

export default function ClipPlayer({ 
  clip, 
  autoplay = false, 
  onClose, 
  className = "" 
}: ClipPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  // Construir URL del embed según las mejores prácticas de Twitch
  const embedUrl = `${clip.embed_url}&autoplay=${isPlaying}&muted=${isMuted}`;

  const handlePlay = () => {
    setIsPlaying(true);
    setShowPlayer(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setShowPlayer(false);
    onClose?.();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Auto-play si está habilitado
  useEffect(() => {
    if (autoplay) {
      handlePlay();
    }
  }, [autoplay]);

  if (!showPlayer) {
    return (
      <div className={`relative group cursor-pointer ${className}`}>
        {/* Thumbnail con botón play */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {clip.thumbnail_url ? (
            <img 
              src={clip.thumbnail_url} 
              alt={clip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Play className="w-16 h-16 text-gray-600" />
            </div>
          )}
          
          {/* Overlay con botón play */}
          <div 
            className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors"
            onClick={handlePlay}
          >
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
              <Play className="w-8 h-8 text-black ml-1" />
            </div>
          </div>
        </div>

        {/* Info del clip */}
        <div className="mt-3">
          <h3 className="font-bold text-white text-sm line-clamp-2 font-montserrat">
            {clip.title}
          </h3>
          <p className="text-gray-400 text-xs font-montserrat mt-1">
            {clip.broadcaster_name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Header con controles */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          
          <div className="text-white">
            <p className="font-bold text-sm font-montserrat">{clip.title}</p>
            <p className="text-gray-300 text-xs font-montserrat">{clip.broadcaster_name}</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={handleClose}
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Iframe del clip según documentación oficial de Twitch */}
      <div className="aspect-video">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          allowFullScreen
          className="border-0"
          style={{ 
            minWidth: '300px', 
            minHeight: '200px' 
          }}
          title={`Clip: ${clip.title} - ${clip.broadcaster_name}`}
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
}
