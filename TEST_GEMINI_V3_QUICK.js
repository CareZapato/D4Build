/**
 * ============================================================================
 * 🧪 TEST RÁPIDO - GeminiServiceV3
 * ============================================================================
 * 
 * Instrucciones para probar desde la consola del navegador:
 * 
 * 1. Abre tu aplicación en el navegador
 * 2. Abre la consola de desarrollo (F12)
 * 3. Copia y pega este código
 * 4. Reemplaza 'TU_API_KEY' con tu clave real
 * 5. Sube una imagen usando el input de archivo
 * 6. Ejecuta las funciones de prueba
 * 
 * ============================================================================
 */

// CONFIGURACIÓN
const API_KEY = 'TU_API_KEY_AQUI'; // ⚠️ Reemplaza con tu API key real

// ============================================================================
// PRUEBA 1: Verificar que el servicio está disponible
// ============================================================================

console.log('🧪 PRUEBA 1: Verificar servicio...\n');

async function prueba1_verificarServicio() {
  try {
    const { GeminiService } = await import('./src/services/GeminiServiceV3.ts');
    console.log('✅ GeminiService importado correctamente');
    console.log('   Métodos disponibles:', Object.getOwnPropertyNames(GeminiService));
    return true;
  } catch (error) {
    console.error('❌ Error al importar servicio:', error);
    return false;
  }
}

// ============================================================================
// PRUEBA 2: Probar conversión de imagen a base64
// ============================================================================

console.log('\n🧪 PRUEBA 2: Conversión a base64...\n');

async function prueba2_convertirImagen(file) {
  if (!file) {
    console.log('⚠️  Para esta prueba necesitas un archivo');
    console.log('   Ejecuta: const input = document.querySelector("input[type=file]");');
    console.log('   Luego: prueba2_convertirImagen(input.files[0]);');
    return;
  }

  try {
    const { fileToBase64 } = await import('./src/services/GeminiServiceV3.ts');
    
    console.log('📄 Convirtiendo archivo:', file.name);
    console.log('   Tipo:', file.type);
    console.log('   Tamaño:', (file.size / 1024).toFixed(2), 'KB');
    
    const result = await fileToBase64(file);
    
    console.log('✅ Conversión exitosa:');
    console.log('   MIME:', result.inlineData.mimeType);
    console.log('   Base64 length:', result.inlineData.data.length);
    console.log('   Base64 preview:', result.inlineData.data.substring(0, 50) + '...');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// ============================================================================
// PRUEBA 3: Analizar imagen con Gemini (COMPLETO)
// ============================================================================

console.log('\n🧪 PRUEBA 3: Análisis completo con Gemini...\n');

async function prueba3_analizarImagen(file, apiKey = API_KEY) {
  if (!file) {
    console.log('⚠️  Para esta prueba necesitas un archivo');
    console.log('   Ejecuta: const input = document.querySelector("input[type=file]");');
    console.log('   Luego: prueba3_analizarImagen(input.files[0]);');
    return;
  }

  if (apiKey === 'TU_API_KEY_AQUI') {
    console.error('❌ Debes configurar tu API key primero');
    console.log('💡 Edita este script y reemplaza "TU_API_KEY_AQUI" con tu clave real');
    console.log('🔑 Obtén una en: https://aistudio.google.com/apikeys');
    return;
  }

  try {
    const { GeminiService, PROMPT_DIABLO4_STATS } = await import(
      './src/services/GeminiServiceV3.ts'
    );

    console.log('🚀 Iniciando análisis...');
    console.log('📄 Archivo:', file.name);
    console.log('📏 Tamaño:', (file.size / 1024).toFixed(2), 'KB');
    console.log('⏳ Procesando...\n');

    const startTime = Date.now();

    const response = await GeminiService.processImageWithFallback(
      {
        image: file,
        prompt: PROMPT_DIABLO4_STATS
      },
      {
        apiKey,
        temperature: 0.1
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║  📊 RESULTADO DEL ANÁLISIS                     ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    if (response.success) {
      console.log('✅ Estado: ÉXITO');
      console.log('⏱️  Duración:', duration, 'segundos');
      console.log('🤖 Modelo usado:', response.modelUsed);
      console.log('\n📦 DATOS EXTRAÍDOS:');
      console.log('═══════════════════════════════════════════════');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('═══════════════════════════════════════════════\n');
      
      // Highlights
      if (response.data.nivel) {
        console.log('👤 Nivel:', response.data.nivel);
      }
      if (response.data.clase) {
        console.log('⚔️  Clase:', response.data.clase);
      }
      if (response.data.defensivo?.vida) {
        console.log('❤️  Vida:', response.data.defensivo.vida);
      }
      
    } else {
      console.log('❌ Estado: ERROR');
      console.log('⏱️  Duración:', duration, 'segundos');
      console.log('🔴 Tipo de error:', response.errorType);
      console.log('📝 Mensaje:', response.error);
      
      // Sugerencias según error
      console.log('\n💡 SUGERENCIAS:');
      switch (response.errorType) {
        case 'MODEL_UNAVAILABLE':
          console.log('   • El modelo no está disponible para tu API key');
          console.log('   • Verifica tu región y tipo de cuenta');
          break;
        case 'INVALID_API_KEY':
          console.log('   • Verifica tu API key en https://aistudio.google.com/apikeys');
          console.log('   • Asegúrate de que esté activa');
          break;
        case 'QUOTA_EXCEEDED':
          console.log('   • Has excedido tu cuota de API');
          console.log('   • Espera unos minutos o actualiza tu plan');
          break;
        case 'EMPTY_MODEL_RESPONSE':
          console.log('   • La imagen puede ser ilegible');
          console.log('   • Intenta con mejor calidad o más zoom');
          break;
        case 'INVALID_JSON':
          console.log('   • El modelo no devolvió JSON válido');
          console.log('   • Texto recibido:', response.rawText);
          break;
      }
    }

    console.log('\n');
    return response;

  } catch (error) {
    console.error('\n💥 ERROR INESPERADO:', error);
  }
}

// ============================================================================
// PRUEBA 4: Probar todos los modelos disponibles
// ============================================================================

console.log('\n🧪 PRUEBA 4: Probar modelos individuales...\n');

async function prueba4_probarModelos(file, apiKey = API_KEY) {
  if (!file || apiKey === 'TU_API_KEY_AQUI') {
    console.log('⚠️  Configura API key y archivo primero');
    return;
  }

  const modelos = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.5-pro'
  ];

  const { GeminiService } = await import('./src/services/GeminiServiceV3.ts');

  console.log('🔄 Probando', modelos.length, 'modelos...\n');

  for (const modelo of modelos) {
    console.log(`\n🎯 Probando: ${modelo}`);
    console.log('─'.repeat(50));

    const response = await GeminiService.processImage(
      {
        image: file,
        prompt: 'Describe esta imagen brevemente en JSON: { "descripcion": "..." }'
      },
      {
        apiKey,
        model: modelo
      }
    );

    if (response.success) {
      console.log(`✅ ${modelo} → FUNCIONA`);
    } else {
      console.log(`❌ ${modelo} → ${response.errorType}`);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('Prueba completada');
}

// ============================================================================
// AUTO-EJECUCIÓN
// ============================================================================

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  🧪 SUITE DE PRUEBAS - GeminiServiceV3                    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📋 FUNCIONES DISPONIBLES:\n');
console.log('   • prueba1_verificarServicio()');
console.log('   • prueba2_convertirImagen(file)');
console.log('   • prueba3_analizarImagen(file, apiKey)');
console.log('   • prueba4_probarModelos(file, apiKey)\n');

console.log('🚀 INICIO RÁPIDO:\n');
console.log('   1. const input = document.querySelector("input[type=file]");');
console.log('   2. Sube una imagen al input');
console.log('   3. const file = input.files[0];');
console.log('   4. await prueba3_analizarImagen(file, "TU_API_KEY");\n');

// Ejecutar prueba 1 automáticamente
setTimeout(async () => {
  await prueba1_verificarServicio();
  console.log('\n✨ Listo para usar. Ejecuta las otras pruebas manualmente.\n');
}, 1000);

// Exportar para uso manual
export {
  prueba1_verificarServicio,
  prueba2_convertirImagen,
  prueba3_analizarImagen,
  prueba4_probarModelos
};
