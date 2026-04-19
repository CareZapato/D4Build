import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Todos los endpoints requieren autenticación y ser admin
router.use(authenticate);
router.use(requireAdmin);

// GET /api/admin/users - Listar todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [limit, offset];
    
    if (search) {
      whereClause = 'WHERE username ILIKE $3 OR email ILIKE $3';
      queryParams.push(`%${search}%`);
    }

    // Contar total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      search ? [`%${search}%`] : []
    );
    const total = parseInt(countResult.rows[0].count);

    // Obtener usuarios con estadísticas
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.account_type,
        u.is_admin,
        u.is_active,
        u.created_at,
        u.updated_at,
        COUNT(b.id)::int as total_ai_requests,
        COALESCE(SUM(b.cost_total), 0)::decimal(10,4) as total_cost
      FROM users u
      LEFT JOIN billing_usage b ON u.id = b.user_id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2`,
      queryParams
    );

    res.json({
      users: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/admin/users/:id - Obtener detalles de un usuario
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT id, username, email, account_type, is_admin, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener estadísticas de uso
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_total), 0) as total_tokens,
        COALESCE(SUM(cost_total), 0) as total_cost,
        MAX(created_at) as last_request
       FROM billing_usage WHERE user_id = $1`,
      [id]
    );

    res.json({
      user: userResult.rows[0],
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario
router.put('/users/:id', [
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('account_type').optional().isIn(['Basic', 'Premium']),
  body('is_active').optional().isBoolean(),
  body('is_admin').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { username, email, account_type, is_active, is_admin } = req.body;

    // No permitir que un admin se desactive a sí mismo
    if (parseInt(id) === req.user.id && is_active === false) {
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
    }

    // No permitir que un admin se quite permisos a sí mismo
    if (parseInt(id) === req.user.id && is_admin === false) {
      return res.status(400).json({ error: 'No puedes quitarte permisos de administrador' });
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (account_type !== undefined) {
      updates.push(`account_type = $${paramCount++}`);
      values.push(account_type);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (is_admin !== undefined) {
      updates.push(`is_admin = $${paramCount++}`);
      values.push(is_admin);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, username, email, account_type, is_admin, is_active, created_at, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ 
      message: 'Usuario actualizado',
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// POST /api/admin/users/:id/reset-password - Resetear contraseña de usuario
router.post('/users/:id/reset-password', [
  body('new_password').isLength({ min: 6 }).withMessage('Contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { new_password } = req.body;

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    const result = await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email`,
      [password_hash, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ 
      message: 'Contraseña actualizada exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error reseteando contraseña:', error);
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
});

// PUT /api/admin/change-password - Cambiar contraseña del admin (propia)
router.put('/change-password', [
  body('current_password').notEmpty().withMessage('Contraseña actual requerida'),
  body('new_password').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { current_password, new_password } = req.body;

    // Obtener usuario actual
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash de la nueva contraseña
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [password_hash, req.user.id]
    );

    res.json({ message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// DELETE /api/admin/users/:id - Eliminar usuario (soft delete)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir que un admin se elimine a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    const result = await pool.query(
      `UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, email`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ 
      message: 'Usuario desactivado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// GET /api/admin/stats - Estadísticas generales
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
        COUNT(*) FILTER (WHERE account_type = 'Premium') as premium_users,
        COUNT(*) FILTER (WHERE account_type = 'Basic') as basic_users,
        COUNT(*) FILTER (WHERE is_admin = true) as admin_users
      FROM users
    `);

    const billingResult = await pool.query(`
      SELECT 
        COUNT(*)::int as total_requests,
        COALESCE(SUM(cost_total), 0)::decimal(10,4) as total_cost,
        COALESCE(AVG(cost_total), 0)::decimal(10,6) as avg_cost_per_request
      FROM billing_usage
    `);

    res.json({
      users: result.rows[0],
      billing: billingResult.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
