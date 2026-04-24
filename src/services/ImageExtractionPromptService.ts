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
   - Si no hay significado, usa null

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
  - Todos los detalles visibles (con campo 'activo')
  - Palabras clave (tags) que aparezcan en BLANCO/SUBRAYADAS

**⚠️ NUEVO EN v0.5.4 - CAMPO DETALLES[] CON ESTADO ACTIVO:**

Cada glifo DEBE incluir un array \`detalles[]\` con TODOS los efectos, bonificaciones y requisitos:
- **texto**: El texto exacto del efecto/bonificación
- **activo**: \`true\` si el texto está en BLANCO/VERDE, \`false\` si está en GRIS (requisito no cumplido)
- **valor**: El valor numérico extraído (ej: "9.6%", "25", "+0.66%")

Esto es CRÍTICO para:
1. Saber qué bonificaciones están activas en el personaje
2. Enlazar correctamente los glifos equipados en zócalos de tableros Paragon
3. Mostrar correctamente en gris las bonificaciones inactivas en la UI

**⚠️ IMPORTANTE - TAGS ESTRUCTURADOS:**

Los tags son palabras clave del juego (mecánicas, efectos, condiciones).
- **SOLO** captura palabras que aparezcan en BLANCO/SUBRAYADAS en la imagen
- Cada tag debe tener: tag (normalizado), texto_original, significado (si disponible), categoría
- Los tags se guardan de forma global y se referencian por ID

**Instrucciones:**
1. Identifica cada glifo visible en la imagen
2. Extrae todos los datos: nombre, rareza, efectos, bonificaciones, requisitos
3. **CRÍTICO**: Crea array \`detalles[]\` con TODOS los efectos/bonificaciones (marca activo: true/false según color del texto)
4. Para cada bonificación: captura requisitos exactos y descripción completa
5. Identifica palabras en BLANCO/SUBRAYADAS y crea tags estructurados
6. Presta especial atención a los valores numéricos

**Formato JSON esperado (v0.5.4 con detalles[]):**

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
      "detalles": [
        {
          "texto": "Aumenta el daño que infliges a las entidades afectadas por el control de masas",
          "activo": true,
          "valor": "9.6%"
        },
        {
          "texto": "Otorga +0.66% de daño por cada punto de Inteligencia comprado dentro del radio",
          "activo": true,
          "valor": "0.66%"
        },
        {
          "texto": "Aumenta la duración de los efectos de control de masas (Requiere: 25 Inteligencia)",
          "activo": false,
          "valor": "25%"
        },
        {
          "texto": "Mientras tienes una barrera activa, obtienes reducción de tiempo de reutilización (Requiere: 40 Inteligencia)",
          "activo": false,
          "valor": "10%"
        }
      ],
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
      "detalles": [
        {
          "texto": "Aumentas la Vida máxima",
          "activo": true,
          "valor": "4%"
        },
        {
          "texto": "Otorga +0.07% de Vida máxima por cada punto de Voluntad comprado dentro del radio",
          "activo": true,
          "valor": "0.07%"
        },
        {
          "texto": "Mientras estás fortificado, infliges más daño (Requiere: 25 Voluntad)",
          "activo": true,
          "valor": "3%"
        }
      ],
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

2. **Campo detalles[] con activo (v0.5.4) - ⚠️ OBLIGATORIO:**
   - **DEBE** estar presente en cada glifo
   - Incluir TODOS los efectos y bonificaciones del glifo
   - **activo: true** → Texto en BLANCO/VERDE (efecto está activo)
   - **activo: false** → Texto en GRIS (requisito no cumplido, efecto inactivo)
   - Ejemplo: Si falta Inteligencia para bonificación adicional → activo: false
   - **valor**: Extraer números del texto ("25%" → "25%", "0.66%" → "0.66%")

3. **IDs únicos y descriptivos**:
   - Formato: "glifo_" + nombre_normalizado
3. **IDs únicos y descriptivos**:
   - Formato: "glifo_" + nombre_normalizado
   - Ejemplos: "glifo_dominio", "glifo_guardian", "glifo_esencia_combate"
   - Usa snake_case y caracteres ASCII

4. **Rareza** (EXACTAMENTE uno de estos):
   - "Común"
   - "Raro"
   - "Legendario"

5. **Atributos escalados**:
   - Atributos válidos: "Fuerza", "Destreza", "Inteligencia", "Voluntad"
   - Captura el texto EXACTO de la bonificación (incluye símbolo + y porcentajes)

6. **Bonificaciones adicional y legendaria**:
   - Captura el requisito EXACTO (ej: "25 puntos de Inteligencia")
   - Si no existe la bonificación, usa null (no omitir el campo)
   - Solo glifos Legendarios tienen bonificacion_legendaria

7. **Tamaño/radio**:
   - Captura como aparece: "5 nodos", "3 nodos", etc.
   - Si no está visible, usa null

8. **Estado**:
   - Siempre "Encontrado" para glifos que el jugador posee
   - Si quieres listar glifos no encontrados, usa "No encontrado"

9. **Estructura de tag (en palabras_clave global)**:
9. **Estructura de tag (en palabras_clave global)**:
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

10. **Categorías de tags**:
   - "mecanica": Mecánicas del juego (fortificar, barrera, crítico)
   - "atributo": Atributos y stats (vida, daño, velocidad)
   - "efecto": Efectos específicos
   - "condicion": Estados (vulnerable, quemadura, enfriamiento)
   - "recurso": Fe, maná, furia, energía
   - "tipo_de_danio": Físico, sagrado, sombra, etc.

11. **Sección palabras_clave global**:
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

  // Generar prompt para extraer aspectos de mazmorras/calabozos de Diablo 4
  static generateDungeonAspectsPrompt(): string {
    return `Analiza la imagen de la mazmorra/calabozo de Diablo 4 que te voy a proporcionar y extrae la información del aspecto que se obtiene al completarla por primera vez.

**⚠️ IMPORTANTE - CONTEXTO:**

- Las mazmorras/calabozos otorgan UN SOLO ASPECTO como recompensa de primera vez
- La imagen muestra el nombre de la mazmorra y el aspecto obtenido
- **IDENTIFICACIÓN DEL HÉROE**: Al final de la imagen verás texto "Solo" seguido de un ICONO de clase de héroe
- Los iconos de clase son:
  - 🗡️ Bárbaro (guerrero con armadura pesada)
  - 🐺 Druida (rostro con cuernos/naturaleza)
  - 🏹 Pícaro (encapuchado/sombras)
  - 🔮 Hechicera (maga con personal)
  - 💀 Nigromante (calavera/oscuro)
  - ⚔️ Paladín/Cruzado (caballero sagrado/cruz)
  - 🌪️ Espiritista (espíritus/chamanismo)

**INSTRUCCIONES:**

1. Identifica el **nombre de la mazmorra** en la parte superior
2. Localiza el texto "Solo" y el **icono de clase** que aparece junto a él
3. Extrae toda la información del **aspecto_recompensa** (aspecto de recompensa):
   - Nombre completo del aspecto
   - Efecto exacto con todos los valores numéricos
   - Categoría según el COLOR del icono del aspecto
   - Tags (palabras en BLANCO/SUBRAYADAS)
4. El nivel siempre será "1/21" para aspectos de mazmorra

**CATEGORÍAS POR COLOR:**
- 🔵 **AZUL** = defensivo
- 🔴 **ROJO** = ofensivo  
- 🟢 **VERDE** = recurso
- 🟣 **MORADO** = utilidad
- 🟡 **AMARILLO** = movilidad

**⚠️ TAGS ESTRUCTURADOS:**
- Solo captura palabras que aparezcan en BLANCO/SUBRAYADAS en la descripción del aspecto
- Cada tag debe tener: tag (normalizado), texto_original, significado, categoría

**Formato JSON esperado:**

**IMPORTANTE**: El JSON debe ser un OBJETO con una propiedad "mazmorras" que contiene un ARRAY de mazmorras.

Ejemplo de estructura JSON:
{
  "mazmorras": [
    {
      "mazmorra": {
        "nombre": "Madriguera Aullante",
        "clase_requerida": "Paladín",
        "descripcion": "Una guarida de lobos y huargos corruptos, hambrientos de carne humana."
      },
      "aspecto": {
        "id": "aspecto_tormentas_flechas",
        "name": "Aspecto de Tormentas de Flechas",
        "shortName": "de Tormentas de Flechas",
        "effect": "Golpe afortunado: Tus habilidades de Tirador y Degollador tienen hasta un 25% de probabilidad de crear una Tormenta de Flechas en la ubicación del enemigo, lo que inflige 310 de daño físico durante 3 segundos. Tus Tormentas de Flechas infligen un 45% más de daño.",
        "level": "1/21",
        "category": "ofensivo",
        "tags": ["golpe_afortunado", "tirador", "degollador", "tormenta_flechas", "daño_fisico"],
        "aspecto_id": "aspecto_tormentas_flechas",
        "detalles": [],
        "ubicacion_mazmorra": "Madriguera Aullante"
      },
      "palabras_clave": [
        {
          "tag": "golpe_afortunado",
          "texto_original": "Golpe afortunado",
          "significado": "Tus ataques y habilidades tienen una probabilidad de activar efectos especiales.",
          "categoria": "mecanica",
          "fuente": "tooltip"
        },
        {
          "tag": "tirador",
          "texto_original": "Tirador",
          "significado": "Categoría de habilidades del Pícaro que usan armas a distancia.",
          "categoria": "tipo_habilidad",
          "fuente": "tooltip"
        },
        {
          "tag": "degollador",
          "texto_original": "Degollador",
          "significado": "Categoría de habilidades del Pícaro de combate cuerpo a cuerpo.",
          "categoria": "tipo_habilidad",
          "fuente": "tooltip"
        },
        {
          "tag": "tormenta_flechas",
          "texto_original": "Tormenta de Flechas",
          "significado": "Habilidad del Pícaro que dispara múltiples flechas en un área.",
          "categoria": "habilidad",
          "fuente": "tooltip"
        },
        {
          "tag": "daño_fisico",
          "texto_original": "daño físico",
          "significado": "Tipo de daño que no es elemental (fuego, hielo, rayo, veneno, etc).",
          "categoria": "tipo_daño",
          "fuente": "tooltip"
        }
      ]
    }
  ]
}

**REGLAS CRÍTICAS:**

1. **clase_requerida**: Identifica correctamente el héroe por el icono junto a "Solo":
   - Bárbaro, Druida, Pícaro, Hechicera, Nigromante, Paladín, Espiritista

2. **level**: Siempre "1/21" para aspectos de mazmorra

3. **ubicacion_mazmorra**: Debe coincidir exactamente con el nombre de la mazmorra

4. **shortName**: NUNCA incluye la palabra "Aspecto"

5. **category**: Debe ser minúsculas: ofensivo, defensivo, recurso, utilidad, movilidad

6. **effect**: Copia EXACTAMENTE el texto con todos los valores numéricos y símbolos %

7. **aspecto_id**: Debe ser idéntico al valor de "id"

8. **detalles**: Siempre un array vacío []

9. **Tags solo palabras blancas/subrayadas**: Si no hay palabras destacadas, usa array vacío []

**EJEMPLOS DE ERRORES COMUNES:**

❌ clase_requerida: "Todos" → ✅ clase_requerida: "Pícaro" (identificar por icono)
❌ level: "5/21" → ✅ level: "1/21" (siempre nivel 1 en mazmorras)
❌ ubicacion_mazmorra: null → ✅ ubicacion_mazmorra: "Nombre de la Mazmorra"
❌ category: "Ofensivo" → ✅ category: "ofensivo"

**IMPORTANTE**: El icono de clase junto a "Solo" es CRÍTICO para determinar a qué héroe pertenece el aspecto. Identifícalo cuidadosamente.`;
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
4. **NIVEL Y PARAGON:** En atributosPrincipales extrae tanto "nivel" (nivel base 1-60) como "nivel_paragon" (nivel Paragon visible en la UI)
5. Identifica palabras marcadas en BLANCO/SUBRAYADAS en los detalles (son palabras clave del juego)
6. Si ves la definición del "Aguante", inclúyela completa
7. **Para cada detalle agrega SIEMPRE el atributo al que pertenece:**
  - \`atributo_ref\`: key técnica del campo (ej: \`probabilidadGolpeCritico\`, \`danioContraEnemigosVulnerables\`, \`vidaMaxima\`)
  - \`atributo_nombre\`: nombre visible (ej: "Probabilidad de golpe crítico", "Daño contra enemigos vulnerables")
8. Si no hay marco de selección visible, deduce el atributo por el título del tooltip o por el texto del detalle (lado izquierdo)
9. NO omitas detalles de atributos compartidos (vulnerables, crítico, abrumar, daño con estados, etc.)

**NOMBRES DE CAMPOS EXACTOS (IMPORTANTE):**
Usa estos nombres de campos EXACTOS para cada sección:

**Defensivo:**
- vidaMaxima
- cantidadPociones
- sanacionRecibida
- vidaPorEliminacion
- vidaCada5Segundos (NO "regeneracionVida5s"!)
- probabilidadBloqueo
- reduccionBloqueo
- reduccionDanioCercanos
- bonificacionFortificacion
- bonificacionBarrera
- probabilidadEsquivar

**Ofensivo:**
- danioBaseArma
- velocidadArma
- bonificacionVelocidadAtaque
- probabilidadGolpeCritico
- danioGolpeCritico
- probabilidadAbrumar
- danioAbrumador
- danioContraEnemigosVulnerables
- todoElDanio
- danioFisico, danioFuego, danioRayo, danioFrio, danioVeneno, danioSombra
- danioConSangrado, danioConQuemadura, danioConVeneno, danioConCorrupcion
- danioVsEnemigosCercanos, danioVsEnemigosElite, danioVsEnemigosSaludables
- espinas

**Utilidad:**
- maximoFe (NO "maximoDeFuria"!)
- reduccionCostoFe
- regeneracionFe
- feConCadaEliminacion
- velocidadMovimiento
- reduccionRecuperacion (NO "reduccionDeRecuperacion"!)
- bonificacionProbabilidadGolpeAfortunado (NO "probabilidadGolpeAfortunado"!)
- bonificacionExperiencia

**JcJ (sección separada):**
- reduccionDanio (NO incluir en "utilidad" como "reduccionDanioJcJ"!)

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
      "nivel_paragon": 150,
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
          "atributo_ref": "danioContraEnemigosVulnerables",
          "atributo_nombre": "Daño contra enemigos vulnerables",
          "texto": "Bonificación de daño contra enemigos vulnerables: 80.0%",
          "palabras_clave": ["vulnerables"]
        },
        {
          "atributo_ref": "danioContraEnemigosVulnerables",
          "atributo_nombre": "Daño contra enemigos vulnerables",
          "texto": "Tus habilidades infligen más daño contra enemigos vulnerables",
          "palabras_clave": ["vulnerables"]
        },
        {
          "atributo_ref": "danioContraEnemigosVulnerables",
          "atributo_nombre": "Daño contra enemigos vulnerables",
          "texto": "Incluye el 100.0 % de daño aumentado inherente que los enemigos vulnerables reciben de todas las fuentes",
          "palabras_clave": ["vulnerables"]
        },
        {
          "atributo_ref": "danioContraEnemigosVulnerables",
          "atributo_nombre": "Daño contra enemigos vulnerables",
          "texto": "Tienes +50.0 % de este atributo por objetos y Paragón",
          "contribucion": "objetos y Paragón",
          "valor": "50.0%"
        }
      ],
      "palabras_clave": ["vulnerables", "golpe_critico"]
    },
    "defensivo": {
      "vidaMaxima": 8028,
      "cantidadPociones": 4,
      "sanacionRecibida": 74.1,
      "vidaPorEliminacion": 440,
      "vidaCada5Segundos": 1620,
      "probabilidadBloqueo": 44,
      "reduccionBloqueo": 65,
      "bonificacionFortificacion": 17.5,
      "bonificacionBarrera": 0,
      "detalles": [
        {
          "atributo_ref": "vidaMaxima",
          "atributo_nombre": "Vida máxima",
          "texto": "Tu vida máxima total es de 8,028",
          "valor": 8028
        }
      ],
      "palabras_clave": []
    },
    "utilidad": {
      "velocidadMovimiento": 107.5,
      "reduccionRecuperacion": 15.5,
      "bonificacionProbabilidadGolpeAfortunado": 14.1,
      "bonificacionExperiencia": 529.7,
      "detalles": [],
      "palabras_clave": []
    },
    "jcj": {
      "reduccionDanio": 92
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
      "tag": "vulnerables",
      "texto_original": "vulnerables",
      "significado": "Estado que hace que los enemigos reciban más daño de todas las fuentes",
      "categoria": "condicion",
      "fuente": "estadistica"
    },
    {
      "tag": "golpe_critico",
      "texto_original": "golpe crítico",
      "significado": "Probabilidad de realizar un ataque crítico que causa más daño",
      "categoria": "atributo",
      "fuente": "estadistica"
    },
    {
      "tag": "reduccion_de_danio",
      "texto_original": "reducción de daño",
      "significado": "Porcentaje de daño que se reduce al recibir ataques",
      "categoria": "efecto",
      "fuente": "estadistica"
    },
    {
      "tag": "resistencia",
      "texto_original": "resistencia",
      "significado": "Reducción del daño de un tipo elemental específico",
      "categoria": "atributo",
      "fuente": "estadistica"
    }
  ]
}
\`\`\`

**Notas críticas:**
- **DETALLES:** Extrae TODOS los sub-items de cada estadística como objetos en el array "detalles"
- **Vinculación detalle-atributo:** cada detalle DEBE incluir \`atributo_ref\` y \`atributo_nombre\`
- **Aguante:** Si ves el tooltip, copia la definición completa en aguante_definicion
- **Palabras blancas/subrayadas:** Identifícalas en los detalles y agrégalas a palabras_clave
- **Contribución:** Si menciona "de objetos", "por Paragón", etc., usa el campo contribucion
- **Valores:** Pueden ser números o strings con "%" 
- **MONEDA (Estructura alternativa):** Si extraes tooltips de moneda, puedes usar estructura enriquecida:
  \`\`\`json
  "moneda": {
    "oro": {
      "valor": 415224377,
      "atributo_ref": "oro",
      "atributo_nombre": "Oro",
      "detalles": [{"atributo_ref": "oro", "atributo_nombre": "Oro", "texto": "La moneda principal...", "palabras_clave": ["moneda"]}]
    },
    "obolos": {
      "valor": 1962,
      "maximo": 2500,
      "atributo_ref": "obolos",
      "atributo_nombre": "Óbolos Murmurantes",
      "detalles": [...]
    }
  }
  \`\`\`
  El sistema extrae automáticamente el campo "valor" de cada moneda.
- Si un campo no está visible, usa null u omite el campo
- Incluye TODAS las secciones visibles en la imagen`;
  }

  // Generar prompt para extraer aspectos equipados por el personaje (para CharacterAspects)
  static generateCharacterAspectsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información de los aspectos legendarios que el PERSONAJE tiene EQUIPADOS en su build de Diablo 4.

**⚠️ IMPORTANTE - SALIDA COMPLETA (NO RESUMIDA):**

- Extrae SOLO aspectos equipados visibles.
- Cada aspecto DEBE incluir: nivel actual, categoría por color, efecto completo, valores actuales, detalles y tags.
- NO devuelvas una versión mínima. Necesito datos explícitos por aspecto.

**CATEGORÍA SEGÚN COLOR (OBLIGATORIO):**
- 🔴 Rojo -> "ofensivo"
- 🔵 Azul -> "defensivo"
- 🟢 Verde -> "recurso"
- 🟣 Morado -> "utilidad"
- 🟡 Amarillo -> "movilidad"

**Instrucciones:**
1. Identifica cada aspecto equipado visible en la imagen.
2. Extrae nombre completo y nombre corto.
3. Extrae el nivel actual del aspecto (formato X/21).
4. Extrae la categoría usando el color del aspecto.
5. Extrae el efecto/descripción completa con valores exactos.
6. Extrae valores actuales en objeto clave/valor (snake_case).
7. Extrae detalles explícitos del tooltip/texto de apoyo en array "detalles".
8. Extrae tags por aspecto (palabras clave visibles en BLANCO/SUBRAYADAS) y también en palabras_clave global.
9. Si el slot equipado es visible, inclúyelo; si no, usa null.

**Formato JSON esperado:**

\`\`\`json
{
  "aspectos_equipados": [
    {
      "aspecto_id": "aspecto_recursos_abundantes",
      "name": "Aspecto de Recursos Abundantes",
      "shortName": "de Recursos Abundantes",
      "nivel_actual": "15/21",
      "category": "recurso",
      "effect": "Cada punto de tu recurso principal por encima del 95% te otorga un 3.2% de aumento de daño, hasta un máximo del 64%.",
      "slot_equipado": "Amuleto",
      "valores_actuales": {
        "danio_por_punto": "3.2%",
        "danio_maximo": "64%",
        "umbral_recurso": "95%"
      },
      "detalles": [
        {
          "atributo_ref": "danio_por_punto",
          "atributo_nombre": "Daño por punto de recurso",
          "texto": "Cada punto por encima del 95% otorga 3.2% de daño",
          "valor": "3.2%",
          "palabras_clave": ["recurso", "danio"]
        },
        {
          "atributo_ref": "danio_maximo",
          "atributo_nombre": "Daño máximo",
          "texto": "hasta un máximo del 64%",
          "valor": "64%",
          "palabras_clave": ["danio_maximo"]
        }
      ],
      "tags": ["recurso", "danio", "umbral"]
    }
  ],
  "palabras_clave": [
    {
      "tag": "recurso",
      "texto_original": "recurso principal",
      "significado": "Recurso usado por la clase para habilidades",
      "categoria": "recurso",
      "fuente": "aspecto"
    },
    {
      "tag": "danio",
      "texto_original": "aumento de daño",
      "significado": null,
      "categoria": "atributo",
      "fuente": "aspecto"
    }
  ]
}
\`\`\`

**REGLAS CRÍTICAS:**

1. **aspecto_id**
   - snake_case normalizado
   - usar prefijo "aspecto_"
   - basado en el nombre real del aspecto

2. **name y shortName**
   - name: nombre completo (incluye "Aspecto de/del/de la")
   - shortName: nombre abreviado sin el prefijo "Aspecto"

3. **nivel_actual**
   - formato EXACTO "X/21"
   - obligatorio en cada aspecto

4. **category**
   - obligatoria
   - derivada del color del aspecto
   - solo: ofensivo | defensivo | movilidad | recurso | utilidad

5. **effect**
   - texto completo del efecto con números exactos
   - no resumir ni inventar

6. **valores_actuales**
   - valores exactos del aspecto en ese nivel
   - incluir % cuando aplique
   - claves en snake_case

7. **detalles**
   - obligatorio (puede ser [] si no hay detalle visible)
   - cada detalle debe incluir: atributo_ref, atributo_nombre, texto
   - agregar valor y palabras_clave cuando estén visibles

8. **tags y palabras_clave**
   - tags por aspecto: array de strings normalizados
   - palabras_clave global: objetos estructurados
   - usar solo palabras visibles (especialmente resaltadas)

**VALIDACIONES:**

- ✅ Cada aspecto debe incluir: aspecto_id, name, shortName, nivel_actual, category, effect, valores_actuales, detalles, tags
- ✅ category debe salir del color del aspecto
- ✅ nivel_actual debe ser "X/21"
- ✅ devolver TODOS los aspectos equipados visibles
- ✅ mantener precisión literal de números y porcentajes

**NO hacer:**

- ❌ No devolver solo aspecto_id + nivel_actual
- ❌ No omitir category, effect, detalles o tags
- ❌ No inventar valores que no estén visibles`;
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

  // Agregar restricción opcional de cantidad de elementos a extraer
  static withElementLimit(
    prompt: string,
    elementCount?: number,
    contextLabel: string = 'elementos'
  ): string {
    if (!elementCount || Number.isNaN(elementCount) || elementCount <= 0) {
      return prompt;
    }

    return `${prompt}

---
**LÍMITE DE EXTRACCIÓN:**
- Esta imagen/lote contiene **${elementCount} ${contextLabel} señalados**.
- Extrae **solo esos ${elementCount} elementos** y omite cualquier otro valor no señalado.
- Si un atributo aparece listado pero en este lote no trae su detalle contextual, **no lo incluyas**.
- Cada elemento extraído debe incluir su valor y sus detalles asociados.`;
  }

  // Generar prompt para estadísticas con modelo refactorizado V2 (v0.3.4+)
  static generateStatsPromptV2(): string {
    return this.generateStatsPrompt();
  }

  // ============================================================================
  // PROMPTS PARA SISTEMA PARAGON (v0.4.15)
  // ============================================================================

  // Generar prompt para extraer tableros Paragon (catálogo nivel héroe)
  static generateParagonBoardsPrompt(): string {
    return `Analiza la imagen que te voy a proporcionar y extrae la información de los tableros Paragon de Diablo 4.

**⚠️ IMPORTANTE - TABLEROS PARAGON:**

Los tableros Paragon son las estructuras base donde se colocan los nodos. Cada clase tiene acceso a diferentes tableros.

**Categorías de tableros:**
- **inicial**: El tablero central de inicio (ej: "Empezar")
- **legendario**: Tableros legendarios específicos de clase
- **especial**: Tableros temáticos especiales
- **general**: Tableros genéricos disponibles para todas las clases

**Instrucciones:**
1. Identifica cada tablero visible en la imagen
2. Extrae: nombre completo, categoría, descripción
3. Si es visible, identifica las conexiones disponibles con otros tableros
4. Captura tags (palabras blancas/subrayadas) relacionadas

**Formato JSON esperado:**

\`\`\`json
{
  "tableros": [
    {
      "id": "tablero_empezar",
      "nombre": "Empezar",
      "categoria": "inicial",
      "descripcion": "Tu punto de partida en el sistema Paragon",
      "orden": 0,
      "conexiones_disponibles": [],
      "nodos_totales": 64,
      "tags": []
    },
    {
      "id": "tablero_clamor_ancestros",
      "nombre": "Clamor de los Ancestros",
      "categoria": "legendario",
      "descripcion": "Cuando usas Clamor de los Ancestros, obtienes un 30% de daño adicional durante X segundos.",
      "orden": 1,
      "conexiones_disponibles": ["tablero_empezar"],
      "nodos_totales": 64,
      "tags": ["clamor_ancestros", "danio"]
    }
  ],
  "palabras_clave": [
    {
      "tag": "clamor_ancestros",
      "texto_original": "Clamor de los Ancestros",
      "significado": "Habilidad definitiva del Bárbaro",
      "categoria": "habilidad",
      "fuente": "tooltip"
    },
    {
      "tag": "danio",
      "texto_original": "daño",
      "significado": null,
      "categoria": "atributo",
      "fuente": "tablero"
    }
  ]
}
\`\`\`

**REGLAS CRÍTICAS:**

1. **ID único**: "tablero_" + nombre_normalizado (snake_case, sin tildes)
2. **Categoría**: Debe ser exactamente una de: "inicial" | "legendario" | "especial" | "general"
3. **Descripción**: Efecto o bonificación principal del tablero (si visible)
4. **Orden**: 0 para inicial, 1+ para consecutivos
5. **Tags**: Solo palabras en BLANCO/SUBRAYADAS

**VALIDACIONES:**

- ✅ Cada tablero DEBE tener: id, nombre, categoria
- ✅ categoria debe ser exactamente una de las 4 opciones
- ✅ nodos_totales típicamente es 64 (si no visible, omitir)`;
  }

  // Generar prompt GENÉRICO para extraer nodos Paragon (todas las rarezas)
  // Versión ULTRA-SIMPLIFICADA para OpenAI (máxima compatibilidad con filtros)
  static generateParagonNodesPromptForOpenAI(): string {
    return `Extract character progression tree node data from the game UI screenshot.

**NODE TYPES (identify by border color):**
- Normal (gray/white border)
- Magic (blue border)
- Rare (yellow border)
- Legendary (orange border)

**JSON OUTPUT STRUCTURE:**

\`\`\`json
{
  "nodos": [
    {
      "id": "node_unique_123",
      "nombre": "Node visible name",
      "rareza": "magico",
      "atributos": [
        { "tipo": "max_health", "valor": 4.0 },
        { "tipo": "armor", "valor": 1.5 }
      ],
      "detalles": [
        {
          "texto": "Exact effect text 1",
          "activo": true,
          "valor": "4.0%"
        },
        {
          "texto": "Exact effect text 2",
          "activo": true,
          "valor": "1.5%"
        }
      ],
      "requisitos": {
        "atributo": "strength",
        "valor_actual": 100,
        "valor_requerido": 200
      },
      "replicas": 2,
      "tablero_id": "main_board",
      "tags": []
    }
  ],
  "palabras_clave": []
}
\`\`\`

**REQUIREMENTS:**
1. Field "rareza" is mandatory (normal/magico/raro/legendario)
2. "detalles[].activo": true if text is active (bright color), false if disabled (gray)
3. "requisitos": only if requirement text is visible (e.g., "Required: X/Y Attribute")
4. "replicas": only if identical nodes exist (same name and effects)
5. Extract ALL stat bonuses visible in each node
6. Use Spanish field names but English explanations

**COMMON STAT TYPES:**
strength, dexterity, intelligence, willpower, max_health, armor, resistance, movement_speed, critical_chance, damage, etc.`;
  }

  // Versión completa para Gemini (más detallada)
  static generateParagonNodesPrompt(): string {
    return `Analiza la imagen y extrae los nodos del tablero Paragon de Diablo 4.

**⚠️ CRÍTICO - INCLUIR ZÓCALOS DE GLIFO**

🔴 **IMPORTANTE**: Los tableros Paragon tienen ZÓCALOS DE GLIFO que son nodos especiales (generalmente hexagonales, color naranja/legendario).

**CÓMO IDENTIFICAR UN ZÓCALO:**
- Forma hexagonal especial (diferente a nodos normales)
- Generalmente color NARANJA/LEGENDARIO
- Nombre: "Zócalo de Glifo" o "Glyph Socket"
- Puede tener un glifo equipado dentro (con su nombre e íconos)

**SI ENCUENTRAS UN ZÓCALO → DEBES INCLUIRLO EN EL ARRAY "nodos"**

**ESTRUCTURA DE ZÓCALO CON GLIFO:**
\`\`\`json
{
  "id": "zocalo_glifo_tablero_2",
  "nombre": "Zócalo de Glifo",
  "rareza": "legendario",
  "glifo_info": {
    "nombre": "Revancha",
    "rareza": "Legendario",
    "nivel_actual": 15,
    "tamano_radio": "4 nodos",
    "detalles": [
      {
        "texto": "+4.1% de probabilidad de golpe afortunado",
        "activo": true,
        "valor": "4.1%"
      },
      {
        "texto": "+16 de Fuerza",
        "activo": true,
        "valor": 16
      },
      {
        "texto": "Bonificación adicional: Cuando infliges daño de Espinas (Requiere: 25 Fuerza)",
        "activo": true,
        "valor": "1%"
      },
      {
        "texto": "Bonificación legendaria: Aumenta el daño (Requiere: 40 Fuerza)",
        "activo": false,
        "valor": "5.0%"
      }
    ],
    "tags": ["espinas", "golpe_afortunado"]
  },
  "nivel_glifo": 15,
  "radio_bonus": 4,
  "detalles": [
    {
      "texto": "+4.1% de probabilidad de golpe afortunado",
      "activo": true,
      "valor": "4.1%"
    },
    {
      "texto": "+16 de Fuerza",
      "activo": true,
      "valor": 16
    },
    {
      "texto": "Bonificación legendaria (Requiere: 40 Fuerza)",
      "activo": false,
      "valor": "5.0%"
    }
  ],
  "tablero_id": "tablero_2",
  "tags": ["espinas", "golpe_afortunado"]
}
\`\`\`

**ZÓCALO SIN GLIFO:**
\`\`\`json
{
  "id": "zocalo_glifo_vacio",
  "nombre": "Zócalo de Glifo",
  "rareza": "legendario",
  "tablero_id": "tablero_2"
}
\`\`\`

---

**⚠️ IMPORTANTE - NODOS PARAGON NORMALES:**

Los nodos Paragon normales otorgan bonificaciones estadísticas. Existen 4 rarezas identificables por color:

**RAREZAS:**
- **normal** (⚪ gris/blanco): Bonificación simple a UN atributo
- **magico** (🔵 azul): Bonificación a 2-3 atributos
- **raro** (🟡 amarillo): Bonificación a 3-4 atributos + efecto especial
- **legendario** (🟠 naranja): Nodos especiales con efectos únicos y poderosos

**NUEVOS CAMPOS (v0.5.3):**

1. **detalles[]**: Array con TODOS los efectos del nodo
   - \`texto\`: El texto exacto del efecto
   - \`activo\`: true si el texto está en BLANCO/VERDE, false si está en GRIS
   - \`valor\`: El valor numérico extraído (ej: "4.0%", 16, "+10")

2. **requisitos**: Si hay texto tipo "Necesario: 253/435 Voluntad"
   - \`atributo\`: 'fuerza' | 'inteligencia' | 'voluntad' | 'destreza'
   - \`valor_actual\`: El valor que tiene (253)
   - \`valor_requerido\`: El valor que necesita (435)

3. **replicas**: Si hay MÚLTIPLES nodos EXACTAMENTE IGUALES (mismo nombre + detalles)
   - Agrupa en UN solo objeto con \`replicas: N\`
   - SI NO hay réplicas, OMITE este campo (no pongas replicas: 1)

**INSTRUCCIONES:**

1. **Identificar rareza** por el color del nodo en la imagen
2. **Extraer detalles completos** con el campo \`activo\`
3. **Detectar requisitos** (texto gris tipo "Necesario: X/Y Atributo")
4. **Consolidar duplicados** en un solo nodo con \`replicas\`
5. **Incluir el campo "rareza"** en cada nodo del JSON

**ESTRUCTURA POR RAREZA:**

- **Normal**: \`tipo_atributo\` + \`valor\` + \`detalles[]\`
- **Mágico**: Array \`atributos[]\` + \`detalles[]\` + opcional \`requisitos\`
- **Raro**: Array \`atributos[]\` + \`detalles[]\` + \`efecto_especial\` + opcional \`requisitos\`
- **Legendario**: \`efecto_principal\` + \`detalles[]\` + \`condicion\` + opcional \`requisitos_numericos\`

**Formato JSON esperado:**

\`\`\`json
{
  "nodos": [
    {
      "id": "nodo_magico_armadura",
      "nombre": "+1.5% armadura total",
      "rareza": "magico",
      "atributos": [
        { "tipo": "armadura", "valor": 1.5 }
      ],
      "detalles": [
        {
          "texto": "+1.5% de armadura",
          "activo": true,
          "valor": "1.5%"
        }
      ],
      "replicas": 3,
      "tablero_id": "tablero_empezar",
      "tags": []
    },
    {
      "id": "nodo_raro_restaurador",
      "nombre": "Restaurador",
      "rareza": "raro",
      "atributos": [
        { "tipo": "vida_maxima", "valor": 4.0 },
        { "tipo": "sanacion_recibida", "valor": 6.0 }
      ],
      "detalles": [
        {
          "texto": "4.0% de vida máxima",
          "activo": true,
          "valor": "4.0%"
        },
        {
          "texto": "+6.0% de sanación recibida",
          "activo": true,
          "valor": "6.0%"
        },
        {
          "texto": "Otro 4.0% de vida máxima si se cumplen los requisitos",
          "activo": false,
          "valor": "4.0%"
        }
      ],
      "bonificacion": {
        "descripcion": "Otro 4.0% de vida máxima si se cumplen los requisitos",
        "requisitos": "Necesario: 253/435 Voluntad"
      },
      "requisitos": {
        "atributo": "voluntad",
        "valor_actual": 253,
        "valor_requerido": 435
      },
      "tablero_id": "tablero_empezar",
      "tags": ["vida", "sanacion"]
    },
    {
      "id": "nodo_legendario_implacable",
      "nombre": "Implacable",
      "rareza": "legendario",
      "efecto_principal": "Al moverte y durante los siguientes 2 segundos infliges un 80% más de daño",
      "detalles": [
        {
          "texto": "Al moverte infliges un 80% más de daño",
          "activo": true,
          "valor": "80%"
        },
        {
          "texto": "Duración: 2 segundos",
          "activo": true,
          "valor": "2"
        }
      ],
      "condicion": "Después de moverte",
      "bonificacion": {
        "tipo": "danio",
        "valor": 80,
        "duracion_segundos": 2
      },
      "tablero_id": "tablero_fuerza",
      "tags": ["danio", "movimiento"]
    },
    {
      "id": "zocalo_glifo_revancha",
      "nombre": "Zócalo de Glifo",
      "rareza": "legendario",
      "glifo_info": {
        "nombre": "Revancha",
        "rareza": "Legendario",
        "nivel_requerido": 1,
        "detalles": [
          {
            "texto": "+4.1% de probabilidad de golpe afortunado",
            "activo": true,
            "valor": "4.1%"
          },
          {
            "texto": "+16 de Fuerza",
            "activo": true,
            "valor": 16
          },
          {
            "texto": "+16.4% de daño de Sagrado",
            "activo": true,
            "valor": "16.4%"
          },
          {
            "texto": "Bonificación adicional: Cuando infliges daño de Espinas aumenta todo el daño (Requiere: 25 Fuerza)",
            "activo": true,
            "valor": "1%"
          },
          {
            "texto": "Bonificación legendaria: Aumenta el daño (Requiere: 40 Fuerza)",
            "activo": false,
            "valor": "5.0%"
          }
        ],
        "tamano_radio": "4 nodos",
        "nivel_actual": 1,
        "tags": ["espinas", "golpe_afortunado", "sagrado"]
      },
      "nivel_glifo": 1,
      "radio_bonus": 4,
      "detalles": [
        {
          "texto": "+4.1% de probabilidad de golpe afortunado",
          "activo": true,
          "valor": "4.1%"
        },
        {
          "texto": "+16 de Fuerza",
          "activo": true,
          "valor": 16
        },
        {
          "texto": "+16.4% de daño de Sagrado",
          "activo": true,
          "valor": "16.4%"
        },
        {
          "texto": "Bonificación legendaria (Requiere: 40 Fuerza)",
          "activo": false,
          "valor": "5.0%"
        }
      ],
      "bonificacion_adicional": "Cuando infliges daño de Espinas a un enemigo aumenta todo el daño que recibe de ti un 1%, hasta un máximo del 15% durante 10 segundos",
      "bonificacion_legendaria": "Aumenta el daño un 5.0%",
      "requisitos": {
        "descripcion": "Requiere la mejora: Legendario (se desbloquea en el nivel 45)",
        "nivel_requerido": 45
      },
      "tablero_id": "tablero_empezar",
      "tags": ["espinas", "golpe_afortunado"]
    }
  ],
  "palabras_clave": []
}
\`\`\`

**REGLAS CRÍTICAS:**

🔴 **0. ZÓCALOS DE GLIFO**: **OBLIGATORIO** incluir cualquier zócalo hexagonal naranja/legendario en el array 'nodos' con rareza: "legendario" y glifo_info si tiene glifo equipado

1. **rareza**: OBLIGATORIO en todos los nodos
2. **detalles[]**: OBLIGATORIO - incluir TODOS los efectos del tooltip
3. **detalles[].activo**: 
   - true = texto en blanco/verde/amarillo (bonificación activa)
   - false = texto en GRIS (requisito no cumplido)
4. **requisitos**: SOLO si aparece texto tipo "Necesario: X/Y Atributo"
5. **replicas**: SOLO si hay nodos idénticos. OMITIR si es único (no poner replicas: 1)
6. **Detectar por color**: 
   - Gris/Blanco → normal
   - Azul → magico
   - Amarillo → raro
   - Naranja → legendario (o zócalo de glifo)

**CONSOLIDACIÓN DE DUPLICADOS:**

Si encuentras 3 nodos con:
- Mismo nombre: "+1.5% armadura total"
- Mismos detalles exactos
- Mismas bonificaciones

Agrúpalos en UN SOLO objeto con \`replicas: 3\`

**ATRIBUTOS COMUNES:**

- **Principales**: fuerza, destreza, inteligencia, voluntad
- **Defensivos**: vida_maxima, armadura, resistencia_todos_elementos, reduccion_danio
- **Ofensivos**: danio, probabilidad_golpe_critico, danio_golpe_critico, velocidad_ataque
- **Utilidad**: velocidad_movimiento, reduccion_cooldown, generacion_recurso

**VALIDACIONES:**

- ✅ TODOS los nodos DEBEN incluir "rareza"
- ✅ TODOS los nodos DEBEN incluir "detalles[]" con campo "activo"
- ✅ Texto en GRIS → activo: false
- ✅ Texto "Necesario: X/Y" → agregar "requisitos"
- ✅ Nodos idénticos → consolidar con "replicas"
- ✅ Nodo único → OMITIR campo "replicas"`;
  }

  // Generar prompt para extraer nodos normales Paragon (DEPRECATED - usar generateParagonNodesPrompt)
  static generateParagonNormalNodesPrompt(): string {
    return `Analiza la imagen y extrae los nodos normales del tablero Paragon de Diablo 4.

**⚠️ IMPORTANTE - NODOS NORMALES:**

Los nodos normales (color gris/común) otorgan bonificaciones simples a un solo atributo.

**Atributos comunes:**
- Atributos principales: fuerza, destreza, inteligencia, voluntad
- Defensivos: vida_maxima, armadura, resistencia_todos_elementos
- Ofensivos: daño, probabilidad_golpe_critico, daño_golpe_critico, velocidad_ataque

**Formato JSON esperado:**

\`\`\`json
{
  "nodos_normales": [
    {
      "id": "nodo_fuerza_01",
      "nombre": "+5 Fuerza",
      "rareza": "normal",
      "tipo_atributo": "fuerza",
      "valor": 5,
      "tablero_id": "tablero_empezar",
      "tags": []
    },
    {
      "id": "nodo_vida_01",
      "nombre": "+50 Vida Máxima",
      "rareza": "normal",
      "tipo_atributo": "vida_maxima",
      "valor": 50,
      "tablero_id": "tablero_empezar",
      "tags": []
    }
  ],
  "palabras_clave": []
}
\`\`\`

**REGLAS:**

1. **rareza**: Siempre "normal"
2. **tipo_atributo**: Uno de los tipos predefinidos
3. **valor**: Número sin símbolo +
4. **nombre**: Incluye + y unidad
5. **ID**: "nodo_" + atributo + "_" + numero_secuencial`;
  }

  // Generar prompt para extraer nodos mágicos Paragon
  static generateParagonMagicNodesPrompt(): string {
    return `Analiza la imagen y extrae los nodos mágicos del tablero Paragon de Diablo 4.

**⚠️ IMPORTANTE - NODOS MÁGICOS:**

Los nodos mágicos (color azul) otorgan bonificaciones a múltiples atributos.

**Formato JSON esperado:**

\`\`\`json
{
  "nodos_magicos": [
    {
      "id": "nodo_magico_fuerza_vida",
      "nombre": "+5 Fuerza, +50 Vida",
      "rareza": "magico",
      "atributos": [
        {
          "tipo": "fuerza",
          "valor": 5
        },
        {
          "tipo": "vida_maxima",
          "valor": 50
        }
      ],
      "tablero_id": "tablero_empezar",
      "tags": []
    }
  ],
  "palabras_clave": []
}
\`\`\`

**REGLAS:**

1. **rareza**: Siempre "magico"
2. **atributos**: Array con 2-3 bonificaciones típicamente
3. **nombre**: Resumen de todos los atributos
4. **ID**: "nodo_magico_" + combinacion_atributos`;
  }

  // Generar prompt para extraer nodos raros Paragon
  static generateParagonRareNodesPrompt(): string {
    return `Analiza la imagen y extrae los nodos raros del tablero Paragon de Diablo 4.

**⚠️ IMPORTANTE - NODOS RAROS:**

Los nodos raros (color amarillo/dorado) otorgan múltiples atributos y pueden tener efectos adicionales condicionales.

**Formato JSON esperado:**

\`\`\`json
{
  "nodos_raros": [
    {
      "id": "nodo_raro_fuerza_critico",
      "nombre": "Fuerza y Crítico",
      "rareza": "raro",
      "atributos": [
        {
          "tipo": "fuerza",
          "valor": 10
        },
        {
          "tipo": "probabilidad_golpe_critico",
          "valor": "3%",
          "condicion": "con habilidades de armas"
        }
      ],
      "efecto_adicional": "Tus habilidades de armas tienen un 5% más de probabilidad de crítico",
      "tablero_id": "tablero_clamor_ancestros",
      "tags": ["critico", "armas"]
    }
  ],
  "palabras_clave": [
    {
      "tag": "critico",
      "texto_original": "crítico",
      "significado": null,
      "categoria": "mecanica",
      "fuente": "nodo"
    }
  ]
}
\`\`\`

**REGLAS:**

1. **rareza**: Siempre "raro"
2. **atributos**: Puede incluir condiciones adicionales
3. **efecto_adicional**: Descripción de bonificación especial (opcional)
4. **Tags**: Captura palabras resaltadas en el efecto`;
  }

  // Generar prompt para extraer nodos legendarios Paragon
  static generateParagonLegendaryNodesPrompt(): string {
    return `Analiza la imagen y extrae los nodos legendarios del tablero Paragon de Diablo 4.

**⚠️ IMPORTANTE - NODOS LEGENDARIOS:**

Los nodos legendarios (color naranja/legendario) son los más poderosos y otorgan efectos únicos y complejos.

**Formato JSON esperado:**

\`\`\`json
{
  "nodos_legendarios": [
    {
      "id": "nodo_leg_consagrada_fuerza",
      "nombre": "Consagrada Fuerza",
      "rareza": "legendario",
      "descripcion": "Obtienes un 10% de fuerza adicional. Mientras estés en terreno consagrado, infliges un 25% más de daño.",
      "tipo": "pasivo",
      "bonificacion_principal": "+10% Fuerza",
      "bonificaciones_secundarias": [
        "+25% Daño en terreno consagrado"
      ],
      "requisitos": "Estar en terreno consagrado para activar bonificación de daño",
      "tablero_id": "tablero_sagrado",
      "tags": ["fuerza", "consagrado", "danio"]
    },
    {
      "id": "nodo_leg_velocidad_leviatan",
      "nombre": "Velocidad del Leviatán",
      "rareza": "legendario",
      "descripcion": "Cuando usas Aura de Rebeldía, tu velocidad de movimiento aumenta un 30% durante 5 segundos.",
      "tipo": "activo",
      "bonificacion_principal": "+30% Velocidad de movimiento",
      "bonificaciones_secundarias": [],
      "requisitos": "Usar Aura de Rebeldía",
      "tablero_id": "tablero_leviatan",
      "tags": ["velocidad_movimiento", "aura_rebeldia"]
    }
  ],
  "palabras_clave": [
    {
      "tag": "consagrado",
      "texto_original": "consagrado",
      "significado": "Terreno sagrado creado por habilidades del Paladín",
      "categoria": "mecanica",
      "fuente": "tooltip"
    },
    {
      "tag": "aura_rebeldia",
      "texto_original": "Aura de Rebeldía",
      "significado": null,
      "categoria": "habilidad",
      "fuente": "nodo"
    }
  ]
}
\`\`\`

**REGLAS:**

1. **rareza**: Siempre "legendario"
2. **tipo**: "pasivo" o "activo" según si requiere activación
3. **bonificacion_principal**: Efecto más importante
4. **bonificaciones_secundarias**: Efectos adicionales
5. **requisitos**: Condiciones para activar (si aplica)
6. **descripcion**: Texto completo del efecto
7. **Tags**: Todas las palabras clave resaltadas`;
  }

  // Generar prompt para extraer zócalos de glifos Paragon
  static generateParagonGlyphSocketsPrompt(): string {
    return `Analiza la imagen y extrae los zócalos de glifos del tablero Paragon de Diablo 4.

**⚠️ IMPORTANTE - ZÓCALOS DE GLIFOS:**

Los zócalos son ranuras especiales en los tableros Paragon donde puedes equipar glifos. 
Cada tablero típicamente tiene 1-2 zócalos.

**Formato JSON esperado:**

\`\`\`json
{
  "zocalos": [
    {
      "id": "zocalo_tablero_empezar_01",
      "nombre": "Zócalo de Glifo",
      "tablero_id": "tablero_empezar",
      "glifo_equipado_id": "glifo_centinela",
      "nivel_glifo": 21,
      "radio_bonus": 5,
      "tags": []
    },
    {
      "id": "zocalo_tablero_clamor_01",
      "nombre": "Zócalo de Glifo",
      "tablero_id": "tablero_clamor_ancestros",
      "glifo_equipado_id": null,
      "nivel_glifo": null,
      "radio_bonus": null,
      "tags": []
    }
  ],
  "palabras_clave": []
}
\`\`\`

**REGLAS:**

1. **ID**: "zocalo_" + tablero_id + "_" + numero
2. **glifo_equipado_id**: ID del glifo si hay uno equipado, null si vacío
3. **nivel_glifo**: Nivel actual del glifo equipado
4. **radio_bonus**: Radio de nodos afectados por el glifo
5. **tablero_id**: Referencia al tablero donde está el zócalo`;
  }

  // Generar prompt para extraer configuración Paragon del personaje
  static generateParagonCharacterPrompt(): string {
    return `Analiza la imagen y extrae la configuración Paragon completa del personaje en Diablo 4.

**⚠️ IMPORTANTE - PARAGON DEL PERSONAJE:**

Esta extracción captura qué tableros tiene equipados el personaje, qué nodos ha activado, y sus estadísticas acumuladas.

**Información a extraer:**
1. Nivel Paragon actual (0-300)
2. Puntos gastados y disponibles
3. Tableros equipados con su posición
4. Lista de IDs de todos los nodos activados
5. Glifos equipados en zócalos
6. Atributos acumulados totales de Paragon

**Formato JSON esperado:**

\`\`\`json
{
  "paragon": {
    "nivel_paragon": 150,
    "puntos_gastados": 145,
    "puntos_disponibles": 5,
    "tableros_equipados": [
      {
        "tablero_id": "tablero_empezar",
        "posicion": 0,
        "rotacion": 0,
        "nodos_activados": [
          "nodo_fuerza_01",
          "nodo_fuerza_02",
          "nodo_vida_01",
          "nodo_magico_fuerza_vida"
        ],
        "zocalo_glifo": {
          "zocalo_id": "zocalo_tablero_empezar_01",
          "glifo_id": "glifo_centinela",
          "nivel_glifo": 21
        }
      },
      {
        "tablero_id": "tablero_clamor_ancestros",
        "posicion": 1,
        "rotacion": 90,
        "nodos_activados": [
          "nodo_leg_consagrada_fuerza",
          "nodo_raro_fuerza_critico"
        ],
        "zocalo_glifo": null
      }
    ],
    "atributos_acumulados": [
      {
        "tipo": "fuerza",
        "valor_total": 150,
        "contribuciones": [
          {
            "fuente": "nodo_normal",
            "nodo_id": "nodo_fuerza_01",
            "valor": 5
          },
          {
            "fuente": "nodo_normal",
            "nodo_id": "nodo_fuerza_02",
            "valor": 5
          },
          {
            "fuente": "nodo_magico",
            "nodo_id": "nodo_magico_fuerza_vida",
            "valor": 5
          },
          {
            "fuente": "nodo_legendario",
            "nodo_id": "nodo_leg_consagrada_fuerza",
            "valor": "10%"
          }
        ]
      },
      {
        "tipo": "vida_maxima",
        "valor_total": 850,
        "contribuciones": [
          {
            "fuente": "nodo_normal",
            "nodo_id": "nodo_vida_01",
            "valor": 50
          },
          {
            "fuente": "nodo_magico",
            "nodo_id": "nodo_magico_fuerza_vida",
            "valor": 50
          }
        ]
      }
    ],
    "nodos_activados_total": [
      "nodo_fuerza_01",
      "nodo_fuerza_02",
      "nodo_vida_01",
      "nodo_magico_fuerza_vida",
      "nodo_leg_consagrada_fuerza",
      "nodo_raro_fuerza_critico"
    ],
    "glifos_equipados": [
      {
        "zocalo_id": "zocalo_tablero_empezar_01",
        "glifo_id": "glifo_centinela",
        "nivel": 21
      }
    ]
  }
}
\`\`\`

**REGLAS:**

1. **nivel_paragon**: Nivel Paragon actual (visible en la UI)
2. **puntos_gastados**: Total de puntos invertidos
3. **puntos_disponibles**: Puntos sin usar
4. **tableros_equipados**: Array ordenado por posición (0 = central)
5. **rotacion**: 0, 90, 180, o 270 grados
6. **nodos_activados**: IDs de nodos activos en ese tablero específico
7. **atributos_acumulados**: Suma total por tipo de atributo
8. **contribuciones**: Desglose de de dónde viene cada valor

**IMPORTANTE:**

- Si no tienes toda la información visible, captura lo que puedas
- nodos_activados_total es la combinación de todos los nodos de todos los tableros
- atributos_acumulados es opcional si no es visible en la captura`;
  }

  // ============================================================================
  // PROMPTS PARA RUNAS (v0.5.4)
  // ============================================================================

  static generateRunesPrompt(): string {
    return `Analiza la imagen y extrae la información de las Runas de Diablo 4.

**⚠️ IMPORTANTE - RUNAS:**

Existen DOS TIPOS de runas:
1. **Runas de Invocación** (🟣 / morado): REQUIERE ofrenda para activarse
2. **Runas de Ritual** (🟠 / naranjo): OBTIENE ofrenda al cumplir condición

**Rarezas**: Legendario (naranja), Raro (amarillo), Mágico (azul)

**Formato JSON esperado:**

\`\`\`json
{
  "runas": [
    {
      "id": "runa_efm",
      "nombre": "EФM",
      "rareza": "legendario",
      "tipo": "invocacion",
      "efecto": "Reduce tus recuperaciones activas en 0.1 segundos.",
      "requerimiento": {
        "tipo": "requiere",
        "ofrenda": 100
      },
      "descripcion": "Se vincula con una Runa de Ritual en equipo con dos engarces para formar una palabra rúnica. Solo puedes tener dos palabras rúnicas activas al mismo tiempo.",
      "puede_desguazar": false,
      "objeto_origen": "Objeto de Vessel of Hatred",
      "valor_venta": 1,
      "en_bolsas": 0,
      "tags": ["recuperacion", "reduccion_tiempo", "habilidades_activas"]
    },
    {
      "id": "runa_chac",
      "nombre": "CHAC",
      "rareza": "raro",
      "tipo": "invocacion",
      "efecto": "Invoca el Rayo del Druida, que ataca a un enemigo cercano.",
      "requerimiento": {
        "tipo": "requiere",
        "ofrenda": 20
      },
      "descripcion": "Se vincula con una Runa de Ritual en equipo con dos engarces para formar una palabra rúnica. Solo puedes tener dos palabras rúnicas activas al mismo tiempo.",
      "objeto_origen": "Objeto de Vessel of Hatred",
      "valor_venta": 3,
      "en_bolsas": 0,
      "tags": ["rayo", "invocacion", "druida"]
    },
    {
      "id": "runa_yax",
      "nombre": "YAX",
      "rareza": "magico",
      "tipo": "ritual",
      "efecto": "Bebe una Poción de vida.",
      "requerimiento": {
        "tipo": "obtiene",
        "ofrenda": 200
      },
      "descripcion": "Se vincula con una Runa de Invocación en equipo con dos engarces para formar una palabra rúnica. Solo puedes tener dos palabras rúnicas activas al mismo tiempo.",
      "objeto_origen": "Objeto de Vessel of Hatred",
      "valor_venta": 5,
      "en_bolsas": 5,
      "tags": ["pocion", "vida", "curacion"]
    },
    {
      "id": "runa_lum",
      "nombre": "LUM",
      "rareza": "magico",
      "tipo": "invocacion",
      "efecto": "Restaura 3.5 de recurso primario.",
      "requerimiento": {
        "tipo": "requiere",
        "ofrenda": 5
      },
      "descripcion": "Se vincula con una Runa de Ritual en equipo con dos engarces para formar una palabra rúnica. Solo puedes tener dos palabras rúnicas activas al mismo tiempo.",
      "puede_desguazar": false,
      "objeto_origen": "Objeto de Vessel of Hatred",
      "valor_venta": 7,
      "tags": ["recurso", "restauracion", "recurso_primario"]
    }
  ],
  "palabras_clave": ["invocacion", "ritual", "ofrenda", "palabra_runica"]
}
\`\`\`

**REGLAS:**

1. **rareza**: "legendario", "raro", o "magico" (detectar por color del borde)
2. **tipo**: "invocacion" o "ritual"
  - Invocación: Tiene "Requiere: ofrenda de X" y suele mostrarse en morado
  - Ritual: Tiene "Obtiene: ofrenda de X" y suele mostrarse en naranjo
3. **requerimiento.tipo**: "requiere" (invocación) o "obtiene" (ritual)
4. **requerimiento.ofrenda**: Número entero (5, 20, 100, 200, etc.)
5. **efecto**: Descripción del efecto principal (texto morado/principal)
6. **descripcion**: Texto en cursiva (explicación de palabras rúnicas)
7. **puede_desguazar**: true si dice "No se puede desguazar", false otherwise
8. **objeto_origen**: Típicamente "Objeto de Vessel of Hatred"
9. **tags**: Palabras clave relevantes del efecto

**DETECCIÓN VISUAL:**

- 🟣 **Runa de Invocación**: Ícono/acentos morados, texto "Requiere: ofrenda"
- 🟠 **Runa de Ritual**: Ícono/acentos naranjo, texto "Obtiene: ofrenda"
- Color del borde: Naranja=legendario, Amarillo=raro, Azul=mágico

**IMPORTANTE**: Captura toda la información visible. Si falta algo, omite ese campo.

**📋 NOTA CONTEXTUAL:**
Si el jugador ya tiene runas en su catálogo y estás analizando un arma con runas equipadas, los valores del campo \`nombre\` deben coincidir exactamente con los nombres del catálogo para permitir el enlace automático entre piezas de equipo y el catálogo de runas.`;
  }

  // ============================================================================
  // PROMPTS PARA GEMAS (v0.5.4)
  // ============================================================================

  static generateGemsPrompt(): string {
    return `Analiza la imagen y extrae la información de las Gemas de Diablo 4.

**⚠️ IMPORTANTE - GEMAS:**

Las gemas se insertan en engarces del equipo y tienen **efectos_por_slot** (efectos DIFERENTES según dónde se inserten):
- **Arma**: Efecto ofensivo
- **Armadura**: Efecto defensivo/atributo
- **Joyas** (anillos/amuleto): Efecto de resistencia

**Tipos comunes**: Cráneo, Topacio, Esmeralda, Rubí, Diamante, Amatista, Zafiro

**Mapa de color por tipo de gema (priorizar cuando el texto esté borroso):**
- Rubí: rojo
- Zafiro: azul
- Esmeralda: verde
- Topacio: amarillo
- Amatista: morado
- Diamante: blanco
- Cráneo: gris

**Calidades**: Sin pulir, Astillada, Normal, Impecable, Facetada, Marqués, Real

**Formato JSON esperado:**

\`\`\`json
{
  "gemas": [
    {
      "id": "gema_craneo_marques",
      "nombre": "Cráneo Marqués",
      "tipo": "craneo",
      "calidad": "marques",
      "efectos": {
        "arma": "+16 de vida con cada eliminación",
        "armadura": "+10.0% de sanación recibida",
        "joyas": "+900 de resistencia al daño físico"
      },
      "descripcion": "Se puede insertar en equipo con engarces.",
      "nivel_requerido": 25,
      "valor_venta": 2000,
      "tags": ["vida", "curacion", "resistencia_fisica"]
    },
    {
      "id": "gema_topacio_impecable",
      "nombre": "Topacio Impecable",
      "tipo": "topacio",
      "calidad": "impecable",
      "efectos": {
        "arma": "+30.0% de daño de habilidades básicas",
        "armadura": "+30 de Inteligencia",
        "joyas": "+450 de resistencia al rayo"
      },
      "descripcion": "En sus profundidades reside una ambición esplendorosa.",
      "nivel_requerido": 20,
      "valor_venta": 200,
      "tags": ["daño", "habilidades_basicas", "inteligencia", "resistencia_rayo"]
    }
  ],
  "palabras_clave": ["gema", "engarce", "resistencia", "curacion"]
}
\`\`\`

**REGLAS:**

1. **tipo**: "craneo", "topacio", "esmeralda", "rubi", "diamante", "amatista", "zafiro"
2. **calidad**: "sin_pulir", "astillada", "normal", "impecable", "facetada", "marques", "real"
3. **efectos**: SIEMPRE incluir los 3 efectos (arma, armadura, joyas)
   - Leer de los bullets con íconos (🗡️ Arma, 🛡️ Armadura, 💍 Joyas)
4. **descripcion**: Texto en cursiva (flavor text)
5. **nivel_requerido**: Nivel mínimo para usar la gema
6. **tags**: Extraer conceptos clave de los efectos

**DETECCIÓN VISUAL:**

- **Icono de gema**: Forma de diamante/piedra brillante
- **Color del ícono**: Usar este mapeo estricto
  - Rubí=rojo, Zafiro=azul, Esmeralda=verde, Topacio=amarillo, Amatista=morado, Diamante=blanco, Cráneo=gris
- **Tres secciones de efectos**: Con íconos de espada (arma), escudo (armadura), anillo (joyas)

**IMPORTANTE**: Siempre captura los 3 efectos completos. Son críticos para el sistema.

**📋 NOTA CONTEXTUAL:**
Si el jugador ya tiene gemas en su catálogo y estás analizando un arma/armadura con gemas equipadas, los valores del campo \`nombre\` deben coincidir exactamente con los nombres del catálogo para permitir el enlace automático entre piezas de equipo y el catálogo de gemas.`;
  }

  // ============================================================================
  // PROMPTS PARA EQUIPAMIENTO/BUILD (v0.5.4)
  // ============================================================================

  static generateEquipmentPrompt(): string {
    return `Analiza la imagen y extrae la información del equipamiento/build de Diablo 4.

**⚠️ IMPORTANTE - EQUIPAMIENTO:**

El equipo incluye:
- **Armas**: Arma principal, Escudo/Arma secundaria
- **Armadura**: Yelmo, Peto, Guantes, Pantalones, Botas
- **Joyas**: Amuleto, Anillo 1, Anillo 2

**Categorías**: Ancestral legendario, Excepcional legendario, Legendario normal

**Formato JSON esperado:**

\`\`\`json
{
  "build": {
    "piezas": [
      {
        "id": "yelmo_frenetico_001",
        "nombre": "YELMO EXCEPCIONAL FRENÉTICO",
        "espacio": "yelmo",
        "tipo": "Yelmo ancestral legendario",
        "categoria": "excepcional",
        "rareza": "legendario",
        "poder_objeto": 800,
        "armadura": 1508,
        "atributos": [
          { "texto": "+182 de Fuerza", "valor": 182, "tipo": "fuerza" },
          { "texto": "+424 de vida máxima", "valor": 424, "tipo": "vida_maxima" }
        ],
        "efectos_especiales": [
          { "nombre": "Desenfreno", "descripcion": "+3% de Vida máxima por nivel de racha de muertes.", "color": "rojo" },
          { "nombre": "Efecto único", "descripcion": "Tras usar 5 habilidades Básicas, una recuperación activa se reduce en 2.0 segundos.", "color": "naranja" }
        ],
        "durabilidad": { "actual": 100, "maxima": 100 },
        "templados": { "usados": 4, "maximos": 4 },
        "nivel_requerido": 60,
        "valor_venta": 24068,
        "tags": ["fuerza", "vida", "habilidades_basicas"]
      },
      {
        "id": "arma_frenesi_001",
        "nombre": "ESPADA FRENÉTICA DEL CAOS",
        "espacio": "arma",
        "tipo": "Espada de una mano ancestral legendaria",
        "categoria": "ancestral",
        "rareza": "legendario",
        "poder_objeto": 800,
        "atributos": [
          { "texto": "+1450.5 de daño de arma por segundo", "valor": "1450.5", "tipo": "dano_arma" },
          { "texto": "+60.5% de daño de habilidades básicas", "valor": "60.5%", "tipo": "dano_habilidades_basicas" }
        ],
        "efectos_especiales": [
          { "nombre": "Ira", "descripcion": "Cada vez que inflinges un golpe crítico, el daño de tus ataques aumenta un 5% durante 3 segundos.", "color": "rojo" },
          { "nombre": "Efecto único", "descripcion": "Aumenta el daño de tus habilidades básicas en un 40% y el radio de Torbellino en un 20%.", "color": "naranja" }
        ],
        "engarces": [
          { "tipo": "runa", "nombre": "EFM", "rareza": "legendario", "subtipo": "ritual" },
          { "tipo": "runa", "nombre": "AMN", "rareza": "magico", "subtipo": "invocacion" }
        ],
        "aspecto_vinculado_id": "aspecto_del_campeador",
        "aspecto_descripcion_diferencia": "Aumenta el radio de Torbellino en un [20-40]% y el daño de tus habilidades básicas en un [40-80]%.",
        "durabilidad": { "actual": 100, "maxima": 100 },
        "templados": { "usados": 3, "maximos": 4 },
        "nivel_requerido": 60,
        "valor_venta": 28000,
        "tags": ["habilidades_basicas", "torbellino", "daño_critico"]
      }
    ]
  },
  "palabras_clave": ["build", "equipamiento", "armadura", "arma", "legendario"]
}
\`\`\`

**REGLAS GENERALES:**

1. **espacio**: Detectar automáticamente por el tipo de pieza
   - yelmo, peto, guantes, pantalones, botas, arma, amuleto, anillo1, anillo2, escudo
2. **categoria**: "ancestral", "excepcional", o "normal" (leer del subtítulo)
3. **rareza**: "legendario", "raro", "magico", "normal" (detectar por color del borde)
4. **poder_objeto**: Número visible en "Poder de objeto: X"
5. **armadura**: Solo para piezas de armadura (yelmo, peto, guantes, pantalones, botas)
6. **atributos**: Array con TODOS los atributos visibles (texto, valor numérico, tipo normalizado)
7. **efectos_especiales**: Efectos en color
   - **nombre**: "Desenfreno", "Hambre", "Ira", "Efecto único", etc.
   - **descripcion**: Texto completo del efecto
   - **color**: "rojo", "naranja", "verde", "azul", "morado"
8. **durabilidad** y **templados**: Leer de la parte inferior de la ficha

**ENGARCES (runas y gemas equipadas):**

Los engarces son ranuras pequeñas en el equipo que pueden contener **Runas** o **Gemas**.
Si dentro de la ficha del objeto ves texto o iconos relacionados con runas (Invocación/Ritual) o gemas (Cráneo, Topacio, Esmeralda, Rubí, etc.), extráelos como objetos en el array \`engarces\`:

**IMPORTANTE**: Una misma build puede incluir runas y gemas al mismo tiempo (en distintas piezas). El JSON debe conservar ambos tipos cuando estén presentes.

- **tipo**: "runa" o "gema"
- **nombre**: Nombre completo de la runa o gema
- **rareza**: "legendario", "raro", "magico", "normal"
- **subtipo** (solo runas): "invocacion" o "ritual"
- **calidad** (solo gemas): "marques", "real", "facetada", "impecable", etc.

Si el objeto NO tiene engarces visibles, omite el campo \`engarces\`.

**ASPECTO ÚNICO (armas y joyas legendarios):**

Un objeto legendario puede tener un **aspecto único**. Se identifica porque su texto aparece en el **MISMO COLOR que el nombre del objeto** (dorado/naranja para legendario). Es el texto del efecto especial principal del arma.

- **aspecto_vinculado_id**: Si puedes identificar el nombre del aspecto, conviértelo a snake_case (ej: "Aspecto del Campeador" → "aspecto_del_campeador"). Si no lo reconoces con seguridad, omite este campo.
- **aspecto_descripcion_diferencia**: Copia el texto COMPLETO del aspecto tal como aparece en la ficha del objeto. Incluye los valores numéricos entre corchetes si aparecen con rangos (ej: "[20-40]%").

Si el objeto NO tiene aspecto visible, omite ambos campos.

**📋 NOTA CONTEXTUAL:**
Si ya tienes gemas o runas cargadas en el catálogo global del juego, los nombres en el array \`engarces\` deben coincidir exactamente con los nombres del catálogo para que el sistema pueda enlazarlos automáticamente. Si no tienes el catálogo cargado, el sistema lo advertirá y te recomendará cargarlo.

**DETECCIÓN VISUAL:**

- **Categoría por texto**: "ancestral legendario", "excepcional", etc.
- **Color del borde del nombre**: Naranja=legendario, Amarillo=raro, Azul=mágico
- **Efectos de color**: Texto en rojo (Desenfreno/Hambre/etc.), naranja (efecto único)
- **Engarces**: Pequeños iconos circulares/diamante en la ficha del objeto
- **Aspecto**: Texto en el mismo color dorado/naranja del nombre del objeto legendario

**ESPACIOS VÁLIDOS:**
- yelmo, peto, guantes, pantalones, botas (armadura)
- arma, escudo (armas)
- amuleto, anillo1, anillo2 (joyas)

**IMPORTANTE**: Captura TODO el texto visible de atributos y efectos. Los engarces y el aspecto son críticos para el análisis completo del build.`;
  }

  // ============================================================================
  // PROMPTS PARA ANÁLISIS DE BUILD (v0.5.4)
  // ============================================================================

  static generateBuildAnalysisPrompt(): string {
    return `Analiza la imagen del build de Diablo 4 y proporciona un análisis táctico detallado.

**OBJETIVO:**
No se trata de extraer datos, sino de analizar la efectividad y coherencia del build.

**Analiza los siguientes aspectos:**

**1. SINERGIA DE HABILIDADES**
- ¿Las habilidades activas y pasivas se complementan entre sí?
- ¿Existe una cadena de combo clara?
- ¿Los modificadores potencian las habilidades clave?

**2. ASPECTOS Y EQUIPAMIENTO**
- ¿Los aspectos equipados amplifican las habilidades del build?
- ¿Hay duplicidad en los efectos (aspecto + equipo haciendo lo mismo)?
- ¿Los engarces (runas/gemas) están bien orientados al rol del build?
- Si una pieza trae texto de aspecto propio (el aplicado actualmente), PRIORIZA ese texto sobre cualquier valor genérico de catálogo.
- Para el análisis final, considera SIEMPRE la suma de: atributos visibles del objeto + efecto real del aspecto en esa pieza.

**3. TABLERO DE PARAGON**
- ¿Los glifos seleccionados son los óptimos para este build?
- ¿Los nodos activados tienen coherencia con las habilidades?
- ¿El nivel de los glifos es adecuado para el contenido?

**4. ESTADÍSTICAS**
- ¿Hay desequilibrio entre ofensiva y defensiva?
- ¿Las resistencias están balanceadas?
- ¿El umbral de vida es adecuado para el contenido objetivo?

**5. PUNTOS DE MEJORA**
- Lista máximo 5 cambios concretos que mejorarían el build
- Prioriza por impacto (del más al menos importante)
- Explica brevemente el motivo de cada cambio

**6. CALIFICACIÓN GENERAL**
- Puntúa de 1 a 10 cada categoría: Daño, Supervivencia, Utilidad, Coherencia
- Calificación global con justificación en 1-2 frases

**FORMATO JSON esperado:**

\`\`\`json
{
  "analisis": {
    "sinergia_habilidades": {
      "puntuacion": 8,
      "fortalezas": ["Las habilidades básicas reducen el cooldown de Torbellino"],
      "debilidades": ["Falta modificador que amplíe el área de efecto"]
    },
    "aspectos_equipamiento": {
      "puntuacion": 7,
      "fortalezas": ["El aspecto del Campeador potencia directamente la habilidad principal"],
      "debilidades": ["Dos aspectos duplican el efecto de velocidad de ataque"]
    },
    "paragon": {
      "puntuacion": 6,
      "fortalezas": ["Glifo enfocado en daño básico bien posicionado"],
      "debilidades": ["Nodos de resistencia al fuego no alineados con el contenido"]
    },
    "estadisticas": {
      "puntuacion": 7,
      "fortalezas": ["Vida máxima adecuada para T4"],
      "debilidades": ["Resistencia al Rayo por debajo del umbral recomendado (70%)"]
    },
    "puntos_mejora": [
      { "prioridad": 1, "cambio": "Sustituir Aspecto X por Aspecto Y", "motivo": "Mayor % de daño crítico para el loop de combo" },
      { "prioridad": 2, "cambio": "Reemplazar gema Topacio por Esmeralda en el arma", "motivo": "+% daño a élites es más útil que bonus de veneno" }
    ],
    "calificacion": {
      "dano": 8,
      "supervivencia": 6,
      "utilidad": 7,
      "coherencia": 8,
      "global": 7,
      "resumen": "Build sólido con buen foco en daño físico. Mejorar resistencias y revisar sinergia de aspectos."
    }
  }
}
\`\`\`

**IMPORTANTE:** Sé específico y constructivo. El objetivo es ayudar al jugador a mejorar su build de manera concreta.`;
  }

  // ============================================================================
  // PROMPTS PARA MECÁNICAS DE CLASE (v0.8.0)
  // ============================================================================

  static generateClassMechanicsPrompt(): string {
    return `Analiza la imagen y extrae la información de las **mecanicas** únicas de clase de Diablo 4.

**⚠️ IMPORTANTE - MECÁNICAS DE CLASE:**

Cada clase tiene mecánicas (mecanicas_clase) únicas:
- **Paladín**: Juramentos (Disciple, Arbiter, etc.)
- **Hechicero**: Libros de hechizos
- **Nigromante**: Libros de los muertos
- **Bárbaro**: Arsenal (dominio de armas)
- **Pícaro**: Especialización (Combo, Momentum, Inner Sight)
- **Druida**: Espíritus animales
- **Espiritista**: Espíritus ancestrales

**Formato JSON esperado:**

\`\`\`json
{
  "mecanica_clase": {
    "id": "mecanica_paladin_juramentos",
    "nombre": "Juramentos",
    "tipo": "mecanica_clase",
    "clase": "Paladín",
    "selecciones": [
      {
        "id": "juramento_disciple",
        "nombre": "Disciple",
        "categoria": "juramento",
        "grupo": "juramento_principal",
        "nivel": 1,
        "nivel_maximo": 1,
        "activo": true,
        "efecto": "Tus habilidades sagradas e invocaciones reciben beneficios según este Juramento.",
        "detalles": [
          "Juramento orientado a habilidades sagradas.",
          "Mejora sinergias con invocaciones celestiales."
        ],
        "tags": ["sagrado", "invocacion", "juramento"]
      },
      {
        "id": "juramento_arbiter",
        "nombre": "Arbiter",
        "categoria": "juramento",
        "grupo": "juramento_principal",
        "nivel": 1,
        "nivel_maximo": 1,
        "activo": false,
        "efecto": "Aumenta tu daño crítico y velocidad de ataque cuando usas habilidades de Justicia.",
        "detalles": [
          "Juramento enfocado en daño crítico.",
          "Beneficia habilidades de categoría Justicia."
        ],
        "tags": ["critico", "velocidad_ataque", "justicia"]
      }
    ]
  },
  "palabras_clave": [
    {
      "tag": "sagrado",
      "texto_original": "sagradas",
      "significado": "Habilidades o efectos de daño divino o bendito.",
      "categoria": "tipo_daño",
      "fuente": "mecanica_clase"
    },
    {
      "tag": "invocacion",
      "texto_original": "invocaciones",
      "significado": "Habilidades que invocan entidades celestiales para ayudar en combate.",
      "categoria": "tipo_habilidad",
      "fuente": "mecanica_clase"
    }
  ]
}
\`\`\`

**INSTRUCCIONES:**

1. **Identificar la clase**: Determina qué clase es (Paladín, Hechicero, etc.)
2. **Nombre de la mecánica**: Nombre general del sistema (ej: "Juramentos", "Libros de hechizos")
3. **Selecciones individuales**: Cada opción dentro de la mecánica
   - **id**: Identificador único
   - **nombre**: Nombre de la selección
   - **categoria**: Tipo de selección (juramento, libro, espíritu, etc.)
   - **grupo**: Grupo al que pertenece (principal, secundario, etc.)
   - **nivel**: Nivel actual (si aplica)
   - **nivel_maximo**: Nivel máximo posible
   - **activo**: Si está seleccionado/activo actualmente (true/false)
   - **efecto**: Descripción del efecto principal
   - **detalles**: Lista de detalles adicionales
   - **tags**: Palabras clave relacionadas

4. **Palabras clave**: Extrae conceptos importantes mencionados en los efectos

**IMPORTANTE:**
- Solo la(s) selección(es) que estén **visiblemente activadas/seleccionadas** deben tener \`"activo": true\`
- Las demás opciones disponibles pero no seleccionadas tienen \`"activo": false\`
- Algunas mecánicas permiten múltiples selecciones activas (ej: Nigromante puede tener varios libros activos)
- Captura TODAS las opciones visibles, no solo las activas

**NOTA CONTEXTUAL:**
Si el jugador ya tiene esta mecánica en su catálogo de héroe, los nombres deben coincidir exactamente para permitir la sincronización automática.`;
  }

  // ============================================================================
  // PROMPTS PARA EVENTOS DEL MUNDO / PROGRESIÓN (v0.9.0)
  // ============================================================================

  static generateWorldEventsPrompt(): string {
    return `🎯 **ROL**: Experto en sistemas de progresión de videojuegos tipo RPG (Diablo 4).

**OBJETIVO**: Analiza la imagen y extrae **PASO A PASO** la información de eventos del mundo (Guaridas, Susurros, Eventos, Calabozos, Legiones, Reservas).

---

## 🔍 INSTRUCCIONES PASO A PASO

### PASO 1: IDENTIFICAR EVENTOS VISIBLES

Para cada evento en la imagen, extrae:

- **id**: Identificador único (ej: \`guarida_duriel\`, \`susurro_legion_salvaje\`)
- **nombre**: Nombre completo como aparece
- **tipo**: \`guarida\`, \`susurro\`, \`evento\`, \`calabozo\`, \`legion\`, \`reserva\`
- **boss**: Nombre del jefe si aplica (null si no)
- **ubicacion**: Zona/región del mapa si es visible

### PASO 2: EXTRAER OBJETIVO Y PROGRESO

Para cada evento:

- **objetivo.tipo**: \`kill\`, \`completar\`, \`recolectar\`, \`explorar\`, \`defender\`
- **objetivo.descripcion**: Texto descriptivo del objetivo
- **objetivo.progreso**: Si es visible, captura actual/max (ej: {"actual": 2, "max": 5})

### PASO 3: IDENTIFICAR REQUISITOS (MUY IMPORTANTE)

Lista **TODO** lo que se necesita para acceder al evento:

- **tipo**: \`material\`, \`llave\`, \`currency\`, \`nivel\`, \`acceso\`
- **nombre**: Nombre del recurso requerido
- **cantidad**: Número exacto (ej: 2)
- **id_recurso**: Identificador único (ej: \`recurso_fragmentos_agonia\`)

⚠️ **CRÍTICO**: El \`id_recurso\` debe ser consistente entre requisitos y recompensas para detectar relaciones.

### PASO 4: IDENTIFICAR RECOMPENSAS (MUY IMPORTANTE)

Lista **TODO** lo que se obtiene al completar:

- **tipo**: \`loot\`, \`material\`, \`currency\`, \`experiencia\`, \`acceso\`
- **nombre**: Nombre del recurso obtenido
- **cantidad**: Número si es visible (null si variable)
- **probabilidad**: \`alta\`, \`media\`, \`baja\` (deduce del contexto)
- **garantizado**: true si siempre se obtiene, false si es RNG
- **id_recurso**: Identificador único (ej: \`recurso_fragmentos_agonia\`)

⚠️ **CRÍTICO**: Usa el mismo \`id_recurso\` si este recurso también aparece como requisito en otro evento.

### PASO 5: CAPTURAR INFORMACIÓN DE TIEMPO

Si es visible:

- **tiempo.expira_en**: "X días Y horas" si tiene timer
- **tiempo.tiempo_completar**: Estimación de duración ("10-15 min")
- **tiempo.cooldown**: Tiempo entre repeticiones si aplica

### PASO 6: METADATOS Y TAGS

- **dificultad**: \`normal\`, \`pesadilla\`, \`tortura\`, \`otro\`
- **repetible**: true/false si se puede hacer múltiples veces
- **tags**: Array de etiquetas útiles:
  - \`boss\`, \`endgame\`, \`farm\`, \`material_farm\`, \`currency_farm\`
  - \`time_limited\`, \`uber_boss\`, \`evento_mundial\`, \`elite\`

---

## 📊 FORMATO JSON ESPERADO

\`\`\`json
{
  "eventos": [
    {
      "id": "guarida_duriel",
      "nombre": "Guarida de Duriel",
      "tipo": "guarida",
      "subtipo": "boss",
      "boss": "Duriel, Señor del Dolor",
      "objetivo": {
        "tipo": "kill",
        "descripcion": "Derrotar a Duriel",
        "progreso": {"actual": null, "max": 1}
      },
      "requisitos": [
        {
          "tipo": "material",
          "nombre": "Fragmentos de Agonía",
          "cantidad": 2,
          "id_recurso": "recurso_fragmentos_agonia"
        }
      ],
      "recompensas": [
        {
          "tipo": "loot",
          "nombre": "Loot único de Duriel",
          "cantidad": null,
          "probabilidad": "alta",
          "garantizado": true,
          "id_recurso": "loot_duriel"
        }
      ],
      "tiempo": {
        "expira_en": null,
        "tiempo_completar": "10-15 min",
        "cooldown": null
      },
      "ubicacion": "Kehjistan - Cavernas del Odio",
      "dificultad": "tortura",
      "repetible": true,
      "descripcion": "Invoca y derrota a Duriel para obtener loot único.",
      "tags": ["boss", "endgame", "farm", "uber_boss"]
    }
  ]
}
\`\`\`

---

## ⚙️ REGLAS CRÍTICAS

1. **IDs únicos consistentes**:
   - \`id_recurso\` DEBE ser el mismo si el recurso aparece en múltiples eventos
   - Ejemplo: Si "Fragmentos de Agonía" se requiere en A y se obtiene en B, ambos usan \`recurso_fragmentos_agonia\`

2. **Probabilidades realistas**:
   - \`alta\`: >70% drop rate (materiales comunes)
   - \`media\`: 30-70% (ítems raros)
   - \`baja\`: <30% (ítems muy raros, Chispas, Únicas específicas)

3. **Tipos de recursos**:
   - \`material\`: Materiales de crafteo (Fragmentos, Polvos)
   - \`currency\`: Monedas del juego (Favores Lúgubres, Oro)
   - \`llave\`: Objetos de acceso (Invocaciones)
   - \`loot\`: Equipo/ítems equipables
   - \`acceso\`: Desbloqueo de contenido

4. **Repetibilidad**:
   - \`repetible: true\`: Se puede farmear (bosses, calabozos)
   - \`repetible: false\`: Una vez por timer/temporada (susurros únicos)

5. **Si falta información**:
   - Usa \`null\` para campos desconocidos
   - NO inventes datos que no estén en la imagen
   - Deduce probabilidades solo del contexto visual (ej: "garantizado" si dice "siempre")

---

## 🔗 EJEMPLO DE DETECCIÓN DE RELACIONES

Si en la imagen ves:

**Evento A (Susurro)**:
- Requiere: 10 Favores Lúgubres
- Recompensa: 5 Invocaciones Lúgubres (\`id_recurso: "recurso_invocaciones_lugubres"\`)

**Evento B (Guarida)**:
- Requiere: 2 Invocaciones Lúgubres (\`id_recurso: "recurso_invocaciones_lugubres"\`)
- Recompensa: Fragmentos de Agonía

El sistema detectará automáticamente: **Evento A → genera → Evento B**

---

## ✅ OUTPUT FINAL

Devuelve **SOLO** un objeto JSON con esta estructura exacta:

{
  "eventos": [
    {
      "id": "guarida_duriel",
      "nombre": "Guarida de Duriel",
      "tipo": "guarida",
      "boss": "Duriel, Señor del Dolor",
      "ubicacion": "Santuario Helado",
      "objetivo": {
        "tipo": "kill",
        "descripcion": "Derrotar a Duriel",
        "progreso": null
      },
      "requisitos": [
        {
          "tipo": "material",
          "nombre": "Fragmentos de Agonía",
          "cantidad": 2,
          "id_recurso": "recurso_fragmentos_agonia"
        }
      ],
      "recompensas": [
        {
          "tipo": "loot",
          "nombre": "Loot Único/Épico",
          "cantidad": null,
          "probabilidad": "alta",
          "garantizado": true,
          "id_recurso": "recurso_loot_unico"
        }
      ],
      "nivel_recomendado": null,
      "dificultad": null,
      "tiempo_estimado": null,
      "tags": ["boss", "endgame"],
      "notas": ""
    }
  ]
}

**CRÍTICO**: 
- El objeto raíz DEBE tener la clave "eventos" con un array dentro
- NO devuelvas solo un array [...], sino un objeto con eventos adentro
- El sistema generará automáticamente: grafo, indice_recursos, rutas_sugeridas, analisis
- NO incluyas manualmente esos campos
- ENFÓCATE en extraer SOLO los eventos con la mayor precisión posible

**Devuelve ÚNICAMENTE el JSON, sin texto adicional antes o después.**`;
  }

  // ============================================================================
  // PROMPTS PARA TALISMANES (v0.8.0 - Temporada 13)
  // ============================================================================

  static generateCharmsPrompt(): string {
    return `🧿 **ROL**: Experto en sistemas de equipamiento y builds de Diablo 4 - Temporada 13.

**OBJETIVO**: Analiza la imagen y extrae la información de TALISMANES (Charms) de Diablo 4 para un **personaje específico**.

---

## 👤 CONTEXTO

Estos talismanes pertenecen a un **personaje específico** y se equipan en su **Horadric Seal (Sello Horádrico)**. Son parte de su build personalizada.

---

## 🔍 ¿QUÉ SON LOS TALISMANES?

Los **Talismanes (Charms)** son objetos modulares que se equip an dentro del **Horadric Seal (Sello Horádrico)**. Son piezas clave para personalizar builds.

**TIPOS DE TALISMANES:**
- **Rare (Raro)**: Amarillo/dorado, stats más simples
- **Unique (Único)**: Naranja/legendario, efectos únicos poderosos
- **Set Charm (Set)**: Verde, parte de un conjunto con bonificaciones progresivas

---

## 📊 FORMATO JSON ESPERADO

\`\`\`json
{
  "talismanes": [
    {
      "id": "charm_narrow_eye_fer",
      "nombre": "Fer of the Narrow Eye",
      "tipo": "charm",
      "rareza": "set",
      "nivel_requerido": null,
      "stats": [
        {
          "nombre": "Smoke Grenade",
          "valor": 3,
          "rango": "[2-3]"
        },
        {
          "nombre": "Bonus Experience",
          "valor": 4.2,
          "rango": "[3.2 - 6.0]"
        }
      ],
      "efectos": [
        {
          "descripcion": "Al usar una habilidad básica Marksman, ganas acumulaciones de Vengeance que aumentan velocidad de movimiento y daño.",
          "tipo": "stacking",
          "condicion": "usar habilidad básica Marksman",
          "tags": ["marksman", "movement", "damage", "stacking"]
        }
      ],
      "set": {
        "nombre": "Narrow Eye",
        "piezas": ["Phoba", "Fer", "Mlor", "Linta"],
        "bonus": [
          {
            "piezas_requeridas": 2,
            "efecto": "Stacks de Vengeance aumentan daño y velocidad"
          },
          {
            "piezas_requeridas": 3,
            "efecto": "Genera Dark Shroud y reducción de daño"
          }
        ]
      },
      "tags": ["marksman", "set", "stacking", "vengeance"]
    },
    {
      "id": "charm_paingorgers_gauntlets",
      "nombre": "Paingorger's Gauntlets",
      "tipo": "charm",
      "rareza": "unique",
      "nivel_requerido": 70,
      "stats": [
        {
          "nombre": "Shadow Resistance",
          "valor": 438,
          "rango": "[416-523]"
        },
        {
          "nombre": "Movement Speed",
          "valor": 23,
          "rango": "[20-24]"
        }
      ],
      "efectos": [
        {
          "descripcion": "Marcar enemigos con habilidades no básicas permite replicar daño con habilidades básicas.",
          "tipo": "condicion",
          "condicion": "usar habilidad básica sobre enemigo marcado",
          "tags": ["mark", "echo_damage", "basic_skills"]
        }
      ],
      "set": {
        "nombre": null,
        "piezas": [],
        "bonus": []
      },
      "tags": ["unique", "damage", "mark"]
    }
  ],
  "palabras_clave": ["talisman", "charm", "horadric", "set", "unique"]
}
\`\`\`

---

## 📝 INSTRUCCIONES PASO A PASO

### PASO 1: IDENTIFICAR RAREZA

**Por color del borde:**
- 🟢 **Verde** = Set (parte de conjunto)
- 🟠 **Naranja/Legendario** = Unique (único)
- 🟡 **Amarillo** = Rare (raro)

### PASO 2: EXTRAER INFORMACIÓN BÁSICA

- **id**: Identificador único en snake_case (ej: "charm_narrow_eye_fer")
- **nombre**: Nombre completo tal como aparece
- **tipo**: Siempre "charm"
- **rareza**: "set", "unique", o "rare"
- **nivel_requerido**: Número o null si no es visible

### PASO 3: CAPTURAR STATS

Los **stats** son valores numéricos directos (resistencias, velocidad, experiencia, etc.).

Para cada stat:
- **nombre**: Nombre del atributo (ej: "Shadow Resistance", "Movement Speed")
- **valor**: Valor numérico actual
- **rango**: Rango posible entre corchetes si es visible (ej: "[20-24]"), null si no

### PASO 4: CAPTURAR EFECTOS

Los **efectos** son mecánicas especiales (condicionales, pasivas, por acumulación).

Para cada efecto:
- **descripcion**: Texto completo del efecto
- **tipo**: "pasivo", "condicion", "proc", "stacking"
  - **pasivo**: Siempre activo sin condición
  - **condicion**: Requiere cumplir algo ("al usar X")
  - **proc**: Se activa por probabilidad ("chance to...")
  - **stacking**: Acumulación progresiva de bonos
- **condicion**: Si tipo es "condicion" o "stacking", describe la condición (null si pasivo)
- **tags**: Array de palabras clave relevantes del efecto

### PASO 5: INFORMACIÓN DE SET (CRÍTICO)

Si el talismán es de **rareza "set"**:

**set.nombre**: Nombre del conjunto (ej: "Narrow Eye", "Dark Pact")
**set.piezas**: Array con nombres de TODAS las piezas del set
  - Pueden aparecer en el tooltip o en la descripción
  - Ej: ["Phoba", "Fer", "Mlor", "Linta"]
**set.bonus**: Array de bonificaciones por cantidad equipada
  - **piezas_requeridas**: 2, 3, 4, etc.
  - **efecto**: Descripción del bonus al tener X piezas

Si NO es set (unique o rare):
\`\`\`json
"set": {
  "nombre": null,
  "piezas": [],
  "bonus": []
}
\`\`\`

### PASO 6: TAGS GENERALES

Extrae palabras clave útiles para búsqueda y análisis:
- Tipos de habilidad: "marksman", "shadow", "basic_skills", "core_skills"
- Mecánicas: "stacking", "mark", "proc", "vengeance", "movement"
- Conceptos: "damage", "defense", "resource", "cooldown"

---

## ⚠️ REGLAS CRÍTICAS

1. **Rareza set vs unique**:
   - Set siempre tiene información del conjunto (nombre + piezas + bonus)
   - Unique NO tiene set (nombre: null, arrays vacíos)

2. **Stats vs Efectos**:
   - **Stats** = Números directos (+438 resistencia, +23% velocidad)
   - **Efectos** = Mecánicas/condiciones ("al usar X", "ganas Y")

3. **Tipos de efecto**:
   - Usa "stacking" solo si menciona acumulaciones progresivas
   - Usa "condicion" si requiere hacer algo específico
   - Usa "pasivo" si siempre está activo
   - Usa "proc" si es probabilidad ("chance to")

4. **Información de set**:
   - Captura TODAS las piezas mencionadas
   - Captura TODOS los bonus por cantidad
   - Mantén el orden de los bonus (2 piezas, 3 piezas, 4 piezas, etc.)

5. **Tags**:
   - Incluye conceptos relevantes del efecto
   - Normaliza a snake_case ("Dark Shroud" → "dark_shroud")
   - Incluye tipo de rareza como tag ("set", "unique", "rare")

---

## 📋 NOTAS CONTEXTUALES

- Algunos charms tienen efectos que interactúan con **tags de habilidades** (Marksman, Shadow, Abyss, etc.)
- Los sets tienen **sinergias internas** - captura todas las piezas para análisis posterior
- Los unique suelen tener **efectos únicos potentes** - captura la descripción completa

**Devuelve ÚNICAMENTE el JSON, sin texto adicional antes o después.**`;
  }

  static generateHoradricSealPrompt(): string {
    return `🔶 **ROL**: Experto en sistemas de equipamiento y builds de Diablo 4 - Temporada 13.

**OBJETIVO**: Analiza la imagen y extrae la información del **HORADRIC SEAL (Sello Horádrico)** de Diablo 4 para un **personaje específico**.

---

## 👤 CONTEXTO

Este Sello Horádrico pertenece a un **personaje específico** y define su configuración de talismanes. Es único para cada personaje.

---

## 🔍 ¿QUÉ ES EL HORADRIC SEAL?

El **Horadric Seal (Sello Horádrico)** es el NÚCLEO del sistema de talismanes. Define:
- **Cantidad de slots** disponibles para equipar talismanes
- **Estadísticas base** del sistema
- **Bonificaciones especiales** por sets o tipos de talismanes
- **Reglas globales** (límites, restricciones)

👉 **Sin el sello, no hay build de talismanes.**

---

## 📊 FORMATO JSON ESPERADO

\`\`\`json
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
      },
      {
        "nombre": "Maximum Life",
        "valor": 120
      }
    ],
    "bonus": [
      {
        "descripcion": "Charm Set: Dark Pact otorga daño adicional",
        "tags": ["set", "damage", "dark_pact"]
      },
      {
        "descripcion": "Charm Set: Adept Action reduce daño al moverse",
        "tags": ["movement", "defense", "adept_action"]
      }
    ],
    "reglas": [
      {
        "tipo": "restriccion",
        "descripcion": "No puede tener más de 5 sockets"
      },
      {
        "tipo": "restriccion",
        "descripcion": "Puede equipar hasta 2 charms únicos"
      },
      {
        "tipo": "bonus",
        "descripcion": "Los charms de set otorgan 5% más de efecto"
      },
      {
        "tipo": "penalizacion",
        "descripcion": "Los charms de menor rareza reducen 3% las stats base"
      }
    ],
    "nivel_requerido": 60,
    "tags": ["horadric", "seal", "legendary"]
  },
  "palabras_clave": ["horadric_seal", "slots", "charms", "socket"]
}
\`\`\`

---

## 📝 INSTRUCCIONES PASO A PASO

### PASO 1: IDENTIFICAR EL SELLO

**Detectar por:**
- Nombre contiene "Horadric Seal"
- Ícono característico (símbolo horádrico)
- Texto descriptivo menciona "charm slots" o "sockets"

### PASO 2: EXTRAER INFORMACIÓN BÁSICA

- **id**: Identificador único en snake_case (ej: "horadric_seal_honor")
- **nombre**: Nombre completo (ej: "Horadric Seal of Honor")
- **tipo**: Siempre "horadric_seal"
- **rareza**: "rare" o "legendary" (detectar por color del borde)
  - 🟠 Naranja = legendary
  - 🟡 Amarillo = rare

### PASO 3: CAPTURAR SLOTS

- **slots**: Número TOTAL de ranuras para equipar talismanes
  - Puede aparecer como "5 Charm Slots" o "Sockets: 5"
  - Es un número entero (3, 4, 5, 6, etc.)

### PASO 4: CAPTURAR STATS BASE

Los **stats** son bonificaciones numéricas que otorga el sello.

Para cada stat:
- **nombre**: Nombre del atributo (ej: "Total Armor", "Maximum Life", "All Resistances")
- **valor**: Valor numérico (puede ser entero o decimal)

**Ejemplos comunes:**
- Total Armor: +45
- Maximum Life: +120
- All Resistances: +15%
- Movement Speed: +10%

### PASO 5: CAPTURAR BONIFICACIONES ESPECIALES

Los **bonus** son efectos especiales que otorga el sello, generalmente relacionados con:
- **Interacción con sets** de talismanes
- **Multiplicadores** por tipo de charm
- **Mecánicas especiales**

Para cada bonus:
- **descripcion**: Texto completo del efecto
- **tags**: Array de palabras clave relevantes
  - Incluir nombre del set si menciona uno (ej: "dark_pact", "narrow_eye")
  - Incluir mecánica (ej: "damage", "defense", "movement")

**Ejemplos:**
- "Charm Set: Dark Pact otorga 20% más de daño" → tags: ["set", "damage", "dark_pact"]
- "Charm Set: Adept Action reduce 15% el daño recibido al moverse" → tags: ["movement", "defense", "adept_action"]
- "Los charms únicos otorgan 10% más de efecto" → tags: ["unique", "multiplier"]

### PASO 6: CAPTURAR REGLAS/RESTRICCIONES

Las **reglas** son limitaciones o condiciones del sello.

Para cada regla:
- **tipo**: Tipo de regla (usar uno de: "restriccion", "bonus", "sinergia", "penalizacion")
- **descripcion**: Texto completo de la regla

**Tipos de reglas:**
- **restriccion**: Limitación o prohibición ("No puede tener más de X sockets", "Solo charms raros")
- **bonus**: Efecto positivo adicional ("Los charms únicos otorgan +10% de efecto")
- **sinergia**: Interacción especial entre elementos ("Sets completos otorgan bono extra")
- **penalizacion**: Efecto negativo por incumplir condición ("Los charms de baja rareza reducen stats")

**Ejemplos comunes:**
- {"tipo": "restriccion", "descripcion": "No puede tener más de X sockets"}
- {"tipo": "restriccion", "descripcion": "Puede equipar hasta X charms únicos"}
- {"tipo": "bonus", "descripcion": "Los charms únicos otorgan 10% más de efecto"}
- {"tipo": "sinergia", "descripcion": "Sets completos activan bono legendario"}
- {"tipo": "penalizacion", "descripcion": "Charms de menor rareza reducen 5% las stats"}

### PASO 7: INFORMACIÓN ADICIONAL

- **nivel_requerido**: Nivel mínimo para usar el sello (null si no visible)
- **tags**: Array de palabras clave generales
  - Siempre incluir: "horadric", "seal"
  - Incluir rareza: "legendary" o "rare"
  - Incluir conceptos relevantes de bonus/reglas

---

## ⚠️ REGLAS CRÍTICAS

1. **Slots es FUNDAMENTAL**:
   - Sin este número, no se puede construir la build
   - Debe ser un número entero exacto

2. **Stats vs Bonus**:
   - **Stats** = Números directos (+45 armadura, +120 vida)
   - **Bonus** = Efectos especiales/condicionales (interacciones con sets)

3. **Bonus de sets**:
   - Si menciona "Charm Set: [Nombre]", extrae el nombre exacto del set
   - Estos bonus se activan solo si tienes piezas de ese set equipadas
   - Incluye el nombre del set en los tags

4. **Reglas importantes**:
   - Límite de unique charms (si aplica)
   - Restricciones de sockets (si aplica)
   - Requisitos especiales (si aplica)

5. **Rareza**:
   - Legendary (naranja) = más slots + mejores bonus
   - Rare (amarillo) = menos slots + bonus más simples

---

## 📋 NOTAS CONTEXTUALES

- El sello es **ÚNICO por personaje** - solo puedes tener uno equipado
- Los bonus de sets se activan SOLO si tienes las piezas equipadas en los charms
- Algunos sellos tienen **sinergias específicas** con ciertas clases o builds
- El número de slots determina **cuántos talismanes** puedes equipar simultáneamente

**Devuelve ÚNICAMENTE el JSON, sin texto adicional antes o después.**`;
  }
}

