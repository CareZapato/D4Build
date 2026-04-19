import pool from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verifica si las tablas principales existen en la BD
 */
async function checkTablesExist() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as users_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'billing_usage'
      ) as billing_exists;
    `);
    
    const { users_exists, billing_exists } = result.rows[0];
    return users_exists && billing_exists;
  } catch (error) {
    console.error('❌ Error al verificar tablas:', error.message);
    return false;
  }
}

/**
 * Ejecuta todas las migraciones disponibles
 */
async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  try {
    console.log('📂 Leyendo migraciones desde:', migrationsDir);
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort(); // Orden alfabético (001_, 002_, etc.)
    
    if (sqlFiles.length === 0) {
      console.log('⚠️  No se encontraron archivos de migración (.sql)');
      return false;
    }
    
    console.log(`🔄 Ejecutando ${sqlFiles.length} migraciones...`);
    
    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');
      
      console.log(`  ⏳ Ejecutando: ${file}`);
      await pool.query(sql);
      console.log(`  ✅ Completado: ${file}`);
    }
    
    console.log('✨ Migraciones completadas exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error durante migraciones:', error.message);
    console.error(error);
    return false;
  }
}

/**
 * Muestra un resumen de las tablas en la BD
 */
async function showTablesSummary() {
  try {
    const result = await pool.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = t.table_name AND table_schema = 'public') as columns,
        pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (result.rows.length === 0) {
      console.log('📊 No hay tablas en la base de datos');
      return;
    }
    
    console.log('\n📊 Tablas en la base de datos:');
    console.log('┌─────────────────────────┬──────────┬──────────┐');
    console.log('│ Tabla                   │ Columnas │ Tamaño   │');
    console.log('├─────────────────────────┼──────────┼──────────┤');
    
    result.rows.forEach(row => {
      const tableName = row.table_name.padEnd(23);
      const columns = row.columns.toString().padStart(8);
      const size = row.size.padStart(8);
      console.log(`│ ${tableName} │ ${columns} │ ${size} │`);
    });
    
    console.log('└─────────────────────────┴──────────┴──────────┘\n');
  } catch (error) {
    console.error('❌ Error al mostrar resumen de tablas:', error.message);
  }
}

/**
 * Función principal de auto-migración
 * Verifica el estado de la BD y ejecuta migraciones si es necesario
 */
export async function autoMigrate() {
  console.log('\n🔍 Verificando estado de la base de datos...');
  
  const tablesExist = await checkTablesExist();
  
  if (!tablesExist) {
    console.log('⚠️  Tablas no encontradas o incompletas. Iniciando migraciones...\n');
    const success = await runMigrations();
    
    if (!success) {
      console.error('❌ Fallo en las migraciones. El servidor puede no funcionar correctamente.');
      return false;
    }
  } else {
    console.log('✅ Tablas principales encontradas (users, billing_usage)');
  }
  
  await showTablesSummary();
  return true;
}

/**
 * Verifica la conexión a la BD
 */
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as db');
    console.log(`✅ Conexión a PostgreSQL exitosa`);
    console.log(`   Base de datos: ${result.rows[0].db}`);
    console.log(`   Hora del servidor: ${result.rows[0].time}`);
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    console.error('   Verifica que PostgreSQL esté corriendo y las credenciales sean correctas');
    return false;
  }
}
