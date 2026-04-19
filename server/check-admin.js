import pool from './config/database.js';
import bcrypt from 'bcryptjs';

async function checkAdmin() {
  try {
    console.log('\n🔍 Verificando usuario admin...\n');
    
    // Buscar usuario admin
    const result = await pool.query(
      'SELECT id, username, email, password_hash, account_type, is_admin, is_active FROM users WHERE email = $1',
      ['admin@d4builds.com']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Usuario admin NO existe en la base de datos');
      console.log('\n📝 Creando usuario admin...\n');
      
      // Crear usuario admin
      const password_hash = await bcrypt.hash('admin123', 10);
      const insertResult = await pool.query(
        `INSERT INTO users (username, email, password_hash, account_type, is_admin, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, username, email, account_type, is_admin`,
        ['admin', 'admin@d4builds.com', password_hash, 'Premium', true, true]
      );
      
      console.log('✅ Usuario admin creado:', insertResult.rows[0]);
    } else {
      const user = result.rows[0];
      console.log('✅ Usuario admin existe:');
      console.log('   ID:', user.id);
      console.log('   Username:', user.username);
      console.log('   Email:', user.email);
      console.log('   Account Type:', user.account_type);
      console.log('   Is Admin:', user.is_admin);
      console.log('   Is Active:', user.is_active);
      
      // Verificar contraseña
      console.log('\n🔑 Verificando contraseña "admin123"...');
      const passwordMatch = await bcrypt.compare('admin123', user.password_hash);
      
      if (passwordMatch) {
        console.log('✅ Contraseña correcta - hash coincide');
      } else {
        console.log('❌ Contraseña incorrecta - hash NO coincide');
        console.log('\n📝 Actualizando contraseña a "admin123"...\n');
        
        const newHash = await bcrypt.hash('admin123', 10);
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [newHash, user.id]
        );
        
        console.log('✅ Contraseña actualizada');
      }
    }
    
    console.log('\n✅ Verificación completa\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdmin();
