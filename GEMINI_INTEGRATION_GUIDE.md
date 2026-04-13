# 🚀 Guía de Integración - GeminiImageService

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#1-configuración-inicial)
2. [Integración en CharacterStats](#2-integración-en-characterstats)
3. [Integración en CharacterGlyphs](#3-integración-en-characterglyphs)
4. [Integración en CharacterSkills](#4-integración-en-characterskills)
5. [Integración en HeroAspects](#5-integración-en-heroaspects)
6. [Manejo de Errores](#6-manejo-de-errores)
7. [Testing](#7-testing)

---

## 1. Configuración Inicial

### 1.1 Crear archivo `.env.local`

```bash
# En la raíz del proyecto: g:\Proyectos\D4Builds\.env.local
VITE_GEMINI_API_KEY=tu-api-key-aqui
```

**Obtener API Key:**
1. Ve a [Google AI Studio](https://aistudio.google.com/apikey)
2. Crea una API Key gratuita
3. Cópiala en `.env.local`

### 1.2 Agregar `.env.local` al `.gitignore`

```bash
# Si no existe, crea .gitignore en la raíz
.env.local
.env*.local
```

### 1.3 Reiniciar servidor de desarrollo

```powershell
# Detén el servidor (Ctrl+C)
# Reinicia
npm run dev
```

---

## 2. Integración en CharacterStats.tsx

### 2.1 Importar helpers

```typescript
// Al inicio del archivo CharacterStats.tsx
import { importStatsFromImage } from '../services/GeminiImageService.examples';
```

### 2.2 Agregar estado para loading

```typescript
const [importing, setImporting] = useState(false);
```

### 2.3 Crear handler para importación desde imagen

```typescript
const handleImportFromImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setImporting(true);

  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      alert('⚠️ Configura VITE_GEMINI_API_KEY en .env.local');
      return;
    }

    // Importar estadísticas
    const importedStats = await importStatsFromImage(file, apiKey);
    
    if (importedStats) {
      // Actualizar estadísticas del personaje
      onChange(
        importedStats,
        importedStats.nivel,
        importedStats.nivel_paragon
      );
      
      alert('✅ Estadísticas importadas correctamente');
    }
  } catch (error: any) {
    alert(`❌ Error: ${error.message}`);
  } finally {
    setImporting(false);
  }
};
```

### 2.4 Agregar botón de importación en el JSX

Dentro del componente, justo después del botón de importar JSON:

```typescript
{/* Botón importar desde imagen */}
<button
  onClick={() => document.getElementById('image-stats-input')?.click()}
  disabled={importing}
  className="btn-secondary flex items-center gap-2"
>
  {importing ? '⏳ Analizando...' : '📸 Importar desde Imagen'}
</button>

{/* Input oculto para seleccionar archivo */}
<input
  id="image-stats-input"
  type="file"
  accept="image/png,image/jpeg,image/jpg,image/webp"
  onChange={handleImportFromImage}
  style={{ display: 'none' }}
/>
```

### 2.5 Resultado esperado

El usuario podrá:
1. Hacer clic en "📸 Importar desde Imagen"
2. Seleccionar un screenshot de Diablo 4
3. Esperar análisis (5-10 segundos)
4. Ver estadísticas importadas automáticamente
5. Los valores de `nivel` y `nivel_paragon` se sincronizan con CharacterDetail

---

## 3. Integración en CharacterGlyphs.tsx

### 3.1 Importar helper

```typescript
import { importGlyphsFromImage } from '../services/GeminiImageService.examples';
```

### 3.2 Agregar handler

```typescript
const [importing, setImporting] = useState(false);

const handleImportFromImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setImporting(true);

  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      alert('⚠️ Configura VITE_GEMINI_API_KEY en .env.local');
      return;
    }

    const importedData = await importGlyphsFromImage(file, apiKey);
    
    if (importedData?.glifos) {
      // Mapear glifos importados a formato local
      const mappedGlyphs = importedData.glifos.map(g => ({
        id: g.nombre.toLowerCase().replace(/\s+/g, '-'),
        nivel_actual: g.nivel_actual
      }));
      
      onGlyphsChange(mappedGlyphs);
      alert(`✅ ${mappedGlyphs.length} glifos importados`);
    }
  } catch (error: any) {
    alert(`❌ Error: ${error.message}`);
  } finally {
    setImporting(false);
  }
};
```

### 3.3 Agregar botón

```typescript
<button
  onClick={() => document.getElementById('image-glyphs-input')?.click()}
  disabled={importing}
  className="btn-secondary"
>
  {importing ? '⏳ Analizando...' : '📸 Importar desde Imagen'}
</button>

<input
  id="image-glyphs-input"
  type="file"
  accept="image/*"
  onChange={handleImportFromImage}
  style={{ display: 'none' }}
/>
```

---

## 4. Integración en CharacterSkills.tsx

### 4.1 Importar helper

```typescript
import { importSkillsFromImage } from '../services/GeminiImageService.examples';
```

### 4.2 Handler de importación

```typescript
const [importing, setImporting] = useState(false);

const handleImportFromImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setImporting(true);

  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      alert('⚠️ Configura VITE_GEMINI_API_KEY en .env.local');
      return;
    }

    const importedData = await importSkillsFromImage(file, apiKey);
    
    if (importedData?.habilidades) {
      // Mapear activas
      const activasIds = importedData.habilidades.activas
        .filter(s => s.puntos > 0)
        .map(s => s.nombre.toLowerCase().replace(/\s+/g, '-'));
      
      // Mapear pasivas
      const pasivasIds = importedData.habilidades.pasivas
        .filter(s => s.puntos > 0)
        .map(s => s.nombre.toLowerCase().replace(/\s+/g, '-'));
      
      onSkillsChange({
        activas: activasIds,
        pasivas: pasivasIds
      });
      
      alert(`✅ ${activasIds.length + pasivasIds.length} habilidades importadas`);
    }
  } catch (error: any) {
    alert(`❌ Error: ${error.message}`);
  } finally {
    setImporting(false);
  }
};
```

### 4.3 Agregar botón

```typescript
<button
  onClick={() => document.getElementById('image-skills-input')?.click()}
  disabled={importing}
  className="btn-secondary"
>
  {importing ? '⏳ Analizando...' : '📸 Importar desde Imagen'}
</button>

<input
  id="image-skills-input"
  type="file"
  accept="image/*"
  onChange={handleImportFromImage}
  style={{ display: 'none' }}
/>
```

---

## 5. Integración en HeroAspects.tsx

### 5.1 Importar helper

```typescript
import { importAspectsFromImage } from '../services/GeminiImageService.examples';
```

### 5.2 Handler de importación

```typescript
const [importing, setImporting] = useState(false);

const handleImportFromImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setImporting(true);

  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      alert('⚠️ Configura VITE_GEMINI_API_KEY en .env.local');
      return;
    }

    const importedData = await importAspectsFromImage(file, apiKey);
    
    if (importedData?.aspectos) {
      // Convertir a formato local
      const mappedAspects = importedData.aspectos.map(a => ({
        id: a.nombre_corto.toLowerCase().replace(/\s+/g, '-'),
        name: a.nombre,
        shortName: a.nombre_corto,
        effect: a.efecto,
        level: a.nivel,
        category: mapCategory(a.categoria),
        keywords: extractKeywords(a.efecto),
        tags: [a.categoria.toLowerCase()]
      }));
      
      // Agregar aspectos al héroe
      const currentAspects = hero?.aspectos || [];
      const newAspects = [...currentAspects];
      
      mappedAspects.forEach(aspect => {
        // Solo agregar si no existe
        if (!newAspects.find(a => a.id === aspect.id)) {
          newAspects.push(aspect);
        }
      });
      
      onAspectsChange(newAspects);
      
      alert(`✅ ${mappedAspects.length} aspectos importados`);
    }
  } catch (error: any) {
    alert(`❌ Error: ${error.message}`);
  } finally {
    setImporting(false);
  }
};

// Helper para mapear categorías
function mapCategory(categoria: string): 'ofensivo' | 'defensivo' | 'movilidad' | 'recurso' | 'utilidad' {
  const lower = categoria.toLowerCase();
  if (lower.includes('ofen')) return 'ofensivo';
  if (lower.includes('defen')) return 'defensivo';
  if (lower.includes('movil')) return 'movilidad';
  if (lower.includes('recur')) return 'recurso';
  return 'utilidad';
}

// Helper para extraer keywords
function extractKeywords(efecto: string): string[] {
  const keywords = new Set<string>();
  const words = efecto.toLowerCase().split(/\s+/);
  
  words.forEach(word => {
    if (word.length > 4 && !['aspecto', 'cuando', 'aumenta', 'reduce'].includes(word)) {
      keywords.add(word);
    }
  });
  
  return Array.from(keywords);
}
```

### 5.3 Agregar botón

```typescript
<button
  onClick={() => document.getElementById('image-aspects-input')?.click()}
  disabled={importing}
  className="btn-secondary"
>
  {importing ? '⏳ Analizando...' : '📸 Importar desde Imagen'}
</button>

<input
  id="image-aspects-input"
  type="file"
  accept="image/*"
  onChange={handleImportFromImage}
  style={{ display: 'none' }}
/>
```

---

## 6. Manejo de Errores

### 6.1 Mensajes de error amigables

Ya implementados en el servicio:

| ErrorType | Mensaje | Solución |
|-----------|---------|----------|
| `MODEL_UNAVAILABLE` | ❌ El modelo de IA no está disponible | Espera unos minutos, el servicio puede estar saturado |
| `INVALID_API_KEY` | 🔑 API Key inválida | Verifica que VITE_GEMINI_API_KEY tenga tu clave correcta |
| `QUOTA_EXCEEDED` | ⏱️ Límite de uso alcanzado | Espera 1 minuto (la cuota gratuita es de 15 RPM) |
| `EMPTY_RESPONSE` | 📭 La IA no devolvió datos | Usa una imagen más clara o con mejor calidad |
| `INVALID_JSON` | ⚠️ Respuesta inválida | Intenta de nuevo, puede ser un error temporal |
| `NETWORK_ERROR` | 🌐 Error de conexión | Verifica tu conexión a internet |

### 6.2 Logging en consola

El servicio ya incluye logs detallados:

```
🚀 [GeminiImageService] Iniciando análisis...
📋 Tipo: stats
🤖 Modelo: gemini-3-flash-preview
🌡️  Temperatura: 0.1

🖼️  [PASO 1/4] Convirtiendo imagen...
✅ [fileToBase64] Conversión exitosa
   MIME: image/png
   Size: 245.67 KB

📝 [PASO 2/4] Generando prompt...
   Prompt length: 1234 caracteres

🔧 [PASO 3/4] Enviando a Gemini...

📥 [PASO 4/4] Respuesta recibida
   Tamaño: 856 caracteres

🔍 [extractJSON] Analizando respuesta...
   ✓ JSON extraído (length: 856 chars)
   ✅ JSON parseado correctamente

✅ Análisis completado exitosamente
📦 Datos extraídos (4 campos)
```

---

## 7. Testing

### 7.1 Test rápido desde consola del navegador

```javascript
// 1. Abrir DevTools (F12)
// 2. Ir a la pestaña Console
// 3. Pegar y ejecutar:

const { importStatsFromImage } = await import('./src/services/GeminiImageService.examples.tsx');

// Crear un input temporal
const input = document.createElement('input');
input.type = 'file';
input.accept = 'image/*';

input.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  console.log('📸 Archivo seleccionado:', file.name);
  
  try {
    const apiKey = 'TU_API_KEY_AQUI';
    const stats = await importStatsFromImage(file, apiKey);
    
    console.log('✅ Estadísticas importadas:');
    console.log(stats);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

input.click();
```

### 7.2 Test de cada tipo de análisis

```javascript
// STATS
const statsResult = await importStatsFromImage(file, apiKey);
console.log('Stats:', statsResult);

// GLYPHS
const glyphsResult = await importGlyphsFromImage(file, apiKey);
console.log('Glyphs:', glyphsResult);

// SKILLS
const skillsResult = await importSkillsFromImage(file, apiKey);
console.log('Skills:', skillsResult);

// ASPECTS
const aspectsResult = await importAspectsFromImage(file, apiKey);
console.log('Aspects:', aspectsResult);
```

### 7.3 Verificar que la API Key funciona

```javascript
import GeminiImageService from './src/services/GeminiImageService.ts';

const response = await GeminiImageService.analyzeImage(
  {
    image: file,
    analysisType: 'stats'
  },
  {
    apiKey: 'TU_API_KEY_AQUI'
  }
);

console.log('Response:', response);
```

### 7.4 Límites de la API gratuita

| Plan | RPM | RPD | TPM |
|------|-----|-----|-----|
| Gratuito | 15 | 1,500 | 1M |

- **RPM**: Requests por minuto
- **RPD**: Requests por día
- **TPM**: Tokens por minuto

Si excedes el límite, espera 1 minuto y reintenta.

---

## ✅ Checklist de Integración

- [ ] `.env.local` creado con `VITE_GEMINI_API_KEY`
- [ ] `.env.local` agregado a `.gitignore`
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] `importStatsFromImage` agregado a CharacterStats.tsx
- [ ] `importGlyphsFromImage` agregado a CharacterGlyphs.tsx
- [ ] `importSkillsFromImage` agregado a CharacterSkills.tsx
- [ ] `importAspectsFromImage` agregado a HeroAspects.tsx
- [ ] Botón "📸 Importar desde Imagen" visible en cada componente
- [ ] Test con screenshot real de Diablo 4
- [ ] Validación de datos importados
- [ ] Manejo de errores funciona correctamente

---

## 🎯 Próximos Pasos

1. **Optimizar prompts**: Ajusta los prompts según los resultados que obtengas
2. **Caché de resultados**: Guarda análisis recientes para evitar llamadas duplicadas
3. **Comparación de imágenes**: Implementa `compare_images` para ver cambios entre builds
4. **Batch processing**: Analiza múltiples imágenes en secuencia
5. **UI mejorada**: Agrega preview de imagen antes de analizar
6. **Feedback visual**: Muestra progreso durante el análisis (barra de carga)

---

## 📚 Referencias

- [Documentación oficial de Gemini](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Guía de comprensión de imágenes](https://ai.google.dev/gemini-api/docs/vision)
- [Límites y cuotas](https://ai.google.dev/pricing)
