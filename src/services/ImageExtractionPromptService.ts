export class ImageExtractionPromptService {
  // Generar prompt para extraer habilidades activas de imágenes
  static generateActiveSkillsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información de las habilidades activas de Diablo 4.

**Instrucciones:**
1. Identifica cada habilidad activa visible en la imagen
2. Extrae todos los datos relevantes (nombre, descripción, tipo, rama, nivel, etc.)
3. Para cada modificador equipado, incluye nombre y descripción completa

**Devuélveme la información en el siguiente formato JSON:**

\`\`\`json
{
  "habilidades_activas": [
    {
      "id": "skill_activa_[genera_id_unico]",
      "nombre": "Nombre de la habilidad",
      "tipo_habilidad": "skill|modificador",
      "tipo": "Básica|Principal|Defensiva|Movilidad|Definitiva|Arma de Arsenal",
      "rama": "Nombre de la rama (ej: Ira, Arma de Arsenal, etc.)",
      "nivel": 1,
      "nivel_maximo": 5,
      "descripcion": "Descripción completa de la habilidad",
      "tipo_danio": "Físico|Fuego|Hielo|Rayo|Veneno|Sombra|null",
      "modificadores": [
        {
          "nombre": "Nombre del modificador",
          "descripcion": "Descripción completa del modificador"
        }
      ],
      "palabras_clave": ["palabra1", "palabra2"]
    }
  ],
  "palabras_clave": [
    {
      "palabra": "Palabra marcada en blanco/subrayada",
      "descripcion": "Descripción del término según el tooltip o contexto",
      "categoria": "atributo|efecto|condicion|recurso|otro"
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada habil idad debe tener un ID único (ej: skill_activa_12345)
- tipo_habilidad: "skill" para habilidades base, "modificador" para mejoras seleccionables
- El tipo debe ser exactamente uno de: Básica, Principal, Defensiva, Movilidad, Definitiva, Arma de Arsenal
- nivel_maximo es típicamente 5 para skills, 1 para modificadores
- Si no tiene tipo de daño específico, usa null
- Incluye TODOS los modificadores visibles con sus descripciones completas
- **⚠️ CRÍTICO - PALABRAS CLAVE:** Lista SOLO las palabras que aparecen en BLANCO/SUBRAYADAS en la imagen. NO inventes tags con palabras que no estén coloreadas en blanco. Ejemplo: si dice "Aumenta el daño abrumador" y solo "abrumador" está en blanco, guarda SOLO "abrumador" (NO "daño abrumador").
- En la sección palabras_clave global, incluye descripción detallada de cada término si está disponible en tooltips
- Si un campo no está visible, usa null o un array vacío según corresponda`;
  }

  // Generar prompt para extraer habilidades pasivas de imágenes
  static generatePassiveSkillsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información de las habilidades pasivas de Diablo 4.

**Instrucciones:**
1. Identifica cada habilidad pasiva visible en la imagen
2. Extrae todos los datos relevantes (nombre, descripción, efecto, nivel, etc.)
3. Incluye información sobre puntos asignados si está visible

**Devuélveme la información en el siguiente formato JSON:**

\`\`\`json
{
  "habilidades_pasivas": [
    {
      "id": "skill_pasiva_[genera_id_unico]",
      "nombre": "Nombre de la pasiva",
      "tipo_habilidad": "pasiva",
      "tipo": "Pasiva Clave|Pasiva|Nodo del tablero Paragon",
      "nivel": 1,
      "nivel_maximo": 3,
      "rama": "Nombre de la rama o tablero",
      "efecto": "Descripción completa del efecto de la pasiva",
      "requisitos": "Requisitos si los hay, null si no",
      "puntos_asignados": 1,
      "palabras_clave": ["palabra1", "palabra2"]
    }
  ],
  "palabras_clave": [
    {
      "palabra": "Palabra marcada en blanco/subrayada",
      "descripcion": "Descripción del término",
      "categoria": "atributo|efecto|condicion|recurso|otro"
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada pasiva debe tener un ID único (ej: skill_pasiva_12345)
- tipo_habilidad siempre debe ser "pasiva"
- El tipo debe ser: Pasiva Clave, Pasiva, o Nodo del tablero Paragon
- nivel_maximo es típicamente 3 para pasivas normales, 1 para pasivas clave
- **⚠️ CRÍTICO - PALABRAS CLAVE:** Lista SOLO las palabras que aparecen en BLANCO/SUBRAYADAS en la imagen. NO inventes tags con palabras que no estén coloreadas en blanco. La mayoría vienen subrayadas.
- En la sección palabras_clave global, incluye descripción de cada término si está disponible
- Si un campo no está visible, usa null
- puntos_asignados indica cuántos puntos tiene invertidos el personaje`;
  }

  // Generar prompt para extraer glifos de imágenes
  static generateGlyphsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información completa de los glifos de Diablo 4.

**Instrucciones:**
1. Identifica cada glifo visible en la imagen
2. Extrae todos los datos: nombre, rareza, efectos, bonificaciones, requisitos, etc.
3. Presta especial atención a los valores numéricos y condiciones

**Devuélveme la información en el siguiente formato JSON:**

\`\`\`json
{
  "glifos": [
    {
      "id": "glifo_[genera_id_unico]",
      "nombre": "Nombre del Glifo",
      "rareza": "Común|Raro|Legendario",
      "nivel_requerido": 1,
      "efecto_base": "Descripción del efecto base del glifo",
      "atributo_escalado": {
        "atributo": "Fuerza|Destreza|Inteligencia|Voluntad",
        "bonificacion": "Descripción de cómo escala"
      },
      "bonificacion_adicional": {
        "requisito": "Requisito para activar (ej: 25 puntos de Destreza)",
        "descripcion": "Descripción de la bonificación adicional"
      },
      "bonificacion_legendaria": {
        "requisito": "Requisito para activar (ej: 40 puntos de Inteligencia)",
        "descripcion": "Descripción de la bonificación legendaria"
      },
      "tamano_radio": "Información sobre tamaño/radio si aplica",
      "requisitos_especiales": "Cualquier requisito especial, null si no hay",
      "estado": "Encontrado",
      "palabras_clave": ["palabra1", "palabra2"]
    }
  ],
  "palabras_clave": [
    {
      "palabra": "Palabra marcada en blanco/subrayada",
      "descripcion": "Descripción del término",
      "categoria": "atributo|efecto|condicion|recurso|otro"
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada glifo debe tener un ID único (ej: glifo_12345)
- rareza debe ser exactamente: Común, Raro, o Legendario
- Si atributo_escalado no está presente, omite ese campo o usa null
- Si bonificacion_adicional no está presente, omite ese campo o usa null
- Si bonificacion_legendaria no está presente, omite ese campo o usa null
- **⚠️ CRÍTICO - PALABRAS CLAVE:** Lista SOLO las palabras que aparecen en BLANCO/SUBRAYADAS en la imagen. NO inventes tags con palabras que no estén coloreadas en blanco. Ejemplo: si dice "Aumenta el daño con barrera" y solo "barrera" está en blanco, guarda SOLO "barrera" (NO "daño con barrera").
- En la sección palabras_clave global, incluye descripción de cada término si está disponible en tooltips
- estado siempre debe ser "Encontrado" para glifos que el jugador posee
- Captura los valores exactos de los requisitos (ej: "25 puntos de Destreza")
- Si un campo no es visible o no aplica, usa null u omite el campo`;
  }

  // Generar prompt para extraer aspectos de imágenes
  static generateAspectsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información completa de los aspectos legendarios de Diablo 4.

**IMPORTANTE - Identificación por color:**
Los aspectos se identifican por su color de fondo:
- 🔵 **AZUL** = Defensivo
- 🔴 **ROJO** = Ofensivo  
- 🟢 **VERDE** = Recurso
- 🟣 **MORADO** = Utilidad
- 🟡 **AMARILLO** = Movilidad

**Instrucciones:**
1. Identifica cada aspecto visible en la imagen
2. Determina la categoría según el COLOR de fondo del icono/carta
3. Extrae el nombre completo del aspecto
4. Copia la descripción exacta del efecto
5. Identifica si es específico de una clase o general
6. Nota cualquier requisito o condición

**Devuélveme la información en el siguiente formato JSON:**

\`\`\`json
{
  "aspectos": [
    {
      "id": "aspecto_[genera_id_unico]",
      "nombre": "Nombre completo del aspecto",
      "categoria": "Defensivo|Ofensivo|Recurso|Utilidad|Movilidad",
      "descripcion": "Descripción completa del efecto del aspecto",
      "clase_especifica": "Paladín|Bárbaro|Hechicero|Pícaro|Druida|Nigromante|Espiritista|null",
      "efecto_positivo": "Descripción del beneficio principal si aplica",
      "efecto_negativo": "Descripción del costo/penalización si aplica",
      "requisitos": "Condiciones para activar el efecto si las hay",
      "notas": "Información adicional relevante",
      "palabras_clave": ["palabra1", "palabra2"]
    }
  ],
  "palabras_clave": [
    {
      "palabra": "Palabra marcada en blanco/subrayada",
      "descripcion": "Descripción del término",
      "categoria": "atributo|efecto|condicion|recurso|otro"
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada aspecto debe tener un ID único (ej: aspecto_12345)
- **categoria** debe determinarse por el COLOR: Azul=Defensivo, Rojo=Ofensivo, Verde=Recurso, Morado=Utilidad, Amarillo=Movilidad
- **⚠️ CRÍTICO - PALABRAS CLAVE:** Lista SOLO las palabras que aparecen en BLANCO/SUBRAYADAS en la imagen. NO inventes tags con palabras que no estén coloreadas en blanco.
- En la sección palabras_clave global, incluye descripción de cada término si está disponible
- Si el aspecto es para todas las clases, usa null en clase_especifica
- Si solo menciona efectos positivos, efecto_negativo puede ser null
- La descripción debe ser exacta como aparece en el juego
- Si un campo no aplica, usa null u omite el campo
- Presta atención a los valores numéricos y porcentajes exactos`;
  }

  // Generar prompt para habilidades completas (activas + pasivas)
  static generateFullSkillsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información completa de las habilidades (activas y pasivas) de Diablo 4.

**Instrucciones:**
1. Identifica tanto habilidades activas como pasivas
2. Extrae todos los datos relevantes de cada tipo
3. Organiza la información en las dos categorías

**Devuélveme la información en el siguiente formato JSON:**

\`\`\`json
{
  "habilidades_activas": [
    {
      "id": "skill_activa_[genera_id_unico]",
      "nombre": "Nombre de la habilidad",
      "tipo_habilidad": "skill|modificador",
      "tipo": "Básica|Principal|Defensiva|Movilidad|Definitiva|Arma de Arsenal",
      "rama": "Nombre de la rama",
      "nivel": 1,
      "nivel_maximo": 5,
      "descripcion": "Descripción completa",
      "tipo_danio": "Físico|Fuego|Hielo|Rayo|Veneno|Sombra|null",
      "modificadores": [
        {
          "nombre": "Nombre del modificador",
          "descripcion": "Descripción completa"
        }
      ],
      "palabras_clave": ["palabra1", "palabra2"]
    }
  ],
  "habilidades_pasivas": [
    {
      "id": "skill_pasiva_[genera_id_unico]",
      "nombre": "Nombre de la pasiva",
      "tipo_habilidad": "pasiva",
      "tipo": "Pasiva Clave|Pasiva|Nodo del tablero Paragon",
      "nivel": 1,
      "nivel_maximo": 3,
      "rama": "Nombre de la rama",
      "efecto": "Descripción del efecto",
      "requisitos": "null si no hay",
      "puntos_asignados": 1,
      "palabras_clave": ["palabra1", "palabra2"]
    }
  ],
  "palabras_clave": [
    {
      "palabra": "Palabra marcada en blanco/subrayada",
      "descripcion": "Descripción del término",
      "categoria": "atributo|efecto|condicion|recurso|otro"
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada habilidad debe tener un ID único
- tipo_habilidad: "skill"/"modificador" para activas, "pasiva" para pasivas
- nivel_maximo: típicamente 5 para skills, 1 para modificadores, 3 para pasivas
- **⚠️ CRÍTICO - PALABRAS CLAVE:** Lista SOLO las palabras que aparecen en BLANCO/SUBRAYADAS en la imagen. NO inventes tags con palabras que no estén coloreadas en blanco.
- En la sección palabras_clave global, incluye descripción de cada término si está disponible
- Usa los valores exactos especificados para tipo, rareza, etc.
- Si un campo no está visible, usa null o array vacío según corresponda
- Incluye TODAS las habilidades visibles en la imagen`;
  }

  // Generar prompt para extraer estadísticas de imágenes (v0.3.1)
  static generateStatsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae las estadísticas del personaje de Diablo 4.

**IMPORTANTE - Detalles de estadísticas:**
Cada estadística puede tener múltiples detalles que explican cómo se compone ese valor. Por ejemplo:
- "Contribución de objetos: 0"
- "Aumenta la probabilidad de golpe crítico en +4.2 %"
- "Aumenta la resistencia a todos los elementos en +83"

**Instrucciones:**
1. Identifica cada sección visible (Personaje, Atributos principales, Defensivo, Ofensivo, Armadura y resistencias, etc.)
2. Extrae todos los valores numéricos principales
3. **CRÍTICO:** Extrae TODOS los detalles/subítems debajo de cada estadística
4. Identifica palabras marcadas en BLANCO/SUBRAYADAS en los detalles (son palabras clave del juego)
5. Si ves la definición del "Aguante", inclúyela completa

**Devuélveme la información en el siguiente formato JSON:**

\`\`\`json
{
  "estadisticas": {
    "personaje": {
      "danioArma": 496,
      "aguante": 52619,
      "aguante_definicion": "El Aguante es una aproximación de tu capacidad de supervivencia para cada tipo de daño basada en tu vida, armadura, resistencias y otras fuentes de reducción de daño.",
      "detalles": [
        {
          "texto": "Armadura: 18,995",
          "valor": 18995,
          "contribucion": null,
          "palabras_clave": []
        },
        {
          "texto": "Vida máxima: 7,581",
          "valor": 7581
        }
      ],
      "palabras_clave": ["reduccion_de_danio", "supervivencia"]
    },
    "atributosPrincipales": {
      "nivel": 60,
      "fuerza": 1670,
      "inteligencia": 208,
      "detalles": [
        {
          "texto": "Contribución de objetos: 0",
          "contribucion": "Contribución de objetos",
          "valor": 0
        },
        {
          "texto": "Aumenta la probabilidad de golpe crítico en +4.2 %",
          "palabras_clave": ["golpe_critico"]
        },
        {
          "texto": "Aumenta la resistencia a todos los elementos en +83",
          "palabras_clave": ["resistencia"]
        }
      ],
      "palabras_clave": []
    },
    "armaduraYResistencias": {
      "aguante": 52619,
      "armadura": 18995,
      "resistenciaDanioFisico": 759,
      "resistenciaFuego": 759,
      "resistenciaRayo": 759,
      "resistenciaFrio": 759,
      "resistenciaVeneno": 1277,
      "resistenciaSombra": 1693,
      "detalles": [
        {
          "texto": "Físico: 47,315 - 84.0% Reducción de daño",
          "valor": "84.0%",
          "palabras_clave": ["reduccion_de_danio"]
        },
        {
          "texto": "Fuego: 47,315 - 84.0% Reducción de daño",
          "valor": "84.0%",
          "palabras_clave": ["reduccion_de_danio"]
        }
      ],
      "palabras_clave": ["reduccion_de_danio"]
    },
    "ofensivo": {
      "danioBaseArma": 496,
      "velocidadArma": 1.20,
      "probabilidadGolpeCritico": 15.0,
      "danioGolpeCritico": 194.0,
      "probabilidadAbrumar": 3.0,
      "danioAbrumador": 131.0,
      "danioContraEnemigosVulnerables": 80.0,
      "detalles": [
        {
          "texto": "Bonificación de daño contra enemigos vulnerables: 80.0%",
          "palabras_clave": ["vulnerables"]
        },
        {
          "texto": "Tus habilidades infligen más daño contra enemigos vulnerables",
          "palabras_clave": ["vulnerables"]
        },
        {
          "texto": "Incluye el 100.0 % de daño aumentado inherente que los enemigos vulnerables reciben de todas las fuentes",
          "palabras_clave": ["vulnerables"]
        },
        {
          "texto": "Tienes +50.0 % de este atributo por objetos y Paragón",
          "contribucion": "objetos y Paragón",
          "valor": "50.0%"
        }
      ],
      "palabras_clave": ["vulnerables", "golpe_critico"]
    },
    "defensivo": {
      "vidaMaxima": 7581,
      "detalles": [],
      "palabras_clave": []
    },
    "utilidad": {
      "velocidadMovimiento": 0,
      "detalles": [],
      "palabras_clave": []
    },
    "moneda": {
      "oro": "380M",
      "obolos": {
        "actual": 1618,
        "maximo": 2500
      },
      "polvoRojo": 2768,
      "marcasPalidas": 1180,
      "monedasDelAlcazar": 890,
      "favor": 99,
      "carneFresca": "17.9k"
    }
  },
  "palabras_clave": [
    {
      "palabra": "vulnerables",
      "descripcion": "Estado que hace que los enemigos reciban más daño de todas las fuentes",
      "categoria": "condicion"
    },
    {
      "palabra": "golpe crítico",
      "descripcion": "Probabilidad de realizar un ataque crítico que causa más daño",
      "categoria": "atributo"
    },
    {
      "palabra": "reducción de daño",
      "descripcion": "Porcentaje de daño que se reduce al recibir ataques",
      "categoria": "efecto"
    },
    {
      "palabra": "resistencia",
      "descripcion": "Reducción del daño de un tipo elemental específico",
      "categoria": "atributo"
    }
  ]
}
\`\`\`

**Notas críticas:**
- **DETALLES:** Extrae TODOS los sub-items de cada estadística como objetos en el array "detalles"
- **Aguante:** Si ves el tooltip, copia la definición completa en aguante_definicion
- **Palabras blancas/subrayadas:** Identifícalas en los detalles y agrégalas a palabras_clave
- **Contribución:** Si menciona "de objetos", "por Paragón", etc., usa el campo contribucion
- **Valores:** Pueden ser números o strings con "%" 
- Si un campo no está visible, usa null u omite el campo
- Incluye TODAS las secciones visibles en la imagen`;
  }

  // Copiar prompt al portapapeles
  static async copyToClipboard(prompt: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(prompt);
      return true;
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
      return false;
    }
  }

  // Generar prompt para estadísticas con modelo refactorizado V2 (v0.3.4+)
  static generateStatsPromptV2(): string {
    return `Analiza la imagen de estadísticas de Diablo 4 y extrae toda la información visible siguiendo el modelo refactorizado.

**⚠️ IMPORTANTE - CAPTURA COMPLETA:**

- **Si la imagen muestra MÚLTIPLES atributos con sus detalles y valores, captura TODOS en un solo JSON**
- **Cada atributo debe incluir:**
  - Su valor numérico
  - Descripción (si está visible en tooltips)
  - Todos los detalles/viñetas debajo de él
  - Palabras clave (tags) que aparezcan en BLANCO/SUBRAYADAS

**EJEMPLO:**
Si la imagen muestra:
- Nivel: 60 (con sus detalles)
- Fuerza: 1670 (con sus detalles)
- Inteligencia: 208 (con sus detalles)
- Armadura: 20,296 (con sus detalles)
→ Captura TODOS los atributos con sus detalles completos en estadisticas.atributos_principales, estadisticas.defensivo, etc.

**OBJETIVO:**
Extraer estadísticas con información estructurada de palabras clave del juego, manteniendo TODO en español.

**REGLAS IMPORTANTES:**

1. **IDIOMA:** Todo en español
   - Variables del JSON: en español
   - Tags: en español ("golpe_critico" NO "critical_hit")
   - Textos originales: tal como aparecen en la imagen

2. **PALABRAS CLAVE (TAGS) - ⚠️ MUY IMPORTANTE:**
   - **SOLO** extrae palabras que aparezcan en BLANCO/SUBRAYADAS en la imagen
   - **NO** inventes tags con palabras que NO estén coloreadas en blanco
   - Ejemplo CORRECTO: Si la imagen muestra "Aumenta el daño abrumador" donde solo "abrumador" está en blanco → guarda SOLO "abrumador"
   - Ejemplo INCORRECTO: NO guardes "daño abrumador" si "daño" no está en blanco
   - La mayoría de palabras clave vienen subrayadas o en blanco brillante
   - Si encuentras el significado (definición del tooltip), guárdalo
   - Si NO encuentras el significado, usa null
   - Usa snake_case para el identificador: "golpe_critico", "abrumador", "vulnerable"

3. **ESTRUCTURA DE TAG:**
   \`\`\`json
   {
     "tag": "golpe_critico",
     "texto_original": "golpe crítico",
     "significado": "Probabilidad de que una habilidad o ataque inflija daño crítico adicional.",
     "categoria": "atributo",
     "fuente": "tooltip"
   }
   \`\`\`
   
   Si NO hay definición:
   \`\`\`json
   {
     "tag": "corrupcion",
     "texto_original": "corrupción",
     "significado": null,
     "categoria": "tipo_de_danio",
     "fuente": "estadistica"
   }
   \`\`\`

4. **CATEGORÍAS DE TAGS:**
   - "atributo": Atributos del personaje
   - "efecto": Efectos de habilidades
   - "condicion": Estados (vulnerable, quemadura, etc.)
   - "recurso": Fe, maná, furia, etc.
   - "mecanica": Mecánicas del juego (bloqueo, crítico, etc.)
   - "tipo_de_danio": Tipos de daño (físico, sombra, etc.)
   - "defensivo": Mecánicas defensivas

5. **DETALLES DE ESTADÍSTICAS:**
   Captura TODOS los subítems visibles debajo de cada estadística:
   \`\`\`json
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
   }
   \`\`\`

   Tipos de detalle: "bonificacion", "contribucion", "efecto", "aclaracion", "composicion"

6. **SECCIÓN GLOBAL palabras_clave:**
   Recopila TODAS las palabras detectadas aquí también:
   \`\`\`json
   "palabras_clave": [
     {
       "tag": "golpe_critico",
       "texto_original": "golpe crítico",
       "significado": "Probabilidad de que una habilidad o ataque inflija daño crítico adicional.",
       "categoria": "atributo",
       "descripcion_jugabilidad": null,
       "sinonimos": ["critico", "crit"],
       "origen": "tooltip",
       "pendiente_revision": false
     },
     {
       "tag": "fortificacion",
       "texto_original": "fortificación",
       "significado": null,
       "categoria": "mecanica_defensiva",
       "descripcion_jugabilidad": null,
       "sinonimos": [],
       "origen": "tooltip",
       "pendiente_revision": true
     }
   ]
   \`\`\`
   
   - Si tiene significado: "pendiente_revision": false
   - Si NO tiene significado: "pendiente_revision": true

**FORMATO JSON ESPERADO:**

**Ejemplo - Imagen mostrando múltiples estadísticas:**
\`\`\`json
{
  "nivel": {
    "nivel": 60,
    "descripcion": "El nivel de tu personaje, que se incrementa al acumular experiencia.",
    "detalles": [
      {
        "texto": "Los monstruos en este nivel tienen 85.0 % de reducción de daño visible.",
        "tipo": "efecto",
        "valor": 85.0,
        "unidad": "%",
        "contribucion": null,
        "tags": [
          {
            "tag": "reduccion_de_danio_visible",
            "texto_original": "reducción de daño visible",
            "significado": null,
            "categoria": "mecanica",
            "fuente": "tooltip"
          }
        ]
      }
    ],
    "tags": [
      {
        "tag": "reduccion_de_danio_visible",
        "texto_original": "reducción de daño visible",
        "significado": null,
        "categoria": "mecanica",
        "fuente": "tooltip"
      }
    ]
  },
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
                "categoria": "atributo",
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
            "categoria": "atributo",
            "fuente": "tooltip"
          }
        ]
      },
      {
        "id": "inteligencia",
        "nombre": "Inteligencia",
        "categoria": "atributo_principal",
        "valor": 208,
        "unidad": "puntos",
        "descripcion": null,
        "detalles": [
          {
            "texto": "Aumenta la probabilidad de golpe crítico en +4.2 %",
            "tipo": "bonificacion",
            "valor": 4.2,
            "unidad": "%",
            "contribucion": null,
            "tags": [
              {
                "tag": "golpe_critico",
                "texto_original": "golpe crítico",
                "significado": "Probabilidad de infligir daño crítico",
                "categoria": "atributo",
                "fuente": "tooltip"
              }
            ]
          }
        ],
        "tags": [
          {
            "tag": "golpe_critico",
            "texto_original": "golpe crítico",
            "significado": "Probabilidad de infligir daño crítico",
            "categoria": "atributo",
            "fuente": "tooltip"
          }
        ]
      }
    ],
    "defensivo": [
      {
        "id": "armadura",
        "nombre": "Armadura",
        "categoria": "defensivo",
        "valor": 20296,
        "unidad": "puntos",
        "descripcion": "Reduce el daño recibido en 73.7 %",
        "detalles": [
          {
            "texto": "Aplica al daño físico y daño en el tiempo",
            "tipo": "aclaracion",
            "valor": null,
            "unidad": null,
            "contribucion": null,
            "tags": []
          }
        ],
        "tags": []
      },
      {
        "id": "vida_maxima",
        "nombre": "Vida máxima",
        "categoria": "defensivo",
        "valor": 7581,
        "unidad": "puntos",
        "descripcion": null,
        "detalles": [],
        "tags": []
      }
    ],
    "ofensivo": [
      {
        "id": "probabilidad_golpe_critico",
        "nombre": "Probabilidad de golpe crítico",
        "categoria": "ofensivo",
        "valor": 15.0,
        "unidad": "%",
        "descripcion": null,
        "detalles": [
          {
            "texto": "Contribución de objetos y Paragón: +10.0 %",
            "tipo": "contribucion",
            "valor": 10.0,
            "unidad": "%",
            "contribucion": "objetos_y_paragon",
            "tags": []
          }
        ],
        "tags": [
          {
            "tag": "golpe_critico",
            "texto_original": "golpe crítico",
            "significado": "Probabilidad de infligir daño crítico",
            "categoria": "atributo",
            "fuente": "tooltip"
          }
        ]
      }
    ]
  },
  "palabras_clave": [
    {
      "tag": "reduccion_de_danio_visible",
      "texto_original": "reducción de daño visible",
      "significado": null,
      "categoria": "mecanica",
      "descripcion_jugabilidad": null,
      "sinonimos": [],
      "origen": "tooltip",
      "pendiente_revision": true
    },
    {
      "tag": "danio_de_habilidad",
      "texto_original": "daño de habilidad",
      "significado": null,
      "categoria": "atributo",
      "descripcion_jugabilidad": null,
      "sinonimos": [],
      "origen": "tooltip",
      "pendiente_revision": true
    },
    {
      "tag": "golpe_critico",
      "texto_original": "golpe crítico",
      "significado": "Probabilidad de infligir daño crítico",
      "categoria": "atributo",
      "descripcion_jugabilidad": null,
      "sinonimos": ["critico", "crit"],
      "origen": "tooltip",
      "pendiente_revision": false
    }
  ]
}
\`\`\`

**CHECKLIST FINAL:**
- ✅ Todo en español (variables, tags, textos)
- ✅ **Captura TODOS los atributos visibles con sus detalles completos**
- ✅ Tags como objetos con "tag", "texto_original", "significado" (puede ser null)
- ✅ **SOLO** capturar como tags palabras EN BLANCO/SUBRAYADAS (no inventar)
- ✅ Objeto "nivel" con nivel, descripcion y detalles si está visible
- ✅ Sección "palabras_clave" global presente con TODAS las palabras detectadas
- ✅ Campo "pendiente_revision" en palabras_clave (true si significado es null)
- ✅ Detalles con estructura completa (texto, tipo, valor, unidad, contribucion, tags)
- ✅ Nombres claros en español: "golpe_critico", "abrumador", "vulnerable" (NO "daño abrumador")
- ✅ Si un campo está vacío, usar null o {} o [] según corresponda

**IMPORTANTE:**
- NO traduzcas conceptos al inglés
- NO uses camelCase en tags, usa snake_case
- NO simplifiques tags a strings, deben ser objetos
- NO inventes tags con palabras que NO estén en blanco - esto es crítico
- SÍ captura TODAS las palabras blancas/subrayadas
- SÍ captura TODOS los atributos visibles en la imagen con sus detalles
- SÍ permite significado null cuando no tengas la definición`;
  }
}

