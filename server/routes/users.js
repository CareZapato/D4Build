import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../config/database.js';
import { authenticate, requirePremium } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/profile - Obtener perfil del usuario autenticado
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, account_type, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener estadísticas de uso
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_total), 0) as total_tokens,
        COALESCE(SUM(cost_total), 0) as total_cost
       FROM billing_usage WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      user: result.rows[0],
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// PUT /api/users/profile - Actualizar perfil
router.put('/profile', authenticate, [
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(req.user.id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING id, username, email, account_type, is_active, created_at, updated_at`,
      values
    );

    res.json({ 
      message: 'Perfil actualizado',
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// POST /api/users/upgrade-premium - Upgrade ficticio a Premium
router.post('/upgrade-premium', authenticate, async (req, res) => {
  try {
    const { payment_method } = req.body;

    // Verificar que no sea ya Premium
    const user = await pool.query('SELECT account_type FROM users WHERE id = $1', [req.user.id]);
    
    if (user.rows[0].account_type === 'Premium') {
      return res.status(400).json({ error: 'Ya tienes una cuenta Premium' });
    }

    // Simular pago exitoso (ficticio)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Actualizar a Premium
    const result = await pool.query(
      `UPDATE users SET account_type = 'Premium', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, username, email, account_type`,
      [req.user.id]
    );

    res.json({ 
      message: '¡Felicitaciones! Ahora eres Premium',
      user: result.rows[0],
      payment: {
        method: payment_method || 'ficticio',
        amount: 0, // Ficticio por ahora
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Error en upgrade:', error);
    res.status(500).json({ error: 'Error al procesar upgrade' });
  }
});

export default router;
