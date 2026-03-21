# Ejemplos de JSONs V2 para Estadísticas

## Estructura de Imágenes en Diablo 4

Cada imagen de estadísticas en el juego tiene:
- **Lado IZQUIERDO**: Detalles completos del atributo seleccionado
- **Lado DERECHO**: Lista de todos los atributos con valores

## Regla Importante: 1 Imagen = 1 JSON

**Solo capturar el atributo que tiene sus detalles visibles en el lado izquierdo.**

### Ejemplo de Flujo

Si tomas 5 capturas de pantalla:
1. `nivel-screenshot.png` → Genera `nivel.json`
2. `fuerza-screenshot.png` → Genera `fuerza.json`
3. `inteligencia-screenshot.png` → Genera `inteligencia.json`
4. `armadura-screenshot.png` → Genera `armadura.json`
5. `vida-screenshot.png` → Genera `vida.json`

Al importar todos los JSONs juntos, el sistema los combinará automáticamente.

## Ejemplos Incluidos

### `estadisticas-v2-nivel-test.json`
JSON de ejemplo para el atributo **Nivel**:
- Contiene el objeto `nivel` con descripción y detalles
- `estadisticas` está vacío `{}`
- 1 palabra clave: "reduccion_de_danio_visible"

**Uso**: Este es el JSON que obtendrías al tomar una captura del tooltip de "Nivel".

### `estadisticas-v2-fuerza.json`
JSON de ejemplo para el atributo **Fuerza**:
- Contiene `estadisticas.atributos_principales` con el item "fuerza"
- `nivel` es `null`
- 2 palabras clave: "danio_de_habilidad", "armadura"

**Uso**: Este es el JSON que obtendrías al tomar una captura del tooltip de "Fuerza".

### `estadisticas-v2-test.json` (Anterior)
JSON con múltiples atributos juntos (formato antiguo para referencia).

## Formato correcto para IA

Al usar el prompt con ChatGPT/Claude:
1. Toma UNA captura de pantalla del atributo que quieres extraer
2. La IA generará UN JSON con solo ese atributo
3. Repite para cada atributo que necesites
4. Importa todos los JSONs a la vez (el sistema los combina)

## Campos Vacíos

Si un campo no aplica para la imagen actual:
- `nivel`: usar `null`
- `nivel_paragon`: usar `null`
- `estadisticas`: usar `{}` (objeto vacío)
- `palabras_clave`: usar `[]` (array vacío)
