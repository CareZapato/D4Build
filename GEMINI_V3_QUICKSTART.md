# 🚀 Guía de Uso - GeminiServiceV3

## ✅ SOLUCIÓN FINAL - Sin Errores 404

Esta es la implementación **FUNCIONAL** para procesar imágenes con Gemini API y obtener JSON estructurado.

---

## 📋 A. DIAGNÓSTICO

### ❌ Problema Original
```
Error 404: models/gemini-1.5-pro is not found
Error 404: models/gemini-1.5-flash is not found
Error 404: models/gemini-pro-vision is not found
```

### 🔍 Causa Raíz
- ❌ Modelos obsoletos/deprecados
- ❌ SDK antiguo (`@google/generative-ai`)
- ❌ Nombres hardcodeados que ya no existen

### ✅ Solución Implementada
- ✅ SDK moderno: `@google/genai`
- ✅ Modelos actuales (2026):
  - `gemini-3-flash-preview` (principal)
  - `gemini-2.5-flash` (fallback 1)
  - `gemini-2.5-pro` (fallback 2)
- ✅ Fallback automático
- ✅ JSON limpio sin markdown

---

## 🛠️ B. INSTALACIÓN

### 1. Instala el SDK correcto
```bash
npm install @google/genai
```

### 2. Configura tu API Key

Crea `.env.local` en la raíz del proyecto:
```env
VITE_GEMINI_API_KEY=tu_clave_aqui
```

**⚠️ IMPORTANTE:** Agrega `.env.local` a tu `.gitignore`

### 3. Obtén tu API Key
1. Ve a: https://aistudio.google.com/apikeys
2. Crea una nueva API key
3. Cópiala al archivo `.env.local`

---

## 📖 C. USO BÁSICO

### Importa el servicio
```typescript
import { GeminiService } from './services/GeminiServiceV3';
```

### Procesa una imagen
```typescript
const response = await GeminiService.processImageWithFallback(
  {
    image: imageFile, // File o Blob
    prompt: 'Analiza esta imagen y extrae los datos en JSON'
  },
  {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  }
);

if (response.success) {
  console.log('✅ Datos:', response.data);
  console.log('Modelo usado:', response.modelUsed);
} else {
  console.error('❌ Error:', response.error);
}
```

---

## 📊 D. EJEMPLO PARA DIABLO 4

### Importa el prompt
```typescript
import { 
  GeminiService, 
  PROMPT_DIABLO4_STATS 
} from './services/GeminiServiceV3';
```

### Analiza estadísticas
```typescript
async function analizarEstadisticas(imageFile: File) {
  const response = await GeminiService.processImageWithFallback(
    {
      image: imageFile,
      prompt: PROMPT_DIABLO4_STATS // Prompt optimizado incluido
    },
    {
      apiKey: import.meta.env.VITE_GEMINI_API_KEY,
      temperature: 0.1 // Baja temperatura = más preciso
    }
  );

  if (response.success) {
    // response.data contiene el JSON parseado
    const stats = response.data;
    console.log('Nivel:', stats.nivel);
    console.log('Clase:', stats.clase);
    console.log('Vida:', stats.defensivo.vida);
    // ... etc
  }
}
```

### Componente React completo

Copia `DiabloImageAnalyzer` desde `GeminiServiceV3.examples.tsx`:

```typescript
import { DiabloImageAnalyzer } from './services/GeminiServiceV3.examples';

function App() {
  return <DiabloImageAnalyzer />;
}
```

---

## 🎯 E. PROMPTS INCLUIDOS

### 1. Estadísticas (`PROMPT_DIABLO4_STATS`)
Extrae:
- Nivel y nivel Paragon
- Clase
- Atributos principales
- Estadísticas defensivas completas
- Estadísticas ofensivas completas
- Utilidad

### 2. Habilidades (`PROMPT_DIABLO4_SKILLS`)
Extrae:
- Habilidades activas con puntos
- Habilidades pasivas con puntos
- Ramas del árbol

### 3. Aspectos (`PROMPT_DIABLO4_ASPECTS`)
Extrae:
- Nombre y efecto
- Ranura equipada
- Categoría

---

## 🔧 F. CONFIGURACIÓN AVANZADA

### Usar modelo específico
```typescript
const response = await GeminiService.processImage(
  { image, prompt },
  {
    apiKey: API_KEY,
    model: 'gemini-2.5-pro', // Especificar modelo
    temperature: 0.5,
    maxOutputTokens: 4096
  }
);
```

### Sin fallback (modelo único)
```typescript
// processImage = sin fallback
// processImageWithFallback = con fallback automático
```

---

## ⚠️ G. MANEJO DE ERRORES

El servicio categoriza errores automáticamente:

```typescript
const response = await GeminiService.processImage(...);

switch (response.errorType) {
  case 'MODEL_UNAVAILABLE':
    // El modelo no está disponible
    // Solución: Usa processImageWithFallback()
    break;
    
  case 'INVALID_API_KEY':
    // API Key inválida
    // Solución: Verifica en Google AI Studio
    break;
    
  case 'QUOTA_EXCEEDED':
    // Cuota excedida
    // Solución: Espera o actualiza plan
    break;
    
  case 'EMPTY_MODEL_RESPONSE':
    // Respuesta vacía
    // Solución: Imagen ilegible o prompt poco claro
    break;
    
  case 'INVALID_JSON':
    // JSON inválido
    // Solución: Revisa response.rawText
    break;
    
  case 'NETWORK_ERROR':
    // Error de red
    // Solución: Verifica conexión
    break;
}
```

---

## 🧪 H. TESTING RÁPIDO

### Consola del navegador (F12)
```javascript
// 1. Selecciona una imagen
const input = document.querySelector('input[type="file"]');
const file = input.files[0];

// 2. Importa el servicio
const { GeminiService, PROMPT_DIABLO4_STATS } = await import(
  './src/services/GeminiServiceV3.ts'
);

// 3. Prueba
const response = await GeminiService.processImageWithFallback(
  { image: file, prompt: PROMPT_DIABLO4_STATS },
  { apiKey: 'TU_API_KEY' }
);

console.log(response);
```

---

## 📝 I. LOGS Y DEBUGGING

El servicio imprime logs detallados:

```
🚀 [GeminiService] Iniciando procesamiento...
📋 Modelo: gemini-3-flash-preview
🌡️  Temperatura: 0.1
📄 Prompt: Analiza esta captura...

🖼️  [PASO 1/4] Convirtiendo imagen a base64...
✅ [fileToBase64] Conversión exitosa
   MIME: image/png
   Size: 245.67 KB

🔧 [PASO 2/4] Inicializando GoogleGenAI...

📤 [PASO 3/4] Enviando request a Gemini...

📥 [PASO 4/4] Respuesta recibida
   Tamaño: 1542 caracteres

✅ JSON parseado correctamente

📦 RESULTADO:
{
  "nivel": 100,
  "clase": "Bárbaro",
  ...
}
```

---

## 🚨 J. TROUBLESHOOTING

### Error: "Module not found: @google/genai"
```bash
npm install @google/genai
```

### Error: "API Key inválida"
1. Verifica que la key esté en `.env.local`
2. Verifica que el archivo use `VITE_` como prefijo
3. Reinicia el servidor de desarrollo (`npm run dev`)
4. Genera una nueva key si es necesario

### Error: "Modelo no disponible"
- Usa `processImageWithFallback()` en lugar de `processImage()`
- El fallback probará automáticamente con modelos alternativos

### Error: "JSON inválido"
- Revisa `response.rawText` en los logs
- El modelo puede no estar interpretando bien la imagen
- Intenta con mejor calidad de imagen o prompt más claro

### Respuesta vacía del modelo
- La imagen puede ser ilegible (muy borrosa, muy pequeña)
- El prompt puede ser ambiguo
- Prueba con `temperature: 0.2` (un poco más creativo)

---

## 📚 K. REFERENCIAS

- **Servicio principal**: `GeminiServiceV3.ts`
- **Ejemplos**: `GeminiServiceV3.examples.tsx`
- **Función auxiliar**: `fileToBase64()` (exportada)
- **Prompts**: `PROMPT_DIABLO4_STATS`, `PROMPT_DIABLO4_SKILLS`, `PROMPT_DIABLO4_ASPECTS`

---

## ✅ CHECKLIST FINAL

- [ ] SDK instalado: `npm install @google/genai`
- [ ] API key configurada en `.env.local`
- [ ] Archivo `.env.local` en `.gitignore`
- [ ] Import correcto: `from './services/GeminiServiceV3'`
- [ ] Usando `processImageWithFallback()` (recomendado)
- [ ] Logs activados en consola para debugging

---

## 🎉 RESULTADO ESPERADO

```typescript
{
  success: true,
  data: {
    nivel: 100,
    nivel_paragon: 150,
    clase: "Bárbaro",
    atributosPrincipales: { ... },
    defensivo: { ... },
    ofensivo: { ... },
    utilidad: { ... }
  },
  modelUsed: "gemini-3-flash-preview"
}
```

**Sin errores 404. Sin modelos obsoletos. Solo código funcional.**
