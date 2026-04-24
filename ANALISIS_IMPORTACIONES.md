# ANÁLISIS EXHAUSTIVO DE IMPORTACIONES - D4Builds

## 📋 CATEGORÍAS Y SUBCATEGORÍAS

### 1. **SKILLS (Habilidades)**
- **Prompt**: `generateFullSkillsPrompt()` - incluye activas Y pasivas juntas
- **Formato JSON esperado**:
  ```json
  {
    "habilidades_activas": [
      {
        "id": "skill_activa_luz_sagrada",
        "nombre": "Luz Sagrada",
        "tipo_habilidad": "skill",
        "tipo": "Básica",
        "rama": "Invocación",
        "nivel_actual": 5,
        "nivel_maximo": 5,
        "descripcion": "...",
        "tipo_danio": "Sagrado",
        "costo_recurso": { "tipo": "Fe", "cantidad": 20 },
        "modificadores": [
          {
            "id": "mod_luz_sagrada_potenciada",
            "nombre": "Luz Sagrada Potenciada",
            "tipo_habilidad": "modificador",
            "descripcion": "...",
            "tags": ["fortificar"]
          }
        ],
        "tags": []
      }
    ],
    "habilidades_pasivas": [
      {
        "id": "pasiva_resistencia_inquebrantable",
        "nombre": "Resistencia Inquebrantable",
        "tipo_habilidad": "pasiva",
        "tipo": "Pasiva",
        "rama": "Defensa",
        "nivel": 1,
        "nivel_maximo": 3,
        "efecto": "...",
        "puntos_asignados": 3,
        "tags": []
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**:
  - **Para HÉROE**: Guarda en `heroe.habilidades_activas` y `heroe.habilidades_pasivas` (objetos completos)
  - **Para PERSONAJE**: Guarda en `personaje.habilidades_refs.activas` y `personaje.habilidades_refs.pasivas` (solo IDs)

---

### 2. **GLIFOS**
- **Prompt**: `generateGlyphsPrompt()` - MISMO para héroe y personaje
- **Formato JSON esperado**:
  ```json
  {
    "glifos": [
      {
        "id": "glifo_dominio",
        "nombre": "Dominio",
        "rareza": "Legendario",
        "nivel_requerido": 1,
        "efecto_base": "...",
        "atributo_escalado": {
          "atributo": "Inteligencia",
          "bonificacion": "..."
        },
        "bonificacion_adicional": {
          "requisito": "25 puntos de Inteligencia",
          "descripcion": "..."
        },
        "bonificacion_legendaria": {
          "requisito": "40 puntos de Inteligencia",
          "descripcion": "..."
        },
        "detalles": [
          {
            "texto": "...",
            "activo": true,
            "valor": "9.6%"
          }
        ],
        "tamano_radio": "5 nodos",
        "estado": "Encontrado",
        "tags": ["control_de_masas", "barrera"]
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**:
  - **Para HÉROE**: Guarda en `heroe.glifos` (objetos completos)
  - **Para PERSONAJE**: Guarda en `personaje.glifos_refs` (solo `{id, nivel_actual, nivel_maximo}`)

---

### 3. **ASPECTOS**
#### 3.1. Para Héroe (Catálogo)
- **Prompt**: `generateAspectsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "aspectos": [
      {
        "id": "aspecto_recursos_abundantes",
        "name": "Aspecto de Recursos Abundantes",
        "shortName": "de Recursos Abundantes",
        "effect": "...",
        "level": "15/21",
        "category": "recurso",
        "keywords": ["recurso", "daño"],
        "tags": ["recurso", "daño"]
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en `heroe.aspectos` (objetos completos)

#### 3.2. Para Personaje (Equipados)
- **Prompt**: `generateCharacterAspectsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "aspectos_equipados": [
      {
        "aspecto_id": "aspecto_recursos_abundantes",
        "name": "Aspecto de Recursos Abundantes",
        "shortName": "de Recursos Abundantes",
        "nivel_actual": "15/21",
        "category": "recurso",
        "effect": "...",
        "slot_equipado": "Amuleto",
        "valores_actuales": {
          "danio_por_punto": "3.2%",
          "danio_maximo": "64%"
        },
        "detalles": [...],
        "tags": ["recurso", "daño"]
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en `personaje.aspectos_equipados` o `personaje.build.piezas[slot].aspecto_id`

---

### 4. **ESTADÍSTICAS**
- **Prompt**: `generateStatsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "estadisticas": {
      "personaje": {
        "danioArma": 496,
        "aguante": 52619,
        "aguante_definicion": "...",
        "detalles": [...]
      },
      "atributosPrincipales": {
        "nivel": 60,
        "nivel_paragon": 150,
        "fuerza": 1670,
        "inteligencia": 208,
        "voluntad": 892,
        "destreza": 456,
        "detalles": [...]
      },
      "armaduraYResistencias": {...},
      "ofensivo": {...},
      "defensivo": {...},
      "utilidad": {...},
      "jcj": {...},
      "moneda": {...}
    },
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en `personaje.estadisticas` + extrae `nivel` y `nivel_paragon` a nivel raíz

---

### 5. **MECÁNICAS DE CLASE**
- **Prompt**: `generateClassMechanicsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "mecanicas_clase": [
      {
        "mecanica_id": "mecanica_espiritu_protector",
        "nombre": "Espíritu Protector",
        "tipo": "recurso_secundario",
        "descripcion": "...",
        "valor_actual": 50,
        "valor_maximo": 100,
        "bonificaciones": [...],
        "tags": []
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en `personaje.mecanicas_clase_refs`

---

### 6. **MUNDO (Eventos)**
#### 6.1. Eventos del Mundo
- **Prompt**: `generateWorldEventsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "eventos": [
      {
        "id": "evento_guarida_duriel",
        "nombre": "Guarida de Duriel",
        "tipo": "guarida",
        "subtipo": "boss",
        "objetivo": "...",
        "requisitos": [
          {
            "tipo": "recurso",
            "nombre": "Fragmento de Agonía Purulenta",
            "cantidad": 2,
            "id_recurso": "fragmento_agonia_purulenta"
          }
        ],
        "recompensas": [
          {
            "tipo": "objeto",
            "nombre": "Aspecto Único",
            "id_recurso": "aspecto_unico_boss",
            "probabilidad": "alta",
            "garantizado": false
          }
        ],
        "tiempo": {
          "expira_en": null,
          "tiempo_completar": "5-10 minutos",
          "cooldown": null
        },
        "dificultad": "tortura",
        "repetible": true,
        "tags": ["boss", "endgame"]
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en workspace global (WorldService.importFromJSON)

#### 6.2. Mazmorras con Aspectos
- **Prompt**: `generateDungeonAspectsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "mazmorras": [
      {
        "id": "mazmorra_ruinas_eridu",
        "nombre": "Ruinas de Eridu",
        "ubicacion": "Kehjistan",
        "aspecto_recompensa": {
          "id": "aspecto_velo_definitivo",
          "nombre": "Aspecto del Velo Definitivo",
          "categoria": "defensivo"
        },
        "nivel_recomendado": 35,
        "tags": ["mazmorra", "aspecto"]
      }
    ]
  }
  ```
- **Importación**: Guarda en WorldService con merge

---

### 7. **PARAGON**
#### 7.1. Tableros Paragon
- **Prompt**: `generateParagonBoardsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "tableros": [
      {
        "tablero_id": "tablero_inicio",
        "nombre": "Tablero de Inicio",
        "tipo": "inicio",
        "descripcion": "...",
        "nodos_totales": 127,
        "nodos_desbloqueables": 85,
        "puntos_paragon_requeridos": 0,
        "tags": []
      }
    ]
  }
  ```
- **Importación**: Guarda en `heroe.tableros_paragon` (catálogo)

#### 7.2. Nodos Paragon
- **Prompt**: `generateParagonNodesPrompt()` - detecta rareza automáticamente
- **Formato JSON esperado**:
  ```json
  {
    "nodos": [
      {
        "nodo_id": "nodo_fuerza_01",
        "nombre": "Fuerza",
        "rareza": "normal",
        "tipo": "atributo",
        "tablero_id": "tablero_inicio",
        "bonificaciones": [
          {
            "atributo": "Fuerza",
            "valor": "+5"
          }
        ],
        "posicion": { "x": 0, "y": 1 },
        "tags": []
      }
    ]
  }
  ```
- **Importación**: Guarda en `heroe.nodos_paragon` (catálogo)

#### 7.3. Atributos Paragon del Personaje
- **Prompt**: `generateParagonCharacterPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "paragon": {
      "nivel_paragon": 150,
      "puntos_disponibles": 5,
      "puntos_usados": 145,
      "atributos": {
        "fuerza": 50,
        "inteligencia": 20,
        "voluntad": 35,
        "destreza": 15
      },
      "tableros_equipados": [
        {
          "tablero_id": "tablero_inicio",
          "posicion_slot": 1,
          "rotacion": 0,
          "nodos_activados": ["nodo_fuerza_01", "nodo_vida_01"],
          "glifos_equipados": [
            {
              "glifo_id": "glifo_dominio",
              "socket_id": "socket_central",
              "nivel_actual": 21,
              "nivel_maximo": 21
            }
          ]
        }
      ],
      "stats_adicionales": {...}
    }
  }
  ```
- **Importación**: Guarda en `personaje.paragon`

---

### 8. **RUNAS Y GEMAS**
#### 8.1. Runas
- **Prompt**: `generateRunesPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "runas": [
      {
        "id": "runa_yom",
        "nombre": "Yom",
        "rareza": "legendaria",
        "tipo": "invocacion",
        "efecto": "...",
        "descripcion": "...",
        "objeto_origen": "Invoca Golem de Huesos",
        "tags": ["invocacion", "golem"]
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en `workspace.gemas_runas_catalogo.runas` (catálogo global)

#### 8.2. Gemas
- **Prompt**: `generateGemsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "gemas": [
      {
        "id": "gema_rubi",
        "nombre": "Rubí",
        "tipo": "rubi",
        "calidad": 5,
        "efectos_por_slot": {
          "arma": "Aumenta daño abrumador en un 8%",
          "armadura": "Aumenta vida máxima en un 4%",
          "joyas": "Aumenta resistencia a Fuego en un 6%"
        },
        "tags": ["gema", "fuego"]
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en `workspace.gemas_runas_catalogo.gemas` (catálogo global)

---

### 9. **TALISMANES**
#### 9.1. Charms (Talismanes)
- **Prompt**: `generateCharmsPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "talismanes": [
      {
        "id": "charm_narrow_eye_fer",
        "nombre": "Fer of the Narrow Eye",
        "rareza": "set",
        "stats": [
          {
            "nombre": "Critical Strike Damage",
            "valor": "15%",
            "rango": "[10-20%]"
          }
        ],
        "efectos": [
          {
            "tipo": "stacking",
            "descripcion": "...",
            "condicion": "Por cada hit crítico",
            "tags": ["critico", "stacking"]
          }
        ],
        "set": {
          "nombre": "Narrow Eye",
          "piezas": ["Fer", "Mot", "Lac", "Poc"],
          "bonus": [
            {
              "piezas_requeridas": 2,
              "descripcion": "..."
            }
          ]
        },
        "tags": ["set", "critico"]
      }
    ],
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en workspace global (talismanes)

#### 9.2. Horadric Seal
- **Prompt**: `generateHoradricSealPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "horadric_seal": {
      "id": "horadric_seal_honor",
      "nombre": "Horadric Seal of Honor",
      "tipo": "horadric_seal",
      "rareza": "legendary",
      "slots": 5,
      "stats": [
        {
          "nombre": "Total Armor",
          "valor": 45
        }
      ],
      "bonus": [
        {
          "descripcion": "Charm Set: Dark Pact otorga daño adicional",
          "tags": ["set", "damage", "dark_pact"]
        }
      ],
      "reglas": [
        {
          "tipo": "restriccion",
          "descripcion": "No puede tener más de 5 sockets"
        },
        {
          "tipo": "bonus",
          "descripcion": "Los charms de set otorgan 5% más de efecto"
        }
      ],
      "nivel_requerido": 60,
      "tags": ["horadric", "seal", "legendary"]
    },
    "palabras_clave": [...]
  }
  ```
- **Importación**: Guarda en `personaje.horadric_seal`

---

### 10. **BUILD (Equipamiento)**
- **Prompt**: `generateEquipmentPrompt()`
- **Formato JSON esperado**:
  ```json
  {
    "build": {
      "piezas": {
        "cabeza": {
          "espacio": "cabeza",
          "nombre": "Casco de las Sombras",
          "rareza": "legendaria",
          "poder": 925,
          "stats": [...],
          "engarces": [
            {
              "tipo": "gema",
              "gema_id": "gema_rubi",
              "calidad": 5
            }
          ],
          "aspecto_id": "aspecto_velocidad",
          "nivel": 100
        },
        "pecho": {...},
        ...
      },
      "runas_equipadas": [
        {
          "runa_id": "runa_yom",
          "vinculada_a": "arma"
        }
      ]
    }
  }
  ```
- **Importación**: Guarda en `personaje.build`

---

## 🎯 CASOS A TESTEAR

### Tests por Categoría

1. **Skills** (2 casos):
   - Importar para HÉROE (guarda objetos completos)
   - Importar para PERSONAJE (guarda solo refs)

2. **Glifos** (2 casos):
   - Importar para HÉROE (guarda objetos completos)
   - Importar para PERSONAJE (guarda refs con nivel_actual)

3. **Aspectos** (2 casos):
   - Importar catálogo para HÉROE (generateAspectsPrompt)
   - Importar equipados para PERSONAJE (generateCharacterAspectsPrompt)

4. **Estadísticas** (1 caso):
   - Importar para PERSONAJE (valida nivel + nivel_paragon)

5. **Mecánicas** (1 caso):
   - Importar para PERSONAJE

6. **Mundo** (2 casos):
   - Importar eventos (generateWorldEventsPrompt)
   - Importar mazmorras (generateDungeonAspectsPrompt)

7. **Paragon** (3 casos):
   - Importar tableros para HÉROE (generateParagonBoardsPrompt)
   - Importar nodos para HÉROE (generateParagonNodesPrompt)
   - Importar atributos paragon para PERSONAJE (generateParagonCharacterPrompt)

8. **Runas/Gemas** (2 casos):
   - Importar runas (generateRunesPrompt)
   - Importar gemas (generateGemsPrompt)

9. **Talismanes** (2 casos):
   - Importar charms (generateCharmsPrompt)
   - Importar Horadric Seal (generateHoradricSealPrompt)

10. **Build** (1 caso):
    - Importar equipamiento completo

**TOTAL**: **18 casos diferentes** que deben ser testeados

---

## 🔍 DIFERENCIAS CRÍTICAS

### Héroe vs Personaje
- **HÉROE**: Almacena objetos completos (catálogos)
- **PERSONAJE**: Almacena referencias (IDs + datos mínimos)

### Prompts Diferentes por Contexto
- Aspectos: `generateAspectsPrompt()` vs `generateCharacterAspectsPrompt()`
- Mundo: `generateWorldEventsPrompt()` vs `generateDungeonAspectsPrompt()`
- Paragon: 3 prompts diferentes (tableros, nodos, atributos)
- Runas/Gemas: 2 prompts diferentes (runas, gemas)
- Talismanes: 2 prompts diferentes (charms, horadric seal)

### Estructura de Guardado
- **WorkspaceService**: Estadísticas, habilidades refs, glifos refs
- **WorldService**: Eventos, mazmorras (merge con existentes)
- **Catálogos Globales**: Runas, gemas, talismanes
- **Personaje**: Build, paragon, mecánicas
