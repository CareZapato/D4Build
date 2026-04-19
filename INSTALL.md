# 🚀 Guía de Instalación y Configuración - D4Builds v0.7.0

Esta guía te ayudará a configurar y ejecutar D4Builds en tu entorno local o en producción.

## 📋 Requisitos Previos

- **Node.js** v18 o superior
- **PostgreSQL** v14 o superior
- **npm** v9 o superior

## 🔧 Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/d4builds.git
cd d4builds
```

### 2. Instalar dependencias (Frontend + Backend)

```bash
npm run setup
```

Este comando instalará las dependencias tanto del cliente como del servidor.

### 3. Configurar variables de entorno

#### Frontend (.env en raíz)

```bash
cp .env.example .env
```

Edita `.env` y configura:
- `VITE_OPENAI_API_KEY`: Tu API key de OpenAI
- `VITE_API_URL`: URL del backend (por defecto: http://localhost:3001/api)

#### Backend (server/.env)

```bash
cd server
cp .env.example .env
```

Edita `server/.env` y configura:
- `DB_PASSWORD`: Contraseña de PostgreSQL
- `JWT_SECRET`: Secret para tokens JWT (genera uno seguro)
- `CORS_ORIGIN`: Orígenes permitidos (puedes usar múltiples separados por comas)

### 4. Crear la base de datos

Abre PostgreSQL y ejecuta:

```sql
CREATE DATABASE d4buildsbd;
```

### 5. Ejecutar migraciones (Opcional)

Si `AUTO_MIGRATE=true` en `server/.env`, las tablas se crearán automáticamente al iniciar el servidor.

Si prefieres ejecutarlas manualmente:

```bash
npm run migrate
```

### 6. Iniciar la aplicación

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto iniciará **simultáneamente**:
- 🎨 **Frontend** en http://localhost:5173
- ⚙️ **Backend** en http://localhost:3001

## 🌐 Configuración para Producción

### Variables de entorno importantes

#### Frontend

```env
VITE_API_URL=https://api.tu-dominio.com/api
# O si usas IP:
VITE_API_URL=http://192.168.1.100:3001/api
```

#### Backend

```env
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com,http://192.168.1.100:5173
JWT_SECRET=un_secret_muy_seguro_de_64_caracteres_minimo_generado_aleatoriamente
AUTO_MIGRATE=true
```

### CORS Dinámico

El backend soporta **múltiples orígenes** para CORS:

```env
# Un solo origen
CORS_ORIGIN=http://localhost:5173

# Múltiples orígenes (separados por comas)
CORS_ORIGIN=http://localhost:5173,http://192.168.1.100:5173,https://d4builds.com

# Permitir todos (NO RECOMENDADO en producción)
CORS_ORIGIN=*
```

### Auto-migración de Base de Datos

Con `AUTO_MIGRATE=true`, el servidor:
1. ✅ Verifica la conexión a PostgreSQL al iniciar
2. 🔍 Detecta si las tablas existen
3. 🔄 Ejecuta migraciones automáticamente si faltan tablas
4. 📊 Muestra un resumen de las tablas creadas

Esto es útil para:
- **Desarrollo**: No preocuparse por el estado de la BD
- **Producción**: Recrear tablas después de borrados accidentales
- **CI/CD**: Configurar la BD automáticamente en cada deploy

## 🔑 Gestión de API Keys

### OpenAI

1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Cópiala en `.env` como `VITE_OPENAI_API_KEY`

### JWT Secret (Producción)

Genera un secret seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cópialo en `server/.env` como `JWT_SECRET`.

## 📦 Scripts Disponibles

### Raíz del proyecto

```bash
npm run dev           # Inicia frontend + backend simultáneamente
npm run setup         # Instala todas las dependencias
npm run migrate       # Ejecuta migraciones manualmente
npm run build         # Construye el frontend para producción
npm run build:server  # Instala dependencias del backend
```

### Frontend (desde raíz)

```bash
npm run dev:client    # Solo frontend
npm run build         # Construir para producción
npm run preview       # Vista previa de build
```

### Backend (desde server/)

```bash
cd server
npm run dev           # Servidor en modo desarrollo (nodemon)
npm start             # Servidor en modo producción
npm run migrate       # Ejecutar migraciones
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

- Verifica que PostgreSQL esté corriendo
- Revisa las credenciales en `server/.env`
- Asegúrate de que la base de datos `d4buildsbd` existe

### Error: "CORS policy blocked"

- Agrega el origen del frontend a `CORS_ORIGIN` en `server/.env`
- Formato: `http://localhost:5173` o `http://192.168.1.100:5173`

### Error: "JWT malformed"

- El token en localStorage puede estar corrupto
- Limpia el localStorage: `localStorage.clear()` en la consola del navegador
- Vuelve a hacer login

### Tablas no se crean automáticamente

- Verifica que `AUTO_MIGRATE=true` en `server/.env`
- Ejecuta manualmente: `npm run migrate`
- Revisa los logs del servidor para ver errores

## 📞 Soporte

Si encuentras problemas, abre un issue en GitHub o contacta al equipo de desarrollo.

---

**v0.7.0** - © 2026 D4Builds by Zapato
