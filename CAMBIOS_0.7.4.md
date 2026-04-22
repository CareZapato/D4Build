# Cambios Versión 0.7.4 - Restricciones Premium y Mecánicas de Clase

## 📋 Resumen de Cambios

### 1. Sistema de Restricciones Premium en Prompts
- **Prompts de Diagnóstico (9)**: Disponibles para Basic
- **Prompts Comparativos (9)**: Requieren Premium

### 2. Inclusión de Mecánicas de Clase
- Agregar contexto de mecánicas de clase a prompts de diagnóstico
- Agregar contexto de mecánicas de clase a prompts comparativos
- Crear nuevos prompts específicos para mecánicas de clase

### 3. Actualización de PremiumPage
- Indicar que Basic incluye: Habilidades, Glifos, Aspectos, Paragon

### 4. Mejora de Prompts
- Indicar claramente qué skills, glifos, aspectos, paragon combinar
- Incluir toda la información necesaria para análisis matemático

## 🔄 Prompts que Requieren Premium (requiresPremium: true)

1. **skills-comparison-stage1** - Comparativo Habilidades Stage 1
2. **skills-comparison-stage2** - Comparativo Habilidades Stage 2
3. **glyphs-comparison-stage1** - Comparativo Glifos Stage 1
4. **glyphs-comparison-stage2** - Comparativo Glifos Stage 2
5. **aspects-comparison-stage1** - Comparativo Aspectos Stage 1
6. **aspects-comparison-stage2** - Comparativo Aspectos Stage 2
7. **paragon-optimization** - Optimización de Nodos Paragon
8. **paragon-node-comparison** - Comparación Estratégica de Nodos
9. **build-aspect-alternatives** - Build vs Pool de Aspectos del Héroe

## ✅ Prompts Disponibles para Basic (Sin requiresPremium)

1. **build-diagnosis** - Diagnóstico Completo de Build
2. **math-damage-analysis** - Análisis Matemático: Daño
3. **math-defense-analysis** - Análisis Matemático: Supervivencia
4. **rotation-advanced** - Rotación de Combate Avanzada
5. **endgame-report** - Reporte Endgame Completo
6. **paragon-analysis** - Análisis Completo de Paragon
7. **build-current-optimization** - Build Actual: Optimización Integral
8. **build-skill-glyph-coherence** - Coherencia Build con Skills y Glifos
9. **build-attributes-and-damage-composition** - Build: Atributos y Composición de Daño

## 🆕 Nuevos Prompts a Crear

### 1. Diagnóstico Completo Integral
- ID: `complete-diagnosis`
- Incluye TODO: Skills, Glifos, Aspectos, Stats, Build, Paragon, Mecánicas de Clase
- Para análisis completo sin dejar nada fuera

### 2. Análisis de Mecánicas de Clase
- ID: `class-mechanics-analysis`
- Análisis profundo de las mecánicas de clase equipadas
- Sinergias con skills, glifos, aspectos

### 3. Comparativo Mecánicas de Clase
- ID: `class-mechanics-comparison`
- Comparar mecánicas equipadas vs todas las disponibles
- Requiere Premium

## 📝 Mecánicas de Clase a Incluir en Prompts

Agregar al final de cada prompt de diagnóstico y comparación:

```
${getClassMechanicsContext()}

**IMPORTANTE: Mecánicas de Clase**
Las mecánicas de clase son fundamentales para:
- Cálculos matemáticos de daño y supervivencia
- Sinergias con habilidades activas y pasivas
- Coherencia general del build
- Aprovechamiento de aspectos y glifos
- Optimización de nodos Paragon

Considera las mecánicas de clase en todos los análisis y recomendaciones.
```

## 📄 Archivos a Modificar

1. **src/components/characters/CharacterPrompts.tsx** ✅ EN PROGRESO
   - ✅ Agregar import de useAuth
   - ✅ Agregar interface requiresPremium
   - ✅ Agregar getClassMechanicsContext()
   - ✅ Agregar getAllClassMechanicsContext()
   - ✅ Actualizar isPromptAvailable con verificación Premium
   - ⏳ Marcar prompts comparativos con requiresPremium: true
   - ⏳ Agregar mecánicas de clase a prompts existentes
   - ⏳ Crear nuevos prompts

2. **src/components/premium/PremiumPage.tsx**
   - Actualizar lista de Basic para incluir Habilidades, Glifos, Aspectos, Paragon

3. **package.json**
   - Actualizar versión a 0.7.4

4. **index.html**
   - Actualizar título a v0.7.4

5. **src/components/layout/Sidebar.tsx**
   - Actualizar badge de versión a v0.7.4

6. **src/components/ChangelogModal.tsx**
   - Agregar entrada completa para v0.7.4

7. **README.md**
   - Actualizar si es necesario

8. **/memories/** (memoria de usuario)
   - Actualizar d4builds-project.md con los nuevos cambios

## Estado Actual

- ✅ Import de useAuth agregado
- ✅ Estado de mecánicas de clase agregado
- ✅ Carga de mecánicas de clase implementada
- ✅ Funciones helper de mecánicas creadas
- ✅ Interface PromptConfig actualizada con requiresPremium
- ✅ Función isPromptAvailable actualizada con verificación Premium
- ⏳ Pendiente: Marcar prompts comparativos
- ⏳ Pendiente: Agregar mecánicas a prompts existentes
- ⏳ Pendiente: Crear nuevos prompts
- ⏳ Pendiente: Actualizar otros archivos
