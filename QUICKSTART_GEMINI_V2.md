# 🚀 INICIO RÁPIDO - Gemini Service V2

## ✅ Compilación Exitosa

```bash
✓ tsc && vite build
✓ 1452 modules transformed
✓ built in 3.71s
```

---

## 📋 ¿Qué Cambió?

### Problema que Tenías

```
❌ Error 404: models/gemini-1.5-pro is not found
❌ Error 404: models/gemini-1.5-flash is not found
❌ Error 404: models/gemini-pro-vision is not found
❌ Error 404: models/gemini-2.0-flash-exp is not found
```

### Solución Implementada

✅ **GeminiServiceV2** - Consulta dinámicamente qué modelos están **REALMENTE disponibles** para tu API key y selecciona automáticamente el mejor.

---

## ⚡ Uso en 3 Pasos

### 1. Importa el Nuevo Servicio

```typescript
// ❌ Antes
import { GeminiService } from './services/GeminiService';

// ✅ Ahora
import { GeminiService } from './services/GeminiServiceV2';
```

### 2. Usa Sin Especificar Modelo

```typescript
const result = await GeminiService.processAndExtractJSON(
  {
    image: imageBlob,
    prompt: "Analiza esta imagen de Diablo 4 y devuelve JSON..."
  },
  {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    useJsonMode: true
    // ⚠️ NO especifiques 'model' - se selecciona automáticamente
  }
);

if (result.success) {
  const data = JSON.parse(result.json);
  console.log('✅ Modelo usado:', result.modelUsed);
  console.log('📦 Datos:', data);
}
```

### 3. Listo! 🎉

---

## 🧪 Prueba Rápida (1 minuto)

### Ver Qué Modelos Están Disponibles

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Copiar en consola del navegador después de cargar tu app
const { GeminiService } = await import('./src/services/GeminiServiceV2.ts');
const models = await GeminiService.listCompatibleModels('TU_API_KEY');
console.log('📋 Modelos disponibles:', models);
```

**Salida esperada:**
```javascript
[
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash"
]
```

### Ver Cuál se Recomienda

```javascript
const best = await GeminiService.getRecommendedModel('TU_API_KEY');
console.log('🏆 Modelo recomendado:', best);
// → "gemini-1.5-pro-latest"
```

---

## 📝 Ejemplo Completo

```typescript
import { useState } from 'react';
import { GeminiService } from './services/GeminiServiceV2';

function MiComponente() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const analizar = async () => {
    if (!file) return;

    try {
      const response = await GeminiService.processAndExtractJSON(
        {
          image: file,
          prompt: `Analiza esta captura de Diablo 4 y devuelve JSON:
          {
            "nivel": 0,
            "clase": "...",
            "atributos": { "fuerza": 0, "destreza": 0 },
            "stats": { "vida": 0, "armadura": 0 }
          }`,
          temperature: 0.05  // Máxima precisión
        },
        {
          apiKey: import.meta.env.VITE_GEMINI_API_KEY,
          useJsonMode: true
        }
      );

      if (response.success) {
        const data = JSON.parse(response.json);
        setResult(data);
        console.log('Modelo usado:', response.modelUsed);
      } else {
        setError(response.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button onClick={analizar}>Analizar</button>
      
      {error && <div>Error: {error}</div>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

---

## 🔍 Debugging

### Si Sigue Fallando con 404

```typescript
// Forzar actualización de lista de modelos
const result = await GeminiService.processAndExtractJSON(
  { image, prompt },
  {
    apiKey: 'KEY',
    useJsonMode: true,
    forceRefreshModels: true  // ⭐ Fuerza reconsulta
  }
);
```

### Si Devuelve JSON Inválido

```typescript
// Activar modo JSON puro (si no lo hiciste ya)
{
  apiKey: 'KEY',
  useJsonMode: true  // ⭐ IMPORTANTE
}
```

### Si la API Key Falla

```typescript
// Verificar que sea válida
try {
  const models = await GeminiService.listCompatibleModels('TU_API_KEY');
  if (models.length > 0) {
    console.log('✅ API key válida');
  }
} catch (error) {
  console.error('❌ API key inválida:', error);
  // Consigue una nueva en: https://aistudio.google.com/app/apikey
}
```

---

## 🎯 Prompts Recomendados

### Estadísticas de Diablo 4

```typescript
const PROMPT = `Analiza esta captura de estadísticas de Diablo 4.
Extrae TODOS los valores numéricos visibles.

JSON:
{
  "nivel": 0,
  "clase": "Bárbaro",
  "atributos": { "fuerza": 0, "destreza": 0, "inteligencia": 0 },
  "defensivo": { "vida": 0, "armadura": 0, "resistencias": 0 },
  "ofensivo": { "dano_critico": 0, "prob_critico": 0 }
}

REGLAS:
- Si no ves un valor, usa 0
- Números como "50%" → 50
- Números como "1,234" → 1234
- SOLO JSON, sin explicaciones`;
```

### Habilidades

```typescript
const PROMPT = `Analiza el árbol de habilidades.

JSON:
{
  "clase": "...",
  "activas": [{ "nombre": "...", "puntos": 0 }],
  "pasivas": [{ "nombre": "...", "puntos": 0 }]
}

SOLO JSON.`;
```

---

## 🛡️ Seguridad: API Key

### Configuración Actual (OK para desarrollo)

```bash
# .env.local
VITE_GEMINI_API_KEY=tu_api_key_aqui
```

```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

### ⚠️ Para Producción: OBLIGATORIO Backend

**NO** uses la API key en el frontend en producción.

**Solución:**

```
Frontend → Tu Backend → Gemini API
         (API key segura en servidor)
```

Ver sección **"I. SEGURIDAD"** en [GEMINI_SERVICE_V2_GUIDE.md](GEMINI_SERVICE_V2_GUIDE.md) para implementación completa.

---

## 📚 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `GeminiServiceV2.ts` | 🎯 Servicio principal con selección dinámica |
| `GeminiServiceV2.examples.tsx` | 📖 6 ejemplos completos de uso |
| `GEMINI_SERVICE_V2_GUIDE.md` | 📘 Guía completa (LÉELO para detalles) |
| `QUICKSTART_GEMINI_V2.md` | ⚡ Este archivo (inicio rápido) |

---

## ✨ Ventajas del Nuevo Enfoque

| Antes | Después |
|-------|---------|
| ❌ Lista hardcodeada de modelos | ✅ Consulta dinámica en tiempo real |
| ❌ Error 404 si modelo no existe | ✅ Selecciona automáticamente uno disponible |
| ❌ No sabes qué modelo se usó | ✅ `modelUsed` en respuesta |
| ❌ Difícil de debuggear | ✅ Logs detallados + `listCompatibleModels()` |

---

## 🚦 Próximos Pasos

### Hoy

1. ✅ Prueba con `listCompatibleModels()` para ver qué modelos tienes
2. ✅ Analiza una imagen de prueba de Diablo 4
3. ✅ Verifica que `result.modelUsed` muestra el modelo correcto

### Esta Semana

1. ⚡ Migra tu `ImageCaptureModal.tsx` al nuevo servicio
2. ⚡ Ajusta prompts según calidad de resultados
3. ⚡ Implementa manejo de errores por `errorType`

### Próximo Mes

1. 🔐 Crear backend proxy para API key
2. 📊 Caché de resultados
3. 🎯 Optimización de prompts

---

## ❓ FAQ

### ¿Funciona con mi API key actual?

Sí, pero la disponibilidad de modelos puede variar. Usa `listCompatibleModels()` para ver cuáles tienes.

### ¿Es más lento que antes?

La primera vez consulta modelos (1-2 segundos), luego usa caché (instant). El procesamiento de imagen es igual de rápido.

### ¿Qué modelo va a usar?

Depende de cuáles estén disponibles para tu API key. Generalmente: `gemini-1.5-pro-latest` o `gemini-1.5-flash-latest`.

### ¿Puedo especificar un modelo manualmente?

Sí:

```typescript
{
  apiKey: 'KEY',
  model: 'gemini-1.5-pro',  // Forzar este modelo
  useJsonMode: true
}
```

Pero la selección automática es más robusta.

### ¿Qué pasa si TODOS los modelos fallan?

Recibirás:
```typescript
{
  success: false,
  error: "No se encontró modelo compatible...",
  errorType: 'MODEL'
}
```

Verifica tu API key en https://aistudio.google.com/app/apikey

---

## 🎉 ¡Listo!

Tu integración ahora es **robusta, adaptativa y a prueba de cambios** en la API de Gemini.

**¿Dudas?** Lee la guía completa: [GEMINI_SERVICE_V2_GUIDE.md](GEMINI_SERVICE_V2_GUIDE.md)

**¿Errores?** Revisa los ejemplos: [GeminiServiceV2.examples.tsx](src/services/GeminiServiceV2.examples.tsx)
