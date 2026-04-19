# 🚀 Checklist de Despliegue a Producción - D4Builds v0.7.1

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

# CORS (reemplaza con tu dominio real)
CORS_ORIGIN=https://d4builds.com,https://www.d4builds.com
NODE_ENV=production

# Puerto
PORT=3001
```

---

## 🌐 Paso 3: Ejecutar Migraciones en Producción

Desde el panel de tu servicio o usando SSH:

```bash
# Conectar a tu servidor
cd /app  # o donde esté tu código

# Ejecutar migraciones
npm run migrate

# Verificar que las tablas se crearon
# (esto se puede hacer desde el dashboard de tu servicio de DB)
```

---

## 👤 Paso 4: Crear Usuario Administrador Inicial

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

## 🎨 Paso 5: Configurar Frontend para Producción

### En tu servicio de frontend (Vercel, Netlify, etc.):

**Variables de entorno del frontend:**
```bash
# NO necesitas estas en el frontend
# El API URL se detecta automáticamente en ApiService.ts
```

**Verificar que el código detecte la URL correcta:**
El archivo `src/services/ApiService.ts` ya tiene detección automática:
- En localhost: `http://localhost:3001/api`
- En producción: `https://tu-backend.com:3001/api`

---

## ✅ Paso 6: Verificación Final

### Checklist de verificación:
- [ ] Base de datos creada y accesible
- [ ] Migraciones ejecutadas (3 tablas: users, subscriptions, billing_usage)
- [ ] Usuario admin creado
- [ ] Backend desplegado y respondiendo en /health
- [ ] Frontend desplegado
- [ ] Login funciona con admin@d4builds.com / admin123
- [ ] CORS configurado correctamente
- [ ] Cambiar contraseña del admin

### Comandos de verificación:

```bash
# Verificar health del backend
curl https://tu-backend.com:3001/health

# Debería retornar:
# {"status":"OK","version":"0.7.1"}

# Probar login
curl -X POST https://tu-backend.com:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@d4builds.com","password":"admin123"}'
```

---

## 🔒 Paso 7: Seguridad Post-Despliegue

- [ ] Cambiar password de admin@d4builds.com
- [ ] Verificar que JWT_SECRET sea diferente al de desarrollo
- [ ] Confirmar que CORS_ORIGIN solo incluya tu dominio de producción
- [ ] Habilitar HTTPS en tu dominio
- [ ] Configurar backups automáticos de la base de datos
- [ ] Monitorear logs de errores

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
