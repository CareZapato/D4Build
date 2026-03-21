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
                <p className="text-d4-text font-semibold">21 de Marzo, 2026</p>
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

        {/* Version 0.3.4 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.4</h3>
            <span className="text-xs text-d4-text-dim bg-green-600/20 text-green-400 px-2 py-1 rounded">Tags Estructurados</span>
          </div>

          <div className="space-y-4">
            {/* Tags Estructurados */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🏷️ Sistema de Tags con Metadata</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Tag como objeto:</strong> Ahora cada tag tiene estructura {`{tag, texto_original, significado, categoria, fuente}`}</li>
                <li>• <strong>Significado nullable:</strong> Permite guardar tags sin definición (significado: null)</li>
                <li>• <strong>Metadata rica:</strong> Categorías (atributo, condicion, recurso, etc.), fuente (tooltip, estadistica, manual)</li>
                <li>• <strong>Captura progresiva:</strong> Guarda lo que tienes ahora, enriquece después</li>
                <li>• <strong>Nombres en español:</strong> Todo en español - tag: "golpe_critico" (no "critical_hit")</li>
              </ul>
            </div>

            {/* Diccionario Global */}
            <div className="bg-d4-bg border-l-4 border-emerald-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📚 Diccionario Global de Palabras Clave</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Sección palabras_clave[]:</strong> Lista global de todas las palabras detectadas</li>
                <li>• <strong>Enriquecimiento:</strong> Campos adicionales (descripcion_jugabilidad, sinonimos, origen)</li>
                <li>• <strong>pendiente_revision:</strong> Flag para identificar tags sin completar (significado: null)</li>
                <li>• <strong>Centralizado:</strong> Una única fuente de verdad para todas las keywords del juego</li>
                <li>• <strong>Evolutivo:</strong> Agrega definiciones y contexto después de extraer datos</li>
              </ul>
            </div>

            {/* Modelo Refactorizado */}
            <div className="bg-d4-bg border-l-4 border-teal-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔧 Modelo JSON Refactorizado V2</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>DetalleEstadisticaV2:</strong> Detalles con tags como objetos estructurados</li>
                <li>• <strong>EstadisticaV2:</strong> Modelo completo (id, nombre, categoria, valor, unidad, detalles, tags)</li>
                <li>• <strong>PalabraClaveGlobal:</strong> Interface para diccionario con enriquecimiento</li>
                <li>• <strong>EstadisticasConPalabrasClave:</strong> Root con palabras_clave[] global</li>
                <li>• <strong>Ejemplo completo:</strong> estadisticas-v2-completo.json en carpeta ejemplos/</li>
              </ul>
            </div>

            {/* Prompt V2 */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🤖 Prompt IA V2 - Extracción Estructurada</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>generateStatsPromptV2():</strong> Nuevo prompt para formato V2</li>
                <li>• <strong>Instrucciones detalladas:</strong> Cómo extraer tags con metadata completa</li>
                <li>• <strong>Ejemplos de tags:</strong> Demuestra tags con/sin significado</li>
                <li>• <strong>Categorización:</strong> Guía para asignar categorías correctas</li>
                <li>• <strong>Todo en español:</strong> Genera variables, tags y textos en español</li>
                <li>• CharacterStats actualizado para usar generateStatsPromptV2()</li>
              </ul>
            </div>

            {/* Documentación */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📖 Documentación Completa</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>docs/modelo-estadisticas-refactorizado.md:</strong> Documentación exhaustiva del nuevo modelo</li>
                <li>• <strong>Interfaces TypeScript:</strong> Todas las definiciones de tipos V2</li>
                <li>• <strong>Ejemplo JSON:</strong> JSON completo con mezcla de tags completos y parciales</li>
                <li>• <strong>Beneficios:</strong> Explica ventajas del modelo estructurado</li>
                <li>• <strong>Guía de migración:</strong> Estrategia para actualizar datos existentes</li>
              </ul>
            </div>

            {/* Beneficios del Modelo V2 */}
            <div className="bg-d4-bg border-l-4 border-amber-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Beneficios del Sistema V2</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Captura incremental:</strong> No necesitas toda la info de golpe - guarda lo que tienes</li>
                <li>• <strong>Búsqueda mejorada:</strong> Filtra por categoría, fuente, estado de revisión</li>
                <li>• <strong>Extensibilidad:</strong> Agrega campos sin romper estructura existente</li>
                <li>• <strong>Visualización:</strong> Renderiza tooltips completos desde el significado</li>
                <li>• <strong>Análisis de builds:</strong> Agrupa por categoría (ofensivo, defensivo, etc.)</li>
                <li>• <strong>Multiidioma ready:</strong> texto_original + traducciones futuras</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.3 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.3</h3>
            <span className="text-xs text-d4-text-dim bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded">Confirmación y Multi-JSON</span>
          </div>

          <div className="space-y-4">
            {/* Botón Prompt IA en Stats */}
            <div className="bg-d4-bg border-l-4 border-indigo-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📸 Prompt IA en Estadísticas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>CharacterStats:</strong> Ahora tiene botón "Prompt IA" en sección de texto JSON</li>
                <li>• <strong>Copiar al portapapeles:</strong> Copia prompt completo para extraer estadísticas desde imágenes</li>
                <li>• <strong>Icono dinámico:</strong> Copy/Check con feedback visual de 2 segundos</li>
                <li>• <strong>Consistencia UI:</strong> Mismo diseño que CharacterSkills y CharacterGlyphs</li>
                <li>• Generá JSON completo de estadísticas con IA usando imágenes del juego</li>
              </ul>
            </div>

            {/* Multi-JSON */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📦 Soporte para Múltiples JSON</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Parseo inteligente:</strong> Detecta y procesa múltiples objetos JSON en el mismo texto</li>
                <li>• <strong>Combina datos:</strong> Merge automático de todos los JSON detectados</li>
                <li>• <strong>Regex avanzado:</strong> Identifica objetos JSON válidos incluso con saltos de línea</li>
                <li>• <strong>Sin errores:</strong> Ignora JSON inválidos y continúa con los válidos</li>
                <li>• <strong>CharacterSkills implementado:</strong> Pega varios JSON de habilidades de una vez</li>
                <li>• Facilita importación desde múltiples capturas de pantalla</li>
              </ul>
            </div>

            {/* Modal de Confirmación */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✅ Confirmación Antes de Importar</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Análisis previo:</strong> Calcula cambios SIN aplicarlos primero</li>
                <li>• <strong>Resumen detallado:</strong> Muestra exactamente qué se actualizará y qué se agregará</li>
                <li>• <strong>Modal ConfirmImportModal:</strong> Nuevo componente reutilizable para confirmaciones</li>
                <li>• <strong>Ejemplos:</strong> "2 habilidades activas actualizadas, 3 habilidades activas nuevas"</li>
                <li>• <strong>Botones claros:</strong> Cancelar para abortar, Confirmar para aplicar</li>
                <li>• <strong>Sin cambios accidentales:</strong> Previene sobrescribir datos sin querer</li>
                <li>• Usuario tiene control total antes de modificar su workspace</li>
              </ul>
            </div>

            {/* Lógica de Merge */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔄 Merge Inteligente de Datos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>analyzeImportChanges():</strong> Nueva función que analiza sin aplicar</li>
                <li>• <strong>Contador preciso:</strong> Distingue entre actualizaciones y agregados</li>
                <li>• <strong>Combina múltiples JSON:</strong> Merge de arrays antes de analizar</li>
                <li>• <strong>Keywords globales:</strong> Importa todas las palabras_clave de todos los JSON</li>
                <li>• <strong>applyImportChanges():</strong> Solo se ejecuta después de confirmación</li>
                <li>• <strong>Preserva IDs:</strong> Mantiene IDs originales al actualizar contenido</li>
                <li>• Sin duplicados, sin data perdida, todo controlado</li>
              </ul>
            </div>

            {/* Flujo Completo */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎯 Flujo de Importación Mejorado</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>1. Pegar JSON:</strong> Uno o múltiples objetos en el textarea</li>
                <li>• <strong>2. Análisis previo:</strong> Sistema detecta cambios sin modificar nada</li>
                <li>• <strong>3. Modal de resumen:</strong> Muestra qué se actualizará/agregará</li>
                <li>• <strong>4. Usuario decide:</strong> Cancelar o Confirmar</li>
                <li>• <strong>5. Aplicación:</strong> Solo si confirma, se guardan los cambios</li>
                <li>• <strong>6. Feedback final:</strong> Mensaje de éxito con detalles</li>
                <li>• Transparencia total en cada paso del proceso</li>
              </ul>
            </div>

            {/* Keywords en Prompts */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔑 Prompts Actualizados</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Todos los prompts:</strong> Ahora mencionan que pueden incluir palabras_clave[]</li>
                <li>• <strong>Estructura consistente:</strong> Sección palabras_clave en todos los JSON generados</li>
                <li>• <strong>generateStatsPrompt():</strong> Ya incluía palabras_clave (v0.3.1)</li>
                <li>• <strong>generateSkillsPrompt():</strong> Actualizado con ejemplos de palabras_clave</li>
                <li>• <strong>generateGlyphsPrompt():</strong> Incluye sección de keywords</li>
                <li>• IA ahora sabe extraer keywords en todos los tipos de importación</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.2 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.2</h3>
            <span className="text-xs text-d4-text-dim bg-teal-600/20 text-teal-400 px-2 py-1 rounded">Mejoras en Importación</span>
          </div>

          <div className="space-y-4">
            {/* Detalles Opcionales */}
            <div className="bg-d4-bg border-l-4 border-teal-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📦 Detalles de Estadísticas Opcionales</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Flexibilidad total:</strong> Los detalles[] ahora son completamente opcionales en importación</li>
                <li>• <strong>Doble modalidad:</strong> Importa JSON con estructura completa (detalles, palabras_clave) o simple (solo valores)</li>
                <li>• <strong>Sin errores:</strong> Si el JSON no trae detalles[], solo guarda valor base de la estadística</li>
                <li>• <strong>Compatibilidad:</strong> JSON de v0.3.0 y v0.3.1 funcionan igual sin modificaciones</li>
                <li>• <strong>Gradualidad:</strong> Puedes empezar con valores simples y agregar detalles después</li>
                <li>• Reduce complejidad inicial para usuarios nuevos</li>
              </ul>
            </div>

            {/* Keywords en Stats */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔑 Keywords en Estadísticas Corregido</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>CharacterStats:</strong> Ahora importa palabras_clave globales desde JSON de estadísticas</li>
                <li>• <strong>Importación unificada:</strong> Tanto archivo como texto importan keywords correctamente</li>
                <li>• <strong>4/4 componentes:</strong> CharacterSkills, CharacterGlyphs, CharacterStats, HeroManager</li>
                <li>• <strong>Cobertura total:</strong> Todos los tipos de importación ahora guardan keywords</li>
                <li>• <strong>Sin duplicados:</strong> KeywordsService previene keywords repetidas automáticamente</li>
                <li>• Base de conocimiento completa y consistente en todo el workspace</li>
              </ul>
            </div>

            {/* Robustez */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✅ Robustez en Importaciones</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Manejo de errores:</strong> Importación de keywords no falla proceso completo</li>
                <li>• <strong>Validación segura:</strong> Verifica que palabras_clave existe y es array antes de importar</li>
                <li>• <strong>Logs informativos:</strong> Console.log cuando keywords se importan exitosamente</li>
                <li>• <strong>Fallback gracioso:</strong> Si keywords falla, el resto de la importación continúa</li>
                <li>• Mayor estabilidad en flujo completo de importación</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.1 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.1</h3>
            <span className="text-xs text-d4-text-dim bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded">Estadísticas Detalladas y Actualizaciones Inteligentes</span>
          </div>

          <div className="space-y-4">
            {/* Detalles de Estadísticas */}
            <div className="bg-d4-bg border-l-4 border-emerald-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📊 Sistema de Detalles de Estadísticas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>DetalleEstadistica:</strong> Nueva interfaz para capturar composición de valores</li>
                <li>• <strong>Detalles anidados:</strong> Cada estadística ahora tiene array detalles[] opcional</li>
                <li>• <strong>Estructura completa:</strong> texto, valor, contribucion, palabras_clave por detalle</li>
                <li>• <strong>Ejemplo:</strong> "Probabilidad de golpe crítico" → detalles["Contribución de objetos: 0", "Aumenta la probabilidad de asestar golpe crítico"]</li>
                <li>• <strong>7 interfaces actualizadas:</strong> EstadisticasPersonaje, AtributosBase, Defensivo, Ofensivo, Utilidad, Armadura, AtributosPrincipales</li>
                <li>• <strong>Todas con detalles[]:</strong> Información de cómo se compone cada stat</li>
                <li>• Mayor transparencia en cálculos del juego</li>
              </ul>
            </div>

            {/* Palabras Clave en Stats */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔑 Palabras Clave en Estadísticas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>palabras_clave[] global:</strong> Todas las interfaces de stats ahora soportan keywords</li>
                <li>• <strong>Double tracking:</strong> Keywords tanto a nivel de stat como de detalle individual</li>
                <li>• <strong>Coherencia total:</strong> Mismo sistema que skills/glyphs/aspects para stats</li>
                <li>• <strong>Ejemplo:</strong> "vulnerable", "reduccion_de_danio", "aumentado" detectados en textos</li>
                <li>• <strong>Importación automática:</strong> Keywords de stats también van a workspace global</li>
                <li>• Keywords en blanco/subrayadas de tooltips ahora capturadas</li>
                <li>• Base de conocimiento unificada entre todas las entidades</li>
              </ul>
            </div>

            {/* Definición de Aguante */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🛡️ Definición de Aguante</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>aguante_definicion:</strong> Nuevo campo en EstadisticasPersonaje</li>
                <li>• <strong>Texto completo del tooltip:</strong> "El Aguante es una aproximación de la vida efectiva..."</li>
                <li>• <strong>Extracción desde imágenes:</strong> IA captura tooltip completo al procesar screenshots</li>
                <li>• <strong>UI futura:</strong> Preparado para mostrar definición en hover/modal</li>
                <li>• Documentación in-app del funcionamiento de Aguante</li>
              </ul>
            </div>

            {/* Actualizaciones Inteligentes */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔄 Actualizaciones Inteligentes</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Merge inteligente:</strong> Importación ahora actualiza datos existentes en lugar de duplicar</li>
                <li>• <strong>findIndex por nombre:</strong> Detecta si habilidad/glifo/aspecto ya existe</li>
                <li>• <strong>Update o Add:</strong> Si existe actualiza valores, si no existe lo añade nuevo</li>
                <li>• <strong>5 componentes actualizados:</strong> CharacterSkills, CharacterGlyphs, HeroManager (×3 tipos)</li>
                <li>• <strong>Preservación de IDs:</strong> IDs originales mantenidos al actualizar contenido</li>
                <li>• Sin duplicados al re-importar mismo JSON</li>
                <li>• Data consistency mejorada en todo el workspace</li>
              </ul>
            </div>

            {/* Mensajes de Modal Mejorados */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💬 Feedback Detallado en Importaciones</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Counters específicos:</strong> Rastreo separado de actualizados vs. agregados</li>
                <li>• <strong>Habilidades:</strong> "2 activas actualizadas, 3 activas nuevas, 1 pasiva actualizada"</li>
                <li>• <strong>Glifos:</strong> "5 actualizados, 2 nuevos"</li>
                <li>• <strong>Aspectos:</strong> "3 actualizados, 1 nuevo"</li>
                <li>• <strong>CharacterSkills:</strong> 4 contadores (activas/pasivas × actualizada/nueva)</li>
                <li>• <strong>CharacterGlyphs:</strong> 2 contadores (actualizado/agregado)</li>
                <li>• <strong>HeroManager:</strong> Contadores para los 3 tipos de importación</li>
                <li>• Mensajes informativos en lugar de genéricos "éxito"</li>
                <li>• Usuario sabe exactamente qué cambió con cada importación</li>
              </ul>
            </div>

            {/* Prompts para IA */}
            <div className="bg-d4-bg border-l-4 border-pink-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📸 Prompt de Estadísticas Mejorado</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>generateStatsPrompt():</strong> Nuevo método en ImageExtractionPromptService (150+ líneas)</li>
                <li>• <strong>Extrae detalles completos:</strong> TODOS los sub-items de cada estadística</li>
                <li>• <strong>Captura aguante_definicion:</strong> Tooltip completo del Aguante</li>
                <li>• <strong>Detecta palabras_clave:</strong> Términos en blanco/subrayados en detalles</li>
                <li>• <strong>JSON estructurado:</strong> Ejemplo completo con detalles[] anidados</li>
                <li>• <strong>7 secciones:</strong> personaje, atributosPrincipales, defensivo, ofensivo, utilidad, armaduraYResistencias, jcj</li>
                <li>• Extracción precisa de screenshots del juego a datos estructurados</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.0 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.0</h3>
            <span className="text-xs text-d4-text-dim bg-amber-600/20 text-amber-400 px-2 py-1 rounded">Sistema de Keywords y Clasificación de Skills</span>
          </div>

          <div className="space-y-4">
            {/* Clasificación de Habilidades */}
            <div className="bg-d4-bg border-l-4 border-amber-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎯 Clasificación Inteligente de Habilidades</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>3 tipos de habilidad:</strong> Skill (habilidad base), Modificador (mejora seleccionable), Pasiva</li>
                <li>• <strong>Campo tipo_habilidad:</strong> Añadido a todas las habilidades activas y pasivas</li>
                <li>• <strong>skill_padre:</strong> Modificadores ahora referencian la skill que mejoran</li>
                <li>• <strong>nivel_maximo:</strong> Cada skill/modificador/pasiva conoce su límite (1-5)</li>
                <li>• <strong>Prompts actualizados:</strong> IA ahora extrae el tipo de habilidad desde imágenes</li>
                <li>• Mayor precisión en la gestión de builds complejos</li>
                <li>• Permite analizar dependencias entre skills y sus modificadores</li>
              </ul>
            </div>

            {/* Sistema de Keywords Global */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔑 Sistema de Palabras Clave Globales</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Entidad transversal:</strong> Keywords guardadas a nivel workspace, no por héroe</li>
                <li>• <strong>KeywordsService:</strong> Nuevo servicio CRUD completo para gestión de keywords</li>
                <li>• <strong>Sin duplicados:</strong> Sistema inteligente de upsert previene keywords repetidas</li>
                <li>• <strong>Normalización de IDs:</strong> "Golpe Crítico" → "kw_golpe_critico" automáticamente</li>
                <li>• <strong>Categorías:</strong> atributo, efecto, condición, recurso, otro</li>
                <li>• <strong>Descripciones detalladas:</strong> Cada keyword guarda explicación del término</li>
                <li>• <strong>Importación desde JSON:</strong> Keywords de imágenes extraídas y guardadas globalmente</li>
                <li>• Base de conocimiento reutilizable entre todas las skills/glyphs/aspects</li>
              </ul>
            </div>

            {/* Extracción desde Imágenes */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📸 Extracción de Keywords desde Imágenes</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Palabras en blanco:</strong> IA detecta términos marcados en blanco/subrayados</li>
                <li>• <strong>Todos los prompts actualizados:</strong> Skills, glyphs, aspects ahora incluyen palabras_clave[]</li>
                <li>• <strong>JSON estructurado:</strong> palabras_clave global con palabra, descripción, categoría</li>
                <li>• <strong>Importación automática:</strong> HeroManager procesa palabras_clave antes de guardar datos</li>
                <li>• <strong>Consistencia total:</strong> Mismas keywords en múltiples skills sin duplicar</li>
                <li>• Los tooltips de imágenes ahora se capturan como descripciones</li>
                <li>• Mayor precisión en builds al conocer modificadores exactos del juego</li>
              </ul>
            </div>

            {/* Visualización UI */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💎 Visualización de Keywords en UI</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Badges ámbar:</strong> Keywords mostradas como pills color ámbar brillante</li>
                <li>• <strong>Todas las vistas:</strong> CharacterSkills, CharacterGlyphs con keywords visibles</li>
                <li>• <strong>Gestión de Heroes:</strong> HeroSkills, HeroGlyphs, HeroAspects muestran keywords</li>
                <li>• <strong>Separación visual:</strong> Keywords en sección separada con border-top</li>
                <li>• <strong>Tamaño reducido:</strong> text-[9px] para no interferir con contenido principal</li>
                <li>• <strong>Tooltip descriptivo:</strong> "Palabra clave del juego" al hacer hover</li>
                <li>• Fácil identificación de mecánicas compartidas entre elementos</li>
              </ul>
            </div>

            {/* Arquitectura */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🏗️ Mejoras Arquitectónicas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Tipos actualizados:</strong> PalabraClave, PalabrasClaveGlobales, TipoHabilidad</li>
                <li>• <strong>LocalStorage workspace-scoped:</strong> {`{workspace}_palabras_clave_globales`}</li>
                <li>• <strong>Separación keywords/palabras_clave:</strong> keywords[] búsqueda simple, palabras_clave[] IDs detallados</li>
                <li>• <strong>Métodos async:</strong> loadKeywords(), upsertKeywords(), searchKeywords()</li>
                <li>• <strong>Por categoría:</strong> getKeywordsByCategory() para filtrado especializado</li>
                <li>• <strong>Búsqueda por IDs:</strong> getKeywordsByIds() para resolver referencias</li>
                <li>• Código mantenible y escalable para futuras features</li>
                <li>• Base sólida para sistema de filtrado y búsqueda avanzada</li>
              </ul>
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
