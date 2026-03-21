import { 
  HabilidadActiva, 
  HabilidadPasiva, 
  Glifo, 
  FiltroHabilidad, 
  FiltroGlifo 
} from '../types';

export class SearchService {
  // Buscar habilidades activas
  static searchActiveSkills(
    skills: HabilidadActiva[], 
    filtro: FiltroHabilidad
  ): HabilidadActiva[] {
    return skills.filter(skill => {
      if (filtro.nombre && !skill.nombre.toLowerCase().includes(filtro.nombre.toLowerCase())) {
        return false;
      }
      if (filtro.tipo && skill.tipo !== filtro.tipo) {
        return false;
      }
      if (filtro.rama && skill.rama !== filtro.rama) {
        return false;
      }
      return true;
    });
  }

  // Buscar habilidades pasivas
  static searchPassiveSkills(
    skills: HabilidadPasiva[], 
    filtro: FiltroHabilidad
  ): HabilidadPasiva[] {
    return skills.filter(skill => {
      if (filtro.nombre && !skill.nombre.toLowerCase().includes(filtro.nombre.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  // Buscar glifos
  static searchGlyphs(
    glyphs: Glifo[], 
    filtro: FiltroGlifo
  ): Glifo[] {
    return glyphs.filter(glyph => {
      if (filtro.nombre && !glyph.nombre.toLowerCase().includes(filtro.nombre.toLowerCase())) {
        return false;
      }
      if (filtro.rareza && glyph.rareza !== filtro.rareza) {
        return false;
      }
      if (filtro.estado && glyph.estado !== filtro.estado) {
        return false;
      }
      if (filtro.atributo && glyph.atributo_escalado && 
          glyph.atributo_escalado.atributo !== filtro.atributo) {
        return false;
      }
      return true;
    });
  }

  // Encontrar cruces entre habilidades y glifos
  static findSkillGlyphSynergies(
    skill: HabilidadActiva, 
    glyphs: Glifo[]
  ): Array<{ glyph: Glifo; razones: string[] }> {
    const synergies: Array<{ glyph: Glifo; razones: string[] }> = [];

    glyphs.forEach(glyph => {
      const razones: string[] = [];

      // Verificar si el glifo potencia el tipo de daño de la habilidad
      if (skill.tipo_danio && glyph.bonificacion_adicional?.descripcion) {
        const tipoDanio = skill.tipo_danio.toLowerCase();
        const descripcionGlifo = glyph.bonificacion_adicional.descripcion.toLowerCase();
        
        if (tipoDanio.includes('físico') && descripcionGlifo.includes('físico')) {
          razones.push('Potencia daño físico');
        }
        if (tipoDanio.includes('sagrado') && descripcionGlifo.includes('sagrado')) {
          razones.push('Potencia daño sagrado');
        }
      }

      // Verificar sinergias con la rama
      if (glyph.atributo_escalado?.bonificacion && 
          glyph.atributo_escalado.bonificacion.toLowerCase().includes(skill.rama.toLowerCase())) {
        razones.push(`Potencia habilidades de ${skill.rama}`);
      }

      // Verificar sinergias con efectos generados
      if (skill.efectos_generados) {
        skill.efectos_generados.forEach(efecto => {
          if (glyph.bonificacion_adicional?.descripcion.toLowerCase().includes(efecto.nombre.toLowerCase())) {
            razones.push(`Sinergia con efecto: ${efecto.nombre}`);
          }
        });
      }

      // Verificar sinergias con control de multitudes
      if (glyph.nombre === 'Control' && skill.modificadores) {
        const tieneCC = skill.modificadores.some(mod => 
          mod.descripcion.toLowerCase().includes('aturd') ||
          mod.descripcion.toLowerCase().includes('ralent') ||
          mod.descripcion.toLowerCase().includes('congel') ||
          mod.descripcion.toLowerCase().includes('inmovil')
        );
        if (tieneCC) {
          razones.push('Sinergia con control de multitudes');
        }
      }

      // Verificar sinergias con golpe crítico
      if ((glyph.nombre === 'Espíritu' || glyph.nombre === 'Perfeccionado') && 
          skill.modificadores) {
        const tieneCrit = skill.modificadores.some(mod => 
          mod.descripcion.toLowerCase().includes('crítico')
        );
        if (tieneCrit) {
          razones.push('Sinergia con golpe crítico');
        }
      }

      if (razones.length > 0) {
        synergies.push({ glyph, razones });
      }
    });

    return synergies.sort((a, b) => b.razones.length - a.razones.length);
  }

  // Analizar build completo
  static analyzeBuild(
    activeSkills: HabilidadActiva[],
    _passiveSkills: HabilidadPasiva[],
    glyphs: Glifo[]
  ): {
    tipos_danio: string[];
    ramas_principales: string[];
    sinergias_detectadas: number;
    glifos_recomendados: string[];
  } {
    const tiposDanio = new Set<string>();
    const ramas = new Set<string>();
    let sinergias = 0;

    activeSkills.forEach(skill => {
      if (skill.tipo_danio) tiposDanio.add(skill.tipo_danio);
      ramas.add(skill.rama);
    });

    // Calcular sinergias totales
    activeSkills.forEach(skill => {
      const skillSynergies = this.findSkillGlyphSynergies(skill, glyphs);
      sinergias += skillSynergies.length;
    });

    const glifosRecomendados: string[] = [];
    
    // Recomendar glifos según el tipo de build
    if (Array.from(tiposDanio).some(t => t.includes('físico'))) {
      glifosRecomendados.push('Mella');
    }
    if (Array.from(tiposDanio).some(t => t.includes('sagrado'))) {
      glifosRecomendados.push('Astuto');
    }

    return {
      tipos_danio: Array.from(tiposDanio),
      ramas_principales: Array.from(ramas),
      sinergias_detectadas: sinergias,
      glifos_recomendados: glifosRecomendados
    };
  }
}
