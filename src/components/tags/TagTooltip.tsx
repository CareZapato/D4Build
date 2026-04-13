import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { Info } from 'lucide-react';
import { TagGlobal } from '../../types';
import { TagService } from '../../services/TagService';

interface TagTooltipProps {
  tagId: string;
  className?: string;
  iconSize?: number;
}

/**
 * TagTooltip - Muestra un icono de información que revela detalles del tag al hacer hover
 * 
 * MEJORAS DE PERFORMANCE:
 * - Memoizado para evitar re-renders innecesarios
 * - Carga lazy del tag (solo cuando existe)
 * - Debouncing implícito con eventos del mouse
 * 
 * Props:
 * - tagId: ID del tag en TagService
 * - className: Clases CSS adicionales para el contenedor
 * - iconSize: Tamaño del icono en píxeles (default: 14)
 */
export const TagTooltip = memo(function TagTooltip({ tagId, className = '', iconSize = 14 }: TagTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoizar la carga del tag para mejor performance
  const tag = useMemo(() => TagService.getTagById(tagId), [tagId]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible && iconRef.current && tooltipRef.current) {
      const iconRect = iconRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Si el tooltip se sale por abajo, mostrarlo arriba
      if (iconRect.bottom + tooltipRect.height + 10 > viewportHeight) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    }
  }, [isVisible]);

  // Handlers con debouncing ligero para mejor UX
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Pequeño delay para evitar tooltips flash al pasar rápido
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsVisible(false);
  };

  if (!tag) {
    return null; // No mostrar nada si el tag no existe
  }

  // Verificar si tiene descripción para resaltar en el tooltip
  const hasDescription = !!(tag.significado || tag.descripcion_jugabilidad);

  const getCategoryColor = () => {
    const colors: Record<TagGlobal['categoria'], string> = {
      atributo: 'border-blue-500/50 bg-blue-500/10',
      efecto: 'border-purple-500/50 bg-purple-500/10',
      condicion: 'border-yellow-500/50 bg-yellow-500/10',
      recurso: 'border-green-500/50 bg-green-500/10',
      mecanica: 'border-orange-500/50 bg-orange-500/10',
      tipo_de_danio: 'border-red-500/50 bg-red-500/10',
      defensivo: 'border-cyan-500/50 bg-cyan-500/10',
      otro: 'border-gray-500/50 bg-gray-500/10'
    };
    return colors[tag.categoria] || colors.otro;
  };

  const getCategoryLabel = () => {
    const labels: Record<TagGlobal['categoria'], string> = {
      atributo: 'Atributo',
      efecto: 'Efecto',
      condicion: 'Condición',
      recurso: 'Recurso',
      mecanica: 'Mecánica',
      tipo_de_danio: 'Tipo de Daño',
      defensivo: 'Defensivo',
      otro: 'Otro'
    };
    return labels[tag.categoria] || labels.otro;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={iconRef}
        className="inline-flex items-center justify-center cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Info 
          className={`transition-all duration-200 ${
            hasDescription 
              ? 'text-d4-accent hover:text-d4-accent hover:drop-shadow-[0_0_4px_rgba(220,175,115,0.6)]' 
              : 'text-d4-accent/60 hover:text-d4-accent'
          }`}
          size={iconSize}
        />
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2 pointer-events-none animate-fade-in`}
          style={{ minWidth: '250px', maxWidth: '350px' }}
        >
          <div className={`bg-d4-surface rounded-lg shadow-2xl p-3 text-sm ${
            hasDescription 
              ? 'border-2 border-d4-accent/50 shadow-glow-medium' 
              : 'border-2 border-d4-accent/40'
          }`}>
            {/* Header con nombre del tag */}
            <div className="mb-2 pb-2 border-b border-d4-border/30">
              <div className="font-bold text-d4-accent mb-1 flex items-center gap-2">
                {tag.texto_original}
                {hasDescription && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-d4-accent/20 text-d4-accent rounded border border-d4-accent/30">
                    ✨ Con descripción
                  </span>
                )}
              </div>
              <code className="text-xs text-d4-text-dim font-mono bg-d4-bg/50 px-2 py-0.5 rounded">
                {tag.tag}
              </code>
            </div>

            {/* Categoría */}
            <div className="mb-2">
              <span className={`text-xs px-2 py-1 rounded border ${getCategoryColor()}`}>
                {getCategoryLabel()}
              </span>
            </div>

            {/* Significado */}
            {tag.significado && (
              <div className="mb-2 p-2 bg-d4-accent/5 rounded border-l-2 border-d4-accent/40">
                <div className="text-xs font-semibold text-d4-accent mb-1">📖 Significado:</div>
                <div className="text-xs text-d4-text leading-relaxed">
                  {tag.significado}
                </div>
              </div>
            )}

            {/* Descripción de jugabilidad */}
            {tag.descripcion_jugabilidad && (
              <div className="mb-2 p-2 bg-purple-500/5 rounded border-l-2 border-purple-500/40">
                <div className="text-xs font-semibold text-purple-400 mb-1">🎮 Jugabilidad:</div>
                <div className="text-xs text-d4-text leading-relaxed">
                  {tag.descripcion_jugabilidad}
                </div>
              </div>
            )}

            {/* Sinónimos */}
            {tag.sinonimos && tag.sinonimos.length > 0 && (
              <div className="mb-2">
                <div className="text-xs font-semibold text-d4-text-dim mb-1">Sinónimos:</div>
                <div className="text-xs text-d4-text">
                  {tag.sinonimos.join(', ')}
                </div>
              </div>
            )}

            {/* Origen */}
            <div className="text-xs text-d4-text-dim pt-2 border-t border-d4-border/30">
              Origen: <span className="text-d4-text capitalize">{tag.origen}</span>
            </div>

            {/* Advertencia si está pendiente de revisión */}
            {tag.pendiente_revision && (
              <div className="mt-2 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded px-2 py-1">
                ⚠️ Pendiente de revisión
              </div>
            )}

            {/* Flecha del tooltip */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 ${
                position === 'top' ? 'top-full' : 'bottom-full'
              }`}
            >
              <div
                className={`w-0 h-0 border-l-[6px] border-r-[6px] border-transparent ${
                  position === 'top'
                    ? 'border-t-[6px] border-t-d4-accent/40'
                    : 'border-b-[6px] border-b-d4-accent/40'
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
