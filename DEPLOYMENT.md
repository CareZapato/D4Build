# 🚀 Checklist de Despliegue a Producción - D4Builds v0.7.1

> ✅ **Errores de TypeScript resueltos**: Los errores de compilación en AdminUsers.tsx y otros archivos han sido solucionados ajustando `tsconfig.json` y el script de build. Ver [BUILD_GUIDE.md](BUILD_GUIDE.md) para detalles.

---

## 🏗️ Arquitectura de Deployment

D4Builds usa una arquitectura **fullstack en un solo servicio**:

```
┌─────────────────────────────────────────┐
│  Render Web Service                     │
│  https://d4build.onrender.com           │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Express Backend (puerto 10000)│    │
│  │  - API en /api/*               │    │
│  │  - Sirve frontend en /*        │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Frontend (dist/)              │    │
│  │  - React SPA                   │    │
│  │  - Detecta API automáticamente │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
          ⬇
┌─────────────────────────────────────────┐
│  PostgreSQL Database (separado)         │
│  prod-postgres-d4build                  │
└─────────────────────────────────────────┘
```

**Ventajas:**
- ✅ Un solo servicio (más económico)
- ✅ No hay problemas de CORS
- ✅ URL única: `https://d4build.onrender.com`
- ✅ Backend sirve frontend automáticamente

---

## 📋 Paso 1: Configuración de Base de Datos PostgreSQL

### Valores a usar en el formulario:
- [x] **Name**: `prod-postgres-d4build`
- [x] **Database**: `d4buildsbd`
- [x] **User**: `d4builds_admin` ⚠️ NO USAR "postgres"
- [x] **Region**: Oregon (US West)
- [x] **PostgreSQL Version**: 18

### Después de crear la base de datos:
- [ ] Copiar el **Internal Database URL** (formato: postgres://...)
- [ ] Copiar el **External Database URL** (para conexiones externas)
- [ ] Guardar las credenciales en un lugar seguro

---

## 🔐 Paso 2: Variables de Entorno del Backend

Configura estas variables en tu servicio de hosting (Render, Railway, etc.):

```bash
# Base de datos (usa la URL que te proporcione tu servicio)
DATABASE_URL=postgresql://d4builds_admin:PASSWORD@host:5432/d4buildsbd
# O individualmente:
DB_HOST=<hostname-generado>
DB_PORT=5432
DB_NAME=d4buildsbd
DB_USER=d4builds_admin
DB_PASSWORD=<password-generado>

# JWT (usa la clave generada abajo)
JWT_SECRET=8ZyKTmCSGhyQCv/lNx6mnGdYOoTYUsrNWkkwKBvrj4E=
JWT_EXPIRES_IN=7d

# CORS - NO ES NECESARIO en arquitectura de un solo servicio
# El backend sirve el frontend, por lo que no hay CORS
NODE_ENV=production

# Puerto - Render lo asigna automáticamente via PORT env var
# No es necesario configurarlo manualmente
```

---

## 🌐 Paso 3: Configurar Web Service en Render

### Crear nuevo Web Service:

1. **Dashboard de Render** → New → Web Service
2. **Conectar repositorio**: GitHub → CareZapato/D4Build

3. **Configuración del servicio**:
```yaml
Name: d4build
Region: Oregon (US West)
Branch: main
Root Directory: (dejar vacío - usa raíz del repo)

# Build Command - IMPORTANTE: construye frontend Y prepara backend
Build Command: npm install && npm run build && cd server && npm install

# Start Command - inicia el servidor Express
Start Command: cd server && node index.js

# Environment
NODE_VERSION: 20
```

4. **Variables de entorno** (desde Paso 2):
   - Clic en "Advanced" → "Add Environment Variable"
   - Agregar todas las variables del Paso 2

5. **Deploy automático**:
   - ✅ Auto-Deploy: Yes
   - Esto re-deployará cada vez que hagas push a `main`

### ⚠️ IMPORTANTE: Orden de Comandos

El build command debe:
1. `npm install` - Instalar dependencias del frontend (incluye vite)
2. `npm run build` - Construir frontend → crea carpeta `dist/`
3. `cd server && npm install` - Instalar dependencias del backend

El start command:
1. `cd server && node index.js` - Inicia Express que:
   - Sirve API en `/api/*`
   - Sirve frontend (dist/) en `/*`

---

## 🔧 Paso 4: Ejecutar Migraciones en Producción

Desde el panel de tu servicio o usando SSH:

## 🔧 Paso 4: Ejecutar Migraciones en Producción

Hay dos formas de ejecutar las migraciones:

### Opción A: Auto-Migración (Recomendada)

Agregar variable de entorno en Render:
```bash
AUTO_MIGRATE=true
```

El servidor ejecutará automáticamente las migraciones al iniciar.

### Opción B: Manual via Shell

Desde el panel de Render:
1. **Shell** → Abrir shell
2. Ejecutar:

```bash
cd server
npm run migrate
```

Verificarás que se crearon las tablas:
- ✅ users
- ✅ subscriptions  
- ✅ billing_usage

---

## 👤 Paso 5: Crear Usuario Administrador Inicial

```bash
# En el servidor de producción
cd server
node check-admin.js
```

Esto creará el usuario admin con:
- **Email**: admin@d4builds.com
- **Password**: admin123
- **Account Type**: Premium
- **Balance**: $100

⚠️ **IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer login.

---

## ✅ Paso 6: Verificación Final

### URL de acceso:
Tu aplicación estará disponible en:
```
https://d4build.onrender.com
```

### Checklist de verificación:
- [ ] Base de datos creada y accesible
- [ ] Migraciones ejecutadas (3 tablas: users, subscriptions, billing_usage)
- [ ] Usuario admin creado
- [ ] Backend desplegado y respondiendo en /health
- [ ] Frontend carga correctamente
- [ ] Login funciona con admin@d4builds.com / admin123
- [ ] Las llamadas a API funcionan (no hay errores de CORS)
- [ ] Cambiar contraseña del admin

### Comandos de verificación:

```bash
# Verificar health del backend
curl https://d4build.onrender.com/health

# Debería retornar:
# {"status":"OK","version":"0.7.1"}

# Probar login
curl -X POST https://d4build.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@d4builds.com","password":"admin123"}'
```

---

## 🔒 Paso 7: Seguridad Post-Despliegue

- [ ] Cambiar password de admin@d4builds.com
- [ ] Verificar que JWT_SECRET sea diferente al de desarrollo
- [ ] Confirmar que NODE_ENV=production esté configurado
- [ ] Habilitar HTTPS (Render lo proporciona automáticamente)
- [ ] Configurar backups automáticos de la base de datos
- [ ] Monitorear logs de errores en Render dashboard
- [ ] Considerar agregar dominio personalizado

---

## 📊 Estructura de la Base de Datos

Tu aplicación creará estas tablas:

1. **users** (12 columnas)
   - Usuarios del sistema
   - Información de suscripciones
   - Balance de créditos Premium

2. **subscriptions** (9 columnas)
   - Planes de suscripción (1 mes, 6 meses, 1 año)
   - Fechas de inicio y expiración
   - Auto-renovación

3. **billing_usage** (14 columnas)
   - Registro de uso de APIs de IA
   - Costos por consulta
   - Tokens consumidos

4. **user_billing_summary** (vista)
   - Resumen de uso por usuario

---

## 🆘 Solución de Problemas

### Error: "user must not be one of the following values: postgres"
**Solución**: Usa `d4builds_admin` como nombre de usuario

### Error: CORS bloqueando requests
**Solución**: Verifica que CORS_ORIGIN incluya tu dominio exacto (con https://)

### Error: Cannot connect to database
**Solución**: Verifica que las credenciales de DB_HOST, DB_USER, DB_PASSWORD sean correctas

### Error: Migraciones fallan
**Solución**: Asegúrate de tener PostgreSQL 14 o superior (versión 18 está bien)

---

## 📞 Siguiente Paso

Una vez completada la configuración, el primer deploy automáticamente:
1. Se conectará a la base de datos
2. Verificará las tablas existentes
3. Iniciará el servidor en el puerto 3001
4. Estará listo para recibir requests del frontend

¡Buena suerte con el despliegue! 🚀
