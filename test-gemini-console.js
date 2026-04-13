/**
 * ============================================================================
 * 🧪 TEST SUITE - GEMINI IMAGE SERVICE
 * ============================================================================
 * 
 * Suite de pruebas para verificar la integración con Gemini
 * 
 * USO:
 * 1. Abre DevTools (F12)
 * 2. Ve a la pestaña Console
 * 3. Pega este código completo
 * 4. Ejecuta las funciones de test
 * 
 * TESTS DISPONIBLES:
 * - test1_verifySetup() - Verifica configuración básica
 * - test2_convertImage() - Prueba conversión de imagen a base64
 * - test3_analyzeImage() - Análisis completo de imagen
 * - test4_testAllAnalysisTypes() - Prueba todos los tipos de análisis
 * - runAllTests() - Ejecuta toda la suite
 * 
 * ============================================================================
 */

console.log('🧪 Cargando Test Suite...');

// ============================================================================
// TEST 1: Verificar Configuración
// ============================================================================

async function test1_verifySetup() {
  console.log('\n========================================');
  console.log('🧪 TEST 1: Verificar Configuración');
  console.log('========================================\n');

  // Verificar API Key
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ FALLO: VITE_GEMINI_API_KEY no configurada');
    console.log('\n📝 SOLUCIÓN:');
    console.log('1. Copia .env.example a .env.local');
    console.log('2. Edita .env.local y agrega tu API Key');
    console.log('3. Reinicia el servidor (npm run dev)');
    console.log('4. Obtén tu API Key en: https://aistudio.google.com/apikey');
    return false;
  }

  console.log('✅ API Key configurada');
  console.log(`   Primeros 10 caracteres: ${apiKey.substring(0, 10)}...`);
  console.log(`   Longitud: ${apiKey.length} caracteres`);

  // Verificar que empiece con "AIza"
  if (!apiKey.startsWith('AIza')) {
    console.warn('⚠️  ADVERTENCIA: La API Key no empieza con "AIza"');
    console.log('   Verifica que copiaste la clave correcta');
  }

  // Verificar que el servicio está disponible
  try {
    const { default: GeminiImageService } = await import('./src/services/GeminiImageService.ts');
    console.log('✅ GeminiImageService importado correctamente');
    
    console.log('   Métodos disponibles:');
    console.log('   - analyzeImage()');
    console.log('   - analyzeImageWithFallback()');
    console.log('   - analyzeMultipleImages()');
  } catch (error) {
    console.error('❌ FALLO: No se pudo importar GeminiImageService');
    console.error(error);
    return false;
  }

  // Verificar helpers
  try {
    const helpers = await import('./src/services/GeminiImageService.examples.tsx');
    console.log('✅ Helpers importados correctamente');
    
    console.log('   Helpers disponibles:');
    console.log('   - importStatsFromImage()');
    console.log('   - importGlyphsFromImage()');
    console.log('   - importSkillsFromImage()');
    console.log('   - importAspectsFromImage()');
    console.log('   - useGeminiImageAnalysis()');
  } catch (error) {
    console.error('❌ FALLO: No se pudieron importar helpers');
    console.error(error);
    return false;
  }

  console.log('\n✅ TEST 1 COMPLETADO: Configuración correcta\n');
  return true;
}

// ============================================================================
// TEST 2: Convertir Imagen a Base64
// ============================================================================

async function test2_convertImage() {
  console.log('\n========================================');
  console.log('🧪 TEST 2: Convertir Imagen a Base64');
  console.log('========================================\n');

  return new Promise((resolve) => {
    // Crear input temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    console.log('📁 Selecciona una imagen de prueba...');
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      
      if (!file) {
        console.error('❌ No se seleccionó ninguna imagen');
        resolve(false);
        return;
      }
      
      console.log('✅ Archivo seleccionado:');
      console.log(`   Nombre: ${file.name}`);
      console.log(`   Tipo: ${file.type}`);
      console.log(`   Tamaño: ${(file.size / 1024).toFixed(2)} KB`);
      
      try {
        const { fileToBase64 } = await import('./src/services/GeminiImageService.ts');
        
        console.log('\n🔄 Convirtiendo a base64...');
        const startTime = performance.now();
        
        const imagePart = await fileToBase64(file);
        
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        
        console.log('✅ Conversión exitosa');
        console.log(`   MIME Type: ${imagePart.inlineData.mimeType}`);
        console.log(`   Base64 length: ${imagePart.inlineData.data.length} caracteres`);
        console.log(`   Base64 size: ${(imagePart.inlineData.data.length / 1024).toFixed(2)} KB`);
        console.log(`   Tiempo: ${duration} ms`);
        
        // Verificar formato
        if (imagePart.inlineData.data.startsWith('data:')) {
          console.error('❌ FALLO: Base64 incluye prefijo "data:" (debería ser puro)');
          resolve(false);
          return;
        }
        
        console.log('✅ Formato correcto (base64 puro, sin prefijo)');
        
        console.log('\n📦 Estructura del objeto:');
        console.log(JSON.stringify({
          inlineData: {
            mimeType: imagePart.inlineData.mimeType,
            data: imagePart.inlineData.data.substring(0, 50) + '...'
          }
        }, null, 2));
        
        console.log('\n✅ TEST 2 COMPLETADO: Conversión funcionando correctamente\n');
        resolve(true);
        
      } catch (error) {
        console.error('❌ FALLO al convertir imagen:', error);
        resolve(false);
      }
    };
    
    input.click();
  });
}

// ============================================================================
// TEST 3: Analizar Imagen Completa
// ============================================================================

async function test3_analyzeImage() {
  console.log('\n========================================');
  console.log('🧪 TEST 3: Analizar Imagen con Gemini');
  console.log('========================================\n');

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ FALLO: API Key no configurada');
    console.log('   Ejecuta test1_verifySetup() primero');
    return false;
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    console.log('📁 Selecciona una imagen de Diablo 4...');
    console.log('   (Preferiblemente de estadísticas del personaje)');
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      
      if (!file) {
        console.error('❌ No se seleccionó ninguna imagen');
        resolve(false);
        return;
      }
      
      console.log(`✅ Imagen: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      
      try {
        const { default: GeminiImageService } = await import('./src/services/GeminiImageService.ts');
        
        console.log('\n🚀 Iniciando análisis con Gemini...');
        console.log('   Tipo: stats (estadísticas)');
        console.log('   Modelo: gemini-3-flash-preview (con fallback)');
        
        const startTime = performance.now();
        
        const response = await GeminiImageService.analyzeImageWithFallback(
          {
            image: file,
            analysisType: 'stats'
          },
          {
            apiKey: apiKey,
            temperature: 0.1
          }
        );
        
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`\n⏱️  Tiempo total: ${duration} segundos`);
        
        if (!response.success) {
          console.error('❌ FALLO en análisis:');
          console.error(`   Error: ${response.error}`);
          console.error(`   Tipo: ${response.errorType}`);
          
          // Sugerencias según tipo de error
          switch (response.errorType) {
            case 'MODEL_UNAVAILABLE':
              console.log('\n💡 SUGERENCIA:');
              console.log('   El modelo puede estar temporalmente no disponible.');
              console.log('   El fallback automático debería haber intentado otros modelos.');
              console.log('   Verifica en Google AI Studio qué modelos están activos.');
              break;
            
            case 'INVALID_API_KEY':
              console.log('\n💡 SUGERENCIA:');
              console.log('   1. Verifica que tu API Key sea correcta');
              console.log('   2. Genera una nueva en: https://aistudio.google.com/apikey');
              console.log('   3. Reemplaza en .env.local');
              console.log('   4. Reinicia el servidor');
              break;
            
            case 'QUOTA_EXCEEDED':
              console.log('\n💡 SUGERENCIA:');
              console.log('   Has excedido el límite de requests (15/minuto)');
              console.log('   Espera 60 segundos y vuelve a intentar');
              break;
            
            default:
              console.log('\n💡 SUGERENCIA:');
              console.log('   Revisa los logs detallados arriba');
              console.log('   Verifica tu conexión a internet');
          }
          
          resolve(false);
          return;
        }
        
        console.log('✅ Análisis exitoso');
        console.log(`   Modelo usado: ${response.modelUsed}`);
        console.log(`   Respuesta cruda: ${response.rawText?.length || 0} caracteres`);
        
        console.log('\n📦 Datos extraídos:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Validar estructura
        const expectedFields = ['nivel', 'clase', 'atributosPrincipales'];
        const dataFields = Object.keys(response.data || {});
        
        console.log('\n🔍 Validando estructura:');
        expectedFields.forEach(field => {
          if (dataFields.includes(field)) {
            console.log(`   ✅ Campo "${field}" presente`);
          } else {
            console.log(`   ⚠️  Campo "${field}" faltante`);
          }
        });
        
        console.log('\n✅ TEST 3 COMPLETADO: Análisis funcionando correctamente\n');
        resolve(true);
        
      } catch (error) {
        console.error('❌ FALLO durante análisis:', error);
        console.error(error.stack);
        resolve(false);
      }
    };
    
    input.click();
  });
}

// ============================================================================
// TEST 4: Probar Todos los Tipos de Análisis
// ============================================================================

async function test4_testAllAnalysisTypes() {
  console.log('\n========================================');
  console.log('🧪 TEST 4: Probar Todos los Tipos');
  console.log('========================================\n');

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ API Key no configurada');
    return false;
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    console.log('📁 Selecciona una imagen de Diablo 4...');
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      
      if (!file) {
        console.error('❌ No se seleccionó imagen');
        resolve(false);
        return;
      }
      
      const { default: GeminiImageService } = await import('./src/services/GeminiImageService.ts');
      
      const types = ['stats', 'glyphs', 'skills', 'aspects', 'currency'];
      
      console.log(`\n🔄 Probando ${types.length} tipos de análisis con la misma imagen...\n`);
      
      for (const type of types) {
        console.log(`\n📋 Tipo: ${type}`);
        
        try {
          const response = await GeminiImageService.analyzeImage(
            { image: file, analysisType: type },
            { apiKey, temperature: 0.1 }
          );
          
          if (response.success) {
            console.log(`   ✅ Éxito (${response.modelUsed})`);
            console.log(`   Campos: ${Object.keys(response.data || {}).length}`);
          } else {
            console.log(`   ❌ Fallo: ${response.errorType}`);
          }
          
          // Esperar 1 segundo entre requests (respeto al rate limit)
          await new Promise(r => setTimeout(r, 1000));
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }
      
      console.log('\n✅ TEST 4 COMPLETADO\n');
      resolve(true);
    };
    
    input.click();
  });
}

// ============================================================================
// EJECUTAR TODA LA SUITE
// ============================================================================

async function runAllTests() {
  console.clear();
  console.log('════════════════════════════════════════');
  console.log('🧪 GEMINI IMAGE SERVICE - TEST SUITE');
  console.log('════════════════════════════════════════\n');

  let totalTests = 0;
  let passedTests = 0;

  // Test 1
  totalTests++;
  if (await test1_verifySetup()) {
    passedTests++;
  }

  // Test 2
  totalTests++;
  if (await test2_convertImage()) {
    passedTests++;
  }

  // Test 3
  totalTests++;
  if (await test3_analyzeImage()) {
    passedTests++;
  }

  // Resumen
  console.log('\n════════════════════════════════════════');
  console.log('📊 RESUMEN DE TESTS');
  console.log('════════════════════════════════════════\n');
  console.log(`Total de tests: ${totalTests}`);
  console.log(`Tests exitosos: ${passedTests}`);
  console.log(`Tests fallidos: ${totalTests - passedTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
    console.log('✅ La integración con Gemini está funcionando correctamente');
  } else {
    console.log('\n⚠️  Algunos tests fallaron');
    console.log('📝 Revisa los logs arriba para más detalles');
  }
  
  console.log('\n════════════════════════════════════════\n');
}

// ============================================================================
// EXPORTS Y DOCUMENTACIÓN
// ============================================================================

console.log('✅ Test Suite cargada\n');
console.log('Funciones disponibles:');
console.log('  - test1_verifySetup()        → Verifica configuración');
console.log('  - test2_convertImage()       → Prueba conversión de imagen');
console.log('  - test3_analyzeImage()       → Prueba análisis completo');
console.log('  - test4_testAllAnalysisTypes()  → Prueba todos los tipos');
console.log('  - runAllTests()              → Ejecuta toda la suite\n');
console.log('Ejemplo de uso:');
console.log('  await test1_verifySetup()  // o cualquier otra función\n');

// Exportar para uso global
window.GeminiTests = {
  test1_verifySetup,
  test2_convertImage,
  test3_analyzeImage,
  test4_testAllAnalysisTypes,
  runAllTests
};
