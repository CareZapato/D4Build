import { ImportValidationError } from '../components/common/ImportResultsModal';

/**
 * Resultados de validación de JSON
 */
export interface JSONValidationResult {
  isValid: boolean;
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  detectedFields: string[];
}

/**
 * Valida la estructura de JSON para habilidades/skills
 */
export function validateSkillsJSON(data: any): JSONValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: ImportValidationError[] = [];
  const detectedFields: string[] = [];

  // Verificar que sea un objeto
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push({
      field: 'root',
      expected: 'object {}',
      received: Array.isArray(data) ? 'array []' : typeof data,
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  // Verificar habilidades_activas
  if (data.habilidades_activas !== undefined) {
    detectedFields.push('habilidades_activas');
    if (!Array.isArray(data.habilidades_activas)) {
      errors.push({
        field: 'habilidades_activas',
        expected: 'array []',
        received: typeof data.habilidades_activas,
        severity: 'error'
      });
    } else {
      // Validar estructura de cada habilidad activa
      data.habilidades_activas.forEach((skill: any, idx: number) => {
        if (!skill.nombre) {
          errors.push({
            field: `habilidades_activas[${idx}].nombre`,
            expected: 'string (requerido)',
            received: 'undefined o vacío',
            severity: 'error'
          });
        }
        if (!skill.nivel_actual && !skill.nivel) {
          warnings.push({
            field: `habilidades_activas[${idx}].nivel_actual`,
            expected: 'number',
            received: 'undefined (se usará 1 por defecto)',
            severity: 'warning'
          });
        }
      });
    }
  }

  // Verificar habilidades_pasivas
  if (data.habilidades_pasivas !== undefined) {
    detectedFields.push('habilidades_pasivas');
    if (!Array.isArray(data.habilidades_pasivas)) {
      errors.push({
        field: 'habilidades_pasivas',
        expected: 'array []',
        received: typeof data.habilidades_pasivas,
        severity: 'error'
      });
    } else {
      // Validar estructura de cada habilidad pasiva
      data.habilidades_pasivas.forEach((skill: any, idx: number) => {
        if (!skill.nombre) {
          errors.push({
            field: `habilidades_pasivas[${idx}].nombre`,
            expected: 'string (requerido)',
            received: 'undefined o vacío',
            severity: 'error'
          });
        }
      });
    }
  }

  // Advertir si no tiene ninguna de las dos
  if (!data.habilidades_activas && !data.habilidades_pasivas) {
    warnings.push({
      field: 'habilidades',
      expected: 'habilidades_activas[] o habilidades_pasivas[]',
      received: 'ninguno encontrado',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedFields
  };
}

/**
 * Valida la estructura de JSON para glifos
 */
export function validateGlyphsJSON(data: any): JSONValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: ImportValidationError[] = [];
  const detectedFields: string[] = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push({
      field: 'root',
      expected: 'object {}',
      received: Array.isArray(data) ? 'array []' : typeof data,
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  if (data.glifos !== undefined) {
    detectedFields.push('glifos');
    if (!Array.isArray(data.glifos)) {
      errors.push({
        field: 'glifos',
        expected: 'array []',
        received: typeof data.glifos,
        severity: 'error'
      });
    } else {
      data.glifos.forEach((glyph: any, idx: number) => {
        if (!glyph.nombre) {
          errors.push({
            field: `glifos[${idx}].nombre`,
            expected: 'string (requerido)',
            received: 'undefined o vacío',
            severity: 'error'
          });
        }
        if (!glyph.nivel_actual && !glyph.nivel) {
          warnings.push({
            field: `glifos[${idx}].nivel_actual`,
            expected: 'number',
            received: 'undefined (se usará 1 por defecto)',
            severity: 'warning'
          });
        }
      });
    }
  } else {
    warnings.push({
      field: 'glifos',
      expected: 'glifos[]',
      received: 'undefined',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedFields
  };
}

/**
 * Valida la estructura de JSON para aspectos
 */
export function validateAspectsJSON(data: any): JSONValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: ImportValidationError[] = [];
  const detectedFields: string[] = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push({
      field: 'root',
      expected: 'object {}',
      received: Array.isArray(data) ? 'array []' : typeof data,
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  const aspectosData = data.aspectos_equipados || data.aspectos;
  
  if (aspectosData !== undefined) {
    detectedFields.push(data.aspectos_equipados ? 'aspectos_equipados' : 'aspectos');
    if (!Array.isArray(aspectosData)) {
      errors.push({
        field: data.aspectos_equipados ? 'aspectos_equipados' : 'aspectos',
        expected: 'array []',
        received: typeof aspectosData,
        severity: 'error'
      });
    } else {
      aspectosData.forEach((aspect: any, idx: number) => {
        const name = aspect.nombre || aspect.name;
        if (!name) {
          errors.push({
            field: `aspectos[${idx}].nombre o .name`,
            expected: 'string (requerido)',
            received: 'undefined o vacío',
            severity: 'error'
          });
        }
      });
    }
  } else {
    warnings.push({
      field: 'aspectos',
      expected: 'aspectos[] o aspectos_equipados[]',
      received: 'ninguno encontrado',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedFields
  };
}

/**
 * Valida la estructura de JSON para estadísticas
 */
export function validateStatsJSON(data: any): JSONValidationResult {
  const errors: ImportValidationError[] = [];
  const warnings: ImportValidationError[] = [];
  const detectedFields: string[] = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push({
      field: 'root',
      expected: 'object {}',
      received: Array.isArray(data) ? 'array []' : typeof data,
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  // Soporta formato V1 (flat) y V2 (con clave "estadisticas")
  const statsObj = data.estadisticas || data;
  let hasAnyStats = false;

  // Verificar secciones conocidas
  const knownSections = [
    'personaje',
    'atributosPrincipales',
    'defensivo',
    'ofensivo',
    'utilidad',
    'armaduraYResistencias',
    'jcj',
    'moneda'
  ];

  knownSections.forEach((section) => {
    if (statsObj[section] !== undefined) {
      detectedFields.push(section);
      hasAnyStats = true;
      
      // Validar que sean objetos (no arrays)
      if (typeof statsObj[section] !== 'object' || Array.isArray(statsObj[section])) {
        errors.push({
          field: section,
          expected: 'object {}',
          received: Array.isArray(statsObj[section]) ? 'array []' : typeof statsObj[section],
          severity: 'error'
        });
      }
    }
  });

  // Verificar nivel_paragon (puede estar en raíz o en estadisticas)
  if (data.nivel_paragon !== undefined) {
    detectedFields.push('nivel_paragon');
    if (typeof data.nivel_paragon !== 'number') {
      warnings.push({
        field: 'nivel_paragon',
        expected: 'number',
        received: typeof data.nivel_paragon,
        severity: 'warning'
      });
    }
  }

  // Verificar nivel en atributos principales
  if (statsObj.atributosPrincipales?.nivel !== undefined) {
    detectedFields.push('atributosPrincipales.nivel');
    if (typeof statsObj.atributosPrincipales.nivel !== 'number') {
      warnings.push({
        field: 'atributosPrincipales.nivel',
        expected: 'number',
        received: typeof statsObj.atributosPrincipales.nivel,
        severity: 'warning'
      });
    }
  }

  if (!hasAnyStats) {
    warnings.push({
      field: 'estadisticas',
      expected: 'al menos una sección de estadísticas (personaje, atributosPrincipales, defensivo, ofensivo, utilidad, etc.)',
      received: 'ninguna sección encontrada',
      severity: 'warning'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedFields
  };
}

/**
 * Valida JSON según la categoría
 */
export function validateJSONByCategory(
  category: string,
  data: any
): JSONValidationResult {
  switch (category) {
    case 'skills':
      return validateSkillsJSON(data);
    case 'glifos':
      return validateGlyphsJSON(data);
    case 'aspectos':
      return validateAspectsJSON(data);
    case 'estadisticas':
      return validateStatsJSON(data);
    default:
      return {
        isValid: true,
        errors: [],
        warnings: [{
          field: 'category',
          expected: 'skills, glifos, aspectos, o estadisticas',
          received: category,
          severity: 'warning'
        }],
        detectedFields: []
      };
  }
}
