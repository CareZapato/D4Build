# D4 Builds - Gestor de Builds para Diablo 4

[![Version](https://img.shields.io/badge/version-0.7.1-gold.svg)](https://github.com/CareZapato/D4Build)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-green.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

Una aplicación web moderna y reactiva full-stack para gestionar y optimizar tus builds de Diablo 4 con **integración de IA**, **sistema de autenticación**, **suscripciones Premium** y **gestión de perfil**.

## ✨ Características Principales

### 💳 Sistema de Suscripciones (v0.7.1 - NUEVO)
- 📅 **Planes Flexibles**: 1 mes ($5), 6 meses ($25), 1 año ($45)
- 💰 **Créditos para IA**: 80% del pago se convierte en créditos ($4 de cada $5)
- 📋 **Tabla subscriptions**: Historial completo de suscripciones con fechas y estado
- ⏰ **Control de expiración**: Alertas cuando tu suscripción está próxima a vencer
- 🔄 **Extensión de plan**: Renueva o extiende antes de que expire
- 🎯 **Descuentos por volumen**: Planes largos incluyen más créditos (ahorra hasta 25%)
- 📊 **Balance dinámico**: Sistema premium_balance que se recarga al contratar

### 👤 Perfil de Usuario (v0.7.1 - NUEVO)
- ⚙️ **Gestión completa**: Edita username, email, cambia contraseña
- 📊 **Análisis de uso**: Estadísticas detalladas por semana, mes y año
- 💳 **Historial de gastos**: Lista paginada de todas las consultas de IA con costos
- 👑 **Info de suscripción**: Estado, plan actual, fechas de inicio/fin, renovación
- 💵 **Vista de créditos**: Balance actual, total usado, consumo por período
- 🚨 **Alertas inteligentes**: Notificaciones de expiración y saldo bajo
- 🔒 **Seguridad**: Cambio de contraseña con validación de contraseña actual

### 🔐 Sistema de Autenticación (v0.7.0)
- 👤 **Login/Registro**: Autenticación JWT con PostgreSQL backend
- 💎 **Cuentas Premium/Basic**: Sistema de niveles con funcionalidades exclusivas
- 🔒 **Restricciones por Cuenta**: Candados en UI, blur de stats para usuarios Basic
- 📊 **Tracking de Uso**: Monitoreo de consumo de API OpenAI por usuario
- 💳 **Sistema de Upgrade**: Proceso ficticio de pago para upgrade a Premium
- 🛡️ **Seguridad**: Tokens JWT, passwords hasheados (bcrypt), middleware de autorización

### 🎮 Gestión Completa de Builds
- 📁 **Workspace Dinámico**: Cambia de carpeta sin recargar la página
- 👤 **Personajes**: Crea y gestiona múltiples personajes con estadísticas completas
- ⚔️ **Habilidades**: Importa y organiza habilidades activas y pasivas por clase
- 💎 **Glifos Paragon**: Administra glifos del tablero Paragon con niveles y bonificaciones
- ✨ **Aspectos Legendarios**: 5 categorías (Ofensivo, Defensivo, Recurso, Utilidad, Movilidad)
- 🔮 **Runas & Gemas**: Gestión de runas de invocación y gemas de habilidad
- 🛡️ **Equipo & Build**: Sistema completo de piezas de equipamiento
- 📊 **Estadísticas Detalladas**: Todos los atributos del personaje

### 🤖 IA Integrada (Extracción Automática)
- **Gemini AI**: gemini-1.5-flash-002 con modo JSON experimental
- **OpenAI GPT-4o**: Modelo con visión avanzada y disclaimer reforzado
- **Procesamiento de imágenes**: Toma screenshots del juego y extrae datos JSON
- **Auto-importación**: Los datos se guardan automáticamente en el workspace
- **Categorías soportadas**: Habilidades, Glifos, Aspectos, Stats, Paragon, Runas, Equipo
- 🔒 **Premium Only**: Captura AI restringida a cuentas Premium

### 📚 Base de Datos de Héroes
- Datos maestros por clase (Paladín, Bárbaro, Hechicero, etc.)
- Sistema de referencias: personajes solo guardan IDs
- Actualizaciones centralizadas sin duplicación
- Gestión completa desde la UI (CRUD)

### 🎨 Experiencia de Usuario
- Interfaz temática inspirada en Diablo 4
- Búsqueda y filtrado avanzado
- Sistema de paginación inteligente
- Modales con z-index jerarquizado
- Menú lateral persistente (sticky)
- Badge de nivel de cuenta (Basic/Premium) en UI con tooltip de expiración
- Perfil de usuario accesible desde Sidebar
- 💵 **Indicador de créditos**: Muestra balance restante en Sidebar para Premium
- 🔄 **Cambio de workspace**: Cambia de carpeta sin recargar la página
- 🔔 **Alertas de expiración**: Notificaciones cuando la suscripción está por vencer

### 💰 Herramientas de Desarrollo
- **Panel de Costos**: Monitoreo de gastos de API OpenAI/Gemini por usuario
- **Diseño minimalista**: Estilo VS Code Copilot notification
- **Formatos compactos**: 1.5K, 2.3M tokens (abreviaciones)
- **Control por ENV**: Habilitar/deshabilitar con variable de entorno
- **Billing por Usuario**: Tracking de tokens y costos vinculados a cada cuenta

### ⚙️ Backend & Infraestructura (v0.7.0-0.7.1)
- **Express.js**: API RESTful en Node.js con 30+ endpoints
- **PostgreSQL**: Base de datos relacional con 3 tablas principales (users, subscriptions, billing_usage)
- **Auto-Migración**: Detecta y recrea tablas si faltan al iniciar (002_create_subscriptions_table.sql)
- **CORS Dinámico**: Configuración multi-origen para desarrollo y producción
- **Control de saldo**: Billing descontado automáticamente de premium_balance
- **Transacciones atómicas**: BEGIN/COMMIT/ROLLBACK para consistencia de datos
- **npm run dev**: Inicia frontend + backend simultáneamente

## 🚀 Inicio Rápido

### 1. Instalación

```bash
# Clonar repositorio
git clone https://github.com/CareZapato/D4Build.git
cd D4Build

# Instalar todas las dependencias (cliente + servidor)
npm run setup
```

### 2. Configurar Base de Datos

```sql
-- Crear la base de datos en PostgreSQL
CREATE DATABASE d4buildsbd;
```

### 3. Configurar Variables de Entorno

```bash
# Frontend (.env en raíz)
cp .env.example .env

# Backend (server/.env)
cd server
cp .env.example .env
```

Edita los archivos `.env` con tus credenciales (ver [INSTALL.md](INSTALL.md) para detalles).

### 4. Iniciar la Aplicación

```bash
# Desde la raíz del proyecto
npm run dev
```

Esto iniciará:
- 🎨 Frontend en http://localhost:5173
- ⚙️ Backend en http://localhost:3001

El backend ejecutará **auto-migración** de tablas si es necesario.

## 📖 Documentación Completa

Para instrucciones detalladas de instalación, configuración de producción, variables de entorno y solución de problemas, consulta:

📘 **[INSTALL.md](INSTALL.md)** - Guía completa de instalación y configuración

## 🔑 Características de Autenticación

### Niveles de Cuenta

#### 🆓 Basic (Gratuito)
- Gestión básica de personajes y builds
- Acceso a stats y habilidades
- Prompts de análisis básicos
- Stats borrosos en lista de personajes
- Sin acceso a Captura AI

#### 💎 Premium
- **Todo lo de Basic** +
- 🤖 Captura AI con OpenAI/Gemini
- 📊 Prompts de análisis avanzados (comparativas, externos)
- 👁️ Vista completa de stats en lista de personajes
- 🎯 Funcionalidades exclusivas futuras

### API Endpoints

#### Autenticación
- `POST /api/auth/register` - Registro de nuevo usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/verify` - Verificar token JWT

#### Usuarios
- `GET /api/users/profile` - Obtener perfil y estadísticas
- `PUT /api/users/profile` - Actualizar perfil
- `POST /api/users/upgrade-premium` - Upgrade a Premium (ficticio)

#### Billing
- `POST /api/billing/log` - Registrar uso de API
- `GET /api/billing/my-usage` - Consultar mi uso
- `GET /api/billing/stats` - Estadísticas globales

## 🚀 Scripts Disponibles

### Raíz del Proyecto

```bash
npm run dev           # Inicia frontend + backend simultáneamente
npm run setup         # Instala todas las dependencias
npm run migrate       # Ejecuta migraciones de BD manualmente
npm run build         # Construye el frontend para producción
npm run dev:client    # Solo frontend
npm run dev:server    # Solo backend
```

### Backend (server/)

```bash
npm run dev           # Servidor en modo desarrollo (nodemon)
npm start             # Servidor en modo producción
npm run migrate       # Ejecutar migraciones
```

## 🔧 Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Navegador moderno con soporte para File System Access API

### Pasos de Instalación

1. **Clona el repositorio:**
```bash
git clone https://github.com/CareZapato/D4Build.git
cd D4Builds
```

2. **Instala las dependencias:**
```bash
npm install
```

3. **Configura las variables de entorno** (crea archivo `.env`):
```bash
# API Keys (al menos una requerida para IA)
VITE_OPENAI_API_KEY=sk-proj-...        # OpenAI GPT-4o
VITE_GEMINI_API_KEY=...                # Google Gemini (opcional)

# Developer Tools
VITE_ENABLE_BILLING_PANEL=true         # true = mostrar | false = ocultar
```

4. **Inicia el servidor de desarrollo:**
```bash
npm run dev
```

5. **Abre tu navegador** en `http://localhost:5173`

## 📖 Guía de Uso

### 1. Configurar Workspace (Primera Vez)

1. Al abrir la app, verás el **WorkspaceSelector**
2. Haz clic en **"Seleccionar Carpeta de Workspace"**
3. Elige una carpeta vacía o crea una nueva
4. La app generará automáticamente esta estructura:

```
📁 Tu Workspace/
├── 📁 personajes/           # JSONs de personajes individuales
│   ├── personaje_1.json
│   └── personaje_2.json
├── 📁 heroes/               # Datos maestros por clase
│   ├── 📁 paladin/
│   │   ├── habilidades.json
│   │   ├── glifos.json
│   │   ├── aspectos.json
│   │   ├── runas.json
│   │   └── gemas.json
│   ├── 📁 barbaro/
│   └── ...
├── 📁 images/               # Capturas procesadas
│   ├── 📁 habilidades/
│   ├── 📁 glifos/
│   ├── 📁 aspectos/
│   ├── 📁 stats/
│   └── ...
└── billing.json             # Registro de costos de IA (dev)
```

### 2. Importar Datos de Héroes (Base de Datos)

Antes de crear personajes, configura los datos base por clase:

1. Ve a la sección **"Héroes"** en el menú lateral
2. Selecciona una **clase** (ej: Paladín)
3. Usa la pestaña **"Importar/Exportar"**:
   - **Desde archivo JSON**: Sube un archivo con el formato correcto
   - **Desde texto**: Pega el JSON directamente
4. Los formatos esperados están documentados en `ejemplos/` y `CONTEXT.md`
5. Opcionalmente, usa **"Copiar Prompt para IA"** para generar prompts optimizados

**Pestaña "Gestionar Datos":** Edita, agrega o elimina habilidades/glifos/aspectos directamente desde la UI.

### 3. Crear y Gestionar Personajes

1. Ve a **"Personajes"** → **"Nuevo Personaje"**
2. Completa:
   - Nombre
   - Clase (debe tener datos de héroe importados)
   - Nivel (1-100)
   - Nivel de Paragon (opcional)
3. Haz clic en el personaje para **editar**:
   - **Estadísticas**: Importa JSON o edita manualmente
   - **Habilidades**: Selecciona desde la base del héroe
   - **Glifos**: Asigna glifos y sus niveles actuales
   - **Aspectos**: Asigna aspectos legendarios
   - **Build**: Equipa piezas de equipamiento
   - **Paragon**: Administra tableros y nodos
   - **Runas**: Gestiona runas de invocación y gemas

### 4. Extracción con IA (Procesamiento de Imágenes)

#### 4.1 Abrir Modal de Captura
- Haz clic en el botón **"Captura"** (ícono cámara) en el menú lateral
- O usa el botón de cámara flotante en varias secciones

#### 4.2 Configurar Extracción
1. **Seleccionar imagen**: Arrastra o selecciona screenshot del juego
2. **Elegir categoría**: Habilidades, Glifos, Aspectos, Stats, etc.
3. **Definir destino**:
   - **Héroe**: Selecciona clase (datos maestros)
   - **Personaje**: Selecciona un personaje existente
4. **Configuración adicional** (según categoría):
   - Paragon: Tipo (Tablero/Nodo/Atributos)
   - Runas: Tipo (Runas/Gemas)

#### 4.3 Procesar con IA
- **Botón Gemini** (⚡): Procesamiento rápido con gemini-1.5-flash
- **Botón OpenAI** (✨): Procesamiento con GPT-4o (con disclaimer reforzado)
- Ambos muestran:
  - Barra de progreso en tiempo real
  - JSON extraído en preview
  - Modal de resultados con botones de importación
- Los datos se guardan automáticamente si se confirman

#### 4.4 Prompts Embebidos
- Copia prompts optimizados para usar en ChatGPT/Claude
- Incluye disclaimer de videojuego para evitar rechazos
- Formato JSON estructurado según categoría

### 5. Generar Prompts Personalizados

1. Ve a **"Prompts"**
2. Selecciona un **personaje** (con datos completos)
3. Elige tipo de análisis:
   - **Consulta personalizada**: Pregunta específica sobre el build
   - **Análisis de sinergias**: Optimización de habilidades
   - **Recomendaciones**: Sugerencias de mejora
4. **Copia el prompt** generado
5. Pégalo en ChatGPT, Claude o tu IA preferida

### 6. Buscar y Filtrar Datos

- Usa el buscador global para encontrar habilidades, glifos, aspectos
- Filtra por tipo, rama, categoría
- Sistema de paginación para navegación eficiente

## 📊 Formatos JSON Esperados

### Ejemplo: Habilidades

```json
{
  "habilidades": {
    "activas": [
      {
        "id": "habilidad_1",
        "nombre": "Golpe Sagrado",
        "tipo": "Básica",
        "rama": "Core",
        "descripcion": "Golpea con poder sagrado",
        "puntos_max": 5,
        "mejoras": ["Mejora 1", "Mejora 2"]
      }
    ],
    "pasivas": [...]
  }
}
```

### Ejemplo: Glifos

```json
{
  "glifos": [
    {
      "id": "glifo_1",
      "nombre": "Espíritu",
      "nivel_max": 21,
      "bonificacion_base": "+50% daño",
      "bonificacion_max": "+100% daño",
      "radio_base": 3,
      "radio_max": 5,
      "descripcion": "Aumenta el daño de habilidades"
    }
  ]
}
```

Consulta `ejemplos/` y `CONTEXT.md` para ver todos los formatos completos.

## 🔧 Variables de Entorno

```bash
# ========================================
# API Keys (al menos una requerida)
# ========================================
VITE_OPENAI_API_KEY=sk-proj-xxxxx
# - Obtén tu API key en: https://platform.openai.com/api-keys
# - Modelo usado: gpt-4o (visión + JSON)
# - Costos aprox: $0.005 - $0.02 por imagen

VITE_GEMINI_API_KEY=xxxxx
# - Obtén tu API key en: https://aistudio.google.com/apikey
# - Modelo usado: gemini-1.5-flash-002
# - Gratis hasta cierto límite mensual

# ========================================
# Developer Tools
# ========================================
VITE_ENABLE_BILLING_PANEL=true
# - true: Muestra botón $ para ver costos de API
# - false: Oculta completamente el panel
# - Recomendado: false en producción
```

## 💸 Panel de Costos (Dev Tool)

El panel de monitoreo de costos (v0.6.4) te permite:
- Ver **costo total acumulado** de llamadas a API
- **Desglose por proveedor** (OpenAI vs Gemini)
- **Últimas 3 llamadas** con modelo, timestamp, costo
- **Formato compacto**: 1.5K tokens, 2.3M tokens, $0.0050
- **Auto-refresh**: Cada 15 segundos
- **Persistencia**: Estado recordado en localStorage

**Cómo usarlo:**
1. Habilita con `VITE_ENABLE_BILLING_PANEL=true`
2. Botón $ aparece en esquina inferior derecha
3. Clic para expandir/colapsar panel
4. Datos guardados en `billing.json` del workspace

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

---

## 🚀 Despliegue a Producción

Para desplegar D4Builds en producción, consulta la **[Guía Completa de Despliegue](DEPLOYMENT.md)**.

### Resumen Rápido:

#### 📋 Valores para PostgreSQL en Producción:
- **Database**: `d4buildsbd`
- **User**: `d4builds_admin` ⚠️ **NO uses "postgres"**
- **PostgreSQL Version**: 18 (o 14+)
- **Region**: Selecciona la más cercana a tus usuarios

#### 🔐 Variables de Entorno Requeridas:
```bash
# Base de datos
DB_HOST=<tu-host-postgresql>
DB_PORT=5432
DB_NAME=d4buildsbd
DB_USER=d4builds_admin
DB_PASSWORD=<password-generado>

# JWT (genera una clave segura)
JWT_SECRET=<clave-aleatoria-32-chars>
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://tu-dominio.com
NODE_ENV=production
PORT=3001
```

#### ✅ Checklist Post-Despliegue:
1. ✅ Ejecutar migraciones: `npm run migrate`
2. ✅ Crear usuario admin: `node check-admin.js`
3. ✅ Verificar health endpoint: `/health`
4. ✅ Cambiar contraseña del admin
5. ✅ Configurar backups de base de datos

**Ver documentación completa**: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📄 Archivos de Configuración

- `.env.production.example` - Plantilla de variables de entorno para producción
- `DEPLOYMENT.md` - Guía completa de despliegue paso a paso
- `server/migrations/` - Migraciones de base de datos (auto-ejecutables)

---

## 🛠️ Stack Tecnológico

### Frontend
- React 18.3.1 + TypeScript 5.6.3
- Vite 8.0.8 (build tool)
- TailwindCSS (estilos)
- Lucide Icons
- Axios (HTTP client con interceptores)

### Backend
- Node.js + Express 4.18.2
- PostgreSQL 14+ (base de datos)
- JWT (autenticación)
- bcryptjs (hash de contraseñas)
- Migraciones automáticas

### APIs de IA
- OpenAI GPT-4o-mini
- Google Gemini (alternativa)

---

## 📞 Soporte

¿Problemas con el despliegue? Revisa:
1. [DEPLOYMENT.md](DEPLOYMENT.md) - Guía completa
2. Logs del servidor (`nodemon` o servicio de hosting)
3. Configuración de variables de entorno
4. Estado de las migraciones (`npm run migrate`)

---

**Versión**: 0.7.1  
**Última actualización**: Abril 2026
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

### v0.6.0 (17 de Abril, 2026)
**🎨 Mejoras Visuales y Validación**
- ✅ **Botones rediseñados**: Grid compacto 3×2/6 columnas, solo íconos, distribución uniforme
- ✅ **Validación mejorada**: Los botones de IA ahora validan campos requeridos antes de procesar
- ✅ **Mensajes claros**: Indica exactamente qué campos faltan (héroe/personaje, clase, tipo de paragon, tipo de runa)
- ✅ **Integración OpenAI completa**: Documentación de proxy CORS, API keys, manejo de refusals
- 📚 **Documentación ampliada**: [CHANGELOG-v0.6.0.md](./CHANGELOG-v0.6.0.md) con detalles completos
- 📚 **Nuevos archivos**: `CORS-FIX.md`, `API-KEYS-SETUP.md` con guías paso a paso

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
