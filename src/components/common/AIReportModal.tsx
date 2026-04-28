import React, { useState, useEffect } from 'react';
import { X, Copy, Download, Trash2, Search, Calendar, Clock, DollarSign, Zap, FileText, ChevronDown, ChevronUp, Filter, Check } from 'lucide-react';
import { AIReportService, AIReport, AIReportMetadata } from '../../services/AIReportService';
import ReactMarkdown from 'react-markdown';

interface AIReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReport?: AIReport | null;
}

const AIReportModal: React.FC<AIReportModalProps> = ({ isOpen, onClose, initialReport }) => {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [metadata, setMetadata] = useState<AIReportMetadata | null>(null);
  const [selectedReport, setSelectedReport] = useState<AIReport | null>(initialReport || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterModelo, setFilterModelo] = useState<string>('all');
  const [showPrompt, setShowPrompt] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['respuesta']));

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialReport) {
      setSelectedReport(initialReport);
    }
  }, [initialReport]);

  const loadReports = async () => {
    const allReports = await AIReportService.loadAllReports();
    const meta = await AIReportService.getReportsMetadata();
    setReports(allReports);
    setMetadata(meta);
    
    // Si no hay reporte seleccionado y hay reportes, seleccionar el más reciente
    if (!selectedReport && allReports.length > 0) {
      setSelectedReport(allReports[0]);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('¿Eliminar este reporte? Esta acción no se puede deshacer.')) {
      return;
    }

    const success = await AIReportService.deleteReport(reportId);
    if (success) {
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
      await loadReports();
    }
  };

  const handleCopyResponse = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadReport = (report: AIReport) => {
    const content = `# ${report.titulo_prompt}

**Fecha:** ${report.fecha} ${report.hora}
**Modelo:** ${report.modelo}
**Personaje:** ${report.personaje_nombre || 'N/A'} (${report.clase || 'N/A'})
**Costo:** $${report.costo_usd.toFixed(6)} USD

---

## Prompt Utilizado

${report.prompt_usado}

---

## Respuesta de IA

${report.respuesta_ia}

---

## Metadata

- Tokens Prompt: ${report.tokens_prompt}
- Tokens Respuesta: ${report.tokens_respuesta}
- Duración: ${(report.duracion_ms / 1000).toFixed(2)}s
- Tags: ${report.tags?.join(', ') || 'N/A'}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${report.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      searchQuery === '' ||
      r.titulo_prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.personaje_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.respuesta_ia.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTipo = filterTipo === 'all' || r.tipo_prompt === filterTipo;
    const matchesModelo = filterModelo === 'all' || r.modelo.includes(filterModelo);
    
    return matchesSearch && matchesTipo && matchesModelo;
  });

  const tiposUnicos = Array.from(new Set(reports.map(r => r.tipo_prompt)));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-d4-surface border-2 border-d4-accent rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-d4-accent/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg border border-purple-600/40">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-d4-accent">Reportes de IA</h2>
              <p className="text-sm text-d4-text-dim">
                {metadata && `${metadata.total_reportes} reportes • $${metadata.total_costo_usd.toFixed(4)} USD total`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-600/20 rounded transition-colors">
            <X className="w-6 h-6 text-d4-text hover:text-red-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Lista de reportes */}
          <div className="w-80 border-r border-d4-border flex flex-col bg-d4-bg">
            {/* Filtros y búsqueda */}
            <div className="p-3 space-y-2 border-b border-d4-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-d4-text-dim" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar reportes..."
                  className="w-full pl-8 pr-3 py-1.5 bg-d4-surface border border-d4-border rounded text-sm text-d4-text"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="px-2 py-1 bg-d4-surface border border-d4-border rounded text-xs text-d4-text"
                >
                  <option value="all">Todos los tipos</option>
                  {tiposUnicos.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                
                <select
                  value={filterModelo}
                  onChange={(e) => setFilterModelo(e.target.value)}
                  className="px-2 py-1 bg-d4-surface border border-d4-border rounded text-xs text-d4-text"
                >
                  <option value="all">Todos modelos</option>
                  <option value="gemini">Gemini</option>
                  <option value="gpt">GPT-4o</option>
                </select>
              </div>
            </div>

            {/* Lista de reportes */}
            <div className="flex-1 overflow-y-auto">
              {filteredReports.length === 0 ? (
                <div className="p-4 text-center text-d4-text-dim text-sm">
                  {reports.length === 0 ? 'No hay reportes guardados' : 'No se encontraron reportes'}
                </div>
              ) : (
                filteredReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full text-left p-3 border-b border-d4-border hover:bg-d4-surface transition-colors ${
                      selectedReport?.id === report.id ? 'bg-d4-accent/10 border-l-4 border-l-d4-accent' : ''
                    }`}
                  >
                    <div className="font-semibold text-sm text-d4-text truncate mb-1">
                      {report.titulo_prompt}
                    </div>
                    <div className="text-xs text-d4-text-dim space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        <span>{report.fecha}</span>
                        <Clock className="w-3 h-3 ml-2" />
                        <span>{report.hora}</span>
                      </div>
                      {report.personaje_nombre && (
                        <div className="truncate">👤 {report.personaje_nombre}</div>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          report.modelo.includes('gemini') 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'bg-green-600/20 text-green-400'
                        }`}>
                          {report.modelo.includes('gemini') ? 'Gemini' : 'GPT-4o'}
                        </span>
                        <span className="text-yellow-400 font-mono">
                          ${report.costo_usd.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Contenido principal - Visor del reporte */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedReport ? (
              <>
                {/* Header del reporte */}
                <div className="p-4 border-b border-d4-border bg-d4-bg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-d4-accent mb-1">
                        {selectedReport.titulo_prompt}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-d4-text-dim">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {selectedReport.fecha} {selectedReport.hora}
                        </span>
                        {selectedReport.personaje_nombre && (
                          <span>
                            👤 {selectedReport.personaje_nombre} ({selectedReport.clase})
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          selectedReport.modelo.includes('gemini') 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'bg-green-600/20 text-green-400'
                        }`}>
                          {selectedReport.modelo}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopyResponse(selectedReport.respuesta_ia, 'respuesta')}
                        className="p-2 bg-d4-surface hover:bg-d4-border rounded transition-colors"
                        title="Copiar respuesta"
                      >
                        {copiedId === 'respuesta' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-d4-text" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadReport(selectedReport)}
                        className="p-2 bg-d4-surface hover:bg-d4-border rounded transition-colors"
                        title="Descargar reporte"
                      >
                        <Download className="w-4 h-4 text-d4-text" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(selectedReport.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded transition-colors"
                        title="Eliminar reporte"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata compacta */}
                  <div className="grid grid-cols-4 gap-3 mt-3 p-2 bg-d4-surface rounded border border-d4-border">
                    <div className="text-center">
                      <div className="text-xs text-d4-text-dim">Tokens Prompt</div>
                      <div className="text-sm font-semibold text-d4-text">
                        {selectedReport.tokens_prompt.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-d4-text-dim">Tokens Respuesta</div>
                      <div className="text-sm font-semibold text-d4-text">
                        {selectedReport.tokens_respuesta.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-d4-text-dim">Costo</div>
                      <div className="text-sm font-semibold text-yellow-400">
                        ${selectedReport.costo_usd.toFixed(6)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-d4-text-dim">Duración</div>
                      <div className="text-sm font-semibold text-d4-text">
                        {(selectedReport.duracion_ms / 1000).toFixed(2)}s
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {/* Respuesta de IA (expandido por defecto) */}
                  <div className="border border-d4-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('respuesta')}
                      className="w-full flex items-center justify-between p-3 bg-purple-600/10 hover:bg-purple-600/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <span className="font-bold text-purple-400">Respuesta de IA</span>
                      </div>
                      {expandedSections.has('respuesta') ? (
                        <ChevronUp className="w-5 h-5 text-purple-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-purple-400" />
                      )}
                    </button>
                    
                    {expandedSections.has('respuesta') && (
                      <div className="p-4 bg-d4-surface">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown className="text-d4-text">
                            {selectedReport.respuesta_ia}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prompt usado (colapsado por defecto) */}
                  <div className="border border-d4-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection('prompt')}
                      className="w-full flex items-center justify-between p-3 bg-blue-600/10 hover:bg-blue-600/20 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span className="font-bold text-blue-400">Prompt Utilizado</span>
                      </div>
                      {expandedSections.has('prompt') ? (
                        <ChevronUp className="w-5 h-5 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-blue-400" />
                      )}
                    </button>
                    
                    {expandedSections.has('prompt') && (
                      <div className="p-4 bg-d4-surface">
                        <pre className="text-xs text-d4-text whitespace-pre-wrap font-mono bg-black/30 p-3 rounded">
                          {selectedReport.prompt_usado}
                        </pre>
                        <button
                          onClick={() => handleCopyResponse(selectedReport.prompt_usado, 'prompt')}
                          className="mt-2 btn-secondary text-xs flex items-center gap-2"
                        >
                          {copiedId === 'prompt' ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar Prompt
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tags (si existen) */}
                  {selectedReport.tags && selectedReport.tags.length > 0 && (
                    <div className="p-3 bg-d4-bg border border-d4-border rounded">
                      <div className="text-sm font-semibold text-d4-text mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-d4-surface border border-d4-accent/30 rounded text-xs text-d4-accent"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-d4-text-dim">
                <div className="text-center">
                  <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Selecciona un reporte para visualizar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReportModal;
