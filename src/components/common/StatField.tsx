import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { DetalleEstadistica } from '../../types';
import { TagBadge } from '../tags/TagBadge';

interface StatFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'number' | 'text';
  step?: string;
  descripcion?: string;
  detalles?: DetalleEstadistica[];
}

/**
 * Campo de estadística con tooltip de detalles enriquecidos
 */
const StatField: React.FC<StatFieldProps> = ({
  label,
  value,
  onChange,
  type = 'number',
  step,
  descripcion,
  detalles
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hasDetails = descripcion || (detalles && detalles.length > 0);

  return (
    <div 
      className="relative"
      onMouseEnter={() => hasDetails && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <label className="block text-[13px] text-d4-text-dim font-semibold tracking-wide uppercase">{label}</label>
        {hasDetails && (
          <div className="relative">
            <Info className="w-3.5 h-3.5 text-d4-accent cursor-help" />
            
            {showTooltip && (
              <div className="absolute z-[5] left-0 top-full mt-1 w-[22rem] bg-d4-bg border-2 border-d4-accent rounded-lg shadow-2xl p-3"
                style={{
                  boxShadow: '0 8px 32px rgba(184, 134, 11, 0.5), 0 0 60px rgba(184, 134, 11, 0.2)'
                }}
              >
                {descripcion && (
                  <div className="mb-2">
                    <p className="font-bold text-d4-accent mb-1 text-[15px] uppercase tracking-wide" 
                       style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(218, 165, 32, 0.4)' }}
                    >
                      {label}
                    </p>
                    <p className="text-[13px] leading-relaxed text-d4-text">{descripcion}</p>
                  </div>
                )}
                
                {detalles && detalles.length > 0 && (
                  <div className="space-y-1.5">
                    {descripcion && <div className="border-t border-d4-border my-2"></div>}
                    {detalles.map((detalle, idx) => (
                      <div 
                        key={idx} 
                        className={`text-[12.5px] leading-relaxed p-2 rounded ${
                          detalle.tipo === 'contribucion' ? 'bg-blue-900/20 text-blue-300' :
                          detalle.tipo === 'bonificacion' ? 'bg-green-900/20 text-green-300' :
                          detalle.tipo === 'efecto' ? 'bg-purple-900/20 text-purple-300' :
                          detalle.tipo === 'mecanica' ? 'bg-orange-900/20 text-orange-300' :
                          'bg-d4-border/50 text-d4-text-dim'
                        }`}
                      >
                        {detalle.tipo && (
                          <span className="text-[10px] font-bold uppercase opacity-70 mr-1.5">
                            [{detalle.tipo}]
                          </span>
                        )}
                        <span>{detalle.texto}</span>
                        {detalle.valor !== null && detalle.valor !== undefined && (
                          <span className="ml-1 font-semibold">
                            ({detalle.valor}{detalle.unidad || ''})
                          </span>
                        )}
                        {/* Tags del detalle */}
                        {detalle.palabras_clave && Array.isArray(detalle.palabras_clave) && detalle.palabras_clave.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                            <span className="text-[9px] opacity-70">Tags:</span>
                            {detalle.palabras_clave.map((tagItem, tagIdx) => {
                              const tagId = typeof tagItem === 'string' ? tagItem : (tagItem as any).tag || (tagItem as any).id;
                              if (!tagId) return null;
                              return (
                                <TagBadge 
                                  key={tagIdx} 
                                  tagId={tagId} 
                                  iconSize={10} 
                                  textSize="text-[9px]"
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        className="input w-full text-sm py-1.5"
      />
    </div>
  );
};

export default StatField;
