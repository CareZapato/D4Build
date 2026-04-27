import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, CreditCard, TrendingUp, Calendar, 
  DollarSign, Save, Eye, EyeOff, Shield, Crown, Activity,
  Clock, CheckCircle, XCircle, AlertCircle, FlaskConical
} from 'lucide-react';
import { ProfileAPIService, ProfileData, UsageHistory } from '../../services/ApiService';
import { useAuth } from '../../context/AuthContext';

type TabView = 'profile' | 'usage' | 'history' | 'subscription';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, isPremium, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabView>('profile');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageHistory | null>(null);
  
  // Profile edit state
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Subscription state
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'1_month' | '6_months' | '1_year'>('1_month');
  
  // Add credits state
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(5);
  
  // Pagination for history
  const [historyPage, setHistoryPage] = useState(0);
  const historyLimit = 20;

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (currentTab === 'history' && !usageHistory) {
      loadUsageHistory();
    }
  }, [currentTab]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await ProfileAPIService.getProfile();
      setProfileData(data);
      setUsername(data.user.username);
      setEmail(data.user.email);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      alert('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const loadUsageHistory = async (page: number = 0) => {
    try {
      const data = await ProfileAPIService.getUsageHistory(historyLimit, page * historyLimit);
      setUsageHistory(data);
      setHistoryPage(page);
    } catch (error) {
      console.error('Error cargando historial:', error);
      alert('Error al cargar historial de uso');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!username.trim() || !email.trim()) {
        alert('Username y email son requeridos');
        return;
      }
      
      await ProfileAPIService.updateProfile({ username, email });
      await refreshUser();
      await loadProfile();
      setEditMode(false);
      alert('Perfil actualizado exitosamente');
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      alert(error.response?.data?.error || 'Error al actualizar perfil');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Todos los campos son requeridos');
        return;
      }

      if (newPassword !== confirmPassword) {
        alert('Las contraseñas nuevas no coinciden');
        return;
      }

      if (newPassword.length < 6) {
        alert('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }

      await ProfileAPIService.changePassword(currentPassword, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      alert('Contraseña actualizada exitosamente');
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      alert(error.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  const handleSubscribe = async () => {
    try {
      const isExtension = profileData?.subscription?.status === 'active';
      
      if (isExtension) {
        await ProfileAPIService.extendSubscription(selectedPlan);
        alert('Suscripción extendida exitosamente');
      } else {
        await ProfileAPIService.subscribe(selectedPlan);
        alert('Suscripción activada exitosamente');
      }
      
      await refreshUser();
      await loadProfile();
      setShowSubscribeModal(false);
    } catch (error: any) {
      console.error('Error en suscripción:', error);
      alert(error.response?.data?.error || 'Error al procesar suscripción');
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
      await loadProfile();
      setShowAddCreditsModal(false);
      alert(`Créditos agregados exitosamente! Se agregaron $${(creditAmount * 0.8).toFixed(2)} a tu balance.`);
    } catch (error: any) {
      console.error('Error agregando créditos:', error);
      alert(error.response?.data?.error || 'Error al agregar créditos');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isSubscriptionExpiringSoon = () => {
    if (!profileData?.subscription?.expires_at) return false;
    const expiresAt = new Date(profileData.subscription.expires_at);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-d4-accent text-xl">Cargando perfil...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-xl">Error al cargar perfil</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-d4-gold mb-2">Mi Perfil</h1>
        <p className="text-gray-400">Gestiona tu cuenta y consulta tu uso de D4Builds</p>
      </div>

      {/* Account Type Badge */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
          profileData.user.account_type === 'Premium' 
            ? 'bg-gradient-to-r from-yellow-600 to-orange-600' 
            : 'bg-gray-700'
        }`}>
          {profileData.user.account_type === 'Premium' ? <Crown size={20} /> : <User size={20} />}
          <span className="font-semibold">{profileData.user.account_type}</span>
        </div>
        
        {profileData.user.account_type === 'Premium' && (
          <>
            <div className="flex items-center gap-2 text-green-400">
              <DollarSign size={20} />
              <span className="font-semibold">Créditos: ${profileData.user.premium_balance.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowAddCreditsModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold"
            >
              <DollarSign size={18} />
              Recargar Créditos
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-d4-border">
        <button
          onClick={() => setCurrentTab('profile')}
          className={`px-4 py-2 font-semibold transition-colors ${
            currentTab === 'profile'
              ? 'text-d4-accent border-b-2 border-d4-accent'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <User size={18} />
            Perfil
          </div>
        </button>
        <button
          onClick={() => setCurrentTab('usage')}
          className={`px-4 py-2 font-semibold transition-colors ${
            currentTab === 'usage'
              ? 'text-d4-accent border-b-2 border-d4-accent'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            Análisis de Uso
          </div>
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          className={`px-4 py-2 font-semibold transition-colors ${
            currentTab === 'history'
              ? 'text-d4-accent border-b-2 border-d4-accent'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity size={18} />
            Historial
          </div>
        </button>
        <button
          onClick={() => setCurrentTab('subscription')}
          className={`px-4 py-2 font-semibold transition-colors ${
            currentTab === 'subscription'
              ? 'text-d4-accent border-b-2 border-d4-accent'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            Suscripción
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {currentTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Info Card */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-d4-gold">Información Personal</h2>
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-d4-accent text-d4-bg rounded hover:bg-opacity-90 transition-colors"
                >
                  Editar Perfil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setUsername(profileData.user.username);
                      setEmail(profileData.user.email);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  <User size={16} className="inline mr-2" />
                  Nombre de Usuario
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-d4-bg-secondary border border-d4-border rounded focus:border-d4-accent focus:outline-none text-white"
                  />
                ) : (
                  <div className="text-white text-lg">{profileData.user.username}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  <Mail size={16} className="inline mr-2" />
                  Email
                </label>
                {editMode ? (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-d4-bg-secondary border border-d4-border rounded focus:border-d4-accent focus:outline-none text-white"
                  />
                ) : (
                  <div className="text-white text-lg">{profileData.user.email}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  <Calendar size={16} className="inline mr-2" />
                  Miembro desde
                </label>
                <div className="text-white text-lg">{formatDate(profileData.user.created_at)}</div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <h2 className="text-xl font-bold text-d4-gold mb-4">Seguridad</h2>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Lock size={16} />
              Cambiar Contraseña
            </button>
          </div>
        </div>
      )}

      {currentTab === 'usage' && (
        <div className="space-y-6">
          {/* Usage Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Last Week */}
            <div className="card">
              <h3 className="text-lg font-semibold text-d4-gold mb-3 flex items-center gap-2">
                <Clock size={20} />
                Última Semana
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Solicitudes:</span>
                  <span className="text-white font-semibold">{profileData.usage.last_week.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Costo:</span>
                  <span className="text-green-400 font-semibold">${profileData.usage.last_week.cost.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Last Month */}
            <div className="card">
              <h3 className="text-lg font-semibold text-d4-gold mb-3 flex items-center gap-2">
                <Calendar size={20} />
                Último Mes
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Solicitudes:</span>
                  <span className="text-white font-semibold">{profileData.usage.last_month.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Costo:</span>
                  <span className="text-green-400 font-semibold">${profileData.usage.last_month.cost.toFixed(4)}</span>
                </div>
              </div>
            </div>

            {/* Last Year */}
            <div className="card">
              <h3 className="text-lg font-semibold text-d4-gold mb-3 flex items-center gap-2">
                <TrendingUp size={20} />
                Último Año
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Solicitudes:</span>
                  <span className="text-white font-semibold">{profileData.usage.last_year.requests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Costo:</span>
                  <span className="text-green-400 font-semibold">${profileData.usage.last_year.cost.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Usage */}
          <div className="card">
            <h3 className="text-xl font-bold text-d4-gold mb-4">Uso Total</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-d4-bg-secondary rounded-lg">
                <div className="text-gray-400 mb-1">Total de Solicitudes</div>
                <div className="text-3xl font-bold text-white">{profileData.usage.total_requests}</div>
              </div>
              <div className="p-4 bg-d4-bg-secondary rounded-lg">
                <div className="text-gray-400 mb-1">Costo Total</div>
                <div className="text-3xl font-bold text-green-400">${profileData.usage.total_cost.toFixed(4)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'history' && (
        <div className="card">
          <h2 className="text-xl font-bold text-d4-gold mb-4">Historial de Uso</h2>
          
          {!usageHistory ? (
            <div className="text-center py-8 text-gray-400">Cargando historial...</div>
          ) : usageHistory.history.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No hay historial de uso</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-d4-border">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Fecha</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Tipo</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-semibold">Costo</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usageHistory.history.map((item) => (
                      <tr key={item.id} className="border-b border-d4-border hover:bg-d4-bg-secondary transition-colors">
                        <td className="py-3 px-4 text-white">
                          {new Date(item.created_at).toLocaleString('es-ES')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.action_type === 'subscription' || item.action_type === 'subscription_extension'
                              ? 'bg-purple-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}>
                            {item.action_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-green-400 font-semibold">
                          ${item.cost.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {item.metadata && typeof item.metadata === 'object' 
                            ? JSON.stringify(item.metadata).substring(0, 50) + '...'
                            : '-'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usageHistory.total > historyLimit && (
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-gray-400 text-sm">
                    Mostrando {historyPage * historyLimit + 1} - {Math.min((historyPage + 1) * historyLimit, usageHistory.total)} de {usageHistory.total}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadUsageHistory(historyPage - 1)}
                      disabled={historyPage === 0}
                      className="px-3 py-1 bg-d4-bg-secondary text-white rounded hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => loadUsageHistory(historyPage + 1)}
                      disabled={(historyPage + 1) * historyLimit >= usageHistory.total}
                      className="px-3 py-1 bg-d4-bg-secondary text-white rounded hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {currentTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Subscription */}
          {profileData.subscription && profileData.subscription.status !== 'none' ? (
            <div className="card">
              <h2 className="text-xl font-bold text-d4-gold mb-4">Suscripción Actual</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {profileData.subscription.status === 'active' ? (
                    <CheckCircle size={24} className="text-green-500" />
                  ) : (
                    <XCircle size={24} className="text-red-500" />
                  )}
                  <div>
                    <div className="text-lg font-semibold text-white">
                      Plan {getPlanLabel(profileData.subscription.plan_type)}
                    </div>
                    <div className={`text-sm ${
                      profileData.subscription.status === 'active' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {profileData.subscription.status === 'active' ? 'Activa' : 'Expirada'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-d4-border">
                  <div>
                    <div className="text-gray-400 text-sm">Inicio</div>
                    <div className="text-white font-semibold">{formatDate(profileData.subscription.start_date)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Vencimiento</div>
                    <div className="text-white font-semibold">{formatDate(profileData.subscription.expires_at)}</div>
                  </div>
                </div>

                {isSubscriptionExpiringSoon() && (
                  <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded p-3 flex items-start gap-2">
                    <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-yellow-200 text-sm">
                      Tu suscripción está próxima a vencer. Considera extenderla para mantener tus beneficios Premium.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card bg-gradient-to-r from-yellow-900 to-orange-900 bg-opacity-20 border border-d4-gold">
              <div className="flex items-start gap-4">
                <Crown size={48} className="text-d4-gold flex-shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-d4-gold mb-2">Actualiza a Premium</h2>
                  <p className="text-gray-300 mb-4">
                    Desbloquea características exclusivas y créditos para consultas automáticas con IA.
                  </p>
                  <ul className="space-y-2 text-gray-300 mb-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-400" />
                      Análisis automáticos con IA
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-400" />
                      Créditos mensuales para consultas
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-400" />
                      Soporte prioritario
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Subscribe/Extend Button */}
          <div className="card">
            <h2 className="text-xl font-bold text-d4-gold mb-4">
              {profileData.subscription?.status === 'active' ? 'Extender Suscripción' : 'Contratar Premium'}
            </h2>
            <p className="text-gray-400 mb-4">
              {profileData.subscription?.status === 'active' 
                ? 'Extiende tu suscripción actual y recibe más créditos para IA.'
                : 'Selecciona un plan y obtén acceso a características Premium.'
              }
            </p>
            <button
              onClick={() => setShowSubscribeModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-colors font-semibold flex items-center gap-2"
            >
              <CreditCard size={20} />
              {profileData.subscription?.status === 'active' ? 'Extender Suscripción' : 'Contratar Ahora'}
            </button>
          </div>
        </div>
      )}



      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-d4-bg border border-d4-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-d4-gold mb-4">Cambiar Contraseña</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-d4-bg-secondary border border-d4-border rounded focus:border-d4-accent focus:outline-none text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-d4-bg-secondary border border-d4-border rounded focus:border-d4-accent focus:outline-none text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-d4-bg-secondary border border-d4-border rounded focus:border-d4-accent focus:outline-none text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-d4-bg border border-d4-border rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-d4-gold mb-4">
              {profileData.subscription?.status === 'active' ? 'Extender Suscripción' : 'Contratar Premium'}
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

            <div className="flex gap-2">
              <button
                onClick={handleSubscribe}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-colors font-semibold"
              >
                Confirmar
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
                    <div className="text-xs text-gray-400">+${(amount * 0.8).toFixed(2)} créditos</div>
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
              <div className="flex justify-between text-gray-300 text-sm mt-3 pt-3 border-t border-d4-border">
                <span>Balance actual:</span>
                <span className="font-semibold text-white">${profileData?.user.premium_balance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300 text-sm">
                <span>Nuevo balance:</span>
                <span className="font-semibold text-green-400">${(profileData ? profileData.user.premium_balance + (creditAmount * 0.8) : 0).toFixed(2)}</span>
              </div>
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
    </div>
  );
};
