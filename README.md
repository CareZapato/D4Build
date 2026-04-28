# D4 Builds - Gestor de Builds para Diablo 4

[![Version](https://img.shields.io/badge/version-0.8.9-gold.svg)](https://github.com/CareZapato/D4Build)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-green.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

Una aplicación web moderna y reactiva full-stack para gestionar y optimizar tus builds de Diablo 4 con **integración de IA**, **sistema de autenticación**, **suscripciones Premium** y **testing de integridad**.

## ✨ Características Principales

### 💎 Sistema de Glifos Mejorado (v0.8.8 - NUEVO)
- 🔢 **Nivel Máximo 150**: Actualizado para Temporada 7 de Diablo 4
- ⚙️ **Constante Configurable**: `MAX_GLYPH_LEVEL` en configuración para ajustes futuros
- 🎯 **Separación de Datos**: 
  - **Héroe**: Guarda catálogo completo (nombre, descripción, efectos) sin niveles
  - **Personaje**: Guarda solo referencias `{id, nivel_actual, nivel_maximo}` específicas del build
- 📋 **Metadata Estandarizada**: Incluye `personajeId`, `personajeNombre`, `personajeNivel` en todos los imports
- 🔄 **Importación Mejorada**: Elimina `nivel_actual` al guardar en catálogo de héroe
- 📊 **Auto-refresh**: Los cambios se reflejan automáticamente en la UI después de importar

### 🧪 Testing de Integridad (v0.8.4)
- 🔬 **Panel Premium/Admin**: Sección exclusiva en perfil de usuario
- 🗂️ **Workspace Temporal**: Crea carpeta `Tests/` sin afectar workspace actual
- 📊 **Validación Automática**: Ejecuta TODOS los JSONs guardados en galería
- 🎯 **18 Categorías Validadas**: Skills, glifos, aspectos, paragon, runas, gemas, mundo, talismanes, mecánicas, build, stats
- 📈 **Métricas Detalladas**: Tasa de éxito, elementos guardados, tiempo de ejecución
- 🔍 **Análisis por Categoría**: Desglose completo con tests pasados/fallidos
- 📋 **Reporte Interactivo**: Gráficos, tests fallidos expandibles, problemas críticos
- 🤖 **Prompt para IA**: Genera diagnóstico completo copiable para Claude/GPT
- 💾 **Exportación**: Descarga reporte completo en JSON
- ⚡ **Progreso en Tiempo Real**: Barra de progreso con detalles de archivo actual
- 🎨 **UI Profesional**: Cards con métricas, gráficos de distribución, alertas destacadas

### 💳 Sistema de Suscripciones (v0.7.1)
- 📅 **Planes Flexibles**: 1 mes ($5), 6 meses ($25), 1 año ($45)
- 💰 **Créditos para IA**: 80% del pago se convierte en créditos ($4 de cada $5)
- 📋 **Tabla subscriptions**: Historial completo de suscripciones con fechas y estado
- ⏰ **Control de expiración**: Alertas cuando tu suscripción está próxima a vencer
- 🔄 **Extensión de plan**: Renueva o extiende antes de que expire
- 🎯 **Descuentos por volumen**: Planes largos incluyen más créditos (ahorra hasta 25%)
- 📊 **Balance dinámico**: Sistema premium_balance que se recarga al contratar

### 👤 Perfil de Usuario (v0.7.1)
- ⚙️ **Gestión completa**: Edita username, email, cambia contraseña
- 📊 **Análisis de uso**: Estadísticas detalladas por semana, mes y año
- 💳 **Historial de gastos**: Lista paginada de todas las consultas de IA con costos
- 👑 **Info de suscripción**: Estado, plan actual, fechas de inicio/fin, renovación
- 💵 **Vista de créditos**: Balance actual, total usado, consumo por período
- 🚨 **Alertas inteligentes**: Notificaciones de expiración y saldo bajo
- 🔒 **Seguridad**: Cambio de contraseña con validación de contraseña actual
- 🧪 **Testing Premium**: Tab exclusivo para integrity testing (Premium/Admin)

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

### 🧪 Sistema de Testing para Administradores (v0.8.3 - COBERTURA COMPLETA)
- **54+ Tests Automatizados**: Validación exhaustiva de TODOS los casos de importación (héroe vs personaje, todas las subcategorías)
- **14 Suites de Prueba**: Estadísticas (4), Habilidades (6), Glifos (5), Aspectos (4), Mundo (6), Talismanes (7), **Héroe vs Personaje (6 NUEVO)**, **Paragon (4 NUEVO)**, **Runas/Gemas (3 NUEVO)**, **Build (2 NUEVO)**, **Mecánicas (2 NUEVO)**, Prompts (8), Relaciones, Imágenes
- **Panel Visual**: Interfaz interactiva con ejecución en tiempo real y resultados detallados
- **🆕 Tests Héroe vs Personaje**: Valida diferencia entre importar para HÉROE (objetos completos) vs PERSONAJE (solo refs con IDs):
  - Habilidades: Héroe guarda descripción, modificadores completos | Personaje solo IDs
  - Glifos: Héroe guarda efecto_base, bonificaciones | Personaje solo id + nivel_actual
  - Aspectos: Prompts diferentes (catálogo héroe vs equipados personaje)
  - Mundo: Prompts diferentes (eventos vs mazmorras)
- **🆕 Tests Paragon**: 3 prompts diferenciados (tableros, nodos, atributos) para héroe y personaje
- **🆕 Tests Runas/Gemas**: Valida importación al catálogo global con prompts separados
- **🆕 Tests Build/Equipamiento**: Valida piezas, engarces, gemas, aspectos equipados
- **🆕 Tests Mecánicas**: Valida mecánicas de clase (recursos secundarios, bonificaciones)
- **Tests de Mundo**: Valida estructura de eventos, requisitos con id_recurso, recompensas con probabilidad/garantizado, tipos de eventos (guarida/susurro/calabozo/legion/reserva), tiempo (expira_en/cooldown), dificultad y repetibilidad
- **Tests de Talismanes**: Valida estructura de charms, rarezas (rare/unique/set), stats con nombre/valor/rango, efectos con tipos (pasivo/condicion/proc/stacking), sets con bonos progresivos, Horadric Seal con slots/stats/bonus/reglas.tipo
- **Tests de Prompts**: Valida que los prompts de IA incluyen TODOS los campos del JSON esperado
- **🔍 Simulación Real**: Tests orientados a replicar exactamente el paso a paso del usuario (captura imagen → sube → genera prompt → valida campos → envía a IA → guarda)
- **📝 Diagnóstico Avanzado**: Console logs con ✓/✗ identifican campos faltantes y muestran problema/solución detallado
- **✅ Prompts Corregidos**: Incluyen nivel_paragon en estadísticas y tipos de reglas en Horadric Seal
- **🎯 Cobertura Completa**: 18 casos de importación validados (todos los prompts, todos los destinos: héroe/personaje/workspace)
- **Solo Admin**: Acceso restringido mediante sistema de roles (isAdmin())
- **Panel Unificado**: Tabs para "Gestión de Usuarios" y "Testing & Validación"

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

## 🌐 Deployment a Producción

D4Builds está optimizado para deployment en **Render** (o cualquier plataforma similar) con una arquitectura fullstack donde el servidor Express sirve tanto la API como el frontend.

### 📦 Arquitectura Fullstack

```
┌─────────────────────────────────────┐
│   https://d4build.onrender.com      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Express Server (Node.js)   │  │
│  │                              │  │
│  │  📁 Sirve dist/ (frontend)  │  │
│  │  📡 API Routes (/api/*)     │  │
│  │  🔗 PostgreSQL Connection   │  │
│  └──────────────────────────────┘  │
│                                     │
│  Frontend: index.html + assets      │
│  Backend:  /api/auth, /api/users   │
│  Database: PostgreSQL (Oregon)      │
└─────────────────────────────────────┘
```

### 🚀 Deploy en Render (Recomendado)

#### 1. Requisitos Previos
- Cuenta en [Render](https://render.com)
- Repositorio GitHub con el código
- Base de datos PostgreSQL (Render ofrece planes gratuitos)

#### 2. Crear Base de Datos PostgreSQL
```bash
# En Render Dashboard:
New → PostgreSQL
- Name: d4buildsbd
- Database: d4buildsbd
- User: d4builds_admin
- Region: Oregon (US West)
- Plan: Free o Starter
```

Anota las credenciales:
- `DB_HOST`: External Database URL
- `DB_PORT`: 5432
- `DB_NAME`: d4buildsbd
- `DB_USER`: d4builds_admin
- `DB_PASSWORD`: [generado automáticamente]

#### 3. Crear Web Service

```bash
# En Render Dashboard:
New → Web Service
- Connect Repository: GitHub (tu repo)
- Name: d4build
- Region: Oregon (mismo que DB)
- Branch: main
- Root Directory: .
- Runtime: Node
- Build Command: npm ci && npm run build && cd server && npm install
- Start Command: npm start
```

#### 4. Variables de Entorno

Configura en Render Dashboard → Environment:

```bash
# Base de Datos (CRÍTICO)
DB_HOST=<external_database_url>      # Desde PostgreSQL dashboard
DB_PORT=5432
DB_NAME=d4buildsbd
DB_USER=d4builds_admin
DB_PASSWORD=<tu_password>

# Autenticación (CRÍTICO)
JWT_SECRET=<genera_string_aleatorio_64_chars>
JWT_EXPIRES_IN=7d

# Node Environment (CRÍTICO)
NODE_ENV=production
NODE_VERSION=20

# Auto-Migración (RECOMENDADO)
AUTO_MIGRATE=true                    # Crea tablas automáticamente

# APIs de IA (OPCIONAL)
VITE_OPENAI_API_KEY=sk-proj-...     # OpenAI GPT-4o
VITE_GEMINI_API_KEY=...             # Google Gemini

# Billing Panel (OPCIONAL)
VITE_ENABLE_BILLING_PANEL=false     # true=mostrar | false=ocultar

# CORS (NO NECESARIO)
# CORS_ORIGIN no se configura en fullstack - se permite same-origin automáticamente
```

#### 5. Deploy

1. Click **"Manual Deploy"** o espera auto-deploy desde Git
2. Render ejecutará:
   - **Build**: `npm ci && npm run build && cd server && npm install`
   - **Start**: `npm start` → `cd server && node index.js`
3. Verifica logs:
   ```
   ✅ Conectado a PostgreSQL
   ✅ Migraciones automáticas completadas
   ✅ SERVIDOR INICIADO
   🌐 URLs de acceso:
      • Local:    http://localhost:10000
      • API:      http://localhost:10000/api
      • Health:   http://localhost:10000/health
   ```

#### 6. Verificar Deployment

```bash
# Health check
curl https://d4build.onrender.com/health

# Login test
curl -X POST https://d4build.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@d4builds.com","password":"admin123"}'
```

### 🔧 Configuración Avanzada

#### PostgreSQL con SSL

El servidor detecta automáticamente producción y habilita SSL:

```javascript
// server/config/database.js
ssl: process.env.NODE_ENV === 'production' 
  ? { rejectUnauthorized: false } 
  : false
```

#### CORS Dinámico

En producción (fullstack), CORS permite same-origin automáticamente:

```javascript
// No necesitas configurar CORS_ORIGIN si frontend y backend están en el mismo dominio
// Render sirve todo desde https://d4build.onrender.com
```

#### Middleware Ordering

El servidor sigue este orden crítico:

1. **CORS** + express.json
2. **Logging** (solo producción)
3. **API Routes** (/api/*)
4. **404 Handler** para API
5. **Static Files** (dist/)
6. **Catch-All** (index.html para SPA)

### 📊 Monitoreo y Logs

#### Render Dashboard
- **Logs**: Ver en tiempo real todas las requests
- **Metrics**: CPU, memoria, requests/sec
- **Events**: Deploy history, crashes, restarts

#### Logs Exhaustivos

El servidor loggea automáticamente en producción:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 [2026-04-19T14:07:38.123Z] POST /api/auth/login
   Origin: https://d4build.onrender.com
   Host: d4build.onrender.com
   Content-Type: application/json
   User-Agent: Mozilla/5.0...
   Body: {"email":"admin@d4builds.com","password":"***"}
   ✅ Response: 200 OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 🐛 Troubleshooting

#### Error: "SSL/TLS required"
✅ **Solución**: Ya configurado automáticamente en `server/config/database.js`

#### Error: "relation 'users' does not exist"
✅ **Solución**: Configura `AUTO_MIGRATE=true` en variables de entorno

#### Error: "404 Not Found" en API
✅ **Solución**: Verifica que Start Command sea `npm start` (NO `npm run preview`)

#### Error: "vite: not found" en build
✅ **Solución**: Ya resuelto - vite está en `dependencies` (no devDependencies)

Para más detalles, consulta:
- 📘 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guía completa de deployment
- 📘 **[BUILD_GUIDE.md](BUILD_GUIDE.md)** - Guía de build y troubleshooting
- 📘 **[PRODUCTION_TEST.md](PRODUCTION_TEST.md)** - Checklist de testing en producción

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

**🔍 Jerarquía Visual (v0.8.9):**
Las imágenes de habilidades siguen una estructura jerárquica basada en iconos:
1. **UNA habilidad ACTIVA** (con "Rango X/Y")
2. **MODIFICADORES** (mismo icono que la activa, puede variar color/tonalidad)
3. **PASIVAS** (iconos completamente diferentes)

Los modificadores se almacenan dentro del array `modificadores` de su habilidad activa.

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
- `BUILD_GUIDE.md` - Guía de build y configuración TypeScript para producción
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
1. [BUILD_GUIDE.md](BUILD_GUIDE.md) - Solución de errores de TypeScript en build
2. [DEPLOYMENT.md](DEPLOYMENT.md) - Guía completa de despliegue
3. Logs del servidor (`nodemon` o servicio de hosting)
4. Configuración de variables de entorno
5. Estado de las migraciones (`npm run migrate`)

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

### v0.8.4 (24 de Abril, 2026)
**🧪 Testing de Integridad Premium**
- 🔬 **IntegrityTestService**: Servicio completo para validación automática de JSONs
- 🗂️ **Workspace Temporal**: Crea carpeta `Tests/test_run_{timestamp}/` sin afectar workspace actual
- 📊 **Validación de 18 Categorías**: Skills, glifos, aspectos, estadísticas, paragon, runas, gemas, mundo, talismanes, mecánicas, build
- 🎯 **Tests por Estructura**: Validadores específicos para cada tipo de JSON (habilidades activas/pasivas, glifos con rareza, aspectos con categoría, etc.)
- 📈 **Métricas Detalladas**: 
  - Tasa de éxito global (% tests pasados)
  - Elementos esperados vs guardados
  - Tests fallidos por categoría
  - Tiempo promedio de ejecución
  - Desglose completo por categoría
- 📋 **ProfileTestingSection**: Tab Premium/Admin en perfil de usuario
- 🎨 **UI Profesional**: 
  - Cards con métricas principales (éxito, tests, elementos, tiempo)
  - Gráfico de barra visual (tests exitosos vs fallidos)
  - Lista colapsable de tests fallidos con detalles
  - Categorías expandibles con archivos individuales
- ⚡ **Progreso en Tiempo Real**: Barra de progreso con nombre de archivo actual y porcentaje
- 🔍 **Análisis Inteligente**:
  - Detecta problemas críticos (archivos sin elementos guardados, errores de parsing, categorías rotas)
  - Genera recomendaciones automáticas (revisar prompts, optimizar validaciones, corregir JSONs)
  - Identifica categorías problemáticas con alta tasa de fallo
- 🤖 **Prompt Diagnóstico para IA**: Genera reporte completo formateado para compartir con Claude/GPT/Gemini:
  - Resumen ejecutivo con estado general
  - Métricas clave por categoría
  - Problemas críticos destacados
  - Recomendaciones priorizadas
  - Tests fallidos con errores detallados
  - Preguntas específicas para IA
- 💾 **Exportación**: Botón para descargar reporte completo en JSON (`integrity_report_{id}.json`)
- 📋 **Copiar Prompt**: Un click para copiar diagnóstico completo al portapapeles
- 🎯 **Badge Premium**: Tab de testing muestra badge "Premium" en navegación de perfil
- 🔐 **Control de Acceso**: Solo visible para usuarios con `isPremium()` o `isAdmin()`
- 📚 **ImageService.readJSON()**: Nuevo método para leer contenido de JSONs directamente
- 🏗️ **Tipos Nuevos**: 
  - `IntegrityTestResult`: Resultado individual con éxito, elementos, errores, tiempo
  - `IntegrityTestMetrics`: Métricas agregadas con totales y desglose por categoría
  - `IntegrityTestProgress`: Estado de progreso con porcentaje y mensaje
  - `FileDifference`: Comparación entre archivos (preparado para futuras mejoras)
  - `IntegrityReport`: Reporte completo con métricas, resultados, prompt diagnóstico

### v0.8.3 (24 de Abril, 2026)
**🧪 Testing Completo + 💎 Runas/Gemas + 🗺️ Validación de Mundo/Talismanes**
- 🧪 **Sistema de Testing Mejorado**: 37+ tests automatizados en 9 suites con métricas en tiempo real
- 🗺️ **Tests de Mundo (6 tests NUEVOS)**: Valida estructura de eventos, requisitos con id_recurso, recompensas con probabilidad/garantizado, tipos de eventos (guarida/susurro/calabozo/etc), estructura de tiempo (expira_en/cooldown), dificultad y repetibilidad
- 🧿 **Tests de Talismanes (7 tests NUEVOS)**: Valida estructura de charms, rarezas (rare/unique/set), stats con valores y rangos, efectos con tipos (pasivo/condicion/proc/stacking), sets con piezas y bonos progresivos, talismanes unique sin set, Horadric Seal con slots/reglas
- 📊 **Mock Data Completo**: Datos de prueba realistas para mundo (eventos Duriel/Susurros con requisitos/recompensas/id_recurso), talismanes (charms set/unique con stats/efectos), Horadric Seal (slots/stats/bonus/reglas)
- 🔍 **Validación de Prompts Ampliada**: 8 tests de prompts incluyendo mundo y talismanes - verifica que generateWorldEventsPrompt() incluye todos los campos (eventos, objetivo, requisitos con id_recurso, recompensas con probabilidad/garantizado, tiempo, dificultad, repetible, tipos de eventos)
- ✅ **Validación de Prompts de Talismanes**: Verifica que generateCharmsPrompt() incluye rarezas (rare/unique/set), efectos con tipos (pasivo/condicion/proc/stacking), sets con piezas_requeridas, y generateHoradricSealPrompt() incluye slots/reglas con tipos
- 📈 **AdminTesting Component**: Panel visual muestra 9 suites, estadísticas globales actualizadas, 37+ tests ejecutables
- 🔗 **Test de Relaciones**: Verifica integridad entre personajes y héroes (referencias válidas)
- 🖼️ **Simulación de Imágenes**: Tests de almacenamiento, formato de archivos, estructura de carpetas
- 🛡️ **Panel Admin Unificado**: Tabs para "Gestión de Usuarios" y "Testing & Validación" (solo administradores)
- 💎 **Sistema de Runas/Gemas**: RunesGemsSection con catálogo completo, búsqueda, clasificación por color/tipo
- 📋 **Visualización por Tabs**: Separación entre Runas y Gemas con tarjetas colapsables
- 🎨 **Clasificación Visual**: Gemas por color (Rubí, Zafiro, Esmeralda, etc.), Runas por tipo (Invocación/Ritual)
- ⚡ **Efectos por Slot**: Gemas muestran efectos diferentes según slot (Arma, Armadura, Joyas)
- 🔄 **Scroll Infinito**: Carga inicial de 80 items con botón "Cargar más" para optimizar rendimiento
- 🔗 **Integración con Personajes**: Campo runas_refs para guardar runas equipadas (máx 4: 2 invocación, 2 ritual)
- 🤖 **Extracción IA Mejorada**: ImageCaptureModal incluye categoría "Runas/Gemas" con selector de tipo
- 📚 **Documentación Actualizada**: README con sección de testing ampliada, changelog detallado

### v0.8.2 (23 de Abril, 2026)
**🎨 Refinamiento Visual**
- ✨ **Botones con gradientes**: Todos los botones en headers con diseño premium (sombras, gradientes de color, efectos hover)
- 🎨 **Paleta por función**: Importar (azul→cyan), Exportar (púrpura→rosa), Análisis (ámbar→amarillo), Crear (verde→esmeralda), Recargar (índigo→violeta)
- 💎 **Sistema de Mundo mejorado**: Botones "Importar" y "Exportar" ahora visibles como botones reales (no texto)
- 🔄 **Consistencia total**: Padding px-4 py-2, text-sm, font-bold, iconos w-4 h-4, scale-105 hover en todos
- ✅ **Páginas actualizadas**: Personajes, Héroes, Prompts, Mundo, Tags, Admin, Gemas/Runas

### v0.8.1 (23 de Abril, 2026)
**🔮 Talismanes + Mejoras UX**
- 🔮 **Talismanes en personajes**: Campo `talismanes_refs`, visualización en resumen, 5% en completitud
- 📅 **Fecha de última actualización**: Campo `ultima_actualizacion` en personajes, formato completo DD/MM/YYYY HH:mm
- 🎨 **Rediseño visual global**: Headers premium con cards de fondo, gradientes, iconos unificados, títulos 3xl
- 📱 **Modal de captura rediseñado**: Carrusel horizontal minimalista, botones con gradientes (Capturar/Galería)
- 🎯 **Consistencia UI**: Mismo formato en todas las páginas, padding p-6, border-2, descripciones incluidas

### v0.8.0 (20 de Abril, 2026)
**🔮 Temporada 13: Talismanes**
- 🧿 **Nueva categoría Talismanes**: Soporte completo para charms y sello horádrico
- 🤖 **Extracción IA mejorada**: Soporte para Gemini y OpenAI GPT-4o con talismanes
- 🎨 **Sistema de rareza**: rare, unique, set con bonos progresivos y efectos especiales
- ⚡ **Tipos de efectos**: Pasivos, condicionales, proc y stacking
- 📦 **Sets completos**: Bonificaciones al equipar múltiples piezas del mismo set

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
