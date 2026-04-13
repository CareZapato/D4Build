# 🔄 GUÍA DE MIGRACIÓN - De Código Antiguo a GeminiServiceV3

## 📋 Migración en 5 Minutos

### PASO 1: Actualiza el Import

```diff
- import { GeminiService } from './services/GeminiService';
- import { GeminiService } from './services/GeminiServiceV2';
+ import { GeminiService } from './services/GeminiServiceV3';
```

### PASO 2: Actualiza la Llamada

#### ANTES (código antiguo)
```typescript
const response = await GeminiService.processAndExtractJSON(
  {
    image: imageFile,
    prompt: prompt
  },
  {
    apiKey: API_KEY,
    model: 'gemini-1.5-pro', // ❌ Modelo obsoleto
    useJsonMode: true
  }
);
```

#### AHORA (código nuevo)
```typescript
const response = await GeminiService.processImageWithFallback(
  {
    image: imageFile,
    prompt: prompt
  },
  {
    apiKey: API_KEY
    // model: opcional - usa gemini-3-flash-preview por defecto
    // useJsonMode: removido - siempre usa application/json
  }
);
```

### PASO 3: Actualiza el Manejo de Respuesta

#### ANTES
```typescript
if (response.success) {
  const data = JSON.parse(response.json); // ❌ Necesitaba parsear
  console.log('Modelo:', response.modelUsed);
}
```

#### AHORA
```typescript
if (response.success) {
  const data = response.data; // ✅ Ya parseado
  console.log('Modelo:', response.modelUsed);
}
```

### PASO 4: Actualiza el Manejo de Errores

#### ANTES
```typescript
if (response.errorType === 'MODEL') {
  // ...
}
```

#### AHORA
```typescript
if (response.errorType === 'MODEL_UNAVAILABLE') {
  // Nombre más específico
}
```

---

## 🔧 CAMBIOS ESPECÍFICOS POR COMPONENTE

### ImageCaptureModal.tsx (o similar)

```diff
  import React, { useState } from 'react';
- import { GeminiService } from '../services/GeminiService';
+ import { GeminiService, PROMPT_DIABLO4_STATS } from '../services/GeminiServiceV3';

  async function handleAnalyze() {
-   const response = await GeminiService.processAndExtractJSON(
+   const response = await GeminiService.processImageWithFallback(
      {
        image: selectedFile,
-       prompt: `Analiza esta imagen...`
+       prompt: PROMPT_DIABLO4_STATS // Usa prompts optimizados
      },
      {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
-       model: 'gemini-1.5-flash', // ❌ Eliminar
-       useJsonMode: true           // ❌ Eliminar
      }
    );

    if (response.success) {
-     const data = JSON.parse(response.json);
+     const data = response.data;
      // Usar data...
    }
  }
```

---

## 📊 TABLA DE CAMBIOS

| Concepto | Antes | Ahora |
|----------|-------|-------|
| **SDK** | `@google/generative-ai` | `@google/genai` |
| **Método principal** | `processAndExtractJSON` | `processImageWithFallback` |
| **Modelo default** | `gemini-1.5-pro` | `gemini-3-flash-preview` |
| **Config.useJsonMode** | `true` (opcional) | Removido (siempre activo) |
| **Config.model** | Requerido | Opcional (auto-selección) |
| **Response.json** | `string` (necesita parse) | Removido |
| **Response.data** | No existía | `any` (ya parseado) ✅ |
| **ErrorType.MODEL** | `'MODEL'` | `'MODEL_UNAVAILABLE'` |
| **Fallback** | Manual (lista hardcodeada) | Automático ✅ |

---

## ⚠️ BREAKING CHANGES

### 1. Respuesta Ya Parseada

```typescript
// ❌ ANTES
const data = JSON.parse(response.json);

// ✅ AHORA
const data = response.data;
```

### 2. useJsonMode Removido

```typescript
// ❌ ANTES
config: {
  apiKey: '...',
  useJsonMode: true // Ya no existe
}

// ✅ AHORA
config: {
  apiKey: '...'
  // responseMimeType: 'application/json' se aplica automáticamente
}
```

### 3. Nombres de ErrorType Más Específicos

```typescript
// ❌ ANTES
'API_KEY' | 'QUOTA' | 'MODEL' | 'JSON' | 'EMPTY' | 'NETWORK' | 'UNKNOWN'

// ✅ AHORA
'INVALID_API_KEY' | 'QUOTA_EXCEEDED' | 'MODEL_UNAVAILABLE' | 'INVALID_JSON' | 'EMPTY_MODEL_RESPONSE' | 'NETWORK_ERROR' | 'UNKNOWN'
```

### 4. fileToBase64 Ahora es Exportada

```typescript
// ✅ AHORA PUEDES USARLA INDEPENDIENTEMENTE
import { fileToBase64 } from './services/GeminiServiceV3';

const imagePart = await fileToBase64(file);
```

---

## 🧪 VERIFICACIÓN PASO A PASO

### 1. Verifica que el Servicio Compila

```bash
npm run build
```

Debe ver: `✓ built in X.XXs`

### 2. Prueba con una Imagen Simple

```typescript
const response = await GeminiService.processImageWithFallback(
  {
    image: testFile,
    prompt: 'Describe esta imagen brevemente en JSON: { "descripcion": "..." }'
  },
  {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  }
);

console.log('Success:', response.success);
console.log('Model:', response.modelUsed);
console.log('Data:', response.data);
```

### 3. Verifica los Logs

Debes ver en consola:
```
🚀 [GeminiService] Iniciando procesamiento...
📋 Modelo: gemini-3-flash-preview
...
✅ JSON parseado correctamente
```

---

## 🔍 CÓMO ENCONTRAR CÓDIGO A MIGRAR

### Buscar en tu proyecto:

```bash
# Buscar imports del servicio antiguo
grep -r "from.*GeminiService" src/

# Buscar uso de modelos antiguos
grep -r "gemini-1.5" src/
grep -r "gemini-pro-vision" src/

# Buscar processAndExtractJSON
grep -r "processAndExtractJSON" src/

# Buscar useJsonMode
grep -r "useJsonMode" src/
```

---

## 📝 CHECKLIST DE MIGRACIÓN

Por cada componente que usa Gemini:

- [ ] Actualizar import a `GeminiServiceV3`
- [ ] Cambiar `processAndExtractJSON` → `processImageWithFallback`
- [ ] Eliminar `model: 'gemini-1.5-*'` del config
- [ ] Eliminar `useJsonMode: true` del config
- [ ] Cambiar `JSON.parse(response.json)` → `response.data`
- [ ] Actualizar nombres de errorType si los usas
- [ ] Probar que funcione
- [ ] Verificar logs en consola

---

## 🚨 SI ALGO FALLA

### Error: "Cannot find module GeminiServiceV3"

```typescript
// Verifica la ruta relativa
import { GeminiService } from './services/GeminiServiceV3'; // ✅
import { GeminiService } from '../services/GeminiServiceV3'; // ✅ Depende de dónde estés
```

### Error: "response.json is undefined"

```typescript
// ❌ CÓDIGO ANTIGUO
const data = JSON.parse(response.json);

// ✅ CÓDIGO NUEVO
const data = response.data;
```

### Error: "MODEL_UNAVAILABLE"

```typescript
// Asegúrate de usar processImageWithFallback (con "WithFallback")
await GeminiService.processImageWithFallback(...); // ✅ Correcto
```

### Error: "API Key inválida"

```bash
# Verifica .env.local
cat .env.local

# Debe mostrar:
VITE_GEMINI_API_KEY=tu_clave_aqui

# Reinicia el servidor
npm run dev
```

---

## 🎯 RESULTADO ESPERADO

Después de migrar:

✅ Sin errores 404  
✅ Modelos actuales (gemini-3-*, gemini-2.5-*)  
✅ JSON parseado automáticamente  
✅ Fallback automático si un modelo falla  
✅ Logs claros en consola  

---

**Tiempo estimado de migración**: 5-15 minutos  
**Complejidad**: Baja (cambios simples)  
**Beneficio**: Sin más errores 404 ✅
