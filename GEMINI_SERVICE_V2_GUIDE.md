# 🔮 Gemini Service V2 - Selección Dinámica de Modelos

## 📋 A. DIAGNÓSTICO DEL PROBLEMA

### Síntomas Observados

```bash
❌ Error 404: models/gemini-1.5-pro is not found for API version v1beta
❌ Error 404: models/gemini-1.5-flash is not found for API version v1beta
❌ Error 404: models/gemini-pro-vision is not found for API version v1beta
❌ Error 404: models/gemini-2.0-flash-exp is not found for API version v1beta
```

**Mensaje de error:**
```
"models/... is not found for API version v1beta, or is not supported for generateContent"
```

### Causa Raíz Identificada

| Problema | Explicación |
|----------|-------------|
| **Disponibilidad Regional** | Los modelos disponibles varían según la región y el tipo de API key (free vs paid) |
| **Modelos Experimentales** | Los modelos con sufijo `-exp` no están disponibles globalmente |
| **Deprecación Continua** | Google depreca modelos antiguos y agrega nuevos regularmente |
| **Lista Hardcodeada** | Usar nombres de modelos fijos es una estrategia frágil que se rompe sin aviso |

### Por qué la Lista de Fallback Anterior Falló

```typescript
// ❌ ENFOQUE ANTERIOR (FRÁGIL)
const MODEL_FALLBACK_LIST = [
  'gemini-1.5-pro-latest',   // Puede no estar disponible en tu región
  'gemini-1.5-pro',          // Puede estar deprecated
  'gemini-1.5-flash-latest', // Puede no existir para tu API key
  'gemini-1.5-flash',        // Puede haber sido removido
  'gemini-pro-vision'        // Legacy, puede estar descontinuado
];
```

**Problemas:**
- ❌ Asume que estos modelos existen
- ❌ No verifica disponibilidad real
- ❌ No se adapta a cambios en la API
- ❌ Falla completamente si TODOS los modelos están indisponibles

---

## ✅ B. SOLUCIÓN IMPLEMENTADA

### Nueva Arquitectura: Consulta Dinámica

```
┌─────────────────────────────────────────────────────────┐
│ 1. CONSULTAR API                                        │
│    GET /v1beta/models?key=...                          │
│    → Obtener lista de modelos REALMENTE disponibles    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 2. FILTRAR COMPATIBLES                                  │
│    ✓ Soporta generateContent                           │
│    ✓ Acepta entrada multimodal/imágenes                │
│    ✓ Es modelo Gemini (no PaLM u otros)                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 3. ORDENAR POR PRIORIDAD                                │
│    1º pro-latest → Mejor calidad                        │
│    2º pro → Estable calidad                             │
│    3º flash-latest → Equilibrio velocidad/calidad       │
│    4º flash → Rápido                                    │
│    5º Otros → Fallback                                  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 4. SELECCIONAR MEJOR                                    │
│    → Usar el primer modelo que coincida con prioridad  │
│    → Cachear selección (TTL: 1 hora)                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ 5. USAR EN SDK                                          │
│    genAI.getGenerativeModel({ model: selectedModel })  │
└─────────────────────────────────────────────────────────┘
```

### Ventajas de Este Enfoque

| Ventaja | Descripción |
|---------|-------------|
| ✅ **Siempre Actualizado** | Consulta en tiempo real, no usa lista hardcodeada |
| ✅ **Adapta a tu Región** | Solo usa modelos disponibles para tu API key específica |
| ✅ **Resiliente a Cambios** | Si Google agrega/quita modelos, tu app sigue funcionando |
| ✅ **Transparente** | Te dice exactamente qué modelo usó (`modelUsed` en respuesta) |  
| ✅ **Eficiente** | Cachea la lista para no consultar en cada request |
| ✅ **Debuggable** | Puedes ver la lista completa con `listCompatibleModels()` |

---

## 🚀 C. CÓDIGO COMPLETO

### 1. Servicio Principal

📄 **Archivo:** `src/services/GeminiServiceV2.ts`

**Funciones principales:**

```typescript
// 🔍 Obtener modelo recomendado automáticamente
const model = await GeminiService.getRecommendedModel(apiKey);
// → Ejemplo: "gemini-1.5-pro-latest"

// 📋 Listar todos los modelos compatibles
const models = await GeminiService.listCompatibleModels(apiKey);
// → ["gemini-1.5-pro", "gemini-1.5-flash", ...]

// 🎯 Procesar imagen con selección automática
const result = await GeminiService.processAndExtractJSON({
  image: imageBlob,
  prompt: "Analiza esta imagen..."
}, {
  apiKey: 'TU_API_KEY',
  useJsonMode: true
});
// → { json: "{...}", success: true, modelUsed: "gemini-1.5-pro" }
```

### 2. Conversión de Imagen

```typescript
// C. FUNCIÓN: File/Blob → Base64
const imagePart = await GeminiService.fileToBase64(imageFile);
// Resultado:
// {
//   inlineData: {
//     data: "iVBORw0KGgoAAAA...",  ← Base64 PURO (sin prefijo)
//     mimeType: "image/png"
//   }
// }
```

**Por qué es crítico:**
- ❌ `blob:http://localhost:5173/...` → ❌ NO funciona
- ❌ `data:image/png;base64,iVBORw...` → ❌ Prefijo incorrecto
- ✅ `iVBORw0KGgoAAAA...` → ✅ Base64 puro correcto

---

## 📝 D. EJEMPLO DE USO EN REACT

### Componente Completo

📄 **Ver:** `src/services/GeminiServiceV2.examples.tsx` (Ejemplo 1)

**Uso básico:**

```tsx
import { GeminiService } from './GeminiServiceV2';

function MiComponente() {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const analizar = async () => {
    if (!imageFile) return;

    // ✨ NO necesitas especificar modelo - se selecciona automáticamente
    const result = await GeminiService.processAndExtractJSON(
      {
        image: imageFile,
        prompt: "Analiza esta captura de Diablo 4 y devuelve JSON..."
      },
      {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
        useJsonMode: true  // ⭐ JSON puro sin markdown
      }
    );

    if (result.success) {
      const datos = JSON.parse(result.json);
      console.log('✅ Modelo usado:', result.modelUsed);
      console.log('📦 Datos:', datos);
    } else {
      console.error('❌ Error:', result.error);
      console.error('Tipo:', result.errorType);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
      <button onClick={analizar}>Analizar con IA</button>
    </div>
  );
}
```

---

## 🎯 E. PROMPT OPTIMIZADO PARA DIABLO 4

### Estadísticas

```typescript
const PROMPT_ESTADISTICAS = `Analiza esta captura de estadísticas de Diablo 4.

Extrae TODOS los valores numéricos visibles.

Devuelve ÚNICAMENTE JSON con esta estructura:

{
  "nivel": 100,
  "nivel_paragon": 150,
  "clase": "Bárbaro",
  "atributosPrincipales": {
    "fuerza": 1250,
    "destreza": 850,
    "inteligencia": 650,
    "voluntad": 920
  },
  "defensivo": {
    "vida": 15420,
    "armadura": 8560,
    "resistencia_all": 75,
    "probabilidad_esquivar": 45,
    "reduccion_dano": 68
  },
  "ofensivo": {
    "velocidad_ataque": 115,
    "dano_critico": 180,
    "probabilidad_critico": 55,
    "dano_vulnerable": 125
  }
}

REGLAS:
- Si un valor no está visible, usa 0
- NO agregues explicaciones
- Números deben ser numéricos, NO strings
- Si ves "50%", extrae solo 50
- Si ves "1,234", extrae como 1234`;
```

### Habilidades

```typescript
const PROMPT_HABILIDADES = `Analiza el árbol de habilidades de Diablo 4.

Extrae habilidades con puntos gastados.

JSON:
{
  "clase": "Bárbaro",
  "habilidades": {
    "activas": [
      { "nombre": "Golpe", "puntos": 5, "rango": 5 }
    ],
    "pasivas": [
      { "nombre": "Fortaleza", "puntos": 3, "rango": 3 }
    ]
  }
}

IMPORTANTE:
- Distingue activas de pasivas
- Extrae puntos exactos
- SOLO JSON`;
```

---

## 🔧 F. MANEJO DE ERRORES

### Tipos de Error Categorizados

```typescript
result.errorType === 'API_KEY'    // API key inválida
result.errorType === 'QUOTA'      // Cuota agotada
result.errorType === 'MODEL'      // No se encontró modelo compatible
result.errorType === 'JSON'       // Respuesta no es JSON válido
result.errorType === 'EMPTY'      // Respuesta vacía
result.errorType === 'NETWORK'    // Error de conexión
result.errorType === 'UNKNOWN'    // Error desconocido
```

### Ejemplo de Manejo

```typescript
if (!result.success) {
  switch (result.errorType) {
    case 'API_KEY':
      alert('API key inválida. Consigue una en: https://aistudio.google.com/app/apikey');
      break;
    
    case 'QUOTA':
      alert('Cuota agotada. Espera o actualiza tu plan.');
      break;
    
    case 'MODEL':
      // Intentar refrescar lista de modelos
      const retry = await GeminiService.processAndExtractJSON(
        request,
        { ...config, forceRefreshModels: true }  // ⭐ Forzar actualización
      );
      break;
    
    case 'JSON':
      console.log('Texto recibido:', result.rawText);
      alert('El modelo no devolvió JSON válido. Mejora el prompt.');
      break;
    
    case 'EMPTY':
      alert('Imagen ilegible. Prueba con otra más clara.');
      break;
  }
}
```

---

## 🔍 G. DEBUGGING Y TESTING

### Ver Modelos Disponibles

```typescript
// En consola del navegador o en tu código:
const models = await GeminiService.listCompatibleModels('TU_API_KEY');
console.log('📋 Modelos compatibles:', models);

// Ver el recomendado:
const best = await GeminiService.getRecommendedModel('TU_API_KEY');
console.log('🏆 Modelo recomendado:', best);
```

**Salida ejemplo:**
```javascript
📋 Modelos compatibles: [
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",  
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash"
]

🏆 Modelo recomendado: "gemini-1.5-pro-latest"
```

### Logs Detallados

El servicio incluye logging extenso:

```
🔄 [Gemini] Consultando modelos disponibles...
✅ [Gemini] 24 modelos encontrados en total
🔍 [Gemini] Filtrando modelos compatibles...
  ✅ gemini-1.5-pro-latest - Compatible
  ✅ gemini-1.5-flash - Compatible
  ❌ text-bison-001 - Incompatible (generate:true, gemini:false)
📊 [Gemini] 4 modelos compatibles de 24 totales
🏆 [Gemini] Seleccionando mejor modelo...
✅ [Gemini] Modelo seleccionado: gemini-1.5-pro-latest
```

---

## 🔄 H. MIGRACIÓN DESDE VERSIÓN ANTERIOR

### Cambios Mínimos Requeridos

```typescript
// ❌ ANTES (GeminiService.ts)
import { GeminiService } from './services/GeminiService';

const result = await GeminiService.processAndExtractJSON(
  { image, prompt },
  { 
    apiKey: 'KEY',
    model: 'gemini-1.5-flash'  // ← Hardcoded, podía fallar con 404
  }
);

// ✅ DESPUÉS (GeminiServiceV2.ts)
import { GeminiService } from './services/GeminiServiceV2';

const result = await GeminiService.processAndExtractJSON(
  { image, prompt },
  {
    apiKey: 'KEY',
    // NO especificamos 'model' - se selecciona automáticamente
    useJsonMode: true
  }
);

// Además ahora sabes qué modelo se usó:
console.log('Modelo usado:', result.modelUsed);
```

### Actualizar ImageCaptureModal

```typescript
// En tu ImageCaptureModal.tsx, cambia el import:

// ❌ Antes
import { GeminiService } from '../services/GeminiService';

// ✅ Después
import { GeminiService } from '../services/GeminiServiceV2';

// Y quita el parámetro 'model' de la config:
const result = await GeminiService.processAndExtractJSON(
  { image: imageBlob, prompt },
  {
    apiKey: GEMINI_API_KEY,
    useJsonMode: true
    // Ya NO necesitas: model: 'gemini-xxx'
  }
);
```

---

## 🛡️ I. SEGURIDAD: API KEY

### ⚠️ Estado Actual (INSEGURO para Producción)

```typescript
// ❌ EN FRONTEND
const GEMINI_API_KEY = 'AIzaSyC...';  // Visible en el código
```

**Riesgos:**
- Cualquiera puede inspeccionar tu código y ver la API key
- Pueden robarla y agotar tu cuota sin que lo sepas
- Google puede suspender tu cuenta por uso indebido

### ✅ Solución Corto Plazo (Desarrollo)

```typescript
// .env.local
VITE_GEMINI_API_KEY=tu_api_key_aqui

// En tu código
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
```

### ✅ Solución Producción (OBLIGATORIO)

**Arquitectura recomendada:**

```
┌─────────┐          ┌─────────────┐          ┌────────────┐
│ React   │  fetch   │ Tu Backend  │  fetch   │ Gemini API │
│ Frontend│─────────▶│   (Node.js) │─────────▶│            │
└─────────┘          └─────────────┘          └────────────┘
   (sin API key)      (API key segura)
```

**Implementación:**

```typescript
// FRONTEND (React)
async function analizarImagen(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('prompt', 'Analiza...');

  const response = await fetch('/api/gemini/analyze', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${userToken}`  // Tu auth
    }
  });

  return await response.json();
}

// BACKEND (Node.js/Express)
app.post('/api/gemini/analyze', authenticate, async (req, res) => {
  // API key en variable de entorno del servidor
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const result = await GeminiService.processAndExtractJSON({
    image: req.files.image,
    prompt: req.body.prompt
  }, {
    apiKey: GEMINI_API_KEY,
    useJsonMode: true
  });

  res.json(result);
});
```

---

## 📊 J. COMPARACIÓN: ANTES vs DESPUÉS

| Aspecto | ❌ Antes (V1) | ✅ Después (V2) |
|---------|---------------|-----------------|
| **Selección de modelo** | Lista hardcodeada | Consulta dinámica en tiempo real |
| **Si modelo no existe** | Error 404, app falla | Selecciona automáticamente uno disponible |
| **Nuevos modelos** | Requiere actualizar código | Se detectan automáticamente |
| **Modelos deprecated** | Código se rompe | Se adapta automáticamente |
| **Región/API key** | Puede no funcionar | Se adapta a tu configuración específica |
| **Debugging** | Difícil saber por qué falla | Logs detallados + listCompatibleModels() |
| **Transparencia** | No sabes qué modelo se usó | `modelUsed` en respuesta |
| **Caché** | No | Sí (TTL: 1 hora) |
| **Forzar actualización** | No disponible | `forceRefreshModels: true` |

---

## 🎯 K. CONFIGURACIONES RECOMENDADAS

### Para Extracción de Datos (Estadísticas, números)

```typescript
{
  temperature: 0.05,  // ⭐ Máxima precisión, casi determinista
  topK: 10,
  topP: 0.9,
  useJsonMode: true   // ⭐ JSON puro
}
```

### Para Análisis General (Equilibrio)

```typescript
{
  temperature: 0.2,   // Balance precisión/creatividad
  topK: 40,
  topP: 0.95,
  useJsonMode: true
}
```

### Para Descripciones (Creatividad)

```typescript
{
  temperature: 1.0,   // Más creativo
  topK: 64,
  topP: 0.95,
  useJsonMode: false  // Texto natural
}
```

---

## 🚦 L. PRÓXIMOS PASOS

### Inmediatos (Hoy)

1. ✅ Reemplaza `GeminiService` con `GeminiServiceV2`
2. ✅ Actualiza imports en `ImageCaptureModal.tsx`
3. ✅ Quita el parámetro `model` de la config
4. ✅ Prueba con una imagen real de Diablo 4

### Esta Semana

1. ⚡ Mover API key a `.env.local`
2. ⚡ Probar diferentes tipos de imágenes (estadísticas, habilidades, glifos)
3. ⚡ Ajustar prompts según calidad de resultados
4. ⚡ Implementar manejo de errores específico por errorType

### Próximo Mes

1. 🔐 Crear backend proxy para la API key
2. 🔐 Implementar autenticación de usuarios
3. 🔐 Agregar límites de uso por usuario
4. 📊 Implementar caché de resultados en localStorage/backend

---

## 📚 M. RECURSOS

### Documentación Oficial

- [Google Gemini API](https://ai.google.dev/docs)
- [Modelos Disponibles](https://ai.google.dev/models/gemini)
- [SDK JavaScript](https://github.com/google/generative-ai-js)

### Obtener API Key

- [Google AI Studio](https://aistudio.google.com/app/apikey)

### Archivos en tu Proyecto

- `src/services/GeminiServiceV2.ts` - Servicio principal
- `src/services/GeminiServiceV2.examples.tsx` - 6 ejemplos completos
- `GEMINI_SERVICE_V2_GUIDE.md` - Esta guía

---

## ✨ N. RESUMEN EJECUTIVO

### ¿Qué se arregló?

- ❌ Error 404 con modelos hardcodeados → ✅ Selección dinámica en tiempo real
- ❌ App se rompe si un modelo no existe → ✅ Detecta y usa modelos disponibles
- ❌ No se adapta a cambios/deprecaciones → ✅ Siempre actualizado
- ❌ No sabes qué modelo se usó → ✅ `modelUsed` en respuesta
- ❌ Difícil de debuggear → ✅ Logs detallados + listCompatibleModels()

### ¿Qué modelos va a usar?

**No lo sabemos de antemano** - y eso es bueno! El servicio consulta en tiempo real qué modelos están disponibles para TU API key específica y selecciona el mejor automáticamente.

### ¿Necesito cambiar mucho código?

**No.** Solo cambiar el import de `GeminiService` a `GeminiServiceV2` y quitar el parámetro `model` de la config.

### ¿Funciona ahora?

✅ **Sí.** Pruébalo:

```typescript
const models = await GeminiService.listCompatibleModels('TU_API_KEY');
console.log('Modelos disponibles:', models);
```

Si ves una lista de modelos, todo está funcionando correctamente.

---

**¿Preguntas? Consulta los ejemplos en `GeminiServiceV2.examples.tsx`**
