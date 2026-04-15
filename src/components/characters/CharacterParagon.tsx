import { useState, useEffect } from 'react';
import { Grid3x3, Copy, Check, Search, ChevronLeft, ChevronRight, AlertCircle, Layers } from 'lucide-react';
import { Personaje, ParagonPersonaje } from '../../types';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import { WorkspaceService } from '../../services/WorkspaceService';

interface Props {
  personaje: Personaje;
  onChange: (paragon: ParagonPersonaje) => void;
}

interface NodoCompleto {
  id: string;
  nombre: string;
  rareza: 'normal' | 'magico' | 'raro' | 'legendario';
  atributos?: Array<{ tipo: string; valor: number }>;
  efecto_especial?: string;
  efecto_principal?: string;
  condicion?: string;
  bonificacion?: {
    descripcion: string;
    requisitos?: string;
  };
  detalles?: Array<{ // v0.5.3
    texto: string;
    activo?: boolean;
    valor?: string | number;
  }>;
  requisitos?: { // v0.5.3
    atributo: 'fuerza' | 'inteligencia' | 'voluntad' | 'destreza';
    valor_actual: number;
    valor_requerido: number;
  };
  replicas?: number; // v0.5.3 - Cantidad de nodos idénticos
  tablero_id?: string;
  tags?: string[];
  fecha_agregado?: string;
  huerfano?: boolean;
}

interface NodoRef {
  id: string;
  rareza: string;
  huerfano: boolean;
  fecha_agregado?: string;
}

const RAREZA_COLORES = {
  normal: 'bg-gray-700 text-gray-200 border-gray-600',
  magico: 'bg-blue-900 text-blue-200 border-blue-600',
  raro: 'bg-yellow-900 text-yellow-200 border-yellow-600',
  legendario: 'bg-orange-900 text-orange-200 border-orange-600'
};

const RAREZA_LABELS = {
  normal: 'Normal',
  magico: 'Mágico',
  raro: 'Raro',
  legendario: 'Legendario'
};

const CharacterParagon: React.FC<Props> = ({ personaje }) => {
  const [paragonData, setParagonData] = useState<ParagonPersonaje | null>(personaje.paragon || null);
  const [copied, setCopied] = useState(false);
  
  // Nuevos estados para nodos
  const [todosNodos, setTodosNodos] = useState<NodoCompleto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRareza, setFiltroRareza] = useState<string>('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargandoNodos, setCargandoNodos] = useState(false);
  const nodosPorPagina = 12;

  useEffect(() => {
    setParagonData(personaje.paragon || null);
    cargarNodosCompletos();
  }, [personaje.id, personaje.paragon, personaje.paragon_refs]);

  const cargarNodosCompletos = async () => {
    setCargandoNodos(true);
    try {
      // Obtener IDs de nodos del personaje (huérfanos + tableros)
      const nodosHuerfanos = personaje.paragon_refs?.nodos_huerfanos || [];
      const nodosTableros = personaje.paragon_refs?.tableros_equipados?.flatMap(t => 
        (t.nodos_activados_ids || []).map((nodo_id: string) => ({ nodo_id, rareza: 'normal' }))
      ) || [];
      
      const todosIdsNodos: NodoRef[] = [
        ...nodosHuerfanos.map(h => ({ id: h.nodo_id, rareza: h.rareza, huerfano: true, fecha_agregado: h.fecha_agregado })),
        ...nodosTableros.map((n: any) => ({ id: n.nodo_id, rareza: n.rareza || 'normal', huerfano: false }))
      ];

      if (todosIdsNodos.length === 0) {
        setTodosNodos([]);
        setCargandoNodos(false);
        return;
      }

      // Cargar catálogo de nodos del héroe
      const catalogoNodos = await WorkspaceService.loadParagonNodes(personaje.clase);
      
      if (!catalogoNodos) {
        setTodosNodos([]);
        setCargandoNodos(false);
        return;
      }

      // Unificar todos los arrays de nodos por rareza
      const todosNodosCatalogo: NodoCompleto[] = [
        ...(catalogoNodos.nodos_normales || []),
        ...(catalogoNodos.nodos_magicos || []),
        ...(catalogoNodos.nodos_raros || []),
        ...(catalogoNodos.nodos_legendarios || [])
      ];

      // Buscar datos completos de cada nodo
      const nodosCompletos: NodoCompleto[] = todosIdsNodos.map(refNodo => {
        const nodoData = todosNodosCatalogo.find(n => n.id === refNodo.id);
        
        if (!nodoData) {
          // Si no se encuentra, crear nodo placeholder
          return {
            id: refNodo.id,
            nombre: refNodo.id,
            rareza: refNodo.rareza as any,
            huerfano: refNodo.huerfano,
            fecha_agregado: refNodo.fecha_agregado
          };
        }

        return {
          ...nodoData,
          huerfano: refNodo.huerfano,
          fecha_agregado: refNodo.fecha_agregado
        };
      });

      setTodosNodos(nodosCompletos);
    } catch (error) {
      console.error('Error cargando nodos de Paragon:', error);
      setTodosNodos([]);
    } finally {
      setCargandoNodos(false);
    }
  };

  const handleCopyPrompt = () => {
    const prompt = ImageExtractionPromptService.generateParagonCharacterPrompt();
    ImageExtractionPromptService.copyToClipboard(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtrado y paginación de nodos
  const nodosFiltrados = todosNodos.filter(nodo => {
    const matchBusqueda = nodo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                         nodo.id.toLowerCase().includes(busqueda.toLowerCase());
    const matchRareza = filtroRareza === 'todos' || nodo.rareza === filtroRareza;
    return matchBusqueda && matchRareza;
  });

  const totalPaginas = Math.ceil(nodosFiltrados.length / nodosPorPagina);
  const indiceInicio = (paginaActual - 1) * nodosPorPagina;
  const nodosPaginados = nodosFiltrados.slice(indiceInicio, indiceInicio + nodosPorPagina);

  // Reset página al cambiar filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRareza]);

  const nodosHuerfanosCount = todosNodos.filter(n => n.huerfano).length;
  const nodosEnTablerosCount = todosNodos.filter(n => !n.huerfano).length;
  // TODOS los nodos agregados se consideran activos (huérfanos + en tableros)
  const nodosActivosTotal = todosNodos.length;

  return (
    <>
      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleCopyPrompt}
          className="btn btn-secondary flex-1"
          title="Copiar prompt para extraer Paragon con IA"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar Prompt IA'}
        </button>
      </div>

      {/* Estadísticas generales de Paragon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-label">Nivel Paragon</div>
          <div className="stat-value text-orange-400">
            {personaje.atributos_paragon?.nivel_paragon || paragonData?.nivel_paragon || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tableros</div>
          <div className="stat-value text-purple-400">
            {personaje.paragon_refs?.tableros_equipados?.length || paragonData?.tableros_equipados?.length || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Nodos Activos</div>
          <div className="stat-value text-green-400">
            {nodosActivosTotal}
          </div>
          {nodosHuerfanosCount > 0 && nodosEnTablerosCount > 0 && (
            <div className="text-xs text-d4-text-dim mt-1">
              {nodosEnTablerosCount} en tableros + {nodosHuerfanosCount} huérfanos
            </div>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-label flex items-center gap-1">
            Sin Tablero
            {nodosHuerfanosCount > 0 && <AlertCircle className="w-4 h-4 text-orange-400" />}
          </div>
          <div className={`stat-value ${nodosHuerfanosCount > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
            {nodosHuerfanosCount}
          </div>
        </div>
      </div>

      {/* Advertencia de nodos huérfanos */}
      {nodosHuerfanosCount > 0 && (
        <div className="bg-orange-900/20 border border-orange-600/50 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-orange-300 mb-1">
              {nodosHuerfanosCount} nodo{nodosHuerfanosCount !== 1 ? 's' : ''} sin tablero asignado
            </div>
            <div className="text-sm text-orange-200/80">
              Estos nodos están ACTIVOS pero se enlazarán a tableros cuando los importes.
            </div>
          </div>
        </div>
      )}

      {/* Sección de nodos */}
      {todosNodos.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-d4-accent flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Nodos de Paragon ({nodosFiltrados.length})
            </h4>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Buscador */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-d4-text-dim" />
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-d4-bg border border-d4-border rounded-lg text-d4-text focus:outline-none focus:ring-2 focus:ring-d4-accent"
              />
            </div>

            {/* Filtro de rareza */}
            <select
              value={filtroRareza}
              onChange={(e) => setFiltroRareza(e.target.value)}
              className="px-4 py-2 bg-d4-bg border border-d4-border rounded-lg text-d4-text focus:outline-none focus:ring-2 focus:ring-d4-accent"
            >
              <option value="todos">Todas las rarezas</option>
              <option value="normal">Normal</option>
              <option value="magico">Mágico</option>
              <option value="raro">Raro</option>
              <option value="legendario">Legendario</option>
            </select>
          </div>

          {/* Grilla de nodos */}
          {cargandoNodos ? (
            <div className="text-center py-12 text-d4-text-dim">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-d4-accent mx-auto mb-4"></div>
              <p>Cargando nodos...</p>
            </div>
          ) : nodosPaginados.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodosPaginados.map((nodo) => (
                  <div
                    key={nodo.id}
                    className={`bg-d4-bg p-4 rounded-lg border-2 ${RAREZA_COLORES[nodo.rareza]} transition-all hover:shadow-lg`}
                  >
                    {/* Header con nombre y rareza */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 flex items-center gap-2">
                        <h5 className="font-semibold text-sm">{nodo.nombre}</h5>
                        {(nodo as any).replicas && (nodo as any).replicas > 1 && (
                          <span className="px-2 py-0.5 bg-blue-900/40 border border-blue-600/50 rounded text-xs text-blue-300 font-medium">
                            ×{(nodo as any).replicas}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${RAREZA_COLORES[nodo.rareza]} border flex-shrink-0`}>
                        {RAREZA_LABELS[nodo.rareza]}
                      </span>
                    </div>

                    {/* Badge de huérfano */}
                    {nodo.huerfano && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-900/30 border border-orange-600/50 rounded text-xs text-orange-300">
                          <AlertCircle className="w-3 h-3" />
                          Huérfano
                        </span>
                      </div>
                    )}

                    {/* Atributos */}
                    {nodo.atributos && nodo.atributos.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {nodo.atributos.map((attr, idx) => (
                          <div key={idx} className="text-sm flex justify-between">
                            <span className="text-d4-text-dim capitalize">{attr.tipo.replace(/_/g, ' ')}</span>
                            <span className="text-green-400 font-medium">+{attr.valor}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Detalles del nodo (v0.5.3) */}
                    {nodo.detalles && nodo.detalles.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {nodo.detalles.map((detalle, idx) => (
                          <div 
                            key={idx} 
                            className={`text-sm ${detalle.activo === false ? 'text-gray-500' : 'text-d4-text'}`}
                          >
                            {detalle.texto}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bonificación extra con requisitos */}
                    {nodo.bonificacion?.descripcion && (
                      <div className="text-xs text-purple-300 mt-2 p-2 bg-purple-900/20 border border-purple-600/30 rounded">
                        <div className="font-semibold mb-1">✨ Bonificación:</div>
                        {nodo.bonificacion.descripcion}
                        {nodo.bonificacion.requisitos && (
                          <div className="mt-1 text-purple-200/70 text-xs">
                            {nodo.bonificacion.requisitos}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requisitos numéricos (v0.5.3) */}
                    {nodo.requisitos?.atributo && nodo.requisitos.valor_actual !== undefined && nodo.requisitos.valor_requerido !== undefined && (
                      <div className="text-xs mt-2 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded">
                        <div className="flex items-center gap-1 text-yellow-300">
                          <AlertCircle className="w-3 h-3" />
                          <span className="font-semibold">Requisito:</span>
                        </div>
                        <div className="text-yellow-200 mt-1">
                          {nodo.requisitos.atributo.charAt(0).toUpperCase() + nodo.requisitos.atributo.slice(1)}: {nodo.requisitos.valor_actual} / {nodo.requisitos.valor_requerido}
                          {nodo.requisitos.valor_actual >= nodo.requisitos.valor_requerido ? (
                            <span className="text-green-400 ml-2">✓ Cumplido</span>
                          ) : (
                            <span className="text-red-400 ml-2">✗ Falta {nodo.requisitos.valor_requerido - nodo.requisitos.valor_actual}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Efectos especiales */}
                    {nodo.efecto_especial && (
                      <div className="text-xs text-blue-300 mt-2 p-2 bg-blue-900/20 border border-blue-600/30 rounded">
                        {nodo.efecto_especial}
                      </div>
                    )}

                    {/* Efecto principal (legendarios) */}
                    {nodo.efecto_principal && (
                      <div className="text-xs text-orange-300 mt-2 p-2 bg-orange-900/20 border border-orange-600/30 rounded">
                        <div className="font-semibold mb-1">🔸 Efecto:</div>
                        {nodo.efecto_principal}
                        {nodo.condicion && (
                          <div className="mt-1 text-orange-200/70">Req: {nodo.condicion}</div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {nodo.tags && nodo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {nodo.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-d4-surface/50 rounded text-xs text-d4-text-dim">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* ID (debug) */}
                    <div className="text-xs text-d4-text-dim mt-2 pt-2 border-t border-d4-border/30">
                      ID: {nodo.id}
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginador */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-d4-border">
                  <div className="text-sm text-d4-text-dim">
                    Página {paginaActual} de {totalPaginas} • {nodosFiltrados.length} nodo{nodosFiltrados.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                      disabled={paginaActual === 1}
                      className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-d4-text-dim">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron nodos con los filtros aplicados</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-d4-text-dim">
          <Grid3x3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No hay nodos de Paragon configurados para este personaje</p>
          <p className="text-sm mt-2">Importa datos de Paragon usando la herramienta de captura de imágenes</p>
        </div>
      )}
    </>
  );
};

export default CharacterParagon;
