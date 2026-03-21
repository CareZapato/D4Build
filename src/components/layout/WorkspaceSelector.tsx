import React, { useState } from 'react';
import { Folder, AlertCircle } from 'lucide-react';
import { WorkspaceService } from '../../services/WorkspaceService';

interface Props {
  onWorkspaceLoaded: () => void;
}

const WorkspaceSelector: React.FC<Props> = ({ onWorkspaceLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectWorkspace = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await WorkspaceService.selectWorkspaceDirectory();
      onWorkspaceLoaded();
    } catch (err) {
      setError('No se pudo acceder al workspace. Asegúrate de dar permisos al navegador.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card max-w-lg text-center animate-fade-in">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-d4-accent rounded-full mb-4">
            <Folder className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-d4-accent mb-2">
            D4 Builds Manager
          </h1>
          <p className="text-d4-text-dim">
            Gestiona tus builds de Diablo 4 de forma eficiente
          </p>
        </div>

        <div className="mb-6 text-left bg-d4-bg p-4 rounded">
          <h3 className="font-semibold text-d4-text mb-2">¿Qué es el Workspace?</h3>
          <ul className="text-sm text-d4-text-dim space-y-1 list-disc list-inside">
            <li>Carpeta donde se guardará toda tu información</li>
            <li>Se organizará automáticamente en subcarpetas</li>
            <li>Tus datos permanecerán en tu computadora</li>
            <li>Podrás respaldar la carpeta cuando quieras</li>
          </ul>
        </div>

        <button
          onClick={handleSelectWorkspace}
          disabled={loading}
          className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Cargando...' : 'Seleccionar Carpeta de Workspace'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-600 rounded flex items-start gap-2 text-left">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-d4-border text-sm text-d4-text-dim">
          <p>
            <strong>Nota:</strong> El navegador te pedirá permisos para acceder a la carpeta.
            Esta aplicación funciona completamente en tu navegador sin enviar datos a ningún servidor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
