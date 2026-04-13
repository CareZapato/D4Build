# 🚀 INICIO RÁPIDO - Nueva Integración Gemini

## ✅ ¿Qué cambió?

Tu integración con Gemini ahora es **robusta, con fallback automático y mejor manejo de errores**.

### Problema Resuelto
```
❌ ERROR: models/gemini-2.0-flash-exp is not found (404)
✅ SOLUCIÓN: Fallback automático a modelos válidos
```

---

## 🎯 Lo que debes saber (2 minutos)

### 1. Ya NO necesitas especificar un modelo

**❌ Antes** (causaba error 404):
```typescript
{
  model: 'gemini-2.0-flash-exp'  // Este modelo no existe
}
```

**✅ Ahora** (fallback automático):
```typescript
{
  useJsonMode: true  // El servicio elige el mejor modelo disponible
}
```

### 2. El servicio es MÁS inteligente

- ✅ **Intenta 5 modelos** hasta que uno funcione
- ✅ **Detecta errores** de API key vs modelo vs cuota
- ✅ **Devuelve JSON puro** sin markdown (con `useJsonMode: true`)
- ✅ **Te dice qué modelo funcionó** en `result.modelUsed`

### 3. Tu código existente sigue funcionando

No necesitas cambiar nada en tu flujo actual. Los cambios son internos en `GeminiService.ts`.

---

## 📝 Uso Básico (Ya integrado en tu app)

```typescript
const result = await GeminiService.processAndExtractJSON(
  {
    image: imageBlob,
    prompt: "Analiza esta imagen de Diablo 4 y devuelve JSON con..."
  },
  {
    apiKey: GEMINI_API_KEY,
    useJsonMode: true  // ⭐ RECOMENDADO
  }
);

if (result.success) {
  const data = JSON.parse(result.json);
  console.log('✅ Modelo usado:', result.modelUsed);
  console.log('Datos:', data);
} else {
  console.error('❌ Error:', result.error);
}
```

---

## ⚡ Acción Inmediata Requerida

### 🔐 SEGURIDAD: Mover API Key (IMPORTANTE)

**Estado actual**: Tu API key está hardcodeada en el código frontend.

```typescript
// ⚠️ ACTUALMENTE EN ImageCaptureModal.tsx
const GEMINI_API_KEY = 'AIzaSyCUU5YJqZfaXPkOvmvVfizpAfWRLSEb4Lk';
```

**Riesgo**: Cualquiera puede inspeccionar tu código y robar la API key.

**Solución rápida (10 minutos)**:

1. Crea archivo `.env.local`:
```bash
VITE_GEMINI_API_KEY=AIzaSyCUU5YJqZfaXPkOvmvVfizpAfWRLSEb4Lk
```

2. En `ImageCaptureModal.tsx`, cambia:
```typescript
// ❌ Antes
const GEMINI_API_KEY = 'AIzaSyCUU5YJqZfaXPkOvmvVfizpAfWRLSEb4Lk';

// ✅ Después
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
```

3. Agrega `.env.local` a tu `.gitignore`:
```bash
echo ".env.local" >> .gitignore
```

**Solución completa (Para producción)**:  
Lee la sección **"E. SEGURIDAD"** en [GEMINI_INTEGRATION.md](GEMINI_INTEGRATION.md#-e-seguridad-de-la-api-key)

---

## 🧪 Probar la Integración (5 minutos)

### Test 1: Verificar modelos disponibles

Abre la consola del navegador y ejecuta:

```javascript
// En la consola del navegador (Developer Tools)
const { GeminiService } = await import('./src/services/GeminiService.ts');
const models = await GeminiService.listAvailableModels('TU_API_KEY');
console.log('Modelos disponibles:', models);
```

Deberías ver algo como:
```javascript
['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest', ...]
```

### Test 2: Analizar una imagen

1. Abre tu app
2. Captura o sube una imagen de Diablo 4
3. Haz clic en "Procesar con IA"
4. Observa la consola:

```
✨ [Gemini] Intentando con modelo: gemini-1.5-flash-latest
✅ [Gemini] ¡Éxito con modelo: gemini-1.5-flash-latest!
```

---

## 📚 Documentación Completa

Para ejemplos avanzados, componente React completo, y arquitectura backend:

- **Guía completa**: [GEMINI_INTEGRATION.md](GEMINI_INTEGRATION.md)
- **10 ejemplos de código**: [src/services/GeminiService.example.tsx](src/services/GeminiService.example.tsx)

---

## 🔄 Flujo de Fallback Automático

```
Intento 1: gemini-1.5-flash-latest
    ❌ 404 Not Found
    ⏭️ Siguiente modelo...

Intento 2: gemini-1.5-pro-latest
    ❌ 404 Not Found
    ⏭️ Siguiente modelo...

Intento 3: gemini-1.5-flash
    ✅ ¡Éxito! 
    → Devuelve respuesta con modelUsed: 'gemini-1.5-flash'
```

**Si TODOS fallan**:
```json
{
  "success": false,
  "error": "MODEL_UNAVAILABLE: No se pudo conectar con ningún modelo..."
}
```

---

## 🆘 Solución de Problemas Rápidos

### "API_KEY_INVALID"
- **Causa**: API key incorrecta o expirada
- **Solución**: Verifica en https://aistudio.google.com/app/apikey

### "QUOTA_EXCEEDED"
- **Causa**: Llegaste al límite gratuito
- **Solución**: Espera al próximo mes o actualiza tu plan

### "MODEL_UNAVAILABLE"
- **Causa**: Ningún modelo disponible en tu región
- **Solución**: Lista modelos con `listAvailableModels()` y actualiza la lista de fallback

### "JSON_PARSE_ERROR"
- **Causa**: El modelo no devolvió JSON válido
- **Solución**: Asegúrate de usar `useJsonMode: true` y mejora el prompt

---

## 📊 Comparación de Modelos

| Modelo | Velocidad | Calidad | Costo | Recomendado para |
|--------|-----------|---------|-------|------------------|
| `gemini-1.5-flash` | ⚡⚡⚡ | ⭐⭐⭐ | 💰 | **Desarrollo, testing** |
| `gemini-1.5-pro` | ⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | Producción, datos críticos |
| `gemini-pro-vision` | ⚡⚡ | ⭐⭐⭐ | 💰💰 | Fallback legacy |

**Modelo por defecto**: `gemini-1.5-flash-latest` (equilibrio velocidad/calidad)

---

## ✨ Próximos Pasos

1. ✅ **Ahora**: Probar con imágenes reales de Diablo 4
2. ⚡ **Esta semana**: Mover API key a `.env.local`
3. 🔐 **Próximo mes**: Implementar backend proxy (ver [GEMINI_INTEGRATION.md](GEMINI_INTEGRATION.md))

---

## 💡 Tips Profesionales

### Mejor Precisión en Extracción
```typescript
{
  temperature: 0.05,  // ⭐ Casi determinista
  useJsonMode: true
}
```

### Mejor Velocidad
```typescript
{
  model: 'gemini-1.5-flash',  // Forzar el más rápido
  maxOutputTokens: 2048        // Limitar respuesta
}
```

### Debugging
```typescript
console.log('Modelo usado:', result.modelUsed);
console.log('Raw text:', result.rawText);
```

---

**¿Dudas?** Lee la [guía completa](GEMINI_INTEGRATION.md) o revisa los [10 ejemplos](src/services/GeminiService.example.tsx).
