# 📸 Gemini Image Service - Quick Start

## ⚡ Inicio Rápido en 3 Pasos

### 1️⃣ Configura tu API Key

```bash
# Crear .env.local en la raíz del proyecto
VITE_GEMINI_API_KEY=tu-api-key-aqui
```

👉 **Obtener API Key gratis**: https://aistudio.google.com/apikey

### 2️⃣ Reinicia el servidor

```bash
npm run dev
```

### 3️⃣ Usa el servicio

```typescript
import GeminiImageService from './services/GeminiImageService';

const response = await GeminiImageService.analyzeImageWithFallback(
  {
    image: file,
    analysisType: 'stats'  // 'stats' | 'glyphs' | 'skills' | 'aspects' | 'currency'
  },
  {
    apiKey: import.meta.env.VITE_GEMINI_API_KEY
  }
);

if (response.success) {
  console.log('Datos:', response.data);
}
```

---

## 📁 Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| **GeminiImageService.ts** | Servicio principal (656 líneas) |
| **GeminiImageService.examples.tsx** | Helpers y componentes React (609 líneas) |
| **GEMINI_INTEGRATION_GUIDE.md** | Guía completa de integración |
| **GEMINI_FINAL_DELIVERY.md** | Documento técnico completo |

---

## 🎯 Tipos de Análisis Disponibles

| Tipo | Descripción | Uso |
|------|-------------|-----|
| `'stats'` | Estadísticas completas del personaje | CharacterStats.tsx |
| `'glyphs'` | Glifos del tablero Paragon | CharacterGlyphs.tsx |
| `'skills'` | Árbol de habilidades | CharacterSkills.tsx |
| `'aspects'` | Aspectos legendarios | HeroAspects.tsx |
| `'currency'` | Monedas y recursos | - |
| `'compare_images'` | Comparación de 2+ imágenes | Futuro |

---

## 🔧 Helpers Específicos

```typescript
import {
  importStatsFromImage,
  importGlyphsFromImage,
  importSkillsFromImage,
  importAspectsFromImage,
  useGeminiImageAnalysis
} from './services/GeminiImageService.examples';

// Ejemplo: Importar estadísticas
const stats = await importStatsFromImage(file, apiKey);

// Ejemplo: Hook personalizado
const { loading, data, error, analyze } = useGeminiImageAnalysis('stats');
await analyze(file);
```

---

## ✅ Diferencias con la Implementación Anterior (V2)

| Aspecto | V2 (Antiguo) ❌ | V3 (Nuevo) ✅ |
|---------|-----------------|---------------|
| **Modelos** | `gemini-1.5-*`, `gemini-pro-vision` | `gemini-3-flash-preview`, `gemini-2.5-*` |
| **SDK** | `@google/generative-ai` | `@google/genai` |
| **Estructura** | Orden incorrecto | `contents = [imagen, texto]` |
| **Formato JSON** | Markdown envuelto | `responseMimeType: "application/json"` |
| **Base64** | Con prefijo `data:...` | Base64 puro |
| **Fallback** | Manual | Automático con 3 modelos |
| **Errores** | Genéricos | 7 tipos categorizados |
| **Prompts** | Hardcoded | Dinámicos por tipo de análisis |

---

## 🚦 Estado de Compilación

```bash
✅ npm run build

✓ 1452 modules transformed.
✓ built in 3.71s
```

**Sin errores TypeScript.**

---

## 📚 Documentación Completa

- **Guía de Integración**: [GEMINI_INTEGRATION_GUIDE.md](./GEMINI_INTEGRATION_GUIDE.md)
- **Entrega Técnica Completa**: [GEMINI_FINAL_DELIVERY.md](./GEMINI_FINAL_DELIVERY.md)
- **Código Fuente**:
  - [GeminiImageService.ts](./src/services/GeminiImageService.ts)
  - [GeminiImageService.examples.tsx](./src/services/GeminiImageService.examples.tsx)

---

## 🔍 Test Rápido desde Consola del Navegador

```javascript
// Abrir DevTools (F12) → Console

const { importStatsFromImage } = await import('./src/services/GeminiImageService.examples.tsx');

// Crear input temporal
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';

input.onchange = async (e) => {
  const file = e.target.files[0];
  const apiKey = 'TU_API_KEY_AQUI';
  
  try {
    const stats = await importStatsFromImage(file, apiKey);
    console.log('✅ Estadísticas:', stats);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

input.click();
```

---

## ⚠️ Límites del Plan Gratuito

| Límite | Valor |
|--------|-------|
| **Requests por minuto** | 15 |
| **Requests por día** | 1,500 |
| **Tokens por minuto** | 1,000,000 |

Si excedes el límite: `QUOTA_EXCEEDED` → Espera 1 minuto.

---

## 🎯 Próximos Pasos

1. ✅ Configurar `.env.local` con tu API Key
2. ✅ Reiniciar servidor de desarrollo
3. ✅ Integrar helpers en componentes existentes (ver guía)
4. ✅ Probar con screenshot real de Diablo 4
5. ✅ Validar datos importados

---

## 📞 Soporte

- [Documentación oficial de Gemini](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Límites y cuotas](https://ai.google.dev/pricing)

---

**¡Tu app ahora puede analizar imágenes con IA! 🎉**
