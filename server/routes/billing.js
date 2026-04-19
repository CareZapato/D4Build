import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/billing/log - Registrar uso de API
router.post('/log', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      provider,
      model,
      functionality,
      tokens_input,
      tokens_output,
      tokens_total,
      cost_input,
      cost_output,
      cost_total,
      category,
      operation
    } = req.body;

    await client.query('BEGIN');

    // Obtener usuario y su balance actual
    const userQuery = await client.query(
      'SELECT premium_balance, account_type FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userQuery.rows[0];
    const currentBalance = parseFloat(user.premium_balance || 0);
    const costTotal = parseFloat(cost_total || 0);

    // Verificar si tiene balance suficiente (solo para usuarios Premium)
    if (user.account_type === 'Premium') {
      if (currentBalance < costTotal) {
        await client.query('ROLLBACK');
        return res.status(402).json({ 
          error: 'Saldo insuficiente',
          message: `No tienes suficiente crédito. Balance actual: $${currentBalance.toFixed(4)}, Costo: $${costTotal.toFixed(4)}`,
          current_balance: currentBalance,
          required: costTotal,
          deficit: costTotal - currentBalance
        });
      }

      // Descontar del balance
      await client.query(
        'UPDATE users SET premium_balance = premium_balance - $1 WHERE id = $2',
        [costTotal, req.user.id]
      );
    } else {
      // Usuarios Basic no pueden usar funciones de IA
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        error: 'Cuenta Basic',
        message: 'Actualiza a Premium para usar funciones de IA'
      });
    }

    // Registrar el uso
    const result = await client.query(
      `INSERT INTO billing_usage 
       (user_id, provider, model, functionality, tokens_input, tokens_output, tokens_total,
        cost_input, cost_output, cost_total, category, operation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user.id,
        provider,
        model,
        functionality,
        tokens_input || 0,
        tokens_output || 0,
        tokens_total || 0,
        cost_input || 0,
        cost_output || 0,
        cost_total || 0,
        category,
        operation
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Uso registrado',
      entry: result.rows[0],
      new_balance: currentBalance - costTotal
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registrando uso:', error);
    res.status(500).json({ error: 'Error al registrar uso de API' });
  } finally {
    client.release();
  }
});

// GET /api/billing/my-usage - Obtener uso del usuario autenticado
router.get('/my-usage', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Obtener entradas
    const entries = await pool.query(
      `SELECT * FROM billing_usage 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // Obtener resumen
    const summary = await pool.query(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(tokens_total) as total_tokens,
        SUM(cost_total) as total_cost,
        json_object_agg(
          provider, 
          json_build_object(
            'requests', COUNT(*),
            'tokens', SUM(tokens_total),
            'cost', SUM(cost_total)
          )
        ) FILTER (WHERE provider IS NOT NULL) as by_provider
       FROM billing_usage 
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({
      entries: entries.rows,
      summary: summary.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo uso:', error);
    res.status(500).json({ error: 'Error al obtener historial de uso' });
  }
});

// GET /api/billing/stats - Estadísticas generales (solo admin en futuro)
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(*) as total_requests,
        SUM(tokens_total) as total_tokens,
        SUM(cost_total) as total_cost,
        AVG(cost_total) as avg_cost_per_request
      FROM billing_usage
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
