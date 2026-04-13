/**
 * ============================================================================
 * 🧪 PRUEBA RÁPIDA - @google/genai con gemini-3-flash-preview
 * ============================================================================
 * 
 * Instrucciones:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este script completo
 * 3. Reemplaza 'TU_API_KEY' con tu clave real
 * 4. Observa los logs para ver qué modelos están disponibles
 * 
 * ============================================================================
 */

// 🔑 CONFIGURA TU API KEY AQUÍ
const API_KEY = 'TU_API_KEY_AQUI'; // ⚠️ Reemplaza con tu clave de Google AI Studio

// ============================================================================
// PRUEBA 1: Listar todos los modelos disponibles
// ============================================================================
console.log('🧪 PRUEBA 1: Listando modelos disponibles...\n');

async function pruebaListarModelos() {
  try {
    const { GeminiService } = await import('./src/services/GeminiServiceV2.ts');
    
    console.log('📡 Consultando modelos con tu API key...');
    const modelos = await GeminiService.listCompatibleModels(API_KEY);
    
    console.log('\n✅ MODELOS COMPATIBLES ENCONTRADOS:');
    console.log('═══════════════════════════════════');
    modelos.forEach((modelo, index) => {
      const emoji = index === 0 ? '⭐' : '  ';
      console.log(`${emoji} ${index + 1}. ${modelo}`);
    });
    console.log('═══════════════════════════════════\n');
    
    if (modelos.length === 0) {
      console.error('❌ No se encontraron modelos compatibles.');
      console.log('💡 Verifica:');
      console.log('   - Tu API key es válida');
      console.log('   - Tienes acceso a Gemini API');
      console.log('   - Tu región tiene modelos disponibles');
    } else {
      console.log(`✅ Total: ${modelos.length} modelos compatibles`);
      
      // Verificar si gemini-3-flash-preview está disponible
      const tieneGemini3 = modelos.some(m => m.includes('gemini-3-flash-preview'));
      if (tieneGemini3) {
        console.log('⭐ gemini-3-flash-preview ESTÁ DISPONIBLE');
      } else {
        console.log('⚠️  gemini-3-flash-preview NO está disponible');
        console.log('   El servicio seleccionará automáticamente el mejor disponible');
      }
    }
    
    return modelos;
    
  } catch (error) {
    console.error('❌ Error al listar modelos:', error);
    console.log('\n💡 Soluciones:');
    console.log('   1. Verifica tu API key');
    console.log('   2. Visita https://aistudio.google.com/apikeys');
    console.log('   3. Genera una nueva clave si es necesario');
    throw error;
  }
}

// ============================================================================
// PRUEBA 2: Obtener el mejor modelo recomendado
// ============================================================================
async function pruebaModeloRecomendado() {
  console.log('\n🧪 PRUEBA 2: Obteniendo modelo recomendado...\n');
  
  try {
    const { GeminiService } = await import('./src/services/GeminiServiceV2.ts');
    
    const mejorModelo = await GeminiService.getRecommendedModel(API_KEY);
    
    if (mejorModelo) {
      console.log('✅ MODELO RECOMENDADO:');
      console.log('═══════════════════════');
      console.log(`⭐ ${mejorModelo}`);
      console.log('═══════════════════════\n');
      
      // Explicar por qué se eligió
      if (mejorModelo.includes('gemini-3-flash-preview')) {
        console.log('✨ Este es el modelo oficial de ejemplo en la documentación 2026');
      } else if (mejorModelo.includes('flash-preview')) {
        console.log('✨ Modelo preview más reciente disponible');
      } else if (mejorModelo.includes('pro')) {
        console.log('✨ Modelo Pro (mejor calidad)');
      } else if (mejorModelo.includes('flash')) {
        console.log('✨ Modelo Flash (bueno para producción)');
      }
      
      console.log('💾 Este modelo se guardó en caché por 1 hora\n');
      return mejorModelo;
    } else {
      console.error('❌ No se pudo determinar un modelo recomendado');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error al obtener modelo recomendado:', error);
    throw error;
  }
}

// ============================================================================
// PRUEBA 3: Analizar una imagen de prueba (requiere imagen)
// ============================================================================
async function pruebaAnalizarImagen(imageFile) {
  console.log('\n🧪 PRUEBA 3: Analizando imagen...\n');
  
  if (!imageFile) {
    console.log('⚠️  Para esta prueba necesitas una imagen.');
    console.log('📝 Puedes hacer:');
    console.log('   1. Selecciona una imagen: const input = document.querySelector("input[type=file]");');
    console.log('   2. Luego ejecuta: pruebaAnalizarImagen(input.files[0]);');
    return;
  }
  
  try {
    const { GeminiService } = await import('./src/services/GeminiServiceV2.ts');
    
    console.log('📤 Enviando imagen a Gemini...');
    console.log(`   Archivo: ${imageFile.name}`);
    console.log(`   Tamaño: ${(imageFile.size / 1024).toFixed(2)} KB`);
    console.log(`   Tipo: ${imageFile.type}\n`);
    
    const resultado = await GeminiService.processAndExtractJSON(
      {
        image: imageFile,
        prompt: `Analiza esta imagen y describe qué ves en detalle.
                 Si es una captura de Diablo 4, extrae los datos visibles.
                 Responde en formato JSON con la estructura que consideres apropiada.`
      },
      {
        apiKey: API_KEY,
        useJsonMode: true  // ⚡ JSON puro sin markdown
      }
    );
    
    if (resultado.success) {
      console.log('✅ ANÁLISIS EXITOSO');
      console.log('═══════════════════════════════════');
      console.log(`⭐ Modelo usado: ${resultado.modelUsed}`);
      console.log(`📝 Respuesta raw (${resultado.rawText.length} caracteres)`);
      console.log('═══════════════════════════════════\n');
      
      try {
        const json = JSON.parse(resultado.json);
        console.log('📦 JSON EXTRAÍDO:');
        console.log(JSON.stringify(json, null, 2));
      } catch {
        console.log('⚠️  No se pudo parsear como JSON');
        console.log('Respuesta raw:', resultado.json);
      }
      
      return resultado;
    } else {
      console.error('❌ ANÁLISIS FALLÓ');
      console.error('═══════════════════════════════════');
      console.error(`Tipo de error: ${resultado.errorType}`);
      console.error(`Mensaje: ${resultado.error}`);
      console.error('═══════════════════════════════════\n');
      
      // Sugerencias según el tipo de error
      switch (resultado.errorType) {
        case 'API_KEY':
          console.log('💡 Verifica tu API key en https://aistudio.google.com/apikeys');
          break;
        case 'QUOTA':
          console.log('💡 Has agotado tu cuota. Espera o actualiza tu plan.');
          break;
        case 'MODEL':
          console.log('💡 Intenta con: { forceRefreshModels: true }');
          break;
        case 'EMPTY':
          console.log('💡 La imagen podría ser ilegible o el prompt poco claro.');
          break;
        case 'NETWORK':
          console.log('💡 Verifica tu conexión a internet.');
          break;
      }
      
      return resultado;
    }
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    throw error;
  }
}

// ============================================================================
// EJECUTAR TODAS LAS PRUEBAS
// ============================================================================
async function ejecutarTodasLasPruebas() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 SUITE DE PRUEBAS - @google/genai                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  if (API_KEY === 'TU_API_KEY_AQUI') {
    console.error('❌ ERROR: Define tu API key primero');
    console.log('💡 Edita este script y reemplaza "TU_API_KEY_AQUI" con tu clave real');
    console.log('🔑 Obtén una en: https://aistudio.google.com/apikeys\n');
    return;
  }
  
  try {
    // Prueba 1
    const modelos = await pruebaListarModelos();
    
    // Prueba 2
    const mejorModelo = await pruebaModeloRecomendado();
    
    // Prueba 3 (opcional, requiere imagen)
    console.log('\n🧪 PRUEBA 3: Análisis de imagen (opcional)');
    console.log('═══════════════════════════════════════════');
    console.log('Para probar con una imagen, ejecuta:');
    console.log('  1. Sube una imagen: const input = document.querySelector("input[type=file]");');
    console.log('  2. Analiza: await pruebaAnalizarImagen(input.files[0]);\n');
    
    // Resumen
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ PRUEBAS COMPLETADAS                                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('📊 RESUMEN:');
    console.log(`   • Modelos disponibles: ${modelos?.length || 0}`);
    console.log(`   • Modelo recomendado: ${mejorModelo || 'N/A'}`);
    console.log('   • Servicio: ✅ Funcionando\n');
    
    console.log('🚀 SIGUIENTE PASO:');
    console.log('   Usa el servicio en tu aplicación:');
    console.log('   import { GeminiService } from "./services/GeminiServiceV2";\n');
    
    return { modelos, mejorModelo };
    
  } catch (error) {
    console.error('\n❌ Una o más pruebas fallaron');
    console.error('Revisa los logs anteriores para más detalles\n');
    throw error;
  }
}

// ============================================================================
// AUTO-EJECUTAR
// ============================================================================
console.log('⏳ Iniciando pruebas en 2 segundos...');
console.log('💡 Puedes ejecutar pruebas individuales llamando:');
console.log('   • pruebaListarModelos()');
console.log('   • pruebaModeloRecomendado()');
console.log('   • pruebaAnalizarImagen(file)\n');

setTimeout(() => {
  ejecutarTodasLasPruebas().catch(error => {
    console.error('💥 Error fatal:', error);
  });
}, 2000);

// Exportar funciones para uso manual
export { 
  pruebaListarModelos, 
  pruebaModeloRecomendado, 
  pruebaAnalizarImagen,
  ejecutarTodasLasPruebas 
};
