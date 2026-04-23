import React, { useState, useEffect } from 'react';
import { Users, Shield, Sparkles, Tag, Camera, Gem, User, LogOut, Crown, DollarSign, FolderOpen, RefreshCw, Plus, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BillingService } from '../../services/BillingService';
import { WorkspaceService } from '../../services/WorkspaceService';
import { useAppContext } from '../../context/AppContext';
import { ProfileAPIService } from '../../services/ApiService';
import ChangelogModal from '../ChangelogModal';
import ImageCaptureModal from '../common/ImageCaptureModal';

type View = 'characters' | 'heroes' | 'search' | 'prompts' | 'tags' | 'runes-gems' | 'premium' | 'admin' | 'profile' | 'mundo';

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<Props> = ({ currentView, onViewChange }) => {
  const { user, logout, isPremium, isAdmin, refreshUser } = useAuth();
  const { setPersonajes, setWorkspaceLoaded } = useAppContext();
  const [showChangelog, setShowChangelog] = useState(false);
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'1_month' | '6_months' | '1_year'>('1_month');
  const [creditAmount, setCreditAmount] = useState<number>(5);
  const [workspaceName, setWorkspaceName] = useState<string>('');
  const [changingWorkspace, setChangingWorkspace] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  // Cargar información de crédito al montar
  useEffect(() => {
    if (isPremium()) {
      BillingService.hasAvailableCredit().then(info => {
        setCreditInfo(info);
      });
    }
  }, [isPremium]);

  // Cargar nombre del workspace
  useEffect(() => {
    const name = localStorage.getItem('workspaceName') || 'Sin workspace';
    setWorkspaceName(name);
  }, []);

  const handleChangeWorkspace = async () => {
    if (changingWorkspace) return;
    
    try {
      setChangingWorkspace(true);
      
      // Seleccionar nuevo workspace
      await WorkspaceService.selectWorkspaceDirectory();
      
      // Actualizar nombre en el estado
      const newName = localStorage.getItem('workspaceName') || 'Sin workspace';
      setWorkspaceName(newName);
      
      // Limpiar personajes actuales
      setPersonajes([]);
      
      // Notificar que el workspace fue cambiado
      setWorkspaceLoaded(false);
      setTimeout(() => setWorkspaceLoaded(true), 100);
      
      alert('Workspace cambiado exitosamente');
    } catch (error) {
      console.error('Error cambiando workspace:', error);
      alert('Error al cambiar workspace. Asegúrate de dar permisos al navegador.');
    } finally {
      setChangingWorkspace(false);
    }
  };

  const handleAddCredits = async () => {
    try {
      if (!creditAmount || creditAmount < 1 || creditAmount > 100) {
        alert('El monto debe estar entre $1 y $100');
        return;
      }

      await ProfileAPIService.addCredits(creditAmount);
      await refreshUser();
      
      // Recargar info de créditos
      if (isPremium()) {
        const info = await BillingService.hasAvailableCredit();
        setCreditInfo(info);
      }
      
      setShowAddCreditsModal(false);
      alert(`Créditos agregados exitosamente! Se agregaron $${(creditAmount * 0.8).toFixed(2)} a tu balance.`);
    } catch (error: any) {
      console.error('Error agregando créditos:', error);
      alert(error.response?.data?.error || 'Error al agregar créditos');
    }
  };

  const handleSubscribe = async () => {
    try {
      const isExtension = user?.subscription_expires_at && new Date(user.subscription_expires_at) > new Date();
      
      if (isExtension) {
        await ProfileAPIService.extendSubscription(selectedPlan);
        alert('Suscripción extendida exitosamente');
      } else {
        await ProfileAPIService.subscribe(selectedPlan);
        alert('Suscripción activada exitosamente');
      }
      
      await refreshUser();
      
      // Recargar info de créditos
      if (isPremium()) {
        const info = await BillingService.hasAvailableCredit();
        setCreditInfo(info);
      }
      
      setShowSubscribeModal(false);
    } catch (error: any) {
      console.error('Error en suscripción:', error);
      alert(error.response?.data?.error || 'Error al procesar suscripción');
    }
  };

  const getPlanPrice = (plan: '1_month' | '6_months' | '1_year') => {
    switch (plan) {
      case '1_month': return { price: 5, credits: 4 };
      case '6_months': return { price: 25, credits: 20 };
      case '1_year': return { price: 45, credits: 36 };
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case '1_month': return '1 Mes';
      case '6_months': return '6 Meses';
      case '1_year': return '1 Año';
      default: return plan;
    }
  };

  const menuItems = [
    { id: 'characters' as View, icon: Users, label: 'Personajes' },
    { id: 'heroes' as View, icon: Shield, label: 'Héroes' },
    { id: 'mundo' as View, icon: MapPin, label: 'Mundo', premiumOnly: true },
    { id: 'runes-gems' as View, icon: Gem, label: 'Gemas/Runas' },
    { id: 'tags' as View, icon: Tag, label: 'Tags' },
    { id: 'prompts' as View, icon: Sparkles, label: 'Prompts' },
  ];

  const showPremiumButton = !isPremium();

  return (
    <aside className="w-72 h-screen bg-gradient-to-b from-d4-surface to-d4-bg border-r-2 border-d4-accent/30 flex flex-col shadow-2xl overflow-hidden sticky top-0 z-10">
      <div className="p-4 border-b-2 border-d4-accent/40 bg-gradient-to-r from-d4-surface to-d4-bg relative overflow-hidden flex-shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-d4-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-d4-accent leading-tight tracking-wide drop-shadow-lg">
              D4 BUILDS
            </h1>
            <div className="mt-2">
              <span className="season-text text-lg font-black uppercase tracking-wider drop-shadow-lg">
                ⚡ Temporada 13
              </span>
            </div>
            <p className="text-sm text-d4-text-dim mt-2 uppercase tracking-widest font-semibold">
              Build Manager
            </p>
            {user && (
              <div className="mt-2.5 flex items-center gap-2.5">
                <button
                  onClick={() => setShowSubscribeModal(true)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all hover:scale-105 cursor-pointer ${
                  isPremium()
                    ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20 hover:from-yellow-500/30 hover:to-amber-500/30'
                    : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border-2 border-gray-500/50 hover:from-gray-500/30 hover:to-gray-600/30'
                }`}
                  title={user.subscription_expires_at 
                    ? `Expira: ${new Date(user.subscription_expires_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} - Click para gestionar suscripción`
                    : isPremium() ? 'Cuenta Premium - Click para gestionar' : 'Cuenta Básica - Click para contratar Premium'
                  }
                >
                  {isPremium() ? (
                    <>
                      <Crown className="w-3.5 h-3.5" />
                      <span>Premium</span>
                    </>
                  ) : (
                    <span>Basic</span>
                  )}
                </button>
                {isPremium() && creditInfo && (
                  <button
                    onClick={() => setShowAddCreditsModal(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-2 border-green-500/50 hover:from-green-500/30 hover:to-emerald-500/30 transition-all cursor-pointer"
                    title="Click para recargar créditos"
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>${creditInfo.remaining.toFixed(2)}</span>
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowChangelog(true)}
            className="mt-0.5 px-3 py-1.5 bg-gradient-to-r from-d4-accent/20 to-d4-accent/30 text-d4-accent text-sm font-bold rounded-md border-2 border-d4-accent/50 hover:bg-d4-accent/40 hover:border-d4-accent transition-all hover:scale-105 active:scale-95 shadow-lg"
            title="Ver registro de cambios"
          >
            v0.8.2
          </button>
        </div>
      </div>

      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
      <ImageCaptureModal isOpen={showImageCapture} onClose={() => setShowImageCapture(false)} />

      <nav className="flex-1 p-4 overflow-y-auto min-h-0">
        <ul className="space-y-2.5">
          {menuItems.map(item => {
            const isPremiumItem = item.premiumOnly && !isPremium();
            return (
            <li key={item.id}>
              <button
                onClick={() => {
                  if (isPremiumItem) {
                    onViewChange('premium');
                  } else {
                    onViewChange(item.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-bold text-sm uppercase tracking-wide relative ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-d4-accent to-d4-accent-hover text-black shadow-lg shadow-d4-accent/30 scale-105'
                    : isPremiumItem
                    ? 'text-d4-text-dim hover:bg-d4-border/40 hover:scale-102 hover:shadow-md opacity-60'
                    : 'text-d4-text hover:bg-d4-border/60 hover:scale-102 hover:shadow-md'
                }`}
                title={isPremiumItem ? 'Requiere Premium' : ''}
              >
                <item.icon className={`w-5 h-5 ${currentView === item.id ? 'drop-shadow-md' : ''}`} />
                <span>{item.label}</span>
                {isPremiumItem && (
                  <Crown className="w-3.5 h-3.5 text-yellow-400 absolute top-1 right-1" />
                )}
              </button>
            </li>
            );
          })}
          
          {isAdmin() && (
            <li className="pt-2 border-t border-d4-border/50">
              <button
                onClick={() => onViewChange('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-bold text-sm uppercase tracking-wide ${
                  currentView === 'admin'
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30 scale-105'
                    : 'bg-gradient-to-r from-red-600/20 to-orange-600/20 text-red-300 border-2 border-red-500/50 hover:from-red-600/30 hover:to-orange-600/30 hover:scale-102'
                }`}
              >
                <Shield className={`w-5 h-5 ${currentView === 'admin' ? 'drop-shadow-md' : ''}`} />
                <span>Usuarios</span>
              </button>
            </li>
          )}
          
          {showPremiumButton && (
            <li className="pt-2 border-t border-d4-border/50">
              <button
                onClick={() => onViewChange('premium')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-bold text-sm uppercase tracking-wide ${
                  currentView === 'premium'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-lg shadow-yellow-500/30 scale-105'
                    : 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-2 border-yellow-500/50 hover:from-yellow-500/30 hover:to-amber-500/30 hover:scale-102'
                }`}
              >
                <Crown className={`w-5 h-5 ${currentView === 'premium' ? 'drop-shadow-md' : ''}`} />
                <span>Actualizar</span>
              </button>
            </li>
          )}
          
          <li className="pt-2 border-t border-d4-border/50">
            <button
              onClick={() => {
                if (!isPremium()) {
                  onViewChange('premium');
                } else {
                  setShowImageCapture(true);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-bold text-sm uppercase tracking-wide relative ${
                isPremium()
                  ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg hover:scale-105'
                  : 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-200 border-2 border-purple-500/40 hover:scale-105 opacity-70'
              }`}
              title={isPremium() ? '' : 'Requiere Premium'}
            >
              <Camera className="w-5 h-5 drop-shadow-md" />
              <span>Captura</span>
              {!isPremium() && (
                <Crown className="w-3.5 h-3.5 text-yellow-400 absolute top-1 right-1" />
              )}
            </button>
          </li>
        </ul>
      </nav>

      <div className="p-3 border-t-2 border-d4-accent/40 bg-gradient-to-t from-d4-bg to-transparent flex-shrink-0 space-y-3">
        <div className="text-xs text-d4-text-dim">
          <div className="flex items-center justify-between mb-1.5">
            <p className="uppercase tracking-wide font-semibold text-xs">Workspace</p>
            <button
              onClick={handleChangeWorkspace}
              disabled={changingWorkspace}
              className="text-d4-accent hover:text-d4-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cambiar workspace"
            >
              {changingWorkspace ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FolderOpen className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="font-mono text-d4-accent truncate text-sm font-bold bg-d4-bg/50 px-2.5 py-1.5 rounded-md border border-d4-accent/30">
            {workspaceName}
          </p>
        </div>

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-d4-surface border-2 border-d4-border hover:border-d4-accent/50 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-d4-accent to-d4-accent-hover flex items-center justify-center">
                <User className="w-4 h-4 text-black" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-d4-text group-hover:text-d4-accent transition-colors truncate">
                  {user.username}
                </p>
                <p className="text-[10px] text-d4-text-dim truncate">
                  {user.email}
                </p>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-d4-surface border-2 border-d4-accent/50 rounded-lg shadow-xl overflow-hidden z-20">
                <button
                  onClick={() => {
                    onViewChange('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-d4-text hover:bg-d4-accent hover:text-black transition-all font-semibold border-b border-d4-border"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Mi Perfil</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-d4-text hover:bg-d4-accent hover:text-black transition-all font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-d4-bg border border-d4-border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-d4-gold mb-4">
              {isPremium() ? 'Gestionar Suscripción Premium' : 'Contratar Premium'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* 1 Month Plan */}
              <div
                onClick={() => setSelectedPlan('1_month')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPlan === '1_month'
                    ? 'border-d4-accent bg-d4-accent bg-opacity-10'
                    : 'border-d4-border hover:border-gray-500'
                }`}
              >
                <div className="text-lg font-bold text-white mb-2">1 Mes</div>
                <div className="text-3xl font-bold text-d4-gold mb-2">$5</div>
                <div className="text-sm text-gray-400">+ $4 en créditos IA</div>
              </div>

              {/* 6 Months Plan */}
              <div
                onClick={() => setSelectedPlan('6_months')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                  selectedPlan === '6_months'
                    ? 'border-d4-accent bg-d4-accent bg-opacity-10'
                    : 'border-d4-border hover:border-gray-500'
                }`}
              >
                <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  Ahorra 17%
                </div>
                <div className="text-lg font-bold text-white mb-2">6 Meses</div>
                <div className="text-3xl font-bold text-d4-gold mb-2">$25</div>
                <div className="text-sm text-gray-400">+ $20 en créditos IA</div>
              </div>

              {/* 1 Year Plan */}
              <div
                onClick={() => setSelectedPlan('1_year')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                  selectedPlan === '1_year'
                    ? 'border-d4-accent bg-d4-accent bg-opacity-10'
                    : 'border-d4-border hover:border-gray-500'
                }`}
              >
                <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  Ahorra 25%
                </div>
                <div className="text-lg font-bold text-white mb-2">1 Año</div>
                <div className="text-3xl font-bold text-d4-gold mb-2">$45</div>
                <div className="text-sm text-gray-400">+ $36 en créditos IA</div>
              </div>
            </div>

            <div className="bg-d4-bg-secondary border border-d4-border rounded p-4 mb-6">
              <h4 className="font-semibold text-white mb-2">Beneficios Premium:</h4>
              <ul className="space-y-2 text-gray-300 mb-4">
                <li className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>Créditos para consultas de IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>Acceso ilimitado a todas las funciones</span>
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span>Soporte prioritario</span>
                </li>
              </ul>
              
              <div className="border-t border-d4-border pt-4">
                <h4 className="font-semibold text-white mb-2">Resumen:</h4>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>Plan seleccionado:</span>
                  <span className="font-semibold text-white">{getPlanLabel(selectedPlan)}</span>
                </div>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>Precio:</span>
                  <span className="font-semibold text-d4-gold">${getPlanPrice(selectedPlan).price}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Créditos IA:</span>
                  <span className="font-semibold text-green-400">${getPlanPrice(selectedPlan).credits}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubscribe}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-colors font-semibold"
              >
                {isPremium() ? 'Extender Suscripción' : 'Contratar Premium'}
              </button>
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showAddCreditsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-d4-bg border border-d4-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-d4-gold mb-4">Recargar Créditos</h3>
            
            <p className="text-gray-400 mb-6">
              Selecciona el monto a recargar. Recibirás el 80% del pago en créditos para consultas de IA.
            </p>

            <div className="space-y-4 mb-6">
              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-3">
                {[5, 10, 20].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCreditAmount(amount)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      creditAmount === amount
                        ? 'border-green-500 bg-green-500 bg-opacity-10'
                        : 'border-d4-border hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl font-bold text-white mb-1">${amount}</div>
                    <div className="text-xs text-gray-400">+${(amount * 0.8).toFixed(2)}</div>
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Monto personalizado ($1 - $100):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xl text-white font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="flex-1 px-4 py-2 bg-d4-bg-secondary border border-d4-border rounded focus:border-d4-accent focus:outline-none text-white text-xl font-semibold"
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Recibirás ${(creditAmount * 0.8).toFixed(2)} en créditos
                </p>
              </div>
            </div>

            <div className="bg-d4-bg-secondary border border-d4-border rounded p-4 mb-6">
              <h4 className="font-semibold text-white mb-2">Resumen:</h4>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>Monto a pagar:</span>
                <span className="font-semibold text-d4-gold">${creditAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300 mb-1">
                <span>Créditos que recibirás:</span>
                <span className="font-semibold text-green-400">${(creditAmount * 0.8).toFixed(2)}</span>
              </div>
              {user && user.premium_balance !== undefined && (
                <>
                  <div className="flex justify-between text-gray-300 text-sm mt-3 pt-3 border-t border-d4-border">
                    <span>Balance actual:</span>
                    <span className="font-semibold text-white">${user.premium_balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300 text-sm">
                    <span>Nuevo balance:</span>
                    <span className="font-semibold text-green-400">${(user.premium_balance + (creditAmount * 0.8)).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddCredits}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <DollarSign size={20} />
                Recargar ${creditAmount}
              </button>
              <button
                onClick={() => setShowAddCreditsModal(false)}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
