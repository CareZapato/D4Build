import React, { useState } from 'react';
import { Crown, Check, Sparkles, Zap, Eye, Target, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserService } from '../../services/ApiService';

const PremiumPage: React.FC = () => {
  const { user, isPremium, refreshUser } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setError('');
    setProcessing(true);

    try {
      // Simular proceso de pago (1 segundo)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Llamar al API para upgrade
      const response = await UserService.upgradeToPremium();
      
      console.log('✅ Upgrade exitoso:', response);
      
      // Refrescar datos del usuario
      await refreshUser();
      
      // Mostrar mensaje de éxito
      setShowSuccess(true);
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error('❌ Error en upgrade:', err);
      setError(err.response?.data?.message || 'Error al procesar el upgrade');
    } finally {
      setProcessing(false);
    }
  };

  // Si ya es Premium, mostrar pantalla de agradecimiento
  if (isPremium()) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center py-12">
          <div className="inline-block p-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full mb-6">
            <Crown className="w-16 h-16 text-yellow-300" />
          </div>
          
          <h1 className="text-4xl font-black text-d4-accent mb-4">
            ¡Eres Usuario Premium!
          </h1>
          
          <p className="text-d4-text-dim text-lg mb-8">
            Gracias por apoyar D4Builds. Tienes acceso completo a todas las funcionalidades.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="bg-d4-surface p-4 rounded-lg border border-d4-accent/30">
              <Sparkles className="w-8 h-8 text-d4-accent mx-auto mb-2" />
              <h3 className="font-bold text-d4-text mb-1">Captura AI</h3>
              <p className="text-sm text-d4-text-dim">OpenAI GPT-4o disponible</p>
            </div>
            
            <div className="bg-d4-surface p-4 rounded-lg border border-d4-accent/30">
              <Target className="w-8 h-8 text-d4-accent mx-auto mb-2" />
              <h3 className="font-bold text-d4-text mb-1">Prompts Avanzados</h3>
              <p className="text-sm text-d4-text-dim">Análisis completos sin límites</p>
            </div>
            
            <div className="bg-d4-surface p-4 rounded-lg border border-d4-accent/30">
              <Eye className="w-8 h-8 text-d4-accent mx-auto mb-2" />
              <h3 className="font-bold text-d4-text mb-1">Stats Completas</h3>
              <p className="text-sm text-d4-text-dim">Vista sin restricciones</p>
            </div>
            
            <div className="bg-d4-surface p-4 rounded-lg border border-d4-accent/30">
              <Zap className="w-8 h-8 text-d4-accent mx-auto mb-2" />
              <h3 className="font-bold text-d4-text mb-1">Futuras Features</h3>
              <p className="text-sm text-d4-text-dim">Acceso prioritario</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla para usuarios Basic
  return (
    <div className="max-w-6xl mx-auto">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-in slide-in-from-top">
          <Check className="w-6 h-6" />
          <span className="font-bold">¡Upgrade exitoso! Ahora eres Premium 🎉</span>
        </div>
      )}

      {/* Header */}
      <div className="card text-center mb-8">
        <div className="inline-block p-4 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full mb-4">
          <Crown className="w-12 h-12 text-yellow-300" />
        </div>
        
        <h1 className="text-4xl font-black text-d4-accent mb-3">
          Actualiza a Premium
        </h1>
        
        <p className="text-d4-text-dim text-lg max-w-2xl mx-auto">
          Desbloquea todo el potencial de D4Builds con funcionalidades exclusivas
        </p>
      </div>

      {/* Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Basic Plan */}
        <div className="card border-2 border-d4-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-d4-text">Basic</h2>
            <span className="px-3 py-1 bg-gray-600/30 text-gray-300 rounded-full text-sm font-bold">
              Gratis
            </span>
          </div>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text-dim">Gestión de personajes y builds</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text-dim">Habilidades, glifos y aspectos</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text-dim">Prompts básicos de IA</span>
            </li>
            <li className="flex items-start gap-3 opacity-50">
              <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text-dim line-through">Captura AI con OpenAI</span>
            </li>
            <li className="flex items-start gap-3 opacity-50">
              <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text-dim line-through">Prompts avanzados (comparativas)</span>
            </li>
            <li className="flex items-start gap-3 opacity-50">
              <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text-dim line-through">Stats completas en lista</span>
            </li>
          </ul>
        </div>

        {/* Premium Plan */}
        <div className="card border-4 border-yellow-500/50 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 relative overflow-hidden">
          {/* Badge destacado */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-full text-xs font-black uppercase tracking-wide">
            Recomendado
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-yellow-300">Premium</h2>
              <Crown className="w-6 h-6 text-yellow-300" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-yellow-300">$2.00</p>
              <p className="text-xs text-d4-text-dim">pago único</p>
            </div>
          </div>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text font-semibold">Todo lo de Basic</span>
            </li>
            <li className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text">Captura AI con OpenAI GPT-4o ($1 de crédito incluido)</span>
            </li>
            <li className="flex items-start gap-3">
              <Target className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text">Prompts avanzados sin límites</span>
            </li>
            <li className="flex items-start gap-3">
              <Eye className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text">Vista completa de estadísticas</span>
            </li>
            <li className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text">Análisis comparativos de builds</span>
            </li>
            <li className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span className="text-d4-text">Acceso anticipado a nuevas features</span>
            </li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={processing}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              processing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black hover:from-yellow-400 hover:to-amber-400 shadow-lg hover:shadow-xl hover:scale-105'
            }`}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                <span>Actualizar a Premium</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-400 text-center">
              {error}
            </p>
          )}

          <div className="mt-4 space-y-1">
            <p className="text-xs text-d4-text-dim text-center">
              💳 Sistema de pago ficticio - No se realizan cargos reales
            </p>
            <p className="text-xs text-yellow-400/80 text-center font-semibold">
              ⚡ Incluye $1 de crédito para consultas de IA
            </p>
          </div>
        </div>
      </div>

      {/* Features Detail */}
      <div className="card">
        <h2 className="text-2xl font-bold text-d4-accent mb-6 text-center">
          ¿Qué obtienes con Premium?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-block p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-3">
              <Sparkles className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="font-bold text-d4-text mb-2">Captura AI Avanzada</h3>
            <p className="text-sm text-d4-text-dim">
              Usa OpenAI GPT-4o para extraer datos de tus screenshots del juego automáticamente.
              Incluye $1 de crédito para aproximadamente 50-100 capturas.
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-block p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg mb-3">
              <Target className="w-8 h-8 text-green-300" />
            </div>
            <h3 className="font-bold text-d4-text mb-2">Análisis Completos</h3>
            <p className="text-sm text-d4-text-dim">
              Accede a prompts avanzados de comparación de builds y análisis externos
            </p>
          </div>
          
          <div className="text-center">
            <div className="inline-block p-3 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-lg mb-3">
              <Eye className="w-8 h-8 text-yellow-300" />
            </div>
            <h3 className="font-bold text-d4-text mb-2">Vista Sin Restricciones</h3>
            <p className="text-sm text-d4-text-dim">
              Visualiza todas las estadísticas de tus personajes sin blur ni limitaciones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
