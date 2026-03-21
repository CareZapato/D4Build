import { useState, useEffect } from 'react';
import { Upload, TrendingUp } from 'lucide-react';
import { Personaje, Estadisticas } from '../../types';
import Modal from '../common/Modal';
import { useModal } from '../../hooks/useModal';

interface Props {
  personaje: Personaje;
  onChange: (stats: Estadisticas, nivel?: number, nivelParagon?: number) => void;
}

const CharacterStats: React.FC<Props> = ({ personaje, onChange }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [activeTab, setActiveTab] = useState<string>('personaje');
  const [estadisticas, setEstadisticas] = useState<Estadisticas>(
    personaje.estadisticas || {}
  );

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      const data = parsed as Estadisticas;
      setEstadisticas(data);
      
      // Extraer nivel y nivel paragon si existen en las estadísticas
      // nivel viene de atributosPrincipales, nivel_paragon puede venir del objeto raíz
      const nivel = data.atributosPrincipales?.nivel;
      const nivelParagon = parsed.nivel_paragon;
      onChange(data, nivel, nivelParagon);
      
      modal.showSuccess('Estadísticas importadas correctamente');
    } catch (error) {
      console.error('Error importando estadísticas:', error);
      modal.showError('Error al importar el archivo JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromText = async () => {
    if (!jsonText.trim()) {
      modal.showError('Por favor ingresa un JSON válido');
      return;
    }

    setImporting(true);
    try {
      const parsed = JSON.parse(jsonText);
      const data = parsed as Estadisticas;
      setEstadisticas(data);
      
      // Extraer nivel y nivel paragon si existen en las estadísticas
      // nivel viene de atributosPrincipales, nivel_paragon puede venir del objeto raíz
      const nivel = data.atributosPrincipales?.nivel;
      const nivelParagon = parsed.nivel_paragon;
      onChange(data, nivel, nivelParagon);
      
      setJsonText('');
      setShowTextInput(false);
      modal.showSuccess('Estadísticas importadas correctamente');
    } catch (error) {
      console.error('Error importando estadísticas:', error);
      modal.showError('Error al procesar el JSON. Verifica el formato.');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    onChange(estadisticas);
  }, [estadisticas]);

  const tabs = [
    { id: 'personaje', label: 'Personaje' },
    { id: 'atributos', label: 'Atributos' },
    { id: 'defensivo', label: 'Defensivo' },
    { id: 'ofensivo', label: 'Ofensivo' },
    { id: 'armadura', label: 'Armadura' },
    { id: 'utilidad', label: 'Utilidad' },
    { id: 'principal', label: 'Principal' },
    { id: 'jcj', label: 'JcJ' },
    { id: 'moneda', label: 'Moneda' },
  ];

  const updatePersonaje = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      personaje: {
        ...prev.personaje,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateAtributosBase = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      atributosBase: {
        ...prev.atributosBase,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateDefensivo = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      defensivo: {
        ...prev.defensivo,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateUtilidad = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      utilidad: {
        ...prev.utilidad,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateJcJ = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      jcj: {
        ...prev.jcj,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateMoneda = (field: string, value: string | number) => {
    setEstadisticas(prev => ({
      ...prev,
      moneda: {
        ...prev.moneda,
        [field]: value
      }
    }));
  };

  const updateObolos = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      moneda: {
        ...prev.moneda,
        obolos: {
          ...prev.moneda?.obolos,
          [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
        }
      }
    }));
  };

  const updateAtributosPrincipales = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      atributosPrincipales: {
        ...prev.atributosPrincipales,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateArmaduraYResistencias = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      armaduraYResistencias: {
        ...prev.armaduraYResistencias,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  const updateOfensivo = (field: string, value: number | string) => {
    setEstadisticas(prev => ({
      ...prev,
      ofensivo: {
        ...prev.ofensivo,
        [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
      }
    }));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-d4-accent" />
          <span className="text-sm text-d4-text">Gestionar estadísticas</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowTextInput(!showTextInput)} 
            className="btn-secondary flex items-center gap-1 text-xs py-1 px-2"
          >
            <Upload className="w-3 h-3" />
            JSON
          </button>
          <label className="btn-secondary cursor-pointer flex items-center gap-1 text-xs py-1 px-2">
            <Upload className="w-3 h-3" />
            Archivo
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {showTextInput && (
        <div className="bg-d4-bg p-3 rounded border border-d4-accent mb-3">
          <h4 className="font-bold text-d4-accent mb-2 text-sm">Pegar JSON</h4>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="input w-full font-mono text-xs mb-2"
            rows={6}
            placeholder='{"personaje": {"danioArma": 595, "aguante": 52619}, ...}'
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowTextInput(false)} className="btn-secondary text-xs py-1 px-2">Cancelar</button>
            <button onClick={handleImportFromText} className="btn-primary text-xs py-1 px-2" disabled={importing || !jsonText.trim()}>
              {importing ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 mb-3 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-d4-accent text-black font-semibold' : 'bg-d4-bg text-d4-text-dim hover:bg-d4-border'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {activeTab === 'personaje' && (
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño Arma</label><input type="number" value={estadisticas.personaje?.danioArma || ''} onChange={(e) => updatePersonaje('danioArma', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Aguante</label><input type="number" value={estadisticas.personaje?.aguante || ''} onChange={(e) => updatePersonaje('aguante', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'atributos' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Fuerza</label><input type="number" value={estadisticas.atributosBase?.fuerza || ''} onChange={(e) => updateAtributosBase('fuerza', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Inteligencia</label><input type="number" value={estadisticas.atributosBase?.inteligencia || ''} onChange={(e) => updateAtributosBase('inteligencia', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Voluntad</label><input type="number" value={estadisticas.atributosBase?.voluntad || ''} onChange={(e) => updateAtributosBase('voluntad', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Destreza</label><input type="number" value={estadisticas.atributosBase?.destreza || ''} onChange={(e) => updateAtributosBase('destreza', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'defensivo' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vida Máxima</label><input type="number" value={estadisticas.defensivo?.vidaMaxima || ''} onChange={(e) => updateDefensivo('vidaMaxima', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Cant. Pociones</label><input type="number" value={estadisticas.defensivo?.cantidadPociones || ''} onChange={(e) => updateDefensivo('cantidadPociones', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Sanación %</label><input type="number" step="0.1" value={estadisticas.defensivo?.sanacionRecibida || ''} onChange={(e) => updateDefensivo('sanacionRecibida', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vida/Elim</label><input type="number" value={estadisticas.defensivo?.vidaPorEliminacion || ''} onChange={(e) => updateDefensivo('vidaPorEliminacion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vida/5s</label><input type="number" value={estadisticas.defensivo?.vidaCada5Segundos || ''} onChange={(e) => updateDefensivo('vidaCada5Segundos', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Prob. Bloqueo %</label><input type="number" step="0.1" value={estadisticas.defensivo?.probabilidadBloqueo || ''} onChange={(e) => updateDefensivo('probabilidadBloqueo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Red. Bloqueo %</label><input type="number" step="0.1" value={estadisticas.defensivo?.reduccionBloqueo || ''} onChange={(e) => updateDefensivo('reduccionBloqueo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Bonif. Fortif. %</label><input type="number" step="0.1" value={estadisticas.defensivo?.bonificacionFortificacion || ''} onChange={(e) => updateDefensivo('bonificacionFortificacion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Bonif. Barrera %</label><input type="number" step="0.1" value={estadisticas.defensivo?.bonificacionBarrera || ''} onChange={(e) => updateDefensivo('bonificacionBarrera', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Prob. Esquivar %</label><input type="number" step="0.1" value={estadisticas.defensivo?.probabilidadEsquivar || ''} onChange={(e) => updateDefensivo('probabilidadEsquivar', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'ofensivo' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño Base Arma</label><input type="number" value={estadisticas.ofensivo?.danioBaseArma || ''} onChange={(e) => updateOfensivo('danioBaseArma', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vel. Arma</label><input type="number" step="0.1" value={estadisticas.ofensivo?.velocidadArma || ''} onChange={(e) => updateOfensivo('velocidadArma', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vel. Ataque %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.bonificacionVelocidadAtaque || ''} onChange={(e) => updateOfensivo('bonificacionVelocidadAtaque', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Prob. Crítico %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.probabilidadGolpeCritico || ''} onChange={(e) => updateOfensivo('probabilidadGolpeCritico', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño Crítico %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioGolpeCritico || ''} onChange={(e) => updateOfensivo('danioGolpeCritico', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Prob. Abrumar %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.probabilidadAbrumar || ''} onChange={(e) => updateOfensivo('probabilidadAbrumar', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño Abrumador %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioAbrumador || ''} onChange={(e) => updateOfensivo('danioAbrumador', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Daño vs Vuln. %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioContraEnemigosVulnerables || ''} onChange={(e) => updateOfensivo('danioContraEnemigosVulnerables', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Todo Daño %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.todoElDanio || ''} onChange={(e) => updateOfensivo('todoElDanio', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Sangrado %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioConSangrado || ''} onChange={(e) => updateOfensivo('danioConSangrado', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Quemadura %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioConQuemadura || ''} onChange={(e) => updateOfensivo('danioConQuemadura', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Veneno %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioConVeneno || ''} onChange={(e) => updateOfensivo('danioConVeneno', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Corrupción %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioConCorrupcion || ''} onChange={(e) => updateOfensivo('danioConCorrupcion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">vs Elite %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioVsEnemigosElite || ''} onChange={(e) => updateOfensivo('danioVsEnemigosElite', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">vs Saludables %</label><input type="number" step="0.1" value={estadisticas.ofensivo?.danioVsEnemigosSaludables || ''} onChange={(e) => updateOfensivo('danioVsEnemigosSaludables', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Espinas</label><input type="number" value={estadisticas.ofensivo?.espinas || ''} onChange={(e) => updateOfensivo('espinas', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'armadura' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Aguante</label><input type="number" value={estadisticas.armaduraYResistencias?.aguante || ''} onChange={(e) => updateArmaduraYResistencias('aguante', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Armadura</label><input type="number" value={estadisticas.armaduraYResistencias?.armadura || ''} onChange={(e) => updateArmaduraYResistencias('armadura', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Físico</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaDanioFisico || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaDanioFisico', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Fuego</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaFuego || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaFuego', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Rayo</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaRayo || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaRayo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Frío</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaFrio || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaFrio', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Veneno</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaVeneno || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaVeneno', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Res. Sombra</label><input type="number" value={estadisticas.armaduraYResistencias?.resistenciaSombra || ''} onChange={(e) => updateArmaduraYResistencias('resistenciaSombra', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'utilidad' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Máximo Fe</label><input type="number" value={estadisticas.utilidad?.maximoFe || ''} onChange={(e) => updateUtilidad('maximoFe', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Red. Costo Fe %</label><input type="number" step="0.1" value={estadisticas.utilidad?.reduccionCostoFe || ''} onChange={(e) => updateUtilidad('reduccionCostoFe', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Regen. Fe</label><input type="number" step="0.1" value={estadisticas.utilidad?.regeneracionFe || ''} onChange={(e) => updateUtilidad('regeneracionFe', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Fe/Elim</label><input type="number" value={estadisticas.utilidad?.feConCadaEliminacion || ''} onChange={(e) => updateUtilidad('feConCadaEliminacion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Vel. Movimiento %</label><input type="number" step="0.1" value={estadisticas.utilidad?.velocidadMovimiento || ''} onChange={(e) => updateUtilidad('velocidadMovimiento', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Red. Recup. %</label><input type="number" step="0.1" value={estadisticas.utilidad?.reduccionRecuperacion || ''} onChange={(e) => updateUtilidad('reduccionRecuperacion', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Golpe Afort. %</label><input type="number" step="0.1" value={estadisticas.utilidad?.bonificacionProbabilidadGolpeAfortunado || ''} onChange={(e) => updateUtilidad('bonificacionProbabilidadGolpeAfortunado', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Bonif. Exp. %</label><input type="number" step="0.1" value={estadisticas.utilidad?.bonificacionExperiencia || ''} onChange={(e) => updateUtilidad('bonificacionExperiencia', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'principal' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Nivel</label><input type="number" value={estadisticas.atributosPrincipales?.nivel || ''} onChange={(e) => updateAtributosPrincipales('nivel', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Fuerza</label><input type="number" value={estadisticas.atributosPrincipales?.fuerza || ''} onChange={(e) => updateAtributosPrincipales('fuerza', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Inteligencia</label><input type="number" value={estadisticas.atributosPrincipales?.inteligencia || ''} onChange={(e) => updateAtributosPrincipales('inteligencia', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Voluntad</label><input type="number" value={estadisticas.atributosPrincipales?.voluntad || ''} onChange={(e) => updateAtributosPrincipales('voluntad', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Destreza</label><input type="number" value={estadisticas.atributosPrincipales?.destreza || ''} onChange={(e) => updateAtributosPrincipales('destreza', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'jcj' && (
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Reducción Daño %</label><input type="number" step="0.1" value={estadisticas.jcj?.reduccionDanio || ''} onChange={(e) => updateJcJ('reduccionDanio', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}

        {activeTab === 'moneda' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Oro</label><input type="text" value={estadisticas.moneda?.oro || ''} onChange={(e) => updateMoneda('oro', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Obolos Actual</label><input type="number" value={estadisticas.moneda?.obolos?.actual || ''} onChange={(e) => updateObolos('actual', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Obolos Máximo</label><input type="number" value={estadisticas.moneda?.obolos?.maximo || ''} onChange={(e) => updateObolos('maximo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Polvo Rojo</label><input type="number" value={estadisticas.moneda?.polvoRojo || ''} onChange={(e) => updateMoneda('polvoRojo', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Marcas Pálidas</label><input type="number" value={estadisticas.moneda?.marcasPalidas || ''} onChange={(e) => updateMoneda('marcasPalidas', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Monedas Alcázar</label><input type="number" value={estadisticas.moneda?.monedasDelAlcazar || ''} onChange={(e) => updateMoneda('monedasDelAlcazar', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Favor</label><input type="number" value={estadisticas.moneda?.favor || ''} onChange={(e) => updateMoneda('favor', e.target.value)} className="input w-full text-xs py-1" /></div>
            <div><label className="block text-[10px] text-d4-text-dim mb-0.5">Carne Fresca</label><input type="text" value={estadisticas.moneda?.carneFresca || ''} onChange={(e) => updateMoneda('carneFresca', e.target.value)} className="input w-full text-xs py-1" /></div>
          </div>
        )}
      </div>
      <Modal {...modal} />
    </>
  );
};

export default CharacterStats;
