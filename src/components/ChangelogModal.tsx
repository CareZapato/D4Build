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
                <p className="text-d4-text font-semibold">15 de Abril, 2026 (v0.5.0)</p>
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

        {/* Version 0.5.0 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.5.0</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 px-2 py-1 rounded">Sistema de Subcategorías Paragon</span>
          </div>

          <div className="space-y-4">
            <div className="bg-d4-bg border-l-4 border-emerald-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                🎯 Sistema Inteligente de Subcategorías
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>8 subcategorías especializadas</strong> para datos Paragon: tableros, nodos (normal/mágico/raro/legendario), zócalos, atributos, configuración</li>
                <li><strong>Selección visual en Modal de Captura</strong>: dropdown dinámico que aparece solo al seleccionar categoría Paragon</li>
                <li><strong>Asignación automática de destino</strong>: cada subcategoría determina si los datos van a Héroe, Personaje o Ambos</li>
                <li>Indicadores claros en la UI mostrando el <strong>destino de guardado</strong> de cada subcategoría</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-teal-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-teal-300 mb-2 flex items-center gap-2">
                🤖 Selección Automática de Prompts IA
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Mapeo automático</strong> de subcategoría → prompt específico</li>
                <li><code className="bg-d4-surface px-1 rounded">tableros</code> → Prompt de catálogo de tableros Paragon</li>
                <li><code className="bg-d4-surface px-1 rounded">nodos_*</code> → Prompts especializados por rareza (4 tipos)</li>
                <li><code className="bg-d4-surface px-1 rounded">zocalos</code> → Prompt de ranuras de glifos en tableros</li>
                <li><code className="bg-d4-surface px-1 rounded">atributos/configuracion</code> → Prompt de configuración del personaje</li>
                <li>Eliminada ambigüedad: <strong>cada subcategoría tiene su propio prompt optimizado</strong></li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                💾 Lógica de Guardado Inteligente
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Datos de Héroe</strong>: tableros, nodos, zócalos → guardados en <code className="bg-d4-surface px-1 rounded">/heroes/{'{clase}'}_paragon_*.json</code></li>
                <li><strong>Datos de Personaje</strong>: configuración → guardada en <code className="bg-d4-surface px-1 rounded">/personajes/{'{id}'}.json</code> bajo bloque <code className="bg-d4-surface px-1 rounded">paragon</code></li>
                <li><strong>Datos mixtos</strong>: atributos → pueden importarse en ambos contextos según necesidad</li>
                <li>MERGE inteligente que <strong>preserva datos existentes</strong> al importar</li>
                <li>Detección de duplicados con notificaciones de <strong>nuevos/actualizados/repetidos</strong></li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                🔀 Actualización Automática de Tipo de Prompt
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Al seleccionar una subcategoría, el <strong>tipo de prompt</strong> (Héroe/Personaje) se actualiza automáticamente</li>
                <li>Tableros y nodos → cambio automático a <strong>"Héroe"</strong></li>
                <li>Configuración → cambio automático a <strong>"Personaje"</strong></li>
                <li>Atributos → permite <strong>ambos tipos</strong>, usuario decide contexto</li>
                <li>Reducción de errores al evitar combinaciones inválidas de tipo/subcategoría</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-indigo-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                🏗️ Mejoras de Arquitectura
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Nuevo tipo <code className="bg-d4-surface px-1 rounded">ParagonSubcategory</code> con 8 valores posibles</li>
                <li>Estado <code className="bg-d4-surface px-1 rounded">paragonSubcategory</code> en ImageCaptureModal</li>
                <li>Handlers <code className="bg-d4-surface px-1 rounded">handleCategoryChange</code> y <code className="bg-d4-surface px-1 rounded">handleParagonSubcategoryChange</code> con lógica de sincronización</li>
                <li>Estructura <code className="bg-d4-surface px-1 rounded">CATEGORIES</code> extendida con array <code className="bg-d4-surface px-1 rounded">subcategories</code> opcional</li>
                <li>Funciones <code className="bg-d4-surface px-1 rounded">getPromptForCategory</code> y <code className="bg-d4-surface px-1 rounded">getShortPrompt</code> actualizadas con switch anidado</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.15 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.15</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-orange-600/20 to-yellow-600/20 text-orange-300 px-2 py-1 rounded">Sistema Paragon Completo</span>
          </div>

          <div className="space-y-4">
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
                ⚡ Sistema Paragon Implementado
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Tipos TypeScript completos</strong> para tableros, nodos (normales, mágicos, raros, legendarios) y zócalos de glifos</li>
                <li><strong>Estructura de datos para héroe</strong>: catálogos de tableros y nodos Paragon por clase</li>
                <li><strong>Estructura de datos para personaje</strong>: tableros equipados, nodos activados, atributos acumulados</li>
                <li>Servicios de <strong>carga/guardado</strong> en WorkspaceService para datos Paragon</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-yellow-300 mb-2 flex items-center gap-2">
                🎯 7 Prompts Especializados para Extracción con IA
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Prompt para tableros Paragon</strong>: extrae catálogo de tableros disponibles</li>
                <li><strong>Prompts para nodos</strong>: normales, mágicos, raros y legendarios (4 prompts especializados)</li>
                <li><strong>Prompt para zócalos de glifos</strong>: ranuras especiales en tableros</li>
                <li><strong>Prompt para configuración del personaje</strong>: tableros equipados, nodos activados, atributos totales</li>
                <li>Formato JSON optimizado con ejemplos completos en cada prompt</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                🎨 Componente UI CharacterParagon
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Vista completa</strong> del sistema Paragon del personaje</li>
                <li>Muestra <strong>nivel Paragon, puntos gastados/disponibles</strong> y tableros equipados</li>
                <li>Visualización de <strong>nodos activados</strong> por tablero con rotación</li>
                <li>Muestra <strong>atributos acumulados</strong> con desglose de contribuciones</li>
                <li>Importación desde JSON (archivo o texto) con validación</li>
                <li>Botón de <strong>copiar prompt IA</strong> para extracción de configuración</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                📁 Nueva Categoría en Modal de Captura
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Categoría "Paragon"</strong> agregada al sistema de captura de imágenes</li>
                <li>Carpeta <strong>/imagenes/paragon/</strong> creada automáticamente en workspace</li>
                <li>Límite recomendado de <strong>8 capturas</strong> para datos completos de Paragon</li>
                <li>Integración completa con el sistema de extracción por IA</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                🔧 Integración en CharacterDetail
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Componente Paragon <strong>integrado</strong> en vista de detalle del personaje</li>
                <li>Guardado automático con <strong>merge seguro</strong> en archivo del personaje</li>
                <li>Estado reactivo sincronizado con cambios del personaje</li>
                <li>Gestión de errores con modales de notificación</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.14 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.14</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 px-2 py-1 rounded">Sistema Avanzado de Prompts IA</span>
          </div>

          <div className="space-y-4">
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                🧠 Prompts de Diagnóstico Profesional
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Análisis de puntos fuertes y débiles</strong> detallados de la build actual</li>
                <li>Prompts enriquecidos con <strong>todos los datos disponibles</strong>: modificadores, efectos, escalados, bonificaciones</li>
                <li>Información de <strong>tags</strong> incluida para análisis más profundo de sinergias</li>
                <li>Sugerencias de qué <strong>cambiar, mejorar o mantener</strong> en la configuración</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                🔄 Sistema de Multi-Prompts Comparativos
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Comparación con todas las opciones disponibles</strong> del héroe en habilidades, glifos y aspectos</li>
                <li><strong>Stage 1</strong>: Recopilación de datos y generación de resumen de opciones</li>
                <li><strong>Stage 2</strong>: Análisis profundo comparativo con recomendaciones específicas</li>
                <li>Los prompts sugieren <strong>guardar información clave</strong> en memoria del chat para análisis continuos</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-amber-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                🧮 Análisis Matemático de Build
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Cálculos de daño</strong>: Desglose matemático de cómo se obtiene el DPS final</li>
                <li><strong>Cálculos defensivos</strong>: Análisis de reducción de daño y efectividad del aguante</li>
                <li>Identificación de <strong>multiplicadores clave</strong> y su impacto en la build</li>
                <li>Sugerencias basadas en <strong>teorycrafting matemático</strong> para maximizar potencia</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                ⚙️ Activación Condicional Inteligente
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Los prompts se <strong>activan/desactivan</strong> según datos disponibles</li>
                <li><strong>Análisis básico</strong>: Requiere datos del personaje cargados</li>
                <li><strong>Análisis comparativo</strong>: Requiere datos del héroe disponibles</li>
                <li>Indicadores visuales muestran <strong>qué falta cargar</strong> para habilitar cada prompt</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.12 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.12</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-emerald-300 px-2 py-1 rounded">Control Manual + Reporte Inteligente</span>
          </div>

          <div className="space-y-4">
            <div className="bg-d4-bg border-l-4 border-emerald-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-emerald-300 mb-2 flex items-center gap-2">
                ✅ Finalizar Proceso Bajo Demanda
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>El modal de reporte ahora incluye botón <strong>Finalizar proceso</strong> para continuar cuando el usuario quiera</li>
                <li>Se eliminaron recargas automáticas que cerraban el reporte antes de poder leerlo</li>
                <li>El usuario controla cuándo cerrar/reload tras revisar el resultado</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                📊 Reporte de Importación Más Preciso
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Se muestra cuántos <strong>elementos trae el JSON</strong> antes del merge final</li>
                <li>El resumen diferencia claramente elementos <strong>nuevos, actualizados y repetidos</strong></li>
                <li>La lista de <strong>JSONs procesados</strong> aparece en un bloque expandible colapsado por defecto</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-amber-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                ♻️ Ejecución desde Galería sin Duplicados
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Al ejecutar JSON individual o por lotes desde galería, se procesa contra datos existentes <strong>sin auto-guardar una nueva copia</strong></li>
                <li>Se evita la creación innecesaria de archivos adicionales al final de la importación</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.10 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.10</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-300 px-2 py-1 rounded">Edición Galería + Importación Masiva Detallada</span>
          </div>

          <div className="space-y-4">
            <div className="bg-d4-bg border-l-4 border-amber-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                ✏️ Editar desde Galería Corregido
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Botón Editar ahora carga correctamente la imagen en el <strong>preview</strong> de captura</li>
                <li>También carga el JSON de importación cuando existe</li>
                <li>Permite modificar y actualizar datos guardados desde el gestor de capturas</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                📂 Botones de Importación Masiva Reubicados
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Junto al título de galería: botón para importar todos los JSONs de la categoría actual</li>
                <li>Fuera del cuadro de galería (abajo): botón <strong>Importar todos los datos guardados</strong> para todas las categorías</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                📊 Progreso y Confirmación Detallados
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Barra de progreso con texto dinámico de la tarea actual</li>
                <li>Indicadores en vivo de JSONs procesados y elementos importados</li>
                <li>Resumen final por categoría en el modal de confirmación</li>
                <li>Errores detallados con información de dónde y qué falló</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                📈 Completitud y Prompt Mejorados
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>La barra de completitud de personajes ahora parte en <strong>60%</strong> y no cuenta nombre/clase</li>
                <li>Las estadísticas suman progreso de forma incremental aunque la categoría esté incompleta</li>
                <li>En el modal de captura, el panel de Prompt queda <strong>activo por defecto</strong></li>
                <li>El botón Prompt muestra indicador visual de expandir/contraer</li>
              </ul>
            </div>

            <div className="bg-d4-bg border-l-4 border-red-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                🧪 Corrección de Importación JSON + Detección de Repetidos
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Corregida la ejecución desde galería para leer JSON como texto y evitar falsos "JSON no disponible"</li>
                <li>El resumen de importación ahora distingue: <strong>agregados, actualizados y repetidos</strong></li>
                <li>Se muestran detalles expandibles con nombres de elementos por categoría</li>
                <li>Se agregaron logs detallados para diagnóstico en importación individual y por categoría</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.9 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.9</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-emerald-600/20 to-teal-600/20 text-emerald-300 px-2 py-1 rounded">Galería Inteligente + Auto-guardado</span>
          </div>

          <div className="space-y-4">
            {/* Visor limpio en PC */}
            <div className="bg-d4-bg border-l-4 border-sky-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-sky-300 mb-2 flex items-center gap-2">
                🖥️ Visor Limpio en PC (Solo Iconos)
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Botones flotantes sobre el preview ahora muestran <strong>solo iconos con tooltip</strong> en todas las dimensiones</li>
                <li>Eliminadas etiquetas de texto (Nuevo, Completar, Copiar, Prompt) que ocupaban espacio visual</li>
                <li>Tooltips descriptivos al pasar el mouse sobre cada botón</li>
              </ul>
            </div>

            {/* Auto-guardado de JSON tras importación */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                💾 Auto-guardado de JSON tras Importación
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Cuando una importación es exitosa, el sistema guarda automáticamente en galería sin acción manual
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Con imagen en preview</strong>: guarda la imagen + JSON, limpia el preview</li>
                <li><strong>Imagen ya guardada antes</strong>: solo guarda el JSON junto a ella</li>
                <li><strong>Imagen de galería seleccionada</strong>: guarda JSON junto a esa imagen</li>
                <li><strong>Sin imagen</strong>: guarda solo el JSON como entrada independiente en galería</li>
              </ul>
            </div>

            {/* Galería inteligente */}
            <div className="bg-d4-bg border-l-4 border-amber-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                🗂️ Galería Inteligente (JSON sin Imagen)
              </h4>
              <p className="text-sm text-d4-text mb-3">
                La galería ahora muestra entradas JSON-only con un placeholder visual
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li>Entradas sin imagen usan un <strong>placeholder naranja con icono FileJson</strong></li>
                <li>Hacer clic en el placeholder carga el JSON en el panel de importación</li>
                <li>Botón Play (▶) disponible para ejecutar directamente el JSON guardado</li>
                <li>Los botones de acción (Ver, Copiar imagen) solo aparecen cuando hay imagen</li>
              </ul>
            </div>

            {/* Click en galería carga imagen + JSON */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                🔗 Click en Galería Carga Imagen + JSON
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Al seleccionar una imagen de galería que tiene JSON: <strong>carga imagen en visor y JSON en textarea</strong></li>
                <li>Permite completar o re-procesar una imagen con el JSON previo como base</li>
                <li>Si la imagen no tiene JSON, abre el panel para procesar desde cero con IA</li>
              </ul>
            </div>

            {/* Edición directa y ejecución global */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                ✏️ Edición Directa + Batch Global Mejorado
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Nuevo botón <strong>Editar</strong> por elemento en galería para llevarlo a la vista de captura</li>
                <li>Editar carga automáticamente los datos disponibles: <strong>imagen, JSON o ambos</strong></li>
                <li>El botón <strong>Ejecutar Todo (Todas)</strong> ahora procesa JSONs de todas las categorías, incluyendo entradas JSON-only</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.8 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.8</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-orange-600/20 to-red-600/20 text-orange-300 px-2 py-1 rounded">Optimización UX + Compacto</span>
          </div>

          <div className="space-y-4">
            {/* Sidebar corregido */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                🔧 Sidebar Persistente Corregido
              </h4>
              <p className="text-sm text-d4-text mb-2">
                Solución definitiva al problema de scroll del menú lateral
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Agregado <code className="text-xs bg-d4-surface px-1 py-0.5 rounded">min-h-0</code> a la navegación para permitir flex shrinking apropiado</li>
                <li>El header ya no se recorta al hacer scroll en el menú</li>
                <li>Navegación siempre visible y accesible</li>
              </ul>
            </div>

            {/* Modal de capturas optimizado */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                🎨 Modal de Capturas Optimizado
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Rediseño completo del layout para mejor aprovechamiento del espacio
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Selector de categorías horizontal</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Cambiado de grid vertical a flex horizontal compacto</li>
                    <li>Botones con whitespace-nowrap para mantener legibilidad</li>
                    <li>Ocupa menos espacio vertical (una sola línea)</li>
                  </ul>
                </li>
                <li><strong>Checkbox embeber → Icono flotante</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Eliminado checkbox grande que ocupaba espacio</li>
                    <li>Nuevo botón flotante con icono FileText junto a otros botones</li>
                    <li>Resalta en naranja cuando está activo</li>
                    <li>Tooltip descriptivo para claridad</li>
                  </ul>
                </li>
                <li><strong>Botones reducidos</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Botón "Guardar": Reducido de flex-1 a p-2.5 estándar</li>
                    <li>Botón "Procesar con IA": Reducido de px-4 py-3 a px-3 py-2</li>
                    <li>Texto abreviado en móvil ("Procesar" vs "Procesar con IA y Guardar")</li>
                    <li>Tamaño consistente con el resto de acciones</li>
                  </ul>
                </li>
                <li><strong>Compactación adicional de espacios</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Eliminado el título superior del modal de capturas para ganar altura útil</li>
                    <li>El cuadro de estado de "Procesamiento automático" fue removido; queda solo el botón junto a las acciones del visor</li>
                    <li>La ayuda contextual ahora aparece al pasar el mouse sobre el botón "Prompt"</li>
                    <li>El selector de categorías mantiene íconos representativos y en móvil prioriza vista icon-only con tooltip</li>
                    <li>Botones Captura/Galería alineados en la misma franja horizontal de categorías, a la derecha</li>
                  </ul>
                </li>
                <li><strong>Botón "Cargar Archivo" eliminado</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Removido botón redundante al final del modal</li>
                    <li>Ctrl+V sigue siendo el método principal de captura</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Contador de elementos mejorado */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                🔢 Sistema de Conteo Manual de Elementos
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Ahora puedes especificar manualmente cuántos elementos capturaste cuando una imagen contiene múltiples ítems
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Input de override manual</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Nuevo input numérico junto a la fracción X/Y</li>
                    <li>Placeholder "Manual" para claridad</li>
                    <li>Permite ingresar cantidad real cuando capturas múltiples elementos en una sola imagen</li>
                    <li>El contador automático se actualiza al ingresar valor manual</li>
                  </ul>
                </li>
                <li><strong>Límites sugeridos ajustados</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Habilidades: 4 (reducido desde 6)</li>
                    <li>Glifos: 6 (reducido desde 8)</li>
                    <li>Aspectos: 5 (reducido desde 7)</li>
                    <li>Estadísticas: 5 (sin cambio)</li>
                    <li>Otros: 6 (reducido desde 8)</li>
                    <li>Recomendaciones basadas en precisión óptima de IA</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Responsividad mejorada */}
            <div className="bg-d4-bg border-l-4 border-amber-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                📱 Márgenes Móviles Optimizados
              </h4>
              <p className="text-sm text-d4-text mb-2">
                Todos los elementos respetan márgenes en vistas móviles y estrechas
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Selector de categorías usa flex-wrap para adaptarse</li>
                <li>Botones flotantes siguen siendo accesibles en pantallas pequeñas</li>
                <li>Input manual de elementos se adapta a 12px en móvil, 14px en desktop</li>
              </ul>
            </div>

            {/* Visibilidad total y ergonomía de layout */}
            <div className="bg-d4-bg border-l-4 border-violet-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-violet-300 mb-2 flex items-center gap-2">
                🪄 Visibilidad Total y Ergonomía de Layout
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Ajustes para que todos los elementos sean accesibles sin solapamiento en cualquier tamaño de pantalla
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Botones Captura/Galería/Cerrar en misma fila</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>X de cierre movida junto a Captura y Galería en el mismo flex</li>
                    <li>Separador visual entre Galería y X para mayor claridad</li>
                    <li>Sin solapamiento sobre otros elementos</li>
                  </ul>
                </li>
                <li><strong>Botones flotantes del visor más pequeños en móvil</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Padding reducido de p-2 a p-1 en móvil (p-2 en sm+)</li>
                    <li>Íconos de 14px en móvil (20px en sm+) para liberar espacio del visor</li>
                  </ul>
                </li>
                <li><strong>Prompt siempre visible + barra de sugerencia reordenada</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Texto "Prompt" siempre visible en cualquier dimensión</li>
                    <li>Barra de sugerencia queda a la izquierda, botón Prompt a la derecha</li>
                    <li>Tooltip de instrucciones anclado a la derecha para no salirse de pantalla</li>
                  </ul>
                </li>
                <li><strong>Texto del prompt expandible en móvil</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Toggle "Ver texto del prompt ▼" en pantallas pequeñas</li>
                    <li>Prioriza el cuadro de pegado de JSON, ocultando el texto por omisión en móvil</li>
                    <li>En desktop (lg:) el texto siempre está visible</li>
                  </ul>
                </li>
                <li><strong>Copiar Prompt + Cantidad elementos en la misma fila</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Input de cantidad movido al lado del botón "Copiar Prompt"</li>
                    <li>Más espacio para el área de importación de JSON</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.7 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.7</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-cyan-600/20 to-teal-600/20 text-cyan-300 px-2 py-1 rounded">UX Móvil + Heroes + Prompts Avanzados</span>
          </div>

          <div className="space-y-4">
            {/* Optimización de espacios */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-orange-300 mb-2 flex items-center gap-2">
                🎯 Optimización de Espacios y Navegación
              </h4>
              <p className="text-sm text-d4-text mb-3">
                El modal de capturas ha sido completamente rediseñado para ganar espacio vertical y facilitar la navegación
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Header eliminado</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Removido título "CAPTURA DE IMÁGENES" para ganar espacio</li>
                    <li>Botón X de cierre movido a esquina superior derecha (absolute)</li>
                  </ul>
                </li>
                <li><strong>Categorías + Botones en la misma línea</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Categorías con iconos representativos: ⚔️ Habilidades, ⬡ Glifos, 💎 Aspectos, 📊 Estadísticas, ⊞ Otros</li>
                    <li>Label "Categoría:" en línea con los botones</li>
                    <li>Botones Captura/Galería justificados a la derecha</li>
                    <li>Todo en una franja horizontal compacta</li>
                    <li>Móvil: solo iconos con tooltips</li>
                  </ul>
                </li>
                <li><strong>Preview simplificado</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Título reducido de "Preview en Tiempo Real" a solo "Preview"</li>
                    <li>Botón HelpCircle eliminado (instrucciones movidas al hover del botón Prompt)</li>
                  </ul>
                </li>
                <li><strong>Botón Prompt minimalista con tooltip integrado</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Botón más pequeño y compacto</li>
                    <li>Tooltip de instrucciones aparece al hacer hover sobre el botón</li>
                    <li>Instrucciones condensadas y más directas</li>
                  </ul>
                </li>
                <li><strong>Barra de progreso junto al botón Prompt</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Barra de sugerencia movida al lado derecho del botón Prompt</li>
                    <li>Input manual reducido (placeholder "Man")</li>
                    <li>Todo en una sola línea horizontal</li>
                    <li>Tooltip con recomendaciones optimizado (más compacto)</li>
                  </ul>
                </li>
                <li><strong>Cuadro "Procesamiento Automático con IA" eliminado</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Eliminado cuadro grande que ocupaba mucho espacio</li>
                    <li>Botón de IA ahora junto con Guardar, Descargar, Copiar, Eliminar</li>
                    <li>Mismas dimensiones (p-2.5) que los otros botones de acción</li>
                    <li>Tooltips descriptivos cuando el botón no está disponible</li>
                    <li>Barra de progreso compacta aparece solo durante procesamiento</li>
                    <li>Viewer de JSON más pequeño, con botón de cierre</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Responsividad móvil del modal de capturas */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                📱 Modal de Capturas Totalmente Responsivo
              </h4>
              <p className="text-sm text-d4-text mb-3">
                El modal de capturas ahora es completamente funcional en dispositivos móviles y vistas estrechas (50% de ancho)
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Botones flotantes sobre preview</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Los botones de modo de captura flotan sobre la imagen con backdrop-blur</li>
                    <li>Iconos: Plus (Nuevo), ArrowDown (Completar), Copy (Copiar Guardada)</li>
                    <li>Texto descriptivo visible solo en desktop (lg: breakpoint)</li>
                    <li>Ahorra espacio vertical eliminando sección separada</li>
                  </ul>
                </li>
                <li><strong>Botones de acción icon-only</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Descargar, Copiar, Eliminar son solo íconos en móvil</li>
                    <li>Tooltips descriptivos en todos los botones</li>
                    <li>Layout flex-wrap que se adapta al ancho disponible</li>
                  </ul>
                </li>
                <li><strong>Panel derecho minimalista</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Fuentes ultra-compactas en móvil (text-[9px], text-[10px])</li>
                    <li>Fuentes normales en desktop (text-xs, text-sm)</li>
                    <li>Padding reducido (p-1.5 vs p-2)</li>
                    <li>Título compacto: "Prompt" en móvil, "Prompt para [Categoría]" en desktop</li>
                    <li>Botón Guardar muestra solo texto corto en móvil</li>
                  </ul>
                </li>
                <li><strong>Espaciado optimizado</strong>: Márgenes y gaps ajustados progresivamente (1.5 → 2)</li>
              </ul>
            </div>

            {/* Mejoras en sección Heroes */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                🛡️ Reorganización de la Sección Heroes
              </h4>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Tabs reordenados</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Primero: "Gestionar Datos" (vista por defecto)</li>
                    <li>Segundo: "Importar/Exportar"</li>
                    <li>Prioriza la gestión directa sobre la importación</li>
                  </ul>
                </li>
                <li><strong>Exportación completa en ZIP</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Nuevo botón "Exportar Todo (ZIP)" en sección de exportar</li>
                    <li>Descarga todos los datos del workspace en un archivo comprimido</li>
                    <li>Incluye: héroes (todas las clases), personajes, tags configurados</li>
                    <li>Estructura de carpetas preservada para fácil re-importación</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Sidebar persistente */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                📍 Menú Lateral Persistente
              </h4>
              <p className="text-sm text-d4-text mb-2">
                El sidebar ahora tiene altura fija y no se expande según el contenido de la sección actual
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Altura consistente independientemente de la vista activa</li>
                <li>Overflow-y-auto solo en la sección de navegación si es necesario</li>
                <li>Experiencia de navegación más estable y predecible</li>
              </ul>
            </div>

            {/* Generador de prompts mejorado */}
            <div className="bg-d4-bg border-l-4 border-amber-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                🎯 Generador de Prompts Avanzado
              </h4>
              <p className="text-sm text-d4-text mb-3">
                El generador de prompts ahora incluye datos completos con tags y soporta prompts múltiples continuos
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Datos enriquecidos con tags</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Incluye todos los tags asociados a habilidades, glifos y aspectos</li>
                    <li>Muestra detalles completos de cada tag (descripción, valores)</li>
                    <li>Contexto más rico para análisis de IA</li>
                  </ul>
                </li>
                <li><strong>Prompts múltiples continuos</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Split automático si el prompt excede límite de tokens (configurable)</li>
                    <li>Prompts numerados secuencialmente (Parte 1/3, Parte 2/3, etc.)</li>
                    <li>Cada parte es independiente pero enlazada</li>
                    <li>Ideal para builds complejos con muchos elementos</li>
                  </ul>
                </li>
                <li><strong>Mejor coherencia</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Estructura consistente en todos los tipos de prompts</li>
                    <li>Información del personaje completa (nivel, clase, paragon)</li>
                    <li>Formato optimizado para obtener mejores respuestas de IA</li>
                  </ul>
                </li>
                <li><strong>Indicadores visuales</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Muestra longitud estimada del prompt</li>
                    <li>Indica si se generarán múltiples partes</li>
                    <li>Contador de tokens aproximado</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.6 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.6</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-red-600/20 to-orange-600/20 text-red-300 px-2 py-1 rounded">Correcciones de Importación</span>
          </div>

          <div className="space-y-4">
            {/* Fix capturas de modal */}
            <div className="bg-d4-bg border-l-4 border-red-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                🔧 Corrección de Capturas y JSONs de Respuesta
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Arreglados problemas críticos en el modal de capturas y el formato de responses JSON
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Modales de exportación corregidos</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>ImageViewerModal: Cambiado de React.FC a export default function</li>
                    <li>EmptyImportWarningModal: Mismo fix para resolver errores de módulo</li>
                    <li>Error "does not provide an export named 'default'" resuelto</li>
                  </ul>
                </li>
                <li><strong>Importación no destructiva</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Importar desde captura ya NO reescribe/sobrescribe datos existentes</li>
                    <li>Modo upsert mejorado: actualiza si existe, agrega si no existe</li>
                    <li>Preserva datos anteriores del héroe y personaje</li>
                  </ul>
                </li>
                <li><strong>Ajustes en importación de aspectos</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Validación mejorada de estructura de aspectos</li>
                    <li>Manejo correcto de aspectos equipados vs pool de héroe</li>
                    <li>Tags de aspectos se preservan correctamente</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Estadísticas */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                📊 Mejoras en Estadísticas
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Fix de estadísticas para sección de personajes y captura</li>
                <li>Sincronización correcta de nivel y nivel_paragon</li>
                <li>Importación de estadísticas sin recargar página</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.3 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.3</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-green-600/20 to-teal-600/20 text-green-300 px-2 py-1 rounded">Prompts + Importación Enriquecida</span>
          </div>

          <div className="space-y-4">
            {/* Prompts unificados */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                🔧 Prompts de Captura y Personaje Unificados
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Los prompts de captura ahora replican la lógica completa de las secciones de personaje, sin versiones resumidas.
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Aspectos de personaje enriquecidos</strong>: nivel, categoría por color, effect, detalles y tags por aspecto.</li>
                <li><strong>Captura = Personaje</strong>: la generación de prompt en modal usa la misma fuente que las secciones de personaje.</li>
                <li><strong>Límite de extracción</strong>: se mantiene consistente en los prompts de captura y personaje.</li>
              </ul>
            </div>

            {/* Importación robusta */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                🔗 Importación en Modal Corregida y Persistente
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Importar desde captura ahora guarda correctamente en maestros del héroe y crea/actualiza referencias del personaje sin perder sincronía.
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Skills y glifos</strong>: upsert en héroe + upsert de referencias en personaje.</li>
                <li><strong>Aspectos</strong>: guarda detalle completo en héroe (effect, category, tags, detalles, level) y refs por aspecto_id.</li>
                <li><strong>Refresh inteligente</strong>: tras importar JSON desde captura, recarga sin pedir carpeta nuevamente en la sesión.</li>
              </ul>
            </div>

            {/* UI compacta */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                🎨 Panel de Prompt Más Compacto
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Reducción de padding, márgenes y tamaños de texto</li>
                <li>Área del prompt scroll limitada a 220px</li>
                <li>Textarea de importación reducida a 80px de alto</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.5 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.5</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-300 px-2 py-1 rounded">Correcciones Críticas</span>
          </div>

          <div className="space-y-4">
            {/* Carga de personajes */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                🔧 Carga de Personajes Corregida
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Los personajes ahora se cargan correctamente desde archivos JSON en el workspace
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>refreshPersonajes implementado</strong>: AppContext ahora carga personajes desde WorkspaceService
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Lee archivos JSON de la carpeta personajes/</li>
                    <li>Actualiza automáticamente al cargar workspace</li>
                    <li>Disponible en todos los componentes vía contexto</li>
                  </ul>
                </li>
                <li><strong>Selector de personajes funcional</strong>: Modal de capturas muestra personajes correctamente</li>
              </ul>
            </div>

            {/* Prompt embebido mejorado */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                🎨 Prompt Embebido Reubicado
              </h4>
              <p className="text-sm text-d4-text mb-3">
                El texto del prompt ahora aparece arriba de las imágenes, como un enunciado claro
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Posición superior</strong>: El prompt está en la parte superior de la imagen compuesta
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Las imágenes capturadas se muestran debajo del prompt</li>
                    <li>Funciona como enunciado de la tarea</li>
                  </ul>
                </li>
                <li><strong>Marco decorativo</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Borde negro de 3px alrededor del texto</li>
                    <li>Fondo gris claro (#F5F5F5) dentro del marco</li>
                    <li>15px de margen blanco alrededor del marco</li>
                    <li>Separación clara entre prompt e imágenes</li>
                  </ul>
                </li>
                <li><strong>Mejor legibilidad</strong>: Texto negro en negrita, bien espaciado dentro del marco</li>
              </ul>
              <div className="mt-3 p-2 bg-d4-surface rounded border border-blue-500/30">
                <p className="text-xs text-blue-300 font-semibold">💡 Mejora Visual</p>
                <p className="text-xs text-d4-text-dim mt-1">
                  El prompt ahora se ve como una instrucción clara y separada del contenido capturado, mejorando la experiencia al usar ChatGPT.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Version 0.4.4 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.4</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 px-2 py-1 rounded">Composición Inteligente</span>
          </div>

          <div className="space-y-4">
            {/* Layout de composición */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                🎨 Layout Inteligente de Composición
              </h4>
              <p className="text-sm text-d4-text mb-3">
                La composición ahora usa un layout inteligente que apila elementos verticalmente después de 4 horizontales
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Grid adaptativo</strong>: Hasta 4 elementos se muestran horizontalmente
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>1-4 elementos: Layout horizontal tradicional</li>
                    <li>5+ elementos: Grid con 4 columnas, filas apiladas verticalmente</li>
                    <li>Evita imágenes excesivamente anchas</li>
                  </ul>
                </li>
                <li><strong>Espaciado optimizado</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>10px de espacio entre elementos completos</li>
                    <li>Sin espacio entre partes incompletas (modo continuar)</li>
                    <li>Filas separadas por el mismo espaciado</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Límites aumentados */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                📊 Límites Recomendados Aumentados
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Los límites de elementos por captura se ajustaron según la complejidad del JSON
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Skills: 4 → 6</strong> (JSON complejo con activas/pasivas/modificadores/tags)</li>
                <li><strong>Glifos: 6 → 8</strong> (Complejidad media con bonificaciones/escalado)</li>
                <li><strong>Aspectos: 5 → 7</strong> (Complejidad media-alta con keywords/tags)</li>
                <li><strong>Otros: 5 → 8</strong> (Complejidad variable según categoría)</li>
                <li><strong>Estadísticas: 1</strong> (Sin cambio, captura única comprehensiva)</li>
              </ul>
              <div className="mt-3 p-2 bg-d4-surface rounded border border-blue-500/30">
                <p className="text-xs text-blue-300 font-semibold">💡 Consideración</p>
                <p className="text-xs text-d4-text-dim mt-1">
                  Los límites son recomendaciones para obtener resultados óptimos con ChatGPT. Puedes capturar más elementos, pero la calidad de extracción puede variar.
                </p>
              </div>
            </div>

            {/* Botón borrar */}
            <div className="bg-d4-bg border-l-4 border-red-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                🗑️ Borrar Imagen Compuesta
              </h4>
              <p className="text-sm text-d4-text mb-2">
                Nuevo botón para eliminar la imagen compuesta del visor de preview
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Permite limpiar el preview sin cerrar el modal</li>
                <li>Útil para rehacer la composición desde cero</li>
                <li>Libera memoria eliminando la URL del objeto blob</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.3 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.3</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-300 px-2 py-1 rounded">Importación JSON</span>
          </div>

          <div className="space-y-4">
            {/* Importación directa de JSON */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                📥 Importación Directa de JSON Resultante
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Ahora puedes pegar el JSON resultado de ChatGPT directamente en el modal de capturas y guardarlo sin salir
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Área de texto integrada</strong>: Panel de importación en el panel de prompts
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Aparece debajo del prompt completo</li>
                    <li>Acepta el JSON tal como lo devuelve ChatGPT</li>
                    <li>Con placeholders específicos por categoría</li>
                  </ul>
                </li>
                <li><strong>Guardado inteligente según tipo</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li><strong>Héroe</strong>: Guarda en datos maestros de la clase seleccionada</li>
                    <li><strong>Personaje</strong>: Agrega al personaje seleccionado (sin sobrescribir)</li>
                  </ul>
                </li>
                <li><strong>Selector de clase/personaje</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Para Héroe: Dropdown con todas las clases disponibles</li>
                    <li>Para Personaje: Dropdown con personajes creados (arreglado)</li>
                    <li>Botones más compactos (solo "Héroe" y "Personaje")</li>
                  </ul>
                </li>
                <li><strong>Procesamiento por categoría</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li><strong>Skills</strong>: Procesa habilidades_activas + habilidades_pasivas</li>
                    <li><strong>Glifos</strong>: Agrega glifos con nivel inicial</li>
                    <li><strong>Aspectos</strong>: Diferencia entre aspectos generales (Héroe) y equipados (Personaje)</li>
                    <li><strong>Estadísticas</strong>: Sincroniza nivel y nivel_paragon automáticamente</li>
                  </ul>
                </li>
                <li><strong>Toast notifications</strong>: Confirmación visual de guardado exitoso con cantidad de elementos</li>
                <li><strong>Validaciones</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Verifica que el JSON sea válido</li>
                    <li>Requiere selección de clase/personaje antes de guardar</li>
                    <li>Muestra advertencias claras si falta información</li>
                  </ul>
                </li>
              </ul>
              <div className="mt-3 p-2 bg-d4-surface rounded border border-green-500/30">
                <p className="text-xs text-green-300 font-semibold">🚀 Workflow Completo</p>
                <p className="text-xs text-d4-text-dim mt-1">
                  1. Captura screenshots → 2. Embebe prompt (opcional) → 3. Copia imagen → 4. Pega en ChatGPT → 5. Copia JSON resultante → 6. Pega en área de importación → 7. ¡Guardado automático!
                </p>
              </div>
            </div>

            {/* Mejoras UX */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                ✨ Mejoras de UX
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Botones compactos</strong>: "Héroe" y "Personaje" en lugar de "Para Héroe (Clase)" y "Para Personaje"
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>Más espacio vertical para el área de importación</li>
                    <li>Interfaz más limpia</li>
                  </ul>
                </li>
                <li><strong>Select de personajes arreglado</strong>: Ahora muestra correctamente los personajes creados
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>Validación de personajes disponibles</li>
                    <li>Mensaje si no hay personajes creados</li>
                  </ul>
                </li>
                <li><strong>Selector de clase para Héroe</strong>: Ya no necesitas ir a la sección Heroes
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>Selecciona la clase directamente desde el modal</li>
                    <li>Lista completa de clases disponibles</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.2 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.2</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 px-2 py-1 rounded">UX Mejorada</span>
          </div>

          <div className="space-y-4">
            {/* Layout optimizado */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                🎨 Layout Optimizado del Gestor de Imágenes
              </h4>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Preview con menos zoom</strong>: Imagen mostrada al 85% para ver más contenido de una vez
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Mejor visión general de la imagen compuesta</li>
                    <li>Scroll más eficiente</li>
                  </ul>
                </li>
                <li><strong>Panel de Prompt lateral colapsable</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Botón "Prompt" en la esquina superior derecha del preview</li>
                    <li>Por defecto: Preview ocupa 100% del ancho</li>
                    <li>Al expandir: Preview 50% + Prompt 50% (lado a lado)</li>
                    <li>Eliminado tab "Prompt IA" redundante</li>
                  </ul>
                </li>
                <li><strong>Tabs simplificados</strong>: Solo "Capturar" y "Galería"</li>
              </ul>
            </div>

            {/* Embeber prompt en imagen */}
            <div className="bg-d4-bg border-l-4 border-pink-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-pink-300 mb-2 flex items-center gap-2">
                📝 Embeber Prompt en Imagen (Nuevo)
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Opción para agregar el prompt resumido directamente en la imagen, reduciendo a la mitad el trabajo de copiar cosas
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Checkbox opcional</strong>: "Embeber prompt en imagen"
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Por defecto desactivado (imagen sin texto)</li>
                    <li>Al activar: agrega sección de texto en la parte inferior</li>
                  </ul>
                </li>
                <li><strong>Prompt resumido optimizado</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Versión condensada pero sin perder estructura</li>
                    <li>Incluye cantidad de elementos detectados</li>
                    <li>Formato legible para ChatGPT y otros LLMs</li>
                    <li>Destaca información crítica del JSON esperado</li>
                  </ul>
                </li>
                <li><strong>Contexto inteligente</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Si seleccionaste un personaje: incluye nombre, clase y nivel</li>
                    <li>Adapta el prompt según tipo (Héroe vs Personaje)</li>
                  </ul>
                </li>
                <li><strong>Renderizado de alta calidad</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Texto en negro bold sobre fondo gris claro</li>
                    <li>Borde superior para separar imagen del texto</li>
                    <li>Maneja saltos de línea (\\n) correctamente</li>
                    <li>Wrapping automático según ancho de imagen</li>
                  </ul>
                </li>
              </ul>
              <div className="mt-3 p-2 bg-d4-surface rounded border border-pink-500/30">
                <p className="text-xs text-pink-300 font-semibold">🚀 Beneficio Principal</p>
                <p className="text-xs text-d4-text-dim mt-1">
                  Copia la imagen y pégala directamente en ChatGPT. El modelo leerá tanto la imagen como las instrucciones embebidas, eliminando la necesidad de copiar el prompt por separado.
                </p>
              </div>
            </div>

            {/* Prompts resumidos */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                📋 Prompts Resumidos por Categoría
              </h4>
              <p className="text-sm text-d4-text mb-2">
                Cada categoría tiene su propio prompt resumido optimizado para embeber:
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Habilidades</strong>: Estructura activas/pasivas, tags estructurados, modificadores</li>
                <li><strong>Glifos</strong>: Atributos escalados, bonificaciones adicionales, rareza</li>
                <li><strong>Aspectos</strong>:
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>Héroe: id, name, effect, category, keywords</li>
                    <li>Personaje: aspecto_id, nivel_actual, slot, valores_actuales</li>
                  </ul>
                </li>
                <li><strong>Estadísticas</strong>: Todas las secciones, nivel_paragon, atributosPrincipales</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.4.1 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.1</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-300 px-2 py-1 rounded">Mejora</span>
          </div>

          <div className="space-y-4">
            {/* Prompts contextuales */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                🎯 Prompts Contextuales (Héroe vs Personaje)
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Ahora puedes elegir si el prompt es para extraer datos de <strong>Héroe (clase general)</strong> o <strong>Personaje específico</strong>
              </p>
              <ul className="text-sm text-d4-text space-y-2 ml-4 list-disc">
                <li><strong>Selector de tipo</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li><strong>Para Héroe (Clase)</strong>: Usa prompts generales para datos maestros de la clase</li>
                    <li><strong>Para Personaje</strong>: Usa prompts específicos para datos equipados/activos de un personaje</li>
                  </ul>
                </li>
                <li><strong>Selector de personaje</strong> (cuando tipo = Personaje):
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Dropdown con todos tus personajes creados</li>
                    <li>Muestra: Nombre - Clase (Nivel / Paragon)</li>
                    <li>Opcional: Si no seleccionas, usa prompt genérico</li>
                  </ul>
                </li>
                <li><strong>Contexto automático</strong>: Si seleccionas un personaje, el prompt incluye su información:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Nombre del personaje</li>
                    <li>Clase</li>
                    <li>Nivel y nivel Paragon</li>
                  </ul>
                </li>
                <li><strong>Prompts específicos por tipo</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li><strong>Aspectos de Héroe</strong>: Extrae aspectos generales de la clase (todos los disponibles)</li>
                    <li><strong>Aspectos de Personaje</strong>: Extrae <em>solo aspectos equipados</em> con valores actuales y slot</li>
                  </ul>
                </li>
                <li><strong>Mantiene contador de elementos</strong>: La concatenación automática de cantidad de elementos se conserva al final</li>
              </ul>
              <div className="mt-3 p-2 bg-d4-surface rounded border border-blue-500/30">
                <p className="text-xs text-blue-300 font-semibold">🎯 Beneficio Principal</p>
                <p className="text-xs text-d4-text-dim mt-1">
                  La IA recibe el contexto correcto según si estás trabajando con datos maestros del héroe o con el build específico de un personaje, mejorando la precisión de la extracción.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Version 0.4.0 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.4.0</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-300 px-2 py-1 rounded">Nueva Funcionalidad Mayor</span>
          </div>

          <div className="space-y-4">
            {/* Gestor de Captura de Imágenes */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                📸 Gestor de Captura de Imágenes
              </h4>
              <p className="text-sm text-d4-text mb-3">
                Nueva herramienta completa para capturar, componer y gestionar imágenes del juego de forma eficiente
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Captura por categorías</strong>: Skills, Glifos, Aspectos, Estadísticas, Otros</li>
                <li><strong>Pegar con Ctrl+V</strong>: Captura screenshots directamente desde el clipboard</li>
                <li><strong>Dos modos de captura</strong>:
                  <ul className="ml-4 mt-1 space-y-0.5">
                    <li>🟢 <strong>Nuevo Elemento</strong>: Agrega a la derecha con espacio (elementos diferentes)</li>
                    <li>🟣 <strong>Completar</strong>: Agrega abajo sin espacio (continúa elemento incompleto)</li>
                  </ul>
                </li>
                <li><strong>Composición inteligente</strong>: Une múltiples capturas en una sola imagen</li>
                <li><strong>Preview en tiempo real</strong>: Ve cómo quedará la imagen final mientras capturas (siempre visible)</li>
                <li><strong>Guardado automático</strong>: Crea carpeta /img dentro de cada categoría</li>
                <li><strong>Galería integrada</strong>: Visualiza todas las imágenes guardadas por categoría</li>
                <li><strong>Copiar al portapapeles</strong>: Botón para copiar imagen compuesta y pegarla directamente en chat de IA</li>
              </ul>
            </div>

            {/* Recomendaciones Inteligentes */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                💡 Recomendaciones Inteligentes por Categoría
              </h4>
              <p className="text-sm text-d4-text mb-2">
                El sistema ahora muestra recomendaciones específicas sobre cantidad de elementos por imagen:
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Habilidades</strong>: Máximo 3-4 por imagen (alta complejidad de atributos)</li>
                <li><strong>Glifos</strong>: Máximo 5-6 por imagen (complejidad media)</li>
                <li><strong>Aspectos</strong>: Máximo 4-5 por imagen (incluye keywords y tags)</li>
                <li><strong>Estadísticas</strong>: 1 imagen completa con todas las pestañas verticales</li>
              </ul>
              <p className="text-xs text-d4-text-dim mt-2 bg-d4-surface p-2 rounded">
                🎯 <strong>Beneficio</strong>: Evita saturar el contexto de la IA y mejora la precisión de la extracción JSON
              </p>
            </div>

            {/* Generación de Prompts IA */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                🤖 Generación de Prompts para IA
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Prompts reutilizables</strong>: Usa los mismos prompts de extracción que las secciones de personajes/héroes</li>
                <li><strong>Por categoría</strong>: Genera el prompt correcto según el tipo de datos (skills, glifos, aspectos, estadísticas)</li>
                <li><strong>Cantidad de elementos incluida</strong>: Al final del prompt se agrega automáticamente la cantidad de elementos detectados en la imagen
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>Ejemplo: "Esta imagen contiene aproximadamente 3 habilidades. Asegúrate de extraer TODOS los elementos"</li>
                    <li>Mejora significativamente la precisión de la extracción</li>
                  </ul>
                </li>
                <li><strong>Copiar con un click</strong>: Botón para copiar prompt al portapapeles</li>
                <li><strong>Integración completa</strong>: Compatible con el sistema de tags estructurados (V2)</li>
              </ul>
            </div>

            {/* UX Mejorada */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-yellow-300 mb-2">
                ✨ Mejoras de UX (Diseño Minimalista)
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Modal tabbed</strong>: 3 tabs (Captura | Prompt IA | Galería)</li>
                <li><strong>Preview prominente</strong>: La imagen compuesta se muestra PRIMERO y en grande, siempre visible
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>Reordenado: Preview → Controles → Lista de capturas</li>
                    <li>Tooltip de instrucciones (icono ?) en lugar de panel expandido</li>
                  </ul>
                </li>
                <li><strong>Barra de progreso minimalista</strong>: Ubicada al lado derecho de las pestañas
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>Compacta: Muestra "3/4" + barra visual</li>
                    <li>Tooltip con recomendaciones completas al hacer hover</li>
                    <li>Colores: 🟢 Óptimo | 🟡 Riesgo | 🔴 Excedido</li>
                    <li>Solo visible en tab "Captura"</li>
                  </ul>
                </li>
                <li><strong>3 Botones horizontales de captura</strong>:
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>🟢 Nuevo Elemento (horizontal)</li>
                    <li>🟣 Completar (vertical)</li>
                    <li>🔵 Copiar Guardada (última imagen de la categoría)</li>
                    <li>Todos a la misma altura, sin thumbnail visible</li>
                    <li>Botón "Copiar Guardada" se activa solo cuando hay imágenes guardadas</li>
                  </ul>
                </li>
                <li><strong>Carga automática de última imagen</strong>: Al cambiar de categoría se carga automáticamente la última imagen guardada</li>
                <li><strong>Toast notifications</strong>: Mensajes no invasivos en lugar de alerts
                  <ul className="ml-4 mt-1 text-xs text-d4-text-dim">
                    <li>✅ Verde: Guardado exitoso con ruta del archivo</li>
                    <li>❌ Rojo: Errores con descripción</li>
                    <li>Auto-desaparece en 5 segundos</li>
                  </ul>
                </li>
                <li><strong>Contador en pestañas</strong>: Cada categoría muestra cantidad de imágenes guardadas (ej: "Galería (5)")</li>
                <li><strong>Botón Copiar en galería</strong>: Icono de copiar al hacer hover sobre cada imagen guardada</li>
                <li><strong>Botón destacado</strong>: Nuevo botón "Captura" en el sidebar con gradiente Purple/Blue</li>
                <li><strong>Feedback visual mejorado</strong>: Lista de imágenes capturadas con thumbnails y estado</li>
              </ul>
            </div>

            {/* Workflow mejorado */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">
                🎯 Workflow Optimizado (Diseño Minimalista)
              </h4>
              <p className="text-sm text-d4-text mb-2">
                El nuevo flujo minimalista enfoca en lo esencial:
              </p>
              <ol className="text-sm text-d4-text space-y-2 ml-4 list-decimal">
                <li><strong>Preview grande</strong>: Lo primero que ves, actualización en tiempo real</li>
                <li><strong>Barra de progreso compacta</strong>: Al lado de las pestañas (hover para detalles)</li>
                <li><strong>3 botones de captura</strong>: Nuevo | Completar | Copiar Guardada</li>
                <li><strong>Captura rápida</strong>: Win + Shift + S → Ctrl + V</li>
                <li><strong>Guardar</strong>: Botón "Guardar Imagen Acumulada" (toast de confirmación)</li>
                <li><strong>Reutilizar última</strong>: Botón "Copiar Guardada" para usar imagen anterior</li>
                <li><strong>Prompt con contexto</strong>: Tab "Prompt IA" incluye cantidad de elementos</li>
                <li><strong>Usar en IA</strong>: Copiar imagen → Pegar en chat + Copiar prompt → Pegar</li>
              </ol>
              <p className="text-xs text-d4-text-dim mt-3 bg-d4-surface p-2 rounded">
                💡 <strong>Beneficio principal</strong>: Interfaz más limpia y rápida. Todo lo importante visible de inmediato, detalles en tooltips al hacer hover.
              </p>
            </div>

            {/* Servicios y Arquitectura */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-orange-300 mb-2">
                🔧 Nuevos Servicios
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>ImageService</strong>: Gestión de almacenamiento de imágenes en FileSystem API
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>saveImage(): Guarda imagen con timestamp automático</li>
                    <li>listImages(): Carga galería por categoría</li>
                    <li>deleteImage(): Elimina imágenes</li>
                    <li>ensureImgFolder(): Crea estructura de carpetas automáticamente</li>
                  </ul>
                </li>
                <li><strong>Canvas API</strong>: Composición de múltiples imágenes en una sola
                  <ul className="ml-4 mt-1 space-y-0.5 text-xs text-d4-text-dim">
                    <li>Espaciado inteligente entre elementos</li>
                    <li>Sin espacio entre partes de un mismo elemento</li>
                    <li>Fondo blanco automático</li>
                    <li>Exportación en PNG de alta calidad</li>
                  </ul>
                </li>
                <li><strong>Clipboard API</strong>: Copiar imagen compuesta al portapapeles para usar en chats de IA</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.13.1 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.13.1</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-red-600/20 to-orange-600/20 text-red-400 px-2 py-1 rounded">Corrección Crítica</span>
          </div>

          <div className="space-y-4">
            {/* Corrección de Tags */}
            <div className="bg-d4-bg border-l-4 border-red-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                🐛 Tags No Mostraban Información
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Problema identificado</strong>: TagService.getTagById() buscaba por ID único, pero los datos almacenan tags como strings normalizados ("golpe_critico")</li>
                <li><strong>Solución</strong>: Método ahora busca primero por ID, luego por tag normalizado</li>
                <li><strong>Resultado</strong>: Tooltips ahora muestran correctamente significado, jugabilidad y categoría</li>
              </ul>
            </div>

            {/* Tags por Defecto */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                ✨ Tags por Defecto Inicializados
              </h4>
              <p className="text-sm text-d4-text mb-2">
                Si no existe <code className="bg-d4-surface px-1 rounded">tags.json</code>, se crean automáticamente 14 tags comunes de Diablo 4:
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Atributos</strong>: Inteligencia, Voluntad, Fuerza, Destreza</li>
                <li><strong>Control</strong>: Helados, Congelados, Aturdidos, Control de Multitudes</li>
                <li><strong>Estados</strong>: Saludable, Daño, Sanación</li>
                <li><strong>Críticos</strong>: Golpe Crítico, Probabilidad de Golpe Crítico, Daño de Golpe Crítico</li>
              </ul>
              <p className="text-xs text-d4-text-dim mt-2">
                💡 Cada tag incluye: significado detallado, descripción de jugabilidad, sinónimos y categoría
              </p>
            </div>

            {/* Mejoras de Debugging */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">
                🔍 Mejor Logging
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li>Mensajes con emojis para fácil identificación en consola</li>
                <li>✅ Tags cargados desde archivo</li>
                <li>⚠️ Tags.json no existe, creando por defecto</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.13 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.13</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-300 px-2 py-1 rounded">Optimización</span>
          </div>

          <div className="space-y-4">
            {/* Mejoras de Performance */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                ⚡ Mejoras de Performance en Tags
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Componente TagTooltip memoizado</strong>: Evita re-renders innecesarios con React.memo</li>
                <li><strong>Carga lazy de datos</strong>: Los tags se cargan solo cuando existen (useMemo)</li>
                <li><strong>Debouncing de 150ms</strong>: Evita tooltips flash al pasar el mouse rápidamente</li>
                <li><strong>Limpieza de timeouts</strong>: useEffect cleanup para evitar memory leaks</li>
                <li><strong>Animación fade-in suave</strong>: Transición fluida de 200ms al mostrar tooltips</li>
              </ul>
            </div>

            {/* Nuevo Componente TagBadge */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                ✨ Nuevo Componente: TagBadge
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Badge integrado con tooltip</strong>: Componente unificado para mostrar tags</li>
                <li><strong>Efecto de brillo</strong>: Tags con descripción brillan sutilmente</li>
                <li><strong>Visual distintivo</strong>: 
                  <ul className="ml-4 mt-1 space-y-0.5">
                    <li>Tags con descripción: Borde dorado + sombra brillante + hover mejorado</li>
                    <li>Tags sin descripción: Estilo estándar sin efectos</li>
                  </ul>
                </li>
                <li><strong>Memoización inteligente</strong>: Evita cálculos redundantes con useMemo</li>
                <li><strong>Props configurables</strong>: textSize, iconSize, showIcon, className</li>
              </ul>
            </div>

            {/* Tooltips Mejorados */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                📖 Tooltips con Más Información
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>Badge "✨ Con descripción"</strong>: Indicador visual en el header del tooltip</li>
                <li><strong>Significado resaltado</strong>: Fondo dorado suave + borde lateral izquierdo</li>
                <li><strong>Jugabilidad resaltada</strong>: Fondo púrpura suave + borde lateral izquierdo</li>
                <li><strong>Icono con brillo</strong>: El icono Info brilla si el tag tiene descripción</li>
                <li><strong>Borde destacado</strong>: Tooltips con descripción usan borde más brillante</li>
              </ul>
            </div>

            {/* Efectos CSS Nuevos */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-yellow-300 mb-2 flex items-center gap-2">
                🎨 Nuevos Efectos Visuales (CSS)
              </h4>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>shadow-glow-subtle</strong>: Brillo suave dorado (8px + 4px)</li>
                <li><strong>shadow-glow-medium</strong>: Brillo medio con inset (12px + 6px + 4px)</li>
                <li><strong>animate-fade-in</strong>: Animación de entrada 200ms con translateY</li>
                <li><strong>Transiciones suaves</strong>: duration-200/300 en todos los efectos hover</li>
              </ul>
            </div>

            {/* Refactorización */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="text-sm font-semibold text-green-300 mb-2">
                🔄 Refactorización de Código
              </h4>
              <p className="text-sm text-d4-text mb-2">
                Todos los componentes de personaje ahora usan <code className="bg-d4-surface px-1 rounded">TagBadge</code> en lugar de renderizar tags manualmente:
              </p>
              <ul className="text-sm text-d4-text space-y-1 ml-4 list-disc">
                <li><strong>CharacterSkills</strong>: Habilidades activas + Modificadores</li>
                <li><strong>CharacterGlyphs</strong>: Tags de glifos</li>
                <li><strong>CharacterAspects</strong>: Tags de aspectos</li>
                <li><strong>StatField</strong>: Tags en tooltip de estadísticas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.12.1 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.12.1</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-red-600/20 to-orange-600/20 text-red-400 px-2 py-1 rounded">Corrección de Errores</span>
          </div>

          <div className="space-y-4">
            {/* Correcciones */}
            <div className="bg-d4-bg border-l-4 border-red-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🐛 Errores Corregidos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Tags como objetos:</strong> Solucionado error al renderizar tags que venían como objetos completos en lugar de IDs</li>
                <li>• <strong>TypeScript:</strong> Agregado type assertion para manejar tags flexibles (string | objeto)</li>
                <li>• <strong>Aspectos no encontrados:</strong> Mejorado manejo de error cuando no hay aspectos disponibles para una clase</li>
                <li>• <strong>React rendering:</strong> Solucionado "Objects are not valid as a React child"</li>
              </ul>
            </div>

            {/* Soporte flexible */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔧 Manejo Robusto de Tags</h4>
              <p className="text-sm text-d4-text-dim mb-2">Ahora el sistema acepta tags en múltiples formatos:</p>
              <ul className="space-y-1 text-sm text-d4-text-dim font-mono">
                <li>• <span className="text-orange-400">String simple</span>: "golpe_critico"</li>
                <li>• <span className="text-orange-400">Objeto completo</span>: {`{tag: "golpe_critico", texto_original: "...", ...}`}</li>
                <li>• <span className="text-orange-400">Extracción automática</span>: Detecta y extrae el ID correcto en ambos casos</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.12 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.12</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-400 px-2 py-1 rounded">Tooltips de Tags Integrados</span>
          </div>

          <div className="space-y-4">
            {/* Integración completa */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔍 TagTooltip en Todos los Componentes</h4>
              <p className="text-sm text-d4-text-dim mb-2">Ahora puedes ver el significado de cada palabra clave (tag) directamente en la interfaz:</p>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>CharacterSkills:</strong> Tags visibles en habilidades y modificadores con icono Info</li>
                <li>• <strong>CharacterGlyphs:</strong> Tags visibles en cada glifo equipado</li>
                <li>• <strong>CharacterAspects:</strong> Tags visibles en aspectos equipados</li>
                <li>• <strong>CharacterStats:</strong> Tags visibles en los detalles de cada estadística</li>
                <li>• <strong>Hover interactivo:</strong> Al pasar el mouse sobre el icono Info se muestra el tooltip completo</li>
              </ul>
            </div>

            {/* Información mostrada */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📊 Información del Tag Tooltip</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim font-mono">
                <li>• <span className="text-cyan-400">Nombre</span>: Texto original del tag</li>
                <li>• <span className="text-cyan-400">Significado</span>: Descripción completa del término</li>
                <li>• <span className="text-cyan-400">Categoría</span>: Tipo (atributo, mecánica, condición, etc.)</li>
                <li>• <span className="text-cyan-400">Origen</span>: Fuente del tag (tooltip, habilidad, glifo, etc.)</li>
                <li>• <span className="text-cyan-400">Estado</span>: Indica si requiere revisión</li>
              </ul>
            </div>

            {/* Experiencia mejorada */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Experiencia de Usuario</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Acceso instantáneo a definiciones de términos del juego</li>
                <li>• Colores por categoría para identificación rápida</li>
                <li>• Auto-posicionamiento del tooltip (arriba/abajo según espacio)</li>
                <li>• No requiere abrir modales ni navegar a otras secciones</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.11 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.11</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 px-2 py-1 rounded">Coherencia en Prompts IA</span>
          </div>

          <div className="space-y-4">
            {/* Estandarización */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎯 Estructura Unificada de Tags</h4>
              <p className="text-sm text-d4-text-dim mb-2">Todos los prompts ahora usan el mismo formato para palabras_clave:</p>
              <ul className="space-y-1 text-sm text-d4-text-dim font-mono">
                <li>• <span className="text-purple-400">tag</span>: Identificador normalizado (snake_case)</li>
                <li>• <span className="text-purple-400">texto_original</span>: Como aparece en el juego</li>
                <li>• <span className="text-purple-400">significado</span>: Definición del tooltip (null si no disponible)</li>
                <li>• <span className="text-purple-400">categoria</span>: atributo | mecanica | condicion | etc</li>
                <li>• <span className="text-purple-400">fuente</span>: tooltip | habilidad | glifo | aspecto | estadistica</li>
              </ul>
            </div>

            {/* Prompts actualizados */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📋 Prompts Modernizados</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>generateStatsPrompt():</strong> Estructura actualizada (tag, texto_original, significado)</li>
                <li>• <strong>generateStatsPromptV2():</strong> Simplificado, eliminados campos extras</li>
                <li>• <strong>Eliminados:</strong> "palabra", "descripcion", "origen", "pendiente_revision", "sinonimos"</li>
                <li>• <strong>Ejemplos:</strong> Actualizados con formato consistente</li>
              </ul>
            </div>

            {/* Beneficios */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💡 Ventajas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Importaciones más predecibles en todos los tipos de datos</li>
                <li>• TagLinkingService optimizado para formato único</li>
                <li>• Menor posibilidad de errores de parsing</li>
                <li>• Documentación clara para análisis con IA</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.10 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.10</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-green-400 px-2 py-1 rounded">Vinculación Automática de Tags</span>
          </div>

          <div className="space-y-4">
            {/* TagLinkingService */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔗 TagLinkingService (Nuevo)</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Servicio centralizado:</strong> Procesa palabras_clave y vincula tags automáticamente</li>
                <li>• <strong>processAndMapTags():</strong> Procesa Tag[] y retorna Map&lt;string, string&gt; (tag_normalizado → tag_id)</li>
                <li>• <strong>linkTagsToIds():</strong> Convierte array de strings a array de IDs usando el mapa</li>
                <li>• <strong>linkSkillTags():</strong> Vincula tags en habilidades (skill, modificadores, efectos, pasiva, activa)</li>
                <li>• <strong>linkGlyphTags():</strong> Vincula tags en glifos</li>
                <li>• <strong>linkAspectTags():</strong> Vincula tags en aspectos</li>
                <li>• <strong>processAndLinkAllTags():</strong> Método todo-en-uno para procesar y vincular en un solo paso</li>
              </ul>
            </div>

            {/* Integración en componentes */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">⚡ Componentes Actualizados</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>CharacterSkills:</strong> Tags vinculados automáticamente al importar JSON</li>
                <li>• <strong>CharacterGlyphs:</strong> Tags vinculados en glifos durante importación</li>
                <li>• <strong>CharacterAspects:</strong> Tags vinculados en aspectos durante importación</li>
                <li>• <strong>Flujo unificado:</strong> Todos los componentes usan TagLinkingService</li>
                <li>• <strong>Sin código duplicado:</strong> Lógica centralizada de vinculación</li>
              </ul>
            </div>

            {/* Flujo de importación */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📥 Flujo de Importación Mejorado</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Paso 1:</strong> Usuario importa JSON con palabras_clave globales</li>
                <li>• <strong>Paso 2:</strong> TagLinkingService procesa palabras_clave → guarda en tags.json → obtiene IDs</li>
                <li>• <strong>Paso 3:</strong> Crea mapa tag_normalizado → tag_id</li>
                <li>• <strong>Paso 4:</strong> Vincula arrays tags: string[] en objetos con IDs correspondientes</li>
                <li>• <strong>Paso 5:</strong> Guarda objetos con tags IDs en archivos del héroe</li>
                <li>• <strong>Resultado:</strong> Tags completamente vinculados y listos para tooltips</li>
              </ul>
            </div>

            {/* Beneficios */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Beneficios del Sistema</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Automático:</strong> No requiere intervención manual para vincular tags</li>
                <li>• <strong>Centralizado:</strong> Un solo repositorio global de tags (tags.json)</li>
                <li>• <strong>Consistente:</strong> Mismo flujo para habilidades, glifos, aspectos y stats</li>
                <li>• <strong>Escalable:</strong> Fácil agregar tooltips en cualquier componente</li>
                <li>• <strong>Búsqueda eficiente:</strong> IDs permiten lookups O(1) en TagService</li>
                <li>• <strong>Sin duplicación:</strong> Tags compartidos entre múltiples objetos usan mismo ID</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.9 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.9</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-400 px-2 py-1 rounded">Tags Manager & Sistema de Tooltips</span>
          </div>

          <div className="space-y-4">
            {/* Gestor de Tags */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🏷️ Gestor de Tags (Nueva Sección)</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Vista completa de tags:</strong> Gestión centralizada de todas las palabras clave del workspace</li>
                <li>• <strong>Filtros avanzados:</strong> Por categoría (atributo, efecto, condición, recurso, mecánica, tipo_de_daño, defensivo), origen y pendientes</li>
                <li>• <strong>Búsqueda inteligente:</strong> Por nombre normalizado, texto original, significado o sinónimos</li>
                <li>• <strong>CRUD completo:</strong> Crear, editar y eliminar tags manualmente</li>
                <li>• <strong>Estadísticas visuales:</strong> Total de tags, pendientes de revisión y filtrados</li>
                <li>• <strong>Categorización por colores:</strong> Identificación visual rápida por tipo</li>
              </ul>
            </div>

            {/* Sistema de Tooltips */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💡 Componentes de Tooltips</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>TagTooltip:</strong> Icono de información con popup hover mostrando detalles completos del tag</li>
                <li>• <strong>TagTooltipInline:</strong> Variante para texto clickable con tooltip integrado</li>
                <li>• <strong>Información mostrada:</strong> Nombre, significado, categoría, sinónimos, origen y estado de revisión</li>
                <li>• <strong>Posicionamiento inteligente:</strong> Auto-ajuste arriba/abajo según espacio disponible</li>
                <li>• <strong>Listos para integración:</strong> Preparados para usarse en Skills, Glyphs, Aspects y Stats</li>
              </ul>
            </div>

            {/* Mejoras UX */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Mejoras de Experiencia</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Navegación mejorada:</strong> Nueva opción "Tags" en el menú lateral</li>
                <li>• <strong>Edición inline:</strong> Editar tags directamente en la lista sin modales adicionales</li>
                <li>• <strong>Confirmación de eliminación:</strong> Modal de confirmación antes de borrar tags</li>
                <li>• <strong>Indicadores visuales:</strong> Tags pendientes de revisión destacados con icono de alerta</li>
                <li>• <strong>Timestamps:</strong> Fechas de creación y última actualización por tag</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.8 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.8</h3>
            <span className="text-xs text-d4-text-dim bg-gradient-to-r from-red-600/20 to-orange-600/20 text-red-400 px-2 py-1 rounded">Aspectos en Personajes</span>
          </div>

          <div className="space-y-4">
            {/* Aspectos en Personajes */}
            <div className="bg-d4-bg border-l-4 border-red-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔮 Gestión de Aspectos (Nueva Sección)</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Nueva sección en personajes:</strong> CharacterAspects integrado en CharacterDetail</li>
                <li>• <strong>Importación desde JSON:</strong> Importar aspectos equipados con nivel, slot y valores actuales</li>
                <li>• <strong>Agregar desde héroe:</strong> Modal para seleccionar aspectos del pool del héroe</li>
                <li>• <strong>Edición de nivel y slot:</strong> Input numérico para nivel (X/21) y selector de slot equipado</li>
                <li>• <strong>Valores dependientes de nivel:</strong> Captura de valores_actuales escalados por nivel</li>
                <li>• <strong>Categorización por color:</strong> Ofensivo (rojo), Defensivo (azul), Recurso (verde), Utilidad (morado), Movilidad (amarillo)</li>
              </ul>
            </div>

            {/* Prompt para Aspectos */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🤖 Prompt IA para Aspectos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>generateCharacterAspectsPrompt():</strong> Nuevo método en ImageExtractionPromptService</li>
                <li>• <strong>Extracción inteligente:</strong> Instrucciones para extraer aspecto_id, nivel_actual, slot y valores_actuales</li>
                <li>• <strong>Formato normalizado:</strong> IDs en snake_case (ej: "aspecto_recursos_abundantes")</li>
                <li>• <strong>Valores escalados:</strong> Captura solo los valores numéricos actuales según el nivel</li>
                <li>• <strong>Ejemplos detallados:</strong> +140 líneas de instrucciones y casos de uso</li>
              </ul>
            </div>

            {/* Tipos Mejorados */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📝 Tipos para Aspectos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Personaje.aspectos_refs:</strong> Array con aspecto_id, nivel_actual, slot_equipado, valores_actuales</li>
                <li>• <strong>nivel_actual:</strong> String formato "X/21" (ej: "15/21")</li>
                <li>• <strong>valores_actuales:</strong> Record&lt;string, string&gt; con valores específicos del nivel</li>
                <li>• <strong>Retrocompatibilidad:</strong> Soporta string[] para aspectos sin detalles</li>
                <li>• <strong>Aspecto mejorado:</strong> Ahora con keywords y tags para búsqueda avanzada</li>
              </ul>
            </div>

            {/* UI Mejorada */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🎨 Interfaz de Aspectos</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Vista por categorías:</strong> Aspectos agrupados y coloreados por tipo</li>
                <li>• <strong>Detalles expandidos:</strong> Efecto completo, valores actuales y slot equipado</li>
                <li>• <strong>Importación dual:</strong> Archivo JSON o pegar texto en textarea</li>
                <li>• <strong>Botón de prompt:</strong> Copiar instrucciones para IA con un click</li>
                <li>• <strong>Sección colapsable:</strong> Ocultar/mostrar aspectos como las demás secciones</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Version 0.3.7 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.3.7</h3>
            <span className="text-xs text-d4-text-dim bg-purple-600/20 text-purple-400 px-2 py-1 rounded">Modelo de Referencias para Estadísticas</span>
          </div>

          <div className="space-y-4">
            {/* Sistema de Referencias para Estadísticas */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📊 Estadísticas como Datos Maestros del Héroe</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Modelo centralizado:</strong> Las estadísticas ahora se guardan en el héroe (heroes/{`{clase}_estadisticas.json`})</li>
                <li>• <strong>Referencias en personajes:</strong> El personaje solo guarda IDs y valores (`estadisticas_refs`)</li>
                <li>• <strong>Sin duplicación:</strong> Igual que skills y glifos, evita repetir definiciones</li>
                <li>• <strong>Actualización centralizada:</strong> Cambios en el héroe se reflejan en todos los personajes</li>
                <li>• <strong>Menor tamaño de archivos:</strong> JSON de personajes más ligeros</li>
              </ul>
            </div>

            {/* EstadisticaHeroe & Conversión Automática */}
            <div className="bg-d4-bg border-l-4 border-blue-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔄 Conversión Automática al Importar</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>StatsConversionService:</strong> Convierte automáticamente estadísticas anidadas a individuales con IDs</li>
                <li>• <strong>EstadisticaHeroe:</strong> Cada estadística tiene `id`, `nombre`, `categoria`, `tipo_valor`, `tags`</li>
                <li>• <strong>Auto-guardado doble:</strong> Mantiene formato viejo (`estadisticas`) + nuevo (`estadisticas_refs`)</li>
                <li>• <strong>Compatibilidad hacia atrás:</strong> El formato antiguo sigue funcionando</li>
                <li>• <strong>Merge inteligente:</strong> Solo agrega estadísticas nuevas sin duplicar</li>
              </ul>
            </div>

            {/* WorkspaceService Actualizado */}
            <div className="bg-d4-bg border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">💾 API de Workspace para Estadísticas</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>saveHeroStats(clase, estadisticas):</strong> Guarda estadísticas en archivo del héroe</li>
                <li>• <strong>loadHeroStats(clase):</strong> Carga estadísticas desde archivo del héroe</li>
                <li>• <strong>Formato:</strong> `heroes/{`{clase}_estadisticas.json`}`</li>
                <li>• <strong>Estructura:</strong> {`{estadisticas: EstadisticaHeroe[]}`}</li>
              </ul>
            </div>

            {/* Flujo de Importación Actualizado */}
            <div className="bg-d4-bg border-l-4 border-yellow-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">⚡ Mejoras en CharacterStats</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Importación mejora da:</strong> Al importar JSON, crea referencias automáticamente</li>
                <li>• <strong>onChange ampliado:</strong> Acepta cuarto parámetro `statsRefs` opcional</li>
                <li>• <strong>Mensaje detallado:</strong> "X tags procesados, Y estadísticas guardadas en héroe"</li>
                <li>• <strong>handleStatsChange:</strong> Guarda tanto `estadisticas` como `estadisticas_refs`</li>
                <li>• <strong>Auto-save mejorado:</strong> Persiste referencias inmediatamente al importar</li>
              </ul>
            </div>

            {/* Tipos Actualizados */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">📝 Nuevos Tipos TypeScript</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>EstadisticaHeroe:</strong> {`{id, nombre, categoria, tipo_valor, descripcion?, unidad?, tags?, subcategoria?}`}</li>
                <li>• <strong>EstadisticasHeroe:</strong> {`{estadisticas: EstadisticaHeroe[]}`}</li>
                <li>• <strong>Personaje.estadisticas_refs:</strong> {`Array<{stat_id, valor}>`}</li>
                <li>• <strong>@deprecated:</strong> `Personaje.estadisticas` marcado como deprecated (seguirá funcionando)</li>
                <li>• <strong>Categorías:</strong> personaje | atributosBase | defensivo | ofensivo | utilidad | jcj | moneda | armaduraYResistencias</li>
              </ul>
            </div>

            {/* Migración Gradual */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔄 Estrategia de Migración</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Fase actual (0.3.7):</strong> Ambos formatos coexisten - datos se guardan en ambos</li>
                <li>• <strong>Compatibilidad total:</strong> Personajes viejos funcionan sin modificación</li>
                <li>• <strong>Referencias automáticas:</strong> Al importar/editar, se crean referencias</li>
                <li>• <strong>Sin ruptura:</strong> La UI actual de CharacterStats sigue funcionando igual</li>
                <li>• <strong>Próxima fase (0.3.8):</strong> Refactorizar UI para trabajar solo con referencias</li>
              </ul>
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
