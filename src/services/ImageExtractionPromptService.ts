export class ImageExtractionPromptService {
  // Generar prompt para extraer habilidades activas de imágenes (V2 con tags estructurados)
  static generateActiveSkillsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información de las habilidades activas de Diablo 4.

**⚠️ IMPORTANTE - TAGS ESTRUCTURADOS:**

Los tags son palabras clave del juego (conceptos de mecánicas, habilidades, efectos).
- **SOLO** captura palabras que aparezcan en BLANCO/SUBRAYADAS en la imagen
- Cada tag debe tener: tag (normalizado), texto_original, significado (si disponible), categoría
- Los tags se guardan de forma global y se referencian por ID

**Instrucciones:**
1. Identifica cada habilidad activa visible en la imagen
2. Extrae todos los datos: nombre, tipo, rama, nivel_actual, nivel_maximo, descripción
3. Para cada modificador: nombre, descripción, y sus propios tags
4. Identifica palabras en BLANCO/SUBRAYADAS y crea tags estructurados

**Formato JSON esperado:**

\`\`\`json
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
      "descripcion": "Invocas una columna de luz...",
      "tipo_danio": "Sagrado",
      "costo_recurso": {
        "tipo": "Fe",
        "cantidad": 20
      },
      "recuperacion_segundos": null,
      "modificadores": [
        {
          "id": "mod_luz_sagrada_potenciada",
          "nombre": "Luz Sagrada Potenciada",
          "tipo_habilidad": "modificador",
          "descripcion": "Luz Sagrada se encadena 2 veces más y hace que tus aliados y tú se fortifiquen por un 4% de su Vida máxima.",
          "tags": ["tag_fortificar"]
        },
        {
          "id": "mod_luz_sagrada_santificada",
          "nombre": "Luz Sagrada Santificada",
          "tipo_habilidad": "modificador",
          "descripcion": "Luz sagrada inflige un 30% más de daño y lanza una nova.",
          "tags": []
        }
      ],
      "tags": []
    }
  ],
  "palabras_clave": [
    {
      "tag": "fortificar",
      "texto_original": "fortifiquen",
      "significado": "Fortificar es una reserva adicional de Vida que se drena para sanarte con el tiempo.",
      "categoria": "mecanica",
      "fuente": "tooltip"
    },
    {
      "tag": "daño_sagrado",
      "texto_original": "Sagrado",
      "significado": null,
      "categoria": "tipo_de_danio",
      "fuente": "estadistica"
    }
  ]
}
\`\`\`

**REGLAS CRÍTICAS:**

1. **Tags solo palabras blancas/subrayadas**: NO inventar tags de palabras normales
   - ✅ "fortificar" (si fortificar está en blanco)
   - ❌ "columna de luz" (si no están resaltadas)

2. **Estructura de tag**:
   - tag: versión normalizada en snake_case: "golpe_critico", "fortificar"
   - texto_original: como aparece: "golpe crítico", "fortificar"
   - significado: definición del tooltip (null si no disponible)
   - categoria: atributo, efecto, condicion, recurso, mecanica, tipo_de_danio, defensivo, otro
   - fuente: tooltip, estadistica, habilidad

3. **Niveles**:
   - nivel: nivel actual de la skill (1-5 típicamente)
   - nivel_maximo: nivel máximo posible (5 para skills, 1 para modificadores)

4. **Tipo de habilidad**:
   - "skill": habilidad base
   - "modificador": para potenciadas/mejoradas

5. **Modificadores - IMPORTANTE**:
   - Cada modificador DEBE tener un id único: "mod_nombre_skill_nombre_modificador"
   - Cada modificador DEBE tener tipo_habilidad: "modificador"
   - Los modificadores van dentro del array modificadores de la skill base
   - Cada modificador puede tener su propio array de tags
   - Ejemplo ID: "mod_luz_sagrada_potenciada", "mod_rito_piedad"

6. **Tags en modificadores**:
   - Cada modificador puede tener su propio array de tags
   - Si el modificador menciona "fortifiquen" en blanco → agregar tag de fortificar

6. **Sección palabras_clave global**:
   - Recopila TODOS los tags detectados (de skills y modificadores)
   - Incluir significado si está disponible en tooltip
   - pendiente_revision: true si significado es null

**Campos opcionales**:
- Si un campo no aplica: usa null
- Si un array está vacío: usa []
- tipo_danio: "Físico", "Fuego", "Hielo", "Rayo", "Veneno", "Sombra", "Sagrado", "Corrupción", null

**NO uses**: "palabras_clave" en los objetos de skill, solo "tags"`;
  }

  // Generar prompt para extraer habilidades pasivas de imágenes (V2 con tags estructurados)
  static generatePassiveSkillsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información de las habilidades pasivas de Diablo 4.

**⚠️ IMPORTANTE - TAGS ESTRUCTURADOS:**

Los tags son palabras clave del juego. Solo captura palabras en BLANCO/SUBRAYADAS.

**Instrucciones:**
1. Identifica cada habilidad pasiva visible
2. Extrae: nombre, tipo, nivel_actual, nivel_maximo, efecto, puntos asignados
3. Identifica tags (palabras blancas/subrayadas) y crea objetos estructurados

**Formato JSON esperado:**

\`\`\`json
{
  "habilidades_pasivas": [
    {
      "id": "skill_pasiva_[genera_id_unico]",
      "nombre": "Longevidad",
      "tipo_habilidad": "pasiva",
      "tipo": "Pasiva",
      "rama": "Sagrado",
      "nivel": 3,
      "nivel_maximo": 3,
      "efecto": "Obtienes un 30% de la sanación recibida.",
      "puntos_asignados": 3,
      "tags": []
    },
    {
      "id": "skill_pasiva_potenciada_12346",
      "nombre": "Aura de Rebeldía Potenciada",
      "tipo_habilidad": "pasiva",
      "tipo": "Pasiva Potenciada",
      "rama": "Leviatán",
      "nivel": 1,
      "nivel_maximo": 1,
      "efecto": "Tu presencia te refuerza a ti y a tus aliados, lo que otorga un 42% de armadura y una bonificación de un 42% a todas las resistencias. Además te vuelves imparable durante 2 segundos.",
      "descripcion": "La pasiva de Aura de Rebeldía también otorga 939 de Espinas y aumenta todo tu daño de Espinas y el de tus aliados un 105%. Ahora la activa de Aura de Rebeldía, en cambio, libera una nova que inflige un 500% de tu daño de Espinas.",
      "tags": [],
      "skill_padre": "aura_de_rebeldia_id"
    }
  ],
  "palabras_clave": [
    {
      "tag": "imparable",
      "texto_original": "imparable",
      "significado": "Estado que impide ser detenido o controlado",
      "categoria": "condicion",
      "fuente": "tooltip"
    },
    {
      "tag": "espinas",
      "texto_original": "Espinas",
      "significado": "Daño devuelto a los atacantes",
      "categoria": "mecanica",
      "fuente": "tooltip"
    }
  ]
}
\`\`\`

**REGLAS CRÍTICAS:**

1. **Tags solo palabras blancas/subrayadas**: ✅ "imparable", ✅ "Espinas", ❌ "presencia refuerza"

2. **Niveles**:
   - nivel: nivel actual (1-3 típico para pasivas, 1 para potenciadas)
   - nivel_maximo: máximo posible
   - puntos_asignados: puntos invertidos por el jugador

3. **Tipo de habilidad**:
   - "pasiva": para pasivas normales y claves
   - tipo: "Pasiva", "Pasiva Clave", "Pasiva Potenciada", "Nodo del tablero Paragon"

4. **Pasivas Potenciadas**:
   - Tienen skill_padre (ID de la skill que potencian)
   - nivel_maximo normalmente es 1
   - tipo: "Pasiva Potenciada"

5. **Estructura de tag**:
   - tag: snake_case normalizado
   - texto_original: como aparece
   - significado: definición (null si no disponible)
   - categoria: mecanica, condicion, efecto, recurso, etc.
   - fuente: tooltip, habilidad, manual

6. **Sección palabras_clave global**:
   - Todos los tags detectados
   - Con significado si está en tooltip
   - Sin duplicados por nombre

**Campos opcionales**:
- descripcion: detalles adicionales si los hay
- requisitos: null si no hay
- bonificaciones: array de strings con bonificaciones adicionales

**NO uses**: "palabras_clave" en objetos de skill, solo "tags"`;
  }

  // Generar prompt para extraer glifos de imágenes
  static generateGlyphsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información completa de los glifos de Diablo 4.

**⚠️ IMPORTANTE - CAPTURA COMPLETA:**

- **Si la imagen muestra MÚLTIPLES glifos, captura TODOS en un solo JSON**
- **Cada glifo debe incluir:**
  - Todos sus efectos y bonificaciones
  - Requisitos exactos (valores numéricos)
  - Todos los detalles visibles
  - Palabras clave (tags) que aparezcan en BLANCO/SUBRAYADAS

**⚠️ IMPORTANTE - TAGS ESTRUCTURADOS:**

Los tags son palabras clave del juego (mecánicas, efectos, condiciones).
- **SOLO** captura palabras que aparezcan en BLANCO/SUBRAYADAS en la imagen
- Cada tag debe tener: tag (normalizado), texto_original, significado (si disponible), categoría
- Los tags se guardan de forma global y se referencian por ID

**Instrucciones:**
1. Identifica cada glifo visible en la imagen
2. Extrae todos los datos: nombre, rareza, efectos, bonificaciones, requisitos
3. Para cada bonificación: captura requisitos exactos y descripción completa
4. Identifica palabras en BLANCO/SUBRAYADAS y crea tags estructurados
5. Presta especial atención a los valores numéricos

**Formato JSON esperado:**

\`\`\`json
{
  "glifos": [
    {
      "id": "glifo_dominio",
      "nombre": "Dominio",
      "rareza": "Legendario",
      "nivel_requerido": 1,
      "efecto_base": "Aumenta el daño que infliges a las entidades afectadas por el control de masas en un 9.6%.",
      "atributo_escalado": {
        "atributo": "Inteligencia",
        "bonificacion": "Otorga +0.66% de daño por cada punto de Inteligencia comprado dentro del radio."
      },
      "bonificacion_adicional": {
        "requisito": "25 puntos de Inteligencia",
        "descripcion": "Aumenta la duración de los efectos de control de masas en un 25%."
      },
      "bonificacion_legendaria": {
        "requisito": "40 puntos de Inteligencia",
        "descripcion": "Mientras tienes una barrera activa, obtienes un 10% de reducción de tiempo de reutilización."
      },
      "tamano_radio": "5 nodos",
      "requisitos_especiales": null,
      "estado": "Encontrado",
      "tags": ["control_de_masas", "barrera", "reduccion_tiempo_reutilizacion"]
    },
    {
      "id": "glifo_guardian",
      "nombre": "Guardián",
      "rareza": "Raro",
      "nivel_requerido": 1,
      "efecto_base": "Aumentas la Vida máxima en un 4%.",
      "atributo_escalado": {
        "atributo": "Voluntad",
        "bonificacion": "Otorga +0.07% de Vida máxima por cada punto de Voluntad comprado dentro del radio."
      },
      "bonificacion_adicional": {
        "requisito": "25 puntos de Voluntad",
        "descripcion": "Mientras estás fortificado, infliges un 3% más de daño."
      },
      "bonificacion_legendaria": null,
      "tamano_radio": "4 nodos",
      "requisitos_especiales": null,
      "estado": "Encontrado",
      "tags": ["fortificar"]
    }
  ],
  "palabras_clave": [
    {
      "tag": "control_de_masas",
      "texto_original": "control de masas",
      "significado": "Efectos que limitan la movilidad o acciones del enemigo: aturdimiento, ralentización, congelación, etc.",
      "categoria": "mecanica",
      "fuente": "tooltip"
    },
    {
      "tag": "fortificar",
      "texto_original": "fortificado",
      "significado": "Fortificar es una reserva adicional de Vida que aumenta tu Vida máxima. La fortificación se drena antes que tu Vida cuando recibes daño.",
      "categoria": "mecanica",
      "fuente": "tooltip"
    },
    {
      "tag": "barrera",
      "texto_original": "barrera",
      "significado": "Una barrera absorbe una cierta cantidad de daño de todas las fuentes hasta que se destruye.",
      "categoria": "mecanica",
      "fuente": "tooltip"
    },
    {
      "tag": "reduccion_tiempo_reutilizacion",
      "texto_original": "reducción de tiempo de reutilización",
      "significado": null,
      "categoria": "atributo",
      "fuente": "glifo"
    }
  ]
}
\`\`\`

**REGLAS CRÍTICAS:**

1. **Tags solo palabras blancas/subrayadas - ⚠️ MUY IMPORTANTE:**
   - ✅ CORRECTO: Si "fortificado" aparece en blanco → tag: "fortificar"
   - ✅ CORRECTO: Si "control de masas" aparece en blanco → tag: "control_de_masas"
   - ❌ INCORRECTO: NO crear tag "daño con barrera" si solo "barrera" está en blanco
   - ❌ INCORRECTO: NO inventar tags de texto normal que no esté resaltado

2. **IDs únicos y descriptivos**:
   - Formato: "glifo_" + nombre_normalizado
   - Ejemplos: "glifo_dominio", "glifo_guardian", "glifo_esencia_combate"
   - Usa snake_case y caracteres ASCII

3. **Rareza** (EXACTAMENTE uno de estos):
   - "Común"
   - "Raro"
   - "Legendario"

4. **Atributos escalados**:
   - Atributos válidos: "Fuerza", "Destreza", "Inteligencia", "Voluntad"
   - Captura el texto EXACTO de la bonificación (incluye símbolo + y porcentajes)

5. **Bonificaciones adicional y legendaria**:
   - Captura el requisito EXACTO (ej: "25 puntos de Inteligencia")
   - Si no existe la bonificación, usa null (no omitir el campo)
   - Solo glifos Legendarios tienen bonificacion_legendaria

6. **Tamaño/radio**:
   - Captura como aparece: "5 nodos", "3 nodos", etc.
   - Si no está visible, usa null

7. **Estado**:
   - Siempre "Encontrado" para glifos que el jugador posee
   - Si quieres listar glifos no encontrados, usa "No encontrado"

8. **Estructura de tag (en palabras_clave global)**:
   \`\`\`json
   {
     "tag": "control_de_masas",
     "texto_original": "control de masas",
     "significado": "Efectos que limitan la movilidad...",
     "categoria": "mecanica",
     "fuente": "tooltip"
   }
   \`\`\`
   
   Si NO hay tooltip:
   \`\`\`json
   {
     "tag": "vida_maxima",
     "texto_original": "Vida máxima",
     "significado": null,
     "categoria": "atributo",
     "fuente": "glifo"
   }
   \`\`\`

9. **Categorías de tags**:
   - "mecanica": Mecánicas del juego (fortificar, barrera, crítico)
   - "atributo": Atributos y stats (vida, daño, velocidad)
   - "efecto": Efectos específicos
   - "condicion": Estados (vulnerable, quemadura, enfriamiento)
   - "recurso": Fe, maná, furia, energía
   - "tipo_de_danio": Físico, sagrado, sombra, etc.

10. **Sección palabras_clave global**:
    - Recopila TODOS los tags detectados en TODOS los glifos
    - Incluir significado si está disponible en tooltip
    - Sin duplicados por tag normalizado
    - Orden alfabético preferido

11. **Valores numéricos**:
    - Captura valores EXACTOS: "9.6%", "25 puntos", "10%"
    - NO redondear ni aproximar
    - Incluye símbolos: %, +, puntos, etc.

12. **Arrays tags en cada glifo**:
    - Contiene SOLO strings simples
    - Deben coincidir con tags en palabras_clave global
    - Ejemplo: ["fortificar", "barrera", "control_de_masas"]

**VALIDACIONES:**

- ✅ Cada glifo DEBE tener: id, nombre, rareza, efecto_base, estado
- ✅ Si hay atributo_escalado, DEBE tener: atributo y bonificacion
- ✅ Si hay bonificacion_adicional, DEBE tener: requisito y descripcion
- ✅ Tags array puede estar vacío [] pero NO null
- ✅ Rareza debe ser exactamente una de las 3 opciones
- ✅ nivel_requerido debe ser número (típicamente 1)

**CASOS ESPECIALES:**

- **Glifos sin bonificaciones legendarias**: Usa null para bonificacion_legendaria
- **Glifos sin tags visibles**: Usa array vacío []
- **Múltiples glifos en una imagen**: Captura TODOS en el array glifos
- **Valores con decimales**: Usa punto decimal: 9.6 (NO 9,6)

**NO uses**: "palabras_clave" dentro de objetos de glifo, solo "tags"`;
  }

  // Generar prompt para extraer aspectos de imágenes
  static generateAspectsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información completa de los aspectos legendarios de Diablo 4.

**⚠️ IMPORTANTE - CAPTURA COMPLETA:**

- **Si la imagen muestra MÚLTIPLES aspectos, captura TODOS en un solo JSON**
- **Cada aspecto debe incluir:**
  - Nombre completo y nombre corto
  - Efecto exacto con valores numéricos
  - Nivel (formato X/Y)
  - Categoría determinada por COLOR de fondo
  - Palabras clave (tags) que aparezcan en BLANCO/SUBRAYADAS

**IMPORTANTE - Identificación por color:**
Los aspectos se identifican por su color de fondo de icono/carta:
- 🔵 **AZUL** = Defensivo (defensivo)
- 🔴 **ROJO** = Ofensivo (ofensivo)
- 🟢 **VERDE** = Recurso (recurso)
- 🟣 **MORADO** = Utilidad (utilidad)
- 🟡 **AMARILLO** = Movilidad (movilidad)

**⚠️ IMPORTANTE - TAGS ESTRUCTURADOS:**

Los tags son palabras clave del juego (mecánicas, efectos, condiciones).
- **SOLO** captura palabras que aparezcan en BLANCO/SUBRAYADAS en la imagen
- Cada tag debe tener: tag (normalizado), texto_original, significado (si disponible), categoría
- Los tags se guardan de forma global y se referencian por ID

**Instrucciones:**
1. Identifica cada aspecto visible en la imagen
2. Determina la categoría según el COLOR de fondo del icono/carta
3. Extrae el nombre completo y crea el nombre corto
4. Copia la descripción EXACTA del efecto con todos los valores
5. Identifica palabras en BLANCO/SUBRAYADAS y crea tags estructurados
6. Extrae el nivel (formato X/Y)
7. Nota cualquier requisito o condición especial

**Formato JSON esperado:**

\`\`\`json
{
  "aspectos": [
    {
      "id": "aspecto_tempestad_aceleradora",
      "name": "Aspecto de la Tempestad Aceleradora",
      "shortName": "de la Tempestad Aceleradora",
      "effect": "Los golpes críticos con habilidades de ventisca aumentan tu velocidad de ataque un 15% durante 3 segundos, acumulándose hasta 5 veces.",
      "level": "5/21",
      "category": "ofensivo",
      "tags": ["critico", "velocidad_ataque", "ventisca"]
    },
    {
      "id": "aspecto_renovacion",
      "name": "Aspecto de Renovación",
      "shortName": "de Renovación",
      "effect": "Cuando usas una poción de sanación, también recuperas un 30% de tu recurso principal y generas una barrera que absorbe un 20% de tu Vida máxima.",
      "level": "3/21",
      "category": "defensivo",
      "tags": ["barrera", "recurso_principal", "sanacion"]
    },
    {
      "id": "aspecto_conductor",
      "name": "Aspecto del Conductor",
      "shortName": "del Conductor",
      "effect": "Obtienes un 25% de velocidad de movimiento durante 3 segundos después de usar Teletransporte.",
      "level": "7/21",
      "category": "movilidad",
      "tags": ["velocidad_movimiento", "teletransporte"]
    },
    {
      "id": "aspecto_recursos_abundantes",
      "name": "Aspecto de Recursos Abundantes",
      "shortName": "de Recursos Abundantes",
      "effect": "Cada punto de tu recurso principal por encima del 95% te otorga un 2% de aumento de daño, hasta un máximo del 40%.",
      "level": "10/21",
      "category": "recurso",
      "tags": ["recurso_principal", "aumento_danio"]
    },
    {
      "id": "aspecto_guardavidas",
      "name": "Aspecto del Guardavidas",
      "shortName": "del Guardavidas",
      "effect": "Cuando tu Vida cae por debajo del 50%, obtienes una barrera que absorbe el 40% de tu Vida máxima durante 5 segundos. Este efecto tiene 90 segundos de tiempo de reutilización.",
      "level": "4/21",
      "category": "utilidad",
      "tags": ["barrera", "vida_maxima"]
    }
  ],
  "palabras_clave": [
    {
      "tag": "critico",
      "texto_original": "críticos",
      "significado": "Los ataques críticos infligen un 50% más de daño base.",
      "categoria": "mecanica",
      "fuente": "tooltip"
    },
    {
      "tag": "velocidad_ataque",
      "texto_original": "velocidad de ataque",
      "significado": "Aumenta la velocidad a la que realizas ataques básicos y de habilidades.",
      "categoria": "atributo",
      "fuente": "tooltip"
    },
    {
      "tag": "ventisca",
      "texto_original": "ventisca",
      "significado": null,
      "categoria": "efecto",
      "fuente": "aspecto"
    },
    {
      "tag": "barrera",
      "texto_original": "barrera",
      "significado": "Una barrera absorbe una cierta cantidad de daño de todas las fuentes hasta que se destruye.",
      "categoria": "mecanica",
      "fuente": "tooltip"
    },
    {
      "tag": "recurso_principal",
      "texto_original": "recurso principal",
      "significado": null,
      "categoria": "recurso",
      "fuente": "aspecto"
    },
    {
      "tag": "sanacion",
      "texto_original": "sanación",
      "significado": null,
      "categoria": "mecanica",
      "fuente": "aspecto"
    },
    {
      "tag": "velocidad_movimiento",
      "texto_original": "velocidad de movimiento",
      "significado": null,
      "categoria": "atributo",
      "fuente": "aspecto"
    },
    {
      "tag": "teletransporte",
      "texto_original": "Teletransporte",
      "significado": null,
      "categoria": "habilidad",
      "fuente": "aspecto"
    },
    {
      "tag": "aumento_danio",
      "texto_original": "aumento de daño",
      "significado": null,
      "categoria": "atributo",
      "fuente": "aspecto"
    },
    {
      "tag": "vida_maxima",
      "texto_original": "Vida máxima",
      "significado": null,
      "categoria": "atributo",
      "fuente": "aspecto"
    }
  ]
}
\`\`\`

**REGLAS CRÍTICAS:**

1. **Tags solo palabras blancas/subrayadas - ⚠️ MUY IMPORTANTE:**
   - ✅ CORRECTO: Si "críticos" aparece en blanco → tag: "critico"
   - ✅ CORRECTO: Si "velocidad de ataque" aparece en blanco → tag: "velocidad_ataque"
   - ❌ INCORRECTO: NO crear tag "golpes criticos aumentan" de texto completo
   - ❌ INCORRECTO: NO inventar tags de texto normal que no esté resaltado

2. **IDs únicos y descriptivos**:
   - Formato: "aspecto_" + nombre_corto_normalizado
   - Ejemplos: "aspecto_tempestad_aceleradora", "aspecto_renovacion", "aspecto_conductor"
   - Usa snake_case y caracteres ASCII (sin tildes)
   - Elimina artículos: "del" → "", "de la" → "", "de" → ""

3. **Categoría por COLOR** (EXACTAMENTE una de estas EN MINÚSCULAS):
   - "ofensivo" (🔴 rojo)
   - "defensivo" (🔵 azul)
   - "recurso" (🟢 verde)
   - "utilidad" (🟣 morado)
   - "movilidad" (🟡 amarillo)

4. **Nombre (name)**:
   - Nombre COMPLETO del aspecto como aparece en el juego
   - Incluye "Aspecto" al principio
   - Ejemplos: "Aspecto de la Tempestad Aceleradora", "Aspecto de Renovación"

5. **Nombre Corto (shortName)**:
   - Elimina "Aspecto" del principio
   - Mantiene artículos: "de la", "del", "de"
   - Ejemplos: "de la Tempestad Aceleradora", "de Renovación", "del Conductor"

6. **Efecto (effect)**:
   - Copia EXACTA del texto del aspecto
   - DEBE incluir valores numéricos exactos: "15%", "3 segundos", "5 veces"
   - NO aproximar ni redondear valores
   - Incluye todas las condiciones y detalles

7. **Nivel (level)**:
   - Formato: "X/Y" donde X = nivel actual, Y = nivel máximo
   - Ejemplos: "3/21", "10/21", "21/21"
   - Siempre string, NO número

8. **Estructura de tag (en palabras_clave global)**:
   \`\`\`json
   {
     "tag": "velocidad_ataque",
     "texto_original": "velocidad de ataque",
     "significado": "Aumenta la velocidad a la que realizas ataques...",
     "categoria": "atributo",
     "fuente": "tooltip"
   }
   \`\`\`
   
   Si NO hay tooltip:
   \`\`\`json
   {
     "tag": "ventisca",
     "texto_original": "ventisca",
     "significado": null,
     "categoria": "efecto",
     "fuente": "aspecto"
   }
   \`\`\`

9. **Categorías de tags**:
   - "mecanica": Mecánicas del juego (barrera, crítico, sanación)
   - "atributo": Stats (vida, velocidad, daño)
   - "efecto": Efectos específicos (ventisca, quemadura)
   - "condicion": Estados (vulnerable, enfriamiento, congelado)
   - "recurso": Fe, maná, furia, energía, recurso principal
   - "tipo_de_danio": Físico, sagrado, sombra, fuego, etc.
   - "habilidad": Nombres de habilidades específicas

10. **Sección palabras_clave global**:
    - Recopila TODOS los tags detectados en TODOS los aspectos
    - Incluir significado si está disponible en tooltip
    - Sin duplicados por tag normalizado
    - Orden alfabético preferido

11. **Arrays tags en cada aspecto**:
    - Contiene SOLO strings simples
    - Deben coincidir con tags en palabras_clave global
    - Ejemplo: ["critico", "velocidad_ataque", "ventisca"]
    - Puede estar vacío [] si no hay tags visibles

**VALIDACIONES:**

- ✅ Cada aspecto DEBE tener: id, name, shortName, effect, level, category
- ✅ category debe ser exactamente una de las 5 opciones EN MINÚSCULAS
- ✅ level debe tener formato "X/Y"
- ✅ effect debe incluir valores numéricos exactos
- ✅ Tags array puede estar vacío [] pero NO null
- ✅ shortName NUNCA incluye la palabra "Aspecto"
- ✅ name SIEMPRE incluye "Aspecto" al principio

**CASOS ESPECIALES:**

- **Aspectos sin tags visibles**: Usa array vacío []
- **Múltiples aspectos en una imagen**: Captura TODOS en el array aspectos
- **Valores con decimales**: Usa punto decimal: 15.5 (NO 15,5)
- **Porcentajes**: Siempre incluye el símbolo %: "15%"
- **Tiempos**: Incluye unidad completa: "3 segundos", "90 segundos"
- **Acumulación**: Especifica límite: "hasta 5 veces", "hasta un máximo del 40%"

**EJEMPLOS DE ERRORES COMUNES:**

❌ category: "Ofensivo" → ✅ category: "ofensivo"
❌ level: 3 → ✅ level: "3/21"
❌ shortName: "Aspecto de Velocidad" → ✅ shortName: "de Velocidad"
❌ effect: "Aumenta velocidad 15%" → ✅ effect: "Aumenta velocidad de ataque un 15% durante 3 segundos"
❌ tags: ["golpes criticos con ventisca"] → ✅ tags: ["critico", "ventisca"]

**NO uses**: "palabras_clave" ni "keywords" dentro de objetos de aspecto, solo "tags"`;
  }

  // Generar prompt para habilidades completas (activas + pasivas)
  static generateFullSkillsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información completa de las habilidades (activas y pasivas) de Diablo 4.

**⚠️ IMPORTANTE - TAGS ESTRUCTURADOS:**

Los tags son palabras clave del juego. Solo captura palabras en BLANCO/SUBRAYADAS.

**Instrucciones:**
1. Identifica tanto habilidades activas como pasivas
2. Extrae: nombre, tipo, niveles, efectos, modificadores
3. Identifica tags (palabras blancas/subrayadas) y crea objetos estructurados
4. Organiza en dos categorías: activas y pasivas

**Formato JSON esperado:**

\`\`\`json
{
  "habilidades_activas": [
    {
      "id": "skill_activa_[genera_id_unico]",
      "nombre": "Luz Sagrada",
      "tipo_habilidad": "skill",
      "tipo": "Principal",
      "rama": "Sagrado",
      "nivel_actual": 3,
      "nivel_maximo": 5,
      "descripcion": "Asestas un golpe contra los enemigos frente a ti con tu arma...",
      "tipo_danio": "Sagrado",
      "tags": [],
      "modificadores": [
        {
          "nombre": "Luz Sagrada Mejorada",
          "descripcion": "Luz sagrada ahora penetra en los enemigos y activa contra todos los enemigos situados en su trayectoria.",
          "tags": []
        },
        {
          "nombre": "Luz Sagrada Santificada",
          "descripcion": "Luz sagrada inflige un 30% más de daño y lanza una nova que inflige un 20% de su daño.",
          "tags": ["fortificar"]
        }
      ]
    }
  ],
  "habilidades_pasivas": [
    {
      "id": "skill_pasiva_12345",
      "nombre": "Longevidad",
      "tipo_habilidad": "pasiva",
      "tipo": "Pasiva",
      "rama": "Sagrado",
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
\`\`\`

**REGLAS CRÍTICAS:**

1. **Tags solo palabras blancas/subrayadas**: ✅ "fortificar", ✅ "imparable", ❌ "asestas golpe"

2. **Tags en modificadores**: Cada modificador puede tener su propio array tags

3. **Niveles**:
   - Activas: nivel_actual, nivel_maximo
   - Pasivas: nivel, nivel_maximo, puntos_asignados

4. **Tipo de habilidad**:
   - Activas: "skill" o "modificador"
   - Pasivas: "pasiva"

5. **Modificadores de habilidades activas**:
   - Cada modificador DEBE tener: id, nombre, tipo_habilidad: "modificador", descripcion, tags
   - Ejemplo ID: "mod_luz_sagrada_potenciada"
   - Los modificadores van en el array modificadores de cada skill

6. **Tipo**:
   - Activas: "Básica", "Principal", "Defensiva", "Movilidad", "Definitiva", "Arma de Arsenal"
   - Pasivas: "Pasiva", "Pasiva Clave", "Pasiva Potenciada", "Nodo del tablero Paragon"

7. **Estructura de tag**:
   - tag: snake_case normalizado
   - texto_original: como aparece en imagen
   - significado: definición (null si no disponible)
   - categoria: mecanica, condicion, efecto, danio, recurso, etc.
   - fuente: tooltip, habilidad, manual

8. **Sección palabras_clave global**:
   - Todos los tags detectados (activas + pasivas)
   - Con significado si está en tooltip
   - Sin duplicados por nombre

**NO uses**: "palabras_clave" en objetos de skill/pasiva, solo "tags"

**Incluye TODAS las habilidades visibles en la imagen**`;
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

