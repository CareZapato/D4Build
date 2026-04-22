import React, { useState, useEffect } from 'react';
import { MapPin, Search, Swords, Shield, Filter, Eye, Trash2, Download, AlertCircle } from 'lucide-react';
import { WorkspaceService } from '../../services/WorkspaceService';
import { useModal } from '../../hooks/useModal';
import { useAppContext } from '../../context/AppContext';

interface Mazmorra {
  id: string;
  nombre: string;
  descripcion: string;
  clase_requerida: string;
  aspecto_id: string;  // Solo el ID del aspecto
  palabras_clave: Array<{
    tag: string;
    texto_original: string;
    significado: string;
    categoria: string;
    fuente: string;
  }>;
  fecha_registro: string;
  fecha_actualizacion: string;
}

interface Aspecto {
  id: string;
  name: string;
  shortName: string;
  effect: string;
  level: string;
  category: string;
  tags: string[];
  aspecto_id: string;
  detalles: any[];
}

const WorldDungeons: React.FC = () => {
  const modal = useModal();
  const { availableClasses } = useAppContext();
  const [mazmorras, setMazmorras] = useState<Mazmorra[]>([]);
  const [aspectosPorHeroe, setAspectosPorHeroe] = useState<Record<string, Aspecto[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClase, setFilterClase] = useState<string>('all');
  const [selectedMazmorra, setSelectedMazmorra] = useState<Mazmorra | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadMazmorras();
  }, []);

  const loadMazmorras = async () => {
    setLoading(true);
    try {
      // Cargar mazmorras
      const data = await WorkspaceService.loadWorldData('mazmorras');
      const mazmorrasData = data?.mazmorras || [];
      setMazmorras(mazmorrasData);

      // Cargar aspectos de todos los héroes
      const aspectosMap: Record<string, Aspecto[]> = {};
      for (const clase of availableClasses) {
        try {
          const heroeData = await WorkspaceService.loadHeroeData(clase, 'aspectos');
          aspectosMap[clase] = heroeData?.aspectos || [];
        } catch (error) {
          console.warn(`No se pudieron cargar aspectos de ${clase}:`, error);
          aspectosMap[clase] = [];
        }
      }
      setAspectosPorHeroe(aspectosMap);
    } catch (error) {
      console.error('Error cargando mazmorras:', error);
      modal.showError('Error al cargar datos de mazmorras');
    } finally {
      setLoading(false);
    }
  };

  // Obtener aspecto completo desde el ID
  const getAspectoById = (aspectoId: string, claseHeroe: string): Aspecto | null => {
    const aspectos = aspectosPorHeroe[claseHeroe] || [];
    return aspectos.find(a => a.id === aspectoId || a.aspecto_id === aspectoId) || null;
  };

  const handleDeleteMazmorra = async (nombre: string) => {
    const confirmed = await modal.showConfirm(`¿Estás seguro de eliminar la mazmorra "${nombre}"?`);
    if (!confirmed) return;

    try {
      const data = await WorkspaceService.loadWorldData('mazmorras') || { mazmorras: [] };
      data.mazmorras = data.mazmorras.filter((m: Mazmorra) => m.nombre !== nombre);
      await WorkspaceService.saveWorldData('mazmorras', data);
      await loadMazmorras();
      modal.showSuccess('Mazmorra eliminada');
    } catch (error: any) {
      modal.showError(`Error al eliminar: ${error.message}`);
    }
  };

  const handleExportJSON = async () => {
    try {
      const data = await WorkspaceService.loadWorldData('mazmorras');
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mazmorras_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      modal.showSuccess('Datos exportados exitosamente');
    } catch (error: any) {
      modal.showError(`Error al exportar: ${error.message}`);
    }
  };

  // Filtrar mazmorras
  const filteredMazmorras = mazmorras.filter(mazmorra => {
    const aspecto = getAspectoById(mazmorra.aspecto_id, mazmorra.clase_requerida);
    
    const matchesSearch = !searchTerm || 
      mazmorra.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mazmorra.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aspecto?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mazmorra.palabras_clave.some(pc => 
        pc.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pc.texto_original.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesClase = filterClase === 'all' || mazmorra.clase_requerida === filterClase;

    return matchesSearch && matchesClase;
  });

  // Obtener icono de clase
  const getClaseIcon = (clase: string): string => {
    const iconos: Record<string, string> = {
      'Bárbaro': '🗡️',
      'Druida': '🐺',
      'Pícaro': '🏹',
      'Hechicera': '🔮',
      'Nigromante': '💀',
      'Paladín': '⚔️',
      'Espiritista': '🌪️'
    };
    return iconos[clase] || '❓';
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-d4-text-dim">Cargando mazmorras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-d4-accent/30">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-d4-accent/20 to-d4-accent/10 border border-d4-accent/30">
                <MapPin className="w-10 h-10 text-d4-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-d4-accent to-d4-accent/70 bg-clip-text text-transparent">
                  Mazmorras de Aspectos
                </h1>
                <p className="text-d4-text-dim mt-1 font-medium">
                  <span className="text-d4-accent">{mazmorras.length}</span> mazmorras registradas
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <button 
                onClick={handleExportJSON} 
                className="btn btn-sm hover:scale-105 transition-transform flex items-center gap-2" 
                disabled={mazmorras.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-d4-accent" />
            <input
              type="text"
              className="input w-full !pl-10 pr-3 py-2.5 bg-d4-bg border-d4-border focus:border-d4-accent focus:ring-2 focus:ring-d4-accent/20 transition-all"
              placeholder="Buscar por mazmorra, aspecto, o palabras clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="input py-2.5 px-3 bg-d4-bg border-d4-border focus:border-d4-accent focus:ring-2 focus:ring-d4-accent/20 transition-all font-medium sm:w-auto w-full"
            value={filterClase}
            onChange={(e) => setFilterClase(e.target.value)}
          >
            <option value="all">🌐 Todas las clases</option>
            {availableClasses.map(clase => (
              <option key={clase} value={clase}>
                {getClaseIcon(clase)} {clase}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de mazmorras */}
      {filteredMazmorras.length === 0 ? (
        <div className="card text-center py-16 bg-gradient-to-br from-d4-surface to-d4-bg border-2 border-dashed border-d4-border">
          <div className="p-6 rounded-2xl bg-d4-accent/5 inline-block mb-6">
            <MapPin className="w-20 h-20 mx-auto text-d4-accent/40" />
          </div>
          <p className="text-xl text-d4-text font-bold mb-3">No hay mazmorras que mostrar</p>
          <p className="text-d4-text-dim max-w-md mx-auto">
            {searchTerm || filterClase !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Captura imágenes de mazmorras desde la sección "Captura de Imágenes" usando la categoría "Eventos del Mundo" → "Mazmorras de Aspectos"'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredMazmorras.map((mazmorra, idx) => {
            const aspecto = getAspectoById(mazmorra.aspecto_id, mazmorra.clase_requerida);
            
            return (
            <div 
              key={idx} 
              className="card p-5 hover:border-d4-accent/60 hover:shadow-lg hover:shadow-d4-accent/10 transition-all hover:-translate-y-1 bg-gradient-to-br from-d4-surface/50 to-d4-bg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-d4-accent to-d4-accent/80 bg-clip-text text-transparent">
                      {mazmorra.nombre}
                    </h3>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/30 to-purple-600/30 border border-purple-500/50 text-purple-200 font-bold">
                      🏰 MAZMORRA
                    </span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-d4-bg/80 border border-d4-border text-d4-text font-medium">
                      {getClaseIcon(mazmorra.clase_requerida)} {mazmorra.clase_requerida}
                    </span>
                  </div>
                  
                  <p className="text-sm text-d4-text-dim leading-relaxed mb-4">{mazmorra.descripcion}</p>

                  {/* Aspecto obtenido */}
                  <div className="bg-gradient-to-r from-d4-accent/10 to-d4-accent/5 border-2 border-d4-accent/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-d4-accent" />
                      <p className="font-semibold text-d4-accent">Aspecto Obtenido:</p>
                    </div>
                    <p className="text-lg font-bold text-d4-text">{aspecto?.name || 'Sin aspecto'}</p>
                    <p className="text-xs text-d4-text-dim mt-1">Nivel: {aspecto?.level || 'N/A'} | Categoría: {aspecto?.category || 'N/A'}</p>
                  </div>

                  {/* Palabras clave */}
                  {mazmorra.palabras_clave && mazmorra.palabras_clave.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-d4-text mb-2">🔑 Palabras Clave:</p>
                      <div className="flex flex-wrap gap-2">
                        {mazmorra.palabras_clave.map((pc, pcIdx) => (
                          <span 
                            key={pcIdx} 
                            className="text-xs px-3 py-1.5 rounded-full bg-d4-accent/10 border border-d4-accent/30 text-d4-accent font-medium hover:bg-d4-accent/20 transition-colors cursor-help"
                            title={`${pc.significado} (${pc.categoria})`}
                          >
                            {pc.texto_original}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="mt-4 pt-4 border-t border-d4-border/50 flex gap-4 text-xs text-d4-text-dim">
                    <span>📅 Registrado: {new Date(mazmorra.fecha_registro).toLocaleDateString()}</span>
                    {mazmorra.fecha_actualizacion && mazmorra.fecha_actualizacion !== mazmorra.fecha_registro && (
                      <span>🔄 Actualizado: {new Date(mazmorra.fecha_actualizacion).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedMazmorra(mazmorra);
                      setShowDetailModal(true);
                    }}
                    className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-400/10 rounded transition-colors"
                    title="Ver detalles completos"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMazmorra(mazmorra.nombre)}
                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-400/10 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal de detalles */}
      {showDetailModal && selectedMazmorra && (() => {
        const aspecto = getAspectoById(selectedMazmorra.aspecto_id, selectedMazmorra.clase_requerida);
        return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowDetailModal(false)}></div>
          
          <div className="card max-w-3xl w-full max-h-[85vh] overflow-y-auto relative z-[1] animate-fade-in">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-d4-surface pb-4 border-b border-d4-border z-[50]">
              <div>
                <h2 className="text-2xl font-bold text-d4-accent flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  {selectedMazmorra.nombre}
                </h2>
                <p className="text-sm text-d4-text-dim">
                  {getClaseIcon(selectedMazmorra.clase_requerida)} {selectedMazmorra.clase_requerida}
                </p>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-d4-border rounded transition-colors"
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Descripción */}
              <div>
                <h3 className="font-semibold text-d4-text mb-2">Descripción:</h3>
                <p className="text-d4-text-dim">{selectedMazmorra.descripcion}</p>
              </div>

              {/* Aspecto */}
              <div className="bg-gradient-to-r from-d4-accent/10 to-d4-accent/5 border-2 border-d4-accent/30 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-6 h-6 text-d4-accent" />
                  <h3 className="font-semibold text-d4-accent text-lg">Aspecto Recompensa</h3>
                </div>
                <p className="text-xl font-bold text-d4-text mb-2">{aspecto?.name || 'Sin aspecto'}</p>
                {aspecto?.effect && (
                  <p className="text-sm text-d4-text-dim mb-3 leading-relaxed">{aspecto.effect}</p>
                )}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-d4-bg/50 rounded p-3 border border-d4-border/50">
                    <p className="text-xs text-d4-text-dim mb-1">Nivel:</p>
                    <code className="text-sm text-d4-accent font-bold">{aspecto?.level || 'N/A'}</code>
                  </div>
                  <div className="bg-d4-bg/50 rounded p-3 border border-d4-border/50">
                    <p className="text-xs text-d4-text-dim mb-1">Categoría:</p>
                    <code className="text-sm text-d4-accent font-bold">{aspecto?.category || 'N/A'}</code>
                  </div>
                </div>
                <div className="bg-d4-bg/50 rounded p-3 border border-d4-border/50">
                  <p className="text-xs text-d4-text-dim mb-1">ID del Aspecto:</p>
                  <code className="text-xs text-d4-accent font-mono">{aspecto?.id || selectedMazmorra.aspecto_id}</code>
                </div>
                {aspecto?.tags && aspecto.tags.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-d4-text-dim mb-2">Tags del Aspecto:</p>
                    <div className="flex flex-wrap gap-2">
                      {aspecto.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded bg-d4-accent/20 text-d4-accent">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Palabras clave detalladas */}
              {selectedMazmorra.palabras_clave && selectedMazmorra.palabras_clave.length > 0 && (
                <div>
                  <h3 className="font-semibold text-d4-text mb-3 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-d4-accent" />
                    Palabras Clave Detectadas ({selectedMazmorra.palabras_clave.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedMazmorra.palabras_clave.map((pc, idx) => (
                      <div key={idx} className="bg-d4-surface/50 border border-d4-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-d4-text">{pc.texto_original}</span>
                            <span className="text-xs px-2 py-1 rounded bg-d4-accent/20 text-d4-accent">
                              {pc.categoria}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-d4-bg border border-d4-border text-d4-text-dim">
                            {pc.fuente}
                          </span>
                        </div>
                        <p className="text-sm text-d4-text-dim mb-1">
                          <strong>Tag:</strong> <code className="text-xs text-d4-accent">{pc.tag}</code>
                        </p>
                        <p className="text-sm text-d4-text-dim">{pc.significado}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Información de registro */}
              <div className="bg-d4-surface/30 rounded-lg p-4 border border-d4-border/50">
                <h3 className="font-semibold text-d4-text mb-3">Información de Registro</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-d4-text-dim mb-1">Fecha de Registro:</p>
                    <p className="text-d4-text font-medium">
                      {new Date(selectedMazmorra.fecha_registro).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-d4-text-dim mb-1">Última Actualización:</p>
                    <p className="text-d4-text font-medium">
                      {new Date(selectedMazmorra.fecha_actualizacion).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-d4-border flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

export default WorldDungeons;
