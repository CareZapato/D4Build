# 🧪 D4Builds - Contexto de Testing

> **Última actualización:** 23 de abril de 2026  
> **Versión:** 0.8.2  
> **Propósito:** Documentación completa para testing de funciones de importación y servicios

---

## 📋 Tabla de Contenidos

1. [Arquitectura de Testing](#arquitectura-de-testing)
2. [Funciones Críticas a Testear](#funciones-críticas-a-testear)
3. [Datos de Prueba](#datos-de-prueba)
4. [Casos de Prueba por Servicio](#casos-de-prueba-por-servicio)
5. [Ubicación de JSON de Prueba](#ubicación-de-json-de-prueba)
6. [Validaciones Esperadas](#validaciones-esperadas)

---

## 🏗️ Arquitectura de Testing

### Estructura de Carpetas de Prueba

```
C:\Users\pxret\Documents\D4builds\imagenes\
├── aspectos/          - JSON de aspectos legendarios (13 archivos)
├── build/             - JSON de equipamiento y builds
├── estadisticas/      - JSON de stats de personajes (15 archivos)
├── gemas_runas/       - JSON de gemas y runas
├── glifos/            - JSON de glifos Paragon (6 archivos)
├── mundo/             - JSON del sistema de mundo (3 archivos)
├── otros/             - Otros tipos de datos
├── paragon/           - JSON de tableros y nodos Paragon (13 archivos)
├── runas/             - JSON específico de runas
└── skills/            - JSON de habilidades (6 archivos)
```

---

## 🎯 Funciones Críticas a Testear

### 1. WorkspaceService (src/services/WorkspaceService.ts)

#### Funciones de Personaje
```typescript
// CRUD de Personajes
static async savePersonaje(personaje: Personaje): Promise<void>
static async savePersonajeMerge(personaje: Personaje): Promise<void>
static async loadPersonaje(id: string): Promise<Personaje | null>

// Pruebas requeridas:
// - Crear personaje nuevo
// - Actualizar personaje existente (merge)
// - Cargar personaje por ID
// - Manejar personaje no encontrado
// - Validar campos requeridos (id, nombre, clase, nivel)
```

#### Funciones de Héroe (Datos Maestro)
```typescript
// Habilidades
static async saveHeroSkills(clase: string, habilidades: HabilidadesPersonaje): Promise<void>
static async loadHeroSkills(clase: string): Promise<HabilidadesPersonaje | null>

// Glifos
static async saveHeroGlyphs(clase: string, glifos: GlifosHeroe): Promise<void>
static async loadHeroGlyphs(clase: string): Promise<GlifosHeroe | null>

// Aspectos
static async saveHeroAspects(clase: string, aspectos: AspectosHeroe): Promise<void>
static async loadHeroAspects(clase: string): Promise<AspectosHeroe | null>

// Mecánicas de Clase
static async saveHeroClassMechanics(clase: string, mecanicas: MecanicasClaseHeroe): Promise<void>
static async loadHeroClassMechanics(clase: string): Promise<MecanicasClaseHeroe | null>

// Runas
static async saveHeroRunes(clase: string, runas: RunasHeroe): Promise<void>
static async loadHeroRunes(clase: string): Promise<RunasHeroe>

// Gemas
static async saveHeroGems(clase: string, gemas: GemasHeroe): Promise<void>
static async loadHeroGems(clase: string): Promise<GemasHeroe>

// Talismanes
static async saveHeroCharms(clase: string, charms: CharmsHeroe): Promise<void>
static async loadHeroCharms(clase: string): Promise<CharmsHeroe | null>

static async saveHeroHoradricSeal(clase: string, seal: HoradricSealHeroe): Promise<void>
static async loadHeroHoradricSeal(clase: string): Promise<HoradricSealHeroe | null>

// Paragon
static async saveParagonBoards(clase: string, tableros: any): Promise<void>
static async loadParagonBoards(clase: string): Promise<any | null>

static async saveParagonNodes(clase: string, nodos: any): Promise<void>
static async loadParagonNodes(clase: string): Promise<any | null>

// Pruebas requeridas para cada función:
// - Guardar datos válidos
// - Cargar datos guardados
// - Actualizar datos existentes
// - Manejar clase no válida
// - Validar estructura de datos
// - Verificar persistencia
```

#### Funciones de Mundo
```typescript
static async loadWorldData(type: string): Promise<any>
static async saveWorldData(type: string, data: any): Promise<void>

// Pruebas requeridas:
// - Guardar eventos del mundo
// - Cargar datos de mundo
// - Actualizar índice de recursos
// - Validar tipos de eventos (guarida, mazmorra, etc.)
```

### 2. WorldService (src/services/WorldService.ts)

```typescript
// Importación desde JSON
static async importFromJSON(jsonData: any): Promise<void>

// Pruebas requeridas:
// - Importar eventos válidos
// - Importar recursos
// - Validar estructura de eventos
// - Manejar JSON malformado
// - Verificar requisitos y recompensas
```

### 3. KeywordsService (src/services/KeywordsService.ts)

```typescript
static async importKeywordsFromJSON(data: { palabras_clave?: Array<{palabra: string, descripcion: string, categoria?: string}>}): Promise<number>

// Pruebas requeridas:
// - Importar palabras clave
// - Validar categorías
// - Manejar duplicados
// - Retornar conteo correcto
```

---

## 📊 Datos de Prueba

### 1. Estadísticas de Personaje

**Archivo de prueba:** `C:\Users\pxret\Documents\D4builds\imagenes\estadisticas\estadisticas_1776459260625.json`

```json
{
  "estadisticas": {
    "ofensivo": {
      "danioConCorrupcion": 49.0,
      "danioVsEnemigosCercanos": 38.5,
      "danioVsEnemigosElite": 111.8,
      "danioVsEnemigosSaludables": 16.0,
      "espinas": 1179,
      "detalles": [...]
    },
    "defensivo": {
      "vidaMaxima": 12000,
      "armadura": 8500,
      ...
    },
    "atributosPrincipales": {
      "nivel": 100,
      "fuerza": 520,
      "inteligencia": 180,
      "voluntad": 390,
      "destreza": 250
    },
    "personaje": {
      "danioArma": 595,
      "aguante": 52619
    }
  },
  "nivel_paragon": 150
}
```

**Casos de prueba:**
- ✅ Importar stats completas
- ✅ Extraer nivel (atributosPrincipales.nivel)
- ✅ Extraer nivel paragon (nivel_paragon)
- ✅ Validar campos numéricos
- ✅ Manejar campos opcionales (detalles)

### 2. Habilidades (Skills)

**Archivo de prueba:** `C:\Users\pxret\Documents\D4builds\imagenes\skills\skills_1776459319051.json`

```json
{
  "habilidades_activas": [
    {
      "id": "skill_activa_aura_luz_sagrada",
      "nombre": "Aura de Luz Sagrada",
      "tipo_habilidad": "skill",
      "tipo": "Defensiva",
      "rama": "Justiciero",
      "nivel_actual": 1,
      "nivel_maximo": 5,
      "descripcion": "...",
      "tipo_danio": "Sagrado",
      "tags": [],
      "modificadores": [
        {
          "id": "mod_luz_sagrada_potenciada",
          "nombre": "Luz Sagrada Potenciada",
          "tipo_habilidad": "modificador",
          "descripcion": "...",
          "tags": []
        }
      ]
    }
  ],
  "habilidades_pasivas": [
    {
      "id": "skill_pasiva_longevidad",
      "nombre": "Longevidad",
      "tipo_habilidad": "pasiva",
      "tipo": "Pasiva",
      "rama": null,
      "nivel": 3,
      "nivel_maximo": 3,
      "efecto": "Obtienes un 30% de la sanación recibida.",
      "puntos_asignados": 3,
      "tags": []
    }
  ],
  "palabras_clave": [
    {
      "tag": "fortificar",
      "texto_original": "fortificar",
      "significado": "Fortificar es una reserva adicional de Vida...",
      "categoria": "mecanica",
      "fuente": "tooltip"
    }
  ]
}
```

**Casos de prueba:**
- ✅ Importar habilidades activas y pasivas
- ✅ Validar modificadores
- ✅ Extraer palabras clave
- ✅ Verificar IDs únicos
- ✅ Validar niveles (actual <= maximo)

### 3. Glifos Paragon

**Archivo de prueba:** `C:\Users\pxret\Documents\D4builds\imagenes\glifos\glifos_1776459368714.json`

```json
{
  "glifos": [
    {
      "id": "glifo_disminucion",
      "nombre": "Disminución",
      "rareza": "Raro",
      "nivel_requerido": 1,
      "efecto_base": "Otorga una bonificación del +25.0% a todos los nodos raros dentro del alcance.",
      "atributo_escalado": null,
      "bonificacion_adicional": {
        "requisito": "40 de Fuerza",
        "descripcion": "Recibes un 15% menos de daño físico de enemigos vulnerables."
      },
      "bonificacion_legendaria": {
        "requisito": null,
        "descripcion": "Aumenta el daño contra objetivos vulnerables un 5.0%."
      },
      "tamano_radio": "3",
      "requisitos_especiales": null,
      "estado": "Encontrado",
      "tags": ["vulnerables"]
    }
  ]
}
```

**Casos de prueba:**
- ✅ Importar glifos con todas las propiedades
- ✅ Validar rareza (Raro, Legendario)
- ✅ Manejar bonificaciones opcionales
- ✅ Verificar atributo_escalado
- ✅ Validar tags

### 4. Aspectos Legendarios

**Archivo de prueba:** `C:\Users\pxret\Documents\D4builds\imagenes\aspectos\aspectos_1776473241311.json`

```json
{
  "aspectos": [
    {
      "id": "aspecto_sabio_concurrido",
      "name": "Aspecto del Sabio Concurrido",
      "shortName": "del Sabio Concurrido",
      "effect": "Tienes un 8% más de probabilidad de esquivar. Cada vez que logras esquivar restauras un 17% [5 - 25]% de tu Vida máxima.",
      "level": "13/21",
      "category": "defensivo",
      "tags": []
    },
    {
      "id": "aspecto_valintyr",
      "name": "Aspecto del Valintyr",
      "shortName": "del Valintyr",
      "effect": "Las habilidades de Justicia infligen un 77.0% [60.0 - 80.0]% más de daño.",
      "level": "18/21",
      "category": "ofensivo",
      "tags": []
    }
  ]
}
```

**Casos de prueba:**
- ✅ Importar aspectos con categorías
- ✅ Validar categorías (ofensivo, defensivo, recurso, utilidad, movilidad)
- ✅ Parsear formato level (X/Y)
- ✅ Validar shortName
- ✅ Extraer rangos de valores [min - max]

### 5. Eventos del Mundo

**Archivo de prueba:** `C:\Users\pxret\Documents\D4builds\imagenes\mundo\mundo_1776701703344.json`

```json
{
  "eventos": [
    {
      "id": "guarida_heraldo_odio",
      "nombre": "Guarida del Heraldo",
      "tipo": "guarida",
      "boss": "Heraldo del Odio",
      "ubicacion": null,
      "objetivo": {
        "tipo": "kill",
        "descripcion": "Derrotar a este jefe de guarida...",
        "progreso": null
      },
      "requisitos": [
        {
          "tipo": "llave",
          "nombre": "Corazón Abominable",
          "cantidad": 12,
          "id_recurso": "recurso_corazon_abominable"
        }
      ],
      "recompensas": [
        {
          "tipo": "loot",
          "nombre": "Objetos ancestrales únicos",
          "cantidad": null,
          "probabilidad": "media",
          "garantizado": false,
          "id_recurso": "recurso_loot_ancestral"
        }
      ],
      "nivel_recomendado": null,
      "dificultad": null,
      "tiempo_estimado": null,
      "tags": ["boss", "endgame"],
      "notas": "..."
    }
  ],
  "indice_recursos": []
}
```

**Casos de prueba:**
- ✅ Importar eventos del mundo
- ✅ Validar tipos (guarida, mazmorra, etc.)
- ✅ Verificar requisitos y recompensas
- ✅ Validar estructura de objetivo
- ✅ Procesar tags correctamente

---

## 🧪 Casos de Prueba por Servicio

### WorkspaceService - Personajes

#### Test 1: Crear personaje nuevo
```typescript
const nuevoPersonaje: Personaje = {
  id: "test_personaje_001",
  nombre: "Paladín de Prueba",
  clase: "Paladín",
  nivel: 50,
  nivel_paragon: 100,
  fecha_creacion: new Date().toISOString(),
  fecha_actualizacion: new Date().toISOString(),
  ultima_actualizacion: new Date().toISOString()
};

// Ejecutar
await WorkspaceService.savePersonaje(nuevoPersonaje);

// Validar
const cargado = await WorkspaceService.loadPersonaje("test_personaje_001");
expect(cargado).not.toBeNull();
expect(cargado.nombre).toBe("Paladín de Prueba");
expect(cargado.nivel).toBe(50);
```

#### Test 2: Merge de estadísticas
```typescript
const personajeConStats: Personaje = {
  ...nuevoPersonaje,
  estadisticas: {
    atributosPrincipales: {
      nivel: 50,
      fuerza: 500,
      inteligencia: 180,
      voluntad: 350,
      destreza: 220
    },
    personaje: {
      danioArma: 595,
      aguante: 52619
    }
  }
};

// Ejecutar
await WorkspaceService.savePersonajeMerge(personajeConStats);

// Validar
const cargado = await WorkspaceService.loadPersonaje("test_personaje_001");
expect(cargado.estadisticas).toBeDefined();
expect(cargado.estadisticas.atributosPrincipales.nivel).toBe(50);
```

### WorkspaceService - Habilidades de Héroe

#### Test 3: Importar habilidades de Paladín
```typescript
const habilidades: HabilidadesPersonaje = {
  clase: "Paladín",
  habilidades_activas: [
    {
      id: "test_skill_001",
      nombre: "Aura de Luz Sagrada",
      tipo_habilidad: "skill",
      tipo: "Defensiva",
      rama: "Justiciero",
      nivel_actual: 1,
      nivel_maximo: 5,
      descripcion: "Descripción de prueba",
      tipo_danio: "Sagrado",
      tags: [],
      modificadores: []
    }
  ],
  habilidades_pasivas: [],
  palabras_clave: []
};

// Ejecutar
await WorkspaceService.saveHeroSkills("Paladín", habilidades);

// Validar
const cargadas = await WorkspaceService.loadHeroSkills("Paladín");
expect(cargadas).not.toBeNull();
expect(cargadas.habilidades_activas).toHaveLength(1);
expect(cargadas.habilidades_activas[0].nombre).toBe("Aura de Luz Sagrada");
```

### WorkspaceService - Glifos de Héroe

#### Test 4: Importar glifos
```typescript
const glifos: GlifosHeroe = {
  clase: "Paladín",
  glifos: [
    {
      id: "test_glifo_001",
      nombre: "Disminución",
      rareza: "Raro",
      nivel_requerido: 1,
      efecto_base: "Otorga bonificación del +25.0%",
      bonificacion_adicional: {
        requisito: "40 de Fuerza",
        descripcion: "Recibes un 15% menos de daño físico"
      },
      tamano_radio: "3",
      estado: "Encontrado",
      tags: ["vulnerables"]
    }
  ]
};

// Ejecutar
await WorkspaceService.saveHeroGlyphs("Paladín", glifos);

// Validar
const cargados = await WorkspaceService.loadHeroGlyphs("Paladín");
expect(cargados).not.toBeNull();
expect(cargados.glifos).toHaveLength(1);
expect(cargados.glifos[0].rareza).toBe("Raro");
```

### WorkspaceService - Aspectos de Héroe

#### Test 5: Importar aspectos con categorías
```typescript
const aspectos: AspectosHeroe = {
  clase: "Paladín",
  aspectos: [
    {
      id: "test_aspecto_001",
      name: "Aspecto del Sabio Concurrido",
      shortName: "del Sabio Concurrido",
      effect: "Tienes un 8% más de probabilidad de esquivar",
      level: "13/21",
      category: "defensivo",
      tags: []
    },
    {
      id: "test_aspecto_002",
      name: "Aspecto del Valintyr",
      shortName: "del Valintyr",
      effect: "Las habilidades de Justicia infligen un 77.0% más de daño",
      level: "18/21",
      category: "ofensivo",
      tags: []
    }
  ]
};

// Ejecutar
await WorkspaceService.saveHeroAspects("Paladín", aspectos);

// Validar
const cargados = await WorkspaceService.loadHeroAspects("Paladín");
expect(cargados).not.toBeNull();
expect(cargados.aspectos).toHaveLength(2);
expect(cargados.aspectos[0].category).toBe("defensivo");
expect(cargados.aspectos[1].category).toBe("ofensivo");
```

### WorldService - Eventos

#### Test 6: Importar eventos del mundo
```typescript
const datosmund = {
  eventos: [
    {
      id: "test_evento_001",
      nombre: "Guarida del Heraldo",
      tipo: "guarida",
      boss: "Heraldo del Odio",
      objetivo: {
        tipo: "kill",
        descripcion: "Derrotar al jefe",
        progreso: null
      },
      requisitos: [
        {
          tipo: "llave",
          nombre: "Corazón Abominable",
          cantidad: 12,
          id_recurso: "recurso_corazon_abominable"
        }
      ],
      recompensas: [
        {
          tipo: "loot",
          nombre: "Objetos ancestrales únicos",
          probabilidad: "media",
          garantizado: false
        }
      ],
      tags: ["boss", "endgame"]
    }
  ],
  indice_recursos: []
};

// Ejecutar
await WorldService.importFromJSON(datosMundo);

// Validar
const cargados = await WorkspaceService.loadWorldData('world_data');
expect(cargados.eventos).toHaveLength(1);
expect(cargados.eventos[0].tipo).toBe("guarida");
expect(cargados.eventos[0].requisitos[0].cantidad).toBe(12);
```

---

## ✅ Validaciones Esperadas

### Validaciones Generales

1. **IDs únicos:**
   - Todos los elementos deben tener IDs únicos
   - Formato: `tipo_nombre_normalizado`

2. **Campos requeridos:**
   - Personaje: `id`, `nombre`, `clase`, `nivel`
   - Habilidad: `id`, `nombre`, `tipo_habilidad`
   - Glifo: `id`, `nombre`, `rareza`
   - Aspecto: `id`, `name`, `category`

3. **Tipos de datos:**
   - Niveles: números enteros > 0
   - Categorías: valores de enum específicos
   - Fechas: formato ISO string

### Validaciones por Tipo

#### Personaje
- ✅ `nivel`: 1-60
- ✅ `nivel_paragon`: 0-300
- ✅ `clase`: valor válido del enum
- ✅ `fecha_creacion`: fecha válida

#### Habilidades
- ✅ `nivel_actual <= nivel_maximo`
- ✅ `tipo`: valor válido (Activa, Pasiva, Modificador)
- ✅ `rama`: string o null

#### Glifos
- ✅ `rareza`: "Raro" o "Legendario"
- ✅ `tamano_radio`: string numérico
- ✅ `bonificacion_adicional`: objeto válido o null

#### Aspectos
- ✅ `category`: "ofensivo" | "defensivo" | "recurso" | "utilidad" | "movilidad"
- ✅ `level`: formato "X/Y" donde X <= Y

#### Eventos del Mundo
- ✅ `tipo`: "guarida" | "mazmorra" | "evento" | "otro"
- ✅ `requisitos`: array de objetos válidos
- ✅ `recompensas`: array de objetos válidos

---

## 📍 Ubicación de JSON de Prueba

### JSON Reales de Testing (Workspace del Usuario)

**Ruta base:** `C:\Users\pxret\Documents\D4builds\imagenes\`

#### Estadísticas (15 archivos)
- `estadisticas/estadisticas_1776459260625.json` ⭐ RECOMENDADO
- `estadisticas/estadisticas_1776464102685.json`
- `estadisticas/estadísticas_1776108168916.json`
- ... (12 archivos más)

#### Habilidades (6 archivos)
- `skills/skills_1776459319051.json` ⭐ RECOMENDADO
- `skills/skills_1776463588781.json`
- `skills/habilidades_1776132587468.json`
- ... (3 archivos más)

#### Glifos (6 archivos)
- `glifos/glifos_1776459368714.json` ⭐ RECOMENDADO
- `glifos/glifos_1776493225980.json`
- `glifos/glifos_1776133237586.json`
- ... (3 archivos más)

#### Aspectos (13 archivos)
- `aspectos/aspectos_1776473241311.json` ⭐ RECOMENDADO
- `aspectos/aspectos_1776133904112.json`
- `aspectos/aspectos_1776134219001.json`
- ... (10 archivos más)

#### Mundo (3 archivos)
- `mundo/mundo_1776701703344.json` ⭐ RECOMENDADO
- `mundo/mundo_1776894379764.json`
- `mundo/mundo_1776895786703.json`

#### Paragon (13 archivos)
- `paragon/paragon_1776459863772.json` ⭐ RECOMENDADO
- `paragon/paragon_1776222926933.json`
- ... (11 archivos más)

### JSON en el Proyecto (Ejemplos)

**Ruta base:** `G:\Proyectos\D4Builds\ejemplos\`

- `Paladín_aspectos.json`
- `Paladín_glifos.json`
- `Paladín_habilidades.json`
- `Paladín_paragon_nodos.json`
- `Bárbaro_aspectos.json`

---

## 🔧 Implementación de Tests

### Estructura Recomendada

```
src/
├── __tests__/
│   ├── services/
│   │   ├── WorkspaceService.test.ts
│   │   ├── WorldService.test.ts
│   │   ├── KeywordsService.test.ts
│   │   └── TagLinkingService.test.ts
│   ├── fixtures/
│   │   ├── personaje-test.json
│   │   ├── habilidades-test.json
│   │   ├── glifos-test.json
│   │   ├── aspectos-test.json
│   │   └── mundo-test.json
│   └── utils/
│       ├── testHelpers.ts
│       └── mockData.ts
```

### Framework Recomendado

- **Jest** o **Vitest** para unit testing
- **Testing Library** para componentes React
- **MSW** (Mock Service Worker) para APIs

### Ejemplo de Configuración

```typescript
// src/__tests__/services/WorkspaceService.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkspaceService } from '../../services/WorkspaceService';
import { Personaje } from '../../types';

describe('WorkspaceService - Personajes', () => {
  beforeEach(() => {
    // Setup: limpiar workspace de prueba
  });

  afterEach(() => {
    // Teardown: limpiar datos de prueba
  });

  it('debe crear un personaje nuevo', async () => {
    const personaje: Personaje = {
      id: "test_001",
      nombre: "Test Paladín",
      clase: "Paladín",
      nivel: 50,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };

    await WorkspaceService.savePersonaje(personaje);
    const cargado = await WorkspaceService.loadPersonaje("test_001");

    expect(cargado).not.toBeNull();
    expect(cargado?.nombre).toBe("Test Paladín");
  });

  it('debe actualizar personaje con merge', async () => {
    // Test de merge...
  });

  it('debe manejar personaje no encontrado', async () => {
    const resultado = await WorkspaceService.loadPersonaje("no_existe");
    expect(resultado).toBeNull();
  });
});
```

---

## 📝 Notas Adicionales

### Prioridad de Testing

1. **Alta prioridad:**
   - WorkspaceService (save/load de personajes y héroes)
   - Importación de estadísticas
   - Importación de habilidades

2. **Media prioridad:**
   - WorldService (eventos)
   - KeywordsService
   - TagLinkingService

3. **Baja prioridad:**
   - Servicios de UI
   - Helpers y utilidades

### Consideraciones Especiales

- **File System Access API**: Mock necesario para entorno de testing
- **LocalStorage**: Usar `localStorage` mock o library especializada
- **Fechas**: Usar fechas fijas en tests para consistencia
- **IDs**: Usar IDs predecibles en tests (test_001, test_002, etc.)

---

## 🎯 Próximos Pasos

1. ✅ Documentar funciones de importación
2. ✅ Identificar JSON de prueba
3. ⏳ Implementar tests unitarios
4. ⏳ Crear fixtures de datos
5. ⏳ Implementar tests de integración
6. ⏳ Configurar CI/CD con tests

---

**Última actualización:** 23 de abril de 2026  
**Mantenido por:** Zapato
