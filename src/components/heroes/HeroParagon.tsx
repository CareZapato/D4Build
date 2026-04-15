import { useState, useEffect } from 'react';
import { Upload, Grid3x3, Copy, Check, Download } from 'lucide-react';
import { WorkspaceService } from '../../services/WorkspaceService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import { useModal } from '../../hooks/useModal';

interface Props {
  clase: string;
}

type ParagonDataType = 'tableros' | 'nodos';
type NodeType = 'normal' | 'magico' | 'raro' | 'legendario';

const HeroParagon: React.FC<Props> = ({ clase }) => {
  const modal = useModal();
  const [importing, setImporting] = useState(false);
  const [dataType, setDataType] = useState<ParagonDataType>('tableros');
  const [nodeType, setNodeType] = useState<NodeType>('normal');
  const [tableros, setTableros] = useState<any[]>([]);
  const [nodos, setNodos] = useState<any>({
    nodos_normales: [],
    nodos_magicos: [],
    nodos_raros: [],
    nodos_legendarios: []
  });
  const [showTextInput, setShowTextInput] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadParagonData();
  }, [clase]);

  const loadParagonData = async () => {
    try {
      const boardsData = await WorkspaceService.loadParagonBoards(clase);
      const nodesData = await WorkspaceService.loadParagonNodes(clase);
      
      setTableros(boardsData?.tableros || []);
      setNodos(nodesData || {
        nodos_normales: [],
        nodos_magicos: [],
        nodos_raros: [],
        nodos_legendarios: []
      });
    } catch (error) {
      console.error('Error cargando datos Paragon:', error);
    }
  };

  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if(!file) return;

    setImporting(true);
    try {
      const content = await file.text();
      await processJSONImport(content);
    } catch (error) {
      console.error('Error importando:', error);
      modal.showError('Error al importar. Verifica el formato del JSON.');
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
      await processJSONImport(jsonText);
      setJsonText('');
      setShowTextInput(false);
    } catch (error) {
      console.error('Error importando:', error);
      modal.showError('Error al procesar el JSON.');
    } finally {
      setImporting(false);
    }
  };

  const processJSONImport = async (content: string) => {
    const data = JSON.parse(content);

    if (dataType === 'tableros') {
      if (!data.tableros || !Array.isArray(data.tableros)) {
        modal.showError('El JSON no tiene el formato correcto para tableros');
        return;
      }

      const currentData = await WorkspaceService.loadParagonBoards(clase) || { tableros: [] };
      const updatedTableros = [...currentData.tableros];

      let agregados = 0;
      let actualizados = 0;

      data.tableros.forEach((tablero: any) => {
        const idx = updatedTableros.findIndex(t => t.nombre === tablero.nombre);
        const id = idx >= 0 ? updatedTableros[idx].id : (tablero.id || `tablero_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        
        if (idx >= 0) {
          updatedTableros[idx] = { ...tablero, id };
          actualizados++;
        } else {
          updatedTableros.push({ ...tablero, id });
          agregados++;
        }
      });

      await WorkspaceService.saveParagonBoards(clase, { tableros: updatedTableros });
      setTableros(updatedTableros);
      modal.showSuccess(`${agregados} tableros agregados, ${actualizados} actualizados`);
      
    } else {
      // Importar nodos
      const nodosKey = `nodos_${nodeType}s`;
      if (!data[nodosKey] || !Array.isArray(data[nodosKey])) {
        modal.showError(`El JSON no tiene el formato correcto para ${nodosKey}`);
        return;
      }

      const currentData = await WorkspaceService.loadParagonNodes(clase) || {
        nodos_normales: [],
        nodos_magicos: [],
        nodos_raros: [],
        nodos_legendarios: []
      };

      const updatedNodos = [...(currentData as any)[nodosKey]];

      let agregados = 0;
      let actualizados = 0;

      data[nodosKey].forEach((nodo: any) => {
        const idx = updatedNodos.findIndex((n: any) => n.nombre === nodo.nombre);
        const id = idx >= 0 ? updatedNodos[idx].id : (nodo.id || `${nodosKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        
        if (idx >= 0) {
          updatedNodos[idx] = { ...nodo, id };
          actualizados++;
        } else {
          updatedNodos.push({ ...nodo, id });
          agregados++;
        }
      });

      const finalData = { ...(currentData as any), [nodosKey]: updatedNodos };
      await WorkspaceService.saveParagonNodes(clase, finalData);
      setNodos(finalData);
      modal.showSuccess(`${agregados} nodos agregados, ${actualizados} actualizados`);
    }

    await loadParagonData();
  };

  const handleExport = () => {
    let exportData: any;
    let filename: string;

    if (dataType === 'tableros') {
      exportData = { tableros };
      filename = `${clase}_paragon_tableros.json`;
    } else {
      const nodosKey = `nodos_${nodeType}s`;
      exportData = { [nodosKey]: (nodos as any)[nodosKey] };
      filename = `${clase}_paragon_${nodosKey}.json`;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    modal.showSuccess('JSON exportado correctamente');
  };

  const handleCopyPrompt = (type: 'tableros' | NodeType) => {
    let prompt: string;

    if (type === 'tableros') {
      prompt = ImageExtractionPromptService.generateParagonBoardsPrompt();
    } else {
      switch (type) {
        case 'normal':
          prompt = ImageExtractionPromptService.generateParagonNormalNodesPrompt();
          break;
        case 'magico':
          prompt = ImageExtractionPromptService.generateParagonMagicNodesPrompt();
          break;
        case 'raro':
          prompt = ImageExtractionPromptService.generateParagonRareNodesPrompt();
          break;
        case 'legendario':
          prompt = ImageExtractionPromptService.generateParagonLegendaryNodesPrompt();
          break;
      }
    }

    ImageExtractionPromptService.copyToClipboard(prompt);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const currentNodeList = `nodos_${nodeType}s`;
  const totalNodos = (nodos as any)[currentNodeList]?.length || 0;

  return (
    <>
      {/* Selector de tipo de dato */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-d4-text mb-2">
          Tipo de Dato Paragon:
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setDataType('tableros')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              dataType === 'tableros'
                ? 'bg-d4-accent text-black'
                : 'bg-d4-bg border border-d4-border text-d4-text hover:bg-d4-border'
            }`}
          >
            📊 Tableros ({tableros.length})
          </button>
          <button
            onClick={() => setDataType('nodos')}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              dataType === 'nodos'
                ? 'bg-d4-accent text-black'
                : 'bg-d4-bg border border-d4-border text-d4-text hover:bg-d4-border'
            }`}
          >
            ⬢ Nodos ({totalNodos})
          </button>
        </div>
      </div>

      {/* Selector de rareza de nodo (solo si tipo = nodos) */}
      {dataType === 'nodos' && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-d4-text mb-2">
            Rareza del Nodo:
          </label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as NodeType)}
            className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text"
          >
            <option value="normal">⚪ Normal ({nodos.nodos_normales?.length || 0})</option>
            <option value="magico">🔵 Mágico ({nodos.nodos_magicos?.length || 0})</option>
            <option value="raro">🟡 Raro ({nodos.nodos_raros?.length || 0})</option>
            <option value="legendario">🟠 Legendario ({nodos.nodos_legendarios?.length || 0})</option>
          </select>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2 mb-4">
        <label className="btn btn-secondary cursor-pointer flex-1">
          <Upload className="w-4 h-4" />
          {importing ? 'Importando...' : 'Importar JSON'}
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJSON}
            disabled={importing}
          />
        </label>

        <button
          onClick={() => setShowTextInput(!showTextInput)}
          className="btn btn-secondary flex-1"
        >
          📝 Pegar JSON
        </button>

        <button
          onClick={handleExport}
          className="btn btn-secondary flex-1"
          disabled={dataType === 'tableros' ? tableros.length === 0 : totalNodos === 0}
        >
          <Download className="w-4 h-4" />
          Exportar JSON
        </button>

        <button
          onClick={() => handleCopyPrompt(dataType === 'tableros' ? 'tableros' : nodeType)}
          className="btn btn-secondary flex-1"
          title="Copiar prompt para extraer con IA"
        >
          {copied === (dataType === 'tableros' ? 'tableros' : nodeType) ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied === (dataType === 'tableros' ? 'tableros' : nodeType) ? 'Copiado!' : 'Copiar Prompt IA'}
        </button>
      </div>

      {/* Input de texto para JSON */}
      {showTextInput && (
        <div className="space-y-2 mb-4">
          <label className="block text-sm font-medium text-d4-text">
            Pega el JSON aquí:
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full h-48 p-3 bg-d4-bg border border-d4-border rounded-lg font-mono text-sm text-d4-text"
            placeholder={dataType === 'tableros' ? '{"tableros": [...]}' : `{"${currentNodeList}": [...]}`}
          />
          <div className="flex gap-2">
            <button
              onClick={handleImportFromText}
              className="btn btn-primary flex-1"
              disabled={!jsonText.trim() || importing}
            >
              {importing ? 'Importando...' : 'Importar'}
            </button>
            <button
              onClick={() => {
                setShowTextInput(false);
                setJsonText('');
              }}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Visualización de datos */}
      <div className="space-y-4">
        {dataType === 'tableros' ? (
          tableros.length > 0 ? (
            <div>
              <h4 className="text-md font-semibold mb-2 text-d4-accent">Tableros Catalogados ({tableros.length})</h4>
              <div className="space-y-2">
                {tableros.map((tablero, index) => (
                  <div key={tablero.id || index} className="bg-d4-bg p-3 rounded-lg border border-d4-border">
                    <div className="font-medium text-orange-300">{tablero.nombre}</div>
                    {tablero.bonificacion_primaria && (
                      <div className="text-sm text-d4-text-dim mt-1">
                        {tablero.bonificacion_primaria}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-d4-text-dim">
              <Grid3x3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay tableros catalogados para {clase}</p>
              <p className="text-sm mt-2">Importa datos desde JSON o usando el prompt de IA</p>
            </div>
          )
        ) : (
          (nodos as any)[currentNodeList]?.length > 0 ? (
            <div>
              <h4 className="text-md font-semibold mb-2 text-d4-accent">
                Nodos {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ({(nodos as any)[currentNodeList].length})
              </h4>
              <div className="space-y-2">
                {(nodos as any)[currentNodeList].map((nodo: any, index: number) => (
                  <div key={nodo.id || index} className="bg-d4-bg p-3 rounded-lg border border-d4-border">
                    <div className="font-medium text-blue-300">{nodo.nombre}</div>
                    {nodo.efecto && (
                      <div className="text-sm text-d4-text-dim mt-1">{nodo.efecto}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-d4-text-dim">
              <Grid3x3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay nodos {nodeType} catalogados para {clase}</p>
              <p className="text-sm mt-2">Importa datos desde JSON o usando el prompt de IA</p>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default HeroParagon;
