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
      "tipo": "Básica|Principal|Defensiva|Movilidad|Definitiva|Arma de Arsenal",
      "rama": "Nombre de la rama (ej: Ira, Arma de Arsenal, etc.)",
      "nivel": 1,
      "descripcion": "Descripción completa de la habilidad",
      "tipo_danio": "Físico|Fuego|Hielo|Rayo|Veneno|Sombra|null",
      "modificadores": [
        {
          "nombre": "Nombre del modificador",
          "descripcion": "Descripción completa del modificador"
        }
      ]
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada habilidad debe tener un ID único (ej: skill_activa_12345)
- El tipo debe ser exactamente uno de: Básica, Principal, Defensiva, Movilidad, Definitiva, Arma de Arsenal
- Si no tiene tipo de daño específico, usa null
- Incluye TODOS los modificadores visibles con sus descripciones completas
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
      "tipo": "Pasiva Clave|Pasiva|Nodo del tablero Paragon",
      "nivel": 1,
      "nivel_maximo": 3,
      "rama": "Nombre de la rama o tablero",
      "efecto": "Descripción completa del efecto de la pasiva",
      "requisitos": "Requisitos si los hay, null si no",
      "puntos_asignados": 1
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada pasiva debe tener un ID único (ej: skill_pasiva_12345)
- El tipo debe ser: Pasiva Clave, Pasiva, o Nodo del tablero Paragon
- nivel_maximo es típicamente 3 para pasivas normales, 1 para pasivas clave
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
      "estado": "Encontrado"
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
      "notas": "Información adicional relevante"
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada aspecto debe tener un ID único (ej: aspecto_12345)
- **categoria** debe determinarse por el COLOR: Azul=Defensivo, Rojo=Ofensivo, Verde=Recurso, Morado=Utilidad, Amarillo=Movilidad
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
      "tipo": "Básica|Principal|Defensiva|Movilidad|Definitiva|Arma de Arsenal",
      "rama": "Nombre de la rama",
      "nivel": 1,
      "descripcion": "Descripción completa",
      "tipo_danio": "Físico|Fuego|Hielo|Rayo|Veneno|Sombra|null",
      "modificadores": [
        {
          "nombre": "Nombre del modificador",
          "descripcion": "Descripción completa"
        }
      ]
    }
  ],
  "habilidades_pasivas": [
    {
      "id": "skill_pasiva_[genera_id_unico]",
      "nombre": "Nombre de la pasiva",
      "tipo": "Pasiva Clave|Pasiva|Nodo del tablero Paragon",
      "nivel": 1,
      "nivel_maximo": 3,
      "rama": "Nombre de la rama",
      "efecto": "Descripción del efecto",
      "requisitos": "null si no hay",
      "puntos_asignados": 1
    }
  ]
}
\`\`\`

**Notas importantes:**
- Cada habilidad debe tener un ID único
- Usa los valores exactos especificados para tipo, rareza, etc.
- Si un campo no está visible, usa null o array vacío según corresponda
- Incluye TODAS las habilidades visibles en la imagen`;
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
}
