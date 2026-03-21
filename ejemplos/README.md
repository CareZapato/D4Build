# Archivos de Ejemplo

Estos son archivos de ejemplo que puedes usar para probar la aplicación.

## Cómo usar estos archivos

1. Inicia la aplicación
2. Selecciona una carpeta para tu workspace
3. Ve a la sección "Héroes"
4. Selecciona "Paladín" como clase
5. Importa `Paladin_habilidades.json` como habilidades
6. Importa `Paladin_glifos.json` como glifos
7. Importa `Paladín_aspectos.json` como aspectos
8. Crea un nuevo personaje de clase Paladín
9. ¡Empieza a explorar las funcionalidades!

## Estructura de los archivos

### Habilidades (Paladin_habilidades.json)
Contiene ejemplos de:
- Habilidades activas con modificadores
- Efectos generados
- Habilidades pasivas

### Glifos (Paladin_glifos.json)
Contiene ejemplos de:
- Glifos encontrados
- Bonificaciones escaladas por atributos
- Bonificaciones adicionales
- Bonificaciones legendarias

### Aspectos (Paladín_aspectos.json) ✨ NUEVO
Contiene ejemplos de:
- 10 aspectos organizados por categorías
- 5 categorías: Ofensivo, Defensivo, Recurso, Utilidad, Movilidad
- Keywords y tags para búsqueda fácil
- Niveles de aspecto

**Formato del JSON:**
```json
{
  "aspectos": [
    {
      "id": "aspect-001",
      "name": "Nombre Completo",
      "shortName": "Nombre Corto",
      "effect": "Descripción del efecto",
      "level": "1/21",
      "category": "ofensivo",
      "keywords": ["palabra1", "palabra2"],
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

**Categorías válidas:**
- `ofensivo` - Aspectos que aumentan el daño (🔴 rojo)
- `defensivo` - Aspectos de supervivencia (🔵 azul)
- `recurso` - Aspectos de generación de recursos (🟢 verde)
- `utilidad` - Aspectos con efectos diversos (🟣 morado)
- `movilidad` - Aspectos de movimiento (🟡 amarillo)

## 📋 Cómo Importar Aspectos

1. **Ve a "Héroes"** → Selecciona la clase
2. **Pestaña "Importar/Exportar"** → Selecciona "Aspectos"
3. **Importa** el archivo JSON o pega el contenido
4. **Ve a "Gestionar Datos"** → Selecciona "Aspectos"
5. ¡Verás tus aspectos organizados por categoría con colores!

## Personalización

Puedes editar estos archivos JSON para agregar tus propias habilidades, glifos y aspectos, 
siguiendo la misma estructura que se muestra en los ejemplos.
