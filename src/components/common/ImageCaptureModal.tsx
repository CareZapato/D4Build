import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Plus, ArrowDown, Save, Image as ImageIcon, Trash2, Copy, Download, CheckCircle, AlertCircle, XCircle, Zap, Eye, FileJson, Play, PlayCircle, Maximize2, FileText, Swords, Hexagon, Gem, BarChart3, Grid3x3, ChevronDown, ChevronUp, Edit2, Sparkles, Shield, Lock, MapPin, Filter, User, ArrowRight } from 'lucide-react';
import { ImageCategory, ImageService } from '../../services/ImageService';
import type { GalleryEntry, JSONMetadata } from '../../services/ImageService';
import { MAX_GLYPH_LEVEL } from '../../config/constants';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import { TagLinkingService } from '../../services/TagLinkingService';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceService } from '../../services/WorkspaceService';
import { GeminiService } from '../../services/GeminiService';
import { OpenAIService } from '../../services/OpenAIService';
import { BillingService } from '../../services/BillingService';
import ImportResultsModal, { ImportResultDetails } from './ImportResultsModal';
import ImageViewerModal from './ImageViewerModal';
import EmptyImportWarningModal from './EmptyImportWarningModal';
import PersonajeRestoreModal from './PersonajeRestoreModal';
import { validateJSONByCategory } from '../../utils/jsonValidation';
import type { Personaje } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type GalleryImage = { 
  nombre: string; 
  url: string; 
  fecha: string; 
  hasJSON?: boolean; 
  isJSONOnly?: boolean;
  metadata?: JSONMetadata;
};

interface CapturedImage {
  id: string;
  blob: Blob;
  url: string;
  isComplete: boolean; // true = elemento completado, false = parte incompleta del elemento anterior
}

type CaptureMode = 'new' | 'continue';

// Estructura jerárquica para Paragon
type ParagonType = 'tablero' | 'nodo' | 'atributos';

// Estructura jerárquica para Mundo
type MundoType = 'eventos' | 'mazmorras_aspectos';

// Estructura jerárquica para Talismanes (Temporada 13)
type TalismanType = 'charms' | 'horadric_seal';

const CATEGORIES: { 
  value: ImageCategory; 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'skills', label: 'Habilidades', icon: Swords },
  { value: 'glifos', label: 'Glifos', icon: Hexagon },
  { value: 'aspectos', label: 'Aspectos', icon: Gem },
  { value: 'mecanicas', label: 'Mecánicas de Clase', icon: Shield },
  { value: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { value: 'paragon', label: 'Paragon', icon: Grid3x3 },
  { value: 'runas', label: 'Runas/Gemas', icon: Sparkles },
  { value: 'build', label: 'Equipo', icon: Shield },
  { value: 'talismanes', label: 'Talismanes', icon: Lock },
  { value: 'mundo', label: 'Eventos del Mundo', icon: MapPin },
  { value: 'otros', label: 'Otros', icon: FileText },
];
const ImageCaptureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { personajes, availableClasses, selectedPersonaje, setSelectedPersonaje, setPersonajes, refreshPersonajes } = useAppContext();
  const { isPremium } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>('skills');
  const [paragonType, setParagonType] = useState<ParagonType>('tablero');
  const [runaGemaType, setRunaGemaType] = useState<'runas' | 'gemas'>('runas');
  const [mundoType, setMundoType] = useState<MundoType>('eventos');
  const [talismanType, setTalismanType] = useState<TalismanType>('charms');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [composedImageUrl, setComposedImageUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Array<{ 
    nombre: string; 
    url: string; 
    fecha: string; 
    hasJSON?: boolean; 
    isJSONOnly?: boolean;
    metadata?: import('../../services/ImageService').JSONMetadata;
  }>>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showPromptPanel, setShowPromptPanel] = useState(true);
  const [promptType, setPromptType] = useState<'personaje' | 'heroe'>('heroe');
  
  // Estados para modal de configuración AI
  const [showAIConfigModal, setShowAIConfigModal] = useState(false);
  
  // Estados para modal de selección de personaje para batch
  const [showBatchPersonajeModal, setShowBatchPersonajeModal] = useState(false);
  const [batchTargetPersonajeId, setBatchTargetPersonajeId] = useState<string | null>(null);
  const [pendingBatchScope, setPendingBatchScope] = useState<'category' | 'all' | null>(null);
  const [aiServiceToUse, setAiServiceToUse] = useState<'gemini' | 'openai' | null>(null);
  const [aiConfigPromptType, setAiConfigPromptType] = useState<'personaje' | 'heroe'>('heroe');
  const [aiConfigClase, setAiConfigClase] = useState('');
  const [aiConfigPersonajeId, setAiConfigPersonajeId] = useState<string | null>(null);
  const [aiConfigParagonType, setAiConfigParagonType] = useState<ParagonType>('tablero');
  const [aiConfigMundoType, setAiConfigMundoType] = useState<MundoType>('eventos');
  const [aiConfigRunaGemaType, setAiConfigRunaGemaType] = useState<'runas' | 'gemas'>('runas');
  const [aiConfigTalismanType, setAiConfigTalismanType] = useState<TalismanType>('charms');
  const [selectedPersonajeId, setSelectedPersonajeId] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [embedPromptInImage, setEmbedPromptInImage] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('new');
  const [lastSavedImageUrl, setLastSavedImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [categoryCounts, setCategoryCounts] = useState<Record<ImageCategory, number>>({} as Record<ImageCategory, number>);
  const [jsonText, setJsonText] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [selectedClase, setSelectedClase] = useState<string>('');
  const [promptElementCount, setPromptElementCount] = useState<string>('');
  
  // Estados para procesamiento con IA (Gemini)
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState<'idle' | 'sending' | 'processing' | 'received' | 'saving' | 'done'>('idle');
  const [aiExtractedJSON, setAiExtractedJSON] = useState<string>('');
  const [showJSONViewer, setShowJSONViewer] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null); // URL de imagen seleccionada de galería
  const [selectedGalleryImageBlob, setSelectedGalleryImageBlob] = useState<Blob | null>(null); // Blob de imagen seleccionada
  
  // Estados para procesamiento con OpenAI (separado de Gemini)
  const [openAiProcessing, setOpenAiProcessing] = useState(false);
  const [openAiProgress, setOpenAiProgress] = useState<'idle' | 'sending' | 'processing' | 'received' | 'saving' | 'done'>('idle');
  const [openAiExtractedJSON, setOpenAiExtractedJSON] = useState<string>('');
  
  // Estados para modal de resultados de importación
  const [showImportResults, setShowImportResults] = useState(false);
  const [importResults, setImportResults] = useState<ImportResultDetails | null>(null);
  
  // Estados para visualización de imágenes y ejecución masiva
  const [viewerImage, setViewerImage] = useState<{ url: string; name: string } | null>(null);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{ image: Blob; json: string; imageName: string } | null>(null);
  const [executingBatch, setExecutingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    category: '',
    message: '',
    processedJsons: 0,
    processedItems: 0
  });
  const [manualElementCount, setManualElementCount] = useState<number | null>(null); // Override manual para cantidad de elementos
  const [promptTextExpanded, setPromptTextExpanded] = useState(false); // Toggle texto del prompt en móvil
  const [lastSavedImageName, setLastSavedImageName] = useState<string | null>(null); // Nombre del último PNG guardado
  
  // ✅ Estados para filtros de galería (por metadata)
  const [galleryFilterDestino, setGalleryFilterDestino] = useState<'all' | 'heroe' | 'personaje'>('all');
  const [galleryFilterClase, setGalleryFilterClase] = useState<string>('all');
  const [galleryFilterPersonaje, setGalleryFilterPersonaje] = useState<string>('all');
  const [galleryFilterType, setGalleryFilterType] = useState<string>('all'); // Para paragonType, runaGemaType, mundoType, talismanType

  // 🔄 Estados para modal de restauración de personaje
  const [personajeDecisions, setPersonajeDecisions] = useState<Map<string, string>>(new Map()); // nombre -> ID a usar
  const [applyToAllDecision, setApplyToAllDecision] = useState(false); // Decisión de "aplicar a todos"
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<{
    existingPersonaje: { nombre: string; clase: string; nivel: number; id: string };
    incomingData: { clase: string; nivel: number; id: string };
    resolve: (result: { useExisting: boolean; applyToAll: boolean }) => void;
  } | null>(null);
  
  // 🔑 API Keys desde variables de entorno (.env)
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Almacena HTMLImageElement cargadas desde blob URLs
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const syncUpdatedPersonajeInContext = (updatedPersonaje: any) => {
    const updatedList = personajes.map(p => p.id === updatedPersonaje.id ? updatedPersonaje : p);
    setPersonajes(updatedList);
    if (selectedPersonaje?.id === updatedPersonaje.id) {
      setSelectedPersonaje(updatedPersonaje);
    }
  };

  // Manejar cambio de categoría con lógica de Paragon
  const handleCategoryChange = (newCategory: ImageCategory) => {
    setSelectedCategory(newCategory);
    
    // Si es Paragon, establecer tipo por defecto
    if (newCategory === 'paragon') {
      setParagonType('tablero');
      // Tablero permite ambos destinos, mantener selección actual
    }

    // Runas/Gemas: seleccionar tipo por defecto
    if (newCategory === 'runas') {
      setRunaGemaType('runas');
      setPromptType('heroe');
    }

    // Equipo: siempre se importa a personaje
    if (newCategory === 'build') {
      setPromptType('personaje');
    }

    // Mundo: seleccionar tipo por defecto
    if (newCategory === 'mundo') {
      setMundoType('eventos');
      setPromptType('heroe'); // Eventos y mazmorras siempre van al héroe
    }

    // Talismanes: siempre se importa a personaje
    if (newCategory === 'talismanes') {
      setTalismanType('charms');
      setPromptType('personaje'); // Los talismanes se asocian a personajes específicos
    }
  };

  // Manejar cambio de tipo Paragon
  const handleParagonTypeChange = (type: ParagonType) => {
    setParagonType(type);
    
    // Si es atributos, forzar destino a personaje
    if (type === 'atributos') {
      setPromptType('personaje');
    }
    // Para tablero y nodo, permitir ambos destinos (mantener selección actual)
  };

  // Manejar cambio de tipo Mundo
  const handleMundoTypeChange = (type: MundoType) => {
    setMundoType(type);
    // Mundo siempre va a héroe
    setPromptType('heroe');
  };

  // Cargar contadores de categorías al abrir
  useEffect(() => {
    if (isOpen) {
      loadCategoryCounts();
    }
  }, [isOpen]);

  // Cargar última imagen guardada cuando cambia la categoría
  useEffect(() => {
    if (isOpen) {
      loadLastSavedImage();
    }
  }, [selectedCategory, isOpen]);

  // Cargar galería cuando cambia la categoría
  useEffect(() => {
    if (isOpen && showGallery) {
      loadGallery();
    }
  }, [selectedCategory, isOpen, showGallery]);

  // Auto-hide toast después de 5 segundos
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Limpiar URLs al cerrar
  useEffect(() => {
    if (!isOpen) {
      capturedImages.forEach(img => URL.revokeObjectURL(img.url));
      if (composedImageUrl) URL.revokeObjectURL(composedImageUrl);
      setCapturedImages([]);
      setShowPromptPanel(true);
      setComposedImageUrl(null);
      setShowGallery(false);
      setSelectedGalleryImage(null);
      setSelectedGalleryImageBlob(null);
      // 🧹 Limpiar decisiones de personajes al cerrar modal
      setPersonajeDecisions(new Map());
      setApplyToAllDecision(false);
    }
  }, [isOpen]);

  // Estadísticas es siempre para personaje
  useEffect(() => {
    if (selectedCategory === 'estadisticas') {
      setPromptType('personaje');
    }
    // Runas/Gemas: siempre global (héroe)
    if (selectedCategory === 'runas') {
      setPromptType('heroe');
    }
    // Equipo: siempre personaje
    if (selectedCategory === 'build') {
      setPromptType('personaje');
    }
  }, [selectedCategory]);

  // Limpiar caché cuando se cierra el modal o cambia la categoría
  // Limpiar caché cuando se cierra o cambia categoría (consolidado)
  useEffect(() => {
    if (!isOpen) {
      imageCache.current.clear();
    }
  }, [isOpen, selectedCategory]);

  // ✅ Limpiar filtros de galería cuando cambia la categoría
  useEffect(() => {
    setGalleryFilterDestino('all');
    setGalleryFilterClase('all');
    setGalleryFilterPersonaje('all');
    setGalleryFilterType('all');
  }, [selectedCategory]);

  // Manejar paste desde clipboard
  useEffect(() => {
    if (!isOpen || showGallery) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const isNewElement = captureMode === 'new';
            addImageToComposition(blob, isNewElement);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, showGallery, captureMode]);

  const addImageToComposition = (blob: Blob, isNewElement: boolean) => {
    console.time('⏱️ Pegado → Preview visible');
    const pasteStartTime = performance.now();
    
    const url = URL.createObjectURL(blob);
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ AGREGAR INMEDIATAMENTE SIN ESPERAR (el navegador carga lazy)
    setCapturedImages(prev => [...prev, { id, blob, url, isComplete: isNewElement }]);
    
    console.log(`📊 addImageToComposition ejecutado en: ${(performance.now() - pasteStartTime).toFixed(2)}ms`);
  };

  const removeImage = (id: string) => {
    setCapturedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.url);
        // Limpiar del caché también
        imageCache.current.delete(img.url);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const toggleImageCompletion = (id: string) => {
    setCapturedImages(prev => prev.map(img => 
      img.id === id ? { ...img, isComplete: !img.isComplete } : img
    ));
  };

  const composeImages = () => {
    const composeStartTime = performance.now();
    
    if (capturedImages.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log(`🔄 composeImages iniciado para ${capturedImages.length} imagen(es)`);
    const loadStartTime = performance.now();
    
    // ✅ Cargar imágenes SÍNCRONAMENTE desde URLs de blobs (INSTANTÁNEO)
    const loadedImages: Array<{ img: HTMLImageElement; isComplete: boolean }> = [];
    
    for (const capturedImg of capturedImages) {
      // Verificar si ya tenemos la imagen en caché
      let img = imageCache.current.get(capturedImg.url) as HTMLImageElement;
      
      if (!img) {
        // Crear imagen y asignar src (el blob ya está en memoria, carga instantánea)
        img = new Image();
        img.src = capturedImg.url;
        imageCache.current.set(capturedImg.url, img);
      }
      
      // IMPORTANTE: Verificar que la imagen esté completamente cargada
      if (!img.complete) {
        console.warn(`⚠️ Imagen aún cargando: ${capturedImg.url}`);
        // Intentar de nuevo en el próximo frame
        requestAnimationFrame(() => composeImages());
        return;
      }
      
      loadedImages.push({ img, isComplete: capturedImg.isComplete });
    }
    
    console.log(`✅ Imágenes cargadas en: ${(performance.now() - loadStartTime).toFixed(2)}ms`);
    
    if (loadedImages.length === 0) {
      console.warn('⚠️ No hay imágenes para componer');
      return;
    }

    // Calcular dimensiones con layout inteligente
    const SPACING = 10;
    const OUTER_MARGIN = SPACING;
    const VERTICAL_OFFSET = 0;
    const MAX_HORIZONTAL = 4;

    // Agrupar elementos completos
    const completeGroups: Array<Array<{ img: HTMLImageElement; isComplete: boolean }>> = [];
    let currentGroup: Array<{ img: HTMLImageElement; isComplete: boolean }> = [];
    
    loadedImages.forEach((item) => {
      if (item.isComplete && currentGroup.length > 0) {
        completeGroups.push(currentGroup);
        currentGroup = [];
      }
      currentGroup.push(item);
    });
    if (currentGroup.length > 0) {
      completeGroups.push(currentGroup);
    }

    const totalCompleteGroups = completeGroups.length;
    
    // Calcular dimensiones totales
    let totalWidth = 0;
    let totalHeight = 0;

    if (totalCompleteGroups <= MAX_HORIZONTAL) {
      completeGroups.forEach((group, groupIndex) => {
        if (groupIndex > 0) totalWidth += SPACING;
        let groupWidth = 0;
        let groupHeight = 0;
        group.forEach(item => {
          groupWidth = Math.max(groupWidth, item.img.width);
          groupHeight += item.img.height + (groupHeight > 0 ? VERTICAL_OFFSET : 0);
        });
        totalWidth += groupWidth;
        totalHeight = Math.max(totalHeight, groupHeight);
      });
    } else {
      let currentRowWidth = 0;
      let currentRowHeight = 0;
      
      completeGroups.forEach((group, groupIndex) => {
        const rowIndex = Math.floor(groupIndex / MAX_HORIZONTAL);
        const colIndex = groupIndex % MAX_HORIZONTAL;
        
        let groupWidth = 0;
        let groupHeight = 0;
        group.forEach(item => {
          groupWidth = Math.max(groupWidth, item.img.width);
          groupHeight += item.img.height + (groupHeight > 0 ? VERTICAL_OFFSET : 0);
        });
        
        if (colIndex === 0) {
          if (rowIndex > 0) totalHeight += SPACING;
          totalHeight += currentRowHeight;
          currentRowWidth = groupWidth;
          currentRowHeight = groupHeight;
          totalWidth = Math.max(totalWidth, currentRowWidth);
        } else {
          currentRowWidth += SPACING + groupWidth;
          currentRowHeight = Math.max(currentRowHeight, groupHeight);
          totalWidth = Math.max(totalWidth, currentRowWidth);
        }
      });
      totalHeight += currentRowHeight;
    }

    // Calcular espacio para el texto del prompt si está activado
    const PROMPT_MARGIN = 15;
    let promptHeight = 0;
    let promptText = '';
    if (embedPromptInImage && capturedImages.length > 0) {
      promptText = getShortPrompt();
      const fontSize = 14;
      const lineHeight = fontSize * 1.5;
      const padding = 20;
      const maxPromptWidth = totalWidth - (padding * 2) - (PROMPT_MARGIN * 2);
      
      ctx.font = `${fontSize}px Arial`;
      const words = promptText.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxPromptWidth && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine.trim());
      
      promptHeight = (lines.length * lineHeight) + (padding * 2) + (PROMPT_MARGIN * 2);
    }

    // Configurar canvas SIN leyenda (eliminada permanentemente para rendimiento)
    canvas.width = totalWidth + (2 * OUTER_MARGIN);
    canvas.height = totalHeight + promptHeight + (2 * OUTER_MARGIN);

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar texto del prompt ARRIBA si está activado
    if (embedPromptInImage && promptHeight > 0) {
      const fontSize = 14;
      const lineHeight = fontSize * 1.5;
      const padding = 20;
      
      const frameX = PROMPT_MARGIN + OUTER_MARGIN;
      const frameY = PROMPT_MARGIN + OUTER_MARGIN;
      const frameWidth = canvas.width - (PROMPT_MARGIN * 2) - (OUTER_MARGIN * 2);
      const frameHeight = promptHeight - (PROMPT_MARGIN * 2);
      
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(frameX, frameY, frameWidth, frameHeight);
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
      
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textBaseline = 'top';
      
      const words = promptText.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      const maxPromptWidth = frameWidth - (padding * 2);
      
      for (const word of words) {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxPromptWidth && currentLine !== '') {
          lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine.trim());
      
      lines.forEach((line, i) => {
        ctx.fillText(line, frameX + padding, frameY + padding + (i * lineHeight));
      });
    }

    // Dibujar imágenes
    const imageOffsetY = embedPromptInImage && promptHeight > 0 ? promptHeight : 0;
    
    if (totalCompleteGroups <= MAX_HORIZONTAL) {
      let xOffset = OUTER_MARGIN;
      completeGroups.forEach((group, groupIndex) => {
        if (groupIndex > 0) xOffset += SPACING;
        
        let groupStartX = xOffset;
        let yOffset = imageOffsetY + OUTER_MARGIN;
        let maxGroupWidth = 0;
        
        group.forEach(item => {
          ctx.drawImage(item.img, groupStartX, yOffset);
          yOffset += item.img.height + VERTICAL_OFFSET;
          maxGroupWidth = Math.max(maxGroupWidth, item.img.width);
        });
        
        xOffset += maxGroupWidth;
      });
    } else {
      let currentRowY = imageOffsetY + OUTER_MARGIN;
      
      completeGroups.forEach((group, groupIndex) => {
        const rowIndex = Math.floor(groupIndex / MAX_HORIZONTAL);
        const colIndex = groupIndex % MAX_HORIZONTAL;
        
        if (colIndex === 0 && rowIndex > 0) {
          let maxRowHeight = 0;
          for (let i = (rowIndex - 1) * MAX_HORIZONTAL; i < Math.min(rowIndex * MAX_HORIZONTAL, totalCompleteGroups); i++) {
            const prevGroup = completeGroups[i];
            let groupHeight = 0;
            prevGroup.forEach(item => {
              groupHeight += item.img.height + (groupHeight > 0 ? VERTICAL_OFFSET : 0);
            });
            maxRowHeight = Math.max(maxRowHeight, groupHeight);
          }
          currentRowY += maxRowHeight + SPACING;
        }
        
        let xOffset = OUTER_MARGIN;
        for (let i = rowIndex * MAX_HORIZONTAL; i < groupIndex; i++) {
          const prevGroup = completeGroups[i];
          let groupWidth = 0;
          prevGroup.forEach(item => {
            groupWidth = Math.max(groupWidth, item.img.width);
          });
          xOffset += groupWidth + SPACING;
        }
        
        let yOffset = currentRowY;
        let groupStartX = xOffset;
        group.forEach(item => {
          ctx.drawImage(item.img, groupStartX, yOffset);
          yOffset += item.img.height + VERTICAL_OFFSET;
        });
      });
    }

    // Crear blob
    const blobStartTime = performance.now();
    canvas.toBlob((blob) => {
      if (blob) {
        console.log(`🎨 Canvas → Blob en: ${(performance.now() - blobStartTime).toFixed(2)}ms`);
        
        if (composedImageUrl) URL.revokeObjectURL(composedImageUrl);
        const url = URL.createObjectURL(blob);
        setComposedImageUrl(url);
        
        console.log(`📊 composeImages completado en: ${(performance.now() - composeStartTime).toFixed(2)}ms`);
        console.timeEnd('⏱️ Pegado → Preview visible');
      }
    }, 'image/png');
  };

  // ✅ Ejecutar INMEDIATAMENTE sin ningún delay
  useEffect(() => {
    if (capturedImages.length > 0) {
      // Sin requestAnimationFrame ni debounce - ejecutar directo
      composeImages();
    } else {
      setComposedImageUrl(null);
      imageCache.current.clear();
    }
  }, [capturedImages, embedPromptInImage]);

  // Funciones helper
  const loadCategoryCounts = async () => {
    const counts: Record<ImageCategory, number> = {} as Record<ImageCategory, number>;
    for (const cat of CATEGORIES) {
      try {
        const images = await ImageService.listImages(cat.value);
        counts[cat.value] = images.length;
      } catch {
        counts[cat.value] = 0;
      }
    }
    setCategoryCounts(counts);
  };

  const loadLastSavedImage = async () => {
    try {
      const images = await ImageService.listImages(selectedCategory);
      if (images.length > 0) {
        // Obtener la última imagen (la más reciente)
        const lastImage = images[images.length - 1];
        const url = URL.createObjectURL(lastImage.blob);
        setLastSavedImageUrl(url);
      } else {
        setLastSavedImageUrl(null);
      }
    } catch (error) {
      console.error('Error cargando última imagen:', error);
      setLastSavedImageUrl(null);
    }
  };

  const isGlobalRunesGemsCategory = selectedCategory === 'runas';
  const effectivePromptTypeUI: 'heroe' | 'personaje' =
    selectedCategory === 'estadisticas' || selectedCategory === 'build'
      ? 'personaje'
      : isGlobalRunesGemsCategory
        ? 'heroe'
      : promptType;
  const effectivePersonajeIdForActions = selectedPersonajeId || selectedPersonaje?.id || personajes[0]?.id || null;
  const effectiveClaseForActions = selectedClase || selectedPersonaje?.clase || availableClasses[0] || '';
  const requiresPersonajeSelection = !isGlobalRunesGemsCategory && effectivePromptTypeUI === 'personaje';
  const requiresClaseSelection = !isGlobalRunesGemsCategory && effectivePromptTypeUI === 'heroe';
  const hasEffectiveTargetSelection =
    isGlobalRunesGemsCategory ||
    (requiresPersonajeSelection ? Boolean(effectivePersonajeIdForActions) : Boolean(effectiveClaseForActions));

  const getRecommendedMax = (category: ImageCategory): number => {
    switch (category) {
      case 'skills': return 4;  // Reducido de 6 a 4 (recomendación óptima)
      case 'glifos': return 6;  // Reducido de 8 a 6 (recomendación óptima)
      case 'aspectos': return 5;  // Reducido de 7 a 5 (recomendación óptima)
      case 'mecanicas': return 3;  // 3 capturas para mecánicas de clase
      case 'estadisticas': return 5; // 5 capturas ideales (secciones distintas)
      case 'paragon': return 8;  // 8 capturas (tableros, nodos, configuración)
      case 'otros': return 6;  // Reducido de 8 a 6 (recomendación óptima)
      case 'runas': return 4;   // 4 capturas para runas (pantalla de inventario)
      case 'gemas': return 4;   // 4 capturas para gemas
      case 'build': return 6;   // 6 capturas para el equipamiento completo
      case 'mundo': return 5;   // 5 capturas para eventos del mundo
      default: return 5;
    }
  };

  const getElementCount = (): number => {
    // Si hay override manual, usarlo; de lo contrario, contar elementos completos
    if (manualElementCount !== null && manualElementCount >= 0) {
      return manualElementCount;
    }
    return capturedImages.filter(img => img.isComplete).length;
  };

  const getProgressColor = (): string => {
    const count = getElementCount();
    const max = getRecommendedMax(selectedCategory);
    if (count === 0) return 'bg-gray-500';
    if (count <= max) return 'bg-green-500';
    if (count <= max + 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressPercentage = (): number => {
    const count = getElementCount();
    const max = getRecommendedMax(selectedCategory);
    return Math.min((count / max) * 100, 100);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage(message);
    setToastType(type);
  };

  const copyGalleryImage = async (imageUrl: string, imageName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast(`✅ Imagen "${imageName}" copiada al portapapeles`, 'success');
    } catch (error) {
      console.error('Error copiando imagen:', error);
      showToast('❌ Error al copiar imagen. Intenta descargarla.', 'error');
    }
  };

  const saveComposedImage = async () => {
    if (!composedImageUrl) return;

    try {
      const response = await fetch(composedImageUrl);
      const blob = await response.blob();
      
      // Resolver categoría real (runas/gemas necesitan resolución)
      const resolvedCategory = resolveImportCategory(selectedCategory, runaGemaType);
      const nombre = await ImageService.saveImage(blob, resolvedCategory, getFileNameForCategory(resolvedCategory));
      setLastSavedImageName(nombre); // Trackear para auto-guardado posterior de JSON
      
      // 📄 Guardar JSON asociado si existe
      if (jsonText.trim()) {
        try {
          // ✅ CONSTRUIR METADATA con todos los inputs actuales
          const personajeSeleccionado = promptType === 'personaje' ? personajes.find(p => p.id === selectedPersonajeId) : undefined;
          const metadata: import('../../services/ImageService').JSONMetadata = {
            categoria: resolvedCategory,
            timestamp: new Date().toISOString(),
            destino: promptType,
            clase: promptType === 'heroe' ? selectedClase : undefined,
            personajeId: promptType === 'personaje' ? (selectedPersonajeId || undefined) : undefined,
            personajeNombre: personajeSeleccionado?.nombre,
            personajeNivel: personajeSeleccionado?.nivel,
            personajeClase: personajeSeleccionado?.clase,
            paragonType: selectedCategory === 'paragon' ? paragonType : undefined,
            runaGemaType: selectedCategory === 'runas' ? runaGemaType : undefined,
            mundoType: selectedCategory === 'mundo' ? mundoType : undefined,
            talismanType: selectedCategory === 'talismanes' ? talismanType : undefined,
            manualElementCount: manualElementCount,
            version: '0.8.7'
          };
          
          await ImageService.saveImageJSON(jsonText, resolvedCategory, nombre, metadata);
          showToast(`✅ Imagen y JSON guardados: ${resolvedCategory}/${nombre}`, 'success');
        } catch (jsonError) {
          console.error('Error guardando JSON:', jsonError);
          showToast(`✅ Imagen guardada (JSON no guardado): ${resolvedCategory}/${nombre}`, 'info');
        }
      } else {
        showToast(`✅ Imagen guardada: ${resolvedCategory}/${nombre}`, 'success');
      }
      
      // Limpiar captura y JSON
      setCapturedImages([]);
      setComposedImageUrl(null);
      setJsonText('');
      
      // Recargar contadores, galería y última imagen guardada
      loadCategoryCounts();
      loadLastSavedImage();
      if (showGallery) {
        loadGallery();
      }
    } catch (error) {
      console.error('Error guardando imagen:', error);
      showToast('❌ Error al guardar la imagen. Verifica los permisos del sistema de archivos.', 'error');
    }
  };

  const loadGallery = async () => {
    try {
      const entries = await ImageService.listGalleryEntries(selectedCategory);
      const mappedEntries = entries.map(entry => ({
        nombre: entry.nombre,
        url: entry.blob ? URL.createObjectURL(entry.blob) : '',
        fecha: new Date(entry.fecha).toLocaleString('es-ES'),
        hasJSON: entry.hasJSON,
        isJSONOnly: entry.isJSONOnly,
        metadata: entry.metadata // ✅ Incluir metadata
      }));
      setGalleryImages(mappedEntries);
    } catch (error) {
      console.error('Error cargando galería:', error);
    }
  };

  const downloadComposedImage = () => {
    if (!composedImageUrl) return;
    
    const a = document.createElement('a');
    a.href = composedImageUrl;
    a.download = `${selectedCategory}_${Date.now()}.png`;
    a.click();
  };

  // Obtener prompt con parámetros opcionales para override
  const getPromptForCategory = (overrideParagonType?: ParagonType, overrideRunaGemaType?: 'runas' | 'gemas', overrideMundoType?: MundoType): string => {
    let basePrompt = '';
    const manualCount = parseInt(promptElementCount, 10);
    const parsedManualCount = Number.isFinite(manualCount) ? manualCount : undefined;
    
    // Usar valores override o valores del estado
    const effectiveParagonType = overrideParagonType ?? paragonType;
    const effectiveRunaGemaType = overrideRunaGemaType ?? runaGemaType;
    const effectiveMundoType = overrideMundoType ?? mundoType;

    const buildSummaryForPrompt = (personaje?: any): string => {
      if (!personaje?.build || typeof personaje.build !== 'object') return '';
      const build = personaje.build;
      const piezas = Object.values(build.piezas || {}).filter(Boolean) as any[];
      if (piezas.length === 0) return '';

      const slots = piezas
        .map((pieza: any) => pieza?.espacio)
        .filter((slot: any) => typeof slot === 'string' && slot.trim().length > 0)
        .join(', ');

      const piezasConEngarces = piezas.filter((pieza: any) => Array.isArray(pieza?.engarces) && pieza.engarces.length > 0).length;
      const piezasConAspecto = piezas.filter((pieza: any) => Boolean(pieza?.aspecto_id || pieza?.aspecto_vinculado_id || pieza?.aspecto_descripcion_diferencia)).length;
      const runasEquipadas = Array.isArray(build.runas_equipadas) ? build.runas_equipadas.length : 0;

      return `- Build registrada: ${piezas.length} pieza(s)\n- Slots detectados: ${slots || 'N/D'}\n- Piezas con engarces: ${piezasConEngarces}\n- Piezas con aspecto: ${piezasConAspecto}\n- Runas equipadas en build: ${runasEquipadas}`;
    };
    
    // Determinar qué prompts usar según el tipo (héroe o personaje)
    switch (selectedCategory) {
      case 'skills':
        basePrompt = ImageExtractionPromptService.generateFullSkillsPrompt();
        break;
      case 'glifos':
        basePrompt = ImageExtractionPromptService.generateGlyphsPrompt();
        break;
      case 'aspectos':
        // Usar prompt específico según tipo
        if (promptType === 'personaje') {
          basePrompt = ImageExtractionPromptService.generateCharacterAspectsPrompt();
        } else {
          basePrompt = ImageExtractionPromptService.generateAspectsPrompt();
        }
        break;
      case 'mecanicas':
        basePrompt = ImageExtractionPromptService.generateClassMechanicsPrompt();
        break;
      case 'mundo':
        // Usar prompt específico según tipo
        if (effectiveMundoType === 'mazmorras_aspectos') {
          basePrompt = ImageExtractionPromptService.generateDungeonAspectsPrompt();
        } else {
          basePrompt = ImageExtractionPromptService.generateWorldEventsPrompt();
        }
        break;
      case 'estadisticas':
        basePrompt = ImageExtractionPromptService.generateStatsPrompt();
        break;
      case 'paragon':
        // Usar prompts específicos según tipo (SIN rareza)
        if (effectiveParagonType === 'tablero') {
          basePrompt = ImageExtractionPromptService.generateParagonBoardsPrompt();
        } else if (effectiveParagonType === 'nodo') {
          // Prompt genérico que detecta rareza automáticamente
          basePrompt = ImageExtractionPromptService.generateParagonNodesPrompt();
        } else if (effectiveParagonType === 'atributos') {
          basePrompt = ImageExtractionPromptService.generateParagonCharacterPrompt();
        }
        break;
      case 'runas':
        basePrompt = effectiveRunaGemaType === 'gemas'
          ? ImageExtractionPromptService.generateGemsPrompt()
          : ImageExtractionPromptService.generateRunesPrompt();
        break;
      case 'talismanes':
        // Usar prompt específico según tipo
        basePrompt = talismanType === 'charms'
          ? ImageExtractionPromptService.generateCharmsPrompt()
          : ImageExtractionPromptService.generateHoradricSealPrompt();
        break;
      case 'build':
        basePrompt = ImageExtractionPromptService.generateEquipmentPrompt();
        break;
      default:
        basePrompt = 'Analiza esta imagen y extrae la información relevante en formato JSON.';
    }
    
    // Agregar contexto de personaje si está seleccionado
    if (promptType === 'personaje' && selectedPersonajeId) {
      const personaje = personajes.find(p => p.id === selectedPersonajeId);
      if (personaje) {
        const buildContext = buildSummaryForPrompt(personaje);
        basePrompt = `**CONTEXTO DEL PERSONAJE:**\n- Nombre: ${personaje.nombre}\n- Clase: ${personaje.clase}\n- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` (Paragon: ${personaje.nivel_paragon})` : ''}${buildContext ? `\n${buildContext}` : '\n- Build registrada: no disponible (opcional)'}\n\n---\n\n${basePrompt}`;
      }
    }
    
    const categoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory;
    basePrompt = ImageExtractionPromptService.withElementLimit(
      basePrompt,
      parsedManualCount,
      categoryLabel.toLowerCase()
    );
    
    return basePrompt;
  };

  // Generar prompt resumido para embeber en la imagen
  const getShortPrompt = (): string => {
    const manualCount = parseInt(promptElementCount, 10);
    const parsedManualCount = Number.isFinite(manualCount) ? manualCount : undefined;
    const countPrefix = parsedManualCount ? `${parsedManualCount} ` : '';

    let contextLine = '';
    if (promptType === 'personaje' && selectedPersonajeId) {
      const personaje = personajes.find(p => p.id === selectedPersonajeId);
      if (personaje) {
        contextLine = `PERSONAJE: ${personaje.nombre} (${personaje.clase} Nv.${personaje.nivel})\\n`;
        const build = (personaje as any).build;
        const piezas = Object.values(build?.piezas || {}).filter(Boolean) as any[];
        if (piezas.length > 0) {
          const piezasConEngarces = piezas.filter((pieza: any) => Array.isArray(pieza?.engarces) && pieza.engarces.length > 0).length;
          const piezasConAspecto = piezas.filter((pieza: any) => Boolean(pieza?.aspecto_id || pieza?.aspecto_vinculado_id || pieza?.aspecto_descripcion_diferencia)).length;
          contextLine += `BUILD: ${piezas.length} piezas, ${piezasConEngarces} con engarces, ${piezasConAspecto} con aspecto\\n`;
        }
      }
    }

    let prompt = '';
    switch (selectedCategory) {
      case 'skills':
        prompt = `${contextLine}EXTRAE ${countPrefix}HABILIDADES de Diablo 4 en JSON:\\n- Activas: id, nombre, tipo_habilidad, tipo, rama, nivel_actual, nivel_maximo, descripcion, modificadores, tags\\n- Pasivas: id, nombre, tipo_habilidad, tipo, rama, nivel, nivel_maximo, efecto, puntos_asignados, tags\\n- Formato: {habilidades_activas:[], habilidades_pasivas:[], palabras_clave:[]}`;
        break;
      case 'glifos':
        prompt = `${contextLine}EXTRAE ${countPrefix}GLIFOS de Diablo 4 en JSON:\\n- Por glifo: id, nombre, rareza, estado, tamano_radio, atributo_escalado, bonificacion_adicional, bonificacion_legendaria, tags\\n- Formato: {glifos:[], palabras_clave:[]}`;
        break;
      case 'aspectos':
        // Usar la misma lógica que getPromptForCategory para evitar versiones mínimas
        prompt = promptType === 'personaje'
          ? ImageExtractionPromptService.generateCharacterAspectsPrompt()
          : ImageExtractionPromptService.generateAspectsPrompt();
        if (contextLine) {
          prompt = `${contextLine}${prompt}`;
        }
        prompt = ImageExtractionPromptService.withElementLimit(
          prompt,
          parsedManualCount,
          promptType === 'personaje' ? 'aspectos equipados' : 'aspectos'
        );
        break;
      case 'estadisticas':
        // Usar la misma lógica que getPromptForCategory para garantizar consistencia
        prompt = ImageExtractionPromptService.generateStatsPrompt();
        if (contextLine) {
          prompt = `${contextLine}${prompt}`;
        }
        // Agregar withElementLimit para mantener consistencia con getPromptForCategory
        prompt = ImageExtractionPromptService.withElementLimit(
          prompt,
          parsedManualCount,
          'estadísticas'
        );
        break;
      case 'paragon':
        // Usar prompts específicos según tipo (SIN rareza)
        if (paragonType === 'tablero') {
          prompt = ImageExtractionPromptService.generateParagonBoardsPrompt();
        } else if (paragonType === 'nodo') {
          prompt = ImageExtractionPromptService.generateParagonNodesPrompt();
        } else if (paragonType === 'atributos') {
          prompt = ImageExtractionPromptService.generateParagonCharacterPrompt();
        }
        if (contextLine) {
          prompt = `${contextLine}${prompt}`;
        }
        prompt = ImageExtractionPromptService.withElementLimit(
          prompt,
          parsedManualCount,
          paragonType
        );
        break;
      case 'runas':
        prompt = runaGemaType === 'gemas'
          ? ImageExtractionPromptService.generateGemsPrompt()
          : ImageExtractionPromptService.generateRunesPrompt();
        if (contextLine) { prompt = `${contextLine}${prompt}`; }
        prompt = ImageExtractionPromptService.withElementLimit(
          prompt,
          parsedManualCount,
          runaGemaType === 'gemas' ? 'gemas' : 'runas'
        );
        break;
      case 'build':
        prompt = ImageExtractionPromptService.generateEquipmentPrompt();
        if (contextLine) { prompt = `${contextLine}${prompt}`; }
        prompt = ImageExtractionPromptService.withElementLimit(prompt, parsedManualCount, 'piezas de equipamiento');
        break;
      default:
        prompt = `${contextLine}EXTRAE ${countPrefix}elementos en formato JSON estructurado`;
    }

    return prompt;
  };

  // Auto-guardar JSON (y opcionalmente imagen) en galería tras importación exitosa
  const autoSaveJSONAfterImport = async (jsonContent: string): Promise<void> => {
    if (!jsonContent.trim()) return;
    try {
      // Resolver categoría real (runas/gemas necesitan resolución)
      const resolvedCategory = resolveImportCategory(selectedCategory, runaGemaType);
      
      // ✅ CONSTRUIR METADATA con todos los inputs actuales
      const personajeSeleccionado = promptType === 'personaje' ? personajes.find(p => p.id === selectedPersonajeId) : undefined;
      const metadata: import('../../services/ImageService').JSONMetadata = {
        categoria: resolvedCategory,
        timestamp: new Date().toISOString(),
        destino: promptType,
        clase: promptType === 'heroe' ? selectedClase : undefined,
        personajeId: promptType === 'personaje' ? (selectedPersonajeId || undefined) : undefined,
        personajeNombre: personajeSeleccionado?.nombre,
        personajeNivel: personajeSeleccionado?.nivel,
        personajeClase: personajeSeleccionado?.clase,
        paragonType: selectedCategory === 'paragon' ? paragonType : undefined,
        runaGemaType: selectedCategory === 'runas' ? runaGemaType : undefined,
        mundoType: selectedCategory === 'mundo' ? mundoType : undefined,
        talismanType: selectedCategory === 'talismanes' ? talismanType : undefined,
        manualElementCount: manualElementCount,
        version: '0.8.7' // Versión de la app
      };
      
      if (composedImageUrl) {
        // Imagen en preview no guardada → guardar imagen + JSON + metadata
        const response = await fetch(composedImageUrl);
        const blob = await response.blob();
        const nombre = await ImageService.saveImage(blob, resolvedCategory, getFileNameForCategory(resolvedCategory));
        await ImageService.saveImageJSON(jsonContent, resolvedCategory, nombre, metadata);
        setLastSavedImageName(nombre);
        setCapturedImages([]);
        setComposedImageUrl(null);
        showToast(`💾 Imagen, JSON y metadata guardados automáticamente en galería`, 'info');
      } else if (lastSavedImageName) {
        // Imagen ya guardada previamente → solo guardar JSON + metadata junto a ella
        await ImageService.saveImageJSON(jsonContent, resolvedCategory, lastSavedImageName, metadata);
        showToast(`💾 JSON y metadata guardados junto a la imagen guardada`, 'info');
      } else if (selectedGalleryImage) {
        // Imagen de galería seleccionada → guardar JSON + metadata junto a ella
        const galleryEntry = galleryImages.find(img => img.url === selectedGalleryImage);
        if (galleryEntry && !galleryEntry.isJSONOnly) {
          await ImageService.saveImageJSON(jsonContent, resolvedCategory, galleryEntry.nombre, metadata);
          showToast(`💾 JSON y metadata guardados junto a imagen de galería`, 'info');
        } else if (selectedGalleryImageBlob) {
          // Fallback robusto: si no encontramos la entrada por URL, crear una nueva imagen+JSON+metadata
          const nombre = await ImageService.saveImage(selectedGalleryImageBlob, resolvedCategory, getFileNameForCategory(resolvedCategory));
          await ImageService.saveImageJSON(jsonContent, resolvedCategory, nombre, metadata);
          setLastSavedImageName(nombre);
          showToast(`💾 Imagen, JSON y metadata guardados automáticamente en galería`, 'info');
        } else {
          await ImageService.saveJSONOnly(jsonContent, resolvedCategory, getFileNameForCategory(resolvedCategory), metadata);
          showToast(`💾 JSON y metadata guardados sin imagen (listo para re-procesar desde galería)`, 'info');
        }
      } else {
        // Sin imagen → guardar JSON independiente + metadata
        await ImageService.saveJSONOnly(jsonContent, resolvedCategory, getFileNameForCategory(resolvedCategory), metadata);
        showToast(`💾 JSON y metadata guardados sin imagen (listo para re-procesar desde galería)`, 'info');
      }
      loadCategoryCounts();
      loadGallery();
    } catch (error) {
      console.error('Error al auto-guardar JSON:', error);
    }
  };

  const copyPromptToClipboard = () => {
    const prompt = getPromptForCategory();
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const copyLastSavedImage = async () => {
    if (!lastSavedImageUrl) return;
    try {
      const response = await fetch(lastSavedImageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      showToast('✅ Última imagen guardada copiada al portapapeles', 'success');
    } catch (error) {
      console.error('Error copiando última imagen:', error);
      showToast('❌ Error al copiar imagen guardada', 'error');
    }
  };

  // Seleccionar imagen de galería para procesar con IA (y cargar JSON si existe)
  const selectGalleryImage = async (imageUrl: string, imageName: string, hasJSON?: boolean, isJSONOnly?: boolean) => {
    try {
      if (isJSONOnly) {
        // Entrada solo-JSON: cargar JSON en textarea
        const jsonContent = await ImageService.loadJSONText(selectedCategory, imageName);
        if (jsonContent) {
          setJsonText(jsonContent);
          showToast(`📄 JSON de "${imageName}" cargado para importar`, 'success');
        } else {
          showToast('❌ No se pudo leer el JSON', 'error');
        }
        if (!showPromptPanel) setShowPromptPanel(true);
        return;
      }

      // Si ya está seleccionada, deseleccionar
      if (selectedGalleryImage === imageUrl) {
        setSelectedGalleryImage(null);
        setSelectedGalleryImageBlob(null);
        showToast('🔄 Imagen deseleccionada', 'info');
        return;
      }

      // Obtener blob de la imagen
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      setSelectedGalleryImage(imageUrl);
      setSelectedGalleryImageBlob(blob);

      // Cargar JSON asociado si existe
      if (hasJSON) {
        const jsonContent = await ImageService.loadJSONText(selectedCategory, imageName);
        if (jsonContent) {
          setJsonText(jsonContent);
          showToast(`✅ Imagen "${imageName}" cargada con JSON para completar`, 'success');
        } else {
          showToast(`✅ Imagen "${imageName}" seleccionada para procesar con IA`, 'success');
        }
      } else {
        showToast(`✅ Imagen "${imageName}" seleccionada para procesar con IA`, 'success');
      }
      
      // Abrir panel de prompt automáticamente
      if (!showPromptPanel) setShowPromptPanel(true);
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      showToast('❌ Error al seleccionar imagen', 'error');
    }
  };

  // Editar entrada de galería en la vista de captura (visor + importación)
  const editGalleryEntry = async (entry: { nombre: string; url: string; hasJSON?: boolean; isJSONOnly?: boolean }) => {
    try {
      setSelectedGalleryImage(null);
      setSelectedGalleryImageBlob(null);

      if (!entry.isJSONOnly) {
        const blob = await ImageService.loadImage(selectedCategory, entry.nombre);
        if (!blob) {
          showToast('❌ No se pudo cargar la imagen para editar', 'error');
          return;
        }

        const objectUrl = URL.createObjectURL(blob);
        if (composedImageUrl) {
          URL.revokeObjectURL(composedImageUrl);
        }

        // Agregar inmediatamente sin precarga
        setCapturedImages([
          {
            id: `gallery_edit_${Date.now()}`,
            blob,
            url: objectUrl,
            isComplete: true
          }
        ]);
        setComposedImageUrl(objectUrl);
      } else {
        setCapturedImages([]);
        setComposedImageUrl(null);
      }

      if (entry.hasJSON) {
        const jsonContent = await ImageService.loadJSONText(selectedCategory, entry.nombre);
        setJsonText(jsonContent || '');
      } else {
        setJsonText('');
      }

      setShowGallery(false);
      setShowPromptPanel(true);

      if (entry.isJSONOnly) {
        showToast('✏️ Modo edición: JSON cargado en importación (sin imagen)', 'info');
      } else if (entry.hasJSON) {
        showToast('✏️ Modo edición: imagen y JSON cargados en captura', 'success');
      } else {
        showToast('✏️ Modo edición: imagen cargada en captura', 'success');
      }
    } catch (error) {
      console.error('Error abriendo entrada para edición:', error);
      showToast('❌ No se pudo abrir la entrada para edición', 'error');
    }
  };

  // ============================================================================
  // DEEP MERGE UTILITY - Fusión profunda de objetos
  // ============================================================================
  /**
   * Hace un merge profundo de dos objetos, preservando todos los campos existentes
   * y agregando/actualizando los nuevos.
   * 
   * IMPORTANTE: Esta función es crucial para estadísticas porque previene la
   * pérdida de datos al importar nuevas secciones.
   * 
   * @example
   * const base = { 
   *   personaje: { aguante: 1000, danioArma: 500 },
   *   moneda: { oro: 1000 }
   * };
   * const nuevo = { 
   *   personaje: { aguante: 2000 },  // Solo actualiza aguante
   *   ofensivo: { critico: 10 }      // Nueva sección
   * };
   * deepMerge(base, nuevo) => {
   *   personaje: { aguante: 2000, danioArma: 500 },  // ✅ preserva danioArma
   *   moneda: { oro: 1000 },                          // ✅ preserva moneda
   *   ofensivo: { critico: 10 }                       // ✅ agrega ofensivo
   * }
   */
  const deepMerge = (target: any, source: any): any => {
    // Caso base: Si source es null o undefined, mantener target
    if (source === null || source === undefined) {
      return target;
    }

    // Caso base: Si target es null o undefined, usar source
    if (target === null || target === undefined) {
      return source;
    }

    // Caso especial: Detectar estructura enriquecida de estadística
    const isTargetEnriched = typeof target === 'object' && !Array.isArray(target) && 
                             ('valor' in target || 'detalles' in target || 'atributo_ref' in target);
    const isSourceEnriched = typeof source === 'object' && !Array.isArray(source) && 
                             ('valor' in source || 'detalles' in source || 'atributo_ref' in source);
    const isSourcePrimitive = typeof source === 'number' || typeof source === 'string' || typeof source === 'boolean';
    const isTargetPrimitive = typeof target === 'number' || typeof target === 'string' || typeof target === 'boolean';

    // CASO 1: Target enriquecido + Source primitivo
    // Preservar estructura enriquecida, solo actualizar el valor
    if (isTargetEnriched && isSourcePrimitive) {
      return {
        ...target,
        valor: source
      };
    }

    // CASO 2: Target primitivo + Source enriquecido
    // Usar la estructura enriquecida completa
    if (isTargetPrimitive && isSourceEnriched) {
      return source;
    }

    // CASO 3: Ambos son primitivos
    if (isTargetPrimitive && isSourcePrimitive) {
      return source;
    }

    // Arrays: reemplazar directamente (no mergear arrays)
    if (Array.isArray(source)) {
      return source;
    }

    // Si alguno no es objeto, retornar source
    if (typeof target !== 'object' || typeof source !== 'object') {
      return source;
    }

    // Crear copia del target
    const result = { ...target };

    // Mergear cada propiedad del source
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        // ✅ CASO ESPECIAL: Arrays de "detalles" → ACUMULAR en lugar de reemplazar
        if (key === 'detalles' && Array.isArray(source[key]) && Array.isArray(target[key])) {
          // Combinar arrays evitando duplicados (por atributo_ref + texto)
          const targetDetalles = target[key];
          const sourceDetalles = source[key];
          const combined = [...targetDetalles];
          
          sourceDetalles.forEach((newDetalle: any) => {
            // Buscar si ya existe este detalle (mismo atributo_ref + texto)
            const exists = combined.some((existing: any) => 
              existing.atributo_ref === newDetalle.atributo_ref && 
              existing.texto === newDetalle.texto
            );
            
            if (!exists) {
              combined.push(newDetalle);
            }
          });
          
          result[key] = combined;
        } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          // Si es objeto, hacer merge recursivo
          result[key] = deepMerge(target[key], source[key]);
        } else {
          // Si es valor primitivo o array (que no sea detalles), reemplazar
          result[key] = source[key];
        }
      }
    }

    return result;
  };

  /**
   * Normaliza nombres de campos en secciones de estadísticas
   * y elimina campos con nombres antiguos/incorrectos
   */
  const normalizeStatsFieldNames = (stats: any): any => {
    if (!stats || typeof stats !== 'object') return stats;

    const normalized = { ...stats };

    // Mapeo de nombres antiguos/incorrectos a nombres correctos
    const fieldMappings: Record<string, { correct: string; incorrect: string[] }> = {
      defensivo: {
        correct: 'vidaCada5Segundos',
        incorrect: ['regeneracionVida5s', 'regeneracion_vida_5s', 'vida5s']
      },
      utilidad: {
        correct: 'bonificacionProbabilidadGolpeAfortunado',
        incorrect: ['probabilidadGolpeAfortunado', 'golpeAfortunado']
      }
    };

    // Procesar cada sección
    Object.keys(fieldMappings).forEach(sectionKey => {
      if (normalized[sectionKey] && typeof normalized[sectionKey] === 'object') {
        const section = normalized[sectionKey];
        const { correct, incorrect } = fieldMappings[sectionKey];

        // Buscar y consolidar campos incorrectos
        let correctValue = section[correct];
        let hasIncorrectValue = false;

        incorrect.forEach(wrongName => {
          if (wrongName in section) {
            
            // Si el campo correcto no existe, usar el valor del incorrecto
            if (correctValue === undefined || correctValue === null) {
              correctValue = section[wrongName];
            }
            
            // Eliminar el campo incorrecto
            delete section[wrongName];
            hasIncorrectValue = true;
          }
        });

        // Asignar el valor consolidado al campo correcto
        if (hasIncorrectValue && correctValue !== undefined) {
          section[correct] = correctValue;
        }
      }
    });

    // Mover reduccionDanioJcJ de utilidad a jcj
    if (normalized.utilidad && 'reduccionDanioJcJ' in normalized.utilidad) {
      if (!normalized.jcj) normalized.jcj = {};
      normalized.jcj.reduccionDanio = normalized.utilidad.reduccionDanioJcJ;
      delete normalized.utilidad.reduccionDanioJcJ;
    }

    return normalized;
  };

  const stripSystemFields = (value: any): any => {
    if (Array.isArray(value)) return value.map(stripSystemFields);
    if (value && typeof value === 'object') {
      const result: Record<string, any> = {};
      Object.entries(value).forEach(([key, val]) => {
        if (key === 'id') return;
        result[key] = stripSystemFields(val);
      });
      return result;
    }
    return value;
  };

  const areEquivalentContent = (a: any, b: any): boolean => {
    try {
      return JSON.stringify(stripSystemFields(a)) === JSON.stringify(stripSystemFields(b));
    } catch {
      return false;
    }
  };

  const normalizeLookupKey = (value: any): string =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');

  const isEmptyValue = (value: any): boolean => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  };

  const getInfoScore = (value: any): number => {
    if (isEmptyValue(value)) return 0;
    if (Array.isArray(value)) {
      return value.reduce((acc, item) => acc + getInfoScore(item), 0);
    }
    if (typeof value === 'object') {
      return Object.entries(value).reduce((acc, [key, val]) => {
        if (key === 'id') return acc;
        return acc + getInfoScore(val);
      }, 0);
    }
    return 1;
  };

  const mergeComplementaryData = (existing: any, incoming: any): any => {
    if (isEmptyValue(existing)) return incoming;
    if (isEmptyValue(incoming)) return existing;

    if (Array.isArray(existing) && Array.isArray(incoming)) {
      if (incoming.length === 0) return existing;
      if (existing.length === 0) return incoming;

      const primitiveArray = existing.every(item => typeof item !== 'object') && incoming.every(item => typeof item !== 'object');
      if (primitiveArray) {
        return Array.from(new Set([...existing, ...incoming]));
      }

      return getInfoScore(incoming) > getInfoScore(existing) ? incoming : existing;
    }

    if (typeof existing === 'object' && typeof incoming === 'object') {
      const merged: Record<string, any> = { ...existing };
      const keys = new Set([...Object.keys(existing), ...Object.keys(incoming)]);

      keys.forEach((key) => {
        if (!(key in incoming)) {
          merged[key] = existing[key];
          return;
        }
        if (!(key in existing)) {
          merged[key] = incoming[key];
          return;
        }
        merged[key] = mergeComplementaryData(existing[key], incoming[key]);
      });

      return merged;
    }

    // Para conflictos entre valores no vacíos, preservar el valor ya almacenado.
    return existing;
  };

  const normalizeRuneType = (value: any): 'invocacion' | 'ritual' => {
    const normalized = normalizeLookupKey(value);
    return normalized.includes('invoc') ? 'invocacion' : 'ritual';
  };

  const inferGemTypeFromName = (name: string): string => {
    const normalized = normalizeLookupKey(name);
    if (normalized.includes('craneo')) return 'craneo';
    if (normalized.includes('topacio')) return 'topacio';
    if (normalized.includes('esmeralda')) return 'esmeralda';
    if (normalized.includes('rubi')) return 'rubi';
    if (normalized.includes('zafiro')) return 'zafiro';
    if (normalized.includes('amatista')) return 'amatista';
    if (normalized.includes('diamante')) return 'diamante';
    return 'gema';
  };

  // ============================================================================
  // 🔧 FUNCIONES ESPECIALIZADAS PARA GEMAS/RUNAS - v0.5.5 MEJORADAS
  // ============================================================================

  /**
   * normalizeEffectStructure - Convierte efectos antiguos (texto) a nueva estructura (objeto)
   * Retrocompatibilidad: Si solo existen "efectos" (sintaxis vieja), migra automáticamente
   */
  const normalizeEffectStructure = (gema: any): any => {
    if (!gema) return gema;

    const normalized = { ...gema };

    // Si ya tiene efectos_por_slot, perfecto (nueva estructura)
    if (normalized.efectos_por_slot && typeof normalized.efectos_por_slot === 'object') {
      return normalized;
    }

    // Si solo tiene efectos (antigua), convertir a efectos_por_slot
    if (normalized.efectos && typeof normalized.efectos === 'object' && !normalized.efectos_por_slot) {
      normalized.efectos_por_slot = {};

      ['arma', 'armadura', 'joyas'].forEach((slot: string) => {
        const textoEfecto = normalized.efectos?.[slot as 'arma' | 'armadura' | 'joyas'];
        if (textoEfecto && typeof textoEfecto === 'string') {
          // Intentar extraer valor numérico del texto
          const numerMatch = textoEfecto.match(/[\d.]+/);
          const valor = numerMatch ? parseFloat(numerMatch[0]) : 0;
          const unidad = textoEfecto.includes('%') ? 'porcentaje' : 'plano';

          (normalized.efectos_por_slot as any)[slot] = {
            valor,
            unidad,
            atributo: `gema_${slot}_efecto`,
            descripcion: textoEfecto,
            tags: [slot, 'gema']
          };
        }
      });
    }

    return normalized;
  };

  /**
   * complementarGemaData - Fusiona dos gemas preservando la más completa en cada campo
   * Especialmente útil para gemas importadas de builds que traen menos detalles
   */
  const complementarGemaData = (existente: any, nueva: any): any => {
    if (!existente) return normalizeEffectStructure(nueva);
    if (!nueva) return normalizeEffectStructure(existente);

    const normExistente = normalizeEffectStructure(existente);
    const normNueva = normalizeEffectStructure(nueva);

    const merged = { ...normExistente };

    // Campos simples: reemplazar si la nueva tiene valor
    const camposSimples = ['nombre', 'tipo', 'calidad', 'rango_calidad', 'descripcion_lore', 'valor_venta'];
    camposSimples.forEach(campo => {
      if (normNueva[campo] && !isEmptyValue(normNueva[campo])) {
        if (isEmptyValue(normExistente[campo])) {
          merged[campo] = normNueva[campo];
        }
      }
    });

    // Requerimientos: merge
    if (normNueva.requerimientos && typeof normNueva.requerimientos === 'object') {
      merged.requerimientos = merged.requerimientos || {};
      if (normNueva.requerimientos.nivel !== undefined && isEmptyValue(merged.requerimientos.nivel)) {
        merged.requerimientos.nivel = normNueva.requerimientos.nivel;
      }
    }

    // Efectos por slot: complementar cada slot
    if (normNueva.efectos_por_slot && typeof normNueva.efectos_por_slot === 'object') {
      merged.efectos_por_slot = merged.efectos_por_slot || {};
      (['arma', 'armadura', 'joyas'] as const).forEach(slot => {
        const efectoNuevo = normNueva.efectos_por_slot[slot];
        const efectoExist = merged.efectos_por_slot[slot];

        if (efectoNuevo && typeof efectoNuevo === 'object') {
          if (!efectoExist) {
            // No existe, copiar el nuevo
            merged.efectos_por_slot[slot] = efectoNuevo;
          } else if (getInfoScore(efectoNuevo) > getInfoScore(efectoExist)) {
            // El nuevo tiene más información, reemplazar
            merged.efectos_por_slot[slot] = {
              ...efectoExist,
              ...efectoNuevo
            };
          }
        }
      });
    }

    // Clasificación: merge
    if (normNueva.clasificacion && typeof normNueva.clasificacion === 'object') {
      merged.clasificacion = merged.clasificacion || {};
      if (normNueva.clasificacion.perfil_general && Array.isArray(normNueva.clasificacion.perfil_general)) {
        merged.clasificacion.perfil_general = [
          ...new Set([
            ...(merged.clasificacion.perfil_general || []),
            ...normNueva.clasificacion.perfil_general
          ])
        ];
      }
      if (normNueva.clasificacion.afinidades && Array.isArray(normNueva.clasificacion.afinidades)) {
        merged.clasificacion.afinidades = [
          ...new Set([
            ...(merged.clasificacion.afinidades || []),
            ...normNueva.clasificacion.afinidades
          ])
        ];
      }
    }

    // Tags: merge
    if (normNueva.tags && Array.isArray(normNueva.tags)) {
      merged.tags = [...new Set([...(merged.tags || []), ...normNueva.tags])];
    }

    return merged;
  };

  /**
   * buscarAspectoExistenteEnHéroe - Busca si un aspecto ya existe en el catálogo del héroe
   * Retorna el aspecto existente y su ID si lo encuentra
   */
  const buscarAspectoExistenteEnHéroe = async (
    clase: string,
    aspectoIncoming: any
  ): Promise<{ existe: boolean; id?: string; aspecto?: any }> => {
    try {
      const heroAspects = await WorkspaceService.loadHeroAspects(clase) || { aspectos: [] };
      const incomingName = normalizeLookupKey(aspectoIncoming?.name || aspectoIncoming?.nombre);
      const incomingId = String(aspectoIncoming?.aspecto_id || aspectoIncoming?.id || '');

      // Búsqueda por ID exacto
      if (incomingId) {
        const byId = heroAspects.aspectos.find((a: any) => String(a.id) === incomingId);
        if (byId) return { existe: true, id: byId.id, aspecto: byId };
      }

      // Búsqueda por nombre normalizado
      if (incomingName) {
        const byName = heroAspects.aspectos.find((a: any) => {
          const aName = normalizeLookupKey(a.name || a.nombre);
          return aName === incomingName;
        });
        if (byName) return { existe: true, id: byName.id, aspecto: byName };
      }

      return { existe: false };
    } catch (error) {
      console.warn('⚠️ [buscarAspectoExistenteEnHéroe] Error al buscar aspecto:', error);
      return { existe: false };
    }
  };

  /**
   * procesarAspectoEnObjeto - Procesa un aspecto que viene en un objeto de equipo
   * Si existe en el héroe, retorna referencia; si no, crea/actualiza en catálogo
   */
  const procesarAspectoEnObjeto = async (
    clase: string,
    aspecto: any,
    heroAspectsRef: any
  ): Promise<{ aspecto_id: string; detalles_from_object?: any }> => {
    if (!aspecto || !aspecto.nombre) {
      return { aspecto_id: '' };
    }

    // Buscar si existe
    const existencia = await buscarAspectoExistenteEnHéroe(clase, aspecto);

    if (existencia.existe && existencia.id) {
      // Existe: retornar ID + detalles del objeto (que puede tener info adicional)
      return {
        aspecto_id: existencia.id,
        detalles_from_object: {
          ...aspecto,
          aspecto_id: existencia.id
        }
      };
    }

    // No existe: crear en catálogo
    const aspectoId = aspecto.aspecto_id || aspecto.id || `aspecto_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const aspectoFull = {
      id: aspectoId,
      name: aspecto.nombre,
      shortName: aspecto.shortName || aspecto.nombre.slice(0, 3),
      effect: aspecto.efecto || aspecto.effect || '',
      category: aspecto.category || aspecto.categoria || 'ofensivo',
      level: aspecto.niveau_actual || aspecto.level || '1/21',
      tags: Array.isArray(aspecto.tags) ? aspecto.tags : [],
      ...aspecto
    };

    heroAspectsRef.aspectos.push(aspectoFull);

    return {
      aspecto_id: aspectoId,
      detalles_from_object: aspecto
    };
  };

  // Mantener referencia para futura reutilización en normalización de aspectos en build.
  void procesarAspectoEnObjeto;

  /**
   * Merge especializado para runas/gemas que maneja acumulación de cantidades
   */
  const mergeAccumulableItem = (
    current: any,
    incoming: any,
    prefix: 'runa' | 'gema'
  ): { merged: any; wasAccumulated: boolean } => {
    // Merge base (información descriptiva)
    const baseMerged = prefix === 'gema'
      ? complementarGemaData(current, { ...incoming, id: current.id })
      : mergeComplementaryData(current, { ...incoming, id: current.id });
    
    // Acumular cantidades si existe el campo en_bolsas
    const currentQuantity = typeof current.en_bolsas === 'number' ? current.en_bolsas : 0;
    const incomingQuantity = typeof incoming.en_bolsas === 'number' ? incoming.en_bolsas : 1; // Si no especifica, asume 1
    const wasAccumulated = incomingQuantity > 0;
    
    return {
      merged: {
        ...baseMerged,
        en_bolsas: currentQuantity + incomingQuantity
      },
      wasAccumulated
    };
  };

  const upsertCatalogEntity = (
    collection: any[],
    incoming: any,
    prefix: 'runa' | 'gema'
  ): { id: string; status: 'added' | 'updated' | 'repeated'; merged: any } => {
    // Normalizar estructura de gema si es necesario
    const normalizedIncoming = prefix === 'gema' ? normalizeEffectStructure(incoming) : incoming;

    const incomingName = normalizeLookupKey(normalizedIncoming?.nombre);
    const incomingId = String(normalizedIncoming?.id || '').trim();

    const idx = collection.findIndex(item => {
      const byId = incomingId && String(item?.id || '') === incomingId;
      const byName = incomingName && normalizeLookupKey(item?.nombre) === incomingName;
      return byId || byName;
    });

    if (idx < 0) {
      // No existe: agregar con cantidad inicial
      const id = incomingId || `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const quantity = typeof normalizedIncoming.en_bolsas === 'number' 
        ? normalizedIncoming.en_bolsas 
        : 1; // Si no especifica cantidad, asume 1
      const merged = { ...normalizedIncoming, id, en_bolsas: quantity };
      collection.push(merged);
      return { id, status: 'added', merged };
    }

    const current = collection[idx];
    
    // Merge con acumulación de cantidades
    const { merged, wasAccumulated } = mergeAccumulableItem(
      current, 
      { ...normalizedIncoming, id: current.id || incomingId },
      prefix
    );

    // Si hubo acumulación o cambios en datos, es 'updated'
    if (wasAccumulated || !areEquivalentContent(current, merged)) {
      collection[idx] = merged;
      return { id: String(merged.id), status: 'updated', merged };
    }

    // Si no hubo cambios ni acumulación, es 'repeated'
    return { id: String(current.id), status: 'repeated', merged: current };
  };

  const normalizeEquipmentSlot = (value: any): string | null => {
    const normalized = normalizeLookupKey(value).replace(/[_\-]/g, ' ');
    if (!normalized) return null;
    if (normalized.includes('anillo') && normalized.includes('2')) return 'anillo2';
    if (normalized.includes('anillo') && normalized.includes('1')) return 'anillo1';
    if (normalized.includes('anillo')) return 'anillo1';
    if (normalized.includes('arma secundaria') || normalized.includes('offhand') || normalized.includes('escudo')) return 'escudo';
    if (normalized.includes('arma')) return 'arma';
    if (normalized.includes('yelmo') || normalized.includes('casco')) return 'yelmo';
    if (normalized.includes('peto') || normalized.includes('pechera')) return 'peto';
    if (normalized.includes('guante')) return 'guantes';
    if (normalized.includes('pantal')) return 'pantalones';
    if (normalized.includes('bota')) return 'botas';
    if (normalized.includes('amuleto')) return 'amuleto';
    const valid = ['yelmo', 'peto', 'guantes', 'pantalones', 'botas', 'arma', 'amuleto', 'anillo1', 'anillo2', 'escudo'];
    return valid.includes(normalized) ? normalized : null;
  };

  const countInputElements = (category: ImageCategory, data: any): number => {
    switch (category) {
      case 'skills':
        return (data?.habilidades_activas?.length || 0) + (data?.habilidades_pasivas?.length || 0);
      case 'glifos':
        return data?.glifos?.length || 0;
      case 'aspectos':
        return (data?.aspectos?.length || 0) + (data?.aspectos_equipados?.length || 0);
      case 'mecanicas':
        return data?.mecanica_clase?.selecciones?.length || 0;
      case 'mundo':
        return data?.eventos?.length || 0;
      case 'runas':
        return data?.runas?.length || 0;
      case 'gemas':
        return data?.gemas?.length || 0;
      case 'build': {
        const buildObj = data?.build && typeof data.build === 'object' ? data.build : data;
        return Array.isArray(buildObj?.piezas) ? buildObj.piezas.length : 0;
      }
      case 'paragon':
        return (data?.tableros_equipados?.length || data?.tableros?.length || 0)
          + (data?.nodos_activados?.length || data?.nodos?.length || 0)
          + (data?.paragon || data?.atributos_paragon ? 1 : 0);
      case 'estadisticas': {
        const stats = data?.estadisticas && typeof data.estadisticas === 'object' ? data.estadisticas : data;
        if (!stats || typeof stats !== 'object') return 0;

        const metadataKeys = new Set([
          'atributo_ref',
          'atributo_nombre',
          'detalles',
          'palabras_clave',
          'texto',
          'texto_original',
          'significado',
          'categoria',
          'fuente',
          'tag'
        ]);

        let count = 0;
        Object.entries(stats as Record<string, any>).forEach(([, sectionValue]) => {
          if (!sectionValue || typeof sectionValue !== 'object' || Array.isArray(sectionValue)) return;
          Object.entries(sectionValue as Record<string, any>).forEach(([childKey, childValue]) => {
            if (metadataKeys.has(childKey)) return;
            if (childValue === null || childValue === undefined) return;

            if (typeof childValue !== 'object' || Array.isArray(childValue)) {
              count++;
              return;
            }

            if ('valor' in childValue || 'atributo_ref' in childValue || 'atributo_nombre' in childValue) {
              count++;
            }
          });
        });

        return count;
      }
      default:
        return Object.keys(data || {}).length;
    }
  };

  const getStatsSectionLabel = (section: string): string => {
    const labels: Record<string, string> = {
      personaje: 'Personaje',
      atributosPrincipales: 'Atributos',
      defensivo: 'Defensivo',
      ofensivo: 'Ofensivo',
      utilidad: 'Utilidad',
      armaduraYResistencias: 'Armadura y Resistencias',
      jcj: 'JcJ',
      moneda: 'Moneda'
    };
    return labels[section] || section;
  };

  const collectStatsEntries = (statsData: any): Array<{ section: string; name: string }> => {
    if (!statsData || typeof statsData !== 'object') return [];

    const entries: Array<{ section: string; name: string }> = [];
    const metadataKeys = new Set([
      'atributo_ref',
      'atributo_nombre',
      'detalles',
      'palabras_clave',
      'texto',
      'texto_original',
      'significado',
      'categoria',
      'fuente',
      'tag'
    ]);

    Object.entries(statsData).forEach(([section, sectionValue]) => {
      if (!sectionValue || typeof sectionValue !== 'object' || Array.isArray(sectionValue)) {
        entries.push({ section, name: getStatsSectionLabel(section) });
        return;
      }

      const children = Object.entries(sectionValue as Record<string, any>);
      if (children.length === 0) {
        entries.push({ section, name: getStatsSectionLabel(section) });
        return;
      }

      let pushedChildren = 0;
      children.forEach(([childKey, childValue]) => {
        if (metadataKeys.has(childKey)) return;

        if (childValue === null || childValue === undefined) return;

        if (typeof childValue !== 'object' || Array.isArray(childValue)) {
          entries.push({ section, name: childKey });
          pushedChildren++;
          return;
        }

        if (childValue && typeof childValue === 'object' && !Array.isArray(childValue)) {
          const childName = childValue.atributo_nombre || childValue.atributo_ref || childKey;
          entries.push({ section, name: String(childName) });
          pushedChildren++;
        }
      });

      if (pushedChildren === 0) {
        entries.push({ section, name: getStatsSectionLabel(section) });
      }
    });

    const seen = new Set<string>();
    return entries.filter(entry => {
      const key = `${entry.section}::${entry.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const buildItemDetails = (
    category: ImageCategory,
    added: string[] = [],
    updated: string[] = [],
    repeated: string[] = []
  ): Array<{ name: string; category: string; status: 'agregado' | 'actualizado' | 'repetido' }> => {
    const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category;
    const parseEntry = (entry: string) => {
      const parts = entry.split(':');
      if (parts.length > 1) {
        const subtype = parts[0].trim();
        const name = parts.slice(1).join(':').trim();
        return {
          name: name || entry,
          category: `${categoryLabel} (${subtype})`
        };
      }
      return { name: entry, category: categoryLabel };
    };

    return [
      ...added.map(item => {
        const parsed = parseEntry(item);
        return { ...parsed, status: 'agregado' as const };
      }),
      ...updated.map(item => {
        const parsed = parseEntry(item);
        return { ...parsed, status: 'actualizado' as const };
      }),
      ...repeated.map(item => {
        const parsed = parseEntry(item);
        return { ...parsed, status: 'repetido' as const };
      })
    ];
  };

  const resolveImportCategory = (category: ImageCategory, runeGemCategory?: 'runas' | 'gemas'): ImageCategory => {
    if (category === 'runas' && runeGemCategory) {
      return runeGemCategory;
    }
    return category;
  };

  // Helper: convierte categoría interna a nombre de archivo en español
  const getFileNameForCategory = (category: ImageCategory): string => {
    const categoryNameMap: Record<ImageCategory, string> = {
      'skills': 'habilidades',
      'glifos': 'glifos',
      'aspectos': 'aspectos',
      'estadisticas': 'estadísticas',
      'paragon': 'paragon',
      'build': 'build',
      'mundo': 'mundo',
      'mecanicas': 'mecanicas',
      'talismanes': 'talismanes',
      'runas': 'runas',
      'gemas': 'gemas',
      'otros': 'otros'
    };
    return categoryNameMap[category] || category;
  };

  const getImportTargetName = (
    category: ImageCategory,
    promptTypeValue: 'heroe' | 'personaje',
    clase: string,
    personajeName: string,
    runeGemCategory?: 'runas' | 'gemas'
  ): string => {
    if (category === 'runas') {
      return runeGemCategory === 'gemas' ? 'Catálogo global de Gemas' : 'Catálogo global de Runas';
    }
    return promptTypeValue === 'heroe' ? clase : personajeName;
  };

  const getImportCategoryLabel = (category: ImageCategory): string => {
    const labels: Record<ImageCategory, string> = {
      skills: 'Habilidades',
      glifos: 'Glifos',
      aspectos: 'Aspectos',
      mecanicas: 'Mecánicas de Clase',
      estadisticas: 'Estadísticas',
      paragon: 'Paragón',
      otros: 'Otros',
      runas: 'Runas',
      gemas: 'Gemas',
      build: 'Equipo',
      mundo: 'Eventos del Mundo',
      talismanes: 'Talismanes'
    };
    return labels[category] || category;
  };

  const showImportResultsModal = (result: ImportResultDetails) => {
    setImportResults(result);
    setShowImportResults(true);
  };

  const finalizeImportReport = async () => {
    setShowImportResults(false);

    try {
      await refreshPersonajes();
    } catch (error) {
      console.error('Error refrescando personajes tras importación:', error);
    }

    await loadCategoryCounts();
    await loadLastSavedImage();
    if (showGallery) {
      await loadGallery();
    }

    if (importResults?.success) {
      capturedImages.forEach(img => URL.revokeObjectURL(img.url));
      if (composedImageUrl) {
        URL.revokeObjectURL(composedImageUrl);
      }

      setCapturedImages([]);
      setComposedImageUrl(null);
      setSelectedGalleryImage(null);
      setSelectedGalleryImageBlob(null);
      setJsonText('');
      setAiExtractedJSON('');
    }
  };

  const executeManualImportJSON = async () => {
    const result = await handleImportJSON();
    showImportResultsModal(result);
  };

  // Importar JSON resultante
  const handleImportJSON = async (options?: { 
    jsonOverride?: string; 
    skipAutoSave?: boolean; 
    personajeIdOverride?: string; // 🆕 ID directo del personaje para usar (sin depender del estado)
  }): Promise<ImportResultDetails> => {
    const jsonPayload = (options?.jsonOverride ?? jsonText ?? '').trim();
    const skipAutoSave = options?.skipAutoSave ?? false;
    const effectiveCategory = selectedCategory;
    const runaGemaEffectiveCategory: 'runas' | 'gemas' = runaGemaType;
    
    // Determinar categoría de validación (puede incluir 'mazmorras' que no está en ImageCategory)
    let validationCategory: string = effectiveCategory;
    if (effectiveCategory === 'runas') {
      validationCategory = runaGemaEffectiveCategory;
    } else if (effectiveCategory === 'mundo' && mundoType === 'mazmorras_aspectos') {
      validationCategory = 'mazmorras';
    }
    
    const effectivePromptType: 'heroe' | 'personaje' =
      effectiveCategory === 'estadisticas'
        ? 'personaje'
        : effectiveCategory === 'build'
          ? 'personaje'
          : effectiveCategory === 'runas'
            ? 'heroe'
          : promptType;
    
    // 🆕 USAR personajeIdOverride si está disponible (tiene prioridad sobre el estado)
    const effectivePersonajeId = options?.personajeIdOverride || selectedPersonajeId || selectedPersonaje?.id || personajes[0]?.id || null;
    const effectiveClase = selectedClase || selectedPersonaje?.clase || availableClasses[0] || '';
    console.log('🎯 [handleImportJSON] Contexto efectivo:', {
      personajeId: effectivePersonajeId,
      personajeIdOverride: options?.personajeIdOverride,
      clase: effectiveClase,
      selectedPersonajeId,
      selectedClase,
      usandoOverride: !!options?.personajeIdOverride
    });
    
    // Validación inicial
    if (!jsonPayload) {
      console.error('❌ [handleImportJSON] Abortado: payload JSON vacío');
      const errorResult: ImportResultDetails = {
        success: false,
        category: effectiveCategory,
        promptType: effectivePromptType,
        targetName: '',
        validationErrors: [],
        rawJSON: options?.jsonOverride ?? jsonText,
        errorMessage: 'No hay JSON para importar'
      };
      showToast('❌ Ingresa un JSON válido', 'error');
      return errorResult;
    }

    let shouldReload = false;
    let parsedData: any;
    
    setImporting(true);
    
    try {
      // 1. PARSEAR JSON
      parsedData = JSON.parse(jsonPayload);
      
      // 2. VALIDAR ESTRUCTURA
      const validation = validateJSONByCategory(validationCategory, parsedData);
      const resultCategory = resolveImportCategory(effectiveCategory, runaGemaEffectiveCategory);
      const targetPersonajeName = personajes.find(p => p.id === effectivePersonajeId)?.nombre || '';
      const resultTargetName = getImportTargetName(
        effectiveCategory,
        effectivePromptType,
        effectiveClase,
        targetPersonajeName,
        runaGemaEffectiveCategory
      );
      
      // Si hay errores críticos, retornar sin importar
      if (!validation.isValid) {
        const errorResult: ImportResultDetails = {
          success: false,
          category: resultCategory,
          promptType: effectivePromptType,
          targetName: resultTargetName,
          validationErrors: [...validation.errors, ...validation.warnings],
          rawJSON: options?.jsonOverride ?? jsonText,
          parsedJSON: parsedData,
          errorMessage: 'El JSON no tiene la estructura esperada'
        };
        setImporting(false);
        return errorResult;
      }
      
      const data = parsedData;
      const totalInputItems = countInputElements(validationCategory as ImageCategory, data);
      let itemsImported = 0;
      let itemsUpdated = 0;
      let itemsRepeated = 0;
      const fieldsAdded: string[] = [];
      const addedItems: string[] = [];
      const updatedItemsList: string[] = [];
      const repeatedItems: string[] = [];
      
      // =============== CATEGORÍAS GLOBALES (Mundo, Runas/Gemas) ===============
      // Estas categorías no requieren héroe ni personaje, pero SÍ requieren workspace
      if (effectiveCategory === 'mundo') {
        // Determinar si son eventos del mundo o mazmorras de aspectos
        const effectiveMundoType = mundoType;
        
        if (effectiveMundoType === 'mazmorras_aspectos') {
          console.log('🎰 [IMPORTACIÓN MAZMORRAS] Iniciando importación de mazmorras de aspectos');
          console.log('📄 [IMPORTACIÓN MAZMORRAS] JSON recibido:', JSON.stringify(data, null, 2));
          
          // =============== MAZMORRAS DE ASPECTOS ===============
          // El JSON debe tener una propiedad "mazmorras" con un array
          if (!data.mazmorras || !Array.isArray(data.mazmorras)) {
            console.error('❌ [IMPORTACIÓN MAZMORRAS] Error: JSON sin propiedad "mazmorras" o no es array');
            console.error('📄 [IMPORTACIÓN MAZMORRAS] Estructura recibida:', { mazmorras: data.mazmorras, tipo: typeof data.mazmorras });
            showToast('⚠️ El JSON debe contener una propiedad "mazmorras" con un array', 'error');
            const errorResult: ImportResultDetails = {
              success: false,
              category: 'mundo',
              promptType: 'heroe',
              targetName: 'Mazmorras de Aspectos',
              validationErrors: [{ field: 'mazmorras', expected: 'Array de objetos {mazmorra, aspecto, palabras_clave}', received: typeof data.mazmorras, severity: 'error' }],
              rawJSON: jsonPayload,
              parsedJSON: parsedData,
              errorMessage: 'JSON sin propiedad "mazmorras" o no es un array'
            };
            setImporting(false);
            return errorResult;
          }

          const mazmorrasArray = data.mazmorras;
          console.log(`📋 [IMPORTACIÓN MAZMORRAS] Total de mazmorras en el array: ${mazmorrasArray.length}`);
          
          // Validar estructura básica de cada mazmorra
          const invalidMazmorras = mazmorrasArray.filter((m: any) => !m.mazmorra || !m.aspecto || !m.mazmorra.clase_requerida);
          if (invalidMazmorras.length > 0) {
            console.error(`❌ [IMPORTACIÓN MAZMORRAS] ${invalidMazmorras.length} mazmorras con estructura inválida:`, invalidMazmorras);
            showToast('⚠️ Cada mazmorra debe tener "mazmorra" con "clase_requerida" y "aspecto"', 'error');
            const errorResult: ImportResultDetails = {
              success: false,
              category: 'mundo',
              promptType: 'heroe',
              targetName: 'Mazmorras de Aspectos',
              validationErrors: [{ field: 'estructura', expected: 'JSON con {mazmorra: {clase_requerida}, aspecto}', received: 'JSON sin estructura correcta', severity: 'error' }],
              rawJSON: jsonPayload,
              parsedJSON: parsedData,
              errorMessage: 'JSON sin estructura correcta para mazmorra de aspectos'
            };
            setImporting(false);
            return errorResult;
          }

          try {
            console.log('💾 [IMPORTACIÓN MAZMORRAS] Cargando archivo mazmorras_data.json...');
            // Cargar archivo de mazmorras global
            const mazmorrasData = await WorkspaceService.loadWorldData('mazmorras') || { mazmorras: [] };
            const mazmorrasGuardadas: any[] = mazmorrasData.mazmorras || [];
            console.log(`💾 [IMPORTACIÓN MAZMORRAS] Mazmorras existentes en archivo: ${mazmorrasGuardadas.length}`);

            let totalMazmorrasImportadas = 0;
            let totalMazmorrasActualizadas = 0;
            const clasesAfectadas = new Set<string>();

            // Procesar cada mazmorra
            for (const mazmorraData of mazmorrasArray) {
              const { mazmorra, aspecto, palabras_clave } = mazmorraData;
              console.log(`🎰 [IMPORTACIÓN MAZMORRAS] Procesando mazmorra: "${mazmorra.nombre}"`);
              
              // Extraer clase del héroe
              const claseHeroe = mazmorra.clase_requerida;
              console.log(`🧙 [IMPORTACIÓN MAZMORRAS] Clase requerida: ${claseHeroe}`);
              
              // Verificar que la clase sea válida
              if (!availableClasses.includes(claseHeroe)) {
                console.warn(`⚠️ [IMPORTACIÓN MAZMORRAS] Clase "${claseHeroe}" no reconocida, saltando...`);
                continue;
              }

              clasesAfectadas.add(claseHeroe);

              // Generar ID único para la mazmorra si no existe
              const mazmorraId = `mazmorra_${mazmorra.nombre.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
              console.log(`🎯 [IMPORTACIÓN MAZMORRAS] ID generado: ${mazmorraId}`);

              // ====== PASO 1: Guardar/Actualizar aspecto en archivo del héroe ======
              const aspectoId = aspecto.id || aspecto.aspecto_id || `aspecto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              console.log(`🎨 [IMPORTACIÓN MAZMORRAS] Guardando aspecto "${aspecto.name}" en archivo del héroe ${claseHeroe}...`);
              
              // Cargar aspectos del héroe
              const heroeData = await WorkspaceService.loadHeroAspects(claseHeroe) || { aspectos: [] };
              const aspectosHeroe = heroeData.aspectos || [];
              
              // Preparar aspecto completo con formato correcto
              const aspectoCompleto = {
                id: aspectoId,
                name: aspecto.name,
                shortName: aspecto.shortName,
                effect: aspecto.effect,
                level: aspecto.level || "1/21",
                category: aspecto.category,
                tags: aspecto.tags || [],
                aspecto_id: aspectoId,  // Duplicado del ID (formato héroe)
                detalles: aspecto.detalles || []  // Array vacío por defecto
              };
              
              // Verificar si el aspecto ya existe en el héroe
              const aspectoExistenteIndex = aspectosHeroe.findIndex((a: any) => a.id === aspectoId || a.aspecto_id === aspectoId);
              
              if (aspectoExistenteIndex >= 0) {
                console.log(`🔄 [IMPORTACIÓN MAZMORRAS] Aspecto ya existe en ${claseHeroe}, actualizando...`);
                aspectosHeroe[aspectoExistenteIndex] = {
                  ...aspectosHeroe[aspectoExistenteIndex],
                  ...aspectoCompleto
                };
              } else {
                console.log(`➕ [IMPORTACIÓN MAZMORRAS] Agregando nuevo aspecto a ${claseHeroe}`);
                aspectosHeroe.push(aspectoCompleto);
              }
              
              // Guardar aspectos actualizados del héroe
              heroeData.aspectos = aspectosHeroe;
              await WorkspaceService.saveHeroAspects(claseHeroe, heroeData);
              console.log(`✅ [IMPORTACIÓN MAZMORRAS] Aspecto guardado en ${claseHeroe}_aspectos.json`);

              // ====== PASO 2: Guardar solo ID del aspecto en mazmorras_data.json ======
              const mazmorraRegistro = {
                id: mazmorraId,
                nombre: mazmorra.nombre,
                descripcion: mazmorra.descripcion || '',
                clase_requerida: claseHeroe,
                aspecto_id: aspectoId,  // Solo el ID, no el objeto completo
                palabras_clave: palabras_clave || [],
                fecha_registro: new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString()
              };

              // Verificar si ya existe por nombre de mazmorra
              const existingIndex = mazmorrasGuardadas.findIndex(m => m.nombre === mazmorra.nombre);
              console.log(`🔍 [IMPORTACIÓN MAZMORRAS] ¿Mazmorra "${mazmorra.nombre}" ya existe? ${existingIndex >= 0 ? 'Sí (actualizar)' : 'No (crear nueva)'}`);
              
              if (existingIndex >= 0) {
                // Actualizar existente manteniendo el ID y fecha de registro
                mazmorraRegistro.id = mazmorrasGuardadas[existingIndex].id || mazmorraId;
                mazmorraRegistro.fecha_registro = mazmorrasGuardadas[existingIndex].fecha_registro || mazmorraRegistro.fecha_registro;
                mazmorrasGuardadas[existingIndex] = mazmorraRegistro;
                totalMazmorrasActualizadas++;
                updatedItemsList.push(`${mazmorra.nombre} (${claseHeroe})`);
              } else {
                // Agregar nueva
                mazmorrasGuardadas.push(mazmorraRegistro);
                totalMazmorrasImportadas++;
                addedItems.push(`${mazmorra.nombre} (${claseHeroe})`);
              }
            }

            // Guardar archivo de mazmorras global
            mazmorrasData.mazmorras = mazmorrasGuardadas;
            console.log(`💾 [IMPORTACIÓN MAZMORRAS] Guardando en mazmorras_data.json (raiz del workspace)...`);
            console.log(`💾 [IMPORTACIÓN MAZMORRAS] Total de mazmorras en archivo: ${mazmorrasGuardadas.length}`);
            await WorkspaceService.saveWorldData('mazmorras', mazmorrasData);
            console.log(`✅ [IMPORTACIÓN MAZMORRAS] Archivo mazmorras_data.json guardado exitosamente`);

            itemsImported = totalMazmorrasImportadas;
            itemsUpdated = totalMazmorrasActualizadas;
            shouldReload = true;

            const resumenClases = Array.from(clasesAfectadas).join(', ');
            console.log(`✅ [IMPORTACIÓN MAZMORRAS] Resumen final:`);
            console.log(`   - Nuevas: ${totalMazmorrasImportadas}`);
            console.log(`   - Actualizadas: ${totalMazmorrasActualizadas}`);
            console.log(`   - Clases afectadas: ${resumenClases}`);
            console.log(`   - Archivo: mazmorras_data.json (GLOBAL, en raíz del workspace)`);
            showToast(`✅ ${totalMazmorrasImportadas + totalMazmorrasActualizadas} mazmorra(s) guardadas en archivo GLOBAL (clases: ${resumenClases})`, 'success');

            // Auto-guardar JSON + imagen en galería
            if (!skipAutoSave) {
              await autoSaveJSONAfterImport(jsonPayload);
            }

            const mazmorraDungeonResult: ImportResultDetails = {
              success: true,
              category: 'mundo',
              promptType: 'heroe',
              targetName: `Mundo → Mazmorras de Aspectos (archivo global: mazmorras_data.json)`,
              jsonInputsProcessed: mazmorrasArray.length,
              itemsImported,
              itemsUpdated,
              itemsSkipped: 0,
              addedItems,
              updatedItemsList,
              repeatedItems: [],
              fieldsAdded: addedItems,
              validationErrors: validation.warnings,
              rawJSON: jsonPayload,
              totalInputItems: mazmorrasArray.length,
              parsedJSON: parsedData
            };

            setJsonText('');
            setImporting(false);
            return mazmorraDungeonResult;

          } catch (error: any) {
            console.error('❌ Error guardando aspectos de mazmorra:', error);
            showToast(`❌ ${error.message}`, 'error');
            
            const errorResult: ImportResultDetails = {
              success: false,
              category: 'mundo',
              promptType: 'heroe',
              targetName: 'Mazmorras de Aspectos',
              validationErrors: [],
              rawJSON: jsonPayload,
              parsedJSON: parsedData,
              errorMessage: error.message
            };
            setImporting(false);
            return errorResult;
          }
        } else {
          // =============== EVENTOS DEL MUNDO ===============
        // Importar eventos del mundo (guarda en workspace físico como world_data.json)
        if (data.eventos || data.grafo || data.indice_recursos) {
          try {
            // Verificar workspace antes de importar
            const WorkspaceService = (await import('../../services/WorkspaceService')).WorkspaceService;
            
            if (!WorkspaceService.isWorkspaceLoaded()) {
              showToast('⚠️ Debes abrir/crear un workspace primero. Ve a la sección Mundo → botón "Abrir/Crear Workspace"', 'error');
              const errorResult: ImportResultDetails = {
                success: false,
                category: 'mundo',
                promptType: 'heroe',
                targetName: 'Sistema Global',
                validationErrors: [],
                rawJSON: jsonPayload,
                parsedJSON: parsedData,
                errorMessage: 'No hay workspace configurado. Abre la sección Mundo y selecciona un workspace.'
              };
              setImporting(false);
              return errorResult;
            }
            
            // Utilizar WorldService que ahora guarda en workspace físico
            const WorldService = (await import('../../services/WorldService')).WorldService;
            await WorldService.importFromJSON(data);
            itemsImported = data.eventos?.length || 0;
            showToast(`✅ ${itemsImported} eventos importados al sistema de progresión del mundo`, 'success');
            shouldReload = true;
            
            // Auto-guardar JSON + imagen en galería
            if (!skipAutoSave && itemsImported > 0) {
              await autoSaveJSONAfterImport(jsonPayload);
            }
            
            const mundoResult: ImportResultDetails = {
              success: true,
              category: 'mundo',
              promptType: 'heroe',
              targetName: 'Sistema Global',
              jsonInputsProcessed: 1,
              itemsImported,
              itemsUpdated: 0,
              itemsSkipped: 0,
              addedItems: data.eventos?.map((e: any) => e.nombre) || [],
              updatedItemsList: [],
              repeatedItems: [],
              fieldsAdded: data.eventos?.map((e: any) => e.id) || [],
              validationErrors: validation.warnings,
              rawJSON: jsonPayload,
              totalInputItems,
              parsedJSON: parsedData
            };
            
            setJsonText('');
            setImporting(false);
            return mundoResult;
            
          } catch (error: any) {
            console.error('❌ Error guardando datos del mundo:', error);
            const errorMsg = error.message?.includes('workspace')
              ? 'No hay workspace configurado. Ve a la sección Mundo y abre/crea un workspace primero.'
              : `Error importando eventos: ${error.message}`;
            showToast(`❌ ${errorMsg}`, 'error');
            
            const errorResult: ImportResultDetails = {
              success: false,
              category: 'mundo',
              promptType: 'heroe',
              targetName: 'Sistema Global',
              validationErrors: [],
              rawJSON: jsonPayload,
              parsedJSON: parsedData,
              errorMessage: errorMsg
            };
            setImporting(false);
            return errorResult;
          }
        } else {
          showToast('⚠️ El JSON debe contener al menos el campo "eventos" con un array de eventos', 'error');
          const errorResult: ImportResultDetails = {
            success: false,
            category: 'mundo',
            promptType: 'heroe',
            targetName: 'Sistema Global',
            validationErrors: [],
            rawJSON: jsonPayload,
            parsedJSON: parsedData,
            errorMessage: 'JSON sin campo "eventos"'
          };
          setImporting(false);
          return errorResult;
        }
      }
      } // Fin del if effectiveCategory === 'mundo'
      
      if (effectiveCategory === 'runas') {
        // Runas/Gemas globales (no requieren héroe ni personaje)
        if (runaGemaEffectiveCategory === 'gemas') {
          if (Array.isArray(data.gemas) && data.gemas.length > 0) {
            const globalGems = await WorkspaceService.loadHeroGems('global') || { gemas: [] };
            (data.gemas as any[]).forEach((gema: any) => {
              const gemName = String(gema?.nombre || gema?.id || '').trim();
              if (!gemName) return;

              const gemCandidate = {
                id: gema?.id,
                tipo_objeto: 'gema',
                nombre: gemName,
                tipo: gema?.tipo || inferGemTypeFromName(gemName),
                calidad: gema?.calidad,
                rango_calidad: gema?.rango_calidad,
                requerimientos: gema?.requerimientos && typeof gema.requerimientos === 'object'
                  ? gema.requerimientos
                  : (gema?.nivel_requerido !== undefined ? { nivel: gema.nivel_requerido } : undefined),
                efectos: gema?.efectos && typeof gema.efectos === 'object' ? gema.efectos : {},
                efectos_por_slot: gema?.efectos_por_slot && typeof gema.efectos_por_slot === 'object'
                  ? gema.efectos_por_slot
                  : undefined,
                descripcion_lore: gema?.descripcion_lore,
                descripcion: gema?.descripcion,
                nivel_requerido: gema?.nivel_requerido,
                valor_venta: gema?.valor_venta,
                en_bolsas: gema?.en_bolsas,
                clasificacion: gema?.clasificacion && typeof gema.clasificacion === 'object'
                  ? gema.clasificacion
                  : undefined,
                tags: Array.isArray(gema?.tags) ? gema.tags : undefined
              };

              const result = upsertCatalogEntity(globalGems.gemas as any[], gemCandidate, 'gema');
              if (result.status === 'added') {
                itemsImported++;
                addedItems.push(gemName);
              } else if (result.status === 'updated') {
                itemsUpdated++;
                updatedItemsList.push(gemName);
              } else {
                itemsRepeated++;
                repeatedItems.push(gemName);
              }
              fieldsAdded.push(gemName);
            });

            await WorkspaceService.saveHeroGems('global', globalGems);
            const totalGems = itemsImported + itemsUpdated;
            const accumulatedMsg = itemsUpdated > 0 ? ` (${itemsUpdated} acumuladas)` : '';
            showToast(`✅ ${totalGems} gemas procesadas${accumulatedMsg}`, 'success');
            shouldReload = true;
            
            // Auto-guardar JSON + imagen
            if (!skipAutoSave && totalGems > 0) {
              await autoSaveJSONAfterImport(jsonPayload);
            }
          }
        } else {
          if (Array.isArray(data.runas) && data.runas.length > 0) {
            const globalRunes = await WorkspaceService.loadHeroRunes('global') || { runas: [] };
            (data.runas as any[]).forEach((runa: any) => {
              const runeName = String(runa?.nombre || runa?.id || '').trim();
              if (!runeName) return;

              const runeCandidate = {
                id: runa?.id,
                nombre: runeName,
                rareza: runa?.rareza || 'magico',
                tipo: normalizeRuneType(runa?.tipo || runa?.subtipo || runa?.calidad_runa),
                efecto: runa?.efecto || runa?.descripcion || '',
                descripcion: runa?.descripcion,
                requerimiento: runa?.requerimiento,
                puede_desguazar: runa?.puede_desguazar,
                objeto_origen: runa?.objeto_origen,
                valor_venta: runa?.valor_venta,
                en_bolsas: runa?.en_bolsas,
                tags: Array.isArray(runa?.tags) ? runa.tags : undefined
              };

              const result = upsertCatalogEntity(globalRunes.runas as any[], runeCandidate, 'runa');
              if (result.status === 'added') {
                itemsImported++;
                addedItems.push(runeName);
              } else if (result.status === 'updated') {
                itemsUpdated++;
                updatedItemsList.push(runeName);
              } else {
                itemsRepeated++;
                repeatedItems.push(runeName);
              }
              fieldsAdded.push(runeName);
            });

            await WorkspaceService.saveHeroRunes('global', globalRunes);
            const totalRunes = itemsImported + itemsUpdated;
            const accumulatedMsg = itemsUpdated > 0 ? ` (${itemsUpdated} acumuladas)` : '';
            showToast(`✅ ${totalRunes} runas procesadas${accumulatedMsg}`, 'success');
            shouldReload = true;
            
            // Auto-guardar JSON + imagen
            if (!skipAutoSave && totalRunes > 0) {
              await autoSaveJSONAfterImport(jsonPayload);
            }
          }
        }
        
        const runasResult: ImportResultDetails = {
          success: true,
          category: runaGemaEffectiveCategory,
          promptType: 'heroe',
          targetName: 'Catálogo Global',
          jsonInputsProcessed: 1,
          itemsImported,
          itemsUpdated,
          itemsSkipped: itemsRepeated,
          addedItems,
          updatedItemsList,
          repeatedItems,
          fieldsAdded,
          validationErrors: validation.warnings,
          rawJSON: jsonPayload,
          totalInputItems,
          parsedJSON: parsedData
        };
        
        setJsonText('');
        // Refrescar siempre después de importación exitosa
        if (itemsImported > 0 || itemsUpdated > 0 || fieldsAdded.length > 0) {
          await refreshPersonajes();
        }
        setImporting(false);
        return runasResult;
      }
      
      // =============== CATEGORÍAS DE HÉROE Y PERSONAJE ===============
      if (effectivePromptType === 'heroe') {
        // =============== GUARDAR EN HÉROE ===============
        
        if (!effectiveClase) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: resultCategory,
            promptType: effectivePromptType,
            targetName: '',
            validationErrors: validation.warnings,
            rawJSON: jsonText,
            parsedJSON: parsedData,
            errorMessage: 'Selecciona una clase primero'
          };
          showToast('❌ Selecciona una clase primero', 'error');
          setImporting(false);
          return errorResult;
        }

        const clase = effectiveClase;
        
        switch (effectiveCategory) {
          case 'skills':
            if (data.habilidades_activas || data.habilidades_pasivas) {
              // 🔄 CARGAR habilidades existentes del héroe
              const heroSkills = await WorkspaceService.loadHeroSkills(clase) || { 
                habilidades_activas: [], 
                habilidades_pasivas: [] 
              };

              const activasNuevas = data.habilidades_activas || [];
              const pasivasNuevas = data.habilidades_pasivas || [];

              // 🔄 MERGE activas (por nombre)
              activasNuevas.forEach((skill: any) => {
                const idx = heroSkills.habilidades_activas.findIndex((s: any) => s.nombre === skill.nombre);
                const skillId = idx >= 0 ? heroSkills.habilidades_activas[idx].id : (skill.id || `skill_activa_${skill.nombre.toLowerCase().replace(/\s+/g, '_')}`);
                const skillWithId = { ...skill, id: skillId };
                if (idx >= 0) {
                  if (areEquivalentContent(heroSkills.habilidades_activas[idx], skillWithId)) {
                    itemsRepeated++;
                    repeatedItems.push(`Activa: ${skill.nombre}`);
                  } else {
                    heroSkills.habilidades_activas[idx] = skillWithId;
                    itemsUpdated++;
                    updatedItemsList.push(`Activa: ${skill.nombre}`);
                  }
                } else {
                  heroSkills.habilidades_activas.push(skillWithId);
                  itemsImported++;
                  addedItems.push(`Activa: ${skill.nombre}`);
                }
                fieldsAdded.push(`Activa: ${skill.nombre}`);
              });

              // 🔄 MERGE pasivas (por nombre)
              pasivasNuevas.forEach((skill: any) => {
                const idx = heroSkills.habilidades_pasivas.findIndex((s: any) => s.nombre === skill.nombre);
                const skillId = idx >= 0 ? heroSkills.habilidades_pasivas[idx].id : (skill.id || `skill_pasiva_${skill.nombre.toLowerCase().replace(/\s+/g, '_')}`);
                const skillWithId = { ...skill, id: skillId };
                if (idx >= 0) {
                  if (areEquivalentContent(heroSkills.habilidades_pasivas[idx], skillWithId)) {
                    itemsRepeated++;
                    repeatedItems.push(`Pasiva: ${skill.nombre}`);
                  } else {
                    heroSkills.habilidades_pasivas[idx] = skillWithId;
                    itemsUpdated++;
                    updatedItemsList.push(`Pasiva: ${skill.nombre}`);
                  }
                } else {
                  heroSkills.habilidades_pasivas.push(skillWithId);
                  itemsImported++;
                  addedItems.push(`Pasiva: ${skill.nombre}`);
                }
                fieldsAdded.push(`Pasiva: ${skill.nombre}`);
              });
              
              await WorkspaceService.saveHeroSkills(clase, heroSkills);
              showToast(`✅ ${itemsImported + itemsUpdated} habilidades procesadas en ${clase} (${itemsImported} nuevas, ${itemsUpdated} actualizadas)`, 'success');
              shouldReload = true;
            }
            break;
          
          case 'glifos':
            if (data.glifos) {
              // 🔄 CARGAR glifos existentes del héroe
              const heroGlyphs = await WorkspaceService.loadHeroGlyphs(clase) || { glifos: [] };

              // 🔄 MERGE glifos (por nombre)
              (data.glifos as any[]).forEach((glyph: any) => {
                const idx = heroGlyphs.glifos.findIndex((g: any) => g.nombre === glyph.nombre);
                const glyphId = idx >= 0 ? heroGlyphs.glifos[idx].id : (glyph.id || `glifo_${glyph.nombre.toLowerCase().replace(/\s+/g, '_')}`);
                
                // ⚠️ CRÍTICO: Eliminar nivel_actual antes de guardar en héroe
                // En héroe solo se guardan detalles del glifo, NO niveles de personajes
                const { nivel_actual, nivel_maximo, ...glyphDetails } = glyph;
                const glyphWithId = { ...glyphDetails, id: glyphId };
                
                if (idx >= 0) {
                  if (areEquivalentContent(heroGlyphs.glifos[idx], glyphWithId)) {
                    itemsRepeated++;
                    repeatedItems.push(glyph.nombre);
                  } else {
                    heroGlyphs.glifos[idx] = glyphWithId;
                    itemsUpdated++;
                    updatedItemsList.push(glyph.nombre);
                  }
                } else {
                  heroGlyphs.glifos.push(glyphWithId);
                  itemsImported++;
                  addedItems.push(glyph.nombre);
                }
                fieldsAdded.push(glyph.nombre);
              });
              
              await WorkspaceService.saveHeroGlyphs(clase, heroGlyphs);
              showToast(`✅ ${itemsImported + itemsUpdated} glifos procesados en ${clase} (${itemsImported} nuevos, ${itemsUpdated} actualizados)`, 'success');
              shouldReload = true;
            }
            break;
          
          case 'aspectos':
            if (data.aspectos || data.aspectos_equipados) {
              const aspectsNuevos = data.aspectos || data.aspectos_equipados || [];
              
              // 🔄 CARGAR aspectos existentes del héroe
              const heroAspects = await WorkspaceService.loadHeroAspects(clase) || { aspectos: [] };

              // 🔄 MERGE aspectos (por nombre o shortName)
              aspectsNuevos.forEach((aspect: any) => {
                const aspectName = aspect.nombre || aspect.name || aspect.shortName;
                const idx = heroAspects.aspectos.findIndex((a: any) => 
                  (a.nombre && a.nombre === aspectName) || 
                  (a.shortName && a.shortName === aspectName) ||
                  (a.name && a.name === aspectName)
                );
                const aspectId = idx >= 0 ? heroAspects.aspectos[idx].id : (aspect.id || `aspecto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                const aspectWithId = { ...aspect, id: aspectId };
                if (idx >= 0) {
                  if (areEquivalentContent(heroAspects.aspectos[idx], aspectWithId)) {
                    itemsRepeated++;
                    repeatedItems.push(aspectName);
                  } else {
                    heroAspects.aspectos[idx] = aspectWithId;
                    itemsUpdated++;
                    updatedItemsList.push(aspectName);
                  }
                } else {
                  heroAspects.aspectos.push(aspectWithId);
                  itemsImported++;
                  addedItems.push(aspectName);
                }
                fieldsAdded.push(aspectName);
              });
              
              await WorkspaceService.saveHeroAspects(clase, heroAspects);
              showToast(`✅ ${itemsImported + itemsUpdated} aspectos procesados en ${clase} (${itemsImported} nuevos, ${itemsUpdated} actualizados)`, 'success');
              shouldReload = true;
            }
            break;

          case 'mecanicas':
            if (data.mecanica_clase) {
              const mecanica = data.mecanica_clase;
              
              // Asegurar estructura correcta
              mecanica.id = mecanica.id || `mecanica_${clase.toLowerCase()}_${Date.now()}`;
              mecanica.tipo = 'mecanica_clase';
              mecanica.clase = clase;
              
              // Procesar selecciones
              if (mecanica.selecciones && Array.isArray(mecanica.selecciones)) {
                mecanica.selecciones = mecanica.selecciones.map((sel: any) => ({
                  id: sel.id || `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  nombre: sel.nombre || '',
                  categoria: sel.categoria || 'general',
                  grupo: sel.grupo || 'principal',
                  nivel: sel.nivel || 1,
                  nivel_maximo: sel.nivel_maximo || 1,
                  activo: sel.activo !== undefined ? sel.activo : true,
                  efecto: sel.efecto || '',
                  detalles: Array.isArray(sel.detalles) ? sel.detalles : [],
                  tags: Array.isArray(sel.tags) ? sel.tags : []
                }));
              }
              
              // Cargar mecánicas existentes del héroe
              const heroMechanics = await WorkspaceService.loadHeroClassMechanics(clase) || { mecanicas: [] };
              
              // Buscar si ya existe
              const idx = heroMechanics.mecanicas.findIndex((m: any) => m.nombre === mecanica.nombre);
              
              if (idx >= 0) {
                if (areEquivalentContent(heroMechanics.mecanicas[idx], mecanica)) {
                  itemsRepeated++;
                  repeatedItems.push(mecanica.nombre);
                } else {
                  heroMechanics.mecanicas[idx] = mecanica;
                  itemsUpdated++;
                  updatedItemsList.push(mecanica.nombre);
                }
              } else {
                heroMechanics.mecanicas.push(mecanica);
                itemsImported++;
                addedItems.push(mecanica.nombre);
              }
              fieldsAdded.push(mecanica.nombre);
              
              await WorkspaceService.saveHeroClassMechanics(clase, heroMechanics);
              showToast(`✅ Mecánica "${mecanica.nombre}" procesada en ${clase}`, 'success');
              shouldReload = true;
            }
            break;

          case 'build':
            showToast('ℹ️ El equipamiento/build se importa en modo Personaje.', 'info');
            break;
          
          case 'estadisticas':
            // ⚠️ Estadísticas NO se guardan en modo héroe, solo en personajes
            showToast('ℹ️ Las estadísticas se importan en modo Personaje.', 'info');
            break;
          
          case 'paragon':
            
            // Determinar qué tipo de dato importar según paragonType
            if (paragonType === 'tablero') {
              if (data.tableros && Array.isArray(data.tableros)) {
                const heroBoards = await WorkspaceService.loadParagonBoards(clase) || { tableros: [] };
                
                (data.tableros as any[]).forEach((board: any) => {
                  const idx = heroBoards.tableros.findIndex((b: any) => b.nombre === board.nombre);
                  const boardId = idx >= 0 ? heroBoards.tableros[idx].id : (board.id || `tablero_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                  const boardWithId = { ...board, id: boardId };
                  
                  if (idx >= 0) {
                    if (areEquivalentContent(heroBoards.tableros[idx], boardWithId)) {
                      itemsRepeated++;
                      repeatedItems.push(board.nombre);
                    } else {
                      heroBoards.tableros[idx] = boardWithId;
                      itemsUpdated++;
                      updatedItemsList.push(board.nombre);
                    }
                  } else {
                    heroBoards.tableros.push(boardWithId);
                    itemsImported++;
                    addedItems.push(board.nombre);
                  }
                  fieldsAdded.push(board.nombre);
                });
                
                await WorkspaceService.saveParagonBoards(clase, heroBoards);
                showToast(`✅ ${itemsImported + itemsUpdated} tableros procesados en ${clase}`, 'success');
                shouldReload = true;
              }
            } else if (paragonType === 'nodo') {
              // Importar nodos detectando rareza automáticamente desde el JSON
              if (data.nodos && Array.isArray(data.nodos)) {
                const heroNodes = await WorkspaceService.loadParagonNodes(clase) || { 
                  nodos_normales: [],
                  nodos_magicos: [],
                  nodos_raros: [],
                  nodos_legendarios: []
                };
                
                // Clasificar cada nodo según su rareza
                for (const node of (data.nodos as any[])) {
                  if (!node.rareza) {
                    console.warn(`⚠️ Nodo sin rareza: ${node.nombre}. Asignando 'normal' por defecto.`);
                    node.rareza = 'normal';
                  }

                  // Determinar el array correcto según rareza
                  let nodosKey: string;
                  let nodeList: any[];
                  
                  switch (node.rareza) {
                    case 'normal':
                      nodosKey = 'nodos_normales';
                      nodeList = heroNodes.nodos_normales;
                      break;
                    case 'magico':
                      nodosKey = 'nodos_magicos';
                      nodeList = heroNodes.nodos_magicos;
                      break;
                    case 'raro':
                      nodosKey = 'nodos_raros';
                      nodeList = heroNodes.nodos_raros;
                      break;
                    case 'legendario':
                      nodosKey = 'nodos_legendarios';
                      nodeList = heroNodes.nodos_legendarios;
                      break;
                    default:
                      console.warn(`⚠️ Rareza desconocida '${node.rareza}' para nodo ${node.nombre}. Asignando a normales.`);
                      nodosKey = 'nodos_normales';
                      nodeList = heroNodes.nodos_normales;
                  }
                  
                  // ⚡ NUEVA LÓGICA v0.5.4: Detectar y procesar zócalos de glifo
                  // Si el nodo es un zócalo de glifo con data completa del glifo, enlazar con glifo existente
                  if (node.glifo_info && typeof node.glifo_info === 'object') {
                    
                    try {
                      // Cargar catálogo de glifos del héroe
                      const heroGlyphs = await WorkspaceService.loadHeroGlyphs(clase) || { glifos: [] };
                      
                      // Buscar si el glifo ya existe en el catálogo (por nombre)
                      const glyphName = node.glifo_info.nombre;
                      const existingGlyphIndex = heroGlyphs.glifos.findIndex((g: any) => g.nombre === glyphName);
                      
                      let glyphId: string;
                      
                      if (existingGlyphIndex >= 0) {
                        // Glifo existe: Actualizar solo detalles[] con estado activo actual
                        glyphId = heroGlyphs.glifos[existingGlyphIndex].id || `glifo_${glyphName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
                        
                        // Actualizar detalles del glifo con el estado activo actual
                        if (node.glifo_info.detalles && Array.isArray(node.glifo_info.detalles)) {
                          heroGlyphs.glifos[existingGlyphIndex] = {
                            ...heroGlyphs.glifos[existingGlyphIndex],
                            detalles: node.glifo_info.detalles // Actualizar con estado activo actual
                          };
                        }
                      } else {
                        // Glifo NO existe: Crear en catálogo
                        glyphId = node.glifo_info.id || `glifo_${glyphName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
                        
                        const newGlyph = {
                          ...node.glifo_info,
                          id: glyphId
                        };
                        
                        heroGlyphs.glifos.push(newGlyph);
                      }
                      
                      // Guardar catálogo de glifos actualizado
                      await WorkspaceService.saveHeroGlyphs(clase, heroGlyphs);
                      
                      // Reemplazar data completa del glifo en el zócalo por solo la referencia
                      node.glifo_equipado_id = glyphId;
                      delete node.glifo_info; // Eliminar data completa, solo mantener referencia
                      
                    } catch (error) {
                      console.error(`   ❌ Error procesando glifo en zócalo:`, error);
                      // Si falla, mantener data completa en el zócalo como fallback
                    }
                  }
                  
                  // Manejar réplicas (v0.5.3): Si replicas > 1, el nodo está consolidado
                  const replicas = node.replicas || 1;
                  
                  // Buscar nodo existente por nombre Y contenido equivalente
                  const idx = nodeList.findIndex((n: any) => {
                    if (n.nombre !== node.nombre) return false;
                    // Comparar detalles si existen
                    if (n.detalles && node.detalles) {
                      if (n.detalles.length !== node.detalles.length) return false;
                      return n.detalles.every((d: any, i: number) => 
                        d.texto === node.detalles[i]?.texto && 
                        d.activo === node.detalles[i]?.activo
                      );
                    }
                    return true; // Si no hay detalles, comparar solo por nombre
                  });
                  
                  const nodeId = idx >= 0 ? nodeList[idx].id : (node.id || `${nodosKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                  
                  // Limpiar campo replicas si es 1 (optimización de espacio)
                  const cleanNode = { ...node };
                  if (cleanNode.replicas === 1) {
                    delete cleanNode.replicas;
                  }
                  const nodeWithId = { ...cleanNode, id: nodeId };
                  
                  if (idx >= 0) {
                    const existingNode = nodeList[idx];
                    const existingReplicas = existingNode.replicas || 1;
                    
                    // Si el nodo nuevo tiene replicas, sumar
                    if (replicas > 1 || existingReplicas > 1) {
                      const totalReplicas = existingReplicas + replicas;
                      nodeList[idx] = { 
                        ...nodeWithId, 
                        replicas: totalReplicas > 1 ? totalReplicas : undefined 
                      };
                      itemsUpdated++;
                      updatedItemsList.push(`${node.nombre} (${replicas} réplicas → total: ${totalReplicas})`);
                    } else if (areEquivalentContent(existingNode, nodeWithId)) {
                      itemsRepeated++;
                      repeatedItems.push(node.nombre);
                    } else {
                      nodeList[idx] = nodeWithId;
                      itemsUpdated++;
                      updatedItemsList.push(node.nombre);
                    }
                  } else {
                    nodeList.push(nodeWithId);
                    itemsImported++;
                    const label = replicas > 1 ? `${node.nombre} (×${replicas})` : node.nombre;
                    addedItems.push(label);
                  }
                  fieldsAdded.push(node.nombre);
                }
                
                await WorkspaceService.saveParagonNodes(clase, heroNodes);
                showToast(`✅ ${itemsImported + itemsUpdated} nodos procesados en ${clase}`, 'success');
                shouldReload = true;
              }
            }
            break;
        }
        
        const heroResult: ImportResultDetails = {
          success: true,
          category: resultCategory,
          promptType: 'heroe',
          targetName: clase,
          jsonInputsProcessed: 1,
          itemsImported,
          itemsUpdated,
          itemsSkipped: itemsRepeated,
          addedItems,
          updatedItemsList,
          repeatedItems,
          itemDetails: buildItemDetails(resultCategory, addedItems, updatedItemsList, repeatedItems),
          fieldsAdded,
          validationErrors: validation.warnings,
          rawJSON: options?.jsonOverride ?? jsonText,
          totalInputItems,
          parsedJSON: parsedData
        };
        
        // 🚨 DETECTAR IMPORTACIÓN VACÍA
        if (itemsImported === 0 && itemsUpdated === 0 && fieldsAdded.length === 0) {
          console.warn('⚠️ [handleImportJSON] No se importó ningún dato. Posible categoría incorrecta.');
          
          // Si hay imagen compuesta, ofrecer guardar
          if (composedImageUrl) {
            const response = await fetch(composedImageUrl);
            const blob = await response.blob();
            const resolvedCategory = resolveImportCategory(effectiveCategory, runaGemaEffectiveCategory);
            const nombre = `${resolvedCategory}_${Date.now()}.png`;
            
            setPendingSaveData({ image: blob, json: jsonPayload, imageName: nombre });
            setShowEmptyWarning(true);
            setImporting(false);
            return heroResult;
          }
          
          showToast('⚠️ No se importó ningún dato. Verifica la categoría.', 'info');
        }
        
        // Auto-guardar JSON + imagen en galería tras importación exitosa
        if (!skipAutoSave && (itemsImported > 0 || itemsUpdated > 0 || fieldsAdded.length > 0)) {
          await autoSaveJSONAfterImport(options?.jsonOverride ?? jsonText);
        }
        
        setJsonText('');
        // Refrescar siempre después de importación exitosa
        if (itemsImported > 0 || itemsUpdated > 0 || fieldsAdded.length > 0) {
          await refreshPersonajes();
        }
        setImporting(false);
        return heroResult;
        
      } else {
        // =============== GUARDAR EN PERSONAJE ===============
        
        if (!effectivePersonajeId) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: resultCategory,
            promptType: effectivePromptType,
            targetName: '',
            validationErrors: validation.warnings,
            rawJSON: options?.jsonOverride ?? jsonText,
            parsedJSON: parsedData,
            errorMessage: 'Selecciona un personaje primero'
          };
          showToast('❌ Selecciona un personaje primero', 'error');
          setImporting(false);
          return errorResult;
        }

        // 🔄 BUSCAR PERSONAJE: Primero en array, si no existe, cargar del disco
        let personaje: Personaje | undefined = personajes.find(p => p.id === effectivePersonajeId);
        
        if (!personaje) {
          console.log(`⚠️ [handleImportJSON] Personaje ${effectivePersonajeId} no encontrado en array (${personajes.length} personajes)`, personajes.map(p => ({ id: p.id, nombre: p.nombre })));
          console.log(`⚠️ [handleImportJSON] Cargando personaje ${effectivePersonajeId} del disco...`);
          try {
            const personajeFromDisk = await WorkspaceService.loadPersonaje(effectivePersonajeId);
            if (personajeFromDisk) {
              personaje = personajeFromDisk;
              console.log(`✅ [handleImportJSON] Personaje ${effectivePersonajeId} cargado del disco correctamente`);
              // Agregar al array en memoria para futuras operaciones
              const existsInArray = personajes.find(p => p.id === personajeFromDisk.id);
              if (!existsInArray) {
                console.log(`➕ [handleImportJSON] Agregando personaje ${personajeFromDisk.id} al array de contexto`);
                setPersonajes([...personajes, personajeFromDisk]);
              }
            } else {
              console.error(`❌ [handleImportJSON] Personaje ${effectivePersonajeId} no encontrado en disco`);
            }
          } catch (loadError) {
            console.error(`❌ [handleImportJSON] Error cargando personaje ${effectivePersonajeId} del disco:`, loadError);
          }
        } else {
          console.log(`✅ [handleImportJSON] Personaje ${effectivePersonajeId} encontrado en array`);
        }
        
        if (!personaje) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: resultCategory,
            promptType: effectivePromptType,
            targetName: '',
            validationErrors: validation.warnings,
            rawJSON: options?.jsonOverride ?? jsonText,
            parsedJSON: parsedData,
            errorMessage: `Personaje ${effectivePersonajeId} no encontrado ni en array ni en disco`
          };
          showToast(`❌ Personaje ${effectivePersonajeId} no encontrado`, 'error');
          setImporting(false);
          return errorResult;
        }

        switch (effectiveCategory) {
          case 'skills': {
            if (data.habilidades_activas || data.habilidades_pasivas) {
              const newActivas: any[] = data.habilidades_activas || [];
              const newPasivas: any[] = data.habilidades_pasivas || [];

              // 1. Guardar en héroe primero (igual que CharacterSkills.applyImportChanges)
              const heroSkills = await WorkspaceService.loadHeroSkills(personaje.clase) || { habilidades_activas: [], habilidades_pasivas: [] };

              newActivas.forEach((skill: any) => {
                const idx = heroSkills.habilidades_activas.findIndex((s: any) => s.nombre === skill.nombre);
                const skillId = idx >= 0 ? heroSkills.habilidades_activas[idx].id : (skill.id || `skill_activa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                const mods = (skill.modificadores || []).map((mod: any) => {
                  const existingMod = idx >= 0 ? heroSkills.habilidades_activas[idx].modificadores?.find((m: any) => m.nombre === mod.nombre) : undefined;
                  return { ...mod, id: mod.id || existingMod?.id || `mod_${skillId}_${mod.nombre}`.replace(/\s+/g, '_').toLowerCase() + `_${Date.now()}` };
                });
                
                // 🔧 USAR smartMerge para preservar datos existentes
                const skillBase = idx >= 0 ? heroSkills.habilidades_activas[idx] : { id: skillId };
                const skillWithId = WorkspaceService.smartMerge(skillBase, { ...skill, id: skillId, modificadores: mods }) as any;
                
                if (idx >= 0) {
                  if (areEquivalentContent(heroSkills.habilidades_activas[idx], skillWithId)) {
                    itemsRepeated++;
                    repeatedItems.push(`Activa: ${skill.nombre}`);
                  } else {
                    (heroSkills.habilidades_activas as any)[idx] = skillWithId;
                    itemsUpdated++;
                    updatedItemsList.push(`Activa: ${skill.nombre}`);
                  }
                } else {
                  (heroSkills.habilidades_activas as any).push(skillWithId);
                  itemsImported++;
                  addedItems.push(`Activa: ${skill.nombre}`);
                }
                fieldsAdded.push(`Activa: ${skill.nombre}`);
              });

              newPasivas.forEach((skill: any) => {
                const idx = heroSkills.habilidades_pasivas.findIndex((s: any) => s.nombre === skill.nombre);
                const skillId = idx >= 0 ? heroSkills.habilidades_pasivas[idx].id : (skill.id || `skill_pasiva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                
                // 🔧 USAR smartMerge para preservar datos existentes
                const skillBase = idx >= 0 ? heroSkills.habilidades_pasivas[idx] : { id: skillId };
                const skillWithId = WorkspaceService.smartMerge(skillBase, { ...skill, id: skillId }) as any;
                
                if (idx >= 0) {
                  if (areEquivalentContent(heroSkills.habilidades_pasivas[idx], skillWithId)) {
                    itemsRepeated++;
                    repeatedItems.push(`Pasiva: ${skill.nombre}`);
                  } else {
                    (heroSkills.habilidades_pasivas as any)[idx] = skillWithId;
                    itemsUpdated++;
                    updatedItemsList.push(`Pasiva: ${skill.nombre}`);
                  }
                } else {
                  (heroSkills.habilidades_pasivas as any).push(skillWithId);
                  itemsImported++;
                  addedItems.push(`Pasiva: ${skill.nombre}`);
                }
                fieldsAdded.push(`Pasiva: ${skill.nombre}`);
              });

              await WorkspaceService.saveHeroSkills(personaje.clase, heroSkills);

              // 2. Crear refs correctas con formato {skill_id, modificadores_ids, nivel_actual}
              const activasRefs: Array<{ skill_id: string; modificadores_ids: string[]; nivel_actual?: number }> = [];
              for (const skill of newActivas) {
                const heroSkill = heroSkills.habilidades_activas.find((s: any) => s.nombre === skill.nombre);
                if (!heroSkill?.id) continue;

                const modificadoresIds = (skill.modificadores || [])
                  .map((mod: any) => heroSkill.modificadores?.find((m: any) => m.nombre === mod.nombre)?.id)
                  .filter((id: string | undefined): id is string => Boolean(id));

                activasRefs.push({
                  skill_id: heroSkill.id,
                  modificadores_ids: modificadoresIds,
                  nivel_actual: skill.nivel_actual ?? skill.nivel ?? 1
                });
              }

              const pasivasRefs: Array<{ skill_id: string; puntos_asignados?: number }> = [];
              for (const skill of newPasivas) {
                const heroSkill = heroSkills.habilidades_pasivas.find((s: any) => s.nombre === skill.nombre);
                if (!heroSkill?.id) continue;

                pasivasRefs.push({
                  skill_id: heroSkill.id,
                  puntos_asignados: skill.puntos_asignados ?? skill.nivel ?? 0
                });
              }

              // 3. Upsert por skill_id para actualizar niveles/modificadores sin requerir refresh.
              const existingActiveRefs = (personaje.habilidades_refs?.activas || []) as Array<{ skill_id: string; modificadores_ids: string[]; nivel_actual?: number }>;
              const existingPassiveRefs = (personaje.habilidades_refs?.pasivas || []) as Array<string | { skill_id: string; puntos_asignados?: number }>;

              const activeById = new Map<string, { skill_id: string; modificadores_ids: string[]; nivel_actual?: number }>();
              existingActiveRefs.forEach(ref => activeById.set(ref.skill_id, ref));
              activasRefs.forEach(ref => activeById.set(ref.skill_id, ref));

              const passiveById = new Map<string, { skill_id: string; puntos_asignados?: number }>();
              existingPassiveRefs.forEach(ref => {
                const normalized = typeof ref === 'string' ? { skill_id: ref, puntos_asignados: undefined } : ref;
                passiveById.set(normalized.skill_id, normalized);
              });
              pasivasRefs.forEach(ref => passiveById.set(ref.skill_id, ref));

              // CRÍTICO: Leer personaje del disco para preservar otros datos
              const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
              const updatedPersonaje = {
                ...(personajeFromDisk || personaje),
                habilidades_refs: {
                  activas: Array.from(activeById.values()),
                  pasivas: Array.from(passiveById.values())
                },
                fecha_actualizacion: new Date().toISOString()
              };

              await WorkspaceService.savePersonajeMerge(updatedPersonaje);
              
              // 🔄 Recargar del disco para sincronizar
              const reloadedPersonaje = await WorkspaceService.loadPersonaje(personaje.id);
              if (reloadedPersonaje) {
                syncUpdatedPersonajeInContext(reloadedPersonaje);
                if (selectedPersonaje?.id === personaje.id) {
                  setSelectedPersonaje(reloadedPersonaje);
                }
              }
              
              showToast(`✅ ${activasRefs.length + pasivasRefs.length} habilidades guardadas en ${personaje.nombre}`, 'success');
              shouldReload = true;
            }
            break;
          }
          case 'glifos': {
            if (data.glifos) {
              // 1. Guardar en héroe (SIN nivel_actual)
              const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase) || { glifos: [] };

              (data.glifos as any[]).forEach((glyph: any) => {
                const idx = heroGlyphs.glifos.findIndex((g: any) => g.nombre === glyph.nombre);
                const glyphId = idx >= 0 ? heroGlyphs.glifos[idx].id : (glyph.id || `glifo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                
                // ⚠️ CRÍTICO: Eliminar nivel_actual antes de guardar en héroe
                // En héroe solo se guardan detalles del glifo, NO niveles de personajes
                const { nivel_actual, nivel_maximo, ...glyphDetails } = glyph;
                
                // 🔧 USAR smartMerge para preservar datos existentes
                const glyphBase = idx >= 0 ? heroGlyphs.glifos[idx] : { id: glyphId };
                const glyphWithId = WorkspaceService.smartMerge(glyphBase, { ...glyphDetails, id: glyphId }) as any;
                
                if (idx >= 0) {
                  if (areEquivalentContent(heroGlyphs.glifos[idx], glyphWithId)) {
                    itemsRepeated++;
                    repeatedItems.push(glyph.nombre);
                  } else {
                    (heroGlyphs.glifos as any)[idx] = glyphWithId;
                    itemsUpdated++;
                    updatedItemsList.push(glyph.nombre);
                  }
                } else {
                  (heroGlyphs.glifos as any).push(glyphWithId);
                  itemsImported++;
                  addedItems.push(glyph.nombre);
                }
                fieldsAdded.push(glyph.nombre);
              });

              await WorkspaceService.saveHeroGlyphs(personaje.clase, heroGlyphs);

              // 2. Crear refs correctas {id, nivel_actual}
              const nuevosRefs = (data.glifos as any[]).map((glyph: any) => {
                const heroGlyph = heroGlyphs.glifos.find((g: any) => g.nombre === glyph.nombre);
                if (!heroGlyph?.id) return null;
                return { id: heroGlyph.id, nivel_actual: glyph.nivel_actual ?? glyph.nivel ?? 1 };
              }).filter((r: any): r is { id: string; nivel_actual: number } => r !== null);

              const glyphRefsById = new Map<string, { id: string; nivel_actual: number; nivel_maximo?: number }>();
              ((personaje.glifos_refs || []) as Array<{ id: string; nivel_actual: number; nivel_maximo?: number }>).forEach(ref => {
                glyphRefsById.set(ref.id, ref);
              });
              nuevosRefs.forEach(ref => {
                const prev = glyphRefsById.get(ref.id);
                glyphRefsById.set(ref.id, {
                  id: ref.id,
                  nivel_actual: ref.nivel_actual,
                  nivel_maximo: prev?.nivel_maximo ?? MAX_GLYPH_LEVEL
                });
              });

              // CRÍTICO: Leer personaje del disco para preservar otros datos
              const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
              const updatedPersonaje = {
                ...(personajeFromDisk || personaje),
                glifos_refs: Array.from(glyphRefsById.values()),
                fecha_actualizacion: new Date().toISOString()
              };

              await WorkspaceService.savePersonajeMerge(updatedPersonaje);
              
              // 🔄 Recargar del disco para sincronizar
              const reloadedPersonaje = await WorkspaceService.loadPersonaje(personaje.id);
              if (reloadedPersonaje) {
                syncUpdatedPersonajeInContext(reloadedPersonaje);
                if (selectedPersonaje?.id === personaje.id) {
                  setSelectedPersonaje(reloadedPersonaje);
                }
              }
              
              showToast(`✅ ${nuevosRefs.length} glifos guardados en ${personaje.nombre}`, 'success');
              shouldReload = true;
            }
            break;
          }
          case 'aspectos': {
            const aspectosData: any[] = data.aspectos_equipados || data.aspectos || [];
            if (aspectosData.length > 0) {
              const { tagMap } = await TagLinkingService.processAndLinkAllTags(
                { palabras_clave: Array.isArray(data.palabras_clave) ? data.palabras_clave : [] },
                'aspecto'
              );

              const normalizeText = (value: string): string => value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

              const toTitle = (value: string): string => value
                .split('_')
                .filter(Boolean)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');

              const ensureAspectId = (aspecto: any): string => {
                if (aspecto?.aspecto_id) return String(aspecto.aspecto_id);
                if (aspecto?.id) return String(aspecto.id);
                const fromName = normalizeText(String(aspecto?.name || aspecto?.nombre || aspecto?.shortName || 'aspecto'))
                  .replace(/\s+/g, '_');
                return `aspecto_${fromName || Date.now()}`;
              };

              // 1. Guardar en héroe (solo los que tienen datos completos, no solo refs)
              const heroAspects = await WorkspaceService.loadHeroAspects(personaje.clase) || { aspectos: [] };

              aspectosData.forEach((aspecto: any) => {
                const aspectoConTags = TagLinkingService.linkAspectTags(aspecto, tagMap);
                const aspectoId = ensureAspectId(aspectoConTags);
                const nombre = aspectoConTags.nombre || aspectoConTags.name;
                const idx = heroAspects.aspectos.findIndex((a: any) => {
                  const aName = normalizeText(String(a?.name || a?.nombre || ''));
                  const inName = normalizeText(String(nombre || ''));
                  return a.id === aspectoId || (!!aName && !!inName && aName === inName);
                });
                const resolvedId = idx >= 0 ? heroAspects.aspectos[idx].id : aspectoId;
                const base: any = idx >= 0 ? heroAspects.aspectos[idx] : null;
                
                // 🔧 USAR smartMerge para preservar datos existentes
                const aspectoBase = base || {
                  id: resolvedId,
                  aspecto_id: resolvedId,
                  name: `Aspecto ${toTitle(resolvedId.replace(/^aspecto_/, ''))}`,
                  shortName: toTitle(resolvedId.replace(/^aspecto_/, '')),
                  effect: '',
                  category: 'ofensivo',
                  level: '1/21',
                  tags: [],
                  detalles: []
                };
                
                // Mergear con los nuevos datos del JSON
                const aspectoWithId = WorkspaceService.smartMerge(aspectoBase, {
                  ...aspectoConTags,
                  id: resolvedId,
                  aspecto_id: resolvedId,
                  name: aspectoConTags.name || aspectoConTags.nombre || undefined,
                  shortName: aspectoConTags.shortName || undefined,
                  effect: aspectoConTags.effect || undefined,
                  category: aspectoConTags.category || undefined,
                  level: aspectoConTags.nivel_actual || aspectoConTags.level || undefined,
                  tags: Array.isArray(aspectoConTags.tags) && aspectoConTags.tags.length > 0 ? aspectoConTags.tags : undefined,
                  detalles: Array.isArray(aspectoConTags.detalles) && aspectoConTags.detalles.length > 0 ? aspectoConTags.detalles : undefined
                });
                
                if (idx >= 0) {
                  if (areEquivalentContent(heroAspects.aspectos[idx], aspectoWithId)) {
                    itemsRepeated++;
                    repeatedItems.push(aspectoWithId.name);
                  } else {
                    heroAspects.aspectos[idx] = aspectoWithId;
                    itemsUpdated++;
                    updatedItemsList.push(aspectoWithId.name);
                  }
                } else {
                  heroAspects.aspectos.push(aspectoWithId);
                  itemsImported++;
                  addedItems.push(aspectoWithId.name);
                }
                fieldsAdded.push(aspectoWithId.name);
              });

              await WorkspaceService.saveHeroAspects(personaje.clase, heroAspects);

              // 2. Crear refs completas para personaje (upsert por aspecto_id)
              const aspectosRefs = aspectosData.map((a: any) => {
                const incomingId = ensureAspectId(a);
                const heroAspecto = heroAspects.aspectos.find((ha: any) =>
                  ha.id === incomingId || ha.id === a.aspecto_id || ha.id === a.id ||
                  ha.name === a.nombre || ha.name === a.name || ha.shortName === a.shortName
                );
                const aspectoId = heroAspecto?.id || incomingId;
                if (!aspectoId) return null;
                return {
                  aspecto_id: String(aspectoId),
                  nivel_actual: a.nivel_actual || a.level || '1/21',
                  slot_equipado: a.slot_equipado,
                  valores_actuales: a.valores_actuales || {}
                };
              }).filter(Boolean);

              const aspectRefsById = new Map<string, { aspecto_id: string; nivel_actual: string; slot_equipado?: string; valores_actuales: Record<string, string> }>();
              ((personaje.aspectos_refs || []) as Array<any>).forEach(ref => {
                if (!ref) return;
                if (typeof ref === 'string') {
                  aspectRefsById.set(ref, {
                    aspecto_id: ref,
                    nivel_actual: '1/21',
                    valores_actuales: {}
                  });
                  return;
                }

                if (ref.aspecto_id) {
                  aspectRefsById.set(String(ref.aspecto_id), {
                    aspecto_id: String(ref.aspecto_id),
                    nivel_actual: ref.nivel_actual || '1/21',
                    slot_equipado: ref.slot_equipado,
                    valores_actuales: ref.valores_actuales || {}
                  });
                }
              });

              (aspectosRefs as Array<{ aspecto_id: string; nivel_actual: string; slot_equipado?: string; valores_actuales: Record<string, string> }>).forEach(ref => {
                aspectRefsById.set(ref.aspecto_id, ref);
              });

              // CRÍTICO: Leer personaje del disco para preservar otros datos
              const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
              const updatedPersonaje = {
                ...(personajeFromDisk || personaje),
                aspectos_refs: Array.from(aspectRefsById.values()),
                fecha_actualizacion: new Date().toISOString()
              };

              await WorkspaceService.savePersonajeMerge(updatedPersonaje);
              
              // 🔄 Recargar del disco para sincronizar
              const reloadedPersonaje = await WorkspaceService.loadPersonaje(personaje.id);
              if (reloadedPersonaje) {
                syncUpdatedPersonajeInContext(reloadedPersonaje);
                if (selectedPersonaje?.id === personaje.id) {
                  setSelectedPersonaje(reloadedPersonaje);
                }
              }
              
              showToast(`✅ ${aspectosRefs.length} aspectos guardados en ${personaje.nombre}`, 'success');
              shouldReload = true;
            }
            break;
          }
          case 'build': {
            const buildData = (data.build && typeof data.build === 'object') ? data.build : data;
            const rawPieces = Array.isArray(buildData.piezas)
              ? buildData.piezas
              : (buildData.piezas && typeof buildData.piezas === 'object'
                ? Object.values(buildData.piezas)
                : []);

            const globalRunesCatalog = await WorkspaceService.loadHeroRunes('global') || { runas: [] };
            const globalGemsCatalog = await WorkspaceService.loadHeroGems('global') || { gemas: [] };
            let globalCatalogChanged = false;

            const piezasBySlot: Record<string, any> = {};

            rawPieces.forEach((piece: any) => {
              const slot = normalizeEquipmentSlot(piece?.espacio || piece?.slot || piece?.tipo || piece?.nombre);
              if (!slot) return;

              const engarcesInput = Array.isArray(piece?.engarces) ? piece.engarces : [];
              const engarcesNormalized = engarcesInput
                .map((engarce: any) => {
                  const rawType = normalizeLookupKey(engarce?.tipo || engarce?.tipo_engarce || '');
                  const type: 'runa' | 'gema' | 'vacio' =
                    rawType.includes('runa')
                      ? 'runa'
                      : rawType.includes('gema')
                        ? 'gema'
                        : 'vacio';

                  if (type === 'runa') {
                    if (engarce?.runa_id) {
                      return {
                        tipo: 'runa',
                        runa_id: String(engarce.runa_id),
                        calidad_runa: normalizeRuneType(engarce?.calidad_runa || engarce?.subtipo)
                      };
                    }

                    const runeName = String(engarce?.nombre || engarce?.runa_nombre || '').trim();
                    if (!runeName) return null;
                    const runeCandidate = {
                      id: engarce?.id,
                      nombre: runeName,
                      rareza: engarce?.rareza || 'magico',
                      tipo: normalizeRuneType(engarce?.subtipo || engarce?.tipo || engarce?.calidad_runa),
                      efecto: engarce?.efecto || engarce?.descripcion || '',
                      descripcion: engarce?.descripcion,
                      tags: Array.isArray(engarce?.tags) ? engarce.tags : undefined
                    };

                    const result = upsertCatalogEntity(globalRunesCatalog.runas as any[], runeCandidate, 'runa');
                    if (result.status === 'added') {
                      itemsImported++;
                      addedItems.push(`Runa (build): ${runeName}`);
                    } else if (result.status === 'updated') {
                      itemsUpdated++;
                      updatedItemsList.push(`Runa (build): ${runeName}`);
                    } else {
                      itemsRepeated++;
                      repeatedItems.push(`Runa (build): ${runeName}`);
                    }
                    globalCatalogChanged = globalCatalogChanged || result.status !== 'repeated';
                    fieldsAdded.push(`catalogo.runas.${runeName}`);
                    return {
                      tipo: 'runa',
                      runa_id: result.id,
                      calidad_runa: normalizeRuneType(engarce?.subtipo || engarce?.calidad_runa || result.merged?.tipo)
                    };
                  }

                  if (type === 'gema') {
                    if (engarce?.gema_id) {
                      return {
                        tipo: 'gema',
                        gema_id: String(engarce.gema_id)
                      };
                    }

                    const gemName = String(engarce?.nombre || engarce?.gema_nombre || '').trim();
                    if (!gemName) return null;
                    const gemCandidate = {
                      id: engarce?.id,
                      tipo_objeto: 'gema',
                      nombre: gemName,
                      tipo: engarce?.tipo_gema || engarce?.tipo || inferGemTypeFromName(gemName),
                      calidad: engarce?.calidad,
                      rango_calidad: engarce?.rango_calidad,
                      requerimientos: engarce?.requerimientos && typeof engarce.requerimientos === 'object'
                        ? engarce.requerimientos
                        : undefined,
                      efectos: engarce?.efectos && typeof engarce.efectos === 'object' ? engarce.efectos : {},
                      efectos_por_slot: engarce?.efectos_por_slot && typeof engarce.efectos_por_slot === 'object'
                        ? engarce.efectos_por_slot
                        : undefined,
                      descripcion_lore: engarce?.descripcion_lore,
                      descripcion: engarce?.descripcion,
                      nivel_requerido: engarce?.nivel_requerido,
                      valor_venta: engarce?.valor_venta,
                      en_bolsas: engarce?.en_bolsas,
                      clasificacion: engarce?.clasificacion && typeof engarce.clasificacion === 'object'
                        ? engarce.clasificacion
                        : undefined,
                      tags: Array.isArray(engarce?.tags) ? engarce.tags : undefined
                    };

                    const result = upsertCatalogEntity(globalGemsCatalog.gemas as any[], gemCandidate, 'gema');
                    if (result.status === 'added') {
                      itemsImported++;
                      addedItems.push(`Gema (build): ${gemName}`);
                    } else if (result.status === 'updated') {
                      itemsUpdated++;
                      updatedItemsList.push(`Gema (build): ${gemName}`);
                    } else {
                      itemsRepeated++;
                      repeatedItems.push(`Gema (build): ${gemName}`);
                    }
                    globalCatalogChanged = globalCatalogChanged || result.status !== 'repeated';
                    fieldsAdded.push(`catalogo.gemas.${gemName}`);
                    return {
                      tipo: 'gema',
                      gema_id: result.id
                    };
                  }

                  return { tipo: 'vacio' as const };
                })
                .filter(Boolean);

              piezasBySlot[slot] = {
                ...piece,
                espacio: slot,
                engarces: engarcesNormalized
              };
            });

            const piezas = Object.values(piezasBySlot);

            if (piezas.length > 0) {
              const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
              const basePersonaje = personajeFromDisk || personaje;
              const previousBuild = (basePersonaje as any).build || {};

              if (globalCatalogChanged) {
                await WorkspaceService.saveHeroRunes('global', globalRunesCatalog);
                await WorkspaceService.saveHeroGems('global', globalGemsCatalog);
              }

              // ============================================================================
              // PROCESAMIENTO DE ASPECTOS EN OBJETOS DE EQUIPO - v0.5.5
              // ============================================================================
              const heroAspectsCatalog = await WorkspaceService.loadHeroAspects(personaje.clase) || { aspectos: [] };
              const aspectosEnPiezasInfo: Array<{ id: string; slot: string; aspect_id: string }> = [];

              // Procesar cada pieza para reconocer y enlazar aspectos
              Object.entries(piezasBySlot).forEach(([slot, piece]: [string, any]) => {
                if (piece.aspecto_id || piece.aspecto_vinculado_id || piece.aspecto || piece.aspecto_descripcion_diferencia) {
                  const aspectoData = piece.aspecto || {
                    id: piece.aspecto_id || piece.aspecto_vinculado_id,
                    nombre: piece.aspecto_nombre || piece.aspecto_name,
                    effect: piece.aspecto_descripcion_diferencia,
                    descripcion: piece.aspecto_descripcion_diferencia
                  };
                  
                  // Buscar si el aspecto existe en el catálogo del héroe
                  const existingIdx = heroAspectsCatalog.aspectos.findIndex((a: any) => 
                    a.id === (piece.aspecto_id || piece.aspecto_vinculado_id || aspectoData.id) ||
                    a.nombre === aspectoData.nombre ||
                    a.name === aspectoData.nombre
                  );

                  if (existingIdx >= 0) {
                    // Existe: usar ID del catálogo
                    const existingAspecto = heroAspectsCatalog.aspectos[existingIdx];
                    piece.aspecto_id = existingAspecto.id;
                    piece.aspecto_vinculado_id = existingAspecto.id;
                    
                    // Complementar detalles si el objeto trae más info
                    if (piece.aspecto && typeof piece.aspecto === 'object') {
                      heroAspectsCatalog.aspectos[existingIdx] = {
                        ...heroAspectsCatalog.aspectos[existingIdx],
                        ...mergeComplementaryData(heroAspectsCatalog.aspectos[existingIdx], piece.aspecto)
                      };
                      globalCatalogChanged = true;
                    }

                    aspectosEnPiezasInfo.push({
                      id: existingAspecto.id,
                      slot,
                      aspect_id: existingAspecto.id
                    });
                  } else if (piece.aspecto_id || (aspectoData && aspectoData.nombre)) {
                    // No existe pero tiene datos: crear en catálogo
                    const nuevoAspectoId = piece.aspecto_id || piece.aspecto_vinculado_id || aspectoData.id || `aspecto_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                    const nuevoAspecto = {
                      id: nuevoAspectoId,
                      nombre: aspectoData.nombre,
                      name: aspectoData.nombre,
                      shortName: aspectoData.shortName || (aspectoData.nombre || '').slice(0, 3),
                      effect: aspectoData.efecto || aspectoData.effect || '',
                      category: aspectoData.category || aspectoData.categoria || 'ofensivo',
                      level: aspectoData.level || aspectoData.nivel || '1/21',
                      tags: Array.isArray(aspectoData.tags) ? aspectoData.tags : [],
                      ...aspectoData
                    };

                    heroAspectsCatalog.aspectos.push(nuevoAspecto);
                    piece.aspecto_id = nuevoAspectoId;
                    piece.aspecto_vinculado_id = nuevoAspectoId;
                    globalCatalogChanged = true;

                    aspectosEnPiezasInfo.push({
                      id: nuevoAspectoId,
                      slot,
                      aspect_id: nuevoAspectoId
                    });
                  }
                }
              });

              // Guardar catálogo de aspectos si cambió
              if (globalCatalogChanged) {
                await WorkspaceService.saveHeroAspects(personaje.clase, heroAspectsCatalog);
              }

              // ============================================================================

              const previousBuildPieces = (previousBuild.piezas && typeof previousBuild.piezas === 'object') ? previousBuild.piezas : {};
              const runasEquipadas = Object.entries(piezasBySlot)
                .flatMap(([slot, piece]: [string, any]) => {
                  if (slot !== 'arma' && slot !== 'escudo') return [];
                  const engarces = Array.isArray(piece?.engarces) ? piece.engarces : [];
                  return engarces
                    .filter((engarce: any) => engarce?.tipo === 'runa' && engarce?.runa_id)
                    .map((engarce: any) => ({
                      runa_id: String(engarce.runa_id),
                      vinculada_a: slot === 'escudo' ? 'escudo' : 'arma'
                    }));
                });

              // Agregar aspectos de las piezas a los aspectos_refs del personaje
              const aspectRefsFromBuild = aspectosEnPiezasInfo.map(info => ({
                aspecto_id: info.aspect_id,
                nivel_actual: '1/21',
                slot_equipado: info.slot,
                valores_actuales: {}
              }));

              const updatedBuild = {
                ...previousBuild,
                ...buildData,
                piezas: {
                  ...previousBuildPieces,
                  ...piezasBySlot
                },
                runas_equipadas: runasEquipadas.length > 0
                  ? runasEquipadas
                  : previousBuild.runas_equipadas,
                id: previousBuild.id || buildData.id || `build_${Date.now()}`,
                fecha_creacion: previousBuild.fecha_creacion || buildData.fecha_creacion || new Date().toISOString(),
                fecha_actualizacion: new Date().toISOString()
              };

              const updatedPersonaje = {
                ...basePersonaje,
                build: updatedBuild,
                // Agregar aspectos_refs del build si no están presentes
                aspectos_refs: aspectRefsFromBuild.length > 0
                  ? [
                      ...((basePersonaje?.aspectos_refs || []) as any[]).filter(ref => {
                        // Mantener referencias existentes que no estén en el build
                        return !aspectRefsFromBuild.some(br => br.aspecto_id === (ref.aspecto_id || ref));
                      }),
                      ...aspectRefsFromBuild
                    ]
                  : basePersonaje?.aspectos_refs || [],
                fecha_actualizacion: new Date().toISOString()
              };

              await WorkspaceService.savePersonajeMerge(updatedPersonaje);
              
              // 🔄 Recargar del disco para sincronizar
              const reloadedPersonaje = await WorkspaceService.loadPersonaje(personaje.id);
              if (reloadedPersonaje) {
                syncUpdatedPersonajeInContext(reloadedPersonaje);
                if (selectedPersonaje?.id === personaje.id) {
                  setSelectedPersonaje(reloadedPersonaje);
                }
              }

              piezas.forEach((pieza: any) => {
                const piezaName = pieza.nombre || pieza.id || pieza.espacio || 'pieza';
                itemsImported++;
                addedItems.push(piezaName);
                fieldsAdded.push(`build.piezas.${pieza.espacio || pieza.id || piezaName}`);
              });

              showToast(`✅ Build importada: ${piezas.length} pieza(s) en ${personaje.nombre}`, 'success');
              shouldReload = true;
            }
            break;
          }
          case 'estadisticas': {
            // 🔥 USAR FUNCIÓN CENTRALIZADA DE IMPORTACIÓN
            const result = await WorkspaceService.importStatsToPersonaje(data, personaje.id);
            
            if (!result.success) {
              throw new Error(result.error || 'Error importando estadísticas');
            }

            // Sincronizar contexto
            const updatedPersonaje = await WorkspaceService.loadPersonaje(personaje.id);
            if (updatedPersonaje) {
              syncUpdatedPersonajeInContext(updatedPersonaje);
              
              // Si es el personaje seleccionado actualmente, actualizar también
              if (selectedPersonaje?.id === personaje.id) {
                setSelectedPersonaje(updatedPersonaje);
              }
            }

            // Actualizar contadores para UI
            fieldsAdded.push(...result.fieldsAdded);
            itemsUpdated += result.fieldsUpdated;
            updatedItemsList.push(...result.fieldsAdded.map(f => `Estadísticas: ${f}`));
            
            showToast(`✅ Estadísticas guardadas en ${personaje.nombre}`, 'success');
            shouldReload = true;
            break;
          }
          case 'paragon': {
            
            // Cargar personaje del disco para preservar otros datos
            const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
            const basePersonaje = personajeFromDisk || personaje;
            
            // Extraer datos según tipo y usar modelo de referencias (v0.5.1)
            let updatedParagonRefs: any = { ...basePersonaje.paragon_refs };
            let updatedAtributosParagon: any = { ...basePersonaje.atributos_paragon };
            
            if (paragonType === 'tablero') {
              // 1️⃣ GUARDAR EN HÉROE PRIMERO (igual que Skills/Glifos)
              const tablerosEquipados = data.tableros_equipados || data.tableros || [];
              
              if (tablerosEquipados.length > 0) {
                const heroBoards = await WorkspaceService.loadParagonBoards(personaje.clase) || { tableros: [] };
                
                tablerosEquipados.forEach((board: any) => {
                  const idx = heroBoards.tableros.findIndex((b: any) => b.nombre === board.nombre);
                  const boardId = idx >= 0 ? heroBoards.tableros[idx].id : (board.id || `tablero_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                  
                  // 🔧 USAR smartMerge para preservar datos existentes
                  const boardBase = idx >= 0 ? heroBoards.tableros[idx] : { id: boardId };
                  const boardWithId = WorkspaceService.smartMerge(boardBase, { ...board, id: boardId }) as any;
                  
                  if (idx >= 0) {
                    if (areEquivalentContent(heroBoards.tableros[idx], boardWithId)) {
                      itemsRepeated++;
                      repeatedItems.push(board.nombre || boardId);
                    } else {
                      heroBoards.tableros[idx] = boardWithId;
                      itemsUpdated++;
                      updatedItemsList.push(board.nombre || boardId);
                    }
                  } else {
                    heroBoards.tableros.push(boardWithId);
                    itemsImported++;
                    addedItems.push(board.nombre || boardId);
                  }
                  fieldsAdded.push(board.nombre || boardId);
                });
                
                await WorkspaceService.saveParagonBoards(personaje.clase, heroBoards);
                
                // 2️⃣ CREAR REFERENCIAS EN PERSONAJE
                const newRefs = tablerosEquipados.map((tablero: any, index: number) => {
                  const heroBoard = heroBoards.tableros.find((b: any) => b.nombre === tablero.nombre);
                  return {
                    tablero_id: heroBoard?.id || tablero.tablero_id || tablero.id || `tablero_ref_${index}`,
                    posicion: tablero.posicion ?? index,
                    rotacion: tablero.rotacion ?? 0,
                    nodos_activados_ids: tablero.nodos_activados || tablero.nodos_activados_ids || [],
                    zocalo_glifo: tablero.zocalo_glifo
                  };
                });
                
                updatedParagonRefs.tableros_equipados = newRefs;
                
                // Auto-enlazar nodos huérfanos a tableros recién agregados
                if (updatedParagonRefs.nodos_huerfanos && updatedParagonRefs.nodos_huerfanos.length > 0) {
                  const nodosEnlazados: string[] = [];
                  
                  updatedParagonRefs.nodos_huerfanos = updatedParagonRefs.nodos_huerfanos.filter((huerfano: any) => {
                    const tableroContenedor = updatedParagonRefs.tableros_equipados?.find((t: any) =>
                      t.nodos_activados_ids?.includes(huerfano.nodo_id)
                    );
                    
                    if (tableroContenedor) {
                      nodosEnlazados.push(huerfano.nodo_id);
                      return false; // Remover de huérfanos
                    }
                    return true; // Mantener como huérfano
                  });
                  
                  if (nodosEnlazados.length > 0) {
                    showToast(`🔗 ${nodosEnlazados.length} nodos huérfanos enlazados a tableros`, 'success');
                  }
                }
                
                // Actualizar lista total de nodos activados
                updatedParagonRefs.nodos_activados_ids = [];
                updatedParagonRefs.tableros_equipados?.forEach((tablero: any) => {
                  if (tablero.nodos_activados_ids) {
                    updatedParagonRefs.nodos_activados_ids?.push(...tablero.nodos_activados_ids);
                  }
                });
              }
              
            } else if (paragonType === 'nodo') {
              // 1️⃣ GUARDAR EN HÉROE PRIMERO (igual que Skills/Glifos)
              const nodosActivados = data.nodos_activados || data.nodos || [];
              
              if (nodosActivados.length > 0) {
                const heroNodes = await WorkspaceService.loadParagonNodes(personaje.clase) || { 
                  nodos_normales: [],
                  nodos_magicos: [],
                  nodos_raros: [],
                  nodos_legendarios: []
                };
                
                // Clasificar cada nodo según su rareza
                nodosActivados.forEach((node: any) => {
                  if (!node.rareza) {
                    console.warn(`⚠️ Nodo sin rareza: ${node.nombre}. Asignando 'normal' por defecto.`);
                    node.rareza = 'normal';
                  }

                  // Determinar el array correcto según rareza
                  let nodosKey: string;
                  let nodeList: any[];
                  
                  switch (node.rareza) {
                    case 'normal':
                      nodosKey = 'nodos_normales';
                      nodeList = heroNodes.nodos_normales;
                      break;
                    case 'magico':
                      nodosKey = 'nodos_magicos';
                      nodeList = heroNodes.nodos_magicos;
                      break;
                    case 'raro':
                      nodosKey = 'nodos_raros';
                      nodeList = heroNodes.nodos_raros;
                      break;
                    case 'legendario':
                      nodosKey = 'nodos_legendarios';
                      nodeList = heroNodes.nodos_legendarios;
                      break;
                    default:
                      console.warn(`⚠️ Rareza desconocida '${node.rareza}' para nodo ${node.nombre}. Asignando a normales.`);
                      nodosKey = 'nodos_normales';
                      nodeList = heroNodes.nodos_normales;
                  }
                  
                  const idx = nodeList.findIndex((n: any) => n.nombre === node.nombre);
                  const nodeId = idx >= 0 ? nodeList[idx].id : (node.id || `${nodosKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                  const nodeWithId = { ...node, id: nodeId };
                  
                  if (idx >= 0) {
                    if (areEquivalentContent(nodeList[idx], nodeWithId)) {
                      itemsRepeated++;
                      repeatedItems.push(node.nombre || nodeId);
                    } else {
                      nodeList[idx] = nodeWithId;
                      itemsUpdated++;
                      updatedItemsList.push(node.nombre || nodeId);
                    }
                  } else {
                    nodeList.push(nodeWithId);
                    itemsImported++;
                    addedItems.push(node.nombre || nodeId);
                  }
                  fieldsAdded.push(node.nombre || nodeId);
                });
                
                await WorkspaceService.saveParagonNodes(personaje.clase, heroNodes);
                
                // 2️⃣ CREAR REFERENCIAS EN PERSONAJE (con nodos huérfanos si no hay tableros)
                // Verificar si hay tableros para asignar estos nodos
                if (!updatedParagonRefs.tableros_equipados || updatedParagonRefs.tableros_equipados.length === 0) {
                  // No hay tableros → Guardar como nodos huérfanos
                  
                  updatedParagonRefs.nodos_huerfanos = updatedParagonRefs.nodos_huerfanos || [];
                  
                  nodosActivados.forEach((nodo: any) => {
                    // Buscar el ID del nodo en el catálogo del héroe
                    const heroNode = 
                      heroNodes.nodos_normales.find((n: any) => n.nombre === nodo.nombre) ||
                      heroNodes.nodos_magicos.find((n: any) => n.nombre === nodo.nombre) ||
                      heroNodes.nodos_raros.find((n: any) => n.nombre === nodo.nombre) ||
                      heroNodes.nodos_legendarios.find((n: any) => n.nombre === nodo.nombre);
                    
                    const nodoId = heroNode?.id || nodo.id || nodo.nodo_id || `nodo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const yaExiste = updatedParagonRefs.nodos_huerfanos.some((h: any) => h.nodo_id === nodoId);
                    
                    if (!yaExiste) {
                      updatedParagonRefs.nodos_huerfanos.push({
                        nodo_id: nodoId,
                        fecha_agregado: new Date().toISOString(),
                        rareza: nodo.rareza || 'normal'
                      });
                    }
                  });
                  
                  showToast(`⚠️ ${nodosActivados.length} nodos guardados como huérfanos (sin tablero). Se enlazarán automáticamente al agregar tableros.`, 'info');
                  
                } else {
                  // Hay tableros → Intentar asignar nodos automáticamente
                  const nodosIds = nodosActivados.map((n: any) => {
                    // Buscar el ID en el catálogo del héroe
                    const heroNode = 
                      heroNodes.nodos_normales.find((hn: any) => hn.nombre === n.nombre) ||
                      heroNodes.nodos_magicos.find((hn: any) => hn.nombre === n.nombre) ||
                      heroNodes.nodos_raros.find((hn: any) => hn.nombre === n.nombre) ||
                      heroNodes.nodos_legendarios.find((hn: any) => hn.nombre === n.nombre);
                    
                    return heroNode?.id || n.id || n.nodo_id || `nodo_${Date.now()}`;
                  });
                  
                  updatedParagonRefs.nodos_activados_ids = updatedParagonRefs.nodos_activados_ids || [];
                  nodosIds.forEach((id: string) => {
                    if (!updatedParagonRefs.nodos_activados_ids.includes(id)) {
                      updatedParagonRefs.nodos_activados_ids.push(id);
                    }
                  });
                }
              }
              
            } else if (paragonType === 'atributos') {
              // Atributos acumulados del personaje (DEPRECATED v0.5.3)
              // Los atributos ahora se manejan en estadisticas.atributosPrincipales
              const paragonData = data.paragon || data.atributos_paragon || data;
              
              updatedAtributosParagon = {
                nivel_paragon: paragonData.nivel_paragon ?? updatedAtributosParagon.nivel_paragon,
                puntos_gastados: paragonData.puntos_gastados ?? updatedAtributosParagon.puntos_gastados,
                puntos_disponibles: paragonData.puntos_disponibles ?? updatedAtributosParagon.puntos_disponibles
                // @deprecated - atributos_acumulados eliminado: se maneja en estadisticas.atributosPrincipales
              };
              
              itemsUpdated++;
              fieldsAdded.push('atributos_paragon');
              updatedItemsList.push('nivel_paragon');
            }
            
            const updatedPersonaje = {
              ...basePersonaje,
              paragon_refs: updatedParagonRefs,
              atributos_paragon: updatedAtributosParagon,
              // Mantener compatibilidad retroactiva (deprecated)
              paragon: {
                ...basePersonaje.paragon,
                ...(data.paragon || {})
              },
              fecha_actualizacion: new Date().toISOString()
            };
            
            await WorkspaceService.savePersonajeMerge(updatedPersonaje);
            
            // 🔄 Recargar del disco para sincronizar
            const reloadedPersonaje = await WorkspaceService.loadPersonaje(personaje.id);
            if (reloadedPersonaje) {
              syncUpdatedPersonajeInContext(reloadedPersonaje);
              if (selectedPersonaje?.id === personaje.id) {
                setSelectedPersonaje(reloadedPersonaje);
              }
            }
            
            showToast(`✅ Datos de Paragon guardados en ${personaje.nombre} (${itemsImported} nuevos, ${itemsUpdated} actualizados)`, 'success');
            shouldReload = true;
            break;
          }
        }
        
        const personajeResult: ImportResultDetails = {
          success: true,
          category: resultCategory,
          promptType: 'personaje',
          targetName: personaje.nombre,
          jsonInputsProcessed: 1,
          itemsImported,
          itemsUpdated,
          itemsSkipped: itemsRepeated,
          addedItems,
          updatedItemsList,
          repeatedItems,
          itemDetails: buildItemDetails(resultCategory, addedItems, updatedItemsList, repeatedItems),
          fieldsAdded,
          validationErrors: validation.warnings,
          rawJSON: options?.jsonOverride ?? jsonText,
          totalInputItems,
          parsedJSON: parsedData
        };
        
        // 🚨 DETECTAR IMPORTACIÓN VACÍA
        if (itemsImported === 0 && itemsUpdated === 0 && fieldsAdded.length === 0) {
          console.warn('⚠️ [handleImportJSON] No se importó ningún dato. Posible categoría incorrecta.');
          
          // Si hay imagen compuesta, ofrecer guardar
          if (composedImageUrl) {
            const response = await fetch(composedImageUrl);
            const blob = await response.blob();
            const resolvedCategory = resolveImportCategory(effectiveCategory, runaGemaEffectiveCategory);
            const nombre = `${resolvedCategory}_${Date.now()}.png`;
            
            setPendingSaveData({ image: blob, json: jsonPayload, imageName: nombre });
            setShowEmptyWarning(true);
            setImporting(false);
            return personajeResult;
          }
          
          showToast('⚠️ No se importó ningún dato. Verifica la categoría.', 'info');
        }
        
        // Auto-guardar JSON + imagen en galería tras importación exitosa
        if (!skipAutoSave && (itemsImported > 0 || itemsUpdated > 0 || fieldsAdded.length > 0)) {
          await autoSaveJSONAfterImport(options?.jsonOverride ?? jsonText);
        }
        
        setJsonText('');
        // Refrescar siempre después de importación exitosa
        if (itemsImported > 0 || itemsUpdated > 0 || fieldsAdded.length > 0) {
          await refreshPersonajes();
        }
        setImporting(false);
        return personajeResult;
      }
      
    } catch (error) {
      console.error('❌ [handleImportJSON] Error importando JSON:', error);
      const errorResult: ImportResultDetails = {
        success: false,
        category: resolveImportCategory(effectiveCategory, runaGemaEffectiveCategory),
        promptType: effectivePromptType,
        targetName: getImportTargetName(
          effectiveCategory,
          effectivePromptType,
          effectiveClase,
          personajes.find(p => p.id === effectivePersonajeId)?.nombre || '',
          runaGemaEffectiveCategory
        ),
        validationErrors: [],
        rawJSON: options?.jsonOverride ?? jsonText,
        parsedJSON: parsedData,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido al procesar el JSON'
      };
      showToast('❌ Error al procesar el JSON. Verifica el formato.', 'error');
      setImporting(false);
      return errorResult;
    } finally {
      setImporting(false);
    }
  };

  // Guardar imagen y JSON cuando el usuario acepta en el modal de advertencia
  const handleSaveEmptyImport = async () => {
    if (!pendingSaveData) return;

    try {
      const { image, json, imageName } = pendingSaveData;
      
      // Resolver categoría real (runas/gemas necesitan resolución)
      const resolvedCategory = resolveImportCategory(selectedCategory, runaGemaType);
      
      // Guardar imagen
      const nombre = await ImageService.saveImage(image, resolvedCategory, imageName.replace(/\.png$/, ''));
      
      // ✅ CONSTRUIR METADATA con todos los inputs actuales
      const personajeSeleccionado = promptType === 'personaje' ? personajes.find(p => p.id === selectedPersonajeId) : undefined;
      const metadata: import('../../services/ImageService').JSONMetadata = {
        categoria: resolvedCategory,
        timestamp: new Date().toISOString(),
        destino: promptType,
        clase: promptType === 'heroe' ? selectedClase : undefined,
        personajeId: promptType === 'personaje' ? (selectedPersonajeId || undefined) : undefined,
        personajeNombre: personajeSeleccionado?.nombre,
        personajeNivel: personajeSeleccionado?.nivel,
        personajeClase: personajeSeleccionado?.clase,
        paragonType: selectedCategory === 'paragon' ? paragonType : undefined,
        runaGemaType: selectedCategory === 'runas' ? runaGemaType : undefined,
        mundoType: selectedCategory === 'mundo' ? mundoType : undefined,
        talismanType: selectedCategory === 'talismanes' ? talismanType : undefined,
        manualElementCount: manualElementCount,
        version: '0.8.7'
      };
      
      // Guardar JSON asociado con metadata
      await ImageService.saveImageJSON(json, resolvedCategory, nombre, metadata);
      
      showToast(`✅ Imagen y JSON guardados para revisión: ${resolvedCategory}/${nombre}`, 'success');
      
      // Limpiar estados
      setShowEmptyWarning(false);
      setPendingSaveData(null);
      setJsonText('');
      setCapturedImages([]);
      setComposedImageUrl(null);
      
      // Recargar galería y contadores
      loadCategoryCounts();
      loadLastSavedImage();
      if (showGallery) {
        loadGallery();
      }
    } catch (error) {
      console.error('Error guardando datos:', error);
      showToast('❌ Error al guardar la imagen y JSON', 'error');
    }
  };

  // 🔄 Handlers para modal de restauración de personaje
  const handleRestoreModalConfirm = (applyToAll: boolean) => {
    if (pendingRestoreData) {
      pendingRestoreData.resolve({ useExisting: true, applyToAll });
      setShowRestoreModal(false);
      setPendingRestoreData(null);
    }
  };

  const handleRestoreModalCancel = () => {
    if (pendingRestoreData) {
      pendingRestoreData.resolve({ useExisting: false, applyToAll: false });
      setShowRestoreModal(false);
      setPendingRestoreData(null);
    }
  };

  // Ejecutar un JSON individual desde la galería
  const executeImageJSON = async (imageName: string) => {
    try {
      console.log('🧭 [executeImageJSON] Estado previo:', {
        selectedCategory,
        promptType,
        selectedPersonajeId,
        selectedClase,
        selectedPersonajeContext: selectedPersonaje?.id || null
      });

      // 🆕 CARGAR METADATA DEL ARCHIVO Y AUTO-CREAR PERSONAJE SI NO EXISTE
      const entry = galleryImages.find(img => img.nombre === imageName);
      if (entry?.metadata) {
        console.log('📋 [executeImageJSON] Metadata encontrada:', entry.metadata);
        
        // Si es modo personaje, verificar y crear personaje si no existe
        if (entry.metadata.destino === 'personaje' && entry.metadata.personajeId) {
          // 🆕 LEER JSON PRIMERO PARA OBTENER DATOS COMPLETOS DEL PERSONAJE
          let personajeDataFromJSON: { id: string; nombre: string; clase: string; nivel: number } | undefined;
          
          try {
            const jsonTextForPersonaje = await ImageService.loadJSONText(selectedCategory, imageName);
            if (jsonTextForPersonaje) {
              const parsedJSON = JSON.parse(jsonTextForPersonaje);
              if (parsedJSON.id && parsedJSON.nombre && parsedJSON.clase) {
                personajeDataFromJSON = {
                  id: parsedJSON.id,
                  nombre: parsedJSON.nombre,
                  clase: parsedJSON.clase,
                  nivel: parsedJSON.nivel || 1
                };
                console.log('📄 [executeImageJSON] Datos del personaje desde JSON:', personajeDataFromJSON);
              }
            }
          } catch (jsonError) {
            console.warn('⚠️ No se pudo parsear JSON para obtener datos del personaje:', jsonError);
          }

          try {
            const { created, personaje } = await ensurePersonajeExists(entry.metadata, personajeDataFromJSON);
            if (created) {
              showToast(`🆕 Personaje "${personaje.nombre}" creado automáticamente`, 'info');
            }
            // Configurar los inputs correctamente
            setPromptType('personaje');
            // ⚠️ USAR EL ID DEL PERSONAJE DEVUELTO (no el del metadata)
            setSelectedPersonajeId(personaje.id);
          } catch (error) {
            console.error('❌ Error verificando/creando personaje:', error);
            showToast(`❌ Error verificando/creando personaje: ${error instanceof Error ? error.message : String(error)}`, 'error');
            return;
          }
        } else if (entry.metadata.destino === 'heroe' && entry.metadata.clase) {
          setPromptType('heroe');
          setSelectedClase(entry.metadata.clase);
        }
        
        // Configurar otros inputs desde metadata
        if (entry.metadata.paragonType) setParagonType(entry.metadata.paragonType);
        if (entry.metadata.runaGemaType) setRunaGemaType(entry.metadata.runaGemaType);
        if (entry.metadata.mundoType) setMundoType(entry.metadata.mundoType);
        if (entry.metadata.talismanType) setTalismanType(entry.metadata.talismanType);
        if (entry.metadata.manualElementCount) setManualElementCount(entry.metadata.manualElementCount);
        
        // Dar tiempo para que los estados se actualicen
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        // Sin metadata, usar lógica anterior
        if (promptType === 'personaje' && !selectedPersonajeId) {
          if (selectedPersonaje?.id) {
            console.warn('⚠️ [executeImageJSON] Sin personaje seleccionado, usando selectedPersonaje del contexto:', selectedPersonaje.id);
            setSelectedPersonajeId(selectedPersonaje.id);
          } else {
            console.error('❌ [executeImageJSON] No hay personaje seleccionado para importar en modo personaje');
          }
        }
        if (promptType === 'heroe' && !selectedClase) {
          if (selectedPersonaje?.clase) {
            console.warn('⚠️ [executeImageJSON] Sin clase seleccionada, usando clase del personaje actual:', selectedPersonaje.clase);
            setSelectedClase(selectedPersonaje.clase);
          } else {
            console.error('❌ [executeImageJSON] No hay clase seleccionada para importar en modo héroe');
          }
        }
      }
      
      // Cargar JSON como texto para no fallar silenciosamente por parseo interno
      const jsonTextFromFile = await ImageService.loadJSONText(selectedCategory, imageName);
      if (!jsonTextFromFile) {
        console.error('❌ [executeImageJSON] JSON vacío o no legible para archivo:', imageName);
        showToast(`❌ No se encontró o no se pudo leer el JSON asociado a ${imageName}`, 'error');
        return;
      }
      
      // Temporal: establecer el JSON y ejecutar importación
      const originalJson = jsonText;
      setJsonText(jsonTextFromFile);
      
      // Ejecutar importación
      const result = await handleImportJSON({ jsonOverride: jsonTextFromFile, skipAutoSave: true });
      console.log('📊 [executeImageJSON] Resultado:', {
        success: result.success,
        imported: result.itemsImported,
        updated: result.itemsUpdated,
        repeated: result.itemsSkipped,
        error: result.errorMessage
      });
      
      // Mostrar resultados
      showImportResultsModal(result);
      
      // Restaurar JSON original si la importación falló
      if (!result.success) {
        setJsonText(originalJson);
      }
    } catch (error) {
      console.error('Error ejecutando JSON:', error);
      showToast(`❌ Error al ejecutar JSON de ${imageName}`, 'error');
    }
  };

  // Iniciar batch con selección de personaje
  const startBatchJSON = async (scope: 'category' | 'all') => {
    // ✅ Verificar si todos los JSONs tienen metadata completa
    const categories: ImageCategory[] = scope === 'category'
      ? [selectedCategory]
      : ['skills', 'glifos', 'aspectos', 'estadisticas', 'runas', 'build', 'otros'];

    let allEntries: Array<{ entry: GalleryEntry; cat: ImageCategory }> = [];
    
    // ✅ SI ES CARGA POR CATEGORÍA, USAR SOLO ELEMENTOS FILTRADOS VISIBLES
    if (scope === 'category') {
      const filteredImages = getFilteredGalleryEntries(galleryImages);
      console.log('📋 [startBatchJSON] Usando elementos filtrados de la galería:', filteredImages.length, 'de', galleryImages.length);
      
      // Convertir GalleryImage[] a formato esperado
      for (const img of filteredImages) {
        if (!img.metadata) continue; // Solo procesar elementos con JSON
        
        const entry: GalleryEntry = {
          nombre: img.nombre,
          categoria: selectedCategory,
          fecha: img.fecha,
          blob: null, // No necesitamos el blob aquí
          hasJSON: true,
          isJSONOnly: img.isJSONOnly || false,
          metadata: img.metadata
        };
        
        allEntries.push({ entry, cat: selectedCategory });
      }
    } else {
      // CARGA GLOBAL: Cargar todas las entradas de todas las categorías
      for (const cat of categories) {
        const entries = (await ImageService.listGalleryEntries(cat)).filter(entry => entry.hasJSON);
        allEntries.push(...entries.map(entry => ({ entry, cat })));
      }
    }

    if (allEntries.length === 0) {
      showToast('ℹ️ No hay JSONs guardados para importar', 'info');
      return;
    }

    // Verificar cuántos tienen metadata completa
    const entriesWithMetadata = allEntries.filter(e => {
      if (!e.entry.metadata) return false;
      
      // Verificar que tenga destino
      if (!e.entry.metadata.destino) return false;
      
      // Si es héroe, debe tener clase
      if (e.entry.metadata.destino === 'heroe' && !e.entry.metadata.clase) return false;
      
      // Si es personaje, debe tener personajeId
      if (e.entry.metadata.destino === 'personaje' && !e.entry.metadata.personajeId) return false;
      
      return true;
    });

    console.log('📋 [startBatchJSON] Análisis de metadata:', {
      total: allEntries.length,
      conMetadata: entriesWithMetadata.length,
      sinMetadata: allEntries.length - entriesWithMetadata.length,
      scope: scope,
      filtrosAplicados: scope === 'category'
    });

    // Si todos tienen metadata, ejecutar directamente sin modal
    if (entriesWithMetadata.length === allEntries.length) {
      console.log('✅ Todos los JSONs tienen metadata completa, ejecutando directamente...');
      await executeBatchJSONWithMetadata(scope, entriesWithMetadata);
    } else {
      // Si algunos no tienen metadata, mostrar modal como antes
      console.log('⚠️ Algunos JSONs no tienen metadata, mostrando modal de selección...');
      setPendingBatchScope(scope);
      setShowBatchPersonajeModal(true);
    }
  };

  // Ejecutar múltiples JSONs (batch) con personaje seleccionado
  const executeBatchJSON = async (targetPersonajeId: string) => {
    const scope = pendingBatchScope;
    if (!scope) return;
    
    try {
      setShowBatchPersonajeModal(false);
      setExecutingBatch(true);
      console.log('🚀 [executeBatchJSON] Inicio:', {
        scope,
        targetPersonajeId,
        selectedCategory,
        promptType
      });
      const executionResults: Array<{ cat: ImageCategory; entryName: string; result: ImportResultDetails }> = [];
      const categories: ImageCategory[] = scope === 'category'
        ? [selectedCategory]
        : ['skills', 'glifos', 'aspectos', 'estadisticas', 'runas', 'build', 'otros'];
      const originalCategory = selectedCategory;

      const allEntries: Array<{ entry: GalleryEntry; cat: ImageCategory }> = [];
      for (const cat of categories) {
        const entries = (await ImageService.listGalleryEntries(cat)).filter(entry => entry.hasJSON);
        allEntries.push(...entries.map(entry => ({ entry, cat })));
      }

      if (allEntries.length === 0) {
        showToast('ℹ️ No hay JSONs guardados para importar', 'info');
        setBatchProgress({ current: 0, total: 0, category: '', message: '', processedJsons: 0, processedItems: 0 });
        return;
      }

      let totalItems = 0;
      let totalImported = 0;
      let totalUpdated = 0;
      let totalInputItems = 0;
      let totalSuccess = 0;
      let totalFail = 0;
      let totalRepeated = 0;

      setBatchProgress({
        current: 0,
        total: allEntries.length,
        category: scope === 'category' ? selectedCategory : 'todas',
        message: 'Preparando importación masiva...',
        processedJsons: 0,
        processedItems: 0
      });

      for (let i = 0; i < allEntries.length; i++) {
        const { entry, cat } = allEntries[i];

        setBatchProgress(prev => ({
          ...prev,
          current: i + 1,
          category: cat,
          message: `Leyendo ${entry.nombre} (${i + 1}/${allEntries.length})...`
        }));

        setSelectedCategory(cat);
        await new Promise(resolve => setTimeout(resolve, 50));

        // ✅ SI HAY METADATA, USARLA PARA CONFIGURAR INPUTS
        if (entry.metadata) {
          console.log('📋 [executeBatchJSON] Metadata encontrada para:', entry.nombre, entry.metadata);
          
          // Configurar inputs desde metadata
          if (entry.metadata.destino) {
            setPromptType(entry.metadata.destino);
          }
          if (entry.metadata.clase && entry.metadata.destino === 'heroe') {
            setSelectedClase(entry.metadata.clase);
          }
          if (entry.metadata.personajeId && entry.metadata.destino === 'personaje') {
            setSelectedPersonajeId(entry.metadata.personajeId);
          }
          if (entry.metadata.paragonType) {
            setParagonType(entry.metadata.paragonType);
          }
          if (entry.metadata.runaGemaType) {
            setRunaGemaType(entry.metadata.runaGemaType);
          }
          if (entry.metadata.mundoType) {
            setMundoType(entry.metadata.mundoType);
          }
          if (entry.metadata.talismanType) {
            setTalismanType(entry.metadata.talismanType);
          }
          if (entry.metadata.manualElementCount) {
            setManualElementCount(entry.metadata.manualElementCount);
          }
          
          // Dar un pequeño tiempo para que los estados se actualicen
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Usar personaje destino seleccionado en el modal
        const effectivePersonajeId = targetPersonajeId;
        const targetPersonaje = personajes.find(p => p.id === effectivePersonajeId);
        
        if (!targetPersonaje) {
          console.error('❌ [executeBatchJSON] Personaje destino no encontrado:', effectivePersonajeId);
          totalFail++;
          continue;
        }
        
        console.log('✅ [executeBatchJSON] Importando para personaje:', {
          id: targetPersonaje.id,
          nombre: targetPersonaje.nombre,
          clase: targetPersonaje.clase
        });

        // Establecer contexto para la importación
        setSelectedPersonajeId(targetPersonaje.id);
        setSelectedClase(targetPersonaje.clase);

        const jsonTextFromFile = await ImageService.loadJSONText(cat, entry.nombre);
        if (!jsonTextFromFile) {
          console.error('❌ [executeBatchJSON] JSON no legible:', { categoria: cat, archivo: entry.nombre });
          totalFail++;
          executionResults.push({
            cat,
            entryName: entry.nombre,
            result: {
              success: false,
              category: cat,
              promptType,
              targetName: targetPersonaje.nombre,
              validationErrors: [],
              rawJSON: '',
              errorMessage: 'No se pudo leer el archivo JSON desde galería'
            }
          });
          continue;
        }

        setJsonText(jsonTextFromFile);
        const result = await handleImportJSON({ jsonOverride: jsonTextFromFile, skipAutoSave: true });
        executionResults.push({ cat, entryName: entry.nombre, result });

        const imported = result.itemsImported || 0;
        const updated = result.itemsUpdated || 0;
        const repeated = result.itemsSkipped || 0;
        const inputItems = result.totalInputItems || 0;
        totalItems += imported + updated;
        totalImported += imported;
        totalUpdated += updated;
        totalInputItems += inputItems;
        totalRepeated += repeated;

        if (result.success) {
          totalSuccess++;
        } else {
          totalFail++;
        }

        setBatchProgress(prev => ({
          ...prev,
          processedJsons: i + 1,
          processedItems: totalItems,
          message: result.success
            ? `Importado ${entry.nombre}: ${imported + updated} elementos`
            : `Error en ${entry.nombre}: ${result.errorMessage || 'falló validación'}`
        }));
      }

      setSelectedCategory(originalCategory);

      const summaryByCategory = categories.map(cat => {
        const rows = executionResults.filter(r => r.cat === cat);
        const ok = rows.filter(r => r.result.success).length;
        const fail = rows.length - ok;
        const imported = rows.reduce((acc, r) => acc + (r.result.itemsImported || 0), 0);
        const updated = rows.reduce((acc, r) => acc + (r.result.itemsUpdated || 0), 0);
        const repeated = rows.reduce((acc, r) => acc + (r.result.itemsSkipped || 0), 0);
        return `${getImportCategoryLabel(cat)}: ${ok}/${rows.length} JSONs, nuevos ${imported}, actualizados ${updated}, repetidos ${repeated}${fail > 0 ? `, ${fail} errores` : ''}`;
      });

      const validationErrors = executionResults
        .filter(r => !r.result.success || (r.result.validationErrors && r.result.validationErrors.some(e => e.severity === 'error')))
        .flatMap(r => {
          const base = (r.result.validationErrors || []).map(e => ({
            field: `${r.cat}/${r.entryName} - ${e.field}`,
            expected: e.expected,
            received: e.received,
            severity: e.severity
          }));
          if (r.result.errorMessage) {
            base.push({
              field: `${r.cat}/${r.entryName}`,
              expected: 'Importación correcta',
              received: r.result.errorMessage,
              severity: 'error' as const
            });
          }
          return base;
        });

      const batchSummary: ImportResultDetails = {
        success: totalFail === 0,
        category: scope === 'all' ? 'todas' : selectedCategory,
        promptType,
        targetName: scope === 'all' ? 'Todas las categorías' : `Categoría ${getImportCategoryLabel(selectedCategory)}`,
        jsonInputsProcessed: allEntries.length,
        totalInputItems,
        itemsImported: totalImported,
        itemsUpdated: totalUpdated,
        itemsSkipped: totalRepeated,
        fieldsAdded: [
          `JSONs procesados: ${allEntries.length}`,
          `Exitosos: ${totalSuccess}`,
          `Con error: ${totalFail}`,
          ...summaryByCategory
        ],
        processedJsons: executionResults.map(r => ({
          categoria: r.cat,
          archivo: r.entryName,
          totalInputItems: r.result.totalInputItems || 0,
          imported: r.result.itemsImported || 0,
          updated: r.result.itemsUpdated || 0,
          repeated: r.result.itemsSkipped || 0,
          success: r.result.success,
          error: r.result.errorMessage
        })),
        itemDetails: executionResults.flatMap(r =>
          (r.result.itemDetails || []).map(detail => ({
            ...detail,
            category: `${detail.category} / ${r.entryName}`
          }))
        ),
        validationErrors,
        rawJSON: JSON.stringify(
          executionResults.map(r => ({
            categoria: r.cat,
            archivo: r.entryName,
            success: r.result.success,
            imported: r.result.itemsImported || 0,
            updated: r.result.itemsUpdated || 0,
            error: r.result.errorMessage || null
          })),
          null,
          2
        ),
        errorMessage: totalFail > 0 ? `Se detectaron ${totalFail} errores durante la importación masiva` : undefined
      };

      // 🔄 RECARGAR PERSONAJE ACTUALIZADO DEL DISCO
      console.log('🔄 Recargando personaje actualizado del disco:', targetPersonajeId);
      try {
        const updatedPersonaje = await WorkspaceService.loadPersonaje(targetPersonajeId);
        if (updatedPersonaje) {
          console.log('✅ Personaje recargado, sincronizando contexto...');
          syncUpdatedPersonajeInContext(updatedPersonaje);
          
          // Si es el personaje seleccionado actualmente, actualizar también
          if (selectedPersonaje?.id === targetPersonajeId) {
            setSelectedPersonaje(updatedPersonaje);
          }
        } else {
          console.warn('⚠️ No se pudo recargar el personaje del disco');
        }
      } catch (error) {
        console.error('❌ Error recargando personaje:', error);
      }

      showImportResultsModal(batchSummary);
      showToast(
        totalFail > 0
          ? `⚠️ Batch completado con errores (${totalSuccess}/${allEntries.length} exitosos)`
          : `✅ Batch completado (${totalSuccess}/${allEntries.length} JSONs, ${totalItems} elementos)`,
        totalFail > 0 ? 'info' : 'success'
      );
    } catch (error) {
      console.error('Error en ejecución batch:', error);
      showToast('❌ Error al ejecutar batch de JSONs', 'error');
    } finally {
      setExecutingBatch(false);
      setBatchProgress({ current: 0, total: 0, category: '', message: '', processedJsons: 0, processedItems: 0 });
    }
  };

  // 🔧 HELPER: Asegurar que el personaje existe, crearlo si no existe
  const ensurePersonajeExists = async (
    metadata: JSONMetadata,
    personajeData?: { id: string; nombre: string; clase: string; nivel: number }
  ): Promise<{ created: boolean; personaje: Personaje }> => {
    // Solo aplicable a modo personaje
    if (metadata.destino !== 'personaje' || !metadata.personajeId) {
      throw new Error('Metadata no es válida para personaje');
    }

    // Determinar el ID correcto: priorizar el del JSON si está disponible
    const personajeId = personajeData?.id || metadata.personajeId;
    const personajeNombre = personajeData?.nombre || metadata.personajeNombre || `Personaje ${personajeId}`;
    const personajeClase = personajeData?.clase || metadata.personajeClase || 'Bárbaro';
    const personajeNivel = personajeData?.nivel || metadata.personajeNivel || 1;

    // Verificar si el personaje existe con el mismo ID del metadata
    const existingPersonaje = await WorkspaceService.loadPersonaje(personajeId);
    
    if (existingPersonaje) {
      console.log('✅ [ensurePersonajeExists] Personaje encontrado con ID del metadata:', personajeId);
      return { created: false, personaje: existingPersonaje };
    }

    // 🔍 BUSCAR PERSONAJE EXISTENTE CON MISMO NOMBRE (DIFERENTE ID)
    const personajeConMismoNombre = personajes.find(
      p => p.nombre === personajeNombre && p.id !== personajeId
    );

    if (personajeConMismoNombre) {
      console.log('🔄 [ensurePersonajeExists] Personaje con mismo nombre encontrado:', {
        existente: { id: personajeConMismoNombre.id, nombre: personajeConMismoNombre.nombre, clase: personajeConMismoNombre.clase, nivel: personajeConMismoNombre.nivel },
        metadata: { id: personajeId, nombre: personajeNombre, clase: personajeClase, nivel: personajeNivel }
      });

      // 📝 Verificar si ya hay una decisión "aplicar a todos" activa
      if (applyToAllDecision) {
        const previousDecision = personajeDecisions.get(personajeNombre);
        
        if (previousDecision === 'use-existing') {
          console.log('✅ [ensurePersonajeExists] Aplicando decisión "usar existente" (aplicar a todos)');
          console.log(`🔄 [PASO 1/5] Cambiando ID automáticamente: ${personajeConMismoNombre.id} → ${personajeId}`);
          
          // 🔄 CAMBIAR EL ID DEL PERSONAJE EXISTENTE AL ID DEL METADATA
          const personajeCompleto = await WorkspaceService.loadPersonaje(personajeConMismoNombre.id);
          if (!personajeCompleto) {
            throw new Error(`No se pudo cargar personaje ${personajeConMismoNombre.id}`);
          }

          console.log(`🔄 [PASO 2/5] Personaje cargado del disco`);

          // Crear personaje con nuevo ID del metadata (manteniendo clase y nivel actuales)
          const personajeConNuevoId: Personaje = {
            ...personajeCompleto,
            id: personajeId, // 🆕 Cambiar al ID del metadata
            fecha_actualizacion: new Date().toISOString()
          };

          console.log(`🔄 [PASO 3/5] Guardando personaje con nuevo ID: ${personajeId}`);
          // Guardar con nuevo ID
          await WorkspaceService.savePersonaje(personajeConNuevoId);

          console.log(`🔄 [PASO 4/5] Eliminando archivo antiguo: ${personajeConMismoNombre.id}`);
          // Eliminar archivo con ID antiguo
          await WorkspaceService.deletePersonaje(personajeConMismoNombre.id);

          console.log(`🔄 [PASO 5/5] Actualizando contexto de React`);
          // Actualizar contexto (reemplazar en array)
          const updatedPersonajes = personajes.map(p =>
            p.id === personajeConMismoNombre.id ? personajeConNuevoId : p
          );
          setPersonajes(updatedPersonajes);

          // ⏱️ ESPERAR A QUE EL CAMBIO SE COMPLETE
          await new Promise(resolve => setTimeout(resolve, 200));

          // ✅ VERIFICAR QUE EL ARCHIVO EXISTE ANTES DE CONTINUAR
          console.log(`✅ [VERIFICACIÓN] Verificando que el personaje con nuevo ID existe en disco...`);
          const verificacion = await WorkspaceService.loadPersonaje(personajeId);
          if (!verificacion) {
            throw new Error(`Error: El personaje con ID ${personajeId} no se encuentra en disco después del cambio`);
          }
          console.log(`✅ [VERIFICACIÓN] Personaje con ID ${personajeId} confirmado en disco`);

          console.log(`✅ ID cambiado automáticamente: ${personajeConMismoNombre.id} → ${personajeId}`);
          showToast(`🔄 Personaje "${personajeConNuevoId.nombre}" actualizado con nuevo ID`, 'info');
          
          return { created: false, personaje: personajeConNuevoId };
        } else if (previousDecision === 'create-new') {
          console.log('🆕 Creando nuevo personaje (decisión "aplicar a todos")');
          // Continuar con creación de nuevo personaje abajo
        }
      }

      // No hay decisión previa o no es "aplicar a todos", preguntar al usuario
      if (!applyToAllDecision) {
        console.log('❓ [ensurePersonajeExists] Sin decisión previa, mostrando modal...');
        
        const result = await new Promise<{ useExisting: boolean; applyToAll: boolean }>((resolve) => {
          setPendingRestoreData({
            existingPersonaje: {
              nombre: personajeConMismoNombre.nombre,
              clase: personajeConMismoNombre.clase,
              nivel: personajeConMismoNombre.nivel,
              id: personajeConMismoNombre.id
            },
            incomingData: {
              clase: personajeClase,
              nivel: personajeNivel,
              id: personajeId
            },
            resolve
          });
          setShowRestoreModal(true);
        });

        // Guardar decisión si el usuario eligió "aplicar a todos"
        if (result.applyToAll) {
          console.log('📌 Usuario activó "aplicar a todos"');
          setApplyToAllDecision(true);
          
          const decision = result.useExisting ? 'use-existing' : 'create-new';
          setPersonajeDecisions(prev => {
            const newMap = new Map(prev);
            newMap.set(personajeNombre, decision);
            return newMap;
          });
        }

        if (result.useExisting) {
          console.log('✅ Usuario confirmó usar personaje existente');
          console.log(`🔄 [PASO 1/5] Cambiando ID: ${personajeConMismoNombre.id} → ${personajeId}`);
          
          // 🔄 CAMBIAR EL ID DEL PERSONAJE EXISTENTE AL ID DEL METADATA
          const personajeCompleto = await WorkspaceService.loadPersonaje(personajeConMismoNombre.id);
          if (!personajeCompleto) {
            throw new Error(`No se pudo cargar personaje ${personajeConMismoNombre.id}`);
          }

          console.log(`🔄 [PASO 2/5] Personaje cargado del disco`);

          // Crear personaje con nuevo ID del metadata (manteniendo clase y nivel actuales)
          const personajeConNuevoId: Personaje = {
            ...personajeCompleto,
            id: personajeId, // 🆕 Cambiar al ID del metadata
            fecha_actualizacion: new Date().toISOString()
          };

          console.log(`🔄 [PASO 3/5] Guardando personaje con nuevo ID: ${personajeId}`);
          // Guardar con nuevo ID
          await WorkspaceService.savePersonaje(personajeConNuevoId);

          console.log(`🔄 [PASO 4/5] Eliminando archivo antiguo: ${personajeConMismoNombre.id}`);
          // Eliminar archivo con ID antiguo
          await WorkspaceService.deletePersonaje(personajeConMismoNombre.id);

          console.log(`🔄 [PASO 5/5] Actualizando contexto de React`);
          // Actualizar contexto (reemplazar en array)
          const updatedPersonajes = personajes.map(p =>
            p.id === personajeConMismoNombre.id ? personajeConNuevoId : p
          );
          setPersonajes(updatedPersonajes);

          // ⏱️ ESPERAR A QUE EL CAMBIO SE COMPLETE
          await new Promise(resolve => setTimeout(resolve, 200));

          // ✅ VERIFICAR QUE EL ARCHIVO EXISTE ANTES DE CONTINUAR
          console.log(`✅ [VERIFICACIÓN] Verificando que el personaje con nuevo ID existe en disco...`);
          const verificacion = await WorkspaceService.loadPersonaje(personajeId);
          if (!verificacion) {
            throw new Error(`Error: El personaje con ID ${personajeId} no se encuentra en disco después del cambio`);
          }
          console.log(`✅ [VERIFICACIÓN] Personaje con ID ${personajeId} confirmado en disco`);

          console.log(`✅ ID cambiado exitosamente: ${personajeConMismoNombre.id} → ${personajeId}`);
          showToast(`🔄 Personaje "${personajeConNuevoId.nombre}" actualizado con nuevo ID`, 'info');
          
          return { created: false, personaje: personajeConNuevoId };
        } else {
          console.log('ℹ️ Usuario eligió crear nuevo personaje');
          // Continuar con creación de nuevo personaje abajo
        }
      }
    }

    // El personaje no existe, crearlo con datos del JSON o del metadata
    const personajeInfo = {
      id: personajeId,
      nombre: personajeNombre,
      clase: personajeClase,
      nivel: personajeNivel
    };

    console.log('🆕 [ensurePersonajeExists] Creando personaje automáticamente:', personajeInfo);

    const newPersonaje: Personaje = {
      id: personajeInfo.id,
      nombre: personajeInfo.nombre,
      clase: personajeInfo.clase,
      nivel: personajeInfo.nivel,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    await WorkspaceService.savePersonaje(newPersonaje);
    
    // Agregar al contexto
    const updatedPersonajes = [...personajes, newPersonaje];
    setPersonajes(updatedPersonajes);
    
    showToast(`🆕 Personaje "${newPersonaje.nombre}" creado automáticamente`, 'info');
    
    return { created: true, personaje: newPersonaje };
  };

  // 🔧 HELPER: Filtrar galería según filtros actuales
  const getFilteredGalleryEntries = (images: GalleryImage[]): GalleryImage[] => {
    return images.filter(img => {
      // Si no hay metadata, incluir solo si todos los filtros están en "all"
      if (!img.metadata) {
        return galleryFilterDestino === 'all' && 
               galleryFilterClase === 'all' && 
               galleryFilterPersonaje === 'all' && 
               galleryFilterType === 'all';
      }

      // Filtro por destino
      if (galleryFilterDestino !== 'all' && img.metadata.destino !== galleryFilterDestino) {
        return false;
      }

      // Filtro por clase (solo para héroes)
      if (galleryFilterClase !== 'all') {
        if (img.metadata.destino !== 'heroe' || img.metadata.clase !== galleryFilterClase) {
          return false;
        }
      }

      // Filtro por personaje (solo para personajes)
      if (galleryFilterPersonaje !== 'all') {
        if (img.metadata.destino !== 'personaje' || img.metadata.personajeId !== galleryFilterPersonaje) {
          return false;
        }
      }

      // Filtro por tipo específico según categoría
      if (galleryFilterType !== 'all') {
        if (selectedCategory === 'paragon' && img.metadata.paragonType !== galleryFilterType) {
          return false;
        }
        if (selectedCategory === 'runas' && img.metadata.runaGemaType !== galleryFilterType) {
          return false;
        }
        if (selectedCategory === 'mundo' && img.metadata.mundoType !== galleryFilterType) {
          return false;
        }
        if (selectedCategory === 'talismanes' && img.metadata.talismanType !== galleryFilterType) {
          return false;
        }
      }

      return true;
    });
  };

  // 🔧 HELPER: Obtener opciones de filtro desde metadata de galería
  const getGalleryFilterOptions = (images: GalleryImage[]) => {
    const clases = new Set<string>();
    const personajesMap = new Map<string, { id: string; nombre: string; clase: string }>();

    images.forEach(img => {
      if (img.metadata) {
        // Recopilar clases de héroes
        if (img.metadata.destino === 'heroe' && img.metadata.clase) {
          clases.add(img.metadata.clase);
        }
        // Recopilar personajes
        if (img.metadata.destino === 'personaje' && img.metadata.personajeId && img.metadata.personajeNombre) {
          // Intentar obtener la clase del personaje guardado, si no existe usar el metadata
          const personajeGuardado = personajes.find(p => p.id === img.metadata!.personajeId);
          personajesMap.set(img.metadata.personajeId, {
            id: img.metadata.personajeId,
            nombre: img.metadata.personajeNombre,
            clase: personajeGuardado?.clase || 'Desconocida'
          });
        }
      }
    });

    return {
      clases: Array.from(clases).sort(),
      personajes: Array.from(personajesMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
    };
  };

  // ✅ NUEVA FUNCIÓN: Ejecutar batch usando metadata de cada JSON (sin modal de selección)
  const executeBatchJSONWithMetadata = async (scope: 'category' | 'all', filteredEntries?: Array<{ entry: GalleryEntry; cat: ImageCategory }>) => {
    try {
      setExecutingBatch(true);
      console.log('🚀 [executeBatchJSONWithMetadata] Inicio con metadata automática:', { scope });
      
      // 🧹 Limpiar decisiones previas al iniciar nuevo batch
      setPersonajeDecisions(new Map());
      setApplyToAllDecision(false);
      console.log('🧹 Decisiones de personajes y "aplicar a todos" limpiadas para nuevo batch');
      
      const executionResults: Array<{ cat: ImageCategory; entryName: string; result: ImportResultDetails }> = [];
      const categories: ImageCategory[] = scope === 'category'
        ? [selectedCategory]
        : ['skills', 'glifos', 'aspectos', 'estadisticas', 'runas', 'build', 'otros'];
      const originalCategory = selectedCategory;

      // ✅ USAR ENTRADAS FILTRADAS SI SE PASAN, SINO CARGAR TODAS
      let allEntries: Array<{ entry: GalleryEntry; cat: ImageCategory }> = [];
      
      if (filteredEntries) {
        allEntries = filteredEntries;
        console.log('📋 [executeBatchJSONWithMetadata] Usando elementos filtrados:', allEntries.length);
      } else {
        for (const cat of categories) {
          const entries = (await ImageService.listGalleryEntries(cat)).filter(entry => entry.hasJSON);
          allEntries.push(...entries.map(entry => ({ entry, cat })));
        }
        console.log('📋 [executeBatchJSONWithMetadata] Cargando todos los elementos:', allEntries.length);
      }

      // 🔄 ORDENAR POR FECHA: MÁS ANTIGUO PRIMERO
      // Esto asegura que los datos se acumulen en el orden correcto
      allEntries.sort((a, b) => {
        const dateA = new Date(a.entry.fecha).getTime();
        const dateB = new Date(b.entry.fecha).getTime();
        return dateA - dateB; // Ascendente: más antiguo primero
      });
      console.log('🔄 [executeBatchJSONWithMetadata] Entradas ordenadas por fecha (más antiguo primero)');

      if (allEntries.length === 0) {
        showToast('ℹ️ No hay JSONs guardados para importar', 'info');
        setBatchProgress({ current: 0, total: 0, category: '', message: '', processedJsons: 0, processedItems: 0 });
        return;
      }

      let totalItems = 0;
      let totalImported = 0;
      let totalUpdated = 0;
      let totalInputItems = 0;
      let totalSuccess = 0;
      let totalFail = 0;
      let totalRepeated = 0;
      const processedPersonajes = new Set<string>(); // Para recargar personajes al final
      const createdPersonajes: Array<{ id: string; nombre: string; clase: string }> = []; // Rastrear personajes creados

      setBatchProgress({
        current: 0,
        total: allEntries.length,
        category: scope === 'category' ? selectedCategory : 'todas',
        message: 'Preparando importación masiva con metadata...',
        processedJsons: 0,
        processedItems: 0
      });

      for (let i = 0; i < allEntries.length; i++) {
        const { entry, cat } = allEntries[i];

        setBatchProgress(prev => ({
          ...prev,
          current: i + 1,
          category: cat,
          message: `Procesando ${entry.nombre} (${i + 1}/${allEntries.length})...`
        }));

        setSelectedCategory(cat);
        await new Promise(resolve => setTimeout(resolve, 50));

        // ✅ USAR METADATA PARA CONFIGURAR INPUTS
        if (!entry.metadata) {
          console.error('❌ [executeBatchJSONWithMetadata] Sin metadata:', entry.nombre);
          totalFail++;
          executionResults.push({
            cat,
            entryName: entry.nombre,
            result: {
              success: false,
              category: cat,
              promptType: 'heroe',
              targetName: 'Desconocido',
              validationErrors: [],
              rawJSON: '',
              errorMessage: 'Falta metadata para importación automática'
            }
          });
          continue;
        }

        console.log('📋 [executeBatchJSONWithMetadata] Aplicando metadata:', {
          archivo: entry.nombre,
          metadata: entry.metadata
        });

        // Configurar inputs desde metadata
        setPromptType(entry.metadata.destino);
        
        // 🆕 Variable para guardar el ID del personaje a usar en la importación
        let personajeIdParaImportar: string | undefined = undefined;
        
        if (entry.metadata.clase && entry.metadata.destino === 'heroe') {
          setSelectedClase(entry.metadata.clase);
        }
        
        if (entry.metadata.personajeId && entry.metadata.destino === 'personaje') {
          // 🆕 LEER JSON PRIMERO PARA OBTENER DATOS COMPLETOS DEL PERSONAJE
          let personajeDataFromJSON: { id: string; nombre: string; clase: string; nivel: number } | undefined;
          
          try {
            const jsonTextForPersonaje = await ImageService.loadJSONText(cat, entry.nombre);
            if (jsonTextForPersonaje) {
              const parsedJSON = JSON.parse(jsonTextForPersonaje);
              if (parsedJSON.id && parsedJSON.nombre && parsedJSON.clase) {
                personajeDataFromJSON = {
                  id: parsedJSON.id,
                  nombre: parsedJSON.nombre,
                  clase: parsedJSON.clase,
                  nivel: parsedJSON.nivel || 1
                };
                console.log('📄 [executeBatchJSONWithMetadata] Datos del personaje desde JSON:', personajeDataFromJSON);
              }
            }
          } catch (jsonError) {
            console.warn('⚠️ No se pudo parsear JSON para obtener datos del personaje:', jsonError);
          }

          // 🆕 VERIFICAR Y CREAR PERSONAJE SI NO EXISTE
          
          try {
            const { created, personaje } = await ensurePersonajeExists(entry.metadata, personajeDataFromJSON);
            if (created) {
              createdPersonajes.push({
                id: personaje.id,
                nombre: personaje.nombre,
                clase: personaje.clase
              });
            }
            // ✅ GUARDAR EL ID DEL PERSONAJE DEVUELTO (puede ser diferente al del metadata si se cambió)
            personajeIdParaImportar = personaje.id;
            setSelectedPersonajeId(personaje.id);
            processedPersonajes.add(personaje.id);
            
            // ⏱️ ESPERA ADICIONAL PARA ASEGURAR SINCRONIZACIÓN
            console.log(`⏱️ [executeBatchJSONWithMetadata] Esperando sincronización del personaje...`);
            await new Promise(resolve => setTimeout(resolve, 150));
            
          } catch (error) {
            console.error('❌ Error verificando/creando personaje:', error);
            totalFail++;
            executionResults.push({
              cat,
              entryName: entry.nombre,
              result: {
                success: false,
                category: cat,
                promptType: entry.metadata.destino,
                targetName: entry.metadata.personajeNombre || 'Desconocido',
                validationErrors: [],
                rawJSON: '',
                errorMessage: `Error verificando/creando personaje: ${error instanceof Error ? error.message : String(error)}`
              }
            });
            continue;
          }
        }
        
        if (entry.metadata.paragonType) {
          setParagonType(entry.metadata.paragonType);
        }
        
        if (entry.metadata.runaGemaType) {
          setRunaGemaType(entry.metadata.runaGemaType);
        }
        
        if (entry.metadata.mundoType) {
          setMundoType(entry.metadata.mundoType);
        }
        
        if (entry.metadata.talismanType) {
          setTalismanType(entry.metadata.talismanType);
        }
        
        if (entry.metadata.manualElementCount) {
          setManualElementCount(entry.metadata.manualElementCount);
        }

        // ⏱️ Dar tiempo para que los estados se actualicen (solo si no es personaje, ya esperamos arriba)
        if (entry.metadata.destino !== 'personaje') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Determinar nombre del destino para logging
        let targetName = 'Desconocido';
        if (entry.metadata.destino === 'heroe' && entry.metadata.clase) {
          targetName = entry.metadata.clase;
        } else if (entry.metadata.destino === 'personaje') {
          targetName = entry.metadata.personajeNombre || 'Desconocido';
        }

        console.log('✅ [executeBatchJSONWithMetadata] Importando para:', {
          destino: entry.metadata.destino,
          nombre: targetName,
          categoria: cat,
          personajeId: personajeIdParaImportar
        });

        // Leer y ejecutar JSON
        const jsonTextFromFile = await ImageService.loadJSONText(cat, entry.nombre);
        if (!jsonTextFromFile) {
          console.error('❌ [executeBatchJSONWithMetadata] JSON no legible:', { categoria: cat, archivo: entry.nombre });
          totalFail++;
          executionResults.push({
            cat,
            entryName: entry.nombre,
            result: {
              success: false,
              category: cat,
              promptType: entry.metadata.destino,
              targetName,
              validationErrors: [],
              rawJSON: '',
              errorMessage: 'No se pudo leer el archivo JSON desde galería'
            }
          });
          continue;
        }

        setJsonText(jsonTextFromFile);
        
        // 🆕 PASAR EL ID CORRECTO DEL PERSONAJE A handleImportJSON
        const result = await handleImportJSON({ 
          jsonOverride: jsonTextFromFile, 
          skipAutoSave: true,
          personajeIdOverride: personajeIdParaImportar // ✅ Usar el ID devuelto por ensurePersonajeExists
        });
        executionResults.push({ cat, entryName: entry.nombre, result });

        const imported = result.itemsImported || 0;
        const updated = result.itemsUpdated || 0;
        const repeated = result.itemsSkipped || 0;
        const inputItems = result.totalInputItems || 0;
        totalItems += imported + updated;
        totalImported += imported;
        totalUpdated += updated;
        totalInputItems += inputItems;
        totalRepeated += repeated;

        if (result.success) {
          totalSuccess++;
        } else {
          totalFail++;
        }

        setBatchProgress(prev => ({
          ...prev,
          processedJsons: i + 1,
          processedItems: totalItems,
          message: result.success
            ? `Importado ${entry.nombre}: ${imported + updated} elementos`
            : `Error en ${entry.nombre}: ${result.errorMessage || 'falló validación'}`
        }));
      }

      setSelectedCategory(originalCategory);

      // Resumen por categoría
      const summaryByCategory = categories.map(cat => {
        const rows = executionResults.filter(r => r.cat === cat);
        const ok = rows.filter(r => r.result.success).length;
        const fail = rows.length - ok;
        const imported = rows.reduce((acc, r) => acc + (r.result.itemsImported || 0), 0);
        const updated = rows.reduce((acc, r) => acc + (r.result.itemsUpdated || 0), 0);
        const repeated = rows.reduce((acc, r) => acc + (r.result.itemsSkipped || 0), 0);
        return `${getImportCategoryLabel(cat)}: ${ok}/${rows.length} JSONs, nuevos ${imported}, actualizados ${updated}, repetidos ${repeated}${fail > 0 ? `, ${fail} errores` : ''}`;
      });

      const validationErrors = executionResults
        .filter(r => !r.result.success || (r.result.validationErrors && r.result.validationErrors.some(e => e.severity === 'error')))
        .flatMap(r => {
          const base = (r.result.validationErrors || []).map(e => ({
            field: `${r.cat}/${r.entryName} - ${e.field}`,
            expected: e.expected,
            received: e.received,
            severity: e.severity
          }));
          if (r.result.errorMessage) {
            base.push({
              field: `${r.cat}/${r.entryName}`,
              expected: 'Importación correcta',
              received: r.result.errorMessage,
              severity: 'error' as const
            });
          }
          return base;
        });

      const batchSummary: ImportResultDetails = {
        success: totalFail === 0,
        category: scope === 'all' ? 'todas' : selectedCategory,
        promptType: 'personaje', // Puede variar por JSON
        targetName: scope === 'all' ? 'Múltiples destinos (automático)' : `Categoría ${getImportCategoryLabel(selectedCategory)}`,
        jsonInputsProcessed: allEntries.length,
        totalInputItems,
        itemsImported: totalImported,
        itemsUpdated: totalUpdated,
        itemsSkipped: totalRepeated,
        fieldsAdded: [
          `JSONs procesados: ${allEntries.length}`,
          `Exitosos: ${totalSuccess}`,
          `Con error: ${totalFail}`,
          ...(createdPersonajes.length > 0 ? [
            `🆕 Personajes creados automáticamente: ${createdPersonajes.length}`,
            ...createdPersonajes.map(p => `   • ${p.nombre} (${p.clase}) - ID: ${p.id}`)
          ] : []),
          ...summaryByCategory
        ],
        processedJsons: executionResults.map(r => ({
          categoria: r.cat,
          archivo: r.entryName,
          totalInputItems: r.result.totalInputItems || 0,
          imported: r.result.itemsImported || 0,
          updated: r.result.itemsUpdated || 0,
          repeated: r.result.itemsSkipped || 0,
          success: r.result.success,
          error: r.result.errorMessage
        })),
        itemDetails: executionResults.flatMap(r =>
          (r.result.itemDetails || []).map(detail => ({
            ...detail,
            category: `${detail.category} / ${r.entryName}`
          }))
        ),
        validationErrors,
        rawJSON: JSON.stringify(
          executionResults.map(r => ({
            categoria: r.cat,
            archivo: r.entryName,
            success: r.result.success,
            imported: r.result.itemsImported || 0,
            updated: r.result.itemsUpdated || 0,
            error: r.result.errorMessage || null
          })),
          null,
          2
        ),
        errorMessage: totalFail > 0 ? `Se detectaron ${totalFail} errores durante la importación masiva` : undefined
      };

      // 🔄 RECARGAR PERSONAJES ACTUALIZADOS DEL DISCO
      console.log('🔄 Recargando personajes actualizados del disco:', Array.from(processedPersonajes));
      for (const personajeId of processedPersonajes) {
        try {
          const updatedPersonaje = await WorkspaceService.loadPersonaje(personajeId);
          if (updatedPersonaje) {
            console.log('✅ Personaje recargado:', updatedPersonaje.nombre);
            syncUpdatedPersonajeInContext(updatedPersonaje);
            
            // Si es el personaje seleccionado actualmente, actualizar también
            if (selectedPersonaje?.id === personajeId) {
              setSelectedPersonaje(updatedPersonaje);
            }
          } else {
            console.warn('⚠️ No se pudo recargar el personaje:', personajeId);
          }
        } catch (error) {
          console.error('❌ Error recargando personaje:', personajeId, error);
        }
      }

      showImportResultsModal(batchSummary);
      showToast(
        totalFail > 0
          ? `⚠️ Batch completado con errores (${totalSuccess}/${allEntries.length} exitosos)`
          : `✅ Batch completado automáticamente (${totalSuccess}/${allEntries.length} JSONs, ${totalItems} elementos)`,
        totalFail > 0 ? 'info' : 'success'
      );
    } catch (error) {
      console.error('Error en ejecución batch con metadata:', error);
      showToast('❌ Error al ejecutar batch de JSONs', 'error');
    } finally {
      setExecutingBatch(false);
      setBatchProgress({ current: 0, total: 0, category: '', message: '', processedJsons: 0, processedItems: 0 });
    }
  };

  // Procesar con IA (Gemini) - ahora acepta configuración opcional
  const processWithAI = async (config?: {
    paragonType?: ParagonType;
    runaGemaType?: 'runas' | 'gemas';
    mundoType?: MundoType;
  }) => {
    
    // Determinar qué imagen usar (galería seleccionada o compuesta)
    const imageToProcess = selectedGalleryImage || composedImageUrl;
    
    if (!imageToProcess) {
      showToast('❌ No hay imagen para procesar', 'error');
      return;
    }
    
    console.log('🖼️ [processWithAI] Imagen a procesar:', {
      tipo: selectedGalleryImage ? 'galería' : 'compuesta',
      url: imageToProcess.substring(0, 50) + '...'
    });
    
    if (config) {
    }

    setAiProcessing(true);
    setAiProgress('sending');
    setAiExtractedJSON('');

    try {
      // 1. Input entregado, procesando con IA
      showToast('🤖 Enviando imagen y prompt a Gemini...', 'info');

      // Obtener el blob de la imagen principal (galería o compuesta)
      let imageBlob: Blob;
      if (selectedGalleryImageBlob) {
        imageBlob = selectedGalleryImageBlob;
      } else {
        const response = await fetch(imageToProcess);
        imageBlob = await response.blob();
      }

      // Preparar imágenes adicionales (leyenda para mazmorras de aspectos)
      const additionalImages: Blob[] = [];
      const effectiveMundoType = config?.mundoType ?? mundoType;
      
      if (selectedCategory === 'mundo' && effectiveMundoType === 'mazmorras_aspectos') {
        try {
          // Cargar imagen de leyenda de iconos de clases
          const leyendaPath = '/src/img/utils/leyenda.png';
          const leyendaResponse = await fetch(leyendaPath);
          if (leyendaResponse.ok) {
            const leyendaBlob = await leyendaResponse.blob();
            additionalImages.push(leyendaBlob);
            console.log('📎 [processWithAI] Leyenda de iconos adjunta');
          }
        } catch (error) {
          console.warn('⚠️ No se pudo cargar la leyenda de iconos:', error);
        }
      }

      // Obtener el prompt
      const prompt = getPromptForCategory(config?.paragonType, config?.runaGemaType, config?.mundoType);

      // 2. Procesando con IA
      setAiProgress('processing');
      showToast('⚡ Gemini está analizando la imagen...', 'info');

      // ✨ NUEVA INTEGRACIÓN CON FALLBACK AUTOMÁTICO
      // El servicio intentará múltiples modelos hasta que uno funcione
      const result = await GeminiService.processAndExtractJSON(
        {
          image: imageBlob,
          prompt: prompt,
          temperature: 0.1, // Máxima precisión para extracción de datos
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 8192
        },
        {
          apiKey: GEMINI_API_KEY,
          useJsonMode: true  // ⭐ MODO JSON PURO - respuesta sin markdown
          // NO especificamos 'model' - usa fallback automático de modelos válidos
        }
      );

      console.log('📊 [processWithAI] Resultado de Gemini:', {
        success: result.success,
        modelUsed: result.modelUsed,
        hasJson: !!result.json,
        jsonLength: result.json?.length || 0,
        error: result.error
      });

      if (!result.success) {
        throw new Error(result.error || 'Error al procesar con Gemini');
      }

      // Mostrar qué modelo funcionó
      showToast(`✅ Procesado con ${result.modelUsed}`, 'success');

      // 3. JSON obtenido
      setAiProgress('received');
      setAiExtractedJSON(result.json);

      // Validar que sea JSON válido
      try {
        JSON.parse(result.json);
      } catch (parseError) {
        console.error('❌ [processWithAI] Error parseando JSON:', parseError);
        throw new Error('La respuesta de Gemini no contiene JSON válido');
      }

      // 4. Guardar automáticamente
      setAiProgress('saving');
      showToast('💾 Validando y guardando datos automáticamente...', 'info');

      // Usar la función existente handleImportJSON pero con el JSON de la IA
      setJsonText(result.json);
      
      // Esperar un momento para que se actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Ejecutar la importación automáticamente y capturar el resultado
      const importResult = await handleImportJSON();

      // 5. Mostrar modal con resultados
      showImportResultsModal(importResult);

      // 6. Proceso completado
      setAiProgress('done');
      
      // Si fue exitoso, mostrar toast de éxito, sino el modal ya muestra el error
      if (importResult.success) {
        showToast('🎉 ¡Proceso completado exitosamente!', 'success');
      }

      // Resetear después de 3 segundos
      setTimeout(() => {
        setAiProgress('idle');
        setAiProcessing(false);
      }, 3000);

    } catch (error) {
      console.error('❌ [processWithAI] Error:', error);
      console.error('❌ [processWithAI] Stack:', error instanceof Error ? error.stack : 'N/A');
      
      // Mostrar modal de error incluso si no hay resultado de importación
      const errorResult: ImportResultDetails = {
        success: false,
        category: resolveImportCategory(selectedCategory, runaGemaType),
        promptType,
        targetName: getImportTargetName(
          selectedCategory,
          promptType,
          selectedClase,
          personajes.find(p => p.id === selectedPersonajeId)?.nombre || '',
          runaGemaType
        ),
        validationErrors: [],
        rawJSON: aiExtractedJSON || '',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido al procesar con IA'
      };
      
      showImportResultsModal(errorResult);
      
      showToast(`❌ ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      setAiProgress('idle');
      setAiProcessing(false);
    }
  };

  // ============================================================================
  // 🚀 PROCESAR CON OPENAI (PARALELO A GEMINI)
  // ============================================================================
  // Procesar con OpenAI - ahora acepta configuración opcional
  const processWithOpenAI = async (config?: {
    paragonType?: ParagonType;
    runaGemaType?: 'runas' | 'gemas';
    mundoType?: MundoType;
  }) => {
    
    // Verificar crédito disponible antes de procesar
    const creditCheck = await BillingService.hasAvailableCredit();
    if (!creditCheck.hasCredit) {
      showToast(
        `⚠️ Sin créditos disponibles. Has usado $${creditCheck.used.toFixed(4)} de $${creditCheck.limit.toFixed(2)}. Recarga créditos desde tu perfil o menú Premium.`,
        'error'
      );
      // El usuario puede hacer click en el badge de créditos o ir a Premium para recargar
      return;
    }

    // Determinar qué imagen usar (galería seleccionada o compuesta)
    const imageToProcess = selectedGalleryImage || composedImageUrl;
    
    if (!imageToProcess) {
      showToast('❌ No hay imagen para procesar', 'error');
      return;
    }
    
    console.log('🖼️ [processWithOpenAI] Imagen a procesar:', {
      tipo: selectedGalleryImage ? 'galería' : 'compuesta',
      url: imageToProcess.substring(0, 50) + '...'
    });
    
    if (config) {
    }

    setOpenAiProcessing(true);
    setOpenAiProgress('sending');
    setOpenAiExtractedJSON('');

    try {
      // 1. Input entregado, procesando con IA
      showToast('🤖 Enviando imagen y prompt a OpenAI...', 'info');

      // Obtener el blob de la imagen principal (galería o compuesta)
      let imageBlob: Blob;
      if (selectedGalleryImageBlob) {
        imageBlob = selectedGalleryImageBlob;
      } else {
        const response = await fetch(imageToProcess);
        imageBlob = await response.blob();
      }

      // Preparar imágenes adicionales (leyenda para mazmorras de aspectos)
      const additionalImages: Blob[] = [];
      const effectiveMundoType = config?.mundoType ?? mundoType;
      
      if (selectedCategory === 'mundo' && effectiveMundoType === 'mazmorras_aspectos') {
        try {
          // Cargar imagen de leyenda de iconos de clases
          const leyendaPath = '/src/img/utils/leyenda.png';
          const leyendaResponse = await fetch(leyendaPath);
          if (leyendaResponse.ok) {
            const leyendaBlob = await leyendaResponse.blob();
            additionalImages.push(leyendaBlob);
            console.log('📎 [processWithOpenAI] Leyenda de iconos adjunta');
          }
        } catch (error) {
          console.warn('⚠️ No se pudo cargar la leyenda de iconos:', error);
        }
      }

      // Obtener el prompt (usando versión simplificada para OpenAI si es nodos de Paragon)
      let prompt: string;
      const effectiveParagonType = config?.paragonType ?? paragonType;
      
      if (selectedCategory === 'paragon' && effectiveParagonType === 'nodo') {
        // Usar prompt simplificado para OpenAI (evita filtros de contenido)
        prompt = ImageExtractionPromptService.generateParagonNodesPromptForOpenAI();
      } else {
        // Usar prompt normal
        prompt = getPromptForCategory(config?.paragonType, config?.runaGemaType, config?.mundoType);
      }

      // 2. Procesando con IA
      setOpenAiProgress('processing');
      showToast('⚡ OpenAI GPT-4o está analizando la imagen...', 'info');

      // ✨ LLAMADA A OPENAI SERVICE
      const result = await OpenAIService.processAndExtractJSON(
        {
          image: imageBlob,
          prompt: prompt,
          temperature: 0.1, // Máxima precisión para extracción de datos
          maxTokens: 4096,
          billingMetadata: {
            category: selectedCategory,
            tipo: selectedCategory === 'paragon' ? effectiveParagonType : (selectedCategory === 'runas' ? runaGemaType : (selectedCategory === 'mundo' ? effectiveMundoType : undefined)),
            destination: promptType,
            clase: effectiveClaseForActions,
            personaje: effectivePersonajeIdForActions ? personajes.find(p => p.id === effectivePersonajeIdForActions)?.nombre : undefined
          }
        },
        {
          apiKey: OPENAI_API_KEY,
          model: 'gpt-4o', // Modelo específico
          maxTokens: 4096
        }
      );

      console.log('📊 [processWithOpenAI] Resultado de OpenAI:', {
        success: result.success,
        modelUsed: result.modelUsed,
        hasJson: !!result.json,
        jsonLength: result.json?.length || 0,
        tokensUsed: result.tokensUsed,
        error: result.error
      });

      if (!result.success) {
        throw new Error(result.error || 'Error al procesar con OpenAI');
      }

      // Mostrar qué modelo funcionó
      showToast(`✅ Procesado con ${result.modelUsed}`, 'success');

      // 3. JSON obtenido
      setOpenAiProgress('received');
      setOpenAiExtractedJSON(result.json);

      // Validar que sea JSON válido
      try {
        JSON.parse(result.json);
      } catch (parseError) {
        console.error('❌ [processWithOpenAI] Error parseando JSON:', parseError);
        throw new Error('La respuesta de OpenAI no contiene JSON válido');
      }

      // 4. Guardar automáticamente
      setOpenAiProgress('saving');
      showToast('💾 Validando y guardando datos automáticamente...', 'info');

      // Usar la función existente handleImportJSON pero con el JSON de la IA
      setJsonText(result.json);
      
      // Esperar un momento para que se actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Ejecutar la importación automáticamente y capturar el resultado
      const importResult = await handleImportJSON();

      // 5. Mostrar modal con resultados
      showImportResultsModal(importResult);

      // 6. Proceso completado
      setOpenAiProgress('done');
      
      // Si fue exitoso, mostrar toast de éxito, sino el modal ya muestra el error
      if (importResult.success) {
        showToast('🎉 ¡Proceso completado exitosamente con OpenAI!', 'success');
      }

      // Resetear después de 3 segundos
      setTimeout(() => {
        setOpenAiProgress('idle');
        setOpenAiProcessing(false);
      }, 3000);

    } catch (error) {
      console.error('❌ [processWithOpenAI] Error:', error);
      console.error('❌ [processWithOpenAI] Stack:', error instanceof Error ? error.stack : 'N/A');
      
      // Mostrar modal de error incluso si no hay resultado de importación
      const errorResult: ImportResultDetails = {
        success: false,
        category: resolveImportCategory(selectedCategory, runaGemaType),
        promptType,
        targetName: getImportTargetName(
          selectedCategory,
          promptType,
          selectedClase,
          personajes.find(p => p.id === selectedPersonajeId)?.nombre || '',
          runaGemaType
        ),
        validationErrors: [],
        rawJSON: openAiExtractedJSON || '',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido al procesar con OpenAI'
      };
      
      showImportResultsModal(errorResult);
      
      showToast(`❌ ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      setOpenAiProgress('idle');
      setOpenAiProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="card max-w-7xl w-full max-h-[90vh] overflow-y-auto relative z-[1]">
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 z-[100] p-2 sm:p-4 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 animate-slide-in-right ${
            toastType === 'success' ? 'bg-green-600 text-white' :
            toastType === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}>
            {toastType === 'success' && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
            {toastType === 'error' && <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
            {toastType === 'info' && <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-1 sm:ml-2 hover:opacity-70">
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        {/* Header mejorado: Título + Botones principales + Cerrar */}
        <div className="mb-6 sticky top-0 bg-d4-surface pb-4 border-b-2 border-d4-accent/30 z-[50]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-d4-accent/20 rounded-lg border border-d4-accent/40">
                <Camera className="w-6 h-6 text-d4-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-d4-accent">Captura de Datos</h2>
                <p className="text-xs text-d4-text-dim">Importa información desde imágenes del juego</p>
              </div>
            </div>
            
            <div className="flex gap-2 items-center">
              {/* Botones Capturar/Galería mejorados */}
              <button
                onClick={() => setShowGallery(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${
                  !showGallery 
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-black hover:from-amber-500 hover:to-yellow-500 scale-105' 
                    : 'bg-d4-bg text-d4-text hover:bg-d4-border'
                }`}
                title="Capturar imágenes"
              >
                <Camera className="w-5 h-5" />
                <span>Capturar</span>
              </button>
              <button
                onClick={() => { setShowGallery(true); loadGallery(); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${
                  showGallery 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 scale-105' 
                    : 'bg-d4-bg text-d4-text hover:bg-d4-border'
                }`}
                title="Ver galería"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Galería</span>
                {categoryCounts[selectedCategory] > 0 && (
                  <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                    {categoryCounts[selectedCategory]}
                  </span>
                )}
              </button>
              <div className="w-px h-8 bg-d4-border mx-1" />
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors border border-d4-border hover:border-red-600" 
                title="Cerrar"
              >
                <X className="w-5 h-5 text-d4-text hover:text-red-400" />
              </button>
            </div>
          </div>
          
          {/* Selector de categorías - Carrusel horizontal minimalista */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-d4-accent" />
              <span className="text-xs font-semibold text-d4-text-dim">Categoría</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-d4-accent scrollbar-track-d4-border">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.value;
                const count = categoryCounts[cat.value] || 0;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 border whitespace-nowrap ${
                      isSelected
                        ? 'bg-d4-accent text-black border-d4-accent shadow-md'
                        : 'bg-d4-surface/50 text-d4-text-dim border-d4-border/50 hover:border-d4-accent/50 hover:text-d4-text'
                    }`}
                    title={cat.label}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-d4-text-dim'}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-black' : 'text-d4-text-dim'}`}>
                      {cat.label}
                    </span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isSelected 
                          ? 'bg-black/20 text-black' 
                          : 'bg-d4-accent/20 text-d4-accent'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Barra de progreso y botón Prompt (solo visible en tab Captura) */}
        {!showGallery && (
          <div className="mb-3 flex items-center gap-2 justify-between flex-wrap">
            {/* Botón Prompt con tooltip integrado */}
            <div className="relative group order-2">
              <button
                onClick={() => setShowPromptPanel(!showPromptPanel)}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                  showPromptPanel
                    ? 'bg-d4-accent text-black'
                    : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                }`}
                title="Toggle panel de prompt"
              >
                <Copy className="w-3.5 h-3.5" />
                Prompt
                {showPromptPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {/* Tooltip de instrucciones */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-d4-surface border-2 border-d4-accent rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
                <p className="text-xs font-bold text-d4-accent mb-1.5">
                  📸 Instrucciones de Captura:
                </p>
                <ul className="text-[10px] text-d4-text-dim space-y-0.5 list-disc list-inside">
                  <li>Screenshot: <kbd className="px-1 py-0.5 bg-d4-bg rounded">Win + Shift + S</kbd></li>
                  <li>Modo Nuevo: Agrega a la DERECHA (elemento diferente)</li>
                  <li>Modo Completar: Agrega ABAJO (parte del mismo elemento)</li>
                  <li>Pega: <kbd className="px-1 py-0.5 bg-d4-bg rounded">Ctrl + V</kbd></li>
                </ul>
              </div>
            </div>
            
            {/* Barra de progreso minimalista */}
            <div className="relative group flex items-center gap-2 order-1">
              <span className="text-[10px] text-d4-text-dim font-semibold">{getElementCount()}/{getRecommendedMax(selectedCategory)}</span>
              <input
                type="number"
                min="0"
                placeholder="Man"
                value={manualElementCount ?? ''}
                onChange={(e) => setManualElementCount(e.target.value ? parseInt(e.target.value) : null)}
                className="w-10 px-1 py-0.5 text-[10px] bg-d4-surface border border-d4-border rounded text-d4-text text-center"
                title="Override manual"
              />
              <div className="w-20 sm:w-24 bg-d4-surface rounded-full h-2 overflow-hidden border border-d4-border cursor-help">
                <div 
                  className={`h-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              {/* Tooltip con recomendación completa */}
              <div className="absolute right-0 top-full mt-2 w-64 bg-d4-surface border-2 border-cyan-500 rounded-lg p-2.5 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60]">
                <p className="text-xs font-bold text-cyan-300 mb-1.5">
                  💡 Recomendación para {CATEGORIES.find(c => c.value === selectedCategory)?.label}:
                </p>
                <div className="text-xs sm:text-sm text-d4-text-dim space-y-1">
                  {selectedCategory === 'skills' && (
                    <>
                      <p><strong>Máximo: 3-4 habilidades</strong></p>
                      <p className="text-xs">Cada habilidad tiene múltiples atributos. Más de 4 puede afectar precisión.</p>
                    </>
                  )}
                  {selectedCategory === 'glifos' && (
                    <>
                      <p><strong>Máximo: 5-6 glifos</strong></p>
                      <p className="text-xs">Los glifos tienen menos campos, puedes incluir más elementos.</p>
                    </>
                  )}
                  {selectedCategory === 'aspectos' && (
                    <>
                      <p><strong>Máximo: 4-5 aspectos</strong></p>
                      <p className="text-xs">Incluyen keywords y tags. Mantener 4-5 asegura precisión.</p>
                    </>
                  )}
                  {selectedCategory === 'estadisticas' && (
                    <>
                      <p><strong>Máximo: 1 imagen completa</strong></p>
                      <p className="text-xs">Captura todas las pestañas del juego verticalmente.</p>
                    </>
                  )}
                  {selectedCategory === 'otros' && (
                    <>
                      <p><strong>Variable según contenido</strong></p>
                      <p className="text-xs">Evalúa la complejidad y ajusta.</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs border-t border-d4-border pt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-d4-text-dim">Óptimo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-d4-text-dim">Riesgo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-d4-text-dim">Excedido</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido según tab */}
        {!showGallery && (
          <div className="space-y-6">
            {/* Preview de imagen compuesta con panel de prompt lateral */}
            <div className={`grid gap-4 ${showPromptPanel ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Panel de Preview */}
              <div className="bg-d4-bg p-4 rounded border-2 border-d4-accent/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-d4-accent flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Preview
                  </h3>
                </div>
                
                {composedImageUrl ? (
                  <div className="bg-white p-4 rounded max-h-96 overflow-auto border-2 border-green-500/50 relative group">
                    {/* Botón de vista ampliada */}
                    <button
                      onClick={() => setViewerImage({ url: composedImageUrl, name: 'Imagen compuesta' })}
                      className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Ver imagen grande"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    
                    {/* Botones de modo de captura flotantes */}
                    <div className="absolute top-2 left-2 flex gap-2 z-10">
                      <button
                        onClick={() => setCaptureMode('new')}
                        className={`group/btn w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full font-bold transition-all shadow-lg ${
                          captureMode === 'new'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white scale-105'
                            : 'bg-d4-surface/90 text-d4-text hover:bg-d4-border backdrop-blur-sm'
                        }`}
                        title="Nuevo Elemento - Agrega a la derecha (horizontal)"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => setCaptureMode('continue')}
                        className={`group/btn w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full font-bold transition-all shadow-lg ${
                          captureMode === 'continue'
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white scale-105'
                            : 'bg-d4-surface/90 text-d4-text hover:bg-d4-border backdrop-blur-sm'
                        }`}
                        title="Completar - Agrega abajo (vertical)"
                      >
                        <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={copyLastSavedImage}
                        disabled={!lastSavedImageUrl}
                        className={`group/btn w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full font-bold transition-all shadow-lg ${
                          lastSavedImageUrl
                            ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white'
                            : 'bg-gray-600/90 text-gray-400 cursor-not-allowed backdrop-blur-sm'
                        }`}
                        title={lastSavedImageUrl ? 'Copiar última imagen guardada para pegarla' : 'No hay imagen guardada en esta categoría'}
                      >
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                    
                    <img src={composedImageUrl} alt="Composed" className="w-full h-auto object-contain" style={{ maxWidth: '100%', transform: 'scale(0.85)' }} />
                  </div>
                ) : (
                  <div className="bg-d4-surface p-8 rounded border-2 border-dashed border-d4-border flex flex-col items-center justify-center min-h-[200px] relative">
                    {/* Botones de modo de captura flotantes */}
                    <div className="absolute top-2 left-2 flex gap-2 z-10">
                      <button
                        onClick={() => setCaptureMode('new')}
                        className={`group/btn w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full font-bold transition-all shadow-lg ${
                          captureMode === 'new'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white scale-105'
                            : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                        }`}
                        title="Nuevo Elemento - Agrega a la derecha (horizontal)"
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => setCaptureMode('continue')}
                        className={`group/btn w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full font-bold transition-all shadow-lg ${
                          captureMode === 'continue'
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white scale-105'
                            : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                        }`}
                        title="Completar - Agrega abajo (vertical)"
                      >
                        <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={copyLastSavedImage}
                        disabled={!lastSavedImageUrl}
                        className={`group/btn w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full font-bold transition-all shadow-lg ${
                          lastSavedImageUrl
                            ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                        title={lastSavedImageUrl ? 'Copiar última imagen guardada para pegarla' : 'No hay imagen guardada en esta categoría'}
                      >
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                    
                    <ImageIcon className="w-16 h-16 text-d4-text-dim mb-3" />
                    <p className="text-d4-text-dim text-center">
                      La imagen compuesta aparecerá aquí en tiempo real
                      <br />
                      <span className="text-xs">Pega o carga imágenes para comenzar</span>
                    </p>
                    <p className="text-xs text-d4-text-dim mt-3 text-center">
                      💡 Presiona <kbd className="px-2 py-0.5 bg-d4-surface rounded">Ctrl + V</kbd> para pegar
                    </p>
                  </div>
                )}

                {/* Opciones de guardado */}
                <div className="mt-4 space-y-3">
                  {/* Botones de acción - Diseño compacto y distribuido */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {/* Guardar */}
                    <button 
                      onClick={saveComposedImage} 
                      disabled={!composedImageUrl}
                      className={`p-3 rounded-lg font-semibold transition-all flex items-center justify-center ${
                        composedImageUrl
                          ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Guardar imagen en la galería"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    
                    {/* Descargar */}
                    <button 
                      onClick={downloadComposedImage} 
                      disabled={!composedImageUrl}
                      className={`p-3 rounded-lg font-semibold transition-all flex items-center justify-center ${
                        composedImageUrl
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Descargar imagen a tu PC"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    
                    {/* Copiar */}
                    <button 
                      onClick={async () => {
                        if (!composedImageUrl) return;
                        try {
                          const response = await fetch(composedImageUrl);
                          const blob = await response.blob();
                          await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                          ]);
                          showToast('✅ Imagen copiada al portapapeles', 'success');
                        } catch (error) {
                          console.error('Error copiando imagen:', error);
                          showToast('❌ Error al copiar. Usa el botón Descargar.', 'error');
                        }
                      }}
                      disabled={!composedImageUrl}
                      className={`p-3 rounded-lg font-semibold transition-all flex items-center justify-center ${
                        composedImageUrl
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Copiar imagen al portapapeles"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    
                    {/* Eliminar */}
                    <button 
                      onClick={() => {
                        if (composedImageUrl) {
                          URL.revokeObjectURL(composedImageUrl);
                          setComposedImageUrl(null);
                          showToast('🗑️ Imagen compuesta eliminada', 'success');
                        }
                      }}
                      disabled={!composedImageUrl}
                      className={`p-3 rounded-lg font-semibold transition-all flex items-center justify-center ${
                        composedImageUrl
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Eliminar imagen compuesta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    {/* OpenAI GPT-4o - Premium Only */}
                    <button 
                      onClick={() => {
                        if (!isPremium()) {
                          showToast('⚠️ Esta función requiere una cuenta Premium', 'info');
                          return;
                        }
                        if (composedImageUrl || selectedGalleryImage) {
                          // Inicializar valores del modal con estados actuales
                          setAiConfigPromptType(promptType);
                          setAiConfigClase(selectedClase);
                          setAiConfigPersonajeId(selectedPersonajeId);
                          setAiConfigParagonType(paragonType);
                          setAiConfigRunaGemaType(runaGemaType);
                          setAiConfigTalismanType(talismanType);
                          setAiServiceToUse('openai');
                          setShowAIConfigModal(true);
                        }
                      }}
                      disabled={!(composedImageUrl || selectedGalleryImage) || openAiProcessing}
                      className={`p-3 rounded-lg font-semibold transition-all flex items-center justify-center relative gap-2 ${
                        (composedImageUrl || selectedGalleryImage) && !openAiProcessing
                          ? isPremium()
                            ? 'bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 hover:from-teal-500 hover:via-teal-600 hover:to-emerald-700 text-white shadow-lg'
                            : 'bg-gradient-to-br from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed border-2 border-yellow-500/50'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title={isPremium() ? "Configurar y procesar con OpenAI GPT-4o" : "Función Premium - Actualiza para usar OpenAI"}
                    >
                      {openAiProcessing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          {!isPremium() && <Lock className="w-4 h-4" />}
                          <Sparkles className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Alerta de API Key no configurada */}
                  {OPENAI_API_KEY.startsWith('TU_API_KEY') && (
                    <div className="mt-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-yellow-300 mb-1">
                            ⚠️ OpenAI API Key no configurada
                          </p>
                          <p className="text-xs text-yellow-200/80 mb-2">
                            El botón de OpenAI no funcionará hasta que configures tu API key.
                          </p>
                          <div className="text-xs text-yellow-100/70 space-y-1">
                            <p><strong>Cómo obtenerla:</strong></p>
                            <ol className="list-decimal list-inside ml-2 space-y-0.5">
                              <li>Ve a <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-yellow-300 underline hover:text-yellow-200">platform.openai.com/api-keys</a></li>
                              <li>Haz clic en "Create new secret key"</li>
                              <li>Copia la key (solo se muestra una vez)</li>
                              <li>Pégala en <code className="bg-black/30 px-1 rounded">ImageCaptureModal.tsx</code> línea ~105</li>
                            </ol>
                            <p className="mt-1.5 text-yellow-300 text-[10px]">
                              📄 Ver guía completa: <code className="bg-black/30 px-1 rounded">API-KEYS-SETUP.md</code>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Viewer del JSON (debajo de los botones si existe) */}
                  {showJSONViewer && aiExtractedJSON && (
                    <div className="mt-2 bg-d4-surface rounded-lg p-3 border border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-300">JSON Obtenido (Gemini):</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiExtractedJSON);
                              showToast('📋 JSON copiado', 'success');
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                          >
                            Copiar
                          </button>
                          <button
                            onClick={() => setShowJSONViewer(false)}
                            className="text-xs text-gray-400 hover:text-gray-300"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="bg-black/50 rounded p-2 max-h-32 overflow-y-auto">
                        <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap break-all">
                          {aiExtractedJSON}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Barra de Progreso de OpenAI */}
                  {openAiProcessing && openAiProgress !== 'idle' && (
                    <div className="mt-2 bg-gradient-to-r from-teal-900/40 to-emerald-900/40 rounded-lg p-3 border border-teal-500/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                        <span className="text-xs font-semibold text-teal-300">Procesando con OpenAI GPT-4o</span>
                      </div>
                      
                      {/* Barra de progreso visual */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              openAiProgress === 'done' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              'bg-gradient-to-r from-teal-500 to-emerald-500'
                            }`}
                            style={{
                              width: 
                                openAiProgress === 'sending' ? '20%' :
                                openAiProgress === 'processing' ? '50%' :
                                openAiProgress === 'received' ? '70%' :
                                openAiProgress === 'saving' ? '90%' :
                                openAiProgress === 'done' ? '100%' :
                                '0%'
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-teal-400 font-mono whitespace-nowrap">
                          {
                            openAiProgress === 'sending' ? '20%' :
                            openAiProgress === 'processing' ? '50%' :
                            openAiProgress === 'received' ? '70%' :
                            openAiProgress === 'saving' ? '90%' :
                            openAiProgress === 'done' ? '100%' :
                            '0%'
                          }
                        </span>
                      </div>
                      
                      {/* Estados del progreso */}
                      <div className="grid grid-cols-5 gap-1 text-[10px]">
                        <div className={`text-center py-1 px-1 rounded ${
                          openAiProgress === 'sending' ? 'bg-teal-500/30 text-teal-300 font-bold' :
                          ['processing', 'received', 'saving', 'done'].includes(openAiProgress) ? 'text-teal-600' :
                          'text-gray-600'
                        }`}>
                          📤 Envío
                        </div>
                        <div className={`text-center py-1 px-1 rounded ${
                          openAiProgress === 'processing' ? 'bg-teal-500/30 text-teal-300 font-bold' :
                          ['received', 'saving', 'done'].includes(openAiProgress) ? 'text-teal-600' :
                          'text-gray-600'
                        }`}>
                          🤖 Análisis
                        </div>
                        <div className={`text-center py-1 px-1 rounded ${
                          openAiProgress === 'received' ? 'bg-teal-500/30 text-teal-300 font-bold' :
                          ['saving', 'done'].includes(openAiProgress) ? 'text-teal-600' :
                          'text-gray-600'
                        }`}>
                          📦 Recibido
                        </div>
                        <div className={`text-center py-1 px-1 rounded ${
                          openAiProgress === 'saving' ? 'bg-teal-500/30 text-teal-300 font-bold' :
                          openAiProgress === 'done' ? 'text-teal-600' :
                          'text-gray-600'
                        }`}>
                          💾 Guardando
                        </div>
                        <div className={`text-center py-1 px-1 rounded ${
                          openAiProgress === 'done' ? 'bg-green-500/30 text-green-300 font-bold' :
                          'text-gray-600'
                        }`}>
                          ✅ Listo
                        </div>
                      </div>
                      
                      {/* Mostrar JSON extraído si existe */}
                      {openAiExtractedJSON && (
                        <div className="mt-2 pt-2 border-t border-teal-700/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-teal-400 font-semibold">JSON Extraído:</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(openAiExtractedJSON);
                                showToast('📋 JSON copiado', 'success');
                              }}
                              className="text-[10px] text-teal-400 hover:text-teal-300 underline"
                            >
                              Copiar
                            </button>
                          </div>
                          <div className="bg-black/50 rounded p-2 max-h-24 overflow-y-auto">
                            <pre className="text-[10px] text-emerald-300 font-mono whitespace-pre-wrap break-all">
                              {openAiExtractedJSON}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                </div>
              </div>

              {/* Panel de Prompt (lateral, colapsable) */}
              {showPromptPanel && (
                <div className="bg-d4-bg p-1.5 lg:p-2 rounded border border-d4-accent/30 flex flex-col">
                  <h3 className="text-xs lg:text-sm font-bold text-d4-accent mb-1.5 lg:mb-2">
                    <span className="hidden lg:inline">Prompt para {CATEGORIES.find(c => c.value === selectedCategory)?.label}</span>
                    <span className="lg:hidden">Prompt</span>
                  </h3>
                  
                  {/* Selector de tipo de dato Paragon (PRIMERO) */}
                  {selectedCategory === 'paragon' && (
                    <div className="mb-1.5 lg:mb-2">
                      <label className="block text-[10px] lg:text-xs font-semibold text-d4-text mb-0.5 lg:mb-1">
                        Tipo de Dato Paragon:
                      </label>
                      <select
                        value={paragonType}
                        onChange={(e) => handleParagonTypeChange(e.target.value as ParagonType)}
                        className="w-full p-1 lg:p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-[10px] lg:text-sm"
                      >
                        <option value="tablero">📊 Tableros</option>
                        <option value="nodo">⬢ Nodos</option>
                        <option value="atributos">📈 Atributos Paragon</option>
                      </select>
                      <p className="text-[9px] lg:text-[10px] text-d4-text-dim mt-0.5">
                        {paragonType === 'tablero' && 'Disponible para Héroe y Personaje'}
                        {paragonType === 'nodo' && 'Disponible para Héroe y Personaje'}
                        {paragonType === 'atributos' && 'Solo disponible para Personaje'}
                      </p>
                    </div>
                  )}

                  {/* Selector de tipo de dato Mundo */}
                  {selectedCategory === 'mundo' && (
                    <div className="mb-1.5 lg:mb-2">
                      <label className="block text-[10px] lg:text-xs font-semibold text-d4-text mb-0.5 lg:mb-1">
                        Tipo de Dato del Mundo:
                      </label>
                      <select
                        value={mundoType}
                        onChange={(e) => handleMundoTypeChange(e.target.value as MundoType)}
                        className="w-full p-1 lg:p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-[10px] lg:text-sm"
                      >
                        <option value="eventos">📅 Eventos del Mundo</option>
                        <option value="mazmorras_aspectos">🏰 Mazmorras de Aspectos</option>
                      </select>
                      <p className="text-[9px] lg:text-[10px] text-d4-text-dim mt-0.5">
                        {mundoType === 'eventos' && 'Progresión, jefes, recursos y rutas del mundo'}
                        {mundoType === 'mazmorras_aspectos' && 'Aspectos obtenidos de calabozos/mazmorras'}
                      </p>
                    </div>
                  )}

                  {/* Selector de tipo de Talismán */}
                  {selectedCategory === 'talismanes' && (
                    <div className="mb-1.5 lg:mb-2">
                      <label className="block text-[10px] lg:text-xs font-semibold text-d4-text mb-0.5 lg:mb-1">
                        Tipo de Talismán:
                      </label>
                      <select
                        value={talismanType}
                        onChange={(e) => setTalismanType(e.target.value as TalismanType)}
                        className="w-full p-1 lg:p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-[10px] lg:text-sm"
                      >
                        <option value="charms">🧿 Talismanes (Charms)</option>
                        <option value="horadric_seal">🔶 Sello Horádrico</option>
                      </select>
                      <p className="text-[9px] lg:text-[10px] text-d4-text-dim mt-0.5">
                        {talismanType === 'charms' && 'Piezas modulares equipables en el Sello Horádrico'}
                        {talismanType === 'horadric_seal' && 'Núcleo del sistema: define slots y bonificaciones'}
                      </p>
                    </div>
                  )}

                  {/* Selector interno de tipo para Runas/Gemas */}
                  {selectedCategory === 'runas' && (
                    <div className="mb-1.5 lg:mb-2">
                      <label className="block text-[10px] lg:text-xs font-semibold text-d4-text mb-0.5 lg:mb-1">
                        Tipo de Datos:
                      </label>
                      <select
                        value={runaGemaType}
                        onChange={(e) => setRunaGemaType(e.target.value as 'runas' | 'gemas')}
                        className="w-full p-1 lg:p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-[10px] lg:text-sm"
                      >
                        <option value="runas">ᚱ Runas</option>
                        <option value="gemas">💠 Gemas</option>
                      </select>
                      <p className="text-[9px] lg:text-[10px] text-d4-text-dim mt-0.5">
                        Se importa en catálogo global unificado (archivo gemas_runas.json)
                      </p>
                    </div>
                  )}

                  {/* Selector de destino (SEGUNDO - condicionado) */}
                  {selectedCategory !== 'runas' && selectedCategory !== 'build' && selectedCategory !== 'mundo' && (
                  <div className="mb-1.5 lg:mb-2">
                    <label className="block text-[10px] lg:text-xs font-semibold text-d4-text mb-0.5 lg:mb-1">
                      Destino:
                    </label>
                    <div className="flex gap-1.5 lg:gap-2">
                      {/* Mostrar Héroe solo si no está restringido por categoría */}
                      {(selectedCategory !== 'estadisticas' && selectedCategory !== 'paragon') || 
                       (selectedCategory === 'paragon' && paragonType !== 'atributos') ? (
                        <button
                          onClick={() => setPromptType('heroe')}
                          className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded text-[10px] lg:text-sm font-semibold ${
                            promptType === 'heroe' ? 'bg-d4-accent text-black' : 'bg-d4-surface text-d4-text'
                          }`}
                        >
                          Héroe
                        </button>
                      ) : null}
                      <button
                        onClick={() => setPromptType('personaje')}
                        className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded text-[10px] lg:text-sm font-semibold ${
                          promptType === 'personaje' ? 'bg-d4-accent text-black' : 'bg-d4-surface text-d4-text'
                        }`}
                      >
                        Personaje
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Runas/Gemas siempre global */}
                  {selectedCategory === 'runas' && (
                    <p className="text-[9px] lg:text-[10px] text-d4-text-dim -mt-1 mb-1.5">
                      ✅ Se importará al catálogo global de runas/gemas
                    </p>
                  )}

                  {/* Mundo siempre global */}
                  {selectedCategory === 'mundo' && (
                    <p className="text-[9px] lg:text-[10px] text-d4-text-dim -mt-1 mb-1.5">
                      🗺️ Sistema de Progresión del Mundo (global, no vinculado a personaje/héroe)
                    </p>
                  )}

                  {/* Equipo siempre personaje */}
                  {selectedCategory === 'build' && (
                    <p className="text-[9px] lg:text-[10px] text-d4-text-dim -mt-1 mb-1.5">
                      ✅ La categoría Equipo siempre se importa a Personaje
                    </p>
                  )}
                  
                  {/* Talismanes siempre personaje */}
                  {selectedCategory === 'talismanes' && (
                    <p className="text-[9px] lg:text-[10px] text-amber-400 -mt-1 mb-1.5">
                      🧿 Los talismanes siempre se importan a un personaje específico (Temporada 13)
                    </p>
                  )}

                  {/* Selector de clase (solo si tipo = heroe y no es categoría global) */}
                  {promptType === 'heroe' && selectedCategory !== 'runas' && selectedCategory !== 'mundo' && (
                    <div className="mb-1.5 lg:mb-2">
                      <label className="block text-[10px] lg:text-xs font-semibold text-d4-text mb-0.5 lg:mb-1">
                        Clase:
                      </label>
                      <select
                        value={selectedClase}
                        onChange={(e) => setSelectedClase(e.target.value)}
                        className="w-full p-1 lg:p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-[10px] lg:text-sm"
                      >
                        <option value="">Selecciona una clase...</option>
                        {availableClasses.map(clase => (
                          <option key={clase} value={clase}>
                            {clase}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Selector de personaje (solo si tipo = personaje) */}
                  {promptType === 'personaje' && (
                    <div className="mb-1.5 lg:mb-2">
                      <label className="block text-[10px] lg:text-xs font-semibold text-d4-text mb-0.5 lg:mb-1">
                        Personaje:
                      </label>
                      <select
                        value={selectedPersonajeId || ''}
                        onChange={(e) => setSelectedPersonajeId(e.target.value || null)}
                        className="w-full p-1 lg:p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-[10px] lg:text-sm"
                      >
                        <option value="">Ninguno (extracción genérica)</option>
                        {personajes && personajes.length > 0 ? (
                          personajes.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombre} - {p.clase} (Nv. {p.nivel}{p.nivel_paragon ? ` / Paragon ${p.nivel_paragon}` : ''})
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No hay personajes creados</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Texto del prompt con toggle en móvil */}
                  <div>
                    <button
                      onClick={() => setPromptTextExpanded(!promptTextExpanded)}
                      className="lg:hidden w-full text-[9px] text-d4-text-dim flex items-center justify-between mb-0.5 px-1 py-0.5 rounded hover:bg-d4-border"
                    >
                      <span>{promptTextExpanded ? 'Ocultar texto' : 'Ver texto del prompt'}</span>
                      {promptTextExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <div className={`${promptTextExpanded ? '' : 'hidden'} lg:block bg-d4-surface p-1 lg:p-2 rounded border border-d4-border max-h-[120px] lg:max-h-[220px] overflow-y-auto`}>
                      <pre className="text-[9px] lg:text-xs text-d4-text whitespace-pre-wrap font-mono">
                        {getPromptForCategory()}
                      </pre>
                    </div>
                  </div>

                  {/* Copiar Prompt + Cantidad en la misma fila */}
                  <div className="mt-1.5 lg:mt-2 flex items-center gap-1.5">
                    <button
                      onClick={copyPromptToClipboard}
                      className="btn-primary flex items-center gap-1.5 flex-1 justify-center text-[10px] lg:text-sm py-1 lg:py-2"
                    >
                      <Copy className="w-3 h-3 lg:w-4 lg:h-4" />
                      {copiedPrompt ? '✅ Copiado!' : 'Copiar Prompt'}
                    </button>
                    <div className="flex flex-col items-center shrink-0">
                      <label className="text-[9px] text-d4-text-dim mb-0.5 whitespace-nowrap">Cant.</label>
                      <input
                        type="number"
                        min="1"
                        value={promptElementCount}
                        onChange={(e) => setPromptElementCount(e.target.value)}
                        className="w-12 p-1 bg-d4-surface border border-d4-border rounded text-d4-text text-[10px] text-center"
                        placeholder="5"
                        title="Si lo defines, el prompt extrae solo esa cantidad de elementos señalados"
                      />
                    </div>
                  </div>

                  {/* Área de importación de JSON */}
                  <div className="mt-1.5 lg:mt-2 pt-1.5 lg:pt-2 border-t border-d4-border">
                    <h4 className="text-[10px] lg:text-xs font-semibold text-d4-accent mb-0.5 lg:mb-1">
                      📥 Importar JSON
                    </h4>
                    <textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder={`Pega el JSON aquí...${selectedCategory === 'skills' ? '\nEjemplo: {"habilidades_activas": [...], "habilidades_pasivas": [...]}' : selectedCategory === 'glifos' ? '\nEjemplo: {"glifos": [...]}' : selectedCategory === 'aspectos' ? (promptType === 'heroe' ? '\nEjemplo: {"aspectos": [...]}' : '\nEjemplo: {"aspectos_equipados": [...]}') : '\nEjemplo: {"nivel_paragon": 150, ...}'}`}
                      className="w-full h-16 lg:h-20 p-1 lg:p-2 bg-d4-surface border border-d4-border rounded text-d4-text font-mono text-[9px] lg:text-xs resize-none"
                    />
                    <button
                      onClick={() => { void executeManualImportJSON(); }}
                      disabled={!jsonText.trim() || importing || !hasEffectiveTargetSelection}
                      className={`mt-1.5 lg:mt-3 w-full px-2 lg:px-4 py-2 lg:py-3 rounded text-[10px] lg:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 lg:gap-2 ${
                        jsonText.trim() && !importing && hasEffectiveTargetSelection
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-2 border-white border-t-transparent"></div>
                          <span className="hidden md:inline">Importando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 lg:w-4 lg:h-4" />
                          <span className="hidden md:inline">
                            {selectedCategory === 'runas'
                              ? 'Guardar en catálogo global (Runas/Gemas)'
                              : selectedCategory === 'mundo'
                                ? 'Guardar en Mundo (Sistema Global)'
                                : selectedCategory === 'mecanicas'
                                  ? `Guardar en Mecánicas (${effectiveClaseForActions || 'Selecciona clase'})`
                                  : promptType === 'heroe'
                                    ? effectiveClaseForActions
                                      ? `Guardar en Héroe (${effectiveClaseForActions})`
                                      : 'Guardar en Héroe (Selecciona clase)'
                                    : effectivePersonajeIdForActions
                                      ? `Guardar en ${personajes.find(p => p.id === effectivePersonajeIdForActions)?.nombre || 'Personaje'}`
                                      : 'Selecciona un personaje primero'}
                          </span>
                          <span className="md:hidden">Guardar</span>
                        </>
                      )}
                    </button>
                    {requiresPersonajeSelection && !effectivePersonajeIdForActions && (
                      <p className="text-[9px] lg:text-xs text-yellow-400 mt-1 lg:mt-2">
                        ⚠️ Selecciona un personaje arriba para poder guardar
                      </p>
                    )}
                    {requiresClaseSelection && !effectiveClaseForActions && (
                      <p className="text-[9px] lg:text-xs text-yellow-400 mt-1 lg:mt-2">
                        ⚠️ Selecciona una clase arriba para poder guardar
                      </p>
                    )}
                  </div>
                </div>
              )}  
            </div>

            {/* Lista de imágenes capturadas */}
            {capturedImages.length > 0 && (
              <div className="bg-d4-bg p-4 rounded border border-d4-border">
                <h3 className="text-sm font-semibold text-d4-text mb-3">
                  Imágenes Capturadas ({capturedImages.length}):
                </h3>
                <div className="space-y-2">
                  {capturedImages.map((img, index) => (
                    <div key={img.id} className="flex items-center gap-3 bg-d4-surface p-2 rounded">
                      <span className="text-sm text-d4-text-dim w-8">{index + 1}.</span>
                      <img src={img.url} alt="" className="h-12 w-auto object-contain border border-d4-border" />
                      <span className={`text-xs px-2 py-1 rounded ${
                        img.isComplete 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {img.isComplete ? 'Completo' : 'Incompleto'}
                      </span>
                      <button
                        onClick={() => toggleImageCompletion(img.id)}
                        className="text-xs text-d4-accent hover:underline"
                      >
                        Cambiar
                      </button>
                      <button
                        onClick={() => removeImage(img.id)}
                        className="ml-auto p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Canvas oculto */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Tab Galería */}
        {showGallery && (
          <div className="space-y-4">
            {/* Imagen seleccionada para IA (si hay) */}
            {selectedGalleryImage && (
              <div className="space-y-4">
                {/* Preview y Panel de Prompt */}
                <div className={`grid gap-4 ${showPromptPanel ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Preview de imagen seleccionada */}
                  <div className="bg-d4-bg p-4 rounded border-2 border-purple-500/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <h4 className="text-sm font-bold text-purple-300">
                          Imagen Seleccionada para Procesar
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Botón toggle prompt panel */}
                        <button
                          onClick={() => setShowPromptPanel(!showPromptPanel)}
                          className={`px-3 py-2 rounded font-semibold transition-all ${
                            showPromptPanel
                              ? 'bg-d4-accent text-black shadow-lg'
                              : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                          }`}
                          title={showPromptPanel ? 'Ocultar prompt' : 'Mostrar prompt'}
                        >
                          <Copy className="w-4 h-4 inline mr-1" />
                          Prompt
                          {showPromptPanel ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedGalleryImage(null);
                            setSelectedGalleryImageBlob(null);
                            showToast('🔄 Selección cancelada', 'info');
                          }}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-all"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded max-h-96 overflow-auto border-2 border-purple-500/50">
                      <img src={selectedGalleryImage} alt="Selected" className="w-full h-auto object-contain" style={{ maxWidth: '100%', transform: 'scale(0.85)' }} />
                    </div>
                  </div>

                  {/* Panel de Prompt (igual que en tab Capturar) */}
                  {showPromptPanel && (
                    <div className="bg-d4-bg p-2 rounded border border-d4-accent/30 flex flex-col">
                      <h3 className="text-sm font-bold text-d4-accent mb-2">
                        Prompt para {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                      </h3>
                      
                      {selectedCategory !== 'runas' && selectedCategory !== 'build' && selectedCategory !== 'mundo' ? (
                        <div className="mb-2">
                          <label className="block text-xs font-semibold text-d4-text mb-1">
                            Tipo:
                          </label>
                          <div className="flex gap-2">
                            {selectedCategory !== 'estadisticas' && (
                              <button
                                onClick={() => setPromptType('heroe')}
                                className={`px-3 py-1.5 rounded text-sm font-semibold ${
                                  promptType === 'heroe' ? 'bg-d4-accent text-black' : 'bg-d4-surface text-d4-text'
                                }`}
                              >
                                Héroe
                              </button>
                            )}
                            <button
                              onClick={() => setPromptType('personaje')}
                              className={`px-3 py-1.5 rounded text-sm font-semibold ${
                                promptType === 'personaje' ? 'bg-d4-accent text-black' : 'bg-d4-surface text-d4-text'
                              }`}
                            >
                              Personaje
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-d4-text-dim mb-2">
                          {selectedCategory === 'runas'
                            ? '✅ Runas/Gemas siempre se procesa como catálogo global'
                            : selectedCategory === 'mundo'
                            ? '🗺️ Sistema de Progresión del Mundo (global)'
                            : '✅ Equipo siempre se procesa en modo Personaje'}
                        </p>
                      )}

                      {/* Selector de clase (solo si tipo = heroe y no es categoría global) */}
                      {promptType === 'heroe' && selectedCategory !== 'runas' && selectedCategory !== 'mundo' && (
                        <div className="mb-2">
                          <label className="block text-xs font-semibold text-d4-text mb-1">
                            Clase:
                          </label>
                          <select
                            value={selectedClase}
                            onChange={(e) => setSelectedClase(e.target.value)}
                            className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text"
                          >
                            <option value="">Selecciona una clase...</option>
                            {availableClasses.map(clase => (
                              <option key={clase} value={clase}>
                                {clase}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Selector de personaje (solo si tipo = personaje) */}
                      {promptType === 'personaje' && (
                        <div className="mb-2">
                          <label className="block text-xs font-semibold text-d4-text mb-1">
                            Personaje:
                          </label>
                          <select
                            value={selectedPersonajeId || ''}
                            onChange={(e) => setSelectedPersonajeId(e.target.value || null)}
                            className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text"
                          >
                            <option value="">Ninguno (extracción genérica)</option>
                            {personajes && personajes.length > 0 ? (
                              personajes.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.nombre} - {p.clase} (Nv. {p.nivel}{p.nivel_paragon ? ` / Paragon ${p.nivel_paragon}` : ''})
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>No hay personajes creados</option>
                            )}
                          </select>
                        </div>
                      )}

                      <div className="bg-d4-surface p-2 rounded border border-d4-border max-h-[220px] overflow-y-auto flex-1">
                        <pre className="text-xs text-d4-text whitespace-pre-wrap font-mono">
                          {getPromptForCategory()}
                        </pre>
                      </div>

                      <button
                        onClick={copyPromptToClipboard}
                        className="mt-2 btn-primary flex items-center gap-2 w-full justify-center"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedPrompt ? '✅ Copiado!' : 'Copiar Prompt'}
                      </button>

                      <div className="mt-2">
                        <label className="block text-xs font-semibold text-d4-text mb-1">
                          Cantidad de elementos (opcional)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={promptElementCount}
                          onChange={(e) => setPromptElementCount(e.target.value)}
                          className="w-full p-2 bg-d4-surface border border-d4-border rounded text-d4-text text-xs"
                          placeholder="Ej: 5"
                          title="Si lo defines, el prompt extrae solo esa cantidad de elementos señalados"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Controles IA compactos */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {aiExtractedJSON && (
                    <button
                      onClick={() => setShowJSONViewer(!showJSONViewer)}
                      className="p-2.5 rounded-lg font-semibold transition-all bg-blue-600 hover:bg-blue-700 text-white"
                      title="Ver JSON obtenido"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => processWithAI()}
                    disabled={aiProcessing || !showPromptPanel || !hasEffectiveTargetSelection}
                    className={`p-2.5 rounded-lg font-semibold transition-all ${
                      !aiProcessing && showPromptPanel && hasEffectiveTargetSelection
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    title={
                      aiProcessing
                        ? `Procesando (${aiProgress})`
                        : (!showPromptPanel
                          ? 'Abre el panel de Prompt primero'
                          : (requiresPersonajeSelection && !effectivePersonajeIdForActions)
                            ? 'Selecciona un personaje en el panel de Prompt'
                            : (requiresClaseSelection && !effectiveClaseForActions)
                              ? 'Selecciona una clase en el panel de Prompt'
                              : 'Procesar con IA y Guardar')
                    }
                  >
                    {aiProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Modal/Viewer del JSON */}
                  {showJSONViewer && aiExtractedJSON && (
                    <div className="mb-3 bg-d4-surface rounded-lg p-3 border border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-300">JSON Obtenido de Gemini:</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiExtractedJSON);
                            showToast('📋 JSON copiado al portapapeles', 'success');
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          Copiar JSON
                        </button>
                      </div>
                      <div className="bg-black/50 rounded p-2 max-h-40 overflow-y-auto">
                        <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap break-all">
                          {aiExtractedJSON}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {!showPromptPanel && (
                    <p className="text-xs text-yellow-400 mt-2 text-center">
                      ⚠️ Abre el panel de Prompt primero para configurar tipo y personaje/clase
                    </p>
                  )}
                  {showPromptPanel && requiresPersonajeSelection && !effectivePersonajeIdForActions && (
                    <p className="text-xs text-yellow-400 mt-2 text-center">
                      ⚠️ Selecciona un personaje en el panel de Prompt
                    </p>
                  )}
                  {showPromptPanel && requiresClaseSelection && !effectiveClaseForActions && (
                    <p className="text-xs text-yellow-400 mt-2 text-center">
                      ⚠️ Selecciona una clase en el panel de Prompt
                    </p>
                  )}
                </div>
            )}

            <div className="bg-d4-bg p-4 rounded border border-d4-accent/30">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-d4-accent">
                  Galería de {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                </h3>
                <button
                  onClick={() => startBatchJSON('category')}
                  disabled={executingBatch || galleryImages.filter(img => img.hasJSON).length === 0}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  title="Ejecutar todos los JSONs de esta categoría (crea personajes automáticamente si no existen)"
                >
                  <PlayCircle size={16} />
                  <span>Importar Categoría ({galleryImages.filter(img => img.hasJSON).length})</span>
                </button>
              </div>
              
              {/* ✅ FILTROS DE GALERÍA POR METADATA */}
              {galleryImages.length > 0 && (
                <div className="mb-4 p-3 bg-d4-surface rounded border border-d4-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4 text-d4-accent" />
                    <span className="text-sm font-semibold text-d4-accent">Filtros</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Filtro por Destino */}
                    <div>
                      <label className="block text-xs text-d4-text-dim mb-1">Destino</label>
                      <select
                        value={galleryFilterDestino}
                        onChange={(e) => setGalleryFilterDestino(e.target.value as 'all' | 'heroe' | 'personaje')}
                        className="w-full px-2 py-1.5 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                      >
                        <option value="all">Todos</option>
                        <option value="heroe">Héroe</option>
                        <option value="personaje">Personaje</option>
                      </select>
                    </div>

                    {/* Filtro por Clase (solo si destino es heroe o all) */}
                    {(galleryFilterDestino === 'all' || galleryFilterDestino === 'heroe') && (() => {
                      const { clases } = getGalleryFilterOptions(galleryImages);
                      return (
                        <div>
                          <label className="block text-xs text-d4-text-dim mb-1">Clase</label>
                          <select
                            value={galleryFilterClase}
                            onChange={(e) => setGalleryFilterClase(e.target.value)}
                            className="w-full px-2 py-1.5 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                          >
                            <option value="all">Todas</option>
                            {clases.map(clase => (
                              <option key={clase} value={clase}>{clase}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {/* Filtro por Personaje (solo si destino es personaje o all) */}
                    {(galleryFilterDestino === 'all' || galleryFilterDestino === 'personaje') && (() => {
                      const { personajes: personajesGaleria } = getGalleryFilterOptions(galleryImages);
                      return (
                        <div>
                          <label className="block text-xs text-d4-text-dim mb-1">Personaje</label>
                          <select
                            value={galleryFilterPersonaje}
                            onChange={(e) => setGalleryFilterPersonaje(e.target.value)}
                            className="w-full px-2 py-1.5 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                          >
                            <option value="all">Todos</option>
                            {personajesGaleria.map(p => (
                              <option key={p.id} value={p.id}>{p.nombre} ({p.clase})</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    {/* Filtro por Tipo específico según categoría */}
                    {selectedCategory === 'paragon' && (
                      <div>
                        <label className="block text-xs text-d4-text-dim mb-1">Tipo de Paragon</label>
                        <select
                          value={galleryFilterType}
                          onChange={(e) => setGalleryFilterType(e.target.value)}
                          className="w-full px-2 py-1.5 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                        >
                          <option value="all">Todos</option>
                          <option value="tablero">Tablero</option>
                          <option value="nodo">Nodo</option>
                          <option value="atributos">Atributos</option>
                        </select>
                      </div>
                    )}

                    {selectedCategory === 'runas' && (
                      <div>
                        <label className="block text-xs text-d4-text-dim mb-1">Tipo</label>
                        <select
                          value={galleryFilterType}
                          onChange={(e) => setGalleryFilterType(e.target.value)}
                          className="w-full px-2 py-1.5 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                        >
                          <option value="all">Todos</option>
                          <option value="runas">Runas</option>
                          <option value="gemas">Gemas</option>
                        </select>
                      </div>
                    )}

                    {selectedCategory === 'mundo' && (
                      <div>
                        <label className="block text-xs text-d4-text-dim mb-1">Tipo</label>
                        <select
                          value={galleryFilterType}
                          onChange={(e) => setGalleryFilterType(e.target.value)}
                          className="w-full px-2 py-1.5 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                        >
                          <option value="all">Todos</option>
                          <option value="eventos">Eventos</option>
                          <option value="mazmorras_aspectos">Mazmorras</option>
                        </select>
                      </div>
                    )}

                    {selectedCategory === 'talismanes' && (
                      <div>
                        <label className="block text-xs text-d4-text-dim mb-1">Tipo</label>
                        <select
                          value={galleryFilterType}
                          onChange={(e) => setGalleryFilterType(e.target.value)}
                          className="w-full px-2 py-1.5 bg-d4-bg border border-d4-border rounded text-d4-text text-sm"
                        >
                          <option value="all">Todos</option>
                          <option value="charms">Charms</option>
                          <option value="horadric_seal">Horadric Seal</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Botón para limpiar filtros */}
                  {(galleryFilterDestino !== 'all' || galleryFilterClase !== 'all' || galleryFilterPersonaje !== 'all' || galleryFilterType !== 'all') && (
                    <button
                      onClick={() => {
                        setGalleryFilterDestino('all');
                        setGalleryFilterClase('all');
                        setGalleryFilterPersonaje('all');
                        setGalleryFilterType('all');
                      }}
                      className="mt-3 px-3 py-1 bg-d4-border hover:bg-d4-accent/20 text-d4-text text-xs rounded transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
              
              {(() => {
                // ✅ APLICAR FILTROS A GALERÍA BASADOS EN METADATA
                const filteredGalleryImages = getFilteredGalleryEntries(galleryImages);

                return (
                  <>
                    {filteredGalleryImages.length === 0 ? (
                      <p className="text-d4-text-dim text-center py-8">
                        {galleryImages.length > 0 
                          ? 'No hay imágenes que coincidan con los filtros seleccionados'
                          : 'No hay imágenes guardadas en esta categoría'
                        }
                      </p>
                    ) : (
                      <>
                        {/* Barra de progreso batch */}
                        {executingBatch && (
                          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-900">
                                {batchProgress.message || `Procesando ${batchProgress.category}...`}
                              </span>
                              <span className="text-sm text-blue-700">
                                {batchProgress.current} / {batchProgress.total}
                              </span>
                            </div>
                            <div className="text-xs text-blue-800 mb-2">
                              JSONs procesados: {batchProgress.processedJsons} | Elementos importados: {batchProgress.processedItems}
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredGalleryImages.map((img, index) => (
                      <div 
                        key={index} 
                        className={`bg-d4-surface p-2 rounded border relative group transition-all ${
                          selectedGalleryImage === img.url && !img.isJSONOnly
                            ? 'border-purple-500 ring-2 ring-purple-500/50' 
                            : img.isJSONOnly
                              ? 'border-orange-500/60'
                              : 'border-d4-border'
                        }`}
                      >
                        <div className="relative">
                          {/* Placeholder para entradas JSON-only */}
                          {img.isJSONOnly ? (
                            <div
                              className="w-full h-32 flex flex-col items-center justify-center bg-d4-bg rounded border-2 border-dashed border-orange-500/40 text-orange-400 cursor-pointer hover:border-orange-500 transition-colors"
                              onClick={() => selectGalleryImage(img.url, img.nombre, img.hasJSON, true)}
                              title="Cargar JSON en panel de importación"
                            >
                              <FileJson className="w-10 h-10 mb-1 opacity-70" />
                              <span className="text-[10px] font-semibold">Solo JSON</span>
                              <span className="text-[9px] text-d4-text-dim mt-0.5">Sin imagen</span>
                            </div>
                          ) : (
                            <img src={img.url} alt={img.nombre} className="w-full h-32 object-contain bg-white rounded" />
                          )}
                          
                          {/* Indicador de JSON guardado */}
                          {img.hasJSON && !img.isJSONOnly && (
                            <div className="absolute top-2 left-2 bg-green-600 text-white rounded-full p-1" title="Tiene JSON guardado">
                              <FileJson className="w-4 h-4" />
                            </div>
                          )}
                          
                          {/* Indicador de selección */}
                          {selectedGalleryImage === img.url && (
                            <div className="absolute top-2 left-14 bg-purple-600 text-white rounded-full p-1">
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          )}
                          
                          {/* Botones de acción (aparecen al hover) */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => editGalleryEntry(img)}
                              className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg"
                              title="Editar en captura (cargar imagen/JSON)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!img.isJSONOnly && (
                              <button
                                onClick={() => setViewerImage({ url: img.url, name: img.nombre })}
                                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full shadow-lg"
                                title="Ver imagen grande"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                            )}
                            {img.hasJSON && (
                              <button
                                onClick={() => executeImageJSON(img.nombre)}
                                disabled={executingBatch}
                                className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-full shadow-lg"
                                title="Ejecutar JSON guardado (importar datos)"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                            {!img.isJSONOnly && (
                              <button
                                onClick={() => selectGalleryImage(img.url, img.nombre, img.hasJSON, false)}
                                className={`p-2 ${
                                  selectedGalleryImage === img.url
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-purple-600 hover:bg-purple-700'
                                } text-white rounded-full shadow-lg`}
                                title={selectedGalleryImage === img.url ? 'Deseleccionar' : img.hasJSON ? 'Cargar imagen + JSON para completar' : 'Seleccionar para procesar con IA'}
                              >
                                <Zap className="w-4 h-4" />
                              </button>
                            )}
                            {!img.isJSONOnly && (
                              <button
                                onClick={() => copyGalleryImage(img.url, img.nombre)}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
                                title="Copiar imagen al portapapeles"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-d4-text-dim mt-2 truncate" title={img.nombre}>
                          {img.nombre}
                        </p>
                        <p className="text-xs text-d4-text-dim">
                          {img.fecha}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })()}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => startBatchJSON('all')}
                disabled={executingBatch || personajes.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                title="Importar todos los JSONs guardados de todas las categorías"
              >
                <Zap size={18} />
                <span>Importar todos los datos guardados</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modales */}
      <ImportResultsModal
        isOpen={showImportResults}
        onClose={() => {
          void finalizeImportReport();
        }}
        results={importResults}
        onContinue={() => {
          void finalizeImportReport();
        }}
        continueLabel="Continuar"
      />
      
      <ImageViewerModal
        isOpen={!!viewerImage}
        onClose={() => setViewerImage(null)}
        imageUrl={viewerImage?.url || ''}
        imageName={viewerImage?.name}
      />
      
      <EmptyImportWarningModal
        isOpen={showEmptyWarning}
        onClose={() => {
          setShowEmptyWarning(false);
          setPendingSaveData(null);
        }}
        onSaveAndContinue={handleSaveEmptyImport}
        category={CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory}
        hasImage={!!composedImageUrl}
      />

      <PersonajeRestoreModal
        isOpen={showRestoreModal}
        onConfirm={handleRestoreModalConfirm}
        onCancel={handleRestoreModalCancel}
        existingPersonaje={pendingRestoreData?.existingPersonaje || { nombre: '', clase: '', nivel: 0, id: '' }}
        incomingData={pendingRestoreData?.incomingData || { clase: '', nivel: 0, id: '' }}
      />
      
      {/* Modal de Configuración AI */}
      {showAIConfigModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowAIConfigModal(false)}></div>
          
          {/* Modal Content */}
          <div className="card max-w-2xl w-full max-h-[85vh] overflow-y-auto relative z-[1] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-d4-surface pb-4 border-b border-d4-border z-[50]">
              <div>
                <h2 className="text-2xl font-bold text-d4-accent flex items-center gap-2">
                  {aiServiceToUse === 'gemini' ? (
                    <>
                      <Zap className="w-6 h-6" />
                      Configurar Gemini AI
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      Configurar OpenAI GPT-4o
                    </>
                  )}
                </h2>
                <p className="text-sm text-d4-text-dim">
                  Configure el destino y parámetros antes de procesar
                </p>
              </div>
              <button 
                onClick={() => setShowAIConfigModal(false)}
                className="p-2 hover:bg-d4-border rounded transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5 text-d4-text" />
              </button>
            </div>

            {/* Contenido */}
            <div className="space-y-4">
              {/* Categoría actual (solo lectura) */}
              <div>
                <label className="block text-sm font-semibold text-d4-text mb-2">
                  📂 Categoría de datos:
                </label>
                <div className="p-3 bg-d4-bg border border-d4-accent/30 rounded-lg">
                  <p className="text-d4-accent font-bold">
                    {CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory}
                  </p>
                </div>
              </div>

              {/* Selector de tipo Paragon (si aplica) */}
              {selectedCategory === 'paragon' && (
                <div>
                  <label className="block text-sm font-semibold text-d4-text mb-2">
                    📊 Tipo de Dato Paragon: <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={aiConfigParagonType}
                    onChange={(e) => {
                      const newType = e.target.value as ParagonType;
                      setAiConfigParagonType(newType);
                      // Si selecciona atributos, forzar a personaje
                      if (newType === 'atributos' && aiConfigPromptType === 'heroe') {
                        setAiConfigPromptType('personaje');
                      }
                    }}
                    className="w-full p-3 bg-d4-surface border border-d4-border rounded-lg text-d4-text"
                  >
                    <option value="tablero">📊 Tableros de Paragon</option>
                    <option value="nodo">⬢ Nodos de Paragon</option>
                    <option value="atributos">📈 Atributos de Paragon</option>
                  </select>
                  <p className="text-xs text-d4-text-dim mt-1">
                    {aiConfigParagonType === 'tablero' && '✓ Disponible para Héroe y Personaje'}
                    {aiConfigParagonType === 'nodo' && '✓ Disponible para Héroe y Personaje'}
                    {aiConfigParagonType === 'atributos' && '⚠️ Solo disponible para Personaje'}
                  </p>
                </div>
              )}

              {/* Selector de tipo Runas/Gemas (si aplica) */}
              {selectedCategory === 'runas' && (
                <div>
                  <label className="block text-sm font-semibold text-d4-text mb-2">
                    💎 Tipo de datos: <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={aiConfigRunaGemaType}
                    onChange={(e) => setAiConfigRunaGemaType(e.target.value as 'runas' | 'gemas')}
                    className="w-full p-3 bg-d4-surface border border-d4-border rounded-lg text-d4-text"
                  >
                    <option value="runas">ᚱ Runas</option>
                    <option value="gemas">💠 Gemas</option>
                  </select>
                  <p className="text-xs text-d4-text-dim mt-1">
                    ✓ Se importará al catálogo global unificado (archivo gemas_runas.json)
                  </p>
                </div>
              )}

              {/* Selector de tipo Mundo (si aplica) */}
              {selectedCategory === 'mundo' && (
                <div>
                  <label className="block text-sm font-semibold text-d4-text mb-2">
                    🗺️ Tipo de dato del mundo: <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={aiConfigMundoType}
                    onChange={(e) => setAiConfigMundoType(e.target.value as MundoType)}
                    className="w-full p-3 bg-d4-surface border border-d4-border rounded-lg text-d4-text"
                  >
                    <option value="eventos">📅 Eventos del Mundo</option>
                    <option value="mazmorras_aspectos">🏰 Mazmorras de Aspectos</option>
                  </select>
                  <p className="text-xs text-d4-text-dim mt-1">
                    {aiConfigMundoType === 'eventos' && '✓ Progresión, jefes, recursos y rutas del mundo'}
                    {aiConfigMundoType === 'mazmorras_aspectos' && '✓ Aspectos obtenidos al completar calabozos. Se guarda en el héroe correspondiente'}
                  </p>
                </div>
              )}

              {/* Selector de tipo Talismán (si aplica) */}
              {selectedCategory === 'talismanes' && (
                <div>
                  <label className="block text-sm font-semibold text-d4-text mb-2">
                    🔮 Tipo de Talismán: <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={aiConfigTalismanType}
                    onChange={(e) => setAiConfigTalismanType(e.target.value as TalismanType)}
                    className="w-full p-3 bg-d4-surface border border-d4-border rounded-lg text-d4-text"
                  >
                    <option value="charms">🧿 Talismanes (Charms)</option>
                    <option value="horadric_seal">🔶 Sello Horádrico</option>
                  </select>
                  <p className="text-xs text-d4-text-dim mt-1">
                    {aiConfigTalismanType === 'charms' && 'Piezas modulares equipables en el Sello Horádrico'}
                    {aiConfigTalismanType === 'horadric_seal' && 'Núcleo del sistema: define slots y bonificaciones'}
                  </p>
                </div>
              )}

              {/* Selector de destino (Héroe/Personaje) */}
              {selectedCategory !== 'runas' && selectedCategory !== 'build' && selectedCategory !== 'mundo' && (
                <div>
                  <label className="block text-sm font-semibold text-d4-text mb-2">
                    🎯 Destino de la importación: <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-3">
                    {/* Botón Héroe (ocultar si categoría lo prohíbe) */}
                    {(selectedCategory !== 'estadisticas' && selectedCategory !== 'paragon') || 
                     (selectedCategory === 'paragon' && aiConfigParagonType !== 'atributos') ? (
                      <button
                        onClick={() => setAiConfigPromptType('heroe')}
                        className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                          aiConfigPromptType === 'heroe'
                            ? 'bg-d4-accent/20 border-d4-accent text-d4-accent font-bold'
                            : 'bg-d4-bg border-d4-border text-d4-text hover:border-d4-accent/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">🦸</div>
                        <div className="font-semibold">Héroe</div>
                        <div className="text-xs text-d4-text-dim mt-1">
                          Base de datos maestra por clase
                        </div>
                      </button>
                    ) : null}
                    
                    {/* Botón Personaje */}
                    <button
                      onClick={() => setAiConfigPromptType('personaje')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        aiConfigPromptType === 'personaje'
                          ? 'bg-d4-accent/20 border-d4-accent text-d4-accent font-bold'
                          : 'bg-d4-bg border-d4-border text-d4-text hover:border-d4-accent/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">👤</div>
                      <div className="font-semibold">Personaje</div>
                      <div className="text-xs text-d4-text-dim mt-1">
                        Personaje específico creado
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Mensaje para categorías forzadas */}
              {selectedCategory === 'runas' && (
                <div className="p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    ℹ️ Las runas y gemas siempre se importan al catálogo global
                  </p>
                </div>
              )}
              
              {selectedCategory === 'mundo' && (
                <div className="p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    🗺️ Sistema de Progresión del Mundo - Datos globales independientes
                  </p>
                </div>
              )}
              
              {selectedCategory === 'build' && (
                <div className="p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    ℹ️ El equipo siempre se importa a un personaje específico
                  </p>
                </div>
              )}
              
              {selectedCategory === 'talismanes' && (
                <div className="p-3 bg-amber-600/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-300">
                    🧿 Los talismanes siempre se importan a un personaje específico (Temporada 13)
                  </p>
                </div>
              )}

              {/* Selector de clase (si modo héroe) */}
              {aiConfigPromptType === 'heroe' && selectedCategory !== 'runas' && selectedCategory !== 'mundo' && (
                <div>
                  <label className="block text-sm font-semibold text-d4-text mb-2">
                    ⚔️ Clase del héroe: <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={aiConfigClase}
                    onChange={(e) => setAiConfigClase(e.target.value)}
                    className={`w-full p-3 bg-d4-surface border rounded-lg text-d4-text ${
                      !aiConfigClase ? 'border-red-500/50' : 'border-d4-border'
                    }`}
                  >
                    <option value="">-- Selecciona una clase --</option>
                    {availableClasses.map(clase => (
                      <option key={clase} value={clase}>
                        {clase}
                      </option>
                    ))}
                  </select>
                  {!aiConfigClase && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ Debes seleccionar una clase para continuar
                    </p>
                  )}
                </div>
              )}

              {/* Selector de personaje (si modo personaje) */}
              {aiConfigPromptType === 'personaje' && selectedCategory !== 'runas' && (
                <div>
                  <label className="block text-sm font-semibold text-d4-text mb-2">
                    👤 Personaje de destino: <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={aiConfigPersonajeId || ''}
                    onChange={(e) => setAiConfigPersonajeId(e.target.value || null)}
                    className={`w-full p-3 bg-d4-surface border rounded-lg text-d4-text ${
                      !aiConfigPersonajeId ? 'border-red-500/50' : 'border-d4-border'
                    }`}
                  >
                    <option value="">-- Selecciona un personaje --</option>
                    {personajes && personajes.length > 0 ? (
                      personajes.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - {p.clase} (Nv. {p.nivel}{p.nivel_paragon ? ` / Paragon ${p.nivel_paragon}` : ''})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No hay personajes creados</option>
                    )}
                  </select>
                  {!aiConfigPersonajeId && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ Debes seleccionar un personaje para continuar
                    </p>
                  )}
                  {personajes.length === 0 && (
                    <p className="text-xs text-orange-400 mt-1">
                      ⚠️ No tienes personajes creados. Crea uno primero en la sección de Personajes.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer con botones */}
            <div className="mt-6 pt-4 border-t border-d4-border flex gap-3">
              <button
                onClick={() => setShowAIConfigModal(false)}
                className="flex-1 px-4 py-3 bg-d4-bg border border-d4-border rounded-lg text-d4-text hover:bg-d4-border transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Validar campos requeridos
                  const validationErrors: string[] = [];

                  // Validar tipo de paragon
                  if (selectedCategory === 'paragon' && !aiConfigParagonType) {
                    validationErrors.push('Selecciona el tipo de Paragon');
                  }

                  // Validar tipo de runa/gema
                  if (selectedCategory === 'runas' && !aiConfigRunaGemaType) {
                    validationErrors.push('Selecciona Runas o Gemas');
                  }

                  // Validar tipo de mundo
                  if (selectedCategory === 'mundo' && !aiConfigMundoType) {
                    validationErrors.push('Selecciona el tipo de dato del mundo');
                  }

                  // Validar tipo de talismán
                  if (selectedCategory === 'talismanes' && !aiConfigTalismanType) {
                    validationErrors.push('Selecciona el tipo de talismán');
                  }

                  // Validar destino (excepto categorías globales)
                  if (selectedCategory !== 'runas' && selectedCategory !== 'mundo') {
                    // Determinar tipo efectivo
                    const effectiveType = 
                      selectedCategory === 'estadisticas' ? 'personaje' :
                      selectedCategory === 'build' ? 'personaje' :
                      selectedCategory === 'talismanes' ? 'personaje' :
                      aiConfigPromptType;

                    if (effectiveType === 'heroe' && !aiConfigClase) {
                      validationErrors.push('Selecciona una clase para el héroe');
                    }

                    if (effectiveType === 'personaje' && !aiConfigPersonajeId) {
                      validationErrors.push('Selecciona un personaje');
                    }
                  }

                  if (validationErrors.length > 0) {
                    showToast(`⚠️ Faltan campos:\n${validationErrors.join('\n')}`, 'error');
                    return;
                  }

                  // Actualizar estados globales con la configuración
                  setPromptType(aiConfigPromptType);
                  setSelectedClase(aiConfigClase);
                  setSelectedPersonajeId(aiConfigPersonajeId);
                  setParagonType(aiConfigParagonType);
                  setRunaGemaType(aiConfigRunaGemaType);
                  setMundoType(aiConfigMundoType);
                  setTalismanType(aiConfigTalismanType);

                  // Cerrar modal
                  setShowAIConfigModal(false);

                  // Ejecutar el servicio correspondiente CON LA CONFIGURACIÓN
                  const aiConfig = {
                    paragonType: aiConfigParagonType,
                    runaGemaType: aiConfigRunaGemaType,
                    mundoType: aiConfigMundoType,
                    talismanType: aiConfigTalismanType
                  };
                  
                  if (aiServiceToUse === 'gemini') {
                    void processWithAI(aiConfig);
                  } else if (aiServiceToUse === 'openai') {
                    void processWithOpenAI(aiConfig);
                  }
                }}
                disabled={(() => {
                  // Lógica de validación para deshabilitar botón
                  if (selectedCategory === 'paragon' && !aiConfigParagonType) return true;
                  if (selectedCategory === 'runas' && !aiConfigRunaGemaType) return true;
                  if (selectedCategory === 'mundo' && !aiConfigMundoType) return true;
                  if (selectedCategory === 'talismanes' && !aiConfigTalismanType) return true;
                  
                  if (selectedCategory !== 'runas' && selectedCategory !== 'mundo') {
                    const effectiveType = 
                      selectedCategory === 'estadisticas' ? 'personaje' :
                      selectedCategory === 'build' ? 'personaje' :
                      selectedCategory === 'talismanes' ? 'personaje' :
                      aiConfigPromptType;

                    if (effectiveType === 'heroe' && !aiConfigClase) return true;
                    if (effectiveType === 'personaje' && !aiConfigPersonajeId) return true;
                  }

                  return false;
                })()}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                  (() => {
                    if (selectedCategory === 'paragon' && !aiConfigParagonType) return true;
                    if (selectedCategory === 'runas' && !aiConfigRunaGemaType) return true;
                    if (selectedCategory === 'mundo' && !aiConfigMundoType) return true;
                    if (selectedCategory === 'talismanes' && !aiConfigTalismanType) return true;

                    if (selectedCategory !== 'runas' && selectedCategory !== 'mundo') {
                      const effectiveType = 
                        selectedCategory === 'estadisticas' ? 'personaje' :
                        selectedCategory === 'build' ? 'personaje' :
                        selectedCategory === 'talismanes' ? 'personaje' :
                        aiConfigPromptType;

                      if (effectiveType === 'heroe' && !aiConfigClase) return true;
                      if (effectiveType === 'personaje' && !aiConfigPersonajeId) return true;
                    }

                    return false;
                  })()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : aiServiceToUse === 'gemini'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                      : 'bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 hover:from-teal-500 hover:via-teal-600 hover:to-emerald-700 text-white shadow-lg'
                }`}
              >
                {aiServiceToUse === 'gemini' ? (
                  <>
                    <Zap className="w-5 h-5" />
                    Procesar con Gemini
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Procesar con OpenAI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Personaje para Batch */}
      {showBatchPersonajeModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowBatchPersonajeModal(false)}></div>
          
          {/* Modal Content */}
          <div className="card max-w-xl w-full max-h-[70vh] overflow-y-auto relative z-[1] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-d4-surface pb-4 border-b border-d4-border z-[50]">
              <div>
                <h2 className="text-2xl font-bold text-d4-accent flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Seleccionar Personaje Destino
                </h2>
                <p className="text-sm text-d4-text-dim">
                  Importación masiva: {pendingBatchScope === 'category' 
                    ? `Categoría ${CATEGORIES.find(c => c.value === selectedCategory)?.label}` 
                    : 'Todas las categorías'}
                </p>
              </div>
              <button 
                onClick={() => setShowBatchPersonajeModal(false)}
                className="p-2 hover:bg-d4-border rounded transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5 text-d4-text" />
              </button>
            </div>

            {/* Contenido */}
            <div className="space-y-4">
              <p className="text-sm text-d4-text-dim">
                Los datos de estadísticas, skills, glifos, aspectos, etc. se importarán al personaje seleccionado:
              </p>

              {/* Lista de personajes */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {personajes.length === 0 ? (
                  <div className="text-center py-8 text-d4-text-dim">
                    <p className="mb-2">No hay personajes disponibles</p>
                    <p className="text-xs">Crea un personaje primero</p>
                  </div>
                ) : (
                  personajes.map(personaje => (
                    <button
                      key={personaje.id}
                      onClick={() => {
                        setBatchTargetPersonajeId(personaje.id);
                        executeBatchJSON(personaje.id);
                      }}
                      className="w-full p-4 bg-d4-bg hover:bg-d4-border border-2 border-transparent hover:border-d4-accent rounded-lg transition-all text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-d4-accent group-hover:text-d4-accent-bright">
                              {personaje.nombre}
                            </span>
                            <span className="text-xs text-d4-text-dim">
                              Nivel {personaje.nivel}
                            </span>
                          </div>
                          <div className="text-sm text-d4-text-dim">
                            {personaje.clase}
                          </div>
                          {personaje.nivel_paragon && (
                            <div className="text-xs text-purple-400 mt-1">
                              Paragon {personaje.nivel_paragon}
                            </div>
                          )}
                        </div>
                        <div className="text-d4-accent group-hover:scale-110 transition-transform">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCaptureModal;
