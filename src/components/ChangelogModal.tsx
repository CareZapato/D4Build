import React from 'react';
import { X, Code, Calendar, User } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-d4-surface pb-4 border-b border-d4-border">
          <div>
            <h2 className="text-2xl font-bold text-d4-accent">D4 Builds Manager</h2>
            <p className="text-sm text-d4-text-dim">Registro de Cambios</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-d4-border rounded transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5 text-d4-text" />
          </button>
        </div>

        {/* Developer Info */}
        <div className="bg-d4-bg border border-d4-border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-d4-accent" />
              <div>
                <p className="text-xs text-d4-text-dim">Desarrollador</p>
                <p className="text-d4-text font-semibold">Zapato</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-d4-accent" />
              <div>
                <p className="text-xs text-d4-text-dim">Última actualización</p>
                <p className="text-d4-text font-semibold">22 de Marzo, 2026</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-d4-border">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-d4-accent" />
              <p className="text-xs text-d4-text-dim font-semibold">Tecnologías</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-d4-accent/20 text-d4-accent rounded border border-d4-accent/30">
                React 18.3.1
              </span>
              <span className="text-xs px-2 py-1 bg-d4-accent/20 text-d4-accent rounded border border-d4-accent/30">
                TypeScript 5.6.3
              </span>
              <span className="text-xs px-2 py-1 bg-d4-accent/20 text-d4-accent rounded border border-d4-accent/30">
                TailwindCSS
              </span>
              <span className="text-xs px-2 py-1 bg-d4-accent/20 text-d4-accent rounded border border-d4-accent/30">
                Vite
              </span>
            </div>
          </div>
        </div>

        {/* Version 0.2.0 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.2.0</h3>
            <span className="text-xs text-d4-text-dim bg-cyan-600/20 text-cyan-400 px-2 py-1 rounded">Mejoras UX y Sistema Inteligente</span>
          </div>

          <div className="space-y-4">
            {/* Sistema de Modales */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💬 Sistema de Diálogos Profesional</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Adiós a alert():</strong> Todos los mensajes del navegador reemplazados</li>
                <li>• <strong>Modales personalizados:</strong> Componente Modal con diseño gaming inmersivo</li>
                <li>• <strong>5 tipos de diálogo:</strong> Info (azul), Success (verde), Warning (amarillo), Error (rojo), Confirm (dorado)</li>
                <li>• <strong>Iconografía clara:</strong> Info, CheckCircle, AlertTriangle, AlertCircle según tipo</li>
                <li>• <strong>Hook useModal:</strong> Sistema reutilizable con API simple (showInfo, showSuccess, etc.)</li>
                <li>• <strong>Confirmaciones async:</strong> showConfirm retorna Promise&lt;boolean&gt; para flujo moderno</li>
                <li>• <strong>Backdrop con blur:</strong> Fondo oscuro con efecto de desenfoque</li>
                <li>• <strong>Animaciones suaves:</strong> Fade-in con transiciones fluidas</li>
                <li>• Botón de cerrar (X) en todas las variantes</li>
                <li>• Mensajes con títulos por defecto inteligentes</li>
              </ul>
            </div>

            {/* Actualización Inteligente */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔄 Actualización Inteligente de Datos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Smart update:</strong> Al importar JSONs, actualiza elementos existentes en lugar de duplicar</li>
                <li>• <strong>Detección por nombre:</strong> Encuentra items por nombre y actualiza sus datos</li>
                <li>• <strong>Preserva IDs:</strong> Mantiene identidad original al actualizar, evita referencias rotas</li>
                <li>• <strong>Skills actualizados:</strong> Importar JSON actualiza nivel, descripción, valores, etc.</li>
                <li>• <strong>Glyphs inteligentes:</strong> Actualiza nivel_actual de glifos existentes</li>
                <li>• <strong>Agregar nuevos:</strong> Solo agrega items si no existen previamente</li>
                <li>• <strong>Mensajes claros:</strong> "X procesados correctamente" indica update + add</li>
                <li>• Lógica con findIndex para búsqueda eficiente</li>
                <li>• Aplicado en CharacterSkills y CharacterGlyphs</li>
              </ul>
            </div>

            {/* Mejoras Visuales Cards */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎨 Refinamiento Visual de Tarjetas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Títulos más grandes:</strong> Skills/Glyphs ahora usan text-base para nombres</li>
                <li>• <strong>Nivel entre paréntesis:</strong> Formato "Nombre de Skill (Nivel 5)" más legible</li>
                <li>• <strong>Badges reducidos:</strong> Etiquetas tipo/rama ahora en text-[9px] uppercase</li>
                <li>• <strong>Descripciones mejoradas:</strong> text-sm con leading-relaxed para mejor lectura</li>
                <li>• <strong>Espacio optimizado:</strong> Padding p-3, márgenes ajustados (mt-3 en descripción)</li>
                <li>• <strong>Consistencia total:</strong> Skills activas, pasivas y glifos homologados</li>
                <li>• <strong>Borders reforzados:</strong> border-2 para mayor definición</li>
                <li>• Jerarquía visual clara con tamaños diferenciados</li>
              </ul>
            </div>

            {/* Integración Completa */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✅ Integración en Toda la App</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Characters:</strong> CharacterList, CharacterDetail, CharacterSkills, CharacterGlyphs, CharacterStats</li>
                <li>• <strong>Heroes:</strong> HeroManager, HeroSkills, HeroGlyphs, HeroAspects</li>
                <li>• <strong>Prompts:</strong> PromptGenerator con modales integrados</li>
                <li>• <strong>Confirmaciones UX:</strong> Eliminar personajes/skills/glyphs ahora con modal confirm</li>
                <li>• <strong>Errores claros:</strong> Importaciones fallidas, validaciones, errores de guardado</li>
                <li>• <strong>Éxitos visibles:</strong> Operaciones exitosas muestran feedback inmediato</li>
                <li>• 0 alerts nativos restantes en toda la aplicación</li>
                <li>• Experiencia profesional y consistente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.1.3 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.1.3</h3>
            <span className="text-xs text-d4-text-dim bg-purple-600/20 text-purple-400 px-2 py-1 rounded">Mejoras Visuales y Funcionales</span>
          </div>

          <div className="space-y-4">
            {/* Rediseño Visual */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎨 Rediseño Visual Completo</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Fuentes gaming:</strong> Implementadas Rajdhani y Orbitron de Google Fonts</li>
                <li>• <strong>Tipografía mejorada:</strong> Títulos con efecto uppercase y tracking amplio</li>
                <li>• <strong>Tamaños aumentados:</strong> Textos más legibles y mejor jerarquía visual</li>
                <li>• <strong>Botones renovados:</strong> Efectos hover con elevación y sombras mejoradas</li>
                <li>• <strong>Tarjetas premium:</strong> Gradientes sutiles y efectos de profundidad</li>
                <li>• <strong>Scrollbar gaming:</strong> Gradientes dorados con efectos de brillo</li>
                <li>• Animaciones suaves con transform y box-shadow</li>
                <li>• Background con gradiente diagonal para mayor inmersión</li>
              </ul>
            </div>

            {/* Mejoras UX */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Experiencia de Usuario</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Sidebar mejorado:</strong> Diseño más amplio con gradientes y efectos visuales</li>
                <li>• <strong>Versión actualizada:</strong> Badge de versión v0.1.3 en sidebar</li>
                <li>• <strong>Tarjetas de personaje:</strong> Efecto de brillo en hover con elevación</li>
                <li>• <strong>Stats visuales:</strong> Valores con fuente Orbitron y efecto text-shadow dorado</li>
                <li>• <strong>Grid optimizado:</strong> Hasta 4 columnas en pantallas XL</li>
                <li>• <strong>Badges mejorados:</strong> Más grandes con borders y sombras</li>
                <li>• Mejor aprovechamiento del espacio en todas las vistas</li>
                <li>• Reducción de espacios vacíos innecesarios</li>
              </ul>
            </div>

            {/* Glifos con Nivel */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💎 Sistema de Niveles para Glifos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Nivel mostrado:</strong> Visualización "nivel actual / 100" en cada glifo</li>
                <li>• <strong>Tipo actualizado:</strong> Soporte para nivel_actual y nivel_maximo en tipos</li>
                <li>• <strong>Importación mejorada:</strong> Al importar glifos se establece nivel_maximo = 100</li>
                <li>• <strong>Agregar glifos:</strong> Nuevos glifos inician en nivel 1 con máx. 100</li>
                <li>• <strong>Heroes sin nivel:</strong> En gestión de héroes no se muestra nivel (todos son 100)</li>
                <li>• Input mejorado con indicador visual del máximo</li>
              </ul>
            </div>

            {/* Descripción Pasivas */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🛠️ Corrección Skills Pasivas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Bug corregido:</strong> Habilidades pasivas ahora muestran descripción correctamente</li>
                <li>• <strong>Compatibilidad:</strong> Lee tanto campo "descripcion" como "efecto"</li>
                <li>• <strong>Fallback inteligente:</strong> Muestra descripcion primero, luego efecto si no existe</li>
                <li>• Todas las pasivas ahora visibles sin importar el campo usado</li>
              </ul>
            </div>

            {/* Fecha de Actualización */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🕐 Indicador de Última Actualización</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Headers informativos:</strong> Fecha y hora en secciones colapsables</li>
                <li>• <strong>Formato localizado:</strong> Fecha en español con hora (DD/MM/YYYY HH:MM)</li>
                <li>• <strong>Secciones incluidas:</strong> Habilidades, Estadísticas y Glifos del personaje</li>
                <li>• Actualización automática al guardar cambios</li>
                <li>• Mejor trazabilidad de modificaciones</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.1.2 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.1.2</h3>
            <span className="text-xs text-d4-text-dim bg-green-600/20 text-green-400 px-2 py-1 rounded">Correcciones Críticas</span>
          </div>

          <div className="space-y-4">
            {/* Correcciones Críticas */}
            <div className="bg-d4-bg border-l-4 border-red-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔧 Correcciones Críticas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Importación de habilidades:</strong> Corregido error tipográfico crítico en HeroManager.tsx</li>
                <li>• <strong>Bug fix:</strong> Arreglado typo en habilidades_pasivas que impedía la compilación</li>
                <li>• <strong>Prompts IA:</strong> Corregidas referencias a stats en CharacterPrompts</li>
                <li>• <strong>Estadísticas:</strong> Ahora usa personaje.estadisticas correctamente en lugar de personaje.stats</li>
                <li>• <strong>Contexto de stats:</strong> Extraído correctamente de defensivo, ofensivo y armaduraYResistencias</li>
                <li>• La aplicación ahora compila y se levanta sin errores</li>
              </ul>
            </div>

            {/* Mejoras en Prompts */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Mejoras en Generador de Prompts</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Contexto mejorado:</strong> Ahora extrae correctamente vida, daño base y armadura</li>
                <li>• <strong>Datos precisos:</strong> Usa los campos reales del tipo Personaje</li>
                <li>• <strong>Información completa:</strong> Incluye todos los datos relevantes para análisis de IA</li>
                <li>• <strong>Sinergia perfecta:</strong> Compatible con el sistema de referencias de la app</li>
              </ul>
            </div>

            {/* Estabilidad */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✅ Estabilidad y Rendimiento</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Todos los errores de compilación TypeScript resueltos</li>
                <li>• Tipos correctos en toda la aplicación</li>
                <li>• Sin warnings de referencias no utilizadas</li>
                <li>• Aplicación lista para producción</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.1.1 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.1.1</h3>
            <span className="text-xs text-d4-text-dim">Mejoras Mayores y Correcciones</span>
          </div>

          <div className="space-y-4">
            {/* Generador de Prompts IA */}
            <div className="bg-d4-bg border-l-4 border-pink-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Generador de Prompts IA (NUEVO)</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Nueva sección en personajes:</strong> Genera consultas inteligentes sobre tu build</li>
                <li>• <strong>6 tipos de prompts especializados:</strong></li>
                <li>&nbsp;&nbsp;- Análisis completo de build con sinergias</li>
                <li>&nbsp;&nbsp;- Optimización de sinergias de glifos</li>
                <li>&nbsp;&nbsp;- Recomendaciones de aspectos legendarios</li>
                <li>&nbsp;&nbsp;- Rotación óptima de habilidades</li>
                <li>&nbsp;&nbsp;- Prioridad de estadísticas</li>
                <li>&nbsp;&nbsp;- Evaluación de viabilidad endgame</li>
                <li>• Los prompts incluyen automáticamente toda la información de tu personaje</li>
                <li>• Copia con un clic para usar en ChatGPT, Claude, Gemini u otras IAs</li>
                <li>• Contexto completo: skills, glifos, aspectos, stats y nivel</li>
              </ul>
            </div>

            {/* Sistema de IDs Mejorado */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔑 Sistema de IDs para Skills y Glifos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>IDs automáticos:</strong> Se asignan al importar habilidades y glifos</li>
                <li>• <strong>Gestión por referencia:</strong> Los personajes guardan solo los IDs</li>
                <li>• <strong>Optimización de almacenamiento:</strong> Evita duplicación de datos</li>
                <li>• <strong>Consistencia:</strong> Mismo sistema que aspectos</li>
                <li>• Cada skill, glifo y aspecto tiene un ID único generado automáticamente</li>
              </ul>
            </div>

            {/* Vista de Aspectos Mejorada */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎨 Vista de Aspectos Reorganizada</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Lista unificada:</strong> Todos los aspectos en una sola lista continua</li>
                <li>• <strong>Íconos de categoría:</strong> Indicadores visuales pequeños y eficientes</li>
                <li>• <strong>Colores distintivos:</strong> Rojo (ofensivo), Azul (defensivo), Verde (recurso), Morado (utilidad), Amarillo (movilidad)</li>
                <li>• <strong>Mejor paginación:</strong> Selector de items por página (5, 10, 20, 50, 100)</li>
                <li>• Los filtros ahora funcionan perfectamente con la vista unificada</li>
                <li>• Búsqueda en tiempo real sin perder contexto visual</li>
              </ul>
            </div>

            {/* Correcciones Técnicas */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🐛 Correcciones Críticas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Aspectos:</strong> Corrección crítica del bug que impedía visualizar aspectos</li>
                <li>• <strong>Compatibilidad:</strong> Soporte para formato antiguo (nombre/categoria/descripcion)</li>
                <li>• <strong>Normalización:</strong> Conversión automática entre formatos sin pérdida de datos</li>
                <li>• <strong>Props types:</strong> Corregidos tipos entre HeroAspects y HeroManager</li>
                <li>• <strong>Categorías:</strong> Manejo correcto de mayúsculas/minúsculas</li>
                <li>• Panel de debug removido de producción</li>
              </ul>
            </div>

            {/* Mejoras UX */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎯 Mejoras de Experiencia</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Auto-scroll suave al cambiar de página en aspectos</li>
                <li>• Información contextual en header: "Mostrando X-Y de Z"</li>
                <li>• Botones de navegación inteligentes (deshabilitados cuando no aplican)</li>
                <li>• Secciones colapsables para mejor organización</li>
                <li>• Indicadores visuales más claros en toda la interfaz</li>
                <li>• Tooltips informativos en íconos y botones</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.1.0 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.1.0</h3>
            <span className="text-xs text-d4-text-dim">Lanzamiento Inicial</span>
          </div>

          <div className="space-y-4">
            {/* Gestión de Personajes */}
            <div className="bg-d4-bg border-l-4 border-d4-accent p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📋 Gestión de Personajes</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Crea y administra múltiples personajes de Diablo 4</li>
                <li>• Guarda información general: nombre, clase, nivel y nivel Paragon</li>
                <li>• Sistema de secciones colapsables para organizar mejor la información</li>
                <li>• Edita y actualiza la información de tus personajes cuando quieras</li>
                <li>• Elimina personajes que ya no necesites</li>
              </ul>
            </div>

            {/* Habilidades */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">⚔️ Sistema de Habilidades</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Selecciona habilidades activas y pasivas desde la base de datos de tu héroe</li>
                <li>• Importa todas tus habilidades desde un archivo JSON</li>
                <li>• Visualiza la información completa de cada habilidad</li>
                <li>• Agrega, edita o elimina habilidades de tu build</li>
              </ul>
            </div>

            {/* Glifos */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💎 Glifos del Tablero Paragon</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Administra los glifos equipados en tu tablero Paragon</li>
                <li>• Cada glifo guarda su nivel actual específico para tu personaje</li>
                <li>• Importa glifos desde JSON con toda su información</li>
                <li>• Visualiza rareza, efectos y bonificaciones de cada glifo</li>
              </ul>
            </div>

            {/* Aspectos */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Sistema de Aspectos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Gestiona aspectos legendarios organizados por categorías con colores</li>
                <li>• 5 categorías: Ofensivo (rojo), Defensivo (azul), Recurso (verde), Utilidad (morado), Movilidad (amarillo)</li>
                <li>• Busca aspectos por nombre, efecto o palabras clave</li>
                <li>• Importa y exporta aspectos en formato JSON</li>
              </ul>
            </div>

            {/* Estadísticas */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📊 Estadísticas del Personaje</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Registra todas las estadísticas de tu personaje organizadas por pestañas</li>
                <li>• Incluye: atributos principales, defensivo, ofensivo, utilidad, armadura y más</li>
                <li>• Importa estadísticas completas desde JSON</li>
                <li>• El nivel se sincroniza automáticamente al importar estadísticas</li>
              </ul>
            </div>

            {/* Gestión de Héroes */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🛡️ Base de Datos de Héroes</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Mantén una base de datos maestra para cada clase (Paladín, Bárbaro, etc.)</li>
                <li>• Importa habilidades, glifos y aspectos desde archivos JSON</li>
                <li>• Edita cualquier elemento directamente desde la interfaz</li>
                <li>• Agrega nuevos elementos manualmente sin necesidad de archivos</li>
                <li>• Exporta tus datos para respaldo o compartir</li>
                <li>• Los personajes usan referencias a estos datos para evitar duplicación</li>
              </ul>
            </div>

            {/* Prompts IA */}
            <div className="bg-d4-bg border-l-4 border-pink-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🤖 Asistente de IA</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Botones "Copiar Prompt para IA" en múltiples secciones</li>
                <li>• Extrae datos de capturas de pantalla del juego usando IA</li>
                <li>• Genera prompts optimizados para extraer habilidades, glifos, estadísticas y aspectos</li>
                <li>• Copia el prompt, pégalo en tu IA favorita con la imagen y obtén el JSON</li>
              </ul>
            </div>

            {/* Workspace */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💾 Sistema de Workspace</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Todos tus datos se guardan localmente en tu computadora</li>
                <li>• Selecciona una carpeta donde quieres guardar tu información</li>
                <li>• Crea múltiples workspaces para diferentes cuentas o temporadas</li>
                <li>• Cambio rápido entre diferentes workspaces</li>
                <li>• Tus datos están siempre disponibles sin necesidad de internet</li>
              </ul>
            </div>

            {/* UI/UX */}
            <div className="bg-d4-bg border-l-4 border-red-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎨 Interfaz y Experiencia</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Diseño inspirado en la estética de Diablo 4</li>
                <li>• Tema oscuro optimizado para largas sesiones</li>
                <li>• Secciones colapsables para mejor organización</li>
                <li>• Sin recargas de página al importar datos</li>
                <li>• Búsqueda y filtros en todas las secciones principales</li>
                <li>• Interfaz responsiva que funciona en diferentes tamaños de pantalla</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-d4-border text-center">
          <p className="text-xs text-d4-text-dim">
            D4 Builds Manager es una herramienta de gestión de builds para Diablo 4.
            <br />
            No está afiliado ni respaldado por Blizzard Entertainment.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
