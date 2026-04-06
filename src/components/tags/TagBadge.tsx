import { memo, useMemo } from 'react';
import { TagTooltip } from './TagTooltip';
import { TagService } from '../../services/TagService';

interface TagBadgeProps {
  tagId: string;
  showIcon?: boolean;
  iconSize?: number;
  className?: string;
  textSize?: string;
}

/**
 * TagBadge - Badge optimizado para mostrar tags con efecto visual si tienen descripción
 * 
 * Características:
 * - Brillo sutil para tags con descripción
 * - Tooltip integrado con info completa
 * - Memoizado para mejor performance
 * - Lazy loading de datos del tag
 * 
 * Props:
 * - tagId: ID del tag
 * - showIcon: Mostrar icono de info (default: true)
 * - iconSize: Tamaño del icono (default: 12)
 * - className: Clases CSS adicionales
 * - textSize: Tamaño del texto (default: 'text-[10px]')
 */
export const TagBadge = memo(function TagBadge({ 
  tagId, 
  showIcon = true, 
  iconSize = 12,
  className = '',
  textSize = 'text-[10px]'
}: TagBadgeProps) {
  // Memoizar la carga del tag para evitar re-renders innecesarios
  const tag = useMemo(() => TagService.getTagById(tagId), [tagId]);
  
  // Verificar si el tag tiene descripción (significado o descripcion_jugabilidad)
  const hasDescription = useMemo(() => {
    return !!(tag?.significado || tag?.descripcion_jugabilidad);
  }, [tag]);

  if (!tag) {
    // Si el tag no existe, mostrar solo el ID sin efectos
    return (
      <span className={`${textSize} text-d4-text-dim ${className}`}>
        {tagId}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span 
        className={`
          ${textSize} 
          px-1.5 py-0.5 
          rounded 
          transition-all 
          duration-300
          ${hasDescription 
            ? 'bg-d4-accent/10 text-d4-accent border border-d4-accent/30 shadow-glow-subtle hover:shadow-glow-medium hover:bg-d4-accent/15 cursor-help' 
            : 'bg-d4-bg/50 text-d4-text-dim border border-d4-border/30'
          }
        `}
        title={hasDescription ? 'Este tag tiene descripción detallada' : undefined}
      >
        {tag.texto_original || tagId}
      </span>
      {showIcon && <TagTooltip tagId={tagId} iconSize={iconSize} />}
    </div>
  );
});
