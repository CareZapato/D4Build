import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Ejecutando migraciones...\n');

  try {
    // Leer todos los archivos SQL en orden
    const files = fs.readdirSync(__dirname)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`📄 Ejecutando: ${file}`);
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await pool.query(sql);
      console.log(`✅ ${file} completado\n`);
    }

    console.log('✅ Todas las migraciones completadas exitosamente');
    
    // Mostrar resumen de tablas creadas
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tablas en la base de datos:');
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
