# D4 Builds - Gestor de Builds para Diablo 4

[![Version](https://img.shields.io/badge/version-0.5.1-gold.svg)](https://github.com/CareZapato/D4Build)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)](https://www.typescriptlang.org/)

Una aplicación web moderna y reactiva para gestionar y optimizar tus builds de Diablo 4.

## ✨ Características Principales

- 📁 **Gestión de Workspace**: Organiza todos tus datos en una carpeta local
- 👤 **Personajes**: Crea y gestiona múltiples personajes con sus builds
- ⚔️ **Habilidades**: Importa y consulta habilidades activas y pasivas
- 💎 **Glifos**: Administra glifos del tablero Paragon con sus bonificaciones
- ✨ **Aspectos Legendarios**: Gestiona aspectos organizados por categorías (Ofensivo, Defensivo, Recurso, Utilidad, Movilidad)
- 📊 **Estadísticas**: Registra todas las stats de tu personaje
- 🛡️ **Base de Datos de Héroes**: Mantén una base maestra para cada clase
- 🤖 **Generador de Prompts**: Crea prompts optimizados para extraer datos con IA
- 🔍 **Búsqueda y Filtrado**: Encuentra rápidamente habilidades, glifos y aspectos
- 📄 **Sistema de Paginación**: Navega eficientemente entre grandes cantidades de datos
- 🎨 **Interfaz Temática**: Diseño inspirado en la estética de Diablo 4

## 🚀 Instalación

### Requisitos Previos

- Node.js 18 o superior
- npm o yarn

### Pasos de Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/CareZapato/D4Build.git
cd D4Builds
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:3000`

## 📖 Uso

### 1. Configurar Workspace

Al iniciar la aplicación por primera vez:
- Haz clic en "Seleccionar Carpeta de Workspace"
- Elige una carpeta donde se guardarán todos tus datos
- La app creará automáticamente la estructura de carpetas necesaria

### 2. Importar Datos de Héroes

Antes de crear personajes, importa los datos base:
- Ve a la sección "Héroes"
- Selecciona la clase (Paladín, Bárbaro, etc.)
- Importa los JSONs de habilidades y glifos
- Los archivos deben seguir el formato especificado en la documentación

### 3. Crear Personajes

- Ve a "Personajes" y haz clic en "Nuevo Personaje"
- Completa los datos básicos (nombre, clase, nivel)
- Edita el personaje para agregar habilidades y glifos

### 4. Generar Prompts

- Ve a "Prompts"
- Selecciona un personaje
- Elige el tipo de consulta (personalizada, sinergias, optimización)
- Copia el prompt generado y úsalo en ChatGPT, Claude u otra IA

## Estructura de Datos

### Formato de Habilidades

```json
{
  "habilidades_activas": [
    {
      "nombre": "Choque",
      "tipo": "Básica",
      "rama": "Leviatán",
      "nivel": 1,
      "descripcion": "...",
      "modificadores": [...]
    }
  ],
  "habilidades_pasivas": [...]
}
```

### Formato de Glifos

```json
{
  "glifos": [
    {
      "nombre": "Ley",
      "rareza": "Raro",
      "estado": "Encontrado",
      "atributo_escalado": {...},
      "bonificacion_adicional": {...}
    }
  ]
}
```

### Formato de Aspectos

El sistema acepta dos formatos:

**Formato nuevo (recomendado):**
```json
{
  "aspectos": [
    {
      "id": "aspect-001",
      "name": "Aspecto de Retribución",
      "shortName": "Retribución",
      "effect": "El Bloqueo tiene un 15% de probabilidad...",
      "level": "1/21",
      "category": "ofensivo",
      "detalles": [
        {
          "atributo_ref": "probabilidad_bloqueo",
          "atributo_nombre": "Probabilidad de bloqueo",
          "texto": "aumenta un 15%",
          "valor": "15%"
        }
      ],
      "tags": ["holy", "damage"]
    }
  ]
}
```

**Formato antiguo (compatible):**
```json
{
  "aspectos": [
    {
      "id": "aspecto_1001",
      "nombre": "Aspecto Acelerante",
      "categoria": "Ofensivo",
      "descripcion": "Los golpes críticos con habilidades principales..."
    }
  ]
}
```

**Categorías válidas:** `ofensivo`, `defensivo`, `recurso`, `utilidad`, `movilidad`

## 📁 Estructura del Workspace

```
workspace/
├── workspace.json              # Configuración del workspace
├── heroes/                     # Datos de clases
│   ├── Paladín_habilidades.json
│   ├── Paladín_glifos.json
│   ├── Paladín_aspectos.json
│   ├── Bárbaro_habilidades.json
│   ├── Bárbaro_glifos.json
│   └── ...
└── personajes/                 # Personajes creados
    ├── personaje1.json
    ├── personaje2.json
    └── ...
```

## Tecnologías Utilizadas

- **React 18** - Framework de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **TailwindCSS** - Estilos y diseño responsive
- **Lucide React** - Iconos
- **File System Access API** - Acceso a archivos locales

## Scripts Disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la app para producción
npm run preview  # Previsualiza el build de producción
npm run lint     # Ejecuta el linter
```

## Compatibilidad de Navegadores

Esta aplicación usa la File System Access API, que es compatible con:
- Chrome 86+
- Edge 86+
- Opera 72+

**Nota**: Firefox y Safari tienen soporte limitado o no soportan esta API.

## 🗺️ Roadmap

- [x] ~~Sistema de aspectos legendarios~~ ✅ **v0.1.0**
- [x] ~~Paginación para gestión de datos~~ ✅ **v0.1.1**
- [ ] Sistema de búsqueda avanzado
- [ ] Comparación entre builds
- [ ] Exportar builds como imagen
- [ ] Templates de builds predefinidos
- [ ] Calculadora de daño
- [ ] Sistema de tags y categorías personalizadas
- [ ] Importación desde capturas de pantalla con OCR
- [ ] Modo oscuro/claro

## 📝 Changelog

### v0.1.1 (20 de Marzo, 2026)
**🔧 Correcciones y Mejoras**
- ✅ **Sistema de aspectos mejorado**: Los aspectos ahora se visualizan correctamente
- ✅ **Compatibilidad de formatos**: Soporte para formato antiguo (nombre/categoria) y nuevo (name/category)
- ✅ **Normalización automática**: Conversión transparente entre formatos de JSON
- ✅ **Sistema de paginación**: Navegación con controles intuitivos (5, 10, 20, 50, 100 items)
- ✅ **Corrección de bugs**: Props types, categorías en mayúsculas, estado de carga
- ✅ **Mejoras de UI/UX**: Contador de items, controles de navegación, auto-scroll

### v0.1.0 (20 de Marzo, 2026)
**🚀 Lanzamiento Inicial**
- 📋 Gestión completa de personajes
- ⚔️ Sistema de habilidades activas y pasivas
- 💎 Gestión de glifos del tablero Paragon
- ✨ Sistema de aspectos legendarios organizados por categorías
- 📊 Registro de estadísticas del personaje
- 🛡️ Base de datos maestra para cada clase
- 🤖 Generador de prompts para IA
- 💾 Sistema de workspace local
- 🎨 Interfaz temática de Diablo 4

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 💬 Soporte

Si encuentras algún bug o tienes sugerencias, por favor abre un [issue en GitHub](https://github.com/CareZapato/D4Build/issues).

## 👨‍💻 Autor

**Zapato** - [CareZapato](https://github.com/CareZapato)

---

Hecho con ❤️ para la comunidad de Diablo 4
