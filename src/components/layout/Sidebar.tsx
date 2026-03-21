import React, { useState } from 'react';
import { Users, Shield, Sparkles } from 'lucide-react';
import ChangelogModal from '../ChangelogModal';

type View = 'characters' | 'heroes' | 'search' | 'prompts';

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<Props> = ({ currentView, onViewChange }) => {
  const [showChangelog, setShowChangelog] = useState(false);

  const menuItems = [
    { id: 'characters' as View, icon: Users, label: 'Personajes' },
    { id: 'heroes' as View, icon: Shield, label: 'Héroes' },
    { id: 'prompts' as View, icon: Sparkles, label: 'Prompts' },
  ];

  return (
    <aside className="w-64 bg-d4-surface border-r border-d4-border flex flex-col">
      <div className="p-6 border-b border-d4-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-d4-accent leading-tight">D4 Builds</h1>
            <p className="text-xs text-d4-text-dim mt-1">Build Manager</p>
          </div>
          <button
            onClick={() => setShowChangelog(true)}
            className="mt-1 px-2 py-1 bg-d4-accent/20 text-d4-accent text-[10px] font-semibold rounded border border-d4-accent/40 hover:bg-d4-accent/30 hover:border-d4-accent/60 transition-all hover:scale-105 active:scale-95"
            title="Ver registro de cambios"
          >
            v0.1.1
          </button>
        </div>
      </div>

      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-d4-accent text-black font-semibold'
                    : 'text-d4-text hover:bg-d4-border'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-d4-border">
        <div className="text-xs text-d4-text-dim">
          <p className="mb-1">Workspace activo</p>
          <p className="font-mono text-d4-accent truncate">
            {localStorage.getItem('workspaceName') || 'Sin workspace'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
