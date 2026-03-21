# D4 Builds - Gestor de Builds para Diablo 4

Una aplicación web moderna y reactiva para gestionar y optimizar tus builds de Diablo 4.

## Características

- 📁 **Gestión de Workspace**: Organiza todos tus datos en una carpeta local
- 👤 **Personajes**: Crea y gestiona múltiples personajes con sus builds
- ⚔️ **Habilidades**: Importa y consulta habilidades activas y pasivas
- 💎 **Glifos**: Administra glifos y encuentra sinergias con tus habilidades
- ✨ **Generador de Prompts**: Crea prompts enriquecidos para consultar en IAs externas
- 🔍 **Búsqueda y Filtrado**: Encuentra rápidamente habilidades y glifos
- 🎨 **Interfaz Temática**: Diseño inspirado en Diablo 4

## Instalación

### Requisitos Previos

- Node.js 18 o superior
- npm o yarn

### Pasos de Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
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

## Uso

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

## Estructura del Workspace

```
workspace/
├── workspace.json          # Configuración del workspace
├── heroes/                 # Datos de clases
│   ├── Paladin_habilidades.json
│   ├── Paladin_glifos.json
│   └── ...
└── personajes/            # Personajes creados
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

## Roadmap

- [ ] Sistema de búsqueda avanzado
- [ ] Comparación entre builds
- [ ] Exportar builds como imagen
- [ ] Templates de builds predefinidos
- [ ] Calculadora de daño
- [ ] Soporte para aspectos legendarios
- [ ] Sistema de tags y categorías

## Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## Soporte

Si encuentras algún bug o tienes sugerencias, por favor abre un issue en GitHub.

---

Hecho con ❤️ para la comunidad de Diablo 4
