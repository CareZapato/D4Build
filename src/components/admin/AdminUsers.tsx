import { useState, useEffect } from 'react';
import { AdminAPIService, AdminUser, AdminStats } from '../../services/ApiService';
import { Users, Shield, DollarSign, Search, Edit2, Trash2, Key, RefreshCw, Crown, UserX, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminUsers = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangeOwnPasswordModal, setShowChangeOwnPasswordModal] = useState(false);
  
  // Estados para formularios
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    account_type: 'Basic' as 'Basic' | 'Premium',
    is_active: true,
    is_admin: false,
  });
  
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  });

  const [ownPasswordForm, setOwnPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      window.location.href = '/';
      return;
    }
    loadUsers();
    loadStats();
  }, [currentPage, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await AdminAPIService.getUsers(currentPage, 20, searchQuery);
      setUsers(data.users);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await AdminAPIService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      account_type: user.account_type,
      is_active: user.is_active,
      is_admin: user.is_admin,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      await AdminAPIService.updateUser(selectedUser.id, editForm);
      showToast('Usuario actualizado exitosamente', 'success');
      setShowEditModal(false);
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error('Error actualizando usuario:', error);
      showToast(error.response?.data?.error || 'Error al actualizar usuario', 'error');
    }
  };

  const handleResetPassword = (user: AdminUser) => {
    setSelectedUser(user);
    setPasswordForm({ new_password: '', confirm_password: '' });
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!selectedUser) return;

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      await AdminAPIService.resetUserPassword(selectedUser.id, passwordForm.new_password);
      showToast('Contraseña actualizada exitosamente', 'success');
      setShowPasswordModal(false);
    } catch (error: any) {
      console.error('Error reseteando contraseña:', error);
      showToast(error.response?.data?.error || 'Error al resetear contraseña', 'error');
    }
  };

  const handleChangeOwnPassword = async () => {
    if (ownPasswordForm.new_password !== ownPasswordForm.confirm_password) {
      showToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (ownPasswordForm.new_password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      await AdminAPIService.changeOwnPassword(ownPasswordForm.current_password, ownPasswordForm.new_password);
      showToast('Tu contraseña ha sido cambiada exitosamente', 'success');
      setShowChangeOwnPasswordModal(false);
      setOwnPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      showToast(error.response?.data?.error || 'Error al cambiar contraseña', 'error');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`¿Desactivar usuario "${user.username}"? Esta acción se puede revertir.`)) {
      return;
    }

    try {
      await AdminAPIService.deleteUser(user.id);
      showToast('Usuario desactivado exitosamente', 'success');
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error('Error desactivando usuario:', error);
      showToast(error.response?.data?.error || 'Error al desactivar usuario', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-d4-accent" />
          <h1 className="text-3xl font-bold text-d4-accent">Panel de Administración</h1>
        </div>
        <button
          onClick={() => setShowChangeOwnPasswordModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-d4-card hover:bg-d4-card-hover rounded-lg border border-d4-border transition-colors"
        >
          <Key className="w-4 h-4" />
          <span>Cambiar mi Contraseña</span>
        </button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-d4-card p-4 rounded-lg border border-d4-border">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <span className="text-sm text-d4-text-secondary">Activos</span>
            </div>
            <p className="text-2xl font-bold text-d4-accent">{stats.users.active_users}</p>
          </div>
          
          <div className="bg-d4-card p-4 rounded-lg border border-d4-border">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-d4-text-secondary">Inactivos</span>
            </div>
            <p className="text-2xl font-bold text-d4-text">{stats.users.inactive_users}</p>
          </div>
          
          <div className="bg-d4-card p-4 rounded-lg border border-d4-border">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-d4-text-secondary">Premium</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{stats.users.premium_users}</p>
          </div>
          
          <div className="bg-d4-card p-4 rounded-lg border border-d4-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-d4-accent" />
              <span className="text-sm text-d4-text-secondary">Admins</span>
            </div>
            <p className="text-2xl font-bold text-d4-accent">{stats.users.admin_users}</p>
          </div>
          
          <div className="bg-d4-card p-4 rounded-lg border border-d4-border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-d4-text-secondary">Costo Total IA</span>
            </div>
            <p className="text-2xl font-bold text-emerald-500">${parseFloat(stats.billing.total_cost).toFixed(4)}</p>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-d4-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por nombre de usuario o email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full !pl-14 pr-4 py-2 bg-d4-card border border-d4-border rounded-lg text-d4-text placeholder-d4-text-secondary focus:outline-none focus:border-d4-accent"
          />
        </div>
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 px-4 py-2 bg-d4-card hover:bg-d4-card-hover rounded-lg border border-d4-border transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Recargar</span>
        </button>
      </div>

      {/* Tabla de Usuarios */}
      {loading ? (
        <div className="text-center py-12 text-d4-text-secondary">
          Cargando usuarios...
        </div>
      ) : (
        <>
          <div className="bg-d4-card rounded-lg border border-d4-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-d4-bg border-b border-d4-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-d4-text">Usuario</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-d4-text">Email</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-d4-text">Tipo</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-d4-text">Admin</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-d4-text">Estado</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-d4-text">Uso IA</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-d4-text">Costo</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-d4-text">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-d4-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-d4-bg transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-d4-text-secondary" />
                          <span className="text-d4-text font-medium">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-d4-text-secondary">{user.email}</td>
                      <td className="px-4 py-3 text-center">
                        {user.account_type === 'Premium' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-sm">
                            <Crown className="w-3 h-3" />
                            Premium
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-sm">
                            Basic
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.is_admin && (
                          <Shield className="w-5 h-5 text-d4-accent mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-500 rounded text-sm">
                            <UserCheck className="w-3 h-3" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-500 rounded text-sm">
                            <UserX className="w-3 h-3" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-d4-text">
                        {user.total_ai_requests || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-emerald-500 font-mono">
                        ${parseFloat(user.total_cost || '0').toFixed(4)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1 hover:bg-d4-card-hover rounded transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-1 hover:bg-d4-card-hover rounded transition-colors"
                            title="Resetear contraseña"
                          >
                            <Key className="w-4 h-4 text-yellow-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1 hover:bg-d4-card-hover rounded transition-colors"
                            title="Desactivar usuario"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-d4-card hover:bg-d4-card-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-d4-border transition-colors"
              >
                Anterior
              </button>
              <span className="text-d4-text">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-d4-card hover:bg-d4-card-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-d4-border transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de Edición */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-d4-card rounded-lg border border-d4-border max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-d4-accent">Editar Usuario</h3>
            
            <div>
              <label className="block text-sm text-d4-text-secondary mb-1">Nombre de usuario</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                className="w-full px-3 py-2 bg-d4-bg border border-d4-border rounded text-d4-text focus:outline-none focus:border-d4-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-d4-bg border border-d4-border rounded text-d4-text focus:outline-none focus:border-d4-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text-secondary mb-1">Tipo de cuenta</label>
              <select
                value={editForm.account_type}
                onChange={(e) => setEditForm({ ...editForm, account_type: e.target.value as 'Basic' | 'Premium' })}
                className="w-full px-3 py-2 bg-d4-bg border border-d4-border rounded text-d4-text focus:outline-none focus:border-d4-accent"
              >
                <option value="Basic">Basic</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-d4-text">Usuario activo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_admin}
                  onChange={(e) => setEditForm({ ...editForm, is_admin: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-d4-text">Administrador</span>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-d4-accent hover:bg-d4-accent/80 text-white rounded-lg transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-d4-bg hover:bg-d4-card-hover text-d4-text rounded-lg border border-d4-border transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resetear Contraseña */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-d4-card rounded-lg border border-d4-border max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-d4-accent">Resetear Contraseña</h3>
            <p className="text-d4-text-secondary">Usuario: <span className="text-d4-text font-semibold">{selectedUser.username}</span></p>
            
            <div>
              <label className="block text-sm text-d4-text-secondary mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="w-full px-3 py-2 bg-d4-bg border border-d4-border rounded text-d4-text focus:outline-none focus:border-d4-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text-secondary mb-1">Confirmar contraseña</label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="w-full px-3 py-2 bg-d4-bg border border-d4-border rounded text-d4-text focus:outline-none focus:border-d4-accent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSavePassword}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
              >
                Resetear
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 bg-d4-bg hover:bg-d4-card-hover text-d4-text rounded-lg border border-d4-border transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambiar Contraseña Propia */}
      {showChangeOwnPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-d4-card rounded-lg border border-d4-border max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-d4-accent">Cambiar mi Contraseña</h3>
            
            <div>
              <label className="block text-sm text-d4-text-secondary mb-1">Contraseña actual</label>
              <input
                type="password"
                value={ownPasswordForm.current_password}
                onChange={(e) => setOwnPasswordForm({ ...ownPasswordForm, current_password: e.target.value })}
                className="w-full px-3 py-2 bg-d4-bg border border-d4-border rounded text-d4-text focus:outline-none focus:border-d4-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text-secondary mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={ownPasswordForm.new_password}
                onChange={(e) => setOwnPasswordForm({ ...ownPasswordForm, new_password: e.target.value })}
                className="w-full px-3 py-2 bg-d4-bg border border-d4-border rounded text-d4-text focus:outline-none focus:border-d4-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-d4-text-secondary mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={ownPasswordForm.confirm_password}
                onChange={(e) => setOwnPasswordForm({ ...ownPasswordForm, confirm_password: e.target.value })}
                className="w-full px-3 py-2 bg-d4-bg border border-d4-border rounded text-d4-text focus:outline-none focus:border-d4-accent"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleChangeOwnPassword}
                className="flex-1 px-4 py-2 bg-d4-accent hover:bg-d4-accent/80 text-white rounded-lg transition-colors"
              >
                Cambiar Contraseña
              </button>
              <button
                onClick={() => {
                  setShowChangeOwnPasswordModal(false);
                  setOwnPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                }}
                className="flex-1 px-4 py-2 bg-d4-bg hover:bg-d4-card-hover text-d4-text rounded-lg border border-d4-border transition-colors"
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

export default AdminUsers;
