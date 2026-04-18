import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Gem, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkspaceService } from '../../services/WorkspaceService';
import { Runa, Gema } from '../../types';

const RunesGemsSection: React.FC = () => {
  const [runas, setRunas] = useState<Runa[]>([]);
  const [gemas, setGemas] = useState<Gema[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'runas' | 'gemas'>('runas');
  const [search, setSearch] = useState('');
  const [expandedRunes, setExpandedRunes] = useState<Set<string>>(new Set());
  const [expandedGems, setExpandedGems] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(80);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const catalog = await WorkspaceService.loadRunesGemsCatalog();
      setRunas(catalog.runas || []);
      setGemas(catalog.gemas || []);
    } catch (error) {
      console.error('Error cargando catalogo de runas/gemas:', error);
      setRunas([]);
      setGemas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  useEffect(() => {
    setVisibleCount(80);
  }, [search, activeTab]);

  const normalizedText = (value: string): string =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const classifyGemByColor = (tipo?: string): { label: string; frameClass: string; accentClass: string } => {
    const key = normalizedText(tipo || '');
    if (key.includes('rubi')) return { label: 'rojo', frameClass: 'border-red-500/50 bg-red-950/18 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]', accentClass: 'text-red-300' };
    if (key.includes('zafiro')) return { label: 'azul', frameClass: 'border-blue-500/50 bg-blue-950/18 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]', accentClass: 'text-blue-300' };
    if (key.includes('esmeralda')) return { label: 'verde', frameClass: 'border-green-500/50 bg-green-950/18 shadow-[0_0_0_1px_rgba(34,197,94,0.12)]', accentClass: 'text-green-300' };
    if (key.includes('topacio')) return { label: 'amarillo', frameClass: 'border-yellow-500/50 bg-yellow-950/18 shadow-[0_0_0_1px_rgba(234,179,8,0.12)]', accentClass: 'text-yellow-300' };
    if (key.includes('amatista')) return { label: 'morado', frameClass: 'border-purple-500/50 bg-purple-950/18 shadow-[0_0_0_1px_rgba(168,85,247,0.12)]', accentClass: 'text-purple-300' };
    if (key.includes('diamante')) return { label: 'blanco', frameClass: 'border-slate-200/45 bg-slate-100/6 shadow-[0_0_0_1px_rgba(226,232,240,0.08)]', accentClass: 'text-slate-100' };
    if (key.includes('craneo')) return { label: 'gris', frameClass: 'border-slate-500/45 bg-slate-900/28 shadow-[0_0_0_1px_rgba(100,116,139,0.12)]', accentClass: 'text-slate-300' };
    return { label: 'sin-clasificar', frameClass: 'border-d4-border bg-d4-surface', accentClass: 'text-d4-text-dim' };
  };

  const classifyRuneByTypeColor = (tipo?: string): { label: string; frameClass: string; accentClass: string } => {
    const key = normalizedText(tipo || '');
    if (key.includes('invoc')) return { label: 'morado', frameClass: 'border-purple-500/50 bg-purple-950/18 shadow-[0_0_0_1px_rgba(168,85,247,0.12)]', accentClass: 'text-purple-300' };
    if (key.includes('ritual')) return { label: 'naranjo', frameClass: 'border-orange-500/50 bg-orange-950/18 shadow-[0_0_0_1px_rgba(249,115,22,0.12)]', accentClass: 'text-orange-300' };
    return { label: 'sin-clasificar', frameClass: 'border-d4-border bg-d4-surface', accentClass: 'text-d4-text-dim' };
  };

  const filteredRunes = useMemo(() => {
    const q = normalizedText(search);
    if (!q) return runas;
    return runas.filter((runa) => {
      const corpus = [
        runa.id,
        runa.nombre,
        runa.rareza,
        runa.tipo,
        runa.efecto,
        runa.descripcion,
        runa.objeto_origen,
        ...(runa.tags || [])
      ].map((v) => normalizedText(String(v || ''))).join(' ');
      return corpus.includes(q);
    });
  }, [runas, search]);

  const filteredGems = useMemo(() => {
    const q = normalizedText(search);
    if (!q) return gemas;
    return gemas.filter((gema) => {
      const effects = gema.efectos_por_slot
        ? [gema.efectos_por_slot.arma?.descripcion, gema.efectos_por_slot.armadura?.descripcion, gema.efectos_por_slot.joyas?.descripcion]
        : [gema.efectos?.arma, gema.efectos?.armadura, gema.efectos?.joyas];
      const corpus = [
        gema.id,
        gema.nombre,
        gema.tipo,
        gema.calidad,
        gema.descripcion_lore,
        gema.descripcion,
        ...(effects.filter(Boolean) as string[]),
        ...(gema.tags || [])
      ].map((v) => normalizedText(String(v || ''))).join(' ');
      return corpus.includes(q);
    });
  }, [gemas, search]);

  const toggleRune = (id: string) => {
    setExpandedRunes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGem = (id: string) => {
    setExpandedGems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleRunes = filteredRunes.slice(0, visibleCount);
  const visibleGems = filteredGems.slice(0, visibleCount);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-d4-text mb-1">Gemas/Runas</h2>
          <p className="text-d4-text-dim text-sm">
            Catalogo global compartido con detalle tecnico, clasificacion por color y busqueda optimizada.
          </p>
        </div>
        <button
          onClick={() => void loadCatalog()}
          className="btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Recargar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className={`card text-left transition-all ${activeTab === 'runas' ? 'ring-1 ring-d4-accent' : ''}`} onClick={() => setActiveTab('runas')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-d4-accent" />
              <h3 className="text-lg font-bold text-d4-text">Runas</h3>
            </div>
            <span className="text-d4-accent font-bold">{runas.length}</span>
          </div>
        </button>
        <button className={`card text-left transition-all ${activeTab === 'gemas' ? 'ring-1 ring-d4-accent' : ''}`} onClick={() => setActiveTab('gemas')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gem className="w-5 h-5 text-d4-accent" />
              <h3 className="text-lg font-bold text-d4-text">Gemas</h3>
            </div>
            <span className="text-d4-accent font-bold">{gemas.length}</span>
          </div>
        </button>
      </div>

      <div className="card">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-d4-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'runas' ? 'Buscar runas por nombre, efecto, tags...' : 'Buscar gemas por nombre, calidad, efectos...'}
            className="input w-full pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-10 text-d4-text-dim">Cargando catalogo...</div>
      ) : (
        <>
          {activeTab === 'runas' && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-d4-accent">Listado de Runas</h4>
                <span className="text-xs text-d4-text-dim">Mostrando {visibleRunes.length}/{filteredRunes.length}</span>
              </div>
              {filteredRunes.length === 0 ? (
                <p className="text-d4-text-dim text-sm">No hay runas que coincidan con el filtro.</p>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
                  {visibleRunes.map((runa) => {
                    const isOpen = expandedRunes.has(runa.id);
                    const typeColor = classifyRuneByTypeColor(runa.tipo);
                    return (
                      <div key={runa.id} className={`rounded border overflow-hidden transition-colors ${typeColor.frameClass}`}>
                        <button
                          onClick={() => toggleRune(runa.id)}
                          className="w-full p-3 text-left hover:bg-black/10 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-base ${typeColor.accentClass}`}>{runa.nombre}</span>
                                {(runa.en_bolsas !== undefined && runa.en_bolsas > 0) && (
                                  <span className="px-1.5 py-0.5 rounded bg-d4-accent/20 text-d4-accent text-[10px] font-bold border border-d4-accent/30">
                                    x{runa.en_bolsas}
                                  </span>
                                )}
                              </div>
                              <div className="text-d4-text-dim text-xs mt-1 flex flex-wrap gap-2 items-center">
                                <span className="capitalize">{runa.tipo} · {runa.rareza}</span>
                                <span>{typeColor.label}</span>
                                {runa.requerimiento?.ofrenda !== undefined && (
                                  <span>ofrenda: {runa.requerimiento.tipo} {runa.requerimiento.ofrenda}</span>
                                )}
                              </div>
                            </div>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-d4-text-dim" /> : <ChevronDown className="w-4 h-4 text-d4-text-dim" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-3 border-t border-white/10 space-y-2">
                            {runa.efecto && (
                              <div>
                                <p className="text-[11px] text-d4-text-dim">Efecto</p>
                                <p className="text-sm text-d4-text">{runa.efecto}</p>
                              </div>
                            )}
                            {runa.descripcion && (
                              <div>
                                <p className="text-[11px] text-d4-text-dim">Detalle</p>
                                <p className="text-sm text-d4-text-dim italic">{runa.descripcion}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-d4-text-dim">
                              <div>ID: <span className="text-d4-text">{runa.id}</span></div>
                              <div>Venta: <span className="text-d4-text">{runa.valor_venta ?? '-'}</span></div>
                              <div>Bolsas: <span className="text-d4-text">{runa.en_bolsas ?? '-'}</span></div>
                              <div>Origen: <span className="text-d4-text">{runa.objeto_origen || '-'}</span></div>
                            </div>
                            {Array.isArray(runa.tags) && runa.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {runa.tags.map((tag, idx) => (
                                  <span key={`${runa.id}-tag-${idx}`} className="px-2 py-0.5 rounded bg-d4-bg border border-d4-border text-[11px] text-d4-text-dim">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {visibleRunes.length < filteredRunes.length && (
                    <button
                      onClick={() => setVisibleCount((c) => c + 80)}
                      className="w-full py-2 rounded bg-d4-bg border border-d4-border text-sm text-d4-accent hover:bg-d4-border/20"
                    >
                      Mostrar mas runas
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'gemas' && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-d4-accent">Listado de Gemas</h4>
                <span className="text-xs text-d4-text-dim">Mostrando {visibleGems.length}/{filteredGems.length}</span>
              </div>
              {filteredGems.length === 0 ? (
                <p className="text-d4-text-dim text-sm">No hay gemas que coincidan con el filtro.</p>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
                  {visibleGems.map((gema) => {
                    const isOpen = expandedGems.has(gema.id);
                    const gemColor = classifyGemByColor(gema.tipo);
                    const arma = gema.efectos_por_slot?.arma?.descripcion || gema.efectos?.arma;
                    const armadura = gema.efectos_por_slot?.armadura?.descripcion || gema.efectos?.armadura;
                    const joyas = gema.efectos_por_slot?.joyas?.descripcion || gema.efectos?.joyas;
                    return (
                      <div key={gema.id} className={`rounded border overflow-hidden transition-colors ${gemColor.frameClass}`}>
                        <button
                          onClick={() => toggleGem(gema.id)}
                          className="w-full p-3 text-left hover:bg-black/10 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold text-base ${gemColor.accentClass}`}>{gema.nombre}</span>
                                {(gema.en_bolsas !== undefined && gema.en_bolsas > 0) && (
                                  <span className="px-1.5 py-0.5 rounded bg-d4-accent/20 text-d4-accent text-[10px] font-bold border border-d4-accent/30">
                                    x{gema.en_bolsas}
                                  </span>
                                )}
                              </div>
                              <div className="text-d4-text-dim text-xs mt-1 flex flex-wrap gap-2 items-center">
                                <span className="capitalize">{gema.tipo || 'gema'}{gema.calidad ? ` · ${gema.calidad}` : ''}</span>
                                <span>{gemColor.label}</span>
                                {gema.requerimientos?.nivel !== undefined && <span>nivel req: {gema.requerimientos.nivel}</span>}
                              </div>
                            </div>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-d4-text-dim" /> : <ChevronDown className="w-4 h-4 text-d4-text-dim" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-3 border-t border-white/10 space-y-2">
                            <div className="grid md:grid-cols-3 gap-2">
                              <div className="p-2 rounded bg-red-900/10 border border-red-500/30">
                                <p className="text-[11px] text-red-300">Arma</p>
                                <p className="text-sm text-d4-text">{arma || '-'}</p>
                              </div>
                              <div className="p-2 rounded bg-blue-900/10 border border-blue-500/30">
                                <p className="text-[11px] text-blue-300">Armadura</p>
                                <p className="text-sm text-d4-text">{armadura || '-'}</p>
                              </div>
                              <div className="p-2 rounded bg-purple-900/10 border border-purple-500/30">
                                <p className="text-[11px] text-purple-300">Joyas</p>
                                <p className="text-sm text-d4-text">{joyas || '-'}</p>
                              </div>
                            </div>

                            {(gema.descripcion_lore || gema.descripcion) && (
                              <div>
                                <p className="text-[11px] text-d4-text-dim">Lore/Detalle</p>
                                <p className="text-sm text-d4-text-dim italic">{gema.descripcion_lore || gema.descripcion}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-d4-text-dim">
                              <div>ID: <span className="text-d4-text">{gema.id}</span></div>
                              <div>Tier: <span className="text-d4-text">{gema.rango_calidad ?? '-'}</span></div>
                              <div>Bolsas: <span className="text-d4-text">{gema.en_bolsas ?? '-'}</span></div>
                              <div>Venta: <span className="text-d4-text">{gema.valor_venta ?? '-'}</span></div>
                            </div>

                            {Array.isArray(gema.tags) && gema.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {gema.tags.map((tag, idx) => (
                                  <span key={`${gema.id}-tag-${idx}`} className="px-2 py-0.5 rounded bg-d4-bg border border-d4-border text-[11px] text-d4-text-dim">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {visibleGems.length < filteredGems.length && (
                    <button
                      onClick={() => setVisibleCount((c) => c + 80)}
                      className="w-full py-2 rounded bg-d4-bg border border-d4-border text-sm text-d4-accent hover:bg-d4-border/20"
                    >
                      Mostrar mas gemas
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RunesGemsSection;
