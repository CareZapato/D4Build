import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Plus, ArrowDown, Save, Image as ImageIcon, Trash2, Copy, Download, CheckCircle, AlertCircle, XCircle, Zap, Eye, FileJson, Play, PlayCircle, Maximize2, FileText, Swords, Hexagon, Gem, BarChart3, Grid3x3, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { ImageCategory, ImageService } from '../../services/ImageService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import { TagLinkingService } from '../../services/TagLinkingService';
import { useAppContext } from '../../context/AppContext';
import { WorkspaceService } from '../../services/WorkspaceService';
import { GeminiService } from '../../services/GeminiService';
import ImportResultsModal, { ImportResultDetails } from './ImportResultsModal';
import ImageViewerModal from './ImageViewerModal';
import EmptyImportWarningModal from './EmptyImportWarningModal';
import { validateJSONByCategory } from '../../utils/jsonValidation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface CapturedImage {
  id: string;
  blob: Blob;
  url: string;
  isComplete: boolean; // true = elemento completado, false = parte incompleta del elemento anterior
}

type CaptureMode = 'new' | 'continue';

const CATEGORIES: { value: ImageCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'skills', label: 'Habilidades', icon: Swords },
  { value: 'glifos', label: 'Glifos', icon: Hexagon },
  { value: 'aspectos', label: 'Aspectos', icon: Gem },
  { value: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { value: 'otros', label: 'Otros', icon: Grid3x3 },
];

const ImageCaptureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { personajes, availableClasses, selectedPersonaje, setSelectedPersonaje, setPersonajes } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>('skills');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [composedImageUrl, setComposedImageUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Array<{ nombre: string; url: string; fecha: string; hasJSON?: boolean; isJSONOnly?: boolean }>>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showPromptPanel, setShowPromptPanel] = useState(true);
  const [promptType, setPromptType] = useState<'personaje' | 'heroe'>('heroe');
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
  
  // Estados para modal de resultados de importación
  const [showImportResults, setShowImportResults] = useState(false);
  const [importResults, setImportResults] = useState<ImportResultDetails | null>(null);
  const [pendingFinalizeAction, setPendingFinalizeAction] = useState<'reload' | null>(null);
  
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
  
  const GEMINI_API_KEY = 'AIzaSyCUU5YJqZfaXPkOvmvVfizpAfWRLSEb4Lk'; // Idealmente esto debería estar en un .env
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const syncUpdatedPersonajeInContext = (updatedPersonaje: any) => {
    const updatedList = personajes.map(p => p.id === updatedPersonaje.id ? updatedPersonaje : p);
    setPersonajes(updatedList);
    if (selectedPersonaje?.id === updatedPersonaje.id) {
      setSelectedPersonaje(updatedPersonaje);
    }
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
    }
  }, [isOpen]);

  // Estadísticas es siempre para personaje
  useEffect(() => {
    if (selectedCategory === 'estadisticas') {
      setPromptType('personaje');
    }
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
    const url = URL.createObjectURL(blob);
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setCapturedImages(prev => [...prev, { id, blob, url, isComplete: isNewElement }]);
  };

  const removeImage = (id: string) => {
    setCapturedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  };

  const toggleImageCompletion = (id: string) => {
    setCapturedImages(prev => prev.map(img => 
      img.id === id ? { ...img, isComplete: !img.isComplete } : img
    ));
  };

  const composeImages = async () => {
    if (capturedImages.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cargar todas las imágenes
    const loadedImages = await Promise.all(
      capturedImages.map(async (capturedImg) => {
        const img = new Image();
        img.src = capturedImg.url;
        await new Promise(resolve => img.onload = resolve);
        return { img, isComplete: capturedImg.isComplete };
      })
    );

    // Calcular dimensiones con layout inteligente (4 horizontales, luego vertical)
    const SPACING = 10; // Espacio entre elementos completos
    const OUTER_MARGIN = SPACING; // Margen externo igual al espaciado interno
    const VERTICAL_OFFSET = 0; // Sin espacio entre partes incompletas
    const MAX_HORIZONTAL = 4; // Máximo de elementos por fila horizontal

    // Agrupar elementos completos.
    // isComplete=true significa NUEVA captura (inicio de grupo).
    // Cuando se ve isComplete=true, se cierra el grupo anterior y empieza uno nuevo.
    const completeGroups: Array<Array<{ img: HTMLImageElement; isComplete: boolean; originalIndex: number }>> = [];
    let currentGroup: Array<{ img: HTMLImageElement; isComplete: boolean; originalIndex: number }> = [];
    
    loadedImages.forEach((item, index) => {
      if (item.isComplete && currentGroup.length > 0) {
        // Nueva captura → cerrar grupo anterior
        completeGroups.push(currentGroup);
        currentGroup = [];
      }
      currentGroup.push({ ...item, originalIndex: index });
    });
    if (currentGroup.length > 0) {
      completeGroups.push(currentGroup);
    }

    // Contar grupos completos para layout
    const totalCompleteGroups = completeGroups.length;
    
    // Calcular dimensiones totales según cantidad de elementos
    let totalWidth = 0;
    let totalHeight = 0;

    if (totalCompleteGroups <= MAX_HORIZONTAL) {
      // Layout horizontal (hasta 4 elementos)
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
      // Layout vertical con filas de MAX_HORIZONTAL elementos
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
          // Nueva fila
          if (rowIndex > 0) totalHeight += SPACING;
          totalHeight += currentRowHeight;
          currentRowWidth = groupWidth;
          currentRowHeight = groupHeight;
          totalWidth = Math.max(totalWidth, currentRowWidth);
        } else {
          // Misma fila
          currentRowWidth += SPACING + groupWidth;
          currentRowHeight = Math.max(currentRowHeight, groupHeight);
          totalWidth = Math.max(totalWidth, currentRowWidth);
        }
      });
      totalHeight += currentRowHeight; // Agregar última fila
    }

    // Calcular espacio para el texto del prompt si está activado
    const PROMPT_MARGIN = 15; // Margen blanco alrededor del marco
    let promptHeight = 0;
    let promptText = '';
    if (embedPromptInImage && capturedImages.length > 0) {
      promptText = getShortPrompt();
      const fontSize = 14;
      const lineHeight = fontSize * 1.5;
      const padding = 20;
      const maxPromptWidth = totalWidth - (padding * 2) - (PROMPT_MARGIN * 2);
      
      // Calcular líneas necesarias
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

    // Configurar canvas (con espacio extra para prompt si está activado)
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
      
      // Fondo blanco para el área completa del prompt (ya pintado)
      
      // Marco/borde alrededor del texto
      const frameX = PROMPT_MARGIN + OUTER_MARGIN;
      const frameY = PROMPT_MARGIN + OUTER_MARGIN;
      const frameWidth = canvas.width - (PROMPT_MARGIN * 2) - (OUTER_MARGIN * 2);
      const frameHeight = promptHeight - (PROMPT_MARGIN * 2);
      
      // Fondo gris claro para el cuadro del texto
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(frameX, frameY, frameWidth, frameHeight);
      
      // Borde del marco (negro)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);
      
      // Dibujar texto dentro del marco
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

    // Dibujar imágenes con layout inteligente (desplazadas hacia abajo si hay prompt)
    const imageOffsetY = embedPromptInImage && promptHeight > 0 ? promptHeight : 0;
    
    if (totalCompleteGroups <= MAX_HORIZONTAL) {
      // Layout horizontal (hasta 4 elementos)
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
      // Layout vertical con filas de MAX_HORIZONTAL elementos
      let currentRowY = imageOffsetY + OUTER_MARGIN;
      
      completeGroups.forEach((group, groupIndex) => {
        const rowIndex = Math.floor(groupIndex / MAX_HORIZONTAL);
        const colIndex = groupIndex % MAX_HORIZONTAL;
        
        if (colIndex === 0 && rowIndex > 0) {
          // Calcular altura de fila anterior
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
        
        // Calcular X offset para esta columna
        let xOffset = OUTER_MARGIN;
        for (let i = rowIndex * MAX_HORIZONTAL; i < groupIndex; i++) {
          const prevGroup = completeGroups[i];
          let groupWidth = 0;
          prevGroup.forEach(item => {
            groupWidth = Math.max(groupWidth, item.img.width);
          });
          xOffset += groupWidth + SPACING;
        }
        
        // Dibujar grupo actual
        let yOffset = currentRowY;
        let groupStartX = xOffset;
        group.forEach(item => {
          ctx.drawImage(item.img, groupStartX, yOffset);
          yOffset += item.img.height + VERTICAL_OFFSET;
        });
      });
    }

    // Crear blob
    canvas.toBlob((blob) => {
      if (blob) {
        if (composedImageUrl) URL.revokeObjectURL(composedImageUrl);
        const url = URL.createObjectURL(blob);
        setComposedImageUrl(url);
      }
    }, 'image/png');
  };

  useEffect(() => {
    if (capturedImages.length > 0) {
      composeImages();
    } else {
      setComposedImageUrl(null);
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

  const getRecommendedMax = (category: ImageCategory): number => {
    switch (category) {
      case 'skills': return 4;  // Reducido de 6 a 4 (recomendación óptima)
      case 'glifos': return 6;  // Reducido de 8 a 6 (recomendación óptima)
      case 'aspectos': return 5;  // Reducido de 7 a 5 (recomendación óptima)
      case 'estadisticas': return 5; // 5 capturas ideales (secciones distintas)
      case 'otros': return 6;  // Reducido de 8 a 6 (recomendación óptima)
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
      
      const categoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory;
      const nombre = await ImageService.saveImage(blob, selectedCategory, categoryLabel.toLowerCase());
      setLastSavedImageName(nombre); // Trackear para auto-guardado posterior de JSON
      
      // 📄 Guardar JSON asociado si existe
      if (jsonText.trim()) {
        try {
          await ImageService.saveImageJSON(jsonText, selectedCategory, nombre);
          showToast(`✅ Imagen y JSON guardados: ${selectedCategory}/${nombre}`, 'success');
        } catch (jsonError) {
          console.error('Error guardando JSON:', jsonError);
          showToast(`✅ Imagen guardada (JSON no guardado): ${selectedCategory}/${nombre}`, 'info');
        }
      } else {
        showToast(`✅ Imagen guardada: ${selectedCategory}/${nombre}`, 'success');
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
        isJSONOnly: entry.isJSONOnly
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

  const getPromptForCategory = (): string => {
    let basePrompt = '';
    const manualCount = parseInt(promptElementCount, 10);
    const parsedManualCount = Number.isFinite(manualCount) ? manualCount : undefined;
    
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
      case 'estadisticas':
        basePrompt = ImageExtractionPromptService.generateStatsPrompt();
        break;
      default:
        basePrompt = 'Analiza esta imagen y extrae la información relevante en formato JSON.';
    }
    
    // Agregar contexto de personaje si está seleccionado
    if (promptType === 'personaje' && selectedPersonajeId) {
      const personaje = personajes.find(p => p.id === selectedPersonajeId);
      if (personaje) {
        basePrompt = `**CONTEXTO DEL PERSONAJE:**\n- Nombre: ${personaje.nombre}\n- Clase: ${personaje.clase}\n- Nivel: ${personaje.nivel}${personaje.nivel_paragon ? ` (Paragon: ${personaje.nivel_paragon})` : ''}\n\n---\n\n${basePrompt}`;
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
      default:
        prompt = `${contextLine}EXTRAE ${countPrefix}elementos en formato JSON estructurado`;
    }

    return prompt;
  };

  // Auto-guardar JSON (y opcionalmente imagen) en galería tras importación exitosa
  const autoSaveJSONAfterImport = async (jsonContent: string): Promise<void> => {
    if (!jsonContent.trim()) return;
    try {
      const categoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory;
      if (composedImageUrl) {
        // Imagen en preview no guardada → guardar imagen + JSON
        const response = await fetch(composedImageUrl);
        const blob = await response.blob();
        const nombre = await ImageService.saveImage(blob, selectedCategory, categoryLabel.toLowerCase());
        await ImageService.saveImageJSON(jsonContent, selectedCategory, nombre);
        setLastSavedImageName(nombre);
        setCapturedImages([]);
        setComposedImageUrl(null);
        showToast(`💾 Imagen y JSON guardados automáticamente en galería`, 'info');
      } else if (lastSavedImageName) {
        // Imagen ya guardada previamente → solo guardar JSON junto a ella
        await ImageService.saveImageJSON(jsonContent, selectedCategory, lastSavedImageName);
        showToast(`💾 JSON guardado junto a la imagen guardada`, 'info');
      } else if (selectedGalleryImage) {
        // Imagen de galería seleccionada → guardar JSON junto a ella
        const galleryEntry = galleryImages.find(img => img.url === selectedGalleryImage);
        if (galleryEntry && !galleryEntry.isJSONOnly) {
          await ImageService.saveImageJSON(jsonContent, selectedCategory, galleryEntry.nombre);
          showToast(`💾 JSON guardado junto a imagen de galería`, 'info');
        }
      } else {
        // Sin imagen → guardar JSON independiente
        await ImageService.saveJSONOnly(jsonContent, selectedCategory, categoryLabel.toLowerCase());
        showToast(`💾 JSON guardado sin imagen (listo para re-procesar desde galería)`, 'info');
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
      console.log(`  🔄 Caso 1: Preservando estructura enriquecida, actualizando valor de ${JSON.stringify(target.valor)} a ${source}`);
      return {
        ...target,
        valor: source
      };
    }

    // CASO 2: Target primitivo + Source enriquecido
    // Usar la estructura enriquecida completa
    if (isTargetPrimitive && isSourceEnriched) {
      console.log(`  🔄 Caso 2: Reemplazando valor simple ${target} con estructura enriquecida`);
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
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          // Si es objeto, hacer merge recursivo
          result[key] = deepMerge(target[key], source[key]);
        } else {
          // Si es valor primitivo o array, reemplazar
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
            console.log(`  🔧 Normalizando campo ${sectionKey}.${wrongName} → ${correct}`);
            
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
      console.log('  🔧 Moviendo utilidad.reduccionDanioJcJ → jcj.reduccionDanio');
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

  const countInputElements = (category: ImageCategory, data: any): number => {
    switch (category) {
      case 'skills':
        return (data?.habilidades_activas?.length || 0) + (data?.habilidades_pasivas?.length || 0);
      case 'glifos':
        return data?.glifos?.length || 0;
      case 'aspectos':
        return (data?.aspectos?.length || 0) + (data?.aspectos_equipados?.length || 0);
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

  // Importar JSON resultante
  const handleImportJSON = async (options?: { jsonOverride?: string; skipAutoSave?: boolean }): Promise<ImportResultDetails> => {
    const jsonPayload = (options?.jsonOverride ?? jsonText ?? '').trim();
    const skipAutoSave = options?.skipAutoSave ?? false;
    const effectiveCategory = selectedCategory;
    const effectivePromptType: 'heroe' | 'personaje' = effectiveCategory === 'estadisticas' ? 'personaje' : promptType;
    const effectivePersonajeId = selectedPersonajeId || selectedPersonaje?.id || personajes[0]?.id || null;
    const effectiveClase = selectedClase || selectedPersonaje?.clase || availableClasses[0] || '';
    console.log('🔵 [handleImportJSON] Iniciando importación...');
    console.log('📝 [handleImportJSON] Categoría:', effectiveCategory);
    console.log('👤 [handleImportJSON] Tipo de prompt:', effectivePromptType);
    console.log('📏 [handleImportJSON] Longitud JSON payload:', jsonPayload.length);
    console.log('🎯 [handleImportJSON] Contexto efectivo:', {
      personajeId: effectivePersonajeId,
      clase: effectiveClase,
      selectedPersonajeId,
      selectedClase
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
      console.log('📦 [handleImportJSON] Parseando JSON...');
      parsedData = JSON.parse(jsonPayload);
      console.log('✅ [handleImportJSON] JSON parseado correctamente:', parsedData);
      
      // 2. VALIDAR ESTRUCTURA
      console.log('🔍 [handleImportJSON] Validando estructura del JSON...');
      const validation = validateJSONByCategory(effectiveCategory, parsedData);
      console.log('📊 [handleImportJSON] Resultado de validación:', validation);
      console.log('   - Válido:', validation.isValid);
      console.log('   - Errores:', validation.errors.length);
      console.log('   - Advertencias:', validation.warnings.length);
      console.log('   - Campos detectados:', validation.detectedFields);
      
      // Si hay errores críticos, retornar sin importar
      if (!validation.isValid) {
        const errorResult: ImportResultDetails = {
          success: false,
          category: effectiveCategory,
          promptType: effectivePromptType,
          targetName: effectivePromptType === 'heroe' ? effectiveClase : (personajes.find(p => p.id === effectivePersonajeId)?.nombre || ''),
          validationErrors: [...validation.errors, ...validation.warnings],
          rawJSON: options?.jsonOverride ?? jsonText,
          parsedJSON: parsedData,
          errorMessage: 'El JSON no tiene la estructura esperada'
        };
        setImporting(false);
        return errorResult;
      }
      
      const data = parsedData;
      const totalInputItems = countInputElements(effectiveCategory, data);
      let itemsImported = 0;
      let itemsUpdated = 0;
      let itemsRepeated = 0;
      const fieldsAdded: string[] = [];
      const addedItems: string[] = [];
      const updatedItemsList: string[] = [];
      const repeatedItems: string[] = [];
      
      if (effectivePromptType === 'heroe') {
        // =============== GUARDAR EN HÉROE ===============
        console.log('🦸 [handleImportJSON] Modo: Guardar en héroe');
        
        if (!effectiveClase) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: effectiveCategory,
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
        console.log('📄 [handleImportJSON] Clase seleccionada:', clase);
        
        switch (effectiveCategory) {
          case 'skills':
            console.log('⚔️ [handleImportJSON] Importando habilidades...');
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
              console.log(`✅ [handleImportJSON] Habilidades guardadas (${itemsImported} nuevas, ${itemsUpdated} actualizadas)`);
              showToast(`✅ ${itemsImported + itemsUpdated} habilidades procesadas en ${clase} (${itemsImported} nuevas, ${itemsUpdated} actualizadas)`, 'success');
              shouldReload = true;
            }
            break;
          
          case 'glifos':
            console.log('🔮 [handleImportJSON] Importando glifos...');
            if (data.glifos) {
              // 🔄 CARGAR glifos existentes del héroe
              const heroGlyphs = await WorkspaceService.loadHeroGlyphs(clase) || { glifos: [] };

              // 🔄 MERGE glifos (por nombre)
              (data.glifos as any[]).forEach((glyph: any) => {
                const idx = heroGlyphs.glifos.findIndex((g: any) => g.nombre === glyph.nombre);
                const glyphId = idx >= 0 ? heroGlyphs.glifos[idx].id : (glyph.id || `glifo_${glyph.nombre.toLowerCase().replace(/\s+/g, '_')}`);
                const glyphWithId = { ...glyph, id: glyphId };
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
              console.log(`✅ [handleImportJSON] Glifos guardados (${itemsImported} nuevos, ${itemsUpdated} actualizados)`);
              showToast(`✅ ${itemsImported + itemsUpdated} glifos procesados en ${clase} (${itemsImported} nuevos, ${itemsUpdated} actualizados)`, 'success');
              shouldReload = true;
            }
            break;
          
          case 'aspectos':
            console.log('💎 [handleImportJSON] Importando aspectos...');
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
              console.log(`✅ [handleImportJSON] Aspectos guardados (${itemsImported} nuevos, ${itemsUpdated} actualizados)`);
              showToast(`✅ ${itemsImported + itemsUpdated} aspectos procesados en ${clase} (${itemsImported} nuevos, ${itemsUpdated} actualizados)`, 'success');
              shouldReload = true;
            }
            break;
          
          case 'estadisticas':
            console.log('📊 [handleImportJSON] Importando estadísticas de héroe...');
            const currentHeroStats = await WorkspaceService.loadHeroStats(clase);
            const incomingHeroStats = data?.estadisticas && typeof data.estadisticas === 'object' ? data.estadisticas : data;
            const normalizedIncomingHeroStats = normalizeStatsFieldNames(incomingHeroStats || {});
            const heroStatsEntries = collectStatsEntries(normalizedIncomingHeroStats);
            if (areEquivalentContent(currentHeroStats || {}, normalizedIncomingHeroStats || {})) {
              itemsRepeated += heroStatsEntries.length || 1;
              repeatedItems.push(...heroStatsEntries.map(entry => `${getStatsSectionLabel(entry.section)}: ${entry.name}`));
            } else {
              itemsUpdated += heroStatsEntries.length || 1;
              updatedItemsList.push(...heroStatsEntries.map(entry => `${getStatsSectionLabel(entry.section)}: ${entry.name}`));
            }
            fieldsAdded.push(...heroStatsEntries.map(entry => `${entry.section}.${entry.name}`));
            
            await WorkspaceService.saveHeroStats(clase, normalizedIncomingHeroStats);
            console.log('✅ [handleImportJSON] Estadísticas guardadas');
            showToast(`✅ Estadísticas guardadas en ${clase}`, 'success');
            shouldReload = true;
            break;
        }
        
        const heroResult: ImportResultDetails = {
          success: true,
          category: effectiveCategory,
          promptType: 'heroe',
          targetName: clase,
          jsonInputsProcessed: 1,
          itemsImported,
          itemsUpdated,
          itemsSkipped: itemsRepeated,
          addedItems,
          updatedItemsList,
          repeatedItems,
          itemDetails: buildItemDetails(effectiveCategory, addedItems, updatedItemsList, repeatedItems),
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
            const categoryLabel = CATEGORIES.find(c => c.value === effectiveCategory)?.label || effectiveCategory;
            const nombre = `${categoryLabel.toLowerCase()}_${Date.now()}.png`;
            
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
        if (shouldReload) {
          console.log('⏸️ [handleImportJSON] Recarga diferida: esperando confirmación del usuario en el modal');
          setPendingFinalizeAction('reload');
        }
        setImporting(false);
        return heroResult;
        
      } else {
        // =============== GUARDAR EN PERSONAJE ===============
        console.log('🎮 [handleImportJSON] Modo: Guardar en personaje');
        
        if (!effectivePersonajeId) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: effectiveCategory,
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

        const personaje = personajes.find(p => p.id === effectivePersonajeId);
        if (!personaje) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: effectiveCategory,
            promptType: effectivePromptType,
            targetName: '',
            validationErrors: validation.warnings,
            rawJSON: options?.jsonOverride ?? jsonText,
            parsedJSON: parsedData,
            errorMessage: 'Personaje no encontrado'
          };
          showToast('❌ Personaje no encontrado', 'error');
          setImporting(false);
          return errorResult;
        }
        
        console.log('👤 [handleImportJSON] Personaje seleccionado:', personaje.nombre);

        switch (effectiveCategory) {
          case 'skills': {
            console.log('⚔️ [handleImportJSON] Importando habilidades a personaje...');
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
                const skillWithId = { ...skill, id: skillId, modificadores: mods };
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

              newPasivas.forEach((skill: any) => {
                const idx = heroSkills.habilidades_pasivas.findIndex((s: any) => s.nombre === skill.nombre);
                const skillId = idx >= 0 ? heroSkills.habilidades_pasivas[idx].id : (skill.id || `skill_pasiva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
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
              syncUpdatedPersonajeInContext(updatedPersonaje);
              console.log('✅ [handleImportJSON] Habilidades guardadas en personaje');
              showToast(`✅ ${activasRefs.length + pasivasRefs.length} habilidades guardadas en ${personaje.nombre}`, 'success');
              shouldReload = true;
            }
            break;
          }
          case 'glifos': {
            console.log('🔮 [handleImportJSON] Importando glifos a personaje...');
            if (data.glifos) {
              // 1. Guardar en héroe
              const heroGlyphs = await WorkspaceService.loadHeroGlyphs(personaje.clase) || { glifos: [] };

              (data.glifos as any[]).forEach((glyph: any) => {
                const idx = heroGlyphs.glifos.findIndex((g: any) => g.nombre === glyph.nombre);
                const glyphId = idx >= 0 ? heroGlyphs.glifos[idx].id : (glyph.id || `glifo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                const glyphWithId = { ...glyph, id: glyphId };
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
                  nivel_maximo: prev?.nivel_maximo ?? 100
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
              syncUpdatedPersonajeInContext(updatedPersonaje);
              console.log('✅ [handleImportJSON] Glifos guardados en personaje');
              showToast(`✅ ${nuevosRefs.length} glifos guardados en ${personaje.nombre}`, 'success');
              shouldReload = true;
            }
            break;
          }
          case 'aspectos': {
            console.log('💎 [handleImportJSON] Importando aspectos a personaje...');
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
                const aspectoWithId = {
                  ...(base || {}),
                  ...aspectoConTags,
                  id: resolvedId,
                  aspecto_id: resolvedId,
                  name: aspectoConTags.name || aspectoConTags.nombre || base?.name || `Aspecto ${toTitle(resolvedId.replace(/^aspecto_/, ''))}`,
                  shortName: aspectoConTags.shortName || base?.shortName || toTitle(resolvedId.replace(/^aspecto_/, '')),
                  effect: aspectoConTags.effect || base?.effect || '',
                  category: aspectoConTags.category || base?.category || 'ofensivo',
                  level: aspectoConTags.nivel_actual || aspectoConTags.level || base?.level || '1/21',
                  tags: Array.isArray(aspectoConTags.tags) ? aspectoConTags.tags : (base?.tags || []),
                  detalles: Array.isArray(aspectoConTags.detalles) ? aspectoConTags.detalles : (base?.detalles || [])
                };
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
              syncUpdatedPersonajeInContext(updatedPersonaje);
              console.log('✅ [handleImportJSON] Aspectos guardados en personaje');
              showToast(`✅ ${aspectosRefs.length} aspectos guardados en ${personaje.nombre}`, 'success');
              shouldReload = true;
            }
            break;
          }
          case 'estadisticas': {
            console.log('📊 [handleImportJSON] Importando estadísticas a personaje...');
            // Normalizar: soporta formato V1 (flat con nivel_paragon en raíz) y
            // V2 (objeto con clave "estadisticas" que envuelve las secciones).
            // nivel_paragon pertenece a Personaje, no a Estadisticas.
            let statsToSave: any;
            let parsedNivel: number | undefined;
            let parsedNivelParagon: number | undefined;

            if (data.estadisticas && typeof data.estadisticas === 'object' && !Array.isArray(data.estadisticas)) {
              // Formato V2: extraer secciones internas
              const v2 = data.estadisticas;
              statsToSave = {};
              if (v2.personaje) {
                statsToSave.personaje = v2.personaje;
                fieldsAdded.push('personaje');
              }
              if (v2.atributosPrincipales) {
                statsToSave.atributosPrincipales = v2.atributosPrincipales;
                fieldsAdded.push('atributosPrincipales');
              }
              if (v2.defensivo && !Array.isArray(v2.defensivo)) {
                statsToSave.defensivo = v2.defensivo;
                fieldsAdded.push('defensivo');
              }
              if (v2.ofensivo && !Array.isArray(v2.ofensivo)) {
                statsToSave.ofensivo = v2.ofensivo;
                fieldsAdded.push('ofensivo');
              }
              if (v2.utilidad && !Array.isArray(v2.utilidad)) {
                statsToSave.utilidad = v2.utilidad;
                fieldsAdded.push('utilidad');
              }
              if (v2.armaduraYResistencias) {
                statsToSave.armaduraYResistencias = v2.armaduraYResistencias;
                fieldsAdded.push('armaduraYResistencias');
              }
              if (v2.jcj) {
                statsToSave.jcj = v2.jcj;
                fieldsAdded.push('jcj');
              }
              if (v2.moneda) {
                statsToSave.moneda = v2.moneda;
                fieldsAdded.push('moneda');
              }
              parsedNivelParagon = data.nivel_paragon;
              parsedNivel = statsToSave.atributosPrincipales?.nivel;
            } else {
              // Formato V1 flat: nivel_paragon no pertenece a Estadisticas
              const { nivel_paragon, ...rest } = data;
              statsToSave = rest;
              parsedNivelParagon = nivel_paragon;
              parsedNivel = rest.atributosPrincipales?.nivel;
              
              // Detectar campos del formato V1
              Object.keys(rest).forEach(key => {
                if (!['nivel_paragon'].includes(key)) fieldsAdded.push(key);
              });
            }
            
            if (parsedNivel !== undefined) fieldsAdded.push('nivel');
            if (parsedNivelParagon !== undefined) fieldsAdded.push('nivel_paragon');

            console.log('📦 [handleImportJSON] Secciones de estadísticas a guardar:', Object.keys(statsToSave));
            console.log('🎯 [handleImportJSON] Nivel:', parsedNivel, '| Nivel Paragon:', parsedNivelParagon);

            // CRÍTICO: Leer personaje del disco y hacer DEEP MERGE de estadísticas
            const personajeFromDisk = await WorkspaceService.loadPersonaje(personaje.id);
            const basePersonaje = personajeFromDisk || personaje;
            
            // 🔧 NORMALIZAR ambos objetos antes del merge (base y nuevos)
            console.log('🔧 [handleImportJSON] Normalizando nombres de campos...');
            const normalizedBase = normalizeStatsFieldNames(basePersonaje.estadisticas || {});
            const normalizedNew = normalizeStatsFieldNames(statsToSave);
            
            console.log('📊 [handleImportJSON] Estadísticas BASE (normalizadas) antes del merge:', JSON.stringify(normalizedBase, null, 2));
            console.log('📦 [handleImportJSON] Estadísticas NUEVAS (normalizadas) a mergear:', JSON.stringify(normalizedNew, null, 2));
            
            // ✅ DEEP MERGE: Preserva TODOS los campos existentes en cada sección
            // Antes: { ...basePersonaje.estadisticas, ...statsToSave } → SHALLOW MERGE (perdía datos)
            // Ahora: deepMerge(...) → DEEP MERGE (preserva todo)
            //   + Normalización previa elimina campos duplicados con nombres incorrectos
            const mergedEstadisticas = deepMerge(normalizedBase, normalizedNew);
            const statEntries = collectStatsEntries(normalizedNew || {});

            if (areEquivalentContent(normalizedBase, mergedEstadisticas)) {
              itemsRepeated += statEntries.length || 1;
              repeatedItems.push(...statEntries.map(entry => `${getStatsSectionLabel(entry.section)}: ${entry.name}`));
            } else {
              itemsUpdated += statEntries.length || 1;
              updatedItemsList.push(...statEntries.map(entry => `${getStatsSectionLabel(entry.section)}: ${entry.name}`));
            }
            
            console.log('✅ [handleImportJSON] Estadísticas MERGEADAS (resultado final):', JSON.stringify(mergedEstadisticas, null, 2));
            
            const updatedPersonaje = {
              ...basePersonaje,
              estadisticas: mergedEstadisticas,
              ...(parsedNivel !== undefined && { nivel: parsedNivel }),
              ...(parsedNivelParagon !== undefined && { nivel_paragon: parsedNivelParagon }),
              fecha_actualizacion: new Date().toISOString()
            };
            
            await WorkspaceService.savePersonajeMerge(updatedPersonaje);
            syncUpdatedPersonajeInContext(updatedPersonaje);
            console.log('✅ [handleImportJSON] Estadísticas guardadas en personaje');
            console.log('📊 [handleImportJSON] Estadísticas finales:', updatedPersonaje.estadisticas);
            showToast(`✅ Estadísticas guardadas en ${personaje.nombre}`, 'success');
            shouldReload = true;
            break;
          }
        }
        
        const personajeResult: ImportResultDetails = {
          success: true,
          category: effectiveCategory,
          promptType: 'personaje',
          targetName: personaje.nombre,
          jsonInputsProcessed: 1,
          itemsImported,
          itemsUpdated,
          itemsSkipped: itemsRepeated,
          addedItems,
          updatedItemsList,
          repeatedItems,
          itemDetails: buildItemDetails(effectiveCategory, addedItems, updatedItemsList, repeatedItems),
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
            const categoryLabel = CATEGORIES.find(c => c.value === effectiveCategory)?.label || effectiveCategory;
            const nombre = `${categoryLabel.toLowerCase()}_${Date.now()}.png`;
            
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
        if (shouldReload) {
          console.log('⏸️ [handleImportJSON] Recarga diferida: esperando confirmación del usuario en el modal');
          setPendingFinalizeAction('reload');
        }
        setImporting(false);
        return personajeResult;
      }
      
    } catch (error) {
      console.error('❌ [handleImportJSON] Error importando JSON:', error);
      const errorResult: ImportResultDetails = {
        success: false,
        category: effectiveCategory,
        promptType: effectivePromptType,
        targetName: effectivePromptType === 'heroe' ? effectiveClase : (personajes.find(p => p.id === effectivePersonajeId)?.nombre || ''),
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
      
      // Guardar imagen
      const nombre = await ImageService.saveImage(image, selectedCategory, imageName.replace(/\.png$/, ''));
      
      // Guardar JSON asociado
      await ImageService.saveImageJSON(json, selectedCategory, nombre);
      
      showToast(`✅ Imagen y JSON guardados para revisión: ${selectedCategory}/${nombre}`, 'success');
      
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
      
      // Recarga diferida para permitir revisar reporte
      setPendingFinalizeAction('reload');
    } catch (error) {
      console.error('Error guardando datos:', error);
      showToast('❌ Error al guardar la imagen y JSON', 'error');
    }
  };

  // Ejecutar un JSON individual desde la galería
  const executeImageJSON = async (imageName: string) => {
    try {
      console.log(`▶️ Ejecutando JSON de imagen: ${imageName}`);
      console.log('🧭 [executeImageJSON] Estado previo:', {
        selectedCategory,
        promptType,
        selectedPersonajeId,
        selectedClase,
        selectedPersonajeContext: selectedPersonaje?.id || null
      });

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
      
      // Cargar JSON como texto para no fallar silenciosamente por parseo interno
      const jsonTextFromFile = await ImageService.loadJSONText(selectedCategory, imageName);
      if (!jsonTextFromFile) {
        console.error('❌ [executeImageJSON] JSON vacío o no legible para archivo:', imageName);
        showToast(`❌ No se encontró o no se pudo leer el JSON asociado a ${imageName}`, 'error');
        return;
      }
      console.log('📄 [executeImageJSON] JSON cargado, longitud:', jsonTextFromFile.length);
      
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
      setImportResults(result);
      setShowImportResults(true);
      setPendingFinalizeAction('reload');
      
      // Restaurar JSON original si la importación falló
      if (!result.success) {
        setJsonText(originalJson);
      }
    } catch (error) {
      console.error('Error ejecutando JSON:', error);
      showToast(`❌ Error al ejecutar JSON de ${imageName}`, 'error');
    }
  };

  // Ejecutar múltiples JSONs (batch)
  const executeBatchJSON = async (scope: 'category' | 'all') => {
    try {
      setExecutingBatch(true);
      console.log('🚀 [executeBatchJSON] Inicio:', {
        scope,
        selectedCategory,
        promptType,
        selectedPersonajeId,
        selectedClase,
        selectedPersonajeContext: selectedPersonaje?.id || null
      });
      const executionResults: Array<{ cat: ImageCategory; entryName: string; result: ImportResultDetails }> = [];
      const categories: ImageCategory[] = scope === 'category'
        ? [selectedCategory]
        : ['skills', 'glifos', 'aspectos', 'estadisticas', 'otros'];
      const originalCategory = selectedCategory;

      const allEntries: Array<{ entry: { nombre: string }; cat: ImageCategory }> = [];
      for (const cat of categories) {
        const entries = (await ImageService.listGalleryEntries(cat)).filter(entry => entry.hasJSON);
        allEntries.push(...entries.map(entry => ({ entry, cat })));
        console.log(`📦 [executeBatchJSON] ${cat}: ${entries.length} JSON(s) encontrados`);
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

        if (promptType === 'personaje' && !selectedPersonajeId && selectedPersonaje?.id) {
          console.warn('⚠️ [executeBatchJSON] Sin personaje seleccionado, usando selectedPersonaje del contexto:', selectedPersonaje.id);
          setSelectedPersonajeId(selectedPersonaje.id);
        }
        if (promptType === 'heroe' && !selectedClase && selectedPersonaje?.clase) {
          console.warn('⚠️ [executeBatchJSON] Sin clase seleccionada, usando clase del personaje actual:', selectedPersonaje.clase);
          setSelectedClase(selectedPersonaje.clase);
        }

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
              targetName: promptType === 'heroe' ? (selectedClase || 'sin-clase') : (personajes.find(p => p.id === selectedPersonajeId)?.nombre || 'sin-personaje'),
              validationErrors: [],
              rawJSON: '',
              errorMessage: 'No se pudo leer el archivo JSON desde galería'
            }
          });
          continue;
        }

        setJsonText(jsonTextFromFile);
        console.log('▶️ [executeBatchJSON] Importando:', { categoria: cat, archivo: entry.nombre, size: jsonTextFromFile.length });
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
        return `${cat}: ${ok}/${rows.length} JSONs, nuevos ${imported}, actualizados ${updated}, repetidos ${repeated}${fail > 0 ? `, ${fail} errores` : ''}`;
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
        targetName: scope === 'all' ? 'Todas las categorías' : `Categoría ${selectedCategory}`,
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

      setImportResults(batchSummary);
      setShowImportResults(true);
      setPendingFinalizeAction('reload');
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

  // Procesar con IA (Gemini)
  const processWithAI = async () => {
    console.log('🚀 [processWithAI] Iniciando procesamiento con IA...');
    
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

    // Validar que haya seleccionado personaje o clase según el tipo
    if (promptType === 'personaje' && !selectedPersonajeId) {
      showToast('❌ Selecciona un personaje primero', 'error');
      return;
    }
    if (promptType === 'heroe' && !selectedClase) {
      showToast('❌ Selecciona una clase primero', 'error');
      return;
    }

    setAiProcessing(true);
    setAiProgress('sending');
    setAiExtractedJSON('');

    try {
      // 1. Input entregado, procesando con IA
      showToast('🤖 Enviando imagen y prompt a Gemini...', 'info');

      // Obtener el blob de la imagen (galería o compuesta)
      let imageBlob: Blob;
      if (selectedGalleryImageBlob) {
        imageBlob = selectedGalleryImageBlob;
        console.log('📦 [processWithAI] Usando blob de galería:', imageBlob.size, 'bytes');
      } else {
        const response = await fetch(imageToProcess);
        imageBlob = await response.blob();
        console.log('📦 [processWithAI] Blob descargado:', imageBlob.size, 'bytes');
      }

      // Obtener el prompt
      const prompt = getPromptForCategory();
      console.log('📝 [processWithAI] Prompt generado para categoría:', selectedCategory);
      console.log('📄 [processWithAI] Longitud del prompt:', prompt.length, 'caracteres');
      console.log('📋 [processWithAI] Prompt completo:\n', prompt);

      // 2. Procesando con IA
      setAiProgress('processing');
      showToast('⚡ Gemini está analizando la imagen...', 'info');

      // ✨ NUEVA INTEGRACIÓN CON FALLBACK AUTOMÁTICO
      // El servicio intentará múltiples modelos hasta que uno funcione
      console.log('🤖 [processWithAI] Llamando a GeminiService.processAndExtractJSON...');
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
      console.log('✅ [processWithAI] Análisis exitoso con modelo:', result.modelUsed);
      showToast(`✅ Procesado con ${result.modelUsed}`, 'success');

      // 3. JSON obtenido
      setAiProgress('received');
      setAiExtractedJSON(result.json);
      console.log('📦 [processWithAI] JSON recibido de Gemini:\n', result.json);

      // Validar que sea JSON válido
      let parsedJSON: any;
      try {
        parsedJSON = JSON.parse(result.json);
        console.log('✅ [processWithAI] JSON parseado correctamente:', parsedJSON);
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
      console.log('💾 [processWithAI] Ejecutando handleImportJSON...');
      const importResult = await handleImportJSON();
      console.log('📊 [processWithAI] Resultado de importación:', importResult);

      // 5. Mostrar modal con resultados
      setImportResults(importResult);
      setShowImportResults(true);
      setPendingFinalizeAction('reload');

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
        category: selectedCategory,
        promptType,
        targetName: promptType === 'heroe' ? selectedClase : (personajes.find(p => p.id === selectedPersonajeId)?.nombre || ''),
        validationErrors: [],
        rawJSON: aiExtractedJSON || '',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido al procesar con IA'
      };
      
      setImportResults(errorResult);
      setShowImportResults(true);
      
      showToast(`❌ ${error instanceof Error ? error.message : 'Error desconocido'}`, 'error');
      setAiProgress('idle');
      setAiProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="card max-w-7xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2 sm:p-4 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3 animate-slide-in-right ${
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

        {/* Header compacto: Categorías + Botones Captura/Galería + Cerrar */}
        <div className="flex flex-wrap items-center justify-between mb-3 gap-2 sticky top-0 bg-d4-surface pb-2 border-b border-d4-border z-10">
          {/* Categorías con iconos */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <label className="text-xs font-semibold text-d4-text whitespace-nowrap">Categoría:</label>
            <div className="flex flex-wrap gap-1.5 items-center">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-2 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.value
                        ? 'bg-d4-accent text-black'
                        : 'bg-d4-bg text-d4-text hover:bg-d4-border'
                    }`}
                    title={cat.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">{cat.label}</span>
                    {categoryCounts[cat.value] > 0 && (
                      <span className="text-[10px] opacity-70 hidden md:inline">({categoryCounts[cat.value]})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Botones Captura/Galería + Cerrar a la derecha */}
          <div className="flex gap-1.5 shrink-0 items-center">
            <button
              onClick={() => setShowGallery(false)}
              className={`px-2 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                !showGallery ? 'bg-d4-accent text-black' : 'bg-d4-bg text-d4-text'
              }`}
              title="Capturar imágenes"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Capturar</span>
            </button>
            <button
              onClick={() => { setShowGallery(true); loadGallery(); }}
              className={`px-2 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                showGallery ? 'bg-d4-accent text-black' : 'bg-d4-bg text-d4-text'
              }`}
              title="Ver galería"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Galería</span>
              {categoryCounts[selectedCategory] > 0 && (
                <span className="text-[10px] opacity-70">({categoryCounts[selectedCategory]})</span>
              )}
            </button>
            <div className="w-px h-5 bg-d4-border mx-0.5" />
            <button onClick={onClose} className="p-1.5 hover:bg-d4-border rounded-lg transition-colors" title="Cerrar">
              <X className="w-4 h-4 text-d4-text" />
            </button>
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
              <div className="absolute right-0 top-full mt-2 w-80 bg-d4-surface border-2 border-d4-accent rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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
              <div className="absolute right-0 top-full mt-2 w-64 bg-d4-surface border-2 border-cyan-500 rounded-lg p-2.5 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
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
                        className={`group/btn p-1 sm:p-2 rounded-lg font-bold transition-all shadow-lg ${
                          captureMode === 'new'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white scale-105'
                            : 'bg-d4-surface/90 text-d4-text hover:bg-d4-border backdrop-blur-sm'
                        }`}
                        title="Nuevo Elemento - Agrega a la derecha (horizontal)"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => setCaptureMode('continue')}
                        className={`group/btn p-1 sm:p-2 rounded-lg font-bold transition-all shadow-lg ${
                          captureMode === 'continue'
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white scale-105'
                            : 'bg-d4-surface/90 text-d4-text hover:bg-d4-border backdrop-blur-sm'
                        }`}
                        title="Completar - Agrega abajo (vertical)"
                      >
                        <ArrowDown className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={copyLastSavedImage}
                        disabled={!lastSavedImageUrl}
                        className={`group/btn p-1 sm:p-2 rounded-lg font-bold transition-all shadow-lg ${
                          lastSavedImageUrl
                            ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white'
                            : 'bg-gray-600/90 text-gray-400 cursor-not-allowed backdrop-blur-sm'
                        }`}
                        title={lastSavedImageUrl ? 'Copiar última imagen guardada para pegarla' : 'No hay imagen guardada en esta categoría'}
                      >
                        <Copy className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => setEmbedPromptInImage(!embedPromptInImage)}
                        className={`group/btn p-1 sm:p-2 rounded-lg font-bold transition-all shadow-lg ${
                          embedPromptInImage
                            ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white scale-105'
                            : 'bg-d4-surface/90 text-d4-text hover:bg-d4-border backdrop-blur-sm'
                        }`}
                        title={embedPromptInImage ? 'Prompt embebido en imagen (activo)' : 'Embeber prompt en imagen (inactivo)'}
                      >
                        <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
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
                        className={`group/btn p-1 sm:p-2 rounded-lg font-bold transition-all shadow-lg ${
                          captureMode === 'new'
                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white scale-105'
                            : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                        }`}
                        title="Nuevo Elemento - Agrega a la derecha (horizontal)"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => setCaptureMode('continue')}
                        className={`group/btn p-1 sm:p-2 rounded-lg font-bold transition-all shadow-lg ${
                          captureMode === 'continue'
                            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white scale-105'
                            : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                        }`}
                        title="Completar - Agrega abajo (vertical)"
                      >
                        <ArrowDown className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={copyLastSavedImage}
                        disabled={!lastSavedImageUrl}
                        className={`group/btn p-1 sm:p-2 rounded-lg font-bold transition-all shadow-lg ${
                          lastSavedImageUrl
                            ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                        title={lastSavedImageUrl ? 'Copiar última imagen guardada para pegarla' : 'No hay imagen guardada en esta categoría'}
                      >
                        <Copy className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => setEmbedPromptInImage(!embedPromptInImage)}
                        className={`group/btn p-1 sm:p-2 rounded-lg font-bold transition-all shadow-lg ${
                          embedPromptInImage
                            ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white scale-105'
                            : 'bg-d4-surface text-d4-text hover:bg-d4-border'
                        }`}
                        title={embedPromptInImage ? 'Prompt embebido en imagen (activo)' : 'Embeber prompt en imagen (inactivo)'}
                      >
                        <FileText className="w-5 h-5" />
                        <span className="hidden lg:inline ml-2 text-xs">Prompt</span>
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
                  {/* Botones de acción */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={saveComposedImage} 
                      disabled={!composedImageUrl}
                      className={`p-2.5 rounded-lg font-semibold transition-all ${
                        composedImageUrl
                          ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Guardar imagen en la galería"
                    >
                      <Save className="w-4 h-4" />
                      <span className="hidden md:inline ml-1.5 text-xs">Guardar</span>
                    </button>
                    <button 
                      onClick={downloadComposedImage} 
                      disabled={!composedImageUrl}
                      className={`p-2.5 rounded-lg font-semibold transition-all ${
                        composedImageUrl
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Descargar imagen a tu PC"
                    >
                      <Download className="w-4 h-4" />
                    </button>
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
                      className={`p-2.5 rounded-lg font-semibold transition-all ${
                        composedImageUrl
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Copiar imagen al portapapeles para pegarla en el chat de IA"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (composedImageUrl) {
                          URL.revokeObjectURL(composedImageUrl);
                          setComposedImageUrl(null);
                          showToast('🗑️ Imagen compuesta eliminada', 'success');
                        }
                      }}
                      disabled={!composedImageUrl}
                      className={`p-2.5 rounded-lg font-semibold transition-all ${
                        composedImageUrl
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Eliminar la imagen compuesta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {/* Botón Procesar con IA */}
                    <button 
                      onClick={processWithAI}
                      disabled={!(composedImageUrl || selectedGalleryImage) || aiProcessing || !showPromptPanel || (promptType === 'personaje' && !selectedPersonajeId) || (promptType === 'heroe' && !selectedClase)}
                      className={`p-2.5 rounded-lg font-semibold transition-all ${
                        (composedImageUrl || selectedGalleryImage) && !aiProcessing && showPromptPanel && ((promptType === 'heroe' && selectedClase) || (promptType === 'personaje' && selectedPersonajeId))
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title={
                        !showPromptPanel 
                          ? 'Abre el panel de Prompt primero' 
                          : (promptType === 'personaje' && !selectedPersonajeId)
                            ? 'Selecciona un personaje en el panel de Prompt'
                            : (promptType === 'heroe' && !selectedClase)
                              ? 'Selecciona una clase en el panel de Prompt'
                              : 'Procesar con IA y Guardar'
                      }
                    >
                      {aiProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {/* Viewer del JSON (debajo de los botones si existe) */}
                  {showJSONViewer && aiExtractedJSON && (
                    <div className="mt-2 bg-d4-surface rounded-lg p-3 border border-blue-500">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-300">JSON Obtenido:</span>
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
                  
                </div>
              </div>

              {/* Panel de Prompt (lateral, colapsable) */}
              {showPromptPanel && (
                <div className="bg-d4-bg p-1.5 lg:p-2 rounded border border-d4-accent/30 flex flex-col">
                  <h3 className="text-xs lg:text-sm font-bold text-d4-accent mb-1.5 lg:mb-2">
                    <span className="hidden lg:inline">Prompt para {CATEGORIES.find(c => c.value === selectedCategory)?.label}</span>
                    <span className="lg:hidden">Prompt</span>
                  </h3>
                  
                  <div className="mb-1.5 lg:mb-2">
                    <label className="block text-[10px] lg:text-xs font-semibold text-d4-text mb-0.5 lg:mb-1">
                      Tipo:
                    </label>
                    <div className="flex gap-1.5 lg:gap-2">
                      {selectedCategory !== 'estadisticas' && (
                        <button
                          onClick={() => setPromptType('heroe')}
                          className={`px-2 lg:px-3 py-1 lg:py-1.5 rounded text-[10px] lg:text-sm font-semibold ${
                            promptType === 'heroe' ? 'bg-d4-accent text-black' : 'bg-d4-surface text-d4-text'
                          }`}
                        >
                          Héroe
                        </button>
                      )}
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

                  {/* Selector de clase (solo si tipo = heroe) */}
                  {promptType === 'heroe' && (
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
                      onClick={() => { void handleImportJSON(); }}
                      disabled={!jsonText.trim() || importing || (promptType === 'personaje' && !selectedPersonajeId) || (promptType === 'heroe' && !selectedClase)}
                      className={`mt-1.5 lg:mt-3 w-full px-2 lg:px-4 py-1 lg:py-2 rounded text-[10px] lg:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 lg:gap-2 ${
                        jsonText.trim() && !importing && ((promptType === 'heroe' && selectedClase) || (promptType === 'personaje' && selectedPersonajeId))
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
                            {promptType === 'heroe' 
                              ? selectedClase 
                                ? `Guardar en Héroe (${selectedClase})`
                                : 'Guardar en Héroe (Selecciona clase)'
                              : selectedPersonajeId 
                                ? `Guardar en ${personajes.find(p => p.id === selectedPersonajeId)?.nombre || 'Personaje'}`
                                : 'Selecciona un personaje primero'}
                          </span>
                          <span className="md:hidden">Guardar</span>
                        </>
                      )}
                    </button>
                    {promptType === 'personaje' && !selectedPersonajeId && (
                      <p className="text-[9px] lg:text-xs text-yellow-400 mt-1 lg:mt-2">
                        ⚠️ Selecciona un personaje arriba para poder guardar
                      </p>
                    )}
                    {promptType === 'heroe' && !selectedClase && (
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

                      {/* Selector de clase (solo si tipo = heroe) */}
                      {promptType === 'heroe' && (
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
                    onClick={processWithAI}
                    disabled={aiProcessing || !showPromptPanel || (promptType === 'personaje' && !selectedPersonajeId) || (promptType === 'heroe' && !selectedClase)}
                    className={`p-2.5 rounded-lg font-semibold transition-all ${
                      !aiProcessing && showPromptPanel && ((promptType === 'heroe' && selectedClase) || (promptType === 'personaje' && selectedPersonajeId))
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    title={
                      aiProcessing
                        ? `Procesando (${aiProgress})`
                        : (!showPromptPanel
                          ? 'Abre el panel de Prompt primero'
                          : (promptType === 'personaje' && !selectedPersonajeId)
                            ? 'Selecciona un personaje en el panel de Prompt'
                            : (promptType === 'heroe' && !selectedClase)
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
                  {showPromptPanel && promptType === 'personaje' && !selectedPersonajeId && (
                    <p className="text-xs text-yellow-400 mt-2 text-center">
                      ⚠️ Selecciona un personaje en el panel de Prompt
                    </p>
                  )}
                  {showPromptPanel && promptType === 'heroe' && !selectedClase && (
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
                  onClick={() => executeBatchJSON('category')}
                  disabled={executingBatch || galleryImages.filter(img => img.hasJSON).length === 0}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  title="Ejecutar todos los JSONs de esta categoría"
                >
                  <PlayCircle size={16} />
                  <span>Importar Categoría ({galleryImages.filter(img => img.hasJSON).length})</span>
                </button>
              </div>
              
              {galleryImages.length === 0 ? (
                <p className="text-d4-text-dim text-center py-8">
                  No hay imágenes guardadas en esta categoría
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
                    {galleryImages.map((img, index) => (
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
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => executeBatchJSON('all')}
                disabled={executingBatch}
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
          setShowImportResults(false);
          setPendingFinalizeAction(null);
        }}
        results={importResults}
        onContinue={() => {
          if (pendingFinalizeAction === 'reload') {
            window.location.reload();
            return;
          }
          setShowImportResults(false);
          setPendingFinalizeAction(null);
        }}
        continueLabel={pendingFinalizeAction === 'reload' ? 'Finalizar proceso' : 'Continuar'}
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
    </div>
  );
};

export default ImageCaptureModal;
