# Estadísticas - Formatos de Importación

## Formato V2 - Estructura Enriquecida (Recomendado)

Este formato preserva **detalles** adicionales de cada estadística que se muestran en tooltips.

### Ejemplo: Moneda con Detalles

```json
{
  "estadisticas": {
    "moneda": {
      "oro": {
        "valor": 415224377,
        "atributo_ref": "oro",
        "atributo_nombre": "Oro",
        "detalles": [
          {
            "atributo_ref": "oro",
            "atributo_nombre": "Oro",
            "texto": "La moneda principal de Santuario, que usa la mayoría de los mercaderes y artesanos.",
            "palabras_clave": ["moneda"]
          },
          {
            "atributo_ref": "oro",
            "atributo_nombre": "Oro",
            "texto": "Se obtiene de muchas actividades de Santuario y al vender objetos.",
            "palabras_clave": ["economia"]
          }
        ]
      },
      "obolos": {
        "valor": 1962,
        "maximo": 2500,
        "atributo_ref": "obolos",
        "atributo_nombre": "Óbolos Murmurantes",
        "detalles": [...]
      },
      "polvoRojo": {
        "valor": 2768,
        "atributo_ref": "polvoRojo",
        "atributo_nombre": "Polvo Rojo",
        "detalles": [...]
      }
    }
  },
  "palabras_clave": [
    {
      "tag": "moneda",
      "texto_original": "moneda",
      "significado": "Recurso utilizado para comprar o intercambiar objetos",
      "categoria": "economia",
      "fuente": "moneda"
    }
  ]
}
```

### ✅ Ventajas de la Estructura Enriquecida

1. **Tooltips informativos**: Los detalles se muestran al pasar el mouse sobre el campo
2. **Búsqueda por palabras clave**: Se pueden buscar estadísticas por tags
3. **Documentación integrada**: Descripción de qué hace cada moneda
4. **Trazabilidad**: Saber de dónde viene cada estadística

### 📦 Cómo se Guarda en el Personaje

El sistema preserva la estructura completa:

```json
{
  "id": "1775689436412",
  "nombre": "CarePala",
  "estadisticas": {
    "moneda": {
      "oro": {
        "valor": 415224377,
        "atributo_ref": "oro",
        "atributo_nombre": "Oro",
        "detalles": [...]
      }
    }
  }
}
```

### 🖥️ Cómo se Muestra en la UI

El sistema extrae automáticamente el campo `valor` para mostrarlo en el input:
- `oro.valor` → "415224377" (visible en el campo)
- `oro.detalles` → Se muestra en tooltip al pasar el mouse

### ✏️ Cómo se Actualiza desde la UI

Cuando editas un valor en la UI, se preserva la estructura:
- **Antes**: `{valor: 100, detalles: [...]}`
- **Cambias** a `200` en el input
- **Después**: `{valor: 200, detalles: [...]}` (detalles preservados)

---

## Formato V1 - Estructura Simple (Compatible)

El sistema también acepta valores simples para compatibilidad:

```json
{
  "estadisticas": {
    "moneda": {
      "oro": "380M",
      "obolos": {
        "actual": 1618,
        "maximo": 2500
      },
      "polvoRojo": 2768
    }
  }
}
```

**Nota**: Este formato NO incluye detalles ni tooltips.

---

## Prompts para IA

Usa el botón **"Copiar Prompt IA"** en la sección de estadísticas para obtener el prompt optimizado que genera automáticamente la estructura enriquecida.

El prompt incluye instrucciones para extraer:
- ✅ Valores principales
- ✅ Detalles de tooltips
- ✅ Palabras clave resaltadas
- ✅ Atributos de referencia
