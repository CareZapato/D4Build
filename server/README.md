# ============================================================================
# 🗄️ D4Builds Server - Backend API
# ============================================================================

Backend de autenticación y gestión de usuarios para D4Builds.

## 🚀 Instalación

```bash
cd server
npm install
```

## 🔧 Configuración

1. Crea una base de datos PostgreSQL:
```sql
CREATE DATABASE d4buildsbd;
```

2. Configura las variables de entorno en `.env` (ya está configurado)

3. Ejecuta las migraciones:
```bash
npm run migrate
```

## 📝 Comandos

- `npm run dev` - Servidor en modo desarrollo con nodemon
- `npm start` - Servidor en producción
- `npm run migrate` - Ejecutar migraciones de base de datos

## 🔐 Endpoints API

### Autenticación (`/api/auth`)

- **POST /register** - Registrar nuevo usuario
- **POST /login** - Iniciar sesión
- **GET /verify** - Verificar token JWT

### Usuarios (`/api/users`)

- **GET /profile** - Obtener perfil (requiere auth)
- **PUT /profile** - Actualizar perfil (requiere auth)
- **POST /upgrade-premium** - Upgrade a Premium (requiere auth)

### Billing (`/api/billing`)

- **POST /log** - Registrar uso de API (requiere auth)
- **GET /my-usage** - Obtener historial de uso (requiere auth)
- **GET /stats** - Estadísticas generales (requiere auth)

## 🗄️ Estructura de Base de Datos

### Tabla `users`
- id, username, email, password_hash
- account_type (Basic | Premium)
- is_active, created_at, updated_at

### Tabla `billing_usage`
- id, user_id, provider, model, functionality
- tokens (input/output/total)
- cost (input/output/total)
- category, operation, created_at

## 🔒 Autenticación

Se usa JWT (JSON Web Tokens) con expiración de 7 días.

Header requerido:
```
Authorization: Bearer <token>
```

## 🎯 Puerto

Servidor ejecutándose en: `http://localhost:3001`
