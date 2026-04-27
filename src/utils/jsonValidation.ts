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
 * Valida la estructura de JSON para mecánicas de clase
 */
export function validateMecanicasJSON(data: any): JSONValidationResult {
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

  // Verificar que tenga mecanica_clase
  if (!data.mecanica_clase) {
    errors.push({
      field: 'mecanica_clase',
      expected: 'object con datos de mecánica',
      received: 'undefined',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  detectedFields.push('mecanica_clase');
  const mecanica = data.mecanica_clase;

  // Validar campos requeridos
  if (!mecanica.nombre) {
    errors.push({
      field: 'mecanica_clase.nombre',
      expected: 'string (requerido)',
      received: 'undefined o vacío',
      severity: 'error'
    });
  }

  if (!mecanica.clase) {
    warnings.push({
      field: 'mecanica_clase.clase',
      expected: 'string (nombre de clase)',
      received: 'undefined (se asignará automáticamente)',
      severity: 'warning'
    });
  }

  // Validar selecciones
  if (!Array.isArray(mecanica.selecciones)) {
    errors.push({
      field: 'mecanica_clase.selecciones',
      expected: 'array de selecciones',
      received: typeof mecanica.selecciones,
      severity: 'error'
    });
  } else if (mecanica.selecciones.length === 0) {
    warnings.push({
      field: 'mecanica_clase.selecciones',
      expected: 'al menos una selección',
      received: 'array vacío',
      severity: 'warning'
    });
  } else {
    // Validar cada selección
    mecanica.selecciones.forEach((sel: any, idx: number) => {
      if (!sel.nombre) {
        errors.push({
          field: `mecanica_clase.selecciones[${idx}].nombre`,
          expected: 'string (requerido)',
          received: 'undefined o vacío',
          severity: 'error'
        });
      }
      if (!sel.efecto) {
        warnings.push({
          field: `mecanica_clase.selecciones[${idx}].efecto`,
          expected: 'string con descripción del efecto',
          received: 'undefined o vacío',
          severity: 'warning'
        });
      }
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
 * Valida la estructura de JSON para eventos del mundo
 */
export function validateMundoJSON(data: any): JSONValidationResult {
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

  // Verificar eventos (requerido)
  if (!data.eventos) {
    errors.push({
      field: 'eventos',
      expected: 'array [] (requerido)',
      received: 'undefined',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  detectedFields.push('eventos');

  if (!Array.isArray(data.eventos)) {
    errors.push({
      field: 'eventos',
      expected: 'array []',
      received: typeof data.eventos,
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  // Validar cada evento
  data.eventos.forEach((evento: any, idx: number) => {
    if (!evento.id) {
      errors.push({
        field: `eventos[${idx}].id`,
        expected: 'string (requerido)',
        received: 'undefined o vacío',
        severity: 'error'
      });
    }
    if (!evento.nombre) {
      errors.push({
        field: `eventos[${idx}].nombre`,
        expected: 'string (requerido)',
        received: 'undefined o vacío',
        severity: 'error'
      });
    }
    if (!evento.tipo) {
      errors.push({
        field: `eventos[${idx}].tipo`,
        expected: 'string (guarida, susurro, evento, etc.)',
        received: 'undefined o vacío',
        severity: 'error'
      });
    }
    if (!evento.objetivo) {
      warnings.push({
        field: `eventos[${idx}].objetivo`,
        expected: 'object con tipo y descripción',
        received: 'undefined',
        severity: 'warning'
      });
    }
    if (!Array.isArray(evento.requisitos)) {
      warnings.push({
        field: `eventos[${idx}].requisitos`,
        expected: 'array []',
        received: typeof evento.requisitos,
        severity: 'warning'
      });
    }
    if (!Array.isArray(evento.recompensas)) {
      warnings.push({
        field: `eventos[${idx}].recompensas`,
        expected: 'array []',
        received: typeof evento.recompensas,
        severity: 'warning'
      });
    }
  });

  // Validar grafo (opcional pero recomendado)
  if (data.grafo !== undefined) {
    detectedFields.push('grafo');
    if (typeof data.grafo !== 'object' || data.grafo === null) {
      warnings.push({
        field: 'grafo',
        expected: 'object { nodos, relaciones }',
        received: typeof data.grafo,
        severity: 'warning'
      });
    } else {
      if (!Array.isArray(data.grafo.nodos)) {
        warnings.push({
          field: 'grafo.nodos',
          expected: 'array []',
          received: typeof data.grafo.nodos,
          severity: 'warning'
        });
      }
      if (!Array.isArray(data.grafo.relaciones)) {
        warnings.push({
          field: 'grafo.relaciones',
          expected: 'array []',
          received: typeof data.grafo.relaciones,
          severity: 'warning'
        });
      }
    }
  }

  // Validar indice_recursos (opcional)
  if (data.indice_recursos !== undefined) {
    detectedFields.push('indice_recursos');
    if (!Array.isArray(data.indice_recursos)) {
      warnings.push({
        field: 'indice_recursos',
        expected: 'array []',
        received: typeof data.indice_recursos,
        severity: 'warning'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedFields
  };
}

/**
 * Valida la estructura de JSON para mazmorras de aspectos
 */
export function validateMazmorrasJSON(data: any): JSONValidationResult {
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

  // Verificar mazmorras (requerido)
  if (!data.mazmorras) {
    errors.push({
      field: 'mazmorras',
      expected: 'array [] (requerido)',
      received: 'undefined',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  detectedFields.push('mazmorras');

  if (!Array.isArray(data.mazmorras)) {
    errors.push({
      field: 'mazmorras',
      expected: 'array []',
      received: typeof data.mazmorras,
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  // Validar cada mazmorra
  data.mazmorras.forEach((item: any, idx: number) => {
    // Validar objeto mazmorra
    if (!item.mazmorra) {
      errors.push({
        field: `mazmorras[${idx}].mazmorra`,
        expected: 'object (requerido)',
        received: 'undefined',
        severity: 'error'
      });
    } else {
      if (!item.mazmorra.nombre) {
        errors.push({
          field: `mazmorras[${idx}].mazmorra.nombre`,
          expected: 'string (requerido)',
          received: 'undefined o vacío',
          severity: 'error'
        });
      }
      if (!item.mazmorra.clase_requerida) {
        warnings.push({
          field: `mazmorras[${idx}].mazmorra.clase_requerida`,
          expected: 'string',
          received: 'undefined',
          severity: 'warning'
        });
      }
    }

    // Validar objeto aspecto
    if (!item.aspecto) {
      errors.push({
        field: `mazmorras[${idx}].aspecto`,
        expected: 'object (requerido)',
        received: 'undefined',
        severity: 'error'
      });
    } else {
      if (!item.aspecto.name) {
        errors.push({
          field: `mazmorras[${idx}].aspecto.name`,
          expected: 'string (requerido)',
          received: 'undefined o vacío',
          severity: 'error'
        });
      }
      if (!item.aspecto.shortName) {
        warnings.push({
          field: `mazmorras[${idx}].aspecto.shortName`,
          expected: 'string',
          received: 'undefined',
          severity: 'warning'
        });
      }
      if (!item.aspecto.effect) {
        warnings.push({
          field: `mazmorras[${idx}].aspecto.effect`,
          expected: 'string',
          received: 'undefined',
          severity: 'warning'
        });
      }
      if (!item.aspecto.category) {
        warnings.push({
          field: `mazmorras[${idx}].aspecto.category`,
          expected: 'string (ofensivo, defensivo, movilidad, recurso, utilidad)',
          received: 'undefined',
          severity: 'warning'
        });
      }
    }

    // Validar palabras_clave (opcional)
    if (item.palabras_clave !== undefined && !Array.isArray(item.palabras_clave)) {
      warnings.push({
        field: `mazmorras[${idx}].palabras_clave`,
        expected: 'array []',
        received: typeof item.palabras_clave,
        severity: 'warning'
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedFields
  };
}

/**
 * Valida la estructura de JSON para talismanes (charms)
 */
export function validateCharmsJSON(data: any): JSONValidationResult {
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

  // Verificar array de talismanes
  if (!data.talismanes) {
    errors.push({
      field: 'talismanes',
      expected: 'array [] (requerido)',
      received: 'undefined',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  if (!Array.isArray(data.talismanes)) {
    errors.push({
      field: 'talismanes',
      expected: 'array []',
      received: typeof data.talismanes,
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  detectedFields.push('talismanes');

  // Validar cada talismán
  data.talismanes.forEach((charm: any, idx: number) => {
    // Validar campos requeridos
    if (!charm.nombre) {
      errors.push({
        field: `talismanes[${idx}].nombre`,
        expected: 'string (requerido)',
        received: 'undefined o vacío',
        severity: 'error'
      });
    }

    if (!charm.rareza || !['rare', 'unique', 'set'].includes(charm.rareza)) {
      errors.push({
        field: `talismanes[${idx}].rareza`,
        expected: '"rare", "unique", o "set"',
        received: charm.rareza || 'undefined',
        severity: 'error'
      });
    }

    // Validar stats
    if (charm.stats !== undefined) {
      if (!Array.isArray(charm.stats)) {
        errors.push({
          field: `talismanes[${idx}].stats`,
          expected: 'array []',
          received: typeof charm.stats,
          severity: 'error'
        });
      } else {
        charm.stats.forEach((stat: any, statIdx: number) => {
          if (!stat.nombre) {
            warnings.push({
              field: `talismanes[${idx}].stats[${statIdx}].nombre`,
              expected: 'string',
              received: 'undefined',
              severity: 'warning'
            });
          }
        });
      }
    }

    // Validar efectos
    if (charm.efectos !== undefined) {
      if (!Array.isArray(charm.efectos)) {
        errors.push({
          field: `talismanes[${idx}].efectos`,
          expected: 'array []',
          received: typeof charm.efectos,
          severity: 'error'
        });
      } else {
        charm.efectos.forEach((efecto: any, efectoIdx: number) => {
          if (!efecto.descripcion) {
            warnings.push({
              field: `talismanes[${idx}].efectos[${efectoIdx}].descripcion`,
              expected: 'string',
              received: 'undefined',
              severity: 'warning'
            });
          }
          if (!efecto.tipo || !['pasivo', 'condicion', 'proc', 'stacking'].includes(efecto.tipo)) {
            warnings.push({
              field: `talismanes[${idx}].efectos[${efectoIdx}].tipo`,
              expected: '"pasivo", "condicion", "proc", o "stacking"',
              received: efecto.tipo || 'undefined',
              severity: 'warning'
            });
          }
        });
      }
    }

    // Validar set (si es rareza "set")
    if (charm.rareza === 'set' && charm.set) {
      if (!charm.set.nombre) {
        warnings.push({
          field: `talismanes[${idx}].set.nombre`,
          expected: 'string (requerido para sets)',
          received: 'undefined',
          severity: 'warning'
        });
      }
      if (!Array.isArray(charm.set.piezas)) {
        warnings.push({
          field: `talismanes[${idx}].set.piezas`,
          expected: 'array []',
          received: typeof charm.set.piezas,
          severity: 'warning'
        });
      }
      if (!Array.isArray(charm.set.bonus)) {
        warnings.push({
          field: `talismanes[${idx}].set.bonus`,
          expected: 'array []',
          received: typeof charm.set.bonus,
          severity: 'warning'
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedFields
  };
}

/**
 * Valida la estructura de JSON para Horadric Seal
 */
export function validateHoradricSealJSON(data: any): JSONValidationResult {
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

  // Verificar objeto horadric_seal
  if (!data.horadric_seal) {
    errors.push({
      field: 'horadric_seal',
      expected: 'object {} (requerido)',
      received: 'undefined',
      severity: 'error'
    });
    return { isValid: false, errors, warnings, detectedFields };
  }

  const seal = data.horadric_seal;
  detectedFields.push('horadric_seal');

  // Validar campos requeridos
  if (!seal.nombre) {
    errors.push({
      field: 'horadric_seal.nombre',
      expected: 'string (requerido)',
      received: 'undefined o vacío',
      severity: 'error'
    });
  }

  if (!seal.rareza || !['rare', 'legendary'].includes(seal.rareza)) {
    errors.push({
      field: 'horadric_seal.rareza',
      expected: '"rare" o "legendary"',
      received: seal.rareza || 'undefined',
      severity: 'error'
    });
  }

  if (seal.slots === undefined || typeof seal.slots !== 'number') {
    errors.push({
      field: 'horadric_seal.slots',
      expected: 'number (requerido)',
      received: typeof seal.slots,
      severity: 'error'
    });
  }

  // Validar stats
  if (seal.stats !== undefined) {
    if (!Array.isArray(seal.stats)) {
      errors.push({
        field: 'horadric_seal.stats',
        expected: 'array []',
        received: typeof seal.stats,
        severity: 'error'
      });
    }
  }

  // Validar bonus
  if (seal.bonus !== undefined) {
    if (!Array.isArray(seal.bonus)) {
      errors.push({
        field: 'horadric_seal.bonus',
        expected: 'array []',
        received: typeof seal.bonus,
        severity: 'error'
      });
    }
  }

  // Validar reglas
  if (seal.reglas !== undefined) {
    if (!Array.isArray(seal.reglas)) {
      warnings.push({
        field: 'horadric_seal.reglas',
        expected: 'array []',
        received: typeof seal.reglas,
        severity: 'warning'
      });
    }
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
    case 'mecanicas':
      return validateMecanicasJSON(data);
    case 'mundo':
      return validateMundoJSON(data);
    case 'mazmorras':
      return validateMazmorrasJSON(data);
    case 'estadisticas':
      return validateStatsJSON(data);
    case 'runas': {
      const hasRunes = Array.isArray(data?.runas);
      return {
        isValid: hasRunes,
        errors: hasRunes ? [] : [{
          field: 'runas',
          expected: 'array',
          received: data?.runas === undefined ? 'undefined' : typeof data?.runas,
          severity: 'error'
        }],
        warnings: [],
        detectedFields: hasRunes ? ['runas'] : []
      };
    }
    case 'gemas': {
      const hasGems = Array.isArray(data?.gemas);
      return {
        isValid: hasGems,
        errors: hasGems ? [] : [{
          field: 'gemas',
          expected: 'array',
          received: data?.gemas === undefined ? 'undefined' : typeof data?.gemas,
          severity: 'error'
        }],
        warnings: [],
        detectedFields: hasGems ? ['gemas'] : []
      };
    }
    case 'build': {
      const buildObj = data?.build && typeof data.build === 'object' ? data.build : data;
      const hasPiezas = Array.isArray(buildObj?.piezas);
      return {
        isValid: hasPiezas,
        errors: hasPiezas ? [] : [{
          field: 'build.piezas',
          expected: 'array',
          received: buildObj?.piezas === undefined ? 'undefined' : typeof buildObj?.piezas,
          severity: 'error'
        }],
        warnings: [],
        detectedFields: hasPiezas ? ['build', 'build.piezas'] : []
      };
    }
    case 'charms':
      return validateCharmsJSON(data);
    case 'horadric_seal': {
      return validateHoradricSealJSON(data);
    }
    default:
      return {
        isValid: true,
        errors: [],
        warnings: [{
          field: 'category',
          expected: 'skills, glifos, aspectos, estadisticas, runas, gemas, build, charms, horadric_seal',
          received: category,
          severity: 'warning'
        }],
        detectedFields: []
      };
  }
}
