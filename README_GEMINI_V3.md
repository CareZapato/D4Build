# 🚀 INICIO INMEDIATO - GeminiServiceV3

## ⚡ 3 PASOS PARA USAR AHORA

### 1️⃣ Configura tu API Key

```bash
# Crea .env.local en la raíz del proyecto
echo "VITE_GEMINI_API_KEY=tu_clave_aqui" > .env.local
```

Obtén tu clave en: https://aistudio.google.com/apikeys

### 2️⃣ Importa el servicio

```typescript
import { GeminiService, PROMPT_DIABLO4_STATS } from './services/GeminiServiceV3';
```

### 3️⃣ Procesa una imagen

```typescript
const response = await GeminiService.processImageWithFallback(
  {
    image: imageFile, // File o Blob
    prompt: PROMPT_DIABLO4_STATS
  },
  {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  }
);

if (response.success) {
  console.log('✅ Datos:', response.data);
} else {
  console.error('❌ Error:', response.error);
}
```

---

## 📋 LO QUE CAMBIÓ

| Antes | Ahora |
|-------|-------|
| `@google/generative-ai` | `@google/genai` ✅ |
| `gemini-1.5-pro` | `gemini-3-flash-preview` ✅ |
| Error 404 | Funciona ✅ |
| JSON con markdown | JSON limpio ✅ |
| Sin fallback | Fallback automático ✅ |

---

## 🎯 MODELOS DISPONIBLES

1. **gemini-3-flash-preview** (principal)
2. **gemini-2.5-flash** (fallback 1)
3. **gemini-2.5-pro** (fallback 2)

El servicio los prueba automáticamente hasta que uno funcione.

---

## 📦 ARCHIVOS CREADOS

- **`GeminiServiceV3.ts`** - Servicio principal
- **`GeminiServiceV3.examples.tsx`** - Ejemplos React
- **`GEMINI_V3_QUICKSTART.md`** - Guía completa
- **`GEMINI_V3_ENTREGA_FINAL.md`** - Documentación técnica
- **`TEST_GEMINI_V3_QUICK.js`** - Script de pruebas

---

## ✅ VERIFICACIÓN

```bash
# Compilación exitosa
npm run build
# ✓ built in 3.50s
```

---

## 🧪 PRUEBA RÁPIDA

Consola del navegador (F12):

```javascript
const { GeminiService, PROMPT_DIABLO4_STATS } = await import(
  './src/services/GeminiServiceV3.ts'
);

const input = document.querySelector('input[type="file"]');
const file = input.files[0];

const response = await GeminiService.processImageWithFallback(
  { image: file, prompt: PROMPT_DIABLO4_STATS },
  { apiKey: 'TU_API_KEY' }
);

console.log(response);
```

---

## 💡 SI FALLA

```typescript
// Ver qué salió mal
console.log('Error type:', response.errorType);
console.log('Error message:', response.error);

// Errores comunes:
// MODEL_UNAVAILABLE → El modelo no está disponible
// INVALID_API_KEY → Verifica tu API key
// QUOTA_EXCEEDED → Espera unos minutos
// INVALID_JSON → Revisa response.rawText
```

---

## 📖 MÁS INFO

- **Guía completa**: `GEMINI_V3_QUICKSTART.md`
- **Documentación técnica**: `GEMINI_V3_ENTREGA_FINAL.md`
- **Ejemplos**: `GeminiServiceV3.examples.tsx`

---

**Estado**: ✅ LISTO PARA USAR  
**Compilación**: ✅ Sin errores  
**Modelos**: ✅ Actuales (2026)  

🎉 **Sube imagen → Obtén JSON. Sin errores 404.**
