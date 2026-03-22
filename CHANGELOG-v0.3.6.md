# Changelog v0.3.6 - Sistema de Habilidades con Tags Globales y Modificadores

**Fecha**: 2024
**Tipo**: Refactor Mayor + Nueva Funcionalidad

## 🎯 Resumen

Esta versión completa la migración del sistema de habilidades al modelo de tags globales (iniciado en v0.3.5 con estadísticas) y añade soporte completo para la gestión de modificadores de habilidades.

## ⚠️ CAMBIOS DE RUPTURA (BREAKING CHANGES)

### 1. Estructura de `habilidades_refs` en Personaje

#### ANTES (v0.3.5)
```typescript
interface Personaje {
  habilidades_refs?: {
    activas: string[];  // Solo IDs de habilidades
    pasivas: string[];
  };
}
```

#### DESPUÉS (v0.3.6)
```typescript
interface Personaje {
  habilidades_refs?: {
    activas: Array<{
      skill_id: string;           // ID de la habilidad
      modificadores_ids: string[]; // IDs de modificadores equipados
    }>;
    pasivas: string[];  // Sin cambios
  };
}
```

**Razón**: Las habilidades activas pueden tener modificadores variables por personaje. Necesitamos almacenar explícitamente qué modificadores están equipados.

**Impacto**: Todos los archivos de personaje existentes necesitan migración manual o automática.

### 2. Interface `Modificador`

#### ANTES
```typescript
interface Modificador {
  nombre: string;
  descripcion: string;
  palabras_clave?: string[];  // ❌ Eliminado
}
```

#### DESPUÉS
```typescript
interface Modificador {
  id?: string;                    // ✅ Nuevo - Único identificador
  nombre: string;
  tipo_habilidad?: TipoHabilidad; // ✅ Nuevo - Debe ser "modificador"
  descripcion: string;
  efectos?: string[];
  tags?: string[];                // ✅ Nuevo - IDs de tags globales
}
```

**Formato de IDs**: `"mod_nombre_skill_modificador"`
- Ejemplo: `"mod_luz_sagrada_potenciada"`
- Ejemplo: `"mod_rito_piedad"`

### 3. Interfaces de Habilidades - `palabras_clave` → `tags`

Todas las interfaces relacionadas con habilidades ahora usan `tags` (array de IDs) en lugar de `palabras_clave`:

- `HabilidadActiva`
- `HabilidadPasiva`
- `Modificador`
- Efectos dentro de habilidades

**Beneficios**:
- Consistencia con el sistema de estadísticas
- Sin duplicación de información
- Actualizaciones centralizadas en tags.json
- Búsquedas más eficientes

## ✨ Nuevas Funcionalidades

### 1. Gestión Completa de Modificadores

#### UI Mejorada
- **Badge con contador**: Muestra "X/Y modificadores" (equipados/disponibles)
- **Sección expandible**: Click en chevron para expandir/colapsar
- **Lista interactiva**: Checkboxes para todos los modificadores disponibles
- **Distinción visual**: 
  - Equipados: Borde morado (`border-purple-500/70`)
  - Disponibles: Borde gris (`border-d4-border/30`)
- **Toggle instantáneo**: Click en checkbox equipa/desequipa modificador

#### Ejemplo Visual
```
┌─────────────────────────────────────┐
│ ⚔️ Luz Sagrada                      │
│ Aura · Invocación · Nv. 1/5        │
│ 2/5 modificadores            [▼]   │ ← Badge + Chevron
├─────────────────────────────────────┤
│ [✓] Luz Sagrada Potenciada         │ ← Equipado (borde morado)
│     +25% daño sagrado              │
│                                     │
│ [✓] Rito de la Piedad              │ ← Equipado (borde morado)
│     +10s fortificar                │
│                                     │
│ [ ] Expansión Divina               │ ← Disponible (borde gris)
│     +5m radio                      │
└─────────────────────────────────────┘
```

### 2. Importación de Modificadores desde JSON

El sistema ahora extrae y guarda modificadores durante la importación:

1. **Extracción**: Lee modificadores del JSON importado
2. **Mapeo**: Relaciona nombres con IDs del catálogo del héroe
3. **Guardado**: Almacena `modificadores_ids` en personaje refs
4. **Sincronización**: Actualiza UI automáticamente

#### Ejemplo de JSON de Importación
```json
{
  "habilidades_activas": [
    {
      "id": "skill_activa_aura_luz_sagrada",
      "nombre": "Luz Sagrada",
      "tipo": "Aura",
      "modificadores": [
        {
          "id": "mod_luz_sagrada_potenciada",
          "nombre": "Luz Sagrada Potenciada",
          "tipo_habilidad": "modificador",
          "descripcion": "Tu Luz Sagrada inflige un 25% más de daño sagrado",
          "tags": ["tag_dano_sagrado"]
        },
        {
          "id": "mod_rito_piedad",
          "nombre": "Rito de la Piedad",
          "tipo_habilidad": "modificador",
          "descripcion": "Al activar Luz Sagrada, obtienes Fortificar durante 10 segundos",
          "tags": ["tag_fortificar"]
        }
      ]
    }
  ]
}
```

### 3. Prompts de IA Actualizados

Los 3 prompts para extracción desde imágenes ahora incluyen instrucciones para modificadores:

#### Nuevas Reglas en Prompts
```markdown
5. **Modificadores - IMPORTANTE**:
   - Cada modificador DEBE tener un id único: "mod_nombre_skill_nombre_modificador"
   - Cada modificador DEBE tener tipo_habilidad: "modificador"
   - Los modificadores van dentro del array modificadores de la skill base
   - Ejemplo ID: "mod_luz_sagrada_potenciada", "mod_rito_piedad"
```

Archivos actualizados:
- `generateActiveSkillsPrompt()`
- `generatePassiveSkillsPrompt()`
- `generateFullSkillsPrompt()`

## 🔧 Cambios Técnicos

### Archivos Modificados

#### 1. `src/types/index.ts`
- **Modificador**: Añadidos `id` y `tipo_habilidad`
- **Personaje.habilidades_refs**: Estructura de `activas` cambiada a objetos con `skill_id` y `modificadores_ids`
- **Todas las interfaces de habilidades**: `palabras_clave` → `tags`

#### 2. `src/components/characters/CharacterSkills.tsx` (Refactor Mayor)
- **State**: Actualizado para nueva estructura de refs
- **loadCharacterSkillsData**: Filtra modificadores basándose en IDs equipados
- **handleAddSkill**: Crea objetos `{ skill_id, modificadores_ids: [] }`
- **handleRemoveSkill**: Filtra por `ref.skill_id`
- **handleToggleModifier** (NUEVO): Equipa/desequipa modificadores
- **getEquippedModifiers** (NUEVO): Obtiene IDs de modificadores equipados
- **processJSONImport**: Extrae y mapea modificadores desde JSON
- **applyImportChanges**: Crea refs con estructura actualizada
- **UI**: Checkboxes interactivos, badges con contadores, secciones colapsables

#### 3. `src/components/characters/CharacterDetail.tsx`
- **pendingSkills**: Tipo actualizado a nueva estructura
- **handleSkillsChange**: Signature actualizada para recibir nueva estructura

#### 4. `src/services/PromptService.ts`
- **Mapeo de habilidades activas**: Actualizado para usar `ref.skill_id` en lugar de `skillId` directo

#### 5. `src/services/ImageExtractionPromptService.ts`
- **generateActiveSkillsPrompt**: Ejemplo JSON con modificadores incluyendo `id` y `tipo_habilidad`
- **generatePassiveSkillsPrompt**: Reglas actualizadas
- **generateFullSkillsPrompt**: Ejemplos y reglas completas para modificadores

### Lógica de Carga de Modificadores

```typescript
// 1. Cargar skill desde héroe
const skill = heroSkills.habilidades_activas.find(s => s.id === ref.skill_id);

// 2. Filtrar modificadores equipados
const modificadoresEquipados = skill.modificadores?.filter(mod =>
  ref.modificadores_ids.includes(mod.id || '')
);

// 3. Retornar skill con solo modificadores equipados
return { ...skill, modificadores: modificadoresEquipados };
```

## 📊 Arquitectura del Sistema

### Patrón de Referencias (Consistente con Glifos)

```
┌──────────────────────────────────────┐
│ Héroe JSON (Paladin.json)            │
├──────────────────────────────────────┤
│ habilidades_activas: [               │
│   {                                  │
│     id: "skill_id",                  │
│     modificadores: [                 │ ← Catálogo completo
│       { id: "mod_1", ... },          │
│       { id: "mod_2", ... },          │
│       { id: "mod_3", ... }           │
│     ]                                │
│   }                                  │
│ ]                                    │
└──────────────────────────────────────┘
          │
          │ Referencia
          ▼
┌──────────────────────────────────────┐
│ Personaje JSON (char_123.json)       │
├──────────────────────────────────────┤
│ habilidades_refs: {                  │
│   activas: [                         │
│     {                                │
│       skill_id: "skill_id",          │
│       modificadores_ids: [           │ ← Solo equipados
│         "mod_1",                     │
│         "mod_3"                      │
│       ]                              │
│     }                                │
│   ]                                  │
│ }                                    │
└──────────────────────────────────────┘
```

**Beneficios**:
- Sin duplicación de datos
- Actualizaciones en héroe se reflejan automáticamente
- Personajes más ligeros
- Coherencia entre personajes de la misma clase

## 🧪 Testing

### Flujo de Prueba Recomendado

1. **Importar habilidades con modificadores**
   - Usar JSON de ejemplo con modificadores
   - Verificar que se crean en catálogo del héroe
   - Verificar que se guardan IDs en personaje

2. **Seleccionar modificadores**
   - Expandir sección de modificadores
   - Equipar/desequipar mediante checkboxes
   - Verificar que badge actualiza contador

3. **Guardar y recargar**
   - Guardar personaje
   - Cerrar y reabrir CharacterDetail
   - Verificar que modificadores siguen equipados

4. **Verificar JSON del personaje**
   - Abrir archivo JSON del personaje
   - Verificar estructura de habilidades_refs.activas
   - Confirmar que modificadores_ids solo contiene equipados

## 📝 Migración de Datos Existentes

### Script de Migración (Recomendado)

```typescript
// Ejemplo de migración de personajes v0.3.5 → v0.3.6
function migratePersonajeV035ToV036(personaje: any) {
  if (personaje.habilidades_refs?.activas) {
    // Si activas es array de strings, convertir a objetos
    if (typeof personaje.habilidades_refs.activas[0] === 'string') {
      personaje.habilidades_refs.activas = personaje.habilidades_refs.activas.map(
        (skillId: string) => ({
          skill_id: skillId,
          modificadores_ids: []  // Sin modificadores inicialmente
        })
      );
    }
  }
  return personaje;
}
```

### Migración Manual

Para cada archivo de personaje:
1. Abrir JSON
2. Localizar `habilidades_refs.activas`
3. Transformar de `["skill_1", "skill_2"]` a:
   ```json
   [
     { "skill_id": "skill_1", "modificadores_ids": [] },
     { "skill_id": "skill_2", "modificadores_ids": [] }
   ]
   ```
4. Guardar archivo

## 🚀 Próximos Pasos

### Pendientes para Versiones Futuras

1. **Migración Automática**
   - Detectar versión del archivo de personaje
   - Migrar automáticamente al cargar
   - Mostrar advertencia al usuario

2. **Glifos y Aspectos**
   - Aplicar mismo modelo de tags globales
   - Eliminar `palabras_clave` de `Glifo` y `Aspecto`
   - Actualizar prompts de extracción

3. **Búsqueda Mejorada**
   - Buscar por tags en modificadores
   - Filtrar por tags de efectos
   - Búsqueda global en todas las entidades

4. **Validación de IDs**
   - Verificar que todos los modificadores tienen `id` único
   - Validar que `tipo_habilidad === "modificador"`
   - Alerts para datos inconsistentes

## 📖 Documentación Actualizada

- README.md: Actualizado con nueva estructura
- d4builds-project.md: Memoria del usuario actualizada
- Este CHANGELOG: Documenta todos los cambios

## ⚡ Performance

- **Sin impacto negativo**: Filtrado de modificadores es O(n) eficiente
- **Carga más rápida**: Solo se cargan modificadores necesarios
- **Menos memoria**: Referencias en lugar de datos duplicados

## 🐛 Bugs Corregidos

1. **Modificadores no se guardaban**: Ahora se guardan explícitamente en refs
2. **Type errors en CharacterDetail**: Actualizado para nueva estructura
3. **PromptService type mismatch**: Mapeo correcto de skill refs
4. **Variables unused**: Eliminadas en CharacterSkills.tsx

---

**Estado**: ✅ Compilación exitosa
**Testing**: ⚠️ Requiere testing manual del flujo completo
**Version**: v0.3.6
