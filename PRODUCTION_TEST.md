# Test de Producción Local

Este script permite probar la configuración de producción localmente antes de deployar.

## Pasos

### 1. Build del Frontend
```bash
npm run build
```

### 2. Configurar Variables de Entorno

Crear `server/.env.local` con:
```bash
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=d4buildsbd
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=test_secret_key_local
JWT_EXPIRES_IN=7d
AUTO_MIGRATE=false
```

### 3. Iniciar Servidor en Modo Producción

```bash
cd server
NODE_ENV=production node index.js
```

### 4. Probar Endpoints

#### Health Check
```bash
curl http://localhost:3001/health
```
Esperado: `{"status":"OK","version":"0.7.1"}`

#### Frontend (debe servir index.html)
```bash
curl http://localhost:3001/
```
Esperado: HTML del frontend

#### API Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@d4builds.com","password":"admin123"}'
```
Esperado: JSON con token o error 401

#### Ruta API inexistente (debe devolver 404 JSON)
```bash
curl http://localhost:3001/api/nonexistent
```
Esperado: `{"error":true,"message":"Ruta no encontrada: GET /api/nonexistent"}`

### 5. Verificar Logs

Deberías ver en la consola:
```
📦 Sirviendo frontend desde: /path/to/dist
📡 GET /health
📡 POST /api/auth/login
⚠️  Ruta API no encontrada: GET /api/nonexistent
```

## Problemas Comunes

### Error: "Cannot find module"
- Asegúrate de haber ejecutado `cd server && npm install`

### Error: "dist not found"
- Ejecuta `npm run build` desde la raíz del proyecto

### Error: "Database connection failed"
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en `.env.local`

### Frontend muestra 404
- Verifica que `dist/` existe y tiene archivos
- Verifica que `NODE_ENV=production` esté configurado

### API devuelve HTML en lugar de JSON
- Asegúrate de que las rutas API estén ANTES del middleware de archivos estáticos
- Verifica el orden de middlewares en `server/index.js`
