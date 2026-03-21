# Changelog v0.3.5 - Sistema de Tags Global

## 🎯 Resumen de Cambios

Esta versión implementa un **sistema centralizado de gestión de tags (palabras clave)** que elimina la duplicación de datos y permite referencias consistentes entre componentes.

## 🆕 Nuevas Características

### 1. Sistema de Tags Global

#### **Archivo tags.json**
- Nuevo archivo en la raíz del workspace que almacena todos los tags globalmente
- Se carga automáticamente al seleccionar un workspace
- Evita duplicación de información de palabras clave

#### **Interfaz TagGlobal**
```typescript
interface TagGlobal {
  id: string;                      // ID único: "tag_golpe_critico_12345"
  tag: string;                     // Versión normalizada: "golpe_critico"
  texto_original: string;          // Como aparece: "golpe crítico"
  significado: string | null;      // Definición del tooltip (null si no disponible)
  categoria: string;               // atributo, efecto, condicion, recurso, mecanica, etc.
  descripcion_jugabilidad?: string | null;
  sinonimos: string[];
  origen: 'tooltip' | 'estadistica' | 'manual' | 'habilidad' | 'aspecto' | 'glifo';
  pendiente_revision: boolean;     // true si falta información
  fecha_creacion: string;
  fecha_actualizacion?: string;
}
```

### 2. TagService

Nuevo servicio (`src/services/TagService.ts`) para gestionar tags:

**Métodos principales:**
- `loadTags()`: Carga tags desde tags.json
- `saveTags()`: Guarda cambios en tags.json
- `processAndSaveTagsV2(tags, origen)`: Procesa tags del prompt V2, evita duplicados, retorna IDs
- `getTagById(id)`: Obtiene tag por ID
- `findTagByNormalizedName(tag)`: Busca tag por nombre normalizado
- `getTagsByIds(ids)`: Obtiene múltiples tags por sus IDs
- `searchTags(query)`: Búsqueda para autocompletar
- `addOrUpdateTag(tag)`: Agregar/actualizar tag manualmente
- `deleteTag(id)`: Eliminar tag

**Lógica de fusión inteligente:**
- Si tag ya existe (mismo `tag` normalizado): mantiene el existente
- Si nuevo tag tiene más información (significado), actualiza el existente
- Si tag no existe: crea nuevo con ID único

### 3. Referencias por ID

Los componentes ahora guardan solo IDs de tags en lugar de objetos completos:

**Antes (v0.3.4):**
```json
{
  "palabras_clave": ["golpe_critico", "vulnerable", "abrumador"]
}
```

**Ahora (v0.3.5):**
```json
{
  "palabras_clave": [
    "tag_golpe_critico_1234567890_5678",
    "tag_vulnerable_1234567891_5679",
    "tag_abrumador_1234567892_5680"
  ]
}
```

## 🔄 Cambios en Componentes

### **CharacterStats.tsx**
- ✅ Importa tags del JSON V2
- ✅ Usa `TagService.processAndSaveTagsV2()` para guardar tags
- ✅ Almacena IDs en lugar de objetos
- ✅ Mensaje de éxito indica cantidad de tags procesados

### **CharacterSkills.tsx**
- ✅ Procesa tags de habilidades activas y pasivas
- ✅ Recolecta tags tanto de sección global como de cada skill individual
- ✅ Guarda tags con origen 'habilidad'

### **HeroManager.tsx**
- ✅ Procesa tags de habilidades, glifos y aspectos
- ✅ Detecta automáticamente el origen según importType
- ✅ Manejo centralizado de tags en `processJSONImport()`

### **WorkspaceService.ts**
- ✅ Configura `TagService` con handle del directorio al seleccionar workspace
- ✅ Carga tags automáticamente después de crear estructura

## 📝 Actualización de Prompts

### **Prompt de Estadísticas V2 (REVERTIDO)**
- ❌ **Removido**: "1 imagen = 1 atributo = 1 JSON"
- ✅ **Nuevo**: "Captura TODOS los atributos visibles con sus detalles en 1 JSON"
- ✅ Ejemplo actualizado mostrando múltiples atributos (nivel, fuerza, inteligencia, armadura, etc.)
- ✅ Mantiene énfasis en capturar solo palabras blancas/subrayadas como tags

**Razón del cambio:**
Usuario aclaró que una imagen puede mostrar múltiples atributos simultáneamente, no solo uno. El sistema debe capturar todos los atributos visibles en un solo JSON.

## 🗑️ Deprecaciones

### **KeywordsService (parcialmente deprecado)**
- Ya no se usa para importar palabras clave de JSONs V2
- Reemplazado por TagService para gestión de tags
- Puede mantenerse para compatibilidad con sistemas legacy

## 🐛 Correcciones

- ✅ Eliminadas referencias a `KeywordsService.importKeywordsFromJSON()` en componentes
- ✅ Imports limpiados (removidos imports no utilizados)
- ✅ Errores de TypeScript resueltos

## 📊 Impacto en Datos

### **Estructura del Workspace**

**Antes:**
```
workspace/
├── workspace.json
├── heroes/
│   ├── Paladín_habilidades.json
│   ├── Paladín_glifos.json
│   └── Paladín_aspectos.json
└── personajes/
    └── {personaje_id}.json
```

**Después (v0.3.5):**
```
workspace/
├── workspace.json
├── tags.json                    ← NUEVO: Tags globales
├── heroes/
│   ├── Paladín_habilidades.json
│   ├── Paladín_glifos.json
│   └── Paladín_aspectos.json
└── personajes/
    └── {personaje_id}.json
```

### **Archivo tags.json**
```json
{
  "tags": [
    {
      "id": "tag_golpe_critico_1234567890_5678",
      "tag": "golpe_critico",
      "texto_original": "golpe crítico",
      "significado": "Probabilidad de que una habilidad o ataque inflija daño crítico adicional.",
      "categoria": "atributo",
      "descripcion_jugabilidad": null,
      "sinonimos": ["critico", "crit"],
      "origen": "estadistica",
      "pendiente_revision": false,
      "fecha_creacion": "2026-03-21T10:30:00.000Z",
      "fecha_actualizacion": "2026-03-21T10:30:00.000Z"
    }
  ],
  "ultima_actualizacion": "2026-03-21T10:30:00.000Z"
}
```

## 🔜 Próximos Pasos

### **Fase 1: Visualización de Tags**
- [ ] Componente de vista de tags en UI
- [ ] Mostrar tags asociados a habilidades/estadísticas/aspectos
- [ ] Indicador visual de tags pendientes de revisión

### **Fase 2: Gestión Manual**
- [ ] Panel de administración de tags
- [ ] Editar tags existentes (agregar significado, sinónimos)
- [ ] Fusionar tags duplicados
- [ ] Marcar tags como revisados

### **Fase 3: Búsqueda y Filtrado**
- [ ] Buscar personajes/builds por tags
- [ ] Filtrar habilidades por categoría de tag
- [ ] Autocompletar tags al crear contenido manualmente

## ⚠️ Notas de Migración

### **Para usuarios existentes:**
1. Los workspaces existentes funcionarán sin tags.json
2. Al importar nuevo contenido V2, se creará tags.json automáticamente
3. No se pierden datos existentes de palabras_clave antiguas
4. Migración gradual: nuevos imports usan tags globales, viejos datos permanecen

### **Compatibilidad:**
- ✅ Compatible con JSONs V1 (sin tags estructurados)
- ✅ Compatible con JSONs V2 (tags como objetos)
- ✅ Backward compatible con workspaces sin tags.json

## 📚 Documentación

### **Archivos Actualizados:**
- `README-estadisticas-v2.md`: Actualizado con nueva regla de múltiples atributos
- `/memories/d4builds-project.md`: Documentada arquitectura de tags globales

### **Archivos Nuevos:**
- `src/services/TagService.ts`: Servicio de gestión de tags
- `src/types/index.ts`: Interfaces TagGlobal y TagsData
- `CHANGELOG-v0.3.5.md`: Este archivo

## 🎉 Beneficios

1. **Eliminación de duplicación**: Un tag se define una vez, se referencia múltiples veces
2. **Consistencia**: Mismo tag tiene misma definición en todo el sistema
3. **Gestión centralizada**: Fácil actualizar/corregir tags desde un solo lugar
4. **Escalabilidad**: Agregar miles de tags sin inflar tamaño de JSONs de personajes
5. **Trazabilidad**: Saber el origen de cada tag (estadística, habilidad, manual, etc.)
6. **Revisión**: Sistema de flags indica qué tags necesitan más información

---

**Versión:** 0.3.5  
**Fecha:** 21 de marzo de 2026  
**Cambios principales:** Sistema de tags global, Referencias por ID, TagService
