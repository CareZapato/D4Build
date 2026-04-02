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
    <aside className="w-72 bg-gradient-to-b from-d4-surface to-d4-bg border-r-2 border-d4-accent/30 flex flex-col shadow-2xl">
      <div className="p-6 border-b-2 border-d4-accent/40 bg-gradient-to-r from-d4-surface to-d4-bg relative overflow-hidden">
        {/* Efecto de brillo de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-d4-accent/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-d4-accent leading-tight tracking-wide drop-shadow-lg">
              D4 BUILDS
            </h1>
            <p className="text-sm text-d4-text-dim mt-1 uppercase tracking-widest font-semibold">
              Build Manager
            </p>
          </div>
          <button
            onClick={() => setShowChangelog(true)}
            className="mt-1 px-3 py-1.5 bg-gradient-to-r from-d4-accent/20 to-d4-accent/30 text-d4-accent text-xs font-bold rounded-md border-2 border-d4-accent/50 hover:bg-d4-accent/40 hover:border-d4-accent transition-all hover:scale-105 active:scale-95 shadow-lg"
            title="Ver registro de cambios"
          >
            v0.3.7
          </button>
        </div>
      </div>

      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />

      <nav className="flex-1 p-5">
        <ul className="space-y-3">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-lg transition-all duration-200 font-bold text-base uppercase tracking-wide ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-d4-accent to-d4-accent-hover text-black shadow-lg shadow-d4-accent/30 scale-105'
                    : 'text-d4-text hover:bg-d4-border/60 hover:scale-102 hover:shadow-md'
                }`}
              >
                <item.icon className={`w-6 h-6 ${currentView === item.id ? 'drop-shadow-md' : ''}`} />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-5 border-t-2 border-d4-accent/40 bg-gradient-to-t from-d4-bg to-transparent">
        <div className="text-sm text-d4-text-dim">
          <p className="mb-2 uppercase tracking-wide font-semibold text-xs">Workspace</p>
          <p className="font-mono text-d4-accent truncate text-base font-bold bg-d4-bg/50 px-3 py-2 rounded-md border border-d4-accent/30">
            {localStorage.getItem('workspaceName') || 'Sin workspace'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
