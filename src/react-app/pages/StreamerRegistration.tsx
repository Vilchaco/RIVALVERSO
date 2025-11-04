import { useState } from "react";
import { useNavigate } from "react-router";
import { UserPlus, CheckCircle, AlertCircle, ExternalLink, Users, Shield, Clock, Gamepad2, User } from "lucide-react";

interface RegistrationData {
  name: string;
  ingame_username: string;
  twitch_username: string;
  youtube_username: string;
  twitter_username: string;
  instagram_username: string;
  tiktok_username: string;
}

interface ValidationResult {
  success: boolean;
  player?: {
    username: string;
    uuid: string;
    // Solo verificación ligera - no incluye rango, partidas, etc.
    _lightVerification?: boolean;
  };
  error?: string;
}

export default function StreamerRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegistrationData>({
    name: "",
    ingame_username: "",
    twitch_username: "",
    youtube_username: "",
    twitter_username: "",
    instagram_username: "",
    tiktok_username: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation when IGN changes
    if (field === 'ingame_username') {
      setValidationResult(null);
    }
  };

  const validateMarvelRivalsAccount = async () => {
    if (!formData.ingame_username.trim()) {
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // NUEVO: Usar endpoint ligero que solo verifica existencia con UID
      const response = await fetch(`/api/verify-player/${encodeURIComponent(formData.ingame_username)}`);
      const data = await response.json();

      if (data.success && data.player) {
        setValidationResult({
          success: true,
          player: {
            username: data.player.username,
            uuid: data.player.uuid,
            _lightVerification: data.player._lightVerification
          }
        });
      } else {
        setValidationResult({
          success: false,
          error: data.error || 'No se pudo verificar la cuenta de Marvel Rivals'
        });
      }
    } catch (error) {
      setValidationResult({
        success: false,
        error: 'Error de conexión al verificar la cuenta'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setSubmitResult({ success: false, message: 'El nombre del streamer es obligatorio' });
      return;
    }

    if (!formData.ingame_username.trim()) {
      setSubmitResult({ success: false, message: 'El IGN de Marvel Rivals es obligatorio' });
      return;
    }

    if (!validationResult?.success) {
      setSubmitResult({ success: false, message: 'Debes verificar tu cuenta de Marvel Rivals antes de registrarte' });
      return;
    }

    // At least one social media account required
    const socialAccounts = [
      formData.twitch_username,
      formData.youtube_username,
      formData.twitter_username,
      formData.instagram_username,
      formData.tiktok_username
    ].filter(account => account.trim() !== '');

    if (socialAccounts.length === 0) {
      setSubmitResult({ success: false, message: 'Debes proporcionar al menos una red social' });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/register-streamer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitResult({ 
          success: true, 
          message: '¡Registro exitoso! Has sido añadido al Marvel Rivals SoloQ Challenge.' 
        });
        
        // Clear form
        setFormData({
          name: "",
          ingame_username: "",
          twitch_username: "",
          youtube_username: "",
          twitter_username: "",
          instagram_username: "",
          tiktok_username: ""
        });
        setValidationResult(null);
      } else {
        setSubmitResult({
          success: false,
          message: data.error || 'Error durante el registro'
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Error de conexión. Por favor intenta de nuevo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: "url('https://mocha-cdn.com/0199440f-b65f-7cab-a552-eca69173e4c7/Back-rivals.png')"
          }}
        />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rivalverso-purple-light rounded-2xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-rivalverso-black" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-rivalverso-green font-bebas text-center">
                ÚNETE AL CHALLENGE
              </h1>
            </div>
            
            <p className="text-lg sm:text-xl text-gray-300 font-montserrat mb-6 sm:mb-8 leading-relaxed px-4">
              Regístrate en el <span className="text-rivalverso-green font-bold">RIVALVERSO Challenge</span> y 
              compite contra otros streamers para demostrar quién tiene las mejores habilidades en ranked.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                  <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 font-montserrat">Solo Queue</h3>
                <p className="text-gray-400 text-sm font-montserrat">
                  Compite en ranked individual para demostrar tu skill personal
                </p>
              </div>
              
              <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 font-montserrat">Comunidad</h3>
                <p className="text-gray-400 text-sm font-montserrat">
                  Forma parte de una competencia épica entre streamers
                </p>
              </div>
              
              <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 font-montserrat">Tiempo Real</h3>
                <p className="text-gray-400 text-sm font-montserrat">
                  Seguimiento en vivo de rankings y estadísticas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-4 sm:p-8">
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-rivalverso-purple-light rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-rivalverso-black" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-montserrat">Formulario de Registro</h2>
              <p className="text-gray-400 font-montserrat text-sm sm:text-base">Completa tu información para unirte al challenge</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-rivalverso-green mb-3 sm:mb-4 font-montserrat">📋 Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                    Nombre del Streamer *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Tu nombre como streamer"
                    className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-rivalverso-purple-light transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                    IGN Marvel Rivals *
                  </label>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={formData.ingame_username}
                        onChange={(e) => handleInputChange('ingame_username', e.target.value)}
                        placeholder="Tu nombre en Marvel Rivals"
                        className="flex-1 px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-rivalverso-purple-light transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={validateMarvelRivalsAccount}
                        disabled={isValidating || !formData.ingame_username.trim()}
                        className="px-3 sm:px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold font-montserrat transition-colors text-sm sm:text-base whitespace-nowrap"
                      >
                        {isValidating ? 'Verificando...' : 'Verificar'}
                      </button>
                    </div>
                    
                    {validationResult && (
                      <div className={`p-3 rounded-lg border ${
                        validationResult.success 
                          ? 'bg-green-900/20 border-green-500/30 text-green-400' 
                          : 'bg-red-900/20 border-red-500/30 text-red-400'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {validationResult.success ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <AlertCircle className="w-4 h-4" />
                          )}
                          <span className="font-semibold">
                            {validationResult.success ? 'Cuenta verificada' : 'Error de verificación'}
                          </span>
                        </div>
                        {validationResult.success && validationResult.player ? (
                          <div className="text-sm space-y-1">
                            <div>✅ Jugador encontrado: {validationResult.player.username}</div>
                            <div>🆔 UUID verificado: {validationResult.player.uuid}</div>
                            {validationResult.player._lightVerification && (
                              <div className="text-green-300 text-xs mt-2 italic">
                                ⚡ Verificación rápida completada - IGN válido en Marvel Rivals
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">{validationResult.error}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-rivalverso-green mb-3 sm:mb-4 font-montserrat">🌐 Redes Sociales</h3>
              <p className="text-gray-400 text-sm mb-3 sm:mb-4 font-montserrat">
                * Al menos una red social es obligatoria para contacto y verificación
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                    🟣 Twitch (Recomendado)
                  </label>
                  <input
                    type="text"
                    value={formData.twitch_username}
                    onChange={(e) => handleInputChange('twitch_username', e.target.value)}
                    placeholder="tu_usuario_twitch"
                    className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                    🔴 YouTube
                  </label>
                  <input
                    type="text"
                    value={formData.youtube_username}
                    onChange={(e) => handleInputChange('youtube_username', e.target.value)}
                    placeholder="tu_canal_youtube"
                    className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-red-400 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                    ⚫ X (Twitter)
                  </label>
                  <input
                    type="text"
                    value={formData.twitter_username}
                    onChange={(e) => handleInputChange('twitter_username', e.target.value)}
                    placeholder="tu_usuario_x"
                    className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                    🟠 Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.instagram_username}
                    onChange={(e) => handleInputChange('instagram_username', e.target.value)}
                    placeholder="tu_usuario_instagram"
                    className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-pink-400 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 font-montserrat">
                    🎵 TikTok
                  </label>
                  <input
                    type="text"
                    value={formData.tiktok_username}
                    onChange={(e) => handleInputChange('tiktok_username', e.target.value)}
                    placeholder="tu_usuario_tiktok"
                    className="w-full px-3 sm:px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-montserrat focus:outline-none focus:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit Result */}
            {submitResult && (
              <div className={`p-4 rounded-lg border ${
                submitResult.success 
                  ? 'bg-green-900/20 border-green-500/30 text-green-400' 
                  : 'bg-red-900/20 border-red-500/30 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  {submitResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="font-semibold">{submitResult.message}</span>
                </div>
                {submitResult.success && (
                  <div className="mt-3 text-sm">
                    <p className="text-green-300">
                      📧 Recibirás una notificación cuando tu solicitud sea procesada.
                    </p>
                    <p className="text-green-300 mt-1">
                      ⏰ Las solicitudes se revisan habitualmente en menos de 24 horas.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold font-montserrat transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Challenge
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || !validationResult?.success}
                className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-rivalverso-green hover:bg-rivalverso-green-light disabled:bg-gray-600 disabled:cursor-not-allowed text-black hover:text-black disabled:text-gray-300 font-bold rounded-lg font-montserrat transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Unirse al Challenge
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Requirements Section */}
        <div className="mt-8 sm:mt-12 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-blue-400 font-montserrat">Requisitos del Challenge</h3>
          </div>
          <div className="space-y-2 text-blue-300 font-montserrat text-sm">
            <p>• <strong>Cuenta pública:</strong> Tu perfil de Marvel Rivals debe ser público para verificación automática</p>
            <p>• <strong>Solo Queue:</strong> Solo se contabilizan partidas de ranked individual</p>
            <p>• <strong>Streaming:</strong> Se recomienda hacer stream de tus partidas para mayor engagement</p>
            <p>• <strong>Fair Play:</strong> No se permiten duos, tríos o cualquier tipo de colaboración en ranked</p>
            <p>• <strong>Verificación:</strong> Los administradores pueden verificar las cuentas en cualquier momento</p>
          </div>
        </div>
      </div>
    </div>
  );
}
