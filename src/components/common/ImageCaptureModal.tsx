import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Plus, ArrowDown, Save, Image as ImageIcon, Trash2, Copy, Download, HelpCircle, CheckCircle, AlertCircle, XCircle, Zap, Eye } from 'lucide-react';
import { ImageCategory, ImageService } from '../../services/ImageService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import { TagLinkingService } from '../../services/TagLinkingService';
import { useAppContext } from '../../context/AppContext';
import { WorkspaceService } from '../../services/WorkspaceService';
import { GeminiService } from '../../services/GeminiService';
import ImportResultsModal, { ImportResultDetails } from './ImportResultsModal';
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

const CATEGORIES: { value: ImageCategory; label: string }[] = [
  { value: 'skills', label: 'Habilidades' },
  { value: 'glifos', label: 'Glifos' },
  { value: 'aspectos', label: 'Aspectos' },
  { value: 'estadisticas', label: 'Estadísticas' },
  { value: 'otros', label: 'Otros' },
];

const ImageCaptureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { personajes, availableClasses, selectedPersonaje, setSelectedPersonaje, setPersonajes } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>('skills');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [composedImageUrl, setComposedImageUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Array<{ nombre: string; url: string; fecha: string }>>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showPromptPanel, setShowPromptPanel] = useState(false);
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
  const GEMINI_API_KEY = 'AIzaSyCUU5YJqZfaXPkOvmvVfizpAfWRLSEb4Lk'; // Idealmente esto debería estar en un .env
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setShowPromptPanel(false);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isNewElement: boolean) => {
    const files = e.target.files;
    if (files && files[0]) {
      addImageToComposition(files[0], isNewElement);
    }
    // Resetear input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
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
    canvas.width = totalWidth;
    canvas.height = totalHeight + promptHeight;

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
      const frameX = PROMPT_MARGIN;
      const frameY = PROMPT_MARGIN;
      const frameWidth = canvas.width - (PROMPT_MARGIN * 2);
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
      let xOffset = 0;
      completeGroups.forEach((group, groupIndex) => {
        if (groupIndex > 0) xOffset += SPACING;
        
        let groupStartX = xOffset;
        let yOffset = imageOffsetY;
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
      let currentRowY = imageOffsetY;
      
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
        let xOffset = 0;
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
      case 'skills': return 6;  // Aumentado de 4 a 6
      case 'glifos': return 8;  // Aumentado de 6 a 8
      case 'aspectos': return 7;  // Aumentado de 5 a 7
      case 'estadisticas': return 5; // 5 capturas ideales (secciones distintas)
      case 'otros': return 8;  // Aumentado de 5 a 8
    }
  };

  const getElementCount = (): number => {
    // Contar elementos completos (isComplete = true)
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
      
      showToast(`✅ Imagen guardada: ${selectedCategory}/img/${nombre}`, 'success');
      
      // Limpiar captura
      setCapturedImages([]);
      setComposedImageUrl(null);
      
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
      const images = await ImageService.listImages(selectedCategory);
      const imageUrls = images.map(img => ({
        nombre: img.nombre,
        url: URL.createObjectURL(img.blob),
        fecha: new Date(img.fecha).toLocaleString('es-ES')
      }));
      setGalleryImages(imageUrls);
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

  // Seleccionar imagen de galería para procesar con IA
  const selectGalleryImage = async (imageUrl: string, imageName: string) => {
    try {
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
      showToast(`✅ Imagen "${imageName}" seleccionada para procesar con IA`, 'success');
      
      // Abrir panel de prompt automáticamente
      if (!showPromptPanel) {
        setShowPromptPanel(true);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      showToast('❌ Error al seleccionar imagen', 'error');
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

  // Importar JSON resultante
  const handleImportJSON = async (): Promise<ImportResultDetails> => {
    console.log('🔵 [handleImportJSON] Iniciando importación...');
    console.log('📝 [handleImportJSON] Categoría:', selectedCategory);
    console.log('👤 [handleImportJSON] Tipo de prompt:', promptType);
    
    // Validación inicial
    if (!jsonText.trim()) {
      const errorResult: ImportResultDetails = {
        success: false,
        category: selectedCategory,
        promptType,
        targetName: '',
        validationErrors: [],
        rawJSON: jsonText,
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
      parsedData = JSON.parse(jsonText);
      console.log('✅ [handleImportJSON] JSON parseado correctamente:', parsedData);
      
      // 2. VALIDAR ESTRUCTURA
      console.log('🔍 [handleImportJSON] Validando estructura del JSON...');
      const validation = validateJSONByCategory(selectedCategory, parsedData);
      console.log('📊 [handleImportJSON] Resultado de validación:', validation);
      console.log('   - Válido:', validation.isValid);
      console.log('   - Errores:', validation.errors.length);
      console.log('   - Advertencias:', validation.warnings.length);
      console.log('   - Campos detectados:', validation.detectedFields);
      
      // Si hay errores críticos, retornar sin importar
      if (!validation.isValid) {
        const errorResult: ImportResultDetails = {
          success: false,
          category: selectedCategory,
          promptType,
          targetName: promptType === 'heroe' ? selectedClase : (personajes.find(p => p.id === selectedPersonajeId)?.nombre || ''),
          validationErrors: [...validation.errors, ...validation.warnings],
          rawJSON: jsonText,
          parsedJSON: parsedData,
          errorMessage: 'El JSON no tiene la estructura esperada'
        };
        setImporting(false);
        return errorResult;
      }
      
      const data = parsedData;
      let itemsImported = 0;
      let itemsUpdated = 0;
      const fieldsAdded: string[] = [];
      
      if (promptType === 'heroe') {
        // =============== GUARDAR EN HÉROE ===============
        console.log('🦸 [handleImportJSON] Modo: Guardar en héroe');
        
        if (!selectedClase) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: selectedCategory,
            promptType,
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

        const clase = selectedClase;
        console.log('📄 [handleImportJSON] Clase seleccionada:', clase);
        
        switch (selectedCategory) {
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
                  heroSkills.habilidades_activas[idx] = skillWithId;
                  itemsUpdated++;
                } else {
                  heroSkills.habilidades_activas.push(skillWithId);
                  itemsImported++;
                }
                fieldsAdded.push(`Activa: ${skill.nombre}`);
              });

              // 🔄 MERGE pasivas (por nombre)
              pasivasNuevas.forEach((skill: any) => {
                const idx = heroSkills.habilidades_pasivas.findIndex((s: any) => s.nombre === skill.nombre);
                const skillId = idx >= 0 ? heroSkills.habilidades_pasivas[idx].id : (skill.id || `skill_pasiva_${skill.nombre.toLowerCase().replace(/\s+/g, '_')}`);
                const skillWithId = { ...skill, id: skillId };
                if (idx >= 0) {
                  heroSkills.habilidades_pasivas[idx] = skillWithId;
                  itemsUpdated++;
                } else {
                  heroSkills.habilidades_pasivas.push(skillWithId);
                  itemsImported++;
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
                  heroGlyphs.glifos[idx] = glyphWithId;
                  itemsUpdated++;
                } else {
                  heroGlyphs.glifos.push(glyphWithId);
                  itemsImported++;
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
                  heroAspects.aspectos[idx] = aspectWithId;
                  itemsUpdated++;
                } else {
                  heroAspects.aspectos.push(aspectWithId);
                  itemsImported++;
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
            fieldsAdded.push(...Object.keys(data));
            
            await WorkspaceService.saveHeroStats(clase, data);
            console.log('✅ [handleImportJSON] Estadísticas guardadas');
            showToast(`✅ Estadísticas guardadas en ${clase}`, 'success');
            shouldReload = true;
            break;
        }
        
        const heroResult: ImportResultDetails = {
          success: true,
          category: selectedCategory,
          promptType: 'heroe',
          targetName: clase,
          itemsImported,
          itemsUpdated: 0,
          fieldsAdded,
          validationErrors: validation.warnings,
          rawJSON: jsonText,
          parsedJSON: parsedData
        };
        
        setJsonText('');
        if (shouldReload) {
          setTimeout(() => window.location.reload(), 250);
        }
        setImporting(false);
        return heroResult;
        
      } else {
        // =============== GUARDAR EN PERSONAJE ===============
        console.log('🎮 [handleImportJSON] Modo: Guardar en personaje');
        
        if (!selectedPersonajeId) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: selectedCategory,
            promptType,
            targetName: '',
            validationErrors: validation.warnings,
            rawJSON: jsonText,
            parsedJSON: parsedData,
            errorMessage: 'Selecciona un personaje primero'
          };
          showToast('❌ Selecciona un personaje primero', 'error');
          setImporting(false);
          return errorResult;
        }

        const personaje = personajes.find(p => p.id === selectedPersonajeId);
        if (!personaje) {
          const errorResult: ImportResultDetails = {
            success: false,
            category: selectedCategory,
            promptType,
            targetName: '',
            validationErrors: validation.warnings,
            rawJSON: jsonText,
            parsedJSON: parsedData,
            errorMessage: 'Personaje no encontrado'
          };
          showToast('❌ Personaje no encontrado', 'error');
          setImporting(false);
          return errorResult;
        }
        
        console.log('👤 [handleImportJSON] Personaje seleccionado:', personaje.nombre);

        switch (selectedCategory) {
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
                  heroSkills.habilidades_activas[idx] = skillWithId;
                  itemsUpdated++;
                } else {
                  heroSkills.habilidades_activas.push(skillWithId);
                  itemsImported++;
                }
                fieldsAdded.push(`Activa: ${skill.nombre}`);
              });

              newPasivas.forEach((skill: any) => {
                const idx = heroSkills.habilidades_pasivas.findIndex((s: any) => s.nombre === skill.nombre);
                const skillId = idx >= 0 ? heroSkills.habilidades_pasivas[idx].id : (skill.id || `skill_pasiva_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
                const skillWithId = { ...skill, id: skillId };
                if (idx >= 0) {
                  heroSkills.habilidades_pasivas[idx] = skillWithId;
                  itemsUpdated++;
                } else {
                  heroSkills.habilidades_pasivas.push(skillWithId);
                  itemsImported++;
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
                  heroGlyphs.glifos[idx] = glyphWithId;
                  itemsUpdated++;
                } else {
                  heroGlyphs.glifos.push(glyphWithId);
                  itemsImported++;
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
                  heroAspects.aspectos[idx] = aspectoWithId;
                  itemsUpdated++;
                } else {
                  heroAspects.aspectos.push(aspectoWithId);
                  itemsImported++;
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
          category: selectedCategory,
          promptType: 'personaje',
          targetName: personaje.nombre,
          itemsImported,
          itemsUpdated,
          fieldsAdded,
          validationErrors: validation.warnings,
          rawJSON: jsonText,
          parsedJSON: parsedData
        };
        
        setJsonText('');
        if (shouldReload) {
          console.log('🔄 [handleImportJSON] Se recargará la página en 250ms...');
          setTimeout(() => window.location.reload(), 250);
        }
        setImporting(false);
        return personajeResult;
      }
      
    } catch (error) {
      console.error('❌ [handleImportJSON] Error importando JSON:', error);
      const errorResult: ImportResultDetails = {
        success: false,
        category: selectedCategory,
        promptType,
        targetName: promptType === 'heroe' ? selectedClase : (personajes.find(p => p.id === selectedPersonajeId)?.nombre || ''),
        validationErrors: [],
        rawJSON: jsonText,
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
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="card max-w-7xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div className={`absolute top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in-right ${
            toastType === 'success' ? 'bg-green-600 text-white' :
            toastType === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}>
            {toastType === 'success' && <CheckCircle className="w-5 h-5" />}
            {toastType === 'error' && <XCircle className="w-5 h-5" />}
            {toastType === 'info' && <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-d4-surface pb-4 border-b border-d4-border z-10">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-d4-accent" />
            <h2 className="text-2xl font-bold text-d4-accent">Captura de Imágenes</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-d4-border rounded transition-colors">
            <X className="w-5 h-5 text-d4-text" />
          </button>
        </div>

        {/* Selector de categoría */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-d4-text mb-2">Categoría:</label>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded font-semibold transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-d4-accent text-black'
                    : 'bg-d4-bg text-d4-text hover:bg-d4-border'
                }`}
              >
                {cat.label}
                {categoryCounts[cat.value] > 0 && (
                  <span className="ml-1 text-xs opacity-70">({categoryCounts[cat.value]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs con barra de progreso minimalista */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setShowGallery(false)}
              className={`px-4 py-2 rounded font-semibold ${
                !showGallery ? 'bg-d4-accent text-black' : 'bg-d4-bg text-d4-text'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Capturar
            </button>
            <button
              onClick={() => { setShowGallery(true); loadGallery(); }}
              className={`px-4 py-2 rounded font-semibold ${
                showGallery ? 'bg-d4-accent text-black' : 'bg-d4-bg text-d4-text'
              }`}
            >
              <ImageIcon className="w-4 h-4 inline mr-2" />
              Galería
              {categoryCounts[selectedCategory] > 0 && (
                <span className="ml-1 text-xs opacity-70">({categoryCounts[selectedCategory]})</span>
              )}
            </button>
          </div>
          
          {/* Barra de progreso minimalista (solo visible en tab Captura) */}
          {!showGallery && (
            <div className="relative group">
              <div className="flex items-center gap-2">
                <span className="text-xs text-d4-text-dim font-semibold">{getElementCount()}/{getRecommendedMax(selectedCategory)}</span>
                <div className="w-32 bg-d4-surface rounded-full h-3 overflow-hidden border border-d4-border cursor-help">
                  <div 
                    className={`h-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
              {/* Tooltip con recomendación completa */}
              <div className="absolute right-0 top-full mt-2 w-80 bg-d4-surface border-2 border-cyan-500 rounded-lg p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="text-sm font-bold text-cyan-300 mb-2">
                  💡 Recomendación para {CATEGORIES.find(c => c.value === selectedCategory)?.label}:
                </p>
                <div className="text-sm text-d4-text-dim space-y-1">
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
          )}
        </div>

        {/* Contenido según tab */}
        {!showGallery && (
          <div className="space-y-6">
            {/* Preview de imagen compuesta con panel de prompt lateral */}
            <div className={`grid gap-4 ${showPromptPanel ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* Panel de Preview */}
              <div className="bg-d4-bg p-4 rounded border-2 border-d4-accent/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-d4-accent flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Preview en Tiempo Real
                  </h3>
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
                    </button>
                    {/* Tooltip de instrucciones */}
                    <div className="relative group">
                      <button
                        className="p-2 bg-d4-surface hover:bg-d4-border rounded-full transition-colors"
                        title="Ver instrucciones"
                      >
                        <HelpCircle className="w-5 h-5 text-d4-accent" />
                      </button>
                      {/* Tooltip */}
                      <div className="absolute right-0 top-full mt-2 w-96 bg-d4-surface border-2 border-d4-accent rounded-lg p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <p className="text-sm font-bold text-d4-accent mb-2">
                          📸 Instrucciones de Captura:
                        </p>
                        <ul className="text-xs text-d4-text-dim space-y-1 list-disc list-inside">
                          <li>Toma screenshot con <kbd className="px-1 py-0.5 bg-d4-bg rounded">Win + Shift + S</kbd></li>
                          <li>Selecciona modo (Nuevo Elemento o Completar)</li>
                          <li>Pega con <kbd className="px-1 py-0.5 bg-d4-bg rounded">Ctrl + V</kbd> o carga archivo</li>
                          <li><strong>Nuevo Elemento</strong>: Agrega a la DERECHA con espacio (elemento diferente)</li>
                          <li><strong>Completar</strong>: Agrega ABAJO sin espacio (continúa elemento anterior)</li>
                          <li>La imagen se compone en <strong>tiempo real</strong> aquí</li>
                          <li>Cuando termines, presiona <strong>"Guardar Imagen Acumulada"</strong></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {composedImageUrl ? (
                  <div className="bg-white p-4 rounded max-h-96 overflow-auto border-2 border-green-500/50">
                    <img src={composedImageUrl} alt="Composed" className="w-full h-auto object-contain" style={{ maxWidth: '100%', transform: 'scale(0.85)' }} />
                  </div>
                ) : (
                  <div className="bg-d4-surface p-8 rounded border-2 border-dashed border-d4-border flex flex-col items-center justify-center min-h-[200px]">
                    <ImageIcon className="w-16 h-16 text-d4-text-dim mb-3" />
                    <p className="text-d4-text-dim text-center">
                      La imagen compuesta aparecerá aquí en tiempo real
                      <br />
                      <span className="text-xs">Pega o carga imágenes para comenzar</span>
                    </p>
                  </div>
                )}

                {/* Opciones de guardado */}
                <div className="mt-4 space-y-3">
                  {/* Checkbox para embeber prompt */}
                  <label className="flex items-center gap-2 p-2 bg-d4-surface rounded cursor-pointer hover:bg-d4-border transition-colors">
                    <input
                      type="checkbox"
                      checked={embedPromptInImage}
                      onChange={(e) => setEmbedPromptInImage(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-d4-text">
                      📝 <strong>Embeber prompt en la imagen</strong> (versión resumida para ChatGPT)
                    </span>
                  </label>

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <button 
                      onClick={saveComposedImage} 
                      disabled={!composedImageUrl}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
                        composedImageUrl
                          ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-5 h-5" />
                      Guardar Imagen Acumulada
                    </button>
                    <button 
                      onClick={downloadComposedImage} 
                      disabled={!composedImageUrl}
                      className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        composedImageUrl
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      Descargar
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
                      className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        composedImageUrl
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Copiar imagen al portapapeles para pegarla en el chat de IA"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
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
                      className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        composedImageUrl
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      title="Eliminar la imagen compuesta"
                    >
                      <Trash2 className="w-4 h-4" />
                      Borrar
                    </button>
                  </div>

                  {/* Botón Procesar con IA */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border-2 border-purple-500/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-purple-400" />
                        <h4 className="text-sm font-bold text-purple-300">
                          Procesamiento Automático con IA
                        </h4>
                      </div>
                      {aiExtractedJSON && (
                        <button
                          onClick={() => setShowJSONViewer(!showJSONViewer)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
                          title="Ver JSON obtenido"
                        >
                          <Eye className="w-3 h-3" />
                          Ver JSON
                        </button>
                      )}
                    </div>
                    
                    {/* Barra de progreso */}
                    {aiProcessing && (
                      <div className="mb-3 bg-d4-surface rounded-lg p-3 border border-d4-border">
                        <div className="space-y-2">
                          {/* Estado: Input entregado */}
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${aiProgress !== 'idle' ? 'bg-green-500' : 'bg-gray-600'}`} />
                            <span className={`text-xs ${aiProgress !== 'idle' ? 'text-green-300' : 'text-gray-500'}`}>
                              Input entregado
                            </span>
                          </div>
                          
                          {/* Estado: Procesando con IA */}
                          <div className="flex items-center gap-2">
                            {aiProgress === 'processing' ? (
                              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                            ) : (
                              <div className={`w-3 h-3 rounded-full ${['received', 'saving', 'done'].includes(aiProgress) ? 'bg-green-500' : 'bg-gray-600'}`} />
                            )}
                            <span className={`text-xs ${aiProgress === 'processing' ? 'text-yellow-300 font-semibold' : ['received', 'saving', 'done'].includes(aiProgress) ? 'text-green-300' : 'text-gray-500'}`}>
                              Procesando con IA
                            </span>
                          </div>
                          
                          {/* Estado: JSON obtenido */}
                          <div className="flex items-center gap-2">
                            {aiProgress === 'received' ? (
                              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                            ) : (
                              <div className={`w-3 h-3 rounded-full ${['saving', 'done'].includes(aiProgress) ? 'bg-green-500' : 'bg-gray-600'}`} />
                            )}
                            <span className={`text-xs ${aiProgress === 'received' ? 'text-yellow-300 font-semibold' : ['saving', 'done'].includes(aiProgress) ? 'text-green-300' : 'text-gray-500'}`}>
                              JSON obtenido
                            </span>
                          </div>
                          
                          {/* Estado: Guardando */}
                          <div className="flex items-center gap-2">
                            {aiProgress === 'saving' ? (
                              <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                            ) : (
                              <div className={`w-3 h-3 rounded-full ${aiProgress === 'done' ? 'bg-green-500' : 'bg-gray-600'}`} />
                            )}
                            <span className={`text-xs ${aiProgress === 'saving' ? 'text-yellow-300 font-semibold' : aiProgress === 'done' ? 'text-green-300' : 'text-gray-500'}`}>
                              Guardando datos
                            </span>
                          </div>
                          
                          {/* Estado: Completado */}
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${aiProgress === 'done' ? 'bg-green-500' : 'bg-gray-600'}`} />
                            <span className={`text-xs ${aiProgress === 'done' ? 'text-green-300 font-semibold' : 'text-gray-500'}`}>
                              ✅ Proceso completado
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

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
                    
                    <button
                      onClick={processWithAI}
                      disabled={!(composedImageUrl || selectedGalleryImage) || aiProcessing || !showPromptPanel || (promptType === 'personaje' && !selectedPersonajeId) || (promptType === 'heroe' && !selectedClase)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
                        (composedImageUrl || selectedGalleryImage) && !aiProcessing && showPromptPanel && ((promptType === 'heroe' && selectedClase) || (promptType === 'personaje' && selectedPersonajeId))
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {aiProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          Procesando con IA...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Procesar con IA y Guardar Automáticamente
                        </>
                      )}
                    </button>
                    
                    {!showPromptPanel && (composedImageUrl || selectedGalleryImage) && (
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
                </div>
              </div>

              {/* Panel de Prompt (lateral, colapsable) */}
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

                  {/* Área de importación de JSON */}
                  <div className="mt-2 pt-2 border-t border-d4-border">
                    <h4 className="text-xs font-semibold text-d4-accent mb-1">
                      📥 Importar JSON
                    </h4>
                    <textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder={`Pega el JSON aquí...${selectedCategory === 'skills' ? '\nEjemplo: {"habilidades_activas": [...], "habilidades_pasivas": [...]}' : selectedCategory === 'glifos' ? '\nEjemplo: {"glifos": [...]}' : selectedCategory === 'aspectos' ? (promptType === 'heroe' ? '\nEjemplo: {"aspectos": [...]}' : '\nEjemplo: {"aspectos_equipados": [...]}') : '\nEjemplo: {"nivel_paragon": 150, ...}'}`}
                      className="w-full h-20 p-2 bg-d4-surface border border-d4-border rounded text-d4-text font-mono text-xs resize-none"
                    />
                    <button
                      onClick={handleImportJSON}
                      disabled={!jsonText.trim() || importing || (promptType === 'personaje' && !selectedPersonajeId) || (promptType === 'heroe' && !selectedClase)}
                      className={`mt-3 w-full px-4 py-2 rounded font-semibold transition-all flex items-center justify-center gap-2 ${
                        jsonText.trim() && !importing && ((promptType === 'heroe' && selectedClase) || (promptType === 'personaje' && selectedPersonajeId))
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {importing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Importando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {promptType === 'heroe' 
                            ? selectedClase 
                              ? `Guardar en Héroe (${selectedClase})`
                              : 'Guardar en Héroe (Selecciona clase)'
                            : selectedPersonajeId 
                              ? `Guardar en ${personajes.find(p => p.id === selectedPersonajeId)?.nombre || 'Personaje'}`
                              : 'Selecciona un personaje primero'}
                        </>
                      )}
                    </button>
                    {promptType === 'personaje' && !selectedPersonajeId && (
                      <p className="text-xs text-yellow-400 mt-2">
                        ⚠️ Selecciona un personaje arriba para poder guardar
                      </p>
                    )}
                    {promptType === 'heroe' && !selectedClase && (
                      <p className="text-xs text-yellow-400 mt-2">
                        ⚠️ Selecciona una clase arriba para poder guardar
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Botones de modo de captura (3 botones horizontales) */}
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded border-2 border-d4-accent/40">
              <p className="text-sm font-semibold text-d4-accent mb-3">
                Modo de captura:
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCaptureMode('new')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    captureMode === 'new'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
                      : 'bg-d4-surface text-d4-text-dim hover:bg-d4-border'
                  }`}
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Nuevo Elemento
                  <div className="text-xs mt-1 opacity-80">→ Horizontal</div>
                </button>
                <button
                  onClick={() => setCaptureMode('continue')}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    captureMode === 'continue'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105'
                      : 'bg-d4-surface text-d4-text-dim hover:bg-d4-border'
                  }`}
                >
                  <ArrowDown className="w-5 h-5 inline mr-2" />
                  Completar
                  <div className="text-xs mt-1 opacity-80">↓ Vertical</div>
                </button>
                <button
                  onClick={copyLastSavedImage}
                  disabled={!lastSavedImageUrl}
                  className={`px-4 py-3 rounded-lg font-bold transition-all ${
                    lastSavedImageUrl
                      ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white shadow-lg'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  title={lastSavedImageUrl ? 'Copiar última imagen guardada' : 'No hay imagen guardada en esta categoría'}
                >
                  <Copy className="w-5 h-5 inline mr-2" />
                  Copiar Guardada
                  <div className="text-xs mt-1 opacity-80">Última img</div>
                </button>
              </div>
              <p className="text-xs text-d4-text-dim mt-3 text-center">
                💡 Presiona <kbd className="px-2 py-0.5 bg-d4-surface rounded">Ctrl + V</kbd> para pegar en el modo seleccionado
              </p>
            </div>

            {/* Botón para cargar archivo (alternativa al paste) */}
            <div className="flex justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-d4-accent hover:bg-d4-accent-hover text-black font-bold rounded-lg transition-all flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Cargar Archivo (alternativa a Ctrl+V)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, captureMode === 'new')}
                className="hidden"
              />
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
                <div className={`grid gap-4 ${showPromptPanel ? 'grid-cols-2' : 'grid-cols-1'}`}>
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

                {/* Botón Procesar con IA (igual que en tab Capturar) */}
                <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-lg border-2 border-purple-500/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-400" />
                      <h4 className="text-sm font-bold text-purple-300">
                        Procesamiento Automático con IA
                      </h4>
                    </div>
                    {aiExtractedJSON && (
                      <button
                        onClick={() => setShowJSONViewer(!showJSONViewer)}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
                        title="Ver JSON obtenido"
                      >
                        <Eye className="w-3 h-3" />
                        Ver JSON
                      </button>
                    )}
                  </div>
                  
                  {/* Barra de progreso */}
                  {aiProcessing && (
                    <div className="mb-3 bg-d4-surface rounded-lg p-3 border border-d4-border">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${aiProgress !== 'idle' ? 'bg-green-500' : 'bg-gray-600'}`} />
                          <span className={`text-xs ${aiProgress !== 'idle' ? 'text-green-300' : 'text-gray-500'}`}>
                            Input entregado
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {aiProgress === 'processing' ? (
                            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${['received', 'saving', 'done'].includes(aiProgress) ? 'bg-green-500' : 'bg-gray-600'}`} />
                          )}
                          <span className={`text-xs ${aiProgress === 'processing' ? 'text-yellow-300 font-semibold' : ['received', 'saving', 'done'].includes(aiProgress) ? 'text-green-300' : 'text-gray-500'}`}>
                            Procesando con IA
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {aiProgress === 'received' ? (
                            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${['saving', 'done'].includes(aiProgress) ? 'bg-green-500' : 'bg-gray-600'}`} />
                          )}
                          <span className={`text-xs ${aiProgress === 'received' ? 'text-yellow-300 font-semibold' : ['saving', 'done'].includes(aiProgress) ? 'text-green-300' : 'text-gray-500'}`}>
                            JSON obtenido
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {aiProgress === 'saving' ? (
                            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${aiProgress === 'done' ? 'bg-green-500' : 'bg-gray-600'}`} />
                          )}
                          <span className={`text-xs ${aiProgress === 'saving' ? 'text-yellow-300 font-semibold' : aiProgress === 'done' ? 'text-green-300' : 'text-gray-500'}`}>
                            Guardando datos
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${aiProgress === 'done' ? 'bg-green-500' : 'bg-gray-600'}`} />
                          <span className={`text-xs ${aiProgress === 'done' ? 'text-green-300 font-semibold' : 'text-gray-500'}`}>
                            ✅ Proceso completado
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                  
                  <button
                    onClick={processWithAI}
                    disabled={aiProcessing || !showPromptPanel || (promptType === 'personaje' && !selectedPersonajeId) || (promptType === 'heroe' && !selectedClase)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all ${
                      !aiProcessing && showPromptPanel && ((promptType === 'heroe' && selectedClase) || (promptType === 'personaje' && selectedPersonajeId))
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {aiProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Procesando con IA...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Procesar con IA y Guardar Automáticamente
                      </>
                    )}
                  </button>
                  
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
              </div>
            )}

            <div className="bg-d4-bg p-4 rounded border border-d4-accent/30">
              <h3 className="text-lg font-semibold text-d4-accent mb-4">
                Galería de {CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </h3>
              
              {galleryImages.length === 0 ? (
                <p className="text-d4-text-dim text-center py-8">
                  No hay imágenes guardadas en esta categoría
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map((img, index) => (
                    <div 
                      key={index} 
                      className={`bg-d4-surface p-2 rounded border relative group transition-all ${
                        selectedGalleryImage === img.url 
                          ? 'border-purple-500 ring-2 ring-purple-500/50' 
                          : 'border-d4-border'
                      }`}
                    >
                      <div className="relative">
                        <img src={img.url} alt={img.nombre} className="w-full h-32 object-contain bg-white rounded" />
                        {/* Indicador de selección */}
                        {selectedGalleryImage === img.url && (
                          <div className="absolute top-2 left-2 bg-purple-600 text-white rounded-full p-1">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                        {/* Botones de acción (aparecen al hover) */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => selectGalleryImage(img.url, img.nombre)}
                            className={`p-2 ${
                              selectedGalleryImage === img.url
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-purple-600 hover:bg-purple-700'
                            } text-white rounded-full shadow-lg`}
                            title={selectedGalleryImage === img.url ? 'Deseleccionar' : 'Seleccionar para procesar con IA'}
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => copyGalleryImage(img.url, img.nombre)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
                            title="Copiar imagen al portapapeles"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
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
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Resultados de Importación */}
      <ImportResultsModal
        isOpen={showImportResults}
        onClose={() => setShowImportResults(false)}
        results={importResults}
      />
    </div>
  );
};

export default ImageCaptureModal;
