import { useState, useEffect, useCallback } from 'react';
import { WorkspaceService } from './services/WorkspaceService';
import { Personaje } from './types';
import { AppProvider, useAppContext } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import './index.css';

// Componentes
import WorkspaceSelector from './components/layout/WorkspaceSelector';
import Sidebar from './components/layout/Sidebar';
import CharacterList from './components/characters/CharacterList';
import CharacterDetail from './components/characters/CharacterDetail';
import HeroManager from './components/heroes/HeroManager';
import PromptGenerator from './components/prompts/PromptGenerator';
import { TagsManager } from './components/tags/TagsManager';
import WorldManager from './components/world/WorldManager';
import RunesGemsSection from './components/runes/RunesGemsSection';
import BillingPanel from './components/common/BillingPanel';
import LoginPage from './components/auth/LoginPage';
import PremiumPage from './components/premium/PremiumPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfilePage } from './components/profile/ProfilePage';

type View = 'characters' | 'heroes' | 'search' | 'prompts' | 'tags' | 'runes-gems' | 'premium' | 'admin' | 'profile' | 'mundo';

function AppContent() {
  const { user, loading: authLoading, isPremium } = useAuth();
  const [currentView, setCurrentView] = useState<View>('characters');
  const [loading, setLoading] = useState(false);
  const {
    workspaceLoaded,
    setWorkspaceLoaded,
    personajes,
    setPersonajes,
    selectedPersonaje,
    setSelectedPersonaje,
  } = useAppContext();

  // Definir todos los hooks ANTES de cualquier return condicional
  const loadPersonajes = useCallback(async () => {
    setLoading(true);
    try {
      const chars = await WorkspaceService.listPersonajes();
      setPersonajes(chars);
    } catch (error) {
      console.error('Error cargando personajes:', error);
    } finally {
      setLoading(false);
    }
  }, [setPersonajes]);

  useEffect(() => {
    if (workspaceLoaded) {
      loadPersonajes();
    }
  }, [workspaceLoaded, loadPersonajes]);

  // Ahora sí, returns condicionales DESPUÉS de todos los hooks
  // Si está cargando la autenticación, mostrar pantalla de carga
  if (authLoading) {
    return (
      <div className="min-h-screen bg-d4-bg flex items-center justify-center">
        <div className="text-d4-accent text-xl font-bold">
          Cargando...
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar página de login
  if (!user) {
    return <LoginPage />;
  }

  const handleWorkspaceLoaded = () => {
    setWorkspaceLoaded(true);
  };

  const handlePersonajeSelect = (personaje: Personaje) => {
    setSelectedPersonaje(personaje);
  };

  const handlePersonajeUpdate = async () => {
    await loadPersonajes();
    // Recargar el personaje seleccionado con los datos actualizados
    if (selectedPersonaje) {
      try {
        const chars = await WorkspaceService.listPersonajes();
        const updatedPersonaje = chars.find(p => p.id === selectedPersonaje.id);
        if (updatedPersonaje) {
          setSelectedPersonaje(updatedPersonaje);
        }
      } catch (error) {
        console.error('Error recargando personaje seleccionado:', error);
      }
    }
  };

  const renderContent = () => {
    if (!workspaceLoaded) {
      return <WorkspaceSelector onWorkspaceLoaded={handleWorkspaceLoaded} />;
    }

    switch (currentView) {
      case 'characters':
        return selectedPersonaje ? (
          <CharacterDetail 
            personaje={selectedPersonaje} 
            onBack={() => setSelectedPersonaje(null)}
            onUpdate={handlePersonajeUpdate}
          />
        ) : (
          <CharacterList 
            personajes={personajes} 
            onSelect={handlePersonajeSelect}
            onUpdate={loadPersonajes}
            loading={loading}
          />
        );
      case 'heroes':
        return <HeroManager />;
      case 'mundo':
        // Bloquear acceso a usuarios Basic
        if (!isPremium()) {
          return <PremiumPage />;
        }
        return <WorldManager />;
      case 'prompts':
        return <PromptGenerator personajes={personajes} />;
      case 'tags':
        return <TagsManager />;
      case 'runes-gems':
        return <RunesGemsSection />;
      case 'premium':
        return <PremiumPage />;
      case 'admin':
        return <AdminPanel />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <div className="text-d4-text">Vista en construcción</div>;
    }
  };

  return (
    <div className="min-h-screen bg-d4-bg flex">
      {workspaceLoaded && (
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      )}
      
      <main className="flex-1 overflow-auto relative">
        <div className="container mx-auto p-6 max-w-7xl">
          {renderContent()}
        </div>
      </main>
      
      {/* Panel de Billing (desactivable con botón) */}
      {workspaceLoaded && <BillingPanel />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
