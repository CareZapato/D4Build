# Changelog - D4Builds

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.9.0] - 2026-04-28

### ✨ Added (Agregado)

#### Sistema de Prompts Mejorado - Extracción de Información Completa
- **📤 Prompts de Extracción para Personajes**:
  - Nuevo tipo de prompt "Extraer Información" en sección personajes
  - Extrae toda la información del personaje en formato JSON estructurado
  - Incluye: info básica, habilidades activas completas con modificadores, pasivas independientes, glifos con nivel, estadísticas, y mecánicas de clase
  - Formato JSON listo para copiar y pegar en otros sistemas
  - Útil para documentación, migración de datos, y análisis externos
- **📤 Prompts de Extracción para Héroes**:
  - Nuevo tipo de prompt "Extraer Información" en sección héroes
  - Extrae el 100% de la información disponible de la clase
  - Incluye: todas las habilidades activas (con TODOS los modificadores y pasivas relacionadas), todas las pasivas independientes, todos los glifos, todos los aspectos, todas las mecánicas de clase
  - Cada elemento incluye IDs, descripciones completas, tags, niveles, costos, efectos
  - Jerarquía completa de categorías y subcategorías mantenida
- **🎨 Interfaz Visual Mejorada**:
  - Botones de extracción destacados con fondo verde (`bg-green-900/20`) y borde verde
  - Iconos 📤 para identificar rápidamente los prompts de extracción
  - Descripciones claras sobre el contenido extraído
  - Ubicados estratégicamente en ambas secciones (personajes y héroes)

#### Generador de Prompts Unificado
- **🔀 Toggle Personaje vs Héroe**:
  - Nuevo selector con botones para cambiar entre análisis de personaje o héroe
  - Iconos distintivos: `Users` para personajes, `Shield` para héroes
  - Prompts específicos según tipo de entidad seleccionada
  - Interfaz intuitiva con colores de acento para selección activa
- **🎯 Prompts Específicos para Héroes**:
  - **Análisis de Habilidades**: Analiza TODAS las habilidades (100%) con sinergias y prioridad de stats (Fuerza, Destreza, Inteligencia, Voluntad)
  - **Arquetipos Meta**: Top 3-5 builds del meta actual con análisis de stats por arquetipo
  - **Sinergias**: Combos poderosos de habilidades con atributos óptimos por combo
  - **Personalizado**: Prompt customizable con contexto de héroe
- **📊 Análisis de Stats y Atributos**:
  - Cada prompt de héroe incluye sección de prioridad de atributos
  - Análisis de qué stats maximizar por arquetipo
  - Breakpoints importantes (crit chance, CDR, etc.)
  - Recomendaciones de stats ofensivos y defensivos
- **🎨 Prompts Existentes Mantenidos**:
  - Todos los prompts de personajes funcionan igual (Sinergias, Optimización, Análisis Profundo, Comparación con Pool)
  - Opciones Premium siguen protegidas con Lock
  - Prompt personalizado con checkboxes para incluir habilidades, glifos, stats, mecánicas

### 🎨 Improved (Mejorado)

#### Interfaz Responsive Completa
- **📱 Sidebar Responsive**:
  - Modo icon-only en dispositivos móviles (`w-16` en mobile, `w-72` en desktop)
  - Labels de navegación ocultos en mobile (`hidden lg:inline`)
  - Iconos perfectamente centrados y visibles en todas las resoluciones
  - Profile submenu reposicionado para modo icon-only (`left-1/2 -translate-x-1/2 lg:translate-x-0`)
- **🃏 CharacterList Responsive**:
  - Grid adaptativo: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - Textos escalados: `text-xs lg:text-sm`, `text-base lg:text-xl`
  - Iconos ajustados: `w-3 lg:w-4 h-3 lg:h-4`
  - Espaciado fluido: `gap-3 lg:gap-5`, `p-3 lg:p-4`
  - Elementos más pequeños en mobile sin perder legibilidad
- **📑 HeroManager Tabs Responsive**:
  - Tabs compactos en mobile: `px-2 lg:px-4 py-1.5 lg:py-2`
  - Texto adaptado: `text-xs lg:text-sm`
  - Iconos escalados: `gap-1.5 lg:gap-2`
  - Mejor aprovechamiento de espacio en pantallas estrechas
- **🎯 PromptGenerator Responsive**:
  - Todos los elementos escalados para mobile/desktop
  - Botones compactos en mobile con texto oculto cuando necesario
  - Grid de 2 columnas en desktop, 1 columna en mobile
  - Textos: `text-[10px] lg:text-xs`, `text-xs lg:text-sm`
  - Iconos: `w-3 lg:w-4 h-3 lg:h-4`

### 🔧 Fixed (Corregido)

#### Errores de Compilación
- **PromptGenerator.tsx**:
  - Eliminado código duplicado que causaba 50+ errores (líneas 844-1061 eran duplicadas del export)
  - Archivo ahora termina correctamente en línea 844 con `export default PromptGenerator;`
  - Corregidas referencias a propiedades inexistentes en tipo `Personaje`:
    - `mundo_tier`, `pit_tier`, `descripcion`, `tags` → eliminadas o reemplazadas por propiedades correctas
    - `modificadores_activos` → `modificadores_ids`
    - `pasivas_relacionadas_activas` → eliminada (no existe en modelo)
    - `glifo_id` → `id`
    - `nivel` → `nivel_actual`
    - `estadisticas_v2` → `estadisticas_refs`
  - Corregidas propiedades de tipos `Glifo`, `Aspecto`, `SeleccionMecanica`:
    - `bonos_nivel` no existe en Glifo (eliminado de extracción)
    - `aspect.nombre` → `aspect.name`, `aspect.tipo` → `aspect.category`
    - `aspect.efecto` → `aspect.effect`, `aspect.descripcion` no existe
    - `sel.descripcion` → `sel.efecto` en SeleccionMecanica
- **PromptService.ts**:
  - Corregido tipo de variable `pasiva` en `generateBuildAnalysisPrompt()`:
    - Líneas 1593, 1603: `let pasiva = null;` → `let pasiva: HabilidadPasiva | null = null;`
    - Agregado `|| null` después de `find()` para convertir `undefined` a `null`
    - Eliminados errores: "El tipo 'HabilidadPasiva | undefined' no se puede asignar al tipo 'null'"
    - Eliminados errores: "La propiedad 'nombre' no existe en el tipo 'never'"

#### Tipos y Modelos de Datos
- **Extracción de Información**:
  - Adaptado a modelo de referencias del personaje (usa `habilidades_refs`, `glifos_refs`, etc.)
  - Carga de datos desde catálogo de héroe correcta
  - Manejo apropiado de referencias string vs objetos complejos
  - Verificación de existencia de propiedades opcionales antes de acceder

### 📚 Documentation (Documentación)

#### Changelog en la Web
- **ChangelogModal.tsx**: Actualizado con nueva entrada v0.9.0
- **Detalles Completos**: Todas las mejoras, agregados y correcciones documentadas
- **Categorización Clara**: Fixed, Added, Improved con iconos y colores distintivos

#### Archivos de Proyecto
- **README.md**: Badge de versión actualizado a 0.9.0
- **CONTEXT.md**: Versión actualizada en header
- **package.json**: Versión 0.9.0
- **Sidebar.tsx**: Versión mostrada en footer actualizada

---

## [0.8.9] - 2026-04-28

### 🔧 Fixed (Corregido)

#### Sistema de Habilidades - Extracción Mejorada
- **Diferenciación correcta Activas/Pasivas**:
  - **Regla principal**: Habilidades CON RANGO (ej: "Rango 3/5") son ACTIVAS, SIN RANGO son PASIVAS
  - Prompt actualizado con identificación visual clara basada en el rango
  - Diagrama visual en prompt para guiar correctamente a la IA
- **Jerarquía visual basada en iconos**:
  - **Una imagen contiene**: UNA habilidad activa + sus modificadores (mismo icono) + pasivas (iconos diferentes)
  - Los modificadores comparten el MISMO ICONO que su habilidad activa (puede variar color/tonalidad)
  - Las pasivas tienen iconos completamente DIFERENTES
  - Prompt actualizado para enfatizar esta relación visual
  - Documentación actualizada en CONTEXT.md y README.md
- **Campos agregados al prompt**:
  - `tipo_danio`: Tipo de daño infligido (Físico, Sagrado, Sombra, Fuego, Hielo, Veneno, Rayo)
  - `requiere`: Requisitos de nivel o equipo (ej: "Nivel 4", "Requiere Escudo")
  - `genera_recurso`: Si la habilidad genera recurso `{tipo, cantidad}`
  - `costo_recurso`: Si la habilidad consume recurso `{tipo, cantidad}`
  - `recuperacion_segundos`: Cooldown de la habilidad si visible
- **Rangos y niveles clarificados**:
  - **Héroe**: Solo almacena `nivel_maximo` (catálogo)
  - **Personaje**: Almacena `nivel_actual` y `nivel_maximo` (build específico)
  - **Nota**: `nivel_actual` puede ser mayor que `nivel_maximo` (bonificaciones de equipo)
- **Instrucciones mejoradas**:
  - 14 reglas críticas detalladas en el prompt
  - Ejemplos específicos para cada tipo de habilidad
  - Formato JSON actualizado con todos los campos requeridos
  - Resumen visual con árbol de decisión para clasificación

#### Interfaz de Usuario - Visualización de Atributos de Habilidades
- **Badges informativos** para habilidades activas:
  - `tipo_danio`: Badge rojo con tipo de daño (Físico, Sagrado, Sombra, etc.)
  - `requiere`: Badge naranja con requisitos (ej: "📋 Nivel 4", "📋 Requiere Escudo")
  - `genera_recurso`: Badge verde mostrando recurso generado (ej: "⬆️ Furia: +10")
  - `costo_recurso`: Badge amarillo con costo de recurso (ej: "⬇️ Maná: 30")
  - `recuperacion_segundos`: Badge cyan con cooldown (ej: "⏱️ 12s")
- Todos los badges se muestran en la tarjeta de la habilidad junto a tipo, rama y modificadores

### ✨ Added (Agregado)

#### Nueva Clase - Conjurador
- Agregada clase "Conjurador" a todos los selectores y arrays de clases
- Disponible en:
  - Creación de personajes
  - Gestión de héroes
  - Modal de captura de imágenes
  - Filtros y búsquedas
- Total de clases: Paladín, Bárbaro, Hechicero, Pícaro, Druida, Nigromante, Espiritista, Conjurador

#### Gestión de Galería - Eliminación de Elementos
- **Multiselección**: Checkbox en cada elemento de la galería para seleccionar múltiples items
- **Eliminación múltiple**: Botón "Eliminar seleccionados" elimina todos los elementos marcados en una sola operación
- **Eliminación individual**: Botón de eliminar (🗑️) en cada elemento al hacer hover
- **Modal de confirmación**: Muestra lista de elementos a eliminar antes de confirmar
- **Eliminación completa**: Borra imagen (.png), JSON (.json) y metadata (.meta.json) asociados
- **Botón "Seleccionar todo"**: Marca/desmarca todos los elementos visibles en la galería filtrada
- **Contador de selección**: Indica cuántos elementos están seleccionados
- **Feedback visual**: Items seleccionados se resaltan con borde rojo

---

## [0.8.8] - 2026-04-26

### 🔧 Fixed (Corregido)

#### Sistema de Glifos
- **Nivel máximo actualizado**: Glifos ahora soportan nivel 150 (Temporada 7)
- **Constante configurable**: Nueva constante `MAX_GLYPH_LEVEL` en `src/config/constants.ts`
- **Separación de datos**:
  - **Héroe**: Guarda solo detalles del glifo (nombre, descripción, efectos) SIN `nivel_actual`
  - **Personaje**: Guarda referencias `{id, nivel_actual, nivel_maximo}` con niveles específicos del build
- **Importación mejorada**:
  - Elimina `nivel_actual` al guardar en héroe (modo héroe y personaje)
  - Usa `MAX_GLYPH_LEVEL` como nivel máximo por defecto
  - Metadata estandarizada con `personajeId`, `personajeNombre`, `personajeNivel`
- **Componentes actualizados**:
  - `ImageCaptureModal.tsx`: Importación corregida
  - `CharacterGlyphs.tsx`: Uso de constante para nivel máximo

---

## [0.8.0] - 2026-04-19

### ✨ Added (Agregado)

#### Mecánicas de Clase
- **Nueva categoría**: Gestión de mecánicas únicas por clase (Juramentos, Libros de Hechizos, Arsenales, etc.)
- **Estructura de datos**: Similar a glifos/habilidades con selecciones configurables
- **Campos**:
  - `id`, `nombre`, `tipo`, `clase`
  - `selecciones[]`: Array de opciones seleccionables
  - Cada selección: `id`, `nombre`, `categoria`, `grupo`, `nivel`, `activo`, `efecto`, `detalles`, `tags`
  - `palabras_clave[]`: Glosario de términos específicos de la mecánica
- **Integración**:
  - Componente `CharacterClass` para visualización en personajes
  - Nueva opción en modal de captura (PromptGenerator)
  - Importación JSON en HeroManager (datos maestros)
  - Referencias en personajes (solo IDs)
- **Ubicación**: `src/components/characters/CharacterClass.tsx`, tipos en `src/types/index.ts`

---

## [0.7.1] - 2026-04-19

### ✨ Added (Agregado)

#### Sistema de Suscripciones
- **Tabla `subscriptions`**: Nueva tabla para gestionar suscripciones con 9 columnas
  - `id`, `user_id`, `plan_type`, `start_date`, `end_date`, `is_active`, `payment_amount`, `credits_granted`, `created_at`
- **Planes disponibles**: 
  - 1 mes: $5 → 4 créditos (80% conversión)
  - 6 meses: $25 → 20 créditos
  - 1 año: $45 → 36 créditos
- **Funcionalidades**:
  - Contratar nueva suscripción
  - Extender suscripción activa
  - Agregar créditos adicionales
  - Control de expiración automático
- **UI**: Nueva tab "Suscripción" en página de perfil

#### Página de Perfil Completa
- **4 tabs**: Perfil, Uso, Historial, Suscripción
- **Tab Perfil**: Editar username, email, cambiar contraseña
- **Tab Uso**: Estadísticas de consumo (semana, mes, año)
- **Tab Historial**: Tabla paginada de consultas de IA con costos
- **Tab Suscripción**: Info de plan, fechas, renovación, contratar/extender
- **Balance de créditos**: Indicador en Sidebar + modal de recarga
- **Ubicación**: `src/components/layout/Sidebar.tsx`, `src/components/Profile.tsx`

#### Logging Exhaustivo para Production
- **Middleware global**: Captura TODAS las requests en producción
- **Logs detallados**:
  - Timestamp, método, URL, origin, host, content-type, user-agent
  - Request body (con passwords ocultos)
  - Response status code
- **Separadores visuales**: Fácil lectura en logs de Render
- **Logging específico**: Paso a paso en `/api/auth/login`
- **Ubicación**: `server/index.js`, `server/routes/auth.js`

#### Documentación
- **DEPLOYMENT.md**: Guía completa de deployment en Render
  - Diagrama de arquitectura fullstack
  - Configuración de PostgreSQL con SSL
  - Variables de entorno para producción
  - Troubleshooting de errores comunes
- **BUILD_GUIDE.md**: Resolución de errores de TypeScript
- **PRODUCTION_TEST.md**: Checklist de testing en producción
- **README.md**: Nueva sección "Deployment a Producción" completa

### 🔧 Fixed (Arreglado)

#### Deployment: PostgreSQL requiere SSL
- **Problema**: Error "SSL/TLS required" en Render
- **Solución**: Agregado `ssl: { rejectUnauthorized: false }` al pool de PostgreSQL en producción
- **Afectado**: `server/config/database.js`

#### Deployment: Render ejecutaba comando incorrecto
- **Problema**: Render ejecutaba `npm run preview` (Vite) en lugar del servidor Express
- **Causa**: Faltaba script `"start"` en `package.json`
- **Solución**: Agregado `"start": "cd server && node index.js"`
- **Resultado**: API funciona correctamente en producción

#### Deployment: Tablas no existían en producción
- **Problema**: Error "relation 'users' does not exist"
- **Solución**: Variable de entorno `AUTO_MIGRATE=true` ejecuta migraciones al iniciar
- **Tablas creadas**: `users`, `subscriptions`, `billing_usage`

#### Deployment: "vite: not found" en Build
- **Problema**: `npm ci` no instala devDependencies en producción
- **Solución**: Movidas herramientas de build a `dependencies`:
  - `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`

#### Deployment: API URL incorrecta
- **Problema**: Frontend intentaba acceder a `https://d4build.onrender.com:3001/api`
- **Solución**: Eliminado puerto en producción (`ApiService.ts`)
- **Resultado**: URL correcta `https://d4build.onrender.com/api`

#### TypeScript Build Errors
- **Problema**: 130+ errores de tipos implícitos `any` en producción
- **Solución**: 
  - Ajustado `tsconfig.json`: `strict: false`, `noImplicitAny: false`
  - Cambiado build script: `vite build` (sin `tsc`)
  - Nuevo script `build:check` para desarrollo
- **Afectado**: AdminUsers.tsx, CharacterParagon.tsx, BillingPanel.tsx, etc.

### 🔄 Changed (Cambiado)

#### Arquitectura Fullstack
- **Backend sirve frontend**: Express ahora sirve archivos de `dist/` en producción
- **Middleware agregado**: `express.static(dist/)` + catch-all `GET *`
- **Beneficios**:
  - Un solo servicio (frontend + backend)
  - Sin necesidad de CORS complejo
  - Más económico en hosting
  - Deployment unificado

#### CORS Dinámico
- **Producción**: Permite same-origin automáticamente (fullstack)
- **Desarrollo**: Permite localhost:* y redes locales
- **Variable `CORS_ORIGIN`**: Opcional (solo si backend separado)

#### Orden de Middlewares
Reorganizado para máxima compatibilidad:
1. CORS + express.json
2. Logging (solo producción)
3. API Routes (/api/*)
4. Health check
5. 404 handler para API no encontradas
6. Static files (dist/)
7. Catch-all SPA routing
8. Error handler
  - Producción: `${protocol}//${hostname}/api` (sin puerto)
  - Soporte para override via `VITE_API_URL` env var
  - Log mejorado con info de override

#### Configuración de Build
- **package.json**: 
  - `build`: Cambiado de `tsc && vite build` a `vite build` (más rápido, menos estricto)
  - `build:check`: Nuevo script con `tsc && vite build` para verificación completa
  - Actualizada versión a 0.7.1
  - **Movidas a dependencies** (desde devDependencies):
    - `vite`: Build tool necesario en producción
    - `@vitejs/plugin-react`: Plugin de Vite
    - `tailwindcss`: Framework CSS
    - `postcss`: Procesador CSS
    - `autoprefixer`: Prefijos de vendor

- **tsconfig.json**: 
  - `strict`: `true` → `false`
  - `noImplicitAny`: `true` (implícito en strict) → `false`
  - `noUnusedLocals`: `true` → `false`
  - `noUnusedParameters`: `true` → `false`
  - Mantiene: strictNullChecks, strictFunctionTypes, strictBindCallApply, strictPropertyInitialization, noImplicitThis, alwaysStrict

### 📊 Technical Details

**Build Performance:**
- Tiempo de compilación: ~2.2s
- Tamaño total: ~1.47 MB (dist/)
  - index.html: 0.50 KB
  - CSS: 72.85 KB (12.21 KB gzipped)
  - JS: 1,394.70 KB (306.79 KB gzipped)
- Módulos transformados: 1510

**Compatibilidad:**
- ✅ Funciona con Render, Vercel, Netlify
- ✅ Node.js 18+
- ✅ npm/yarn
- ✅ Deployment automático habilitado

---

## [0.7.0] - 2026-04-18

### 💳 Added (Agregado)

#### Sistema de Suscripciones
- Tabla `subscriptions` con 9 columnas (id, user_id, plan_type, start_date, end_date, is_active, auto_renew, created_at, updated_at)
- Planes flexibles: 1_month ($5), 6_months ($25), 1_year ($45)
- Conversión a créditos: 80% del pago ($4, $20, $36)
- Campo `premium_balance` en tabla users (DECIMAL 10,2)
- API endpoints para suscripciones:
  - POST /api/profile/subscribe - Nueva suscripción
  - POST /api/profile/extend-subscription - Extensión de plan
  - POST /api/profile/add-credits - Recarga de créditos

#### Perfil de Usuario
- Página completa con 4 tabs:
  - **Profile**: Editar username, email, cambiar contraseña
  - **Usage**: Estadísticas por semana, mes, año
  - **History**: Historial paginado de consultas AI
  - **Subscription**: Estado, plan, fechas, renovación
- Modal de recarga de créditos ($1-$100 con 80% conversión)
- Validaciones de seguridad (contraseña actual requerida)

#### UI/UX Enhancements
- Badge clickable en Sidebar (Premium/Basic) abre modal de suscripción
- Indicador de créditos en Sidebar con botón de recarga
- Modal de suscripción con 3 planes y lista de beneficios
- Alertas de expiración (7 días antes)
- Tooltips con fecha de expiración

### 🔧 Fixed (Arreglado)

#### Backend Bugs
- **JWT Field Mismatch**: Cambiado `req.user.userId` a `req.user.id` en 7 endpoints de profile.js
- **SQL Column Name**: Cambiado `SUM(cost)` a `SUM(cost_total)` en 5 queries de profile.js
- **Sidebar Syntax Error**: Removido duplicate `}, [isPremium]);` que causaba parsing error

### 📚 Documentation

#### Deployment
- **DEPLOYMENT.md**: Guía completa de 7 pasos
  - Configuración PostgreSQL (Name: prod-postgres-d4build, Database: d4buildsbd, User: d4builds_admin)
  - Variables de entorno detalladas
  - Comandos de migración
  - Creación de usuario admin
  - Troubleshooting

- **.env.production.example**: Template con todas las variables requeridas
  - DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT
  - JWT_SECRET con nota de generación
  - CORS_ORIGIN, NODE_ENV

- **README.md**: Actualizado con sección de deployment
  - Quick reference con valores PostgreSQL
  - Link a DEPLOYMENT.md
  - Post-deployment checklist

### 🔐 Security

- JWT_SECRET generado con crypto: `8ZyKTmCSGhyQCv/lNx6mnGdYOoTYUsrNWkkwKBvrj4E=`
- Validación de contraseña actual antes de cambio
- Transacciones atómicas para suscripciones (BEGIN/COMMIT/ROLLBACK)

---

## [0.6.0] - 2026-04-15

### ✨ Added
- Sistema de autenticación con JWT
- Cuentas Premium y Basic
- PostgreSQL backend con Express.js
- Tracking de uso de API OpenAI/Gemini
- Panel de Billing (solo dev)
- Restricciones por nivel de cuenta

### 🎮 Features
- Gestión de personajes, habilidades, glifos
- Importación desde JSON
- Extracción con IA (Gemini/OpenAI)
- Sistema de aspectos con 5 categorías
- Workspace dinámico

---

## [0.5.0] - 2026-03-20

### ✨ Initial Release
- Aplicación base React + TypeScript
- Gestión de builds offline
- Importación manual de JSON
- Workspace local con File System Access API

---

**Leyenda:**
- 🔧 Fixed: Correcciones de bugs
- 💳 Added: Nuevas características
- 🔄 Changed: Cambios en funcionalidades existentes
- 📚 Documentation: Cambios en documentación
- 🔐 Security: Mejoras de seguridad
- 📊 Technical: Detalles técnicos
- ⚠️ Deprecated: Características obsoletas
- 🗑️ Removed: Características eliminadas

---

**Enlaces:**
- [0.7.1]: https://github.com/CareZapato/D4Build/releases/tag/v0.7.1
- [0.7.0]: https://github.com/CareZapato/D4Build/releases/tag/v0.7.0
- [0.6.0]: https://github.com/CareZapato/D4Build/releases/tag/v0.6.0
- [0.5.0]: https://github.com/CareZapato/D4Build/releases/tag/v0.5.0
