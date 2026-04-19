import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user profile with subscription and usage info
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info with subscription details
    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.account_type,
        u.subscription_expires_at,
        u.premium_balance,
        u.created_at,
        s.id as subscription_id,
        s.plan_type,
        s.start_date,
        s.end_date,
        s.is_active as subscription_active,
        s.auto_renew
      FROM users u
      LEFT JOIN subscriptions s ON u.subscription_id = s.id
      WHERE u.id = $1 AND u.is_active = true
    `;
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Get usage statistics
    const usageQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COALESCE(SUM(cost_total), 0) as total_cost,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as requests_last_week,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN cost_total ELSE 0 END), 0) as cost_last_week,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END), 0) as requests_last_month,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN cost_total ELSE 0 END), 0) as cost_last_month,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '365 days' THEN 1 ELSE 0 END), 0) as requests_last_year,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '365 days' THEN cost_total ELSE 0 END), 0) as cost_last_year
      FROM billing_usage
      WHERE user_id = $1
    `;
    const usageResult = await pool.query(usageQuery, [userId]);
    const usage = usageResult.rows[0];

    // Check if subscription is expired
    let subscriptionStatus = 'none';
    if (user.subscription_active && user.subscription_expires_at) {
      const now = new Date();
      const expiresAt = new Date(user.subscription_expires_at);
      subscriptionStatus = expiresAt > now ? 'active' : 'expired';
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        account_type: user.account_type,
        premium_balance: parseFloat(user.premium_balance || 0),
        created_at: user.created_at
      },
      subscription: user.subscription_id ? {
        id: user.subscription_id,
        plan_type: user.plan_type,
        start_date: user.start_date,
        end_date: user.end_date,
        expires_at: user.subscription_expires_at,
        is_active: user.subscription_active,
        auto_renew: user.auto_renew,
        status: subscriptionStatus
      } : null,
      usage: {
        total_requests: parseInt(usage.total_requests),
        total_cost: parseFloat(usage.total_cost),
        last_week: {
          requests: parseInt(usage.requests_last_week),
          cost: parseFloat(usage.cost_last_week)
        },
        last_month: {
          requests: parseInt(usage.requests_last_month),
          cost: parseFloat(usage.cost_last_month)
        },
        last_year: {
          requests: parseInt(usage.requests_last_year),
          cost: parseFloat(usage.cost_last_year)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Update user profile (username, email)
router.put('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username y email son requeridos' });
    }

    // Check if username or email already exist (excluding current user)
    const checkQuery = `
      SELECT id FROM users 
      WHERE (username = $1 OR email = $2) AND id != $3
    `;
    const checkResult = await pool.query(checkQuery, [username, email, userId]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Username o email ya están en uso' });
    }

    // Update user
    const updateQuery = `
      UPDATE users 
      SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, email, account_type
    `;
    const result = await pool.query(updateQuery, [username, email, userId]);

    res.json({ 
      message: 'Perfil actualizado exitosamente',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// Change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Get current password hash
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

// Get detailed usage history
router.get('/usage-history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT 
        id,
        action_type,
        cost,
        metadata,
        created_at
      FROM billing_usage
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    
    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM billing_usage WHERE user_id = $1';
    const countResult = await pool.query(countQuery, [userId]);

    res.json({
      history: result.rows.map(row => ({
        id: row.id,
        action_type: row.action_type,
        cost: parseFloat(row.cost),
        metadata: row.metadata,
        created_at: row.created_at
      })),
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error al obtener historial de uso:', error);
    res.status(500).json({ error: 'Error al obtener historial de uso' });
  }
});

// Subscribe to Premium plan
router.post('/subscribe', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { planType } = req.body; // '1_month', '6_months', '1_year'

    if (!['1_month', '6_months', '1_year'].includes(planType)) {
      return res.status(400).json({ error: 'Tipo de plan inválido' });
    }

    await client.query('BEGIN');

    // Calculate plan duration and cost
    let durationMonths;
    let cost = 5.00; // Base cost
    let credits = 4.00; // Credits for AI usage

    switch (planType) {
      case '1_month':
        durationMonths = 1;
        break;
      case '6_months':
        durationMonths = 6;
        cost = 25.00; // Discount
        credits = 20.00;
        break;
      case '1_year':
        durationMonths = 12;
        cost = 45.00; // Bigger discount
        credits = 36.00;
        break;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Deactivate any existing active subscriptions
    await client.query(
      'UPDATE subscriptions SET is_active = false WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    // Create new subscription
    const subQuery = `
      INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id
    `;
    const subResult = await client.query(subQuery, [userId, planType, startDate, endDate]);
    const subscriptionId = subResult.rows[0].id;

    // Update user account
    const updateUserQuery = `
      UPDATE users 
      SET 
        account_type = 'Premium',
        subscription_id = $1,
        subscription_expires_at = $2,
        premium_balance = premium_balance + $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, username, email, account_type, premium_balance, subscription_expires_at
    `;
    const userResult = await client.query(updateUserQuery, [
      subscriptionId,
      endDate,
      credits,
      userId
    ]);

    // Record billing transaction
    await client.query(
      `INSERT INTO billing_usage (user_id, action_type, cost, metadata)
       VALUES ($1, 'subscription', $2, $3)`,
      [userId, cost, JSON.stringify({ plan_type: planType, subscription_id: subscriptionId })]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Suscripción activada exitosamente',
      subscription: {
        id: subscriptionId,
        plan_type: planType,
        start_date: startDate,
        end_date: endDate,
        cost: cost,
        credits_added: credits
      },
      user: userResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al suscribirse:', error);
    res.status(500).json({ error: 'Error al procesar suscripción' });
  } finally {
    client.release();
  }
});

// Extend or renew subscription
router.post('/extend-subscription', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { planType } = req.body;

    if (!['1_month', '6_months', '1_year'].includes(planType)) {
      return res.status(400).json({ error: 'Tipo de plan inválido' });
    }

    await client.query('BEGIN');

    // Get current subscription
    const currentSubQuery = `
      SELECT s.*, u.subscription_expires_at
      FROM subscriptions s
      JOIN users u ON u.subscription_id = s.id
      WHERE s.user_id = $1 AND s.is_active = true
    `;
    const currentSubResult = await client.query(currentSubQuery, [userId]);

    let durationMonths;
    let cost = 5.00;
    let credits = 4.00;

    switch (planType) {
      case '1_month':
        durationMonths = 1;
        break;
      case '6_months':
        durationMonths = 6;
        cost = 25.00;
        credits = 20.00;
        break;
      case '1_year':
        durationMonths = 12;
        cost = 45.00;
        credits = 36.00;
        break;
    }

    let newEndDate;
    if (currentSubResult.rows.length > 0) {
      // Extend from current expiration date
      const currentExpiration = new Date(currentSubResult.rows[0].subscription_expires_at);
      const now = new Date();
      
      // If subscription is expired, start from now, otherwise from expiration date
      const baseDate = currentExpiration > now ? currentExpiration : now;
      newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

      // Update existing subscription
      await client.query(
        'UPDATE subscriptions SET end_date = $1, plan_type = $2 WHERE id = $3',
        [newEndDate, planType, currentSubResult.rows[0].id]
      );
    } else {
      // No active subscription, create new one
      newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + durationMonths);

      const subQuery = `
        INSERT INTO subscriptions (user_id, plan_type, start_date, end_date, is_active)
        VALUES ($1, $2, CURRENT_TIMESTAMP, $3, true)
        RETURNING id
      `;
      const subResult = await client.query(subQuery, [userId, planType, newEndDate]);
      
      await client.query(
        'UPDATE users SET subscription_id = $1 WHERE id = $2',
        [subResult.rows[0].id, userId]
      );
    }

    // Update user expiration and add credits
    await client.query(
      `UPDATE users 
       SET subscription_expires_at = $1, 
           premium_balance = premium_balance + $2,
           account_type = 'Premium',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newEndDate, credits, userId]
    );

    // Record billing
    await client.query(
      `INSERT INTO billing_usage (user_id, action_type, cost, metadata)
       VALUES ($1, 'subscription_extension', $2, $3)`,
      [userId, cost, JSON.stringify({ plan_type: planType })]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Suscripción extendida exitosamente',
      new_expiration_date: newEndDate,
      credits_added: credits,
      cost: cost
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al extender suscripción:', error);
    res.status(500).json({ error: 'Error al extender suscripción' });
  } finally {
    client.release();
  }
});

// Add credits to account (purchase credits without extending subscription)
router.post('/add-credits', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { amount } = req.body; // Amount in USD (e.g., 5, 10, 20)

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    // Validate amount (between $1 and $100)
    if (amount < 1 || amount > 100) {
      return res.status(400).json({ error: 'El monto debe estar entre $1 y $100' });
    }

    await client.query('BEGIN');

    // Get current user info
    const userQuery = await client.query(
      'SELECT account_type, premium_balance FROM users WHERE id = $1',
      [userId]
    );

    if (userQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userQuery.rows[0];

    // Update account to Premium if Basic
    if (user.account_type !== 'Premium') {
      await client.query(
        'UPDATE users SET account_type = $1 WHERE id = $2',
        ['Premium', userId]
      );
    }

    // Add credits to balance
    const creditsToAdd = amount * 0.8; // 80% of payment goes to credits
    await client.query(
      `UPDATE users 
       SET premium_balance = premium_balance + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING premium_balance`,
      [creditsToAdd, userId]
    );

    // Record transaction in billing
    await client.query(
      `INSERT INTO billing_usage (user_id, action_type, cost, metadata)
       VALUES ($1, 'credit_purchase', $2, $3)`,
      [userId, amount, JSON.stringify({ credits_added: creditsToAdd, amount_paid: amount })]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Créditos agregados exitosamente',
      amount_paid: amount,
      credits_added: creditsToAdd,
      new_balance: parseFloat(user.premium_balance) + creditsToAdd
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al agregar créditos:', error);
    res.status(500).json({ error: 'Error al agregar créditos' });
  } finally {
    client.release();
  }
});

export default router;
