import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Search, Sparkles } from 'lucide-react';
import { Runa } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';

interface Props {
  clase: string;
}

const HeroRunes: React.FC<Props> = ({ clase }) => {
  const [runas, setRunas] = useState<Runa[]>([]);
  const [filteredRunas, setFilteredRunas] = useState<Runa[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'invocacion' | 'ritual'>('all');
  const [filterRareza, setFilterRareza] = useState<'all' | 'legendario' | 'raro' | 'magico'>('all');
  const [editingRune, setEditingRune] = useState<Runa | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRune, setNewRune] = useState<Partial<Runa>>({
    nombre: '',
    rareza: 'magico',
    tipo: 'invocacion',
    efecto: '',
    requerimiento: {
      tipo: 'requiere',
      ofrenda: 5
    },
    descripcion: '',
    tags: []
  });

  useEffect(() => {
    loadRunas();
  }, [clase]);

  useEffect(() => {
    applyFilters();
  }, [runas, searchTerm, filterTipo, filterRareza]);

  const loadRunas = async () => {
    try {
      const heroRunes = await WorkspaceService.loadHeroRunes(clase);
      if (heroRunes) {
        setRunas(heroRunes.runas);
      }
    } catch (error) {
      console.error('Error cargando runas:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...runas];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.efecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por tipo
    if (filterTipo !== 'all') {
      filtered = filtered.filter(r => r.tipo === filterTipo);
    }

    // Filtro por rareza
    if (filterRareza !== 'all') {
      filtered = filtered.filter(r => r.rareza === filterRareza);
    }

    setFilteredRunas(filtered);
  };

  const handleSaveRune = async (rune: Runa) => {
    try {
      const heroRunes = await WorkspaceService.loadHeroRunes(clase);
      const index = heroRunes.runas.findIndex(r => r.id === rune.id);
      
      if (index >= 0) {
        heroRunes.runas[index] = rune;
      }

      await WorkspaceService.saveHeroRunes(clase, heroRunes);
      setEditingRune(null);
      loadRunas();
    } catch (error) {
      console.error('Error guardando runa:', error);
    }
  };

  const handleAddRune = async () => {
    if (!newRune.nombre || !newRune.efecto) {
      alert('Por favor completa los campos obligatorios (nombre y efecto)');
      return;
    }

    try {
      const heroRunes = await WorkspaceService.loadHeroRunes(clase);
      const runeId = `runa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      heroRunes.runas.push({
        ...newRune as Runa,
        id: runeId
      });

      await WorkspaceService.saveHeroRunes(clase, heroRunes);
      setShowAddForm(false);
      setNewRune({
        nombre: '',
        rareza: 'magico',
        tipo: 'invocacion',
        efecto: '',
        requerimiento: {
          tipo: 'requiere',
          ofrenda: 5
        },
        descripcion: '',
        tags: []
      });
      loadRunas();
    } catch (error) {
      console.error('Error agregando runa:', error);
    }
  };

  const handleDeleteRune = async (runeId: string) => {
    if (!confirm('¿Eliminar esta runa del catálogo?')) return;

    try {
      const heroRunes = await WorkspaceService.loadHeroRunes(clase);
      heroRunes.runas = heroRunes.runas.filter(r => r.id !== runeId);
      await WorkspaceService.saveHeroRunes(clase, heroRunes);
      loadRunas();
    } catch (error) {
      console.error('Error eliminando runa:', error);
    }
  };

  const getRarezaColor = (rareza: string) => {
    switch (rareza) {
      case 'legendario': return 'text-orange-400 border-orange-500/30 bg-orange-900/10';
      case 'raro': return 'text-yellow-400 border-yellow-500/30 bg-yellow-900/10';
      case 'magico': return 'text-blue-400 border-blue-500/30 bg-blue-900/10';
      default: return 'text-gray-400 border-gray-500/30 bg-gray-900/10';
    }
  };

  const getTipoColor = (tipo: string) => {
    return tipo === 'invocacion' ? 'text-red-400' : 'text-purple-400';
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === 'invocacion' ? '🔴' : '🟣';
  };

  const RuneCard = ({ rune }: { rune: Runa }) => {
    const isEditing = editingRune?.id === rune.id;

    if (isEditing) {
      return (
        <div className={`card border-2 ${getRarezaColor(rune.rareza)}`}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-d4-text-dim mb-1">Nombre</label>
              <input
                type="text"
                value={editingRune.nombre}
                onChange={(e) => setEditingRune({ ...editingRune, nombre: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Tipo</label>
                <select
                  value={editingRune.tipo}
                  onChange={(e) => setEditingRune({ ...editingRune, tipo: e.target.value as 'invocacion' | 'ritual' })}
                  className="input w-full"
                >
                  <option value="invocacion">Invocación</option>
                  <option value="ritual">Ritual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Rareza</label>
                <select
                  value={editingRune.rareza}
                  onChange={(e) => setEditingRune({ ...editingRune, rareza: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="legendario">Legendario</option>
                  <option value="raro">Raro</option>
                  <option value="magico">Mágico</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1">Efecto</label>
              <textarea
                value={editingRune.efecto}
                onChange={(e) => setEditingRune({ ...editingRune, efecto: e.target.value })}
                className="input w-full h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Req/Obt</label>
                <select
                  value={editingRune.requerimiento?.tipo || 'requiere'}
                  onChange={(e) => setEditingRune({
                    ...editingRune,
                    requerimiento: {
                      ...editingRune.requerimiento!,
                      tipo: e.target.value as 'requiere' | 'obtiene'
                    }
                  })}
                  className="input w-full"
                >
                  <option value="requiere">Requiere</option>
                  <option value="obtiene">Obtiene</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Ofrenda</label>
                <input
                  type="number"
                  value={editingRune.requerimiento?.ofrenda || 5}
                  onChange={(e) => setEditingRune({
                    ...editingRune,
                    requerimiento: {
                      ...editingRune.requerimiento!,
                      ofrenda: parseInt(e.target.value)
                    }
                  })}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSaveRune(editingRune)}
                className="btn-primary flex-1"
              >
                <Save className="w-4 h-4 inline mr-1" />
                Guardar
              </button>
              <button
                onClick={() => setEditingRune(null)}
                className="btn-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`card border-2 ${getRarezaColor(rune.rareza)}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getTipoIcon(rune.tipo)}</span>
              <h4 className={`text-lg font-bold ${getRarezaColor(rune.rareza)}`}>
                {rune.nombre}
              </h4>
            </div>
            <p className={`text-sm font-semibold ${getTipoColor(rune.tipo)}`}>
              Runa de {rune.tipo === 'invocacion' ? 'Invocación' : 'Ritual'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingRune(rune)}
              className="text-d4-gold hover:text-d4-gold-light"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteRune(rune.id)}
              className="text-red-400 hover:text-red-300"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {rune.requerimiento && (
          <div className="mb-3 p-2 bg-d4-surface/50 rounded border border-d4-border">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-d4-text-dim">
                {rune.requerimiento.tipo === 'requiere' ? '🔸 Requiere:' : '🔹 Obtiene:'}
              </span>
              <span className="text-d4-gold font-semibold">
                ofrenda de {rune.requerimiento.ofrenda}
              </span>
            </div>
          </div>
        )}

        <div className="mb-3">
          <p className={`text-sm ${getTipoColor(rune.tipo)}`}>
            {rune.efecto}
          </p>
        </div>

        {rune.descripcion && (
          <p className="text-xs text-d4-text-dim italic mb-3">
            {rune.descripcion}
          </p>
        )}

        {rune.tags && rune.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {rune.tags.map((tag, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-d4-surface/50 rounded text-xs text-d4-text-dim">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header con título */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-d4-accent/20 rounded-lg border-2 border-d4-accent/40">
          <Sparkles className="w-6 h-6 text-d4-accent" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-d4-accent">Runas</h3>
          <p className="text-xs text-d4-text-dim">Catálogo de runas disponibles</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-d4-text-dim" />
            <input
              type="text"
              placeholder="Buscar runas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full !pl-14"
            />
          </div>
        </div>

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value as any)}
          className="input"
        >
          <option value="all">Todos los tipos</option>
          <option value="invocacion">🔴 Invocación</option>
          <option value="ritual">🟣 Ritual</option>
        </select>

        <select
          value={filterRareza}
          onChange={(e) => setFilterRareza(e.target.value as any)}
          className="input"
        >
          <option value="all">Todas las rarezas</option>
          <option value="legendario">Legendario</option>
          <option value="raro">Raro</option>
          <option value="magico">Mágico</option>
        </select>

        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Runa
        </button>
      </div>

      <div className="text-sm text-d4-text-dim">
        Total: {filteredRunas.length} runas
      </div>

      {/* Formulario agregar runa */}
      {showAddForm && (
        <div className="card border-2 border-d4-gold bg-d4-dark">
          <h4 className="text-lg font-bold text-d4-gold mb-4">Nueva Runa</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-d4-text-dim mb-1">Nombre *</label>
              <input
                type="text"
                value={newRune.nombre}
                onChange={(e) => setNewRune({ ...newRune, nombre: e.target.value })}
                className="input w-full"
                placeholder="Ej: EФM, CHAC, YAX"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Tipo *</label>
                <select
                  value={newRune.tipo}
                  onChange={(e) => setNewRune({ ...newRune, tipo: e.target.value as 'invocacion' | 'ritual' })}
                  className="input w-full"
                >
                  <option value="invocacion">🔴 Invocación</option>
                  <option value="ritual">🟣 Ritual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Rareza *</label>
                <select
                  value={newRune.rareza}
                  onChange={(e) => setNewRune({ ...newRune, rareza: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="legendario">Legendario</option>
                  <option value="raro">Raro</option>
                  <option value="magico">Mágico</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1">Efecto *</label>
              <textarea
                value={newRune.efecto}
                onChange={(e) => setNewRune({ ...newRune, efecto: e.target.value })}
                className="input w-full h-20"
                placeholder="Descripción del efecto de la runa"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Requerimiento/Obtención</label>
                <select
                  value={newRune.requerimiento?.tipo || 'requiere'}
                  onChange={(e) => setNewRune({
                    ...newRune,
                    requerimiento: {
                      tipo: e.target.value as 'requiere' | 'obtiene',
                      ofrenda: newRune.requerimiento?.ofrenda || 5
                    }
                  })}
                  className="input w-full"
                >
                  <option value="requiere">Requiere ofrenda</option>
                  <option value="obtiene">Obtiene ofrenda</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Cantidad de ofrenda</label>
                <input
                  type="number"
                  value={newRune.requerimiento?.ofrenda || 5}
                  onChange={(e) => setNewRune({
                    ...newRune,
                    requerimiento: {
                      tipo: newRune.requerimiento?.tipo || 'requiere',
                      ofrenda: parseInt(e.target.value)
                    }
                  })}
                  className="input w-full"
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddRune}
                className="btn-primary flex-1"
              >
                <Save className="w-4 h-4 inline mr-1" />
                Guardar Runa
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de runas */}
      {filteredRunas.length === 0 ? (
        <div className="text-center text-d4-text-dim py-8 border border-dashed border-d4-border rounded">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay runas en el catálogo</p>
          <p className="text-xs mt-1">Agrega runas manualmente o importa desde JSON</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRunas.map((rune) => (
            <RuneCard key={rune.id} rune={rune} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroRunes;
