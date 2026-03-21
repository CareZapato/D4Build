import { createContext, useContext, useState, ReactNode } from 'react';
import { Personaje, WorkspaceConfig } from '../types';

/**
 * AppContext - Contexto global de la aplicación D4Builds
 * 
 * PROPÓSITO:
 * Gestionar el estado global de la aplicación, incluyendo workspace, personajes,
 * y toda la información relacionada con los builds de Diablo 4.
 * 
 * SECCIONES Y DEFINICIONES:
 * 
 * 1. WORKSPACE
 *    - Directorio seleccionado por el usuario donde se guardan todos los datos
 *    - Estructura: workspace_root/heroes/ y workspace_root/personajes/
 *    - Usa File System Access API para acceso local
 * 
 * 2. HÉROES (Clases Base)
 *    - Contiene la información maestra de cada clase de Diablo 4
 *    - Clases disponibles: Paladín, Bárbaro, Hechicero, Pícaro, Druida, Nigromante, Espiritista
 *    - Datos por clase:
 *      a) Habilidades (heroes/{clase}_habilidades.json):
 *         - habilidades_activas: Skills que se activan manualmente
 *         - habilidades_pasivas: Bonificaciones permanentes
 *      b) Glifos (heroes/{clase}_glifos.json):
 *         - Glifos del tablero Paragon
 *         - Rareza: Común, Raro, Legendario
 * 
 * 3. PERSONAJES (Instancias de Builds)
 *    - Builds específicos creados por el usuario
 *    - Almacenados en: personajes/{id}.json
 *    - Propiedades:
 *      a) Información General:
 *         - id: Identificador único
 *         - nombre: Nombre del build
 *         - clase: Clase del héroe (referencia a héroes)
 *         - nivel: Nivel base (1-60)
 *         - nivel_paragon: Nivel Paragon (0-200)
 *         - notas: Descripción del build
 *      b) Habilidades:
 *         - Enlazadas con el héroe por ID
 *         - Pueden agregarse manualmente, desde héroe, o vía JSON
 *         - Sincronización automática: personaje → héroe
 *      c) Glifos:
 *         - Heredan del héroe pero con nivel_actual específico
 *         - Sincronización: al guardar personaje, nuevos glifos se agregan al héroe
 *      d) Estadísticas:
 *         - 15 atributos: vida, armadura, stats principales, resistencias, crítico
 *         - Importables vía JSON o entrada manual
 * 
 * 4. GENERADOR DE PROMPTS
 *    - Crea prompts enriquecidos para consultas con IA
 *    - Modos:
 *      a) Análisis de Sinergias: Busca combinaciones efectivas
 *      b) Optimización: Sugiere mejoras al build
 *      c) Pregunta Personalizada: Query libre con contexto del build
 * 
 * 5. SINCRONIZACIÓN
 *    - Flujo bidireccional entre Héroe ↔ Personaje
 *    - Al guardar personaje:
 *      a) Skills nuevas se agregan al héroe (sin duplicar)
 *      b) Glifos nuevos se agregan al héroe (sin nivel_actual)
 *    - Al crear desde héroe:
 *      a) Skills se copian con su ID de referencia
 *      b) Glifos se copian con nivel_actual = 1
 * 
 * 6. FORMATOS DE IMPORTACIÓN/EXPORTACIÓN
 *    - Todos los componentes soportan:
 *      a) Subir archivo JSON
 *      b) Pegar JSON en textarea
 *      c) Crear manualmente con formularios
 *    - Formatos JSON:
 *      - Habilidades: {habilidades_activas: [], habilidades_pasivas: []}
 *      - Glifos: {glifos: []}
 *      - Estadísticas: {vida_maxima: number, armadura: number, ...}
 */

interface AppContextType {
  // Estado del workspace
  workspaceLoaded: boolean;
  workspaceConfig: WorkspaceConfig | null;
  setWorkspaceLoaded: (loaded: boolean) => void;
  setWorkspaceConfig: (config: WorkspaceConfig | null) => void;

  // Personajes
  personajes: Personaje[];
  selectedPersonaje: Personaje | null;
  setPersonajes: (personajes: Personaje[]) => void;
  setSelectedPersonaje: (personaje: Personaje | null) => void;

  // Clases disponibles
  availableClasses: string[];
  
  // Métodos de utilidad
  refreshPersonajes: () => Promise<void>;
  getPersonajeById: (id: string) => Personaje | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig | null>(null);
  const [personajes, setPersonajes] = useState<Personaje[]>([]);
  const [selectedPersonaje, setSelectedPersonaje] = useState<Personaje | null>(null);

  const availableClasses = [
    'Paladín',
    'Bárbaro', 
    'Hechicero',
    'Pícaro',
    'Druida',
    'Nigromante',
    'Espiritista'
  ];

  const refreshPersonajes = async () => {
    // Esta función será implementada para recargar personajes desde el workspace
    console.log('Refreshing personajes...');
  };

  const getPersonajeById = (id: string): Personaje | undefined => {
    return personajes.find(p => p.id === id);
  };

  const value: AppContextType = {
    workspaceLoaded,
    workspaceConfig,
    setWorkspaceLoaded,
    setWorkspaceConfig,
    personajes,
    selectedPersonaje,
    setPersonajes,
    setSelectedPersonaje,
    availableClasses,
    refreshPersonajes,
    getPersonajeById,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext debe ser usado dentro de un AppProvider');
  }
  return context;
};

export default AppContext;
