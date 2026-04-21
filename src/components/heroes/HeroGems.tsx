import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Search, Gem } from 'lucide-react';
import { Gema } from '../../types';
import { WorkspaceService } from '../../services/WorkspaceService';

interface Props {
  clase: string;
}

const HeroGems: React.FC<Props> = ({ clase }) => {
  const [gemas, setGemas] = useState<Gema[]>([]);
  const [filteredGemas, setFilteredGemas] = useState<Gema[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [editingGem, setEditingGem] = useState<Gema | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGem, setNewGem] = useState<Partial<Gema>>({
    nombre: '',
    tipo: 'topacio',
    calidad: 'normal',
    efectos: {
      arma: '',
      armadura: '',
      joyas: ''
    },
    descripcion: '',
    tags: []
  });

  useEffect(() => {
    loadGemas();
  }, [clase]);

  useEffect(() => {
    applyFilters();
  }, [gemas, searchTerm, filterTipo]);

  const loadGemas = async () => {
    try {
      const heroGems = await WorkspaceService.loadHeroGems(clase);
      if (heroGems) {
        setGemas(heroGems.gemas);
      }
    } catch (error) {
      console.error('Error cargando gemas:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...gemas];

    if (searchTerm) {
      filtered = filtered.filter(g =>
        g.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.tipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.calidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterTipo !== 'all') {
      filtered = filtered.filter(g => g.tipo === filterTipo);
    }

    setFilteredGemas(filtered);
  };

  const handleSaveGem = async (gem: Gema) => {
    try {
      const heroGems = await WorkspaceService.loadHeroGems(clase);
      const index = heroGems.gemas.findIndex(g => g.id === gem.id);
      
      if (index >= 0) {
        heroGems.gemas[index] = gem;
      }

      await WorkspaceService.saveHeroGems(clase, heroGems);
      setEditingGem(null);
      loadGemas();
    } catch (error) {
      console.error('Error guardando gema:', error);
    }
  };

  const handleAddGem = async () => {
    if (!newGem.nombre || !newGem.efectos?.arma || !newGem.efectos?.armadura || !newGem.efectos?.joyas) {
      alert('Por favor completa todos los efectos (arma, armadura, joyas)');
      return;
    }

    try {
      const heroGems = await WorkspaceService.loadHeroGems(clase);
      const gemId = `gema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      heroGems.gemas.push({
        ...newGem as Gema,
        id: gemId
      });

      await WorkspaceService.saveHeroGems(clase, heroGems);
      setShowAddForm(false);
      setNewGem({
        nombre: '',
        tipo: 'topacio',
        calidad: 'normal',
        efectos: {
          arma: '',
          armadura: '',
          joyas: ''
        },
        descripcion: '',
        tags: []
      });
      loadGemas();
    } catch (error) {
      console.error('Error agregando gema:', error);
    }
  };

  const handleDeleteGem = async (gemId: string) => {
    if (!confirm('¿Eliminar esta gema del catálogo?')) return;

    try {
      const heroGems = await WorkspaceService.loadHeroGems(clase);
      heroGems.gemas = heroGems.gemas.filter(g => g.id !== gemId);
      await WorkspaceService.saveHeroGems(clase, heroGems);
      loadGemas();
    } catch (error) {
      console.error('Error eliminando gema:', error);
    }
  };

  const getTipoColor = (tipo?: string) => {
    const colors: Record<string, string> = {
      craneo: 'text-gray-400',
      topacio: 'text-orange-400',
      esmeralda: 'text-green-400',
      rubi: 'text-red-400',
      diamante: 'text-cyan-400',
      amatista: 'text-purple-400',
      zafiro: 'text-blue-400'
    };
    return colors[tipo || ''] || 'text-gray-400';
  };

  const GemCard = ({ gem }: { gem: Gema }) => {
    const isEditing = editingGem?.id === gem.id;

    if (isEditing) {
      return (
        <div className="card border-2 border-d4-gold">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-d4-text-dim mb-1">Nombre</label>
              <input
                type="text"
                value={editingGem.nombre}
                onChange={(e) => setEditingGem({ ...editingGem, nombre: e.target.value })}
                className="input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Tipo</label>
                <select
                  value={editingGem.tipo}
                  onChange={(e) => setEditingGem({ ...editingGem, tipo: e.target.value })}
                  className="input w-full"
                >
                  <option value="craneo">Cráneo</option>
                  <option value="topacio">Topacio</option>
                  <option value="esmeralda">Esmeralda</option>
                  <option value="rubi">Rubí</option>
                  <option value="diamante">Diamante</option>
                  <option value="amatista">Amatista</option>
                  <option value="zafiro">Zafiro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Calidad</label>
                <input
                  type="text"
                  value={editingGem.calidad || ''}
                  onChange={(e) => setEditingGem({ ...editingGem, calidad: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: marqués, impecable"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1">🗡️ Efecto en Arma</label>
              <input
                type="text"
                value={editingGem.efectos?.arma || ''}
                onChange={(e) => setEditingGem({
                  ...editingGem,
                  efectos: { ...(editingGem.efectos || {}), arma: e.target.value }
                })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1">🛡️ Efecto en Armadura</label>
              <input
                type="text"
                value={editingGem.efectos?.armadura || ''}
                onChange={(e) => setEditingGem({
                  ...editingGem,
                  efectos: { ...(editingGem.efectos || {}), armadura: e.target.value }
                })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1">💍 Efecto en Joyas</label>
              <input
                type="text"
                value={editingGem.efectos?.joyas || ''}
                onChange={(e) => setEditingGem({
                  ...editingGem,
                  efectos: { ...(editingGem.efectos || {}), joyas: e.target.value }
                })}
                className="input w-full"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSaveGem(editingGem)}
                className="btn-primary flex-1"
              >
                <Save className="w-4 h-4 inline mr-1" />
                Guardar
              </button>
              <button
                onClick={() => setEditingGem(null)}
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
      <div className="card border border-d4-border hover:border-d4-gold/30 transition-colors">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Gem className={`w-5 h-5 ${getTipoColor(gem.tipo || 'topacio')}`} />
              <h4 className="text-lg font-bold text-d4-gold">
                {gem.nombre}
              </h4>
            </div>
            <p className="text-sm text-d4-text-dim capitalize">
              {gem.tipo} {gem.calidad && `- ${gem.calidad}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingGem(gem)}
              className="text-d4-gold hover:text-d4-gold-light"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteGem(gem.id)}
              className="text-red-400 hover:text-red-300"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="p-2 bg-red-900/10 border border-red-500/20 rounded">
            <p className="text-xs text-red-400 font-semibold mb-1">🗡️ Arma</p>
            <p className="text-sm text-d4-text">{gem.efectos?.arma || '-'}</p>
          </div>

          <div className="p-2 bg-blue-900/10 border border-blue-500/20 rounded">
            <p className="text-xs text-blue-400 font-semibold mb-1">🛡️ Armadura</p>
            <p className="text-sm text-d4-text">{gem.efectos?.armadura || '-'}</p>
          </div>

          <div className="p-2 bg-purple-900/10 border border-purple-500/20 rounded">
            <p className="text-xs text-purple-400 font-semibold mb-1">💍 Joyas</p>
            <p className="text-sm text-d4-text">{gem.efectos?.joyas || '-'}</p>
          </div>
        </div>

        {gem.descripcion && (
          <p className="text-xs text-d4-text-dim italic mt-3">
            {gem.descripcion}
          </p>
        )}

        {gem.tags && gem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {gem.tags.map((tag, idx) => (
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
      {/* Header con filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-d4-text-dim" />
            <input
              type="text"
              placeholder="Buscar gemas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full !pl-14"
            />
          </div>
        </div>

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="input"
        >
          <option value="all">Todos los tipos</option>
          <option value="craneo">Cráneo</option>
          <option value="topacio">Topacio</option>
          <option value="esmeralda">Esmeralda</option>
          <option value="rubi">Rubí</option>
          <option value="diamante">Diamante</option>
          <option value="amatista">Amatista</option>
          <option value="zafiro">Zafiro</option>
        </select>

        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Gema
        </button>
      </div>

      <div className="text-sm text-d4-text-dim">
        Total: {filteredGemas.length} gemas
      </div>

      {/* Formulario agregar gema */}
      {showAddForm && (
        <div className="card border-2 border-d4-gold bg-d4-dark">
          <h4 className="text-lg font-bold text-d4-gold mb-4">Nueva Gema</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-d4-text-dim mb-1">Nombre *</label>
              <input
                type="text"
                value={newGem.nombre}
                onChange={(e) => setNewGem({ ...newGem, nombre: e.target.value })}
                className="input w-full"
                placeholder="Ej: Cráneo Marqués, Topacio Impecable"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Tipo *</label>
                <select
                  value={newGem.tipo}
                  onChange={(e) => setNewGem({ ...newGem, tipo: e.target.value })}
                  className="input w-full"
                >
                  <option value="craneo">Cráneo</option>
                  <option value="topacio">Topacio</option>
                  <option value="esmeralda">Esmeralda</option>
                  <option value="rubi">Rubí</option>
                  <option value="diamante">Diamante</option>
                  <option value="amatista">Amatista</option>
                  <option value="zafiro">Zafiro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-d4-text-dim mb-1">Calidad</label>
                <input
                  type="text"
                  value={newGem.calidad || ''}
                  onChange={(e) => setNewGem({ ...newGem, calidad: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: marqués, impecable"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1">🗡️ Efecto en Arma *</label>
              <input
                type="text"
                value={newGem.efectos?.arma || ''}
                onChange={(e) => setNewGem({
                  ...newGem,
                  efectos: { ...newGem.efectos!, arma: e.target.value }
                })}
                className="input w-full"
                placeholder="Ej: +30% daño de habilidades básicas"
              />
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1">🛡️ Efecto en Armadura *</label>
              <input
                type="text"
                value={newGem.efectos?.armadura || ''}
                onChange={(e) => setNewGem({
                  ...newGem,
                  efectos: { ...newGem.efectos!, armadura: e.target.value }
                })}
                className="input w-full"
                placeholder="Ej: +30 de Inteligencia"
              />
            </div>

            <div>
              <label className="block text-xs text-d4-text-dim mb-1">💍 Efecto en Joyas *</label>
              <input
                type="text"
                value={newGem.efectos?.joyas || ''}
                onChange={(e) => setNewGem({
                  ...newGem,
                  efectos: { ...newGem.efectos!, joyas: e.target.value }
                })}
                className="input w-full"
                placeholder="Ej: +450 de resistencia al rayo"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddGem}
                className="btn-primary flex-1"
              >
                <Save className="w-4 h-4 inline mr-1" />
                Guardar Gema
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

      {/* Grid de gemas */}
      {filteredGemas.length === 0 ? (
        <div className="text-center text-d4-text-dim py-8 border border-dashed border-d4-border rounded">
          <Gem className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay gemas en el catálogo</p>
          <p className="text-xs mt-1">Agrega gemas manualmente o importa desde JSON</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGemas.map((gem) => (
            <GemCard key={gem.id} gem={gem} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroGems;
