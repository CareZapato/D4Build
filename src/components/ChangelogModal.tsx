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
                <p className="text-d4-text font-semibold">20 de Marzo, 2026</p>
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

        {/* Version 0.1.1 */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-3">
            <h3 className="text-xl font-bold text-d4-accent">Versión 0.1.1</h3>
            <span className="text-xs text-d4-text-dim">Correcciones y Mejoras</span>
          </div>

          <div className="space-y-4">
            {/* Sistema de Aspectos Mejorado */}
            <div className="bg-d4-bg border-l-4 border-purple-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🔧 Sistema de Aspectos Mejorado</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• <strong>Corrección crítica:</strong> Los aspectos ahora se visualizan correctamente</li>
                <li>• <strong>Compatibilidad de formatos:</strong> Soporte para formato antiguo (nombre/categoria/descripcion) y nuevo (name/category/effect)</li>
                <li>• <strong>Normalización automática:</strong> Conversión transparente entre formatos</li>
                <li>• <strong>Sistema de paginación:</strong> Navega entre aspectos con controles intuitivos</li>
                <li>• Selector de items por página: 5, 10, 20, 50 o 100 aspectos</li>
                <li>• Navegación con botones: Primera, Anterior, Siguiente, Última</li>
                <li>• Contador de páginas con resaltado de página actual</li>
                <li>• Auto-scroll al cambiar de página para mejor experiencia</li>
              </ul>
            </div>

            {/* Correcciones Técnicas */}
            <div className="bg-d4-bg border-l-4 border-orange-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">🐛 Correcciones</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Arreglado: Aspectos importados no se mostraban en la interfaz</li>
                <li>• Arreglado: Prop types incorrectos entre HeroAspects y HeroManager</li>
                <li>• Arreglado: Categorías en mayúsculas no se reconocían</li>
                <li>• Mejorado: Manejo de errores en importación de aspectos</li>
                <li>• Mejorado: Estado de carga sincronizado correctamente</li>
              </ul>
            </div>

            {/* Mejoras de UI/UX */}
            <div className="bg-d4-bg border-l-4 border-cyan-500 p-4 rounded">
              <h4 className="font-semibold text-d4-text mb-2">✨ Mejoras de Interfaz</h4>
              <ul className="space-y-1 text-sm text-d4-text-dim">
                <li>• Header reorganizado con información de paginación</li>
                <li>• Contador de aspectos: "Mostrando: 1-10 de 45"</li>
                <li>• Controles de navegación intuitivos con iconos</li>
                <li>• Paginación solo visible cuando hay múltiples páginas</li>
                <li>• Reset automático a página 1 al cambiar filtros</li>
                <li>• Mejor feedback visual en estados de carga</li>
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
