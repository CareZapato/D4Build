// 🛡️ AdminPanel - Panel de Administración
// Agrupa todas las herramientas de administración

import { useState } from 'react';
import { Shield, Users, FlaskConical } from 'lucide-react';
import AdminUsers from './AdminUsers';
import { AdminTesting } from './AdminTesting';

type AdminTab = 'users' | 'testing';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <div className="space-y-6">
      {/* Header con Tabs */}
      <div className="card bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-2 border-d4-accent/30 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-slate-600/20 to-gray-600/20 border border-slate-500/30">
            <Shield className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-d4-text">Panel de Administración</h2>
            <p className="text-d4-text-dim mt-1">
              Herramientas avanzadas para administración y testing del sistema
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-d4-surface/50 text-d4-text-dim hover:bg-d4-surface'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Gestión de Usuarios
          </button>

          <button
            onClick={() => setActiveTab('testing')}
            className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
              activeTab === 'testing'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-d4-surface/50 text-d4-text-dim hover:bg-d4-surface'
            }`}
          >
            <FlaskConical className="w-4 h-4 inline mr-2" />
            Testing & Validación
          </button>
        </div>
      </div>

      {/* Contenido según Tab */}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'testing' && <AdminTesting />}
    </div>
  );
}
