# 📋 CHANGELOG - Migración a @google/genai

**Fecha**: 9 de abril de 2026  
**Versión**: v3.0.0  
**Breaking Changes**: ✅ Sí (cambio de SDK completo)

---

## 🎯 Motivación del Cambio

### Problema Original
```
❌ Error 404: models/gemini-1.5-pro is not found for API version v1beta
❌ Error 404: models/gemini-1.5-flash is not found  
❌ Error 404: models/gemini-pro-vision is not found
❌ Error 404: models/gemini-2.0-flash-exp is not found
```

### Causa Raíz
1. ❌ Estábamos usando `@google/generative-ai` (SDK legacy?)
2. ❌ Modelos hardcodeados que ya no existen o no están disponibles
3. ❌ Documentación oficial actual usa otro SDK (`@google/genai`)
4. ❌ Modelo de ejemplo oficial es `gemini-3-flash-preview`, no los 1.5-x

### Solución
✅ Migrar completamente a `@google/genai`  
✅ Usar `ai.models.list()` para descubrimiento dinámico  
✅ Priorizar `gemini-3-flash-preview` como primer candidato  
✅ Selección automática del mejor modelo disponible

---

## 📦 Cambios de Dependencias

### Package.json

```diff
{
  "dependencies": {
-   "@google/generative-ai": "^0.24.1",
+   "@google/genai": "^1.x.x"
  }
}
```

**Instalación:**
```bash
npm install @google/genai
```

---

## 🔧 Cambios de API

### 1. Import Statement

```typescript
// ❌ ANTES (@google/generative-ai)
import { GoogleGenerativeAI } from '@google/generative-ai';

// ✅ AHORA (@google/genai)
import { GoogleGenAI } from '@google/genai';
```

### 2. Inicialización del Cliente

```typescript
// ❌ ANTES
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

// ✅ AHORA
const ai = new GoogleGenAI({ apiKey });
// No se obtiene modelo directamente, se usa en generateContent
```

### 3. Listar Modelos Disponibles

```typescript
// ❌ ANTES (REST API manual)
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
);
const data = await response.json();
const models = data.models;

// ✅ AHORA (SDK nativo)
const ai = new GoogleGenAI({ apiKey });
const modelsPager = await ai.models.list();

// Convertir Pager a array
const modelsArray = [];
for await (const model of modelsPager) {
  modelsArray.push(model);
}
```

**Tipo de retorno:**
- **Antes**: `any[]` (desde fetch manual)
- **Ahora**: `Pager<Model>` (iterador asíncrono)

### 4. Generar Contenido con Imagen

```typescript
// ❌ ANTES
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.1,
    responseMimeType: 'application/json'
  }
});

const result = await model.generateContent([
  prompt,
  {
    inlineData: {
      mimeType: 'image/png',
      data: base64
    }
  }
]);

const text = result.response.text();

// ✅ AHORA
const ai = new GoogleGenAI({ apiKey });

const result = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [
    {
      inlineData: {
        mimeType: 'image/png',
        data: base64
      }
    },
    {
      text: prompt
    }
  ],
  config: {
    temperature: 0.1,
    responseMimeType: 'application/json'
  }
});

const text = result.text; // ⚠️ Directo, sin .response.text()
```

**Diferencias clave:**
- `contents` es un array de objetos estructurados
- La imagen va como objeto `{ inlineData: {...} }`
- El prompt va como objeto `{ text: "..." }`
- Config va en propiedad `config`, no como parámetro del modelo
- Respuesta es `result.text` (no `result.response.text()`)

### 5. Manejo de Response

```typescript
// ❌ ANTES
const result = await model.generateContent([...]);
const response = result.response;
const text = response.text();  // Método

// ✅ AHORA
const result = await ai.models.generateContent({...});
const text = result.text;  // Propiedad directa
```

---

## 📝 Cambios en el Código

### GeminiServiceV2.ts

#### Header y Documentación
```diff
 /**
- * 🚀 GEMINI SERVICE V2 - SELECCIÓN DINÁMICA DE MODELOS
+ * 🚀 GEMINI SERVICE V3 - SDK OFICIAL @google/genai
  * 
+ * 📋 A. CAMBIO CRÍTICO
+ * ---------------------
+ * ✅ SDK CORRECTO: @google/genai (NO @google/generative-ai)
+ * ✅ API CORRECTA: GoogleGenAI con models.list() y models.generateContent()
+ * ✅ MODELO DE EJEMPLO: gemini-3-flash-preview (según docs actuales)
  */
```

#### Prioridades de Modelos
```diff
 private static readonly MODEL_PRIORITY = [
-  /^gemini-.*-pro-latest$/i,
-  /^gemini-.*-pro$/i,
-  /^gemini-.*-flash-latest$/i,
+  /^gemini-3-flash-preview$/i,    // ⭐ Modelo oficial actual
+  /^gemini-.*-flash-preview$/i,
+  /^gemini-.*-pro$/i,
   /^gemini-.*-flash$/i,
-  /^gemini-pro-vision$/i,
   /^gemini/i
 ];
```

#### fetchAvailableModels()
```diff
 private static async fetchAvailableModels(apiKey: string): Promise<ModelInfo[]> {
-  const response = await fetch(
-    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
-  );
-  const data = await response.json();
-  return data.models.map(...);

+  const ai = new GoogleGenAI({ apiKey });
+  const modelsPager = await ai.models.list();
+  
+  const modelsArray: any[] = [];
+  for await (const model of modelsPager) {
+    modelsArray.push(model);
+  }
+  
+  return modelsArray.map(...);
 }
```

#### processImageWithPrompt()
```diff
 static async processImageWithPrompt(...) {
-  const genAI = new GoogleGenerativeAI(config.apiKey);
-  const model = genAI.getGenerativeModel({
-    model: modelName,
-    generationConfig: { ... }
-  });
-  
-  const result = await model.generateContent([prompt, imagePart]);
-  const text = result.response.text();

+  const ai = new GoogleGenAI({ apiKey: config.apiKey });
+  
+  const result = await ai.models.generateContent({
+    model: modelName,
+    contents: [
+      { inlineData: { ... } },
+      { text: prompt }
+    ],
+    config: { ... }
+  });
+  
+  const text = result.text;
 }
```

---

## 🧪 Testing

### Antes
```typescript
// Sin forma fácil de listar modelos disponibles
// Tenías que probar modelo por modelo hasta que funcionara
```

### Ahora
```typescript
// ✅ Listar modelos disponibles
const modelos = await GeminiService.listCompatibleModels(API_KEY);
console.log('Modelos:', modelos);

// ✅ Obtener mejor modelo
const mejor = await GeminiService.getRecommendedModel(API_KEY);
console.log('Recomendado:', mejor);

// ✅ Usar automáticamente
const resultado = await GeminiService.processAndExtractJSON(
  { image, prompt },
  { apiKey: API_KEY } // No especifica modelo, se elige automáticamente
);
console.log('Modelo usado:', resultado.modelUsed);
```

---

## ⚠️ Breaking Changes

### 1. ❌ Cambio de Import
```typescript
// DEJA DE FUNCIONAR
import { GoogleGenerativeAI } from '@google/generative-ai';

// DEBES CAMBIAR A
import { GoogleGenAI } from '@google/genai';
```

### 2. ❌ Modelo Hardcodeado `gemini-1.5-pro`
```typescript
// PROBABLEMENTE YA NO FUNCIONA
model: 'gemini-1.5-pro'
model: 'gemini-1.5-flash'
model: 'gemini-pro-vision'

// USA ESTO EN SU LUGAR
model: 'gemini-3-flash-preview'  // O déjalo vacío para auto-selección
```

### 3. ❌ Estructura de Response
```typescript
// ANTES
const text = result.response.text();  // Método

// AHORA
const text = result.text;  // Propiedad
```

### 4. ❌ Estructura de Contents
```typescript
// ANTES (array plano)
[prompt, imagePart]

// AHORA (array de objetos estructurados)
[
  { inlineData: { ... } },
  { text: prompt }
]
```

---

## 🔄 Guía de Migración

### Si usabas GeminiService.ts (viejo)

```typescript
// ❌ ELIMINA ESTE IMPORT
import { GeminiService } from './services/GeminiService';

// ✅ CAMBIA A
import { GeminiService } from './services/GeminiServiceV2';

// El resto del código sigue igual (mismas interfaces públicas)
```

### Si usabas el SDK directamente

```typescript
// ANTES
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro' 
});

const result = await model.generateContent([prompt]);

// AHORA
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey });

const result = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [{ text: prompt }],
  config: {}
});
```

---

## ✅ Ventajas del Nuevo SDK

### 1. ✅ Descubrimiento Dinámico Native
```typescript
const modelos = await ai.models.list();
// Ya no necesitas REST API manual
```

### 2. ✅ Modelo Oficial Actualizado
```typescript
'gemini-3-flash-preview'  // Según docs 2026
```

### 3. ✅ Mejor Tipado TypeScript
```typescript
// Pager<Model> con tipos completos
for await (const model of modelsPager) { ... }
```

### 4. ✅ API Más Consistente
```typescript
// Todo bajo ai.models.*
ai.models.list()
ai.models.generateContent()
ai.models.get()  // (probablemente disponible también)
```

### 5. ✅ Configuración Más Clara
```typescript
// Config separado del modelo
{
  model: '...',
  contents: [...],
  config: { temperature, topK, ... }
}
```

---

## 📊 Impacto en el Proyecto

### Archivos Modificados
- ✅ `src/services/GeminiServiceV2.ts` (reescrito completamente)
- ✅ `src/components/tags/TagTooltip.tsx` (fix tipos setTimeout)

### Archivos Creados
- ✅ `MIGRATION_TO_GENAI.md` (esta guía)
- ✅ `CHANGELOG_GENAI_MIGRATION.md` (registro de cambios)
- ✅ `TEST_GEMINI_V3.js` (suite de pruebas)

### Archivos NO Afectados
- ✅ `src/services/GeminiService.ts` (mantener para backward compatibility)
- ✅ Componentes que usan GeminiService (solo cambiar import)

---

## 🚀 Próximos Pasos

1. ✅ **Compilación**: `npm run build` (ya validado)
2. 🧪 **Testing**: Ejecuta `TEST_GEMINI_V3.js` en consola del navegador
3. 🔄 **Migración**: Actualiza imports en componentes que usan Gemini
4. 📊 **Monitoreo**: Revisa logs para ver qué modelos se seleccionan
5. 🔒 **Seguridad**: Mueve API key a `.env.local` o backend proxy

---

## 📚 Referencias

- **Docs Google AI**: https://ai.google.dev/gemini-api/docs/
- **Image Understanding**: https://ai.google.dev/gemini-api/docs/image-understanding
- **Migration Guide**: https://ai.google.dev/gemini-api/docs/migrate-to-genai
- **API Reference**: https://ai.google.dev/api

---

## ❓ FAQ

### ¿Puedo seguir usando @google/generative-ai?
No recomendado. La documentación oficial de 2026 usa `@google/genai`.

### ¿Funciona gemini-1.5-pro todavía?
Depende de tu API key y región. Usa `listCompatibleModels()` para verificar.

### ¿Debo especificar el modelo manualmente?
No es necesario. El servicio selecciona automáticamente el mejor disponible.

### ¿Qué pasa si gemini-3-flash-preview no está disponible?
El servicio busca el mejor disponible según las prioridades definidas.

### ¿Necesito actualizar mis componentes?
Solo cambiar el import de `GeminiService` a `GeminiServiceV2`. El resto igual.

---

**Estado Final**: ✅ Migración completada y compilación exitosa
