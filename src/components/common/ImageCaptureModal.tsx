import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Plus, ArrowDown, Save, Image as ImageIcon, Trash2, Copy, Download, HelpCircle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { ImageCategory, ImageService } from '../../services/ImageService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';
import { useAppContext } from '../../context/AppContext';
import { WorkspaceService } from '../../services/WorkspaceService';

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
  const { personajes, availableClasses } = useAppContext();
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  }, [isOpen]);

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
    
    // Determinar qué prompts usar según el tipo (héroe o personaje)
    switch (selectedCategory) {
      case 'skills':
        basePrompt = ImageExtractionPromptService.generateActiveSkillsPrompt() + '\n\n' + 
               ImageExtractionPromptService.generatePassiveSkillsPrompt();
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
    
    // Agregar cantidad de elementos al final del prompt
    const elementCount = getElementCount();
    if (elementCount > 0) {
      const categoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory;
      basePrompt += `\n\n---\n**IMPORTANTE**: Esta imagen contiene aproximadamente ${elementCount} ${categoryLabel.toLowerCase()} ${elementCount === 1 ? '' : 'diferentes'}. Asegúrate de extraer TODOS los elementos visibles en la imagen.`;
    }
    
    return basePrompt;
  };

  // Generar prompt resumido para embeber en la imagen
  const getShortPrompt = (): string => {
    const elementCount = getElementCount();
    
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
        prompt = `${contextLine}EXTRAE ${elementCount} HABILIDADES de Diablo 4 en JSON:\\n- Habilidades activas: id, nombre, tipo, rama, nivel, descripción, modificadores, tags\\n- Habilidades pasivas: id, nombre, tipo, nivel, efecto, tags\\n- Tags estructurados: solo palabras BLANCAS/SUBRAYADAS del juego\\n- Formato: {habilidades_activas:[], habilidades_pasivas:[], palabras_clave:[]}`;
        break;
      case 'glifos':
        prompt = `${contextLine}EXTRAE ${elementCount} GLIFOS de Diablo 4 en JSON:\\n- Por glifo: id, nombre, rareza, nivel, efecto_base, atributo_escalado, bonificacion_adicional, bonificacion_legendaria, tags\\n- Tags: solo palabras BLANCAS/SUBRAYADAS\\n- Formato: {glifos:[], palabras_clave:[]}`;
        break;
      case 'aspectos':
        if (promptType === 'personaje') {
          prompt = `${contextLine}EXTRAE ${elementCount} ASPECTOS EQUIPADOS en JSON:\\n- Por aspecto: aspecto_id, nivel_actual (X/21), slot_equipado, valores_actuales\\n- Valores EXACTOS según el nivel mostrado\\n- Formato: {aspectos_equipados:[]}`;
        } else {
          prompt = `${contextLine}EXTRAE ${elementCount} ASPECTOS de Diablo 4 en JSON:\\n- Por aspecto: id, name, shortName, effect, level, category, keywords, tags\\n- Categories: ofensivo, defensivo, movilidad, recurso, utilidad\\n- Formato: {aspectos:[]}`;
        }
        break;
      case 'estadisticas':
        prompt = `${contextLine}EXTRAE ESTADÍSTICAS COMPLETAS en JSON:\\n- Secciones: personaje, atributosPrincipales, defensivo, ofensivo, utilidad, armaduraYResistencias\\n- Incluir nivel_paragon en raíz y nivel en atributosPrincipales\\n- Tags: palabras BLANCAS/SUBRAYADAS\\n- Formato: {nivel_paragon, atributosPrincipales:{nivel,...}, personaje:{}, ...}`;
        break;
      default:
        prompt = `${contextLine}EXTRAE ${elementCount} elementos en formato JSON estructurado`;
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

  // Importar JSON resultante
  const handleImportJSON = async () => {
    if (!jsonText.trim()) {
      showToast('❌ Ingresa un JSON válido', 'error');
      return;
    }

    setImporting(true);
    try {
      const data = JSON.parse(jsonText);
      
      if (promptType === 'heroe') {
        // Guardar en héroe
        if (!selectedClase) {
          showToast('❌ Selecciona una clase primero', 'error');
          setImporting(false);
          return;
        }

        const clase = selectedClase;
        
        switch (selectedCategory) {
          case 'skills':
            if (data.habilidades_activas || data.habilidades_pasivas) {
              await WorkspaceService.saveHeroSkills(clase, {
                habilidades_activas: data.habilidades_activas || [],
                habilidades_pasivas: data.habilidades_pasivas || []
              });
              showToast(`✅ ${(data.habilidades_activas?.length || 0) + (data.habilidades_pasivas?.length || 0)} habilidades guardadas en ${clase}`, 'success');
            }
            break;
          case 'glifos':
            if (data.glifos) {
              await WorkspaceService.saveHeroGlyphs(clase, { glifos: data.glifos });
              showToast(`✅ ${data.glifos.length} glifos guardados en ${clase}`, 'success');
            }
            break;
          case 'aspectos':
            if (data.aspectos) {
              await WorkspaceService.saveHeroAspects(clase, { aspectos: data.aspectos });
              showToast(`✅ ${data.aspectos.length} aspectos guardados en ${clase}`, 'success');
            }
            break;
          case 'estadisticas':
            await WorkspaceService.saveHeroStats(clase, data);
            showToast(`✅ Estadísticas guardadas en ${clase}`, 'success');
            break;
        }
      } else {
        // Guardar en personaje
        if (!selectedPersonajeId) {
          showToast('❌ Selecciona un personaje primero', 'error');
          setImporting(false);
          return;
        }

        const personaje = personajes.find(p => p.id === selectedPersonajeId);
        if (!personaje) {
          showToast('❌ Personaje no encontrado', 'error');
          setImporting(false);
          return;
        }

        switch (selectedCategory) {
          case 'skills':
            if (data.habilidades_activas || data.habilidades_pasivas) {
              // Convertir a referencias
              const activasRefs = (data.habilidades_activas || []).map((h: any) => h.id);
              const pasivasRefs = (data.habilidades_pasivas || []).map((h: any) => h.id);
              
              personaje.habilidades_refs = {
                activas: [...(personaje.habilidades_refs?.activas || []), ...activasRefs],
                pasivas: [...(personaje.habilidades_refs?.pasivas || []), ...pasivasRefs]
              };
              
              await WorkspaceService.savePersonaje(personaje);
              showToast(`✅ ${activasRefs.length + pasivasRefs.length} habilidades agregadas a ${personaje.nombre}`, 'success');
            }
            break;
          case 'glifos':
            if (data.glifos) {
              const nuevosGlifos = data.glifos.map((g: any) => ({ id: g.id, nivel_actual: g.nivel || 1 }));
              personaje.glifos_refs = [...(personaje.glifos_refs || []), ...nuevosGlifos];
              
              await WorkspaceService.savePersonaje(personaje);
              showToast(`✅ ${nuevosGlifos.length} glifos agregados a ${personaje.nombre}`, 'success');
            }
            break;
          case 'aspectos':
            if (data.aspectos_equipados) {
              const aspectosRefs = data.aspectos_equipados.map((a: any) => a.aspecto_id);
              personaje.aspectos_refs = [...(personaje.aspectos_refs || []), ...aspectosRefs];
              
              await WorkspaceService.savePersonaje(personaje);
              showToast(`✅ ${aspectosRefs.length} aspectos agregados a ${personaje.nombre}`, 'success');
            }
            break;
          case 'estadisticas': {
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
              if (v2.personaje) statsToSave.personaje = v2.personaje;
              if (v2.atributosPrincipales) statsToSave.atributosPrincipales = v2.atributosPrincipales;
              if (v2.defensivo && !Array.isArray(v2.defensivo)) statsToSave.defensivo = v2.defensivo;
              if (v2.ofensivo && !Array.isArray(v2.ofensivo)) statsToSave.ofensivo = v2.ofensivo;
              if (v2.utilidad && !Array.isArray(v2.utilidad)) statsToSave.utilidad = v2.utilidad;
              if (v2.armaduraYResistencias) statsToSave.armaduraYResistencias = v2.armaduraYResistencias;
              if (v2.jcj) statsToSave.jcj = v2.jcj;
              if (v2.moneda) statsToSave.moneda = v2.moneda;
              parsedNivelParagon = data.nivel_paragon;
              parsedNivel = statsToSave.atributosPrincipales?.nivel;
            } else {
              // Formato V1 flat: nivel_paragon no pertenece a Estadisticas
              const { nivel_paragon, ...rest } = data;
              statsToSave = rest;
              parsedNivelParagon = nivel_paragon;
              parsedNivel = rest.atributosPrincipales?.nivel;
            }

            personaje.estadisticas = statsToSave;
            if (parsedNivel !== undefined) personaje.nivel = parsedNivel;
            if (parsedNivelParagon !== undefined) personaje.nivel_paragon = parsedNivelParagon;
            personaje.fecha_actualizacion = new Date().toISOString();
            await WorkspaceService.savePersonaje(personaje);
            showToast(`✅ Estadísticas guardadas en ${personaje.nombre}`, 'success');
            break;
          }
        }
      }
      
      setJsonText('');
    } catch (error) {
      console.error('Error importando JSON:', error);
      showToast('❌ Error al procesar el JSON. Verifica el formato.', 'error');
    } finally {
      setImporting(false);
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
                </div>
              </div>

              {/* Panel de Prompt (lateral, colapsable) */}
              {showPromptPanel && (
                <div className="bg-d4-bg p-4 rounded border border-d4-accent/30 flex flex-col">
                  <h3 className="text-lg font-semibold text-d4-accent mb-4">
                    Prompt para {CATEGORIES.find(c => c.value === selectedCategory)?.label}
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-d4-text mb-2">
                      Tipo de extracción:
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPromptType('heroe')}
                        className={`px-3 py-1.5 rounded text-sm font-semibold ${
                          promptType === 'heroe' ? 'bg-d4-accent text-black' : 'bg-d4-surface text-d4-text'
                        }`}
                      >
                        Héroe
                      </button>
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
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-d4-text mb-2">
                        Clase del héroe:
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
                      <p className="text-xs text-d4-text-dim mt-1">
                        Selecciona la clase del héroe para guardar los datos maestros
                      </p>
                    </div>
                  )}

                  {/* Selector de personaje (solo si tipo = personaje) */}
                  {promptType === 'personaje' && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-d4-text mb-2">
                        Personaje específico:
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
                      <p className="text-xs text-d4-text-dim mt-1">
                        {personajes && personajes.length > 0 
                          ? 'Opcional: Selecciona un personaje para agregar contexto al prompt'
                          : 'Crea un personaje primero desde la sección Personajes'}
                      </p>
                    </div>
                  )}

                  <div className="bg-d4-surface p-4 rounded border border-d4-border max-h-[400px] overflow-y-auto flex-1">
                    <pre className="text-xs text-d4-text whitespace-pre-wrap font-mono">
                      {getPromptForCategory()}
                    </pre>
                  </div>

                  <button
                    onClick={copyPromptToClipboard}
                    className="mt-4 btn-primary flex items-center gap-2 w-full justify-center"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedPrompt ? '✅ Copiado!' : 'Copiar Prompt'}
                  </button>

                  {/* Área de importación de JSON */}
                  <div className="mt-6 pt-6 border-t border-d4-border">
                    <h4 className="text-sm font-semibold text-d4-accent mb-3">
                      📥 Importar JSON Resultante
                    </h4>
                    <p className="text-xs text-d4-text-dim mb-3">
                      Pega el JSON resultado de ChatGPT aquí para agregarlo automáticamente a {promptType === 'heroe' ? 'los datos del héroe' : 'tu personaje'}
                    </p>
                    <textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder={`Pega el JSON aquí...${selectedCategory === 'skills' ? '\nEjemplo: {"habilidades_activas": [...], "habilidades_pasivas": [...]}' : selectedCategory === 'glifos' ? '\nEjemplo: {"glifos": [...]}' : selectedCategory === 'aspectos' ? (promptType === 'heroe' ? '\nEjemplo: {"aspectos": [...]}' : '\nEjemplo: {"aspectos_equipados": [...]}') : '\nEjemplo: {"nivel_paragon": 150, ...}'}`}
                      className="w-full h-32 p-3 bg-d4-surface border border-d4-border rounded text-d4-text font-mono text-xs resize-none"
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
          <div className=" space-y-4">
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
                    <div key={index} className="bg-d4-surface p-2 rounded border border-d4-border relative group">
                      <div className="relative">
                        <img src={img.url} alt={img.nombre} className="w-full h-32 object-contain bg-white rounded" />
                        {/* Botón copiar (aparece al hover) */}
                        <button
                          onClick={() => copyGalleryImage(img.url, img.nombre)}
                          className="absolute top-2 right-2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copiar imagen al portapapeles"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
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
    </div>
  );
};

export default ImageCaptureModal;
