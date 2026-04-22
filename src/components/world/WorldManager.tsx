import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Target, Trophy, AlertCircle, TrendingUp, Download, Upload, Plus, Edit2, Trash2, Eye, GitBranch, Search, Calculator } from 'lucide-react';
import { WorldService } from '../../services/WorldService';
import { DatosMundo, EventoMundo, RutaOptima, AnalisisEconomia, IndiceRecurso } from '../../types';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';
import WorldDungeons from './WorldDungeons';

const WorldManager: React.FC = () => {
  const modal = useModal();
  const [worldData, setWorldData] = useState<DatosMundo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'eventos' | 'mazmorras' | 'grafo' | 'rutas' | 'analisis' | 'recursos' | 'calculadora'>('eventos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventoMundo | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventoMundo | null>(null);
  const [selectedBossForRoute, setSelectedBossForRoute] = useState<string>('');
  const [bossRoute, setBossRoute] = useState<any>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await WorldService.loadWorldData();
      setWorldData(data);
      
      // Si hay datos pero no relaciones, recalcularlas automáticamente
      if (data && data.eventos.length > 0 && (!data.grafo.relaciones || data.grafo.relaciones.length === 0)) {
        console.log('🔄 Recalculando relaciones automáticamente...');
        await WorldService.recalculateAndSave();
        // Recargar después de recalcular
        const updatedData = await WorldService.loadWorldData();
        setWorldData(updatedData);
      }
    } catch (error) {
      console.error('Error cargando datos del mundo:', error);
      modal.showError('Error al cargar datos del mundo');
    } finally {
      setLoading(false);
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      await WorldService.importFromJSON(jsonData);
      await loadData();
      modal.showSuccess('Datos importados exitosamente');
    } catch (error: any) {
      console.error('Error importando JSON:', error);
      modal.showError(`Error al importar: ${error.message}`);
    }
  };

  const handleExportJSON = async () => {
    try {
      const jsonString = await WorldService.exportToJSON();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `world_data_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      modal.showSuccess('Datos exportados exitosamente');
    } catch (error: any) {
      modal.showError(`Error al exportar: ${error.message}`);
    }
  };

  const handleDeleteEvent = async (eventoId: string) => {
    const confirmed = await modal.showConfirm('¿Estás seguro de eliminar este evento?');
    if (!confirmed) return;

    try {
      await WorldService.deleteEvent(eventoId);
      await loadData();
      modal.showSuccess('Evento eliminado');
    } catch (error: any) {
      modal.showError(`Error al eliminar: ${error.message}`);
    }
  };

  const handleGenerateAnalysis = async () => {
    try {
      const analisis = await WorldService.generateEconomyAnalysis();
      if (!analisis) {
        modal.showWarning('No hay suficientes datos para generar análisis');
        return;
      }

      if (worldData) {
        worldData.analisis = analisis;
        await WorldService.saveWorldData(worldData);
        await loadData();
        modal.showSuccess('Análisis generado');
        setCurrentView('analisis');
      }
    } catch (error: any) {
      modal.showError(`Error generando análisis: ${error.message}`);
    }
  };

  const handleGenerateRoute = async (recurso: string) => {
    try {
      const ruta = await WorldService.generateRoute(recurso);
      if (!ruta) {
        modal.showWarning(`No se pudo generar ruta para ${recurso}`);
        return;
      }

      if (worldData) {
        worldData.rutas_sugeridas = worldData.rutas_sugeridas || [];
        
        // Reemplazar ruta existente para el mismo recurso
        const existingIndex = worldData.rutas_sugeridas.findIndex(
          r => r.objetivo_recurso?.toLowerCase() === recurso.toLowerCase()
        );
        
        if (existingIndex >= 0) {
          worldData.rutas_sugeridas[existingIndex] = ruta;
        } else {
          worldData.rutas_sugeridas.push(ruta);
        }

        await WorldService.saveWorldData(worldData);
        await loadData();
        modal.showSuccess('Ruta generada');
        setCurrentView('rutas');
      }
    } catch (error: any) {
      modal.showError(`Error generando ruta: ${error.message}`);
    }
  };

  const handleCalculateBossRoute = async (jefeId: string) => {
    if (!jefeId) {
      setBossRoute(null);
      return;
    }

    setLoadingRoute(true);
    try {
      const route = await WorldService.calculateBossRoute(jefeId);
      setBossRoute(route);
    } catch (error: any) {
      modal.showError(`Error calculando ruta: ${error.message}`);
      setBossRoute(null);
    } finally {
      setLoadingRoute(false);
    }
  };

  const filteredEvents = worldData?.eventos.filter(evento => {
    const matchesSearch = !searchTerm || 
      evento.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.boss?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || evento.tipo === filterType;

    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-d4-text-dim">Cargando datos del mundo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con gradiente mejorado */}
      <div className="card p-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface border-d4-accent/30">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-d4-accent/20 to-d4-accent/10 border border-d4-accent/30">
                <MapPin className="w-10 h-10 text-d4-accent" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-d4-accent to-d4-accent/70 bg-clip-text text-transparent">
                  Sistema de Progresión del Mundo
                </h1>
                <p className="text-d4-text-dim mt-1 font-medium">
                  {worldData ? (
                    <>
                      <span className="text-d4-accent">{worldData.eventos.length}</span> eventos •{' '}
                      <span className="text-d4-accent">{worldData.indice_recursos.length}</span> recursos
                    </>
                  ) : (
                    'Sin datos cargados'
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-start">
              <label className="btn btn-sm cursor-pointer hover:scale-105 transition-transform flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Importar
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJSON}
                />
              </label>

              <button 
                onClick={handleExportJSON} 
                className="btn btn-sm hover:scale-105 transition-transform flex items-center gap-2" 
                disabled={!worldData || worldData.eventos.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>

              <button 
                onClick={handleGenerateAnalysis} 
                className="btn btn-sm btn-primary hover:scale-105 transition-transform shadow-lg shadow-d4-accent/20 flex items-center gap-2" 
                disabled={!worldData || worldData.eventos.length === 0}
              >
                <TrendingUp className="w-4 h-4" />
                Análisis
              </button>
            </div>
          </div>
        </div>

        {/* Tabs mejorados */}
        <div className="flex flex-wrap gap-2 border-b-2 border-d4-border pb-3">
          {[
            { value: 'eventos', label: 'Eventos', icon: Calendar },
            { value: 'mazmorras', label: 'Mazmorras', icon: MapPin },
            { value: 'calculadora', label: 'Calculadora', icon: Calculator },
            { value: 'recursos', label: 'Recursos', icon: Trophy },
            { value: 'grafo', label: 'Cadenas', icon: GitBranch },
            { value: 'rutas', label: 'Rutas', icon: Target },
            { value: 'analisis', label: 'Análisis', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setCurrentView(tab.value as any)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-semibold text-sm ${
                  currentView === tab.value
                    ? 'bg-gradient-to-r from-d4-accent to-d4-accent/90 text-black shadow-lg shadow-d4-accent/30 scale-105'
                    : 'bg-d4-surface/70 text-d4-text hover:bg-d4-border hover:scale-105 hover:shadow-md'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vista de Eventos */}
      {currentView === 'eventos' && (
        <div className="space-y-5">
          {/* Filtros mejorados */}
          <div className="card p-4 bg-gradient-to-r from-d4-surface/80 to-d4-bg/80">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-d4-accent" />
                <input
                  type="text"
                  className="input w-full !pl-14 pr-3 py-2.5 bg-d4-bg border-d4-border focus:border-d4-accent focus:ring-2 focus:ring-d4-accent/20 transition-all"
                  placeholder="Buscar eventos por nombre, descripción o boss..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="input py-2.5 px-3 bg-d4-bg border-d4-border focus:border-d4-accent focus:ring-2 focus:ring-d4-accent/20 transition-all font-medium sm:w-auto w-full"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">🌐 Todos los tipos</option>
                <option value="guarida">🔴 Guaridas</option>
                <option value="susurro">🟣 Susurros</option>
                <option value="evento">🔵 Eventos</option>
                <option value="calabozo">⚔️ Calabozos</option>
                <option value="legion">🛡️ Legiones</option>
                <option value="reserva">🏰 Reservas</option>
              </select>
            </div>
          </div>

          {/* Lista de eventos mejorada */}
          {filteredEvents.length === 0 ? (
            <div className="card text-center py-16 bg-gradient-to-br from-d4-surface to-d4-bg border-2 border-dashed border-d4-border">
              <div className="p-6 rounded-2xl bg-d4-accent/5 inline-block mb-6">
                <MapPin className="w-20 h-20 mx-auto text-d4-accent/40" />
              </div>
              <p className="text-xl text-d4-text font-bold mb-3">No hay eventos que mostrar</p>
              <p className="text-d4-text-dim max-w-md mx-auto">
                {searchTerm || filterType !== 'all' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Importa datos desde un archivo JSON para comenzar a gestionar eventos del mundo'
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredEvents.map(evento => (
                <div 
                  key={evento.id} 
                  className="card p-5 hover:border-d4-accent/60 hover:shadow-lg hover:shadow-d4-accent/10 transition-all hover:-translate-y-1 bg-gradient-to-br from-d4-surface/50 to-d4-bg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-d4-accent to-d4-accent/80 bg-clip-text text-transparent">
                          {evento.nombre}
                        </h3>
                        <span className={`text-xs px-3 py-1.5 rounded-full border font-bold shadow-sm ${
                          evento.tipo === 'guarida' ? 'bg-gradient-to-r from-red-500/30 to-red-600/30 border-red-500/50 text-red-200' :
                          evento.tipo === 'susurro' ? 'bg-gradient-to-r from-purple-500/30 to-purple-600/30 border-purple-500/50 text-purple-200' :
                          evento.tipo === 'evento' ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 border-blue-500/50 text-blue-200' :
                          'bg-d4-surface border-d4-border text-d4-text-dim'
                        }`}>
                          {evento.tipo.toUpperCase()}
                        </span>
                        {evento.subtipo && (
                          <span className="text-xs px-3 py-1.5 rounded-full bg-d4-bg/80 border border-d4-border text-d4-text font-medium">
                            {evento.subtipo}
                          </span>
                        )}
                        {evento.repetible && (
                          <span className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/40 text-green-200 font-bold">
                            ♻️ Repetible
                          </span>
                        )}
                      </div>
                      
                      {evento.boss && (
                        <p className="text-sm text-d4-text mb-3 flex items-center gap-2 font-medium">
                          <Trophy className="w-4 h-4 text-d4-accent" />
                          <strong className="text-d4-accent">Boss:</strong> {evento.boss}
                        </p>
                      )}

                      <p className="text-sm text-d4-text-dim leading-relaxed mb-4">{evento.descripcion}</p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {/* Requisitos */}
                        {evento.requisitos.length > 0 && (
                          <div>
                            <p className="font-semibold text-d4-text mb-1">Requisitos:</p>
                            <ul className="space-y-1">
                              {evento.requisitos.map((req, idx) => (
                                <li key={idx} className="text-d4-text-dim">
                                  • {req.cantidad}x {req.nombre}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recompensas */}
                        {evento.recompensas.length > 0 && (
                          <div>
                            <p className="font-semibold text-d4-text mb-1">Recompensas:</p>
                            <ul className="space-y-1">
                              {evento.recompensas.map((rec, idx) => (
                                <li key={idx} className="text-d4-text-dim">
                                  • {rec.cantidad ? `${rec.cantidad}x ` : ''}{rec.nombre}
                                  {rec.probabilidad && ` (${rec.probabilidad})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Info adicional */}
                        <div>
                          {evento.ubicacion && (
                            <p className="text-d4-text-dim mb-1">
                              <strong>Ubicación:</strong> {evento.ubicacion}
                            </p>
                          )}
                          {evento.tiempo?.expira_en && (
                            <p className="text-orange-400">
                              ⏱️ Expira: {evento.tiempo.expira_en}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {evento.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {evento.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs px-2 py-0.5 rounded bg-d4-accent/10 border border-d4-accent/30 text-d4-accent">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedEvent(evento);
                          setShowEventModal(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 p-2"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(evento.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista de Mazmorras */}
      {currentView === 'mazmorras' && <WorldDungeons />}

      {/* Vista de Recursos */}
      {currentView === 'recursos' && (
        <div className="space-y-4">
          {worldData?.indice_recursos && worldData.indice_recursos.length > 0 ? (
            <div className="grid gap-4">
              {worldData.indice_recursos.map((recurso, idx) => (
                <div key={idx} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-d4-accent mb-1">{recurso.recurso}</h3>
                      <span className="text-xs px-2 py-1 rounded bg-d4-surface border border-d4-border text-d4-text-dim">
                        {recurso.tipo}
                      </span>
                      {recurso.probabilidad_drop && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded border ${
                          recurso.probabilidad_drop === 'alta' ? 'bg-green-500/20 border-green-500/40 text-green-300' :
                          recurso.probabilidad_drop === 'media' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' :
                          'bg-red-500/20 border-red-500/40 text-red-300'
                        }`}>
                          Drop: {recurso.probabilidad_drop}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleGenerateRoute(recurso.recurso)}
                      className="btn btn-sm btn-primary"
                    >
                      <Target className="w-4 h-4" />
                      Generar Ruta
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-d4-text mb-2">Generado por ({recurso.generado_por.length}):</p>
                      {recurso.generado_por.length > 0 ? (
                        <ul className="space-y-1">
                          {recurso.generado_por.map(id => {
                            const evento = worldData.eventos.find(e => e.id === id);
                            return (
                              <li key={id} className="text-d4-text-dim">
                                • {evento?.nombre || id}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-d4-text-dim italic">Ninguno</p>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-d4-text mb-2">Requerido por ({recurso.requerido_por.length}):</p>
                      {recurso.requerido_por.length > 0 ? (
                        <ul className="space-y-1">
                          {recurso.requerido_por.map(id => {
                            const evento = worldData.eventos.find(e => e.id === id);
                            return (
                              <li key={id} className="text-d4-text-dim">
                                • {evento?.nombre || id}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-d4-text-dim italic">Ninguno</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-d4-text-dim opacity-50" />
              <p className="text-d4-text">No hay recursos indexados</p>
            </div>
          )}
        </div>
      )}

      {/* Vista de Calculadora de Progresión */}
      {currentView === 'calculadora' && (
        <div className="space-y-5">
          <div className="card p-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-d4-accent mb-2 flex items-center gap-2">
                  <Calculator className="w-6 h-6" />
                  Calculadora de Progresión
                </h2>
                <p className="text-d4-text-dim">Selecciona un jefe para ver todos los pasos necesarios para enfrentarlo</p>
              </div>
            </div>

            {/* Selector de jefe */}
            <div className="mb-6">
              <label className="block text-d4-text font-semibold mb-3 text-sm">
                🎯 Selecciona el jefe objetivo:
              </label>
              <select
                className="input w-full max-w-md py-3 px-4 bg-d4-bg border-2 border-d4-border focus:border-d4-accent focus:ring-2 focus:ring-d4-accent/20 transition-all font-medium"
                value={selectedBossForRoute}
                onChange={(e) => {
                  setSelectedBossForRoute(e.target.value);
                  handleCalculateBossRoute(e.target.value);
                }}
              >
                <option value="">-- Selecciona un jefe --</option>
                {worldData?.eventos
                  .filter(e => e.boss) // Solo eventos con boss
                  .sort((a, b) => a.nombre.localeCompare(b.nombre))
                  .map(evento => (
                    <option key={evento.id} value={evento.id}>
                      {evento.nombre} ({evento.boss})
                    </option>
                  ))
                }
              </select>
            </div>

            {/* Resultados */}
            {loadingRoute && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-d4-accent border-t-transparent"></div>
                <p className="text-d4-text-dim mt-4">Calculando ruta de progresión...</p>
              </div>
            )}

            {!loadingRoute && selectedBossForRoute && !bossRoute && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <p className="text-d4-text">No se pudo calcular la ruta para este jefe</p>
              </div>
            )}

            {!loadingRoute && bossRoute && (
              <div className="space-y-6">
                {/* Header del jefe objetivo */}
                <div className="bg-gradient-to-br from-d4-accent/20 to-d4-accent/10 border-2 border-d4-accent rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-d4-accent/20">
                      <Target className="w-8 h-8 text-d4-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-d4-text mb-2">{bossRoute.jefe_objetivo.nombre}</h3>
                      <p className="text-d4-text-dim mb-3">{bossRoute.jefe_objetivo.descripcion}</p>
                      {bossRoute.jefe_objetivo.boss && (
                        <p className="text-d4-accent font-semibold">🎯 Boss: {bossRoute.jefe_objetivo.boss}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acceso directo o requisitos */}
                {bossRoute.acceso_directo ? (
                  <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/30 rounded-xl p-6 text-center">
                    <div className="inline-block p-4 rounded-full bg-green-500/20 mb-4">
                      <Trophy className="w-12 h-12 text-green-400" />
                    </div>
                    <h4 className="text-xl font-bold text-green-400 mb-2">✅ Acceso Directo</h4>
                    <p className="text-d4-text-dim">Este jefe no requiere recursos previos. ¡Puedes enfrentarlo directamente!</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Recursos necesarios */}
                    <div className="bg-d4-surface/50 rounded-xl p-5 border-2 border-d4-border">
                      <h4 className="text-lg font-bold text-d4-accent mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        Recursos Necesarios
                      </h4>
                      <div className="space-y-3">
                        {bossRoute.recursos_necesarios.map((recurso: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-d4-bg rounded-lg border border-d4-border">
                            <div>
                              <p className="font-semibold text-d4-text">{recurso.nombre}</p>
                              <p className="text-sm text-d4-text-dim">
                                {recurso.generado_por.length > 0 
                                  ? `📍 Generado por: ${recurso.generado_por.join(', ')}`
                                  : '⚠️ No se encontraron generadores'
                                }
                              </p>
                            </div>
                            <span className="text-2xl font-bold text-d4-accent px-4 py-2 bg-d4-accent/10 rounded-lg">
                              x{recurso.cantidad}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pasos de progresión */}
                    {bossRoute.pasos && bossRoute.pasos.length > 0 && (
                      <div className="bg-d4-surface/50 rounded-xl p-5 border-2 border-d4-border">
                        <h4 className="text-lg font-bold text-d4-accent mb-4 flex items-center gap-2">
                          <GitBranch className="w-5 h-5" />
                          Ruta de Progresión (Paso a Paso)
                        </h4>
                        <div className="space-y-4">
                          {bossRoute.pasos.map((paso: any, idx: number) => {
                            const isObjective = paso.jefe.id === bossRoute.jefe_objetivo.id;
                            const isFarmeable = paso.nivel > 0;
                            
                            return (
                              <div 
                                key={idx} 
                                className={`relative ${idx < bossRoute.pasos.length - 1 ? 'pb-4' : ''}`}
                              >
                                {/* Línea conectora */}
                                {idx < bossRoute.pasos.length - 1 && (
                                  <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-d4-accent to-d4-accent/30"></div>
                                )}
                                
                                <div className="flex gap-4 items-start">
                                  {/* Número de paso */}
                                  <div className={`flex-shrink-0 w-12 h-12 rounded-full font-bold flex items-center justify-center text-lg shadow-lg z-10 ${
                                    isObjective 
                                      ? 'bg-gradient-to-br from-d4-accent to-d4-accent/80 text-black' 
                                      : isFarmeable
                                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                                        : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                  }`}>
                                    {paso.paso}
                                  </div>
                                  
                                  {/* Contenido del paso */}
                                  <div className={`flex-1 rounded-xl p-5 border-2 ${
                                    isObjective
                                      ? 'bg-gradient-to-br from-d4-accent/10 to-d4-accent/5 border-d4-accent'
                                      : isFarmeable
                                        ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30'
                                        : 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30'
                                  }`}>
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h5 className="text-xl font-bold text-d4-text">{paso.jefe.nombre}</h5>
                                          {isObjective && (
                                            <span className="text-xs px-2 py-1 rounded bg-d4-accent/30 text-d4-accent font-bold">OBJETIVO</span>
                                          )}
                                          {isFarmeable && !isObjective && (
                                            <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 font-bold">FARMEAR</span>
                                          )}
                                        </div>
                                        {paso.jefe.boss && (
                                          <p className="text-sm text-d4-accent mb-2">🎯 Boss: {paso.jefe.boss}</p>
                                        )}
                                        <p className="text-sm text-d4-text-dim">{paso.jefe.descripcion}</p>
                                      </div>
                                    </div>

                                    {/* Requisitos */}
                                    {paso.jefe.requisitos && paso.jefe.requisitos.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-d4-border/50">
                                        <p className="text-xs font-semibold text-d4-text-dim mb-2">📋 Requisitos:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {paso.jefe.requisitos.map((req: any, rIdx: number) => (
                                            <span key={rIdx} className="text-xs px-3 py-1 rounded-full bg-d4-bg border border-d4-border text-d4-text">
                                              {req.nombre} x{req.cantidad}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Recompensas */}
                                    {paso.jefe.recompensas && paso.jefe.recompensas.length > 0 && (
                                      <div className="mt-3 pt-3 border-t border-d4-border/50">
                                        <p className="text-xs font-semibold text-d4-text-dim mb-2">🎁 Recompensas:</p>
                                        <div className="flex flex-wrap gap-2">
                                          {paso.jefe.recompensas.map((rec: any, rIdx: number) => (
                                            <span key={rIdx} className={`text-xs px-3 py-1 rounded-full border ${
                                              rec.garantizado 
                                                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                                                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
                                            }`}>
                                              {rec.nombre} {rec.cantidad ? `x${rec.cantidad}` : ''} 
                                              {rec.probabilidad && ` (${rec.probabilidad}%)`}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!selectedBossForRoute && (
              <div className="text-center py-16 bg-gradient-to-br from-d4-surface to-d4-bg border-2 border-dashed border-d4-border rounded-xl">
                <div className="p-6 rounded-2xl bg-d4-accent/5 inline-block mb-6">
                  <Calculator className="w-20 h-20 mx-auto text-d4-accent/40" />
                </div>
                <p className="text-xl text-d4-text font-bold mb-3">Selecciona un jefe para comenzar</p>
                <p className="text-d4-text-dim max-w-md mx-auto">
                  Usa el selector de arriba para elegir un jefe y visualizar todos los pasos necesarios para enfrentarlo
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista de Cadenas de Progresión */}
      {currentView === 'grafo' && (
        <div className="space-y-5">
          <div className="card p-6 bg-gradient-to-br from-d4-surface via-d4-bg to-d4-surface">
            <h2 className="text-2xl font-bold text-d4-accent mb-2 flex items-center gap-2">
              <GitBranch className="w-6 h-6" />
              Cadenas de Progresión de Jefes
            </h2>
            <p className="text-d4-text-dim mb-6">Visualiza qué jefes generan recursos para desbloquear otros jefes</p>
          
            {worldData?.grafo.relaciones && worldData.grafo.relaciones.length > 0 ? (
              <div className="space-y-6">
                {/* Agrupar relaciones por recurso */}
                {Object.entries(
                  worldData.grafo.relaciones.reduce((acc, rel) => {
                    const recurso = rel.recurso || 'Sin especificar';
                    if (!acc[recurso]) acc[recurso] = [];
                    acc[recurso].push(rel);
                    return acc;
                  }, {} as Record<string, typeof worldData.grafo.relaciones>)
                ).map(([recurso, relaciones]) => (
                  <div key={recurso} className="bg-d4-surface/50 rounded-xl p-5 border-2 border-d4-border hover:border-d4-accent/40 transition-all">
                    {/* Header del recurso */}
                    <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-d4-border">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-d4-accent/20 to-d4-accent/10">
                        <Trophy className="w-5 h-5 text-d4-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-d4-text">{recurso}</h3>
                        <p className="text-sm text-d4-text-dim">{relaciones.length} cadena(s) detectada(s)</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-d4-accent/20 text-d4-accent font-semibold">
                        {relaciones[0].cantidad || '?'} necesarios
                      </span>
                    </div>

                    {/* Cadenas */}
                    <div className="space-y-3">
                      {relaciones.map((rel, idx) => {
                        const eventoFrom = worldData.eventos.find(e => e.id === rel.from);
                        const eventoTo = worldData.eventos.find(e => e.id === rel.to);

                        return (
                          <div key={idx} className="relative">
                            {/* Línea conectora */}
                            <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-gradient-to-r from-d4-accent/40 via-d4-accent to-d4-accent/40 -translate-y-1/2 -z-10"></div>
                            
                            <div className="grid grid-cols-3 gap-3 items-center">
                              {/* Jefe origen (farmeable) */}
                              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/30 rounded-lg p-4 hover:border-green-500/60 transition-all">
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-300 font-bold">FARMEAR</span>
                                  {eventoFrom?.repetible && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">♻️</span>
                                  )}
                                </div>
                                <h4 className="font-bold text-d4-text mb-1">{eventoFrom?.nombre || rel.from}</h4>
                                <p className="text-xs text-d4-text-dim line-clamp-2">{eventoFrom?.descripcion}</p>
                                {eventoFrom?.boss && (
                                  <p className="text-xs text-d4-accent mt-2">🎯 Boss: {eventoFrom.boss}</p>
                                )}
                              </div>

                              {/* Flecha central con recurso */}
                              <div className="text-center">
                                <div className="inline-block bg-d4-bg border-2 border-d4-accent rounded-lg px-4 py-3 shadow-lg shadow-d4-accent/20">
                                  <div className="text-2xl mb-1">→</div>
                                  <div className={`text-xs px-2 py-1 rounded ${
                                    rel.tipo === 'farm' ? 'bg-green-500/20 text-green-300' :
                                    rel.tipo === 'genera' ? 'bg-blue-500/20 text-blue-300' :
                                    'bg-d4-accent/20 text-d4-accent'
                                  } font-semibold`}>
                                    {rel.tipo.toUpperCase()}
                                  </div>
                                </div>
                              </div>

                              {/* Jefe destino (desbloqueado) */}
                              <div className="bg-gradient-to-br from-d4-accent/10 to-d4-accent/5 border-2 border-d4-accent/30 rounded-lg p-4 hover:border-d4-accent/60 transition-all">
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="text-xs px-2 py-0.5 rounded bg-d4-accent/30 text-d4-accent font-bold">DESBLOQUEAR</span>
                                </div>
                                <h4 className="font-bold text-d4-text mb-1">{eventoTo?.nombre || rel.to}</h4>
                                <p className="text-xs text-d4-text-dim line-clamp-2">{eventoTo?.descripcion}</p>
                                {eventoTo?.boss && (
                                  <p className="text-xs text-d4-accent mt-2">🎯 Boss: {eventoTo.boss}</p>
                                )}
                                {rel.cantidad && (
                                  <p className="text-xs text-yellow-400 mt-2">📊 Requiere: x{rel.cantidad}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-d4-surface to-d4-bg border-2 border-dashed border-d4-border rounded-xl">
                <div className="p-6 rounded-2xl bg-d4-accent/5 inline-block mb-6">
                  <GitBranch className="w-20 h-20 mx-auto text-d4-accent/40" />
                </div>
                <p className="text-xl text-d4-text font-bold mb-3">No hay cadenas de progresión detectadas</p>
                <p className="text-d4-text-dim max-w-md mx-auto mb-4">
                  Las cadenas se generan automáticamente analizando qué jefes dan recursos necesarios para otros jefes.
                </p>
                <p className="text-sm text-d4-accent">
                  💡 Asegúrate de que los eventos tengan correctamente configurados sus requisitos y recompensas
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista de Rutas */}
      {currentView === 'rutas' && (
        <div className="space-y-4">
          {worldData?.rutas_sugeridas && worldData.rutas_sugeridas.length > 0 ? (
            worldData.rutas_sugeridas.map((ruta, idx) => (
              <div key={idx} className="card p-6">
                <h3 className="text-xl font-bold text-d4-accent mb-2">{ruta.objetivo}</h3>
                <div className="flex gap-4 text-sm text-d4-text-dim mb-4">
                  <span>⏱️ {ruta.tiempo_estimado}</span>
                  <span>📊 {ruta.eficiencia}</span>
                  <span>{ruta.repetible ? '♻️ Repetible' : '🔒 Una vez'}</span>
                </div>

                <div className="space-y-3">
                  {ruta.pasos.map((paso, pIdx) => (
                    <div key={pIdx} className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-d4-accent text-black font-bold flex items-center justify-center">
                        {paso.paso}
                      </div>
                      <div className="flex-1 bg-d4-surface p-3 rounded border border-d4-border">
                        <h4 className="font-semibold text-d4-text mb-1">{paso.evento_nombre}</h4>
                        <p className="text-sm text-d4-text-dim mb-2">{paso.motivo}</p>
                        <div className="flex gap-4 text-xs">
                          {paso.recursos_consumidos && paso.recursos_consumidos.length > 0 && (
                            <div>
                              <span className="text-red-400">❌ Consume:</span> {paso.recursos_consumidos.join(', ')}
                            </div>
                          )}
                          {paso.recursos_obtenidos && paso.recursos_obtenidos.length > 0 && (
                            <div>
                              <span className="text-green-400">✅ Obtiene:</span> {paso.recursos_obtenidos.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-12">
              <Target className="w-16 h-16 mx-auto mb-4 text-d4-text-dim opacity-50" />
              <p className="text-d4-text mb-2">No hay rutas generadas</p>
              <p className="text-sm text-d4-text-dim">Ve a la pestaña Recursos y genera rutas para objetivos específicos</p>
            </div>
          )}
        </div>
      )}

      {/* Vista de Análisis */}
      {currentView === 'analisis' && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-d4-accent mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Análisis de Economía
          </h2>

          {worldData?.analisis ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-d4-text mb-2">Tipo de Economía</h3>
                <span className="px-3 py-1 rounded bg-d4-accent/20 text-d4-accent border border-d4-accent/40">
                  {worldData.analisis.tipo_economia}
                </span>
              </div>

              {worldData.analisis.cuellos_botella.length > 0 && (
                <div>
                  <h3 className="font-semibold text-d4-text mb-2">Cuellos de Botella</h3>
                  <div className="flex flex-wrap gap-2">
                    {worldData.analisis.cuellos_botella.map((recurso, idx) => (
                      <span key={idx} className="px-3 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                        {recurso}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {worldData.analisis.eventos_clave.length > 0 && (
                <div>
                  <h3 className="font-semibold text-d4-text mb-2">Eventos Clave para Progresión</h3>
                  <ul className="space-y-1">
                    {worldData.analisis.eventos_clave.map((id, idx) => {
                      const evento = worldData.eventos.find(e => e.id === id);
                      return (
                        <li key={idx} className="text-d4-text-dim">
                          • {evento?.nombre || id}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {worldData.analisis.loops_farm.length > 0 && (
                <div>
                  <h3 className="font-semibold text-d4-text mb-2">Loops de Farm Detectados</h3>
                  <div className="space-y-2">
                    {worldData.analisis.loops_farm.map((loop, idx) => (
                      <div key={idx} className="bg-d4-surface p-3 rounded border border-d4-border">
                        {loop.map((id, lIdx) => {
                          const evento = worldData.eventos.find(e => e.id === id);
                          return (
                            <span key={lIdx}>
                              {evento?.nombre || id}
                              {lIdx < loop.length - 1 && ' → '}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-d4-text mb-2">Recursos Escasos</h3>
                  <div className="flex flex-wrap gap-2">
                    {worldData.analisis.recursos_escasos.map((r, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-400 border border-red-500/30">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-d4-text mb-2">Recursos Abundantes</h3>
                  <div className="flex flex-wrap gap-2">
                    {worldData.analisis.recursos_abundantes.map((r, idx) => (
                      <span key={idx} className="px-2 py-1 text-xs rounded bg-green-500/10 text-green-400 border border-green-500/30">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {worldData.analisis.recomendaciones.length > 0 && (
                <div>
                  <h3 className="font-semibold text-d4-text mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-d4-accent" />
                    Recomendaciones
                  </h3>
                  <ul className="space-y-2">
                    {worldData.analisis.recomendaciones.map((rec, idx) => (
                      <li key={idx} className="bg-d4-accent/10 p-3 rounded border border-d4-accent/30 text-d4-text">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-d4-text-dim mb-4">No hay análisis generado</p>
              <button onClick={handleGenerateAnalysis} className="btn btn-primary">
                <TrendingUp className="w-4 h-4" />
                Generar Análisis Ahora
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorldManager;
