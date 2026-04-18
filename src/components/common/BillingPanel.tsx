import { useState, useEffect } from 'react';
import { DollarSign, X, RefreshCw } from 'lucide-react';
import { WorkspaceService } from '../../services/WorkspaceService';

interface BillingEntry {
  timestamp: string;
  provider: string;
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    input: number;
    output: number;
    total: number;
  };
  category?: string;
  operation?: string;
}

interface BillingData {
  entries: BillingEntry[];
  summary: {
    totalCost: number;
    totalTokens: number;
    byProvider: Record<string, { cost: number; tokens: number; requests: number }>;
  };
}

const BillingPanel: React.FC = () => {
  // Check if billing panel is enabled via environment variable
  const billingEnabled = import.meta.env.VITE_ENABLE_BILLING_PANEL !== 'false';
  
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('billingPanelVisible') === 'true';
  });
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WorkspaceService.readFile('billing.json');
      const parsed = JSON.parse(data);
      setBillingData(parsed);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not found')) {
        // Archivo no existe aún
        setBillingData({ 
          entries: [], 
          summary: { totalCost: 0, totalTokens: 0, byProvider: {} } 
        });
      } else {
        setError('Error cargando datos');
        console.error('Error loading billing:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      loadBillingData();
      // Recargar cada 15 segundos si está visible
      const interval = setInterval(loadBillingData, 15000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const toggleVisibility = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem('billingPanelVisible', String(newState));
  };

  // Don't render if billing is disabled
  if (!billingEnabled) {
    return null;
  }

  // Formato compacto de números
  const formatCost = (cost: number) => cost < 0.01 ? cost.toFixed(6) : cost.toFixed(4);
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 p-2.5 bg-d4-accent/20 hover:bg-d4-accent/30 border border-d4-accent/40 text-d4-accent rounded-md shadow-lg transition-all z-[9998] backdrop-blur-sm"
        title="Ver uso de IA (Dev)"
      >
        <DollarSign className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 bg-[#1e1e1e]/95 backdrop-blur-sm border border-[#3c3c3c] rounded-md shadow-2xl z-[9998] text-[11px] overflow-hidden">
      {/* Header minimalista */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#3c3c3c] bg-[#252525]">
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-d4-accent" />
          <span className="text-[10px] font-semibold text-d4-text uppercase tracking-wide">Uso de IA</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={loadBillingData}
            disabled={loading}
            className="p-1 hover:bg-[#3c3c3c] rounded transition-colors disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-3 h-3 text-d4-text-dim ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={toggleVisibility}
            className="p-1 hover:bg-[#3c3c3c] rounded transition-colors"
            title="Ocultar"
          >
            <X className="w-3 h-3 text-d4-text-dim" />
          </button>
        </div>
      </div>

      {/* Content compacto */}
      <div className="max-h-[320px] overflow-y-auto">
        {loading && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border border-d4-accent border-t-transparent mx-auto"></div>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 bg-red-900/10 border-l-2 border-red-500 text-red-300">
            {error}
          </div>
        )}

        {billingData && !loading && !error && (
          <div className="divide-y divide-[#3c3c3c]">
            {/* Total compacto */}
            <div className="px-3 py-2.5 bg-[#252525]">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[9px] text-d4-text-dim uppercase tracking-wide">Total</span>
                <span className="text-sm font-bold text-green-400">${formatCost(billingData.summary.totalCost)}</span>
              </div>
              <div className="text-[9px] text-d4-text-dim">
                {formatTokens(billingData.summary.totalTokens)} tokens • {billingData.entries.length} llamadas
              </div>
            </div>

            {/* Por proveedor - ultra compacto */}
            {billingData.summary?.byProvider && Object.keys(billingData.summary.byProvider).length > 0 && (
              <div className="px-3 py-2">
                <div className="text-[9px] text-d4-text-dim uppercase tracking-wide mb-1.5">Proveedores</div>
                {Object.entries(billingData.summary.byProvider).map(([provider, data]) => (
                  <div key={provider} className="flex items-center justify-between py-1 hover:bg-[#2a2a2a] px-1 rounded">
                    <div className="flex-1">
                      <div className="text-d4-accent font-medium">{provider}</div>
                      <div className="text-[9px] text-d4-text-dim">
                        {formatTokens(data.tokens)} • {data.requests} req
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-400">${formatCost(data.cost)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Últimas llamadas - mini */}
            {billingData.entries.length > 0 && (
              <div className="px-3 py-2">
                <div className="text-[9px] text-d4-text-dim uppercase tracking-wide mb-1.5">Recientes</div>
                <div className="space-y-1">
                  {billingData.entries.slice(-3).reverse().map((entry, idx) => (
                    <div key={idx} className="py-1.5 px-2 bg-[#2a2a2a] rounded hover:bg-[#313131] transition-colors">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-d4-text-dim">
                          {new Date(entry.timestamp).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <span className="text-xs font-semibold text-green-400">
                          ${formatCost(entry.cost.total)}
                        </span>
                      </div>
                      <div className="text-d4-text-dim flex items-center justify-between">
                        <span className="truncate flex-1">{entry.model.replace('gpt-', '').replace('gemini-', '')}</span>
                        <span className="text-[9px] ml-2">{formatTokens(entry.tokens.total)}t</span>
                      </div>
                      {entry.category && (
                        <div className="text-[9px] text-d4-accent mt-0.5 capitalize">
                          {entry.category}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {billingData.entries.length === 0 && (
              <div className="px-3 py-6 text-center text-d4-text-dim">
                <DollarSign className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <div className="text-[10px]">Sin registros aún</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPanel;
