# Modelo Refactorizado de Estadísticas - Diablo 4 Build Manager

## Objetivo

Refactorizar el modelo JSON de estadísticas para soportar mejor:
1. Extracción de palabras clave del juego
2. Almacenamiento estructurado de tags con significado
3. Enriquecimiento progresivo de definiciones
4. Gestión global de palabras clave

## Principios

- **Idioma**: Todo en español (variables, tags, textos)
- **Estructura**: Tags como objetos, no strings simples
- **Flexibilidad**: Soportar datos parciales (significado: null)
- **Extensibilidad**: Preparado para enriquecimiento futuro

## Nuevas Interfaces TypeScript

### Tag (Palabra Clave Inline)

```typescript
export interface Tag {
  tag: string;                    // Versión normalizada: "golpe_critico"
  texto_original: string;         // Como aparece en imagen: "golpe crítico"
  significado: string | null;     // Definición del tooltip o null
  categoria?: string;             // "atributo", "efecto", "condicion", "recurso", etc.
  fuente?: string;                // "tooltip", "estadistica", "manual"
}
```

### DetalleEstadistica (Actualizado)

```typescript
export interface DetalleEstadistica {
  texto: string;                  // Descripción completa
  tipo?: string;                  // "bonificacion", "contribucion", "efecto", "aclaracion", "composicion"
  valor?: number | null;          // Valor numérico si aplica
  unidad?: string | null;         // "%", "puntos", "por_segundo", etc.
  contribucion?: string | null;   // "objetos", "paragon", "objetos_y_paragon", "base_y_otras_fuentes"
  tags?: Tag[];                   // Tags específicos de este detalle
}
```

### Estadistica Individual

```typescript
export interface Estadistica {
  id: string;                     // Identificador único: "probabilidad_de_golpe_critico"
  nombre: string;                 // Nombre visible: "Probabilidad de golpe crítico"
  categoria: string;              // "atributo_principal", "ofensivo", "defensivo", "recurso", etc.
  valor: number | string;         // Valor principal
  unidad: string;                 // Unidad: "%", "puntos", "por_segundo"
  descripcion?: string | null;    // Descripción general de la estadística
  detalles?: DetalleEstadistica[]; // Sub-items y contribuciones
  tags?: Tag[];                   // Tags relevantes para esta estadística
}
```

### PalabraClaveGlobal (Sección Global)

```typescript
export interface PalabraClaveGlobal {
  tag: string;                         // Identificador normalizado: "golpe_critico"
  texto_original: string;              // Texto original: "golpe crítico"
  significado: string | null;          // Definición completa o null
  categoria?: string;                  // Categoría de la palabra clave
  descripcion_jugabilidad?: string | null; // Cómo afecta al gameplay
  sinonimos?: string[];                // Variantes: ["critico", "crit", "golpe critico"]
  origen?: string;                     // De dónde se extrajo: "tooltip", "estadistica", "manual"
  pendiente_revision: boolean;         // true si falta información
}
```

### Estadisticas (Contenedor Principal)

```typescript
export interface Estadisticas {
  atributos_principales?: Estadistica[];
  ofensivo?: Estadistica[];
  defensivo?: Estadistica[];
  recursos?: Estadistica[];
  armadura_y_resistencias?: Estadistica[];
  utilidad?: Estadistica[];
  jcj?: Estadistica[];
  moneda?: any; // Mantener estructura actual
}
```

### EstadisticasConPalabrasClave (Raíz del JSON)

```typescript
export interface EstadisticasConPalabrasClave {
  nivel_paragon?: number;
  estadisticas: Estadisticas;
  palabras_clave: PalabraClaveGlobal[];
}
```

## Ejemplo de JSON Completo

```json
{
  "nivel_paragon": 150,
  "estadisticas": {
    "atributos_principales": [
      {
        "id": "fuerza",
        "nombre": "Fuerza",
        "categoria": "atributo_principal",
        "valor": 1670,
        "unidad": "puntos",
        "descripcion": null,
        "detalles": [
          {
            "texto": "Contribución de objetos: 1297",
            "tipo": "contribucion",
            "valor": 1297,
            "unidad": "puntos",
            "contribucion": "objetos",
            "tags": []
          },
          {
            "texto": "Aumenta el daño de habilidad en 208.8 %",
            "tipo": "bonificacion",
            "valor": 208.8,
            "unidad": "%",
            "contribucion": null,
            "tags": [
              {
                "tag": "danio_de_habilidad",
                "texto_original": "daño de habilidad",
                "significado": null,
                "categoria": "ofensivo",
                "fuente": "tooltip"
              }
            ]
          },
          {
            "texto": "Aumenta la armadura en +3,340",
            "tipo": "bonificacion",
            "valor": 3340,
            "unidad": "puntos",
            "contribucion": null,
            "tags": [
              {
                "tag": "armadura",
                "texto_original": "armadura",
                "significado": "Reduce parte del daño recibido, especialmente físico.",
                "categoria": "defensivo",
                "fuente": "tooltip"
              }
            ]
          }
        ],
        "tags": [
          {
            "tag": "danio_de_habilidad",
            "texto_original": "daño de habilidad",
            "significado": null,
            "categoria": "ofensivo",
            "fuente": "tooltip"
          },
          {
            "tag": "armadura",
            "texto_original": "armadura",
            "significado": "Reduce parte del daño recibido, especialmente físico.",
            "categoria": "defensivo",
            "fuente": "tooltip"
          }
        ]
      }
    ],
    "ofensivo": [
      {
        "id": "probabilidad_de_golpe_critico",
        "nombre": "Probabilidad de golpe crítico",
        "categoria": "ofensivo",
        "valor": 15.0,
        "unidad": "%",
        "descripcion": "Cuando una habilidad inflige daño, tiene una probabilidad de asestar un golpe crítico.",
        "detalles": [
          {
            "texto": "Los golpes críticos infligen 50.0 % de daño adicional y un aumento según tus bonificaciones personales.",
            "tipo": "efecto",
            "valor": 50.0,
            "unidad": "%",
            "contribucion": null,
            "tags": [
              {
                "tag": "golpe_critico",
                "texto_original": "golpes críticos",
                "significado": "Impactos que infligen daño adicional respecto al daño base.",
                "categoria": "mecanica",
                "fuente": "tooltip"
              }
            ]
          }
        ],
        "tags": [
          {
            "tag": "golpe_critico",
            "texto_original": "golpe crítico",
            "significado": "Probabilidad de que una habilidad o ataque inflija daño crítico adicional.",
            "categoria": "atributo",
            "fuente": "estadistica"
          }
        ]
      },
      {
        "id": "danio_contra_enemigos_vulnerables",
        "nombre": "Daño contra enemigos vulnerables",
        "categoria": "ofensivo",
        "valor": 80.0,
        "unidad": "%",
        "descripcion": "Tus habilidades infligen más daño contra enemigos vulnerables.",
        "detalles": [
          {
            "texto": "Incluye el 20.0 % de daño aumentado inherente que los enemigos vulnerables reciben de todas las fuentes.",
            "tipo": "efecto",
            "valor": 20.0,
            "unidad": "%",
            "contribucion": "inherente",
            "tags": [
              {
                "tag": "enemigos_vulnerables",
                "texto_original": "enemigos vulnerables",
                "significado": "Estado que provoca que un enemigo reciba más daño de todas las fuentes.",
                "categoria": "condicion",
                "fuente": "tooltip"
              }
            ]
          }
        ],
        "tags": [
          {
            "tag": "enemigos_vulnerables",
            "texto_original": "enemigos vulnerables",
            "significado": "Estado que provoca que un enemigo reciba más daño de todas las fuentes.",
            "categoria": "condicion",
            "fuente": "tooltip"
          }
        ]
      }
    ],
    "defensivo": [
      {
        "id": "vida_maxima",
        "nombre": "Vida máxima",
        "categoria": "defensivo",
        "valor": 8512,
        "unidad": "puntos",
        "descripcion": "Si pierdes toda tu vida, morirás.",
        "detalles": [
          {
            "texto": "Tienes 400 de vida de base en el nivel 60 y 8,112 de vida adicional de otras fuentes.",
            "tipo": "composicion",
            "valor": null,
            "unidad": null,
            "contribucion": "base_y_otras_fuentes",
            "tags": [
              {
                "tag": "vida",
                "texto_original": "vida",
                "significado": "Cantidad total de salud del personaje antes de morir.",
                "categoria": "defensivo",
                "fuente": "tooltip"
              }
            ]
          }
        ],
        "tags": [
          {
            "tag": "vida",
            "texto_original": "vida",
            "significado": "Cantidad total de salud del personaje antes de morir.",
            "categoria": "defensivo",
            "fuente": "estadistica"
          }
        ]
      }
    ],
    "recursos": [
      {
        "id": "maximo_de_fe",
        "nombre": "Máximo de Fe",
        "categoria": "recurso",
        "valor": 100,
        "unidad": "puntos",
        "descripcion": "Se utiliza para lanzar varias habilidades.",
        "detalles": [],
        "tags": [
          {
            "tag": "fe",
            "texto_original": "Fe",
            "significado": "Recurso principal utilizado para activar ciertas habilidades.",
            "categoria": "recurso",
            "fuente": "tooltip"
          }
        ]
      }
    ]
  },
  "palabras_clave": [
    {
      "tag": "golpe_critico",
      "texto_original": "golpe crítico",
      "significado": "Probabilidad de que una habilidad o ataque inflija daño crítico adicional.",
      "categoria": "atributo",
      "descripcion_jugabilidad": "Aumenta el potencial de daño explosivo del personaje.",
      "sinonimos": ["critico", "crit", "golpe critico"],
      "origen": "tooltip",
      "pendiente_revision": false
    },
    {
      "tag": "enemigos_vulnerables",
      "texto_original": "enemigos vulnerables",
      "significado": "Estado que provoca que un enemigo reciba más daño de todas las fuentes.",
      "categoria": "condicion",
      "descripcion_jugabilidad": "Muy útil para builds que escalan daño multiplicativo contra objetivos marcados.",
      "sinonimos": ["vulnerables", "vulnerable"],
      "origen": "tooltip",
      "pendiente_revision": false
    },
    {
      "tag": "corrupcion",
      "texto_original": "corrupción",
      "significado": null,
      "categoria": "tipo_de_danio",
      "descripcion_jugabilidad": null,
      "sinonimos": ["daño con corrupción"],
      "origen": "estadistica",
      "pendiente_revision": true
    },
    {
      "tag": "fortificacion",
      "texto_original": "fortificación",
      "significado": null,
      "categoria": "mecanica_defensiva",
      "descripcion_jugabilidad": null,
      "sinonimos": ["fortificacion"],
      "origen": "tooltip",
      "pendiente_revision": true
    },
    {
      "tag": "fe",
      "texto_original": "Fe",
      "significado": "Recurso principal utilizado para activar ciertas habilidades.",
      "categoria": "recurso",
      "descripcion_jugabilidad": "Determina cuántas habilidades de consumo de Fe puedes usar antes de necesitar regenerarla.",
      "sinonimos": ["recurso de fe"],
      "origen": "tooltip",
      "pendiente_revision": false
    }
  ]
}
```

## Beneficios del Nuevo Modelo

1. **Tags Estructurados**: Información rica sin perder flexibilidad
2. **Significados Parciales**: Soporta datos incompletos (null)
3. **Gestión Global**: Sección `palabras_clave` para enriquecer progresivamente
4. **Búsquedas Mejoradas**: Sinonimos y categorizaciones
5. **Trazabilidad**: Campo `origen` y `pendiente_revision`
6. **Todo en Español**: Variables, tags y textos consistentes

## Migración

- **Interfaces existentes**: Se mantienen como legacy
- **Nuevas interfaces**: Agregar con prefijo `Nuevo` o crear en namespace
- **Componentes**: Actualizar gradualmente para usar nuevo modelo
- **Prompts IA**: Actualizar `generateStatsPrompt()` para generar nuevo formato
