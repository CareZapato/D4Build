import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Plus, ArrowDown, Save, Image as ImageIcon, Trash2, Copy, Download, HelpCircle, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { ImageCategory, ImageService } from '../../services/ImageService';
import { ImageExtractionPromptService } from '../../services/ImageExtractionPromptService';

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
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>('skills');
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [composedImageUrl, setComposedImageUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<Array<{ nombre: string; url: string; fecha: string }>>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<'personaje' | 'heroe'>('personaje');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('new');
  const [lastSavedImageUrl, setLastSavedImageUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [categoryCounts, setCategoryCounts] = useState<Record<ImageCategory, number>>({} as Record<ImageCategory, number>);
  
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
      setComposedImageUrl(null);
      setShowGallery(false);
      setShowPrompt(false);
    }
  }, [isOpen]);

  // Manejar paste desde clipboard
  useEffect(() => {
    if (!isOpen || showGallery || showPrompt) return;

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
  }, [isOpen, showGallery, showPrompt, captureMode]);

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

    // Calcular dimensiones
    const SPACING = 10; // Espacio entre elementos completos
    const VERTICAL_OFFSET = 0; // Sin espacio entre partes incompletas

    let totalWidth = 0;
    let maxHeight = 0;
    let currentGroupWidth = 0;
    let currentGroupHeight = 0;

    loadedImages.forEach(({ img, isComplete }, index) => {
      if (index === 0 || isComplete) {
        // Nuevo elemento completo
        if (index > 0) {
          totalWidth += SPACING; // Agregar espacio antes del nuevo elemento
        }
        totalWidth += currentGroupWidth;
        maxHeight = Math.max(maxHeight, currentGroupHeight);
        
        currentGroupWidth = img.width;
        currentGroupHeight = img.height;
      } else {
        // Continuación del elemento (apilar verticalmente)
        currentGroupWidth = Math.max(currentGroupWidth, img.width);
        currentGroupHeight += img.height + VERTICAL_OFFSET;
      }
    });

    // Agregar último grupo
    totalWidth += currentGroupWidth;
    maxHeight = Math.max(maxHeight, currentGroupHeight);

    // Configurar canvas
    canvas.width = totalWidth;
    canvas.height = maxHeight;

    // Fondo blanco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar imágenes
    let xOffset = 0;
    let yOffset = 0;
    let groupStartX = 0;

    loadedImages.forEach(({ img, isComplete }, index) => {
      if (index === 0 || isComplete) {
        // Nuevo elemento completo
        if (index > 0) {
          xOffset += SPACING;
        }
        groupStartX = xOffset;
        yOffset = 0;
        ctx.drawImage(img, xOffset, yOffset);
        xOffset += img.width;
        yOffset += img.height;
      } else {
        // Continuación del elemento (apilar verticalmente)
        yOffset += VERTICAL_OFFSET;
        ctx.drawImage(img, groupStartX, yOffset);
        yOffset += img.height;
      }
    });

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
  }, [capturedImages]);

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
      case 'skills': return 4;
      case 'glifos': return 6;
      case 'aspectos': return 5;
      case 'estadisticas': return 1;
      case 'otros': return 5;
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
    switch (selectedCategory) {
      case 'skills':
        basePrompt = ImageExtractionPromptService.generateActiveSkillsPrompt() + '\n\n' + 
               ImageExtractionPromptService.generatePassiveSkillsPrompt();
        break;
      case 'glifos':
        basePrompt = ImageExtractionPromptService.generateGlyphsPrompt();
        break;
      case 'aspectos':
        basePrompt = ImageExtractionPromptService.generateAspectsPrompt();
        break;
      case 'estadisticas':
        basePrompt = ImageExtractionPromptService.generateStatsPrompt();
        break;
      default:
        basePrompt = 'Analiza esta imagen y extrae la información relevante en formato JSON.';
    }
    
    // Agregar cantidad de elementos al final del prompt
    const elementCount = getElementCount();
    if (elementCount > 0) {
      const categoryLabel = CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory;
      basePrompt += `\n\n---\n**IMPORTANTE**: Esta imagen contiene aproximadamente ${elementCount} ${categoryLabel.toLowerCase()} ${elementCount === 1 ? '' : 'diferentes'}. Asegúrate de extraer TODOS los elementos visibles en la imagen.`;
    }
    
    return basePrompt;
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
              onClick={() => { setShowGallery(false); setShowPrompt(false); }}
              className={`px-4 py-2 rounded font-semibold ${
                !showGallery && !showPrompt ? 'bg-d4-accent text-black' : 'bg-d4-bg text-d4-text'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Capturar
            </button>
            <button
              onClick={() => { setShowPrompt(true); setShowGallery(false); }}
              className={`px-4 py-2 rounded font-semibold ${
                showPrompt ? 'bg-d4-accent text-black' : 'bg-d4-bg text-d4-text'
              }`}
            >
              <Copy className="w-4 h-4 inline mr-2" />
              Prompt IA
            </button>
            <button
              onClick={() => { setShowGallery(true); setShowPrompt(false); loadGallery(); }}
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
          {!showGallery && !showPrompt && (
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
        {!showGallery && !showPrompt && (
          <div className="space-y-6">
            {/* Preview de imagen compuesta (PRIORIDAD #1 - SIEMPRE VISIBLE) */}
            <div className="bg-d4-bg p-4 rounded border-2 border-d4-accent/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-d4-accent flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Preview en Tiempo Real
                </h3>
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
              
              {composedImageUrl ? (
                <div className="bg-white p-4 rounded max-h-96 overflow-auto border-2 border-green-500/50">
                  <img src={composedImageUrl} alt="Composed" className="max-w-full h-auto" />
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

              {/* Botones de acción (SIEMPRE VISIBLES) */}
              <div className="flex gap-3 mt-4">
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
              </div>
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

        {/* Tab Prompt IA */}
        {showPrompt && (
          <div className="space-y-4">
            <div className="bg-d4-bg p-4 rounded border border-d4-accent/30">
              <h3 className="text-lg font-semibold text-d4-accent mb-4">
                Prompt para {CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-d4-text mb-2">
                  Tipo de extracción:
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPromptType('personaje')}
                    className={`px-4 py-2 rounded font-semibold ${
                      promptType === 'personaje' ? 'bg-d4-accent text-black' : 'bg-d4-surface text-d4-text'
                    }`}
                  >
                    Para Personaje
                  </button>
                  <button
                    onClick={() => setPromptType('heroe')}
                    className={`px-4 py-2 rounded font-semibold ${
                      promptType === 'heroe' ? 'bg-d4-accent text-black' : 'bg-d4-surface text-d4-text'
                    }`}
                  >
                    Para Héroe (Clase)
                  </button>
                </div>
              </div>

              <div className="bg-d4-surface p-4 rounded border border-d4-border max-h-96 overflow-y-auto">
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
            </div>
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
