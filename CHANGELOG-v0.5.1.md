# Changelog v0.5.1 - Corrección de Importación de Runas/Gemas

**Fecha**: 15 de abril de 2026
**Tipo**: Corrección de Bugs Críticos

## 🎯 Resumen

Esta versión corrige bugs críticos en el flujo de importación que impedían el guardado correcto de imágenes y JSON para las categorías de Runas y Gemas, así como mejoras en la gestión unificada de almacenamiento.

## 🐛 Correcciones de Bugs

### 1. Error en Nombres de Archivo con Caracteres Inválidos

**Problema**: Al importar runas o gemas, el sistema generaba nombres de archivo con el carácter "/" (slash), causando el error:
```
TypeError: Failed to execute 'getFileHandle' on 'FileSystemDirectoryHandle': Name is not allowed.
```

**Causa Raíz**: El código buscaba el label "Runas/Gemas" de CATEGORIES y lo convertía a minúsculas para usarlo como base del nombre de archivo:
```typescript
// ❌ ANTES (incorrecto)
const categoryLabel = CATEGORIES.find(c => c.value === resolvedCategory)?.label || resolvedCategory;
const nombre = await ImageService.saveImage(blob, resolvedCategory, categoryLabel.toLowerCase());
// Si resolvedCategory = "runas" → categoryLabel = "Runas/Gemas" → "runas/gemas" ❌
```

**Solución**: Usar directamente `resolvedCategory` como base del nombre de archivo:
```typescript
// ✅ DESPUÉS (correcto)
const resolvedCategory = resolveImportCategory(selectedCategory, runaGemaType);
const nombre = await ImageService.saveImage(blob, resolvedCategory, resolvedCategory);
// Si selectedCategory = "runas" y runaGemaType = "runas" → resolvedCategory = "runas" ✓
// Si selectedCategory = "runas" y runaGemaType = "gemas" → resolvedCategory = "gemas" ✓
```

### 2. Guardado Incorrecto en Galería para Runas/Gemas

**Problema**: Las imágenes y JSON de runas/gemas no se guardaban en la galería después de una importación exitosa.

**Causa Raíz**: Las funciones de auto-guardado no utilizaban `resolveImportCategory()` para determinar la categoría específica (runas vs gemas), sino que usaban directamente `selectedCategory` que es genérico ("runas").

**Archivos Modificados**:
- `src/components/common/ImageCaptureModal.tsx`

**Funciones Corregidas**:

#### a. `autoSaveJSONAfterImport()` (líneas 863-905)
- **ANTES**: Usaba `selectedCategory` directamente
- **DESPUÉS**: Resuelve con `resolveImportCategory(selectedCategory, runaGemaType)` antes de todas las operaciones

#### b. `saveComposedImage()` (líneas 615-640)  
- **ANTES**: Usaba `selectedCategory` y `categoryLabel.toLowerCase()`
- **DESPUÉS**: Resuelve categoría con `resolveImportCategory()` y usa directamente `resolvedCategory`

#### c. `handleSaveEmptyImport()` (líneas 3678-3710)
- **ANTES**: Usaba `selectedCategory` directamente
- **DESPUÉS**: Aplica `resolveImportCategory()` para obtener categoría específica

#### d. Detección de Importación Vacía - Modo Héroe (línea 2438)
- **ANTES**: Generaba nombre con `categoryLabel.toLowerCase()`
- **DESPUÉS**: Usa `resolvedCategory` para el nombre del archivo

#### e. Detección de Importación Vacía - Modo Personaje (línea 3625)
- **ANTES**: Generaba nombre con `categoryLabel.toLowerCase()`
- **DESPUÉS**: Usa `resolvedCategory` para el nombre del archivo

## 🔧 Mejoras Técnicas

### Almacenamiento Unificado `gemas_runas`

El sistema mantiene la estructura de almacenamiento unificada implementada en versiones anteriores:

- **Escritura**: Todas las runas y gemas se guardan en `workspace/imagenes/gemas_runas/`
- **Lectura**: Sistema de fallback que busca en múltiples carpetas:
  1. `gemas_runas` (carpeta unificada actual)
  2. `runas` (compatibilidad legacy)
  3. `gemas` (compatibilidad legacy)

**Beneficios**:
- ✅ Organización centralizada
- ✅ Compatibilidad con datos antiguos
- ✅ Sin pérdida de información en migración
- ✅ Menos fragmentación de archivos

### Función `resolveImportCategory()`

```typescript
const resolveImportCategory = (
  category: ImageCategory, 
  runeGemCategory?: 'runas' | 'gemas'
): ImageCategory => {
  if (category === 'runas' && runeGemCategory) {
    return runeGemCategory;
  }
  return category;
};
```

Esta función es crucial para determinar la categoría específica cuando el usuario está importando en el contexto de "Runas/Gemas".

## 📊 Flujo de Importación Corregido

### Antes (❌ Bug)
1. Usuario selecciona categoría "Runas/Gemas"
2. Usuario elige tipo específico: "Runas"
3. Importa JSON exitosamente
4. `autoSaveJSONAfterImport()` usa `selectedCategory` = "runas"
5. Busca label en CATEGORIES → "Runas/Gemas"
6. Genera nombre: `"runas/gemas_1713196800000.png"` ❌
7. **ERROR**: FileSystemAPI rechaza el nombre por contener "/"

### Después (✅ Correcto)
1. Usuario selecciona categoría "Runas/Gemas"
2. Usuario elige tipo específico: "Runas"
3. Importa JSON exitosamente
4. `autoSaveJSONAfterImport()` usa `resolveImportCategory("runas", "runas")` → "runas"
5. Genera nombre: `"runas_1713196800000.png"` ✓
6. **ÉXITO**: Archivo guardado en `workspace/imagenes/gemas_runas/runas_1713196800000.png`
7. JSON asociado guardado como `runas_1713196800000.json`

## 🧪 Casos de Prueba

### Caso 1: Importar Runas con Imagen
- **Entrada**: JSON de runas + captura de pantalla
- **Resultado Esperado**: 
  - ✓ Imagen guardada: `gemas_runas/runas_[timestamp].png`
  - ✓ JSON guardado: `gemas_runas/runas_[timestamp].json`
  - ✓ Datos importados en héroe de la clase correspondiente
  - ✓ Galería actualizada mostrando la nueva entrada

### Caso 2: Importar Gemas sin Imagen
- **Entrada**: JSON de gemas (solo texto)
- **Resultado Esperado**:
  - ✓ JSON guardado: `gemas_runas/gemas_[timestamp].json`
  - ✓ Entrada en galería marcada como "JSON Only"
  - ✓ Datos importados en héroe

### Caso 3: Re-procesar desde Galería
- **Entrada**: Seleccionar imagen existente de runas en galería
- **Resultado Esperado**:
  - ✓ JSON se guarda junto a la imagen existente
  - ✓ No se duplica la imagen
  - ✓ Galería muestra el ícono JSON asociado

## 📝 Notas de Migración

### Para Usuarios
- **No se requiere acción manual**: Los cambios son compatibles con versiones anteriores
- **Datos existentes**: Runas/gemas en carpetas legacy (`runas/` y `gemas/`) siguen siendo accesibles
- **Nuevas importaciones**: Se guardarán automáticamente en `gemas_runas/`

### Para Desarrolladores
- **Patrón a seguir**: Siempre usar `resolveImportCategory()` antes de operaciones de archivo cuando la categoría puede ser "runas"
- **Evitar**: Usar `categoryLabel` de CATEGORIES para nombres de archivo
- **Preferir**: Usar directamente el valor `ImageCategory` que es seguro para archivos

## 🔍 Validación

### Compilación TypeScript
```bash
npx tsc --noEmit
```
**Resultado**: ✅ Sin errores

### Archivos Modificados
- `src/components/common/ImageCaptureModal.tsx` (5 funciones corregidas)

### Líneas de Código Afectadas
- **autoSaveJSONAfterImport**: ~42 líneas
- **saveComposedImage**: ~25 líneas  
- **handleSaveEmptyImport**: ~32 líneas
- **handleImportJSON** (modo héroe): ~15 líneas
- **handleImportJSON** (modo personaje): ~15 líneas

**Total**: ~129 líneas modificadas

## 🎉 Impacto en Usuario Final

### Antes
- ❌ Error al importar runas/gemas
- ❌ Imágenes y JSON no se guardaban
- ❌ Modal se cerraba sin persistir datos
- ❌ Frustración en workflow de importación

### Después  
- ✅ Importación fluida de runas/gemas
- ✅ Auto-guardado confiable en galería
- ✅ Organización limpia en carpeta unificada
- ✅ Workflow completo sin interrupciones

## 🚀 Próximos Pasos

- [ ] Agregar tests automatizados para `resolveImportCategory()`
- [ ] Implementar migración automática de carpetas legacy a `gemas_runas`
- [ ] Agregar indicador visual de categoría específica en galería
- [ ] Mejorar logging de operaciones de archivo para debugging

---

**Versión**: 0.5.0 → 0.5.1
**Complejidad**: Corrección de bugs críticos con refactor menor
**Riesgo**: Bajo (cambios internos, sin breaking changes)
