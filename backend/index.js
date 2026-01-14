require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// ----------------------------
// Auth middleware (JWT)
// ----------------------------
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'missing token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, role, email }
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ error: 'unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

// ----------------------------
// Distance → delivery estimate
// ----------------------------
function estimateDeliveryMinutes(user, restaurant) {
  const distance =
    Math.abs(user.location_x - restaurant.location_x) +
    Math.abs(user.location_y - restaurant.location_y);

  if (distance <= 3) return 20;
  if (distance <= 6) return 35;
  return 50;
}

function clampInt(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const xi = Math.trunc(x);
  if (xi < min || xi > max) return null;
  return xi;
}

// ---- Health ----
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// =====================================================
// PUBLIC: RESTAURANTS + DISHES
// =====================================================

// ---- Restaurants (public) ----
app.get('/restaurants', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, cuisine, location_x, location_y, is_active FROM restaurants WHERE is_active = true ORDER BY id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ---- Dishes for a restaurant (public) ----
app.get('/restaurants/:id/dishes', async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    if (!Number.isInteger(restaurantId)) {
      return res.status(400).json({ error: 'invalid restaurant id' });
    }

    const result = await pool.query(
      `SELECT id, restaurant_id, name, description, price_cents, is_available
       FROM dishes
       WHERE restaurant_id = $1 AND is_available = true
       ORDER BY id`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// =====================================================
// AUTH: REGISTER + LOGIN
// =====================================================

// ---- Auth: Register (customer) ----
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, full_name, address, location_x, location_y } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const lx = Number.isInteger(location_x) ? location_x : 0;
    const ly = Number.isInteger(location_y) ? location_y : 0;

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, address, location_x, location_y)
       VALUES ($1, $2, 'CUSTOMER', $3, $4, $5, $6)
       RETURNING id, email, role`,
      [email, password_hash, full_name || null, address || null, lx, ly]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Auth: Login ----
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================
// COMMON: PROFILE MANAGEMENT (protected)
// =====================================================

// ---- Profile: Get my profile ----
app.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, email, role, full_name, address, location_x, location_y
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'user not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Profile: Update my profile ----
app.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { full_name, address, location_x, location_y } = req.body;

    const lx = (location_x === undefined) ? null : clampInt(location_x, -100000, 100000);
    const ly = (location_y === undefined) ? null : clampInt(location_y, -100000, 100000);

    if (location_x !== undefined && lx === null) return res.status(400).json({ error: 'invalid location_x' });
    if (location_y !== undefined && ly === null) return res.status(400).json({ error: 'invalid location_y' });

    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($2, full_name),
           address   = COALESCE($3, address),
           location_x = COALESCE($4, location_x),
           location_y = COALESCE($5, location_y)
       WHERE id = $1
       RETURNING id, email, role, full_name, address, location_x, location_y`,
      [userId, full_name ?? null, address ?? null, lx, ly]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'user not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Profile: Change password ----
app.patch('/me/password', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({ error: 'old_password and new_password required' });
    }
    if (String(new_password).length < 6) {
      return res.status(400).json({ error: 'new_password must be at least 6 characters' });
    }

    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'user not found' });

    const ok = await bcrypt.compare(old_password, userResult.rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'old password incorrect' });

    const new_hash = await bcrypt.hash(new_password, 10);

    await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, new_hash]);
    res.json({ status: 'password_changed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================
// CUSTOMER: ORDERS + CART + TRACKING
// =====================================================

// ---- Orders: Create (protected) ----
// Body: { "restaurant_id": 1 }
app.post('/orders', requireAuth, async (req, res) => {
  try {
    const { restaurant_id } = req.body;

    if (!restaurant_id) {
      return res.status(400).json({ error: 'restaurant_id required' });
    }

    const userId = req.user.userId;

    const userResult = await pool.query(
      'SELECT id, location_x, location_y FROM users WHERE id = $1',
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'user not found' });
    }

    const restaurantResult = await pool.query(
      'SELECT id, location_x, location_y FROM restaurants WHERE id = $1 AND is_active = true',
      [restaurant_id]
    );
    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'restaurant not found' });
    }

    const user = userResult.rows[0];
    const restaurant = restaurantResult.rows[0];

    const estimated_delivery_min = estimateDeliveryMinutes(user, restaurant);

    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, restaurant_id, status, estimated_delivery_min)
       VALUES ($1, $2, 'PLACED', $3)
       RETURNING id, user_id, restaurant_id, status, estimated_delivery_min, created_at`,
      [user.id, restaurant.id, estimated_delivery_min]
    );

    res.status(201).json(orderResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Orders: List my orders (protected) ----
app.get('/orders', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, restaurant_id, status, estimated_delivery_min, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY id DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Orders: Get one order with items (protected) ----
app.get('/orders/:id', requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) {
      return res.status(400).json({ error: 'invalid order id' });
    }

    const userId = req.user.userId;

    const orderResult = await pool.query(
      `SELECT id, user_id, restaurant_id, status, estimated_delivery_min, created_at
       FROM orders
       WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'order not found (or not yours)' });
    }

    const itemsResult = await pool.query(
      `SELECT oi.dish_id, d.name, oi.quantity, oi.price_cents_at_order
       FROM order_items oi
       JOIN dishes d ON d.id = oi.dish_id
       WHERE oi.order_id = $1
       ORDER BY oi.dish_id`,
      [orderId]
    );

    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Orders: Add items to an order (protected) ----
// Body: { "dish_id": 1, "quantity": 2 }
app.post('/orders/:id/items', requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { dish_id, quantity } = req.body;

    if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'invalid order id' });
    if (!dish_id || !quantity) return res.status(400).json({ error: 'dish_id and quantity required' });
    if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ error: 'quantity must be a positive integer' });

    const userId = req.user.userId;

    const orderResult = await pool.query(
      'SELECT id, restaurant_id, status FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'order not found (or not yours)' });

    const order = orderResult.rows[0];
    if (order.status !== 'PLACED') return res.status(400).json({ error: 'cannot modify items after order is processed' });

    const restaurantId = order.restaurant_id;

    const dishResult = await pool.query(
      `SELECT id, restaurant_id, price_cents, is_available
       FROM dishes
       WHERE id = $1`,
      [dish_id]
    );
    if (dishResult.rows.length === 0) return res.status(404).json({ error: 'dish not found' });

    const dish = dishResult.rows[0];
    if (!dish.is_available) return res.status(400).json({ error: 'dish not available' });
    if (dish.restaurant_id !== restaurantId) return res.status(400).json({ error: 'dish does not belong to this order restaurant' });

    const upsert = await pool.query(
      `INSERT INTO order_items (order_id, dish_id, quantity, price_cents_at_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_id, dish_id)
       DO UPDATE SET quantity = order_items.quantity + EXCLUDED.quantity
       RETURNING order_id, dish_id, quantity, price_cents_at_order`,
      [orderId, dish_id, quantity, dish.price_cents]
    );

    res.status(201).json(upsert.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Cart: Modify quantity (protected) ----
// Body: { "dish_id": 1, "quantity": 3 }
app.patch('/orders/:id/items', requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { dish_id, quantity } = req.body;

    if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'invalid order id' });
    if (!dish_id || quantity === undefined) return res.status(400).json({ error: 'dish_id and quantity required' });
    if (!Number.isInteger(quantity) || quantity < 0) return res.status(400).json({ error: 'quantity must be integer >= 0' });

    const userId = req.user.userId;

    const orderResult = await pool.query(
      'SELECT id, status FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'order not found (or not yours)' });

    if (orderResult.rows[0].status !== 'PLACED') {
      return res.status(400).json({ error: 'cannot modify items after order is processed' });
    }

    if (quantity === 0) {
      const del = await pool.query(
        'DELETE FROM order_items WHERE order_id = $1 AND dish_id = $2 RETURNING order_id, dish_id',
        [orderId, dish_id]
      );
      if (del.rows.length === 0) return res.status(404).json({ error: 'item not found in order' });
      return res.json({ status: 'removed', ...del.rows[0] });
    }

    const upd = await pool.query(
      `UPDATE order_items
       SET quantity = $3
       WHERE order_id = $1 AND dish_id = $2
       RETURNING order_id, dish_id, quantity, price_cents_at_order`,
      [orderId, dish_id, quantity]
    );

    if (upd.rows.length === 0) return res.status(404).json({ error: 'item not found in order' });
    res.json(upd.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Cart: Remove item (protected) ----
app.delete('/orders/:id/items/:dishId', requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const dishId = Number(req.params.dishId);
    if (!Number.isInteger(orderId) || !Number.isInteger(dishId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const userId = req.user.userId;

    const orderResult = await pool.query(
      'SELECT id, status FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'order not found (or not yours)' });

    if (orderResult.rows[0].status !== 'PLACED') {
      return res.status(400).json({ error: 'cannot modify items after order is processed' });
    }

    const del = await pool.query(
      'DELETE FROM order_items WHERE order_id = $1 AND dish_id = $2 RETURNING order_id, dish_id',
      [orderId, dishId]
    );
    if (del.rows.length === 0) return res.status(404).json({ error: 'item not found in order' });

    res.json({ status: 'removed', ...del.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---- Order Tracking: Update status (protected) ----
// CUSTOMER: only CANCELLED
// OWNER/ADMIN: ACCEPTED, PREPARING, READY, DISPATCHED, DELIVERED, REJECTED
app.patch('/orders/:id/status', requireAuth, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(orderId)) return res.status(400).json({ error: 'invalid order id' });
    if (!status) return res.status(400).json({ error: 'status required' });

    const newStatus = String(status).toUpperCase();

    const customerAllowed = ['CANCELLED'];
    const staffAllowed = ['ACCEPTED', 'PREPARING', 'READY', 'DISPATCHED', 'DELIVERED', 'REJECTED'];

    const userId = req.user.userId;
    const role = req.user.role;

    if (role === 'CUSTOMER') {
      if (!customerAllowed.includes(newStatus)) return res.status(403).json({ error: 'customers can only cancel' });

      // customer can only cancel their own order
      const upd = await pool.query(
        `UPDATE orders
         SET status = $3
         WHERE id = $1 AND user_id = $2
         RETURNING id, user_id, restaurant_id, status, estimated_delivery_min, created_at`,
        [orderId, userId, newStatus]
      );
      if (upd.rows.length === 0) return res.status(404).json({ error: 'order not found (or not yours)' });
      return res.json(upd.rows[0]);
    }

    // staff (OWNER/ADMIN) – minimal implementation: allow update (you can later restrict to restaurant ownership)
    if (!staffAllowed.includes(newStatus)) return res.status(400).json({ error: 'invalid status' });

    const upd = await pool.query(
      `UPDATE orders
       SET status = $2
       WHERE id = $1
       RETURNING id, user_id, restaurant_id, status, estimated_delivery_min, created_at`,
      [orderId, newStatus]
    );

    if (upd.rows.length === 0) return res.status(404).json({ error: 'order not found' });
    res.json(upd.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================================================
// CUSTOMER: FEEDBACK (restaurant + dish reviews)
// =====================================================

// ---- Restaurant reviews: list (public) ----
app.get('/restaurants/:id/reviews', async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    if (!Number.isInteger(restaurantId)) return res.status(400).json({ error: 'invalid restaurant id' });

    const result = await pool.query(
      `SELECT id, restaurant_id, user_id, rating, comment, created_at
       FROM reviews
       WHERE restaurant_id = $1
       ORDER BY created_at DESC`,
      [restaurantId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});


// ---- Restaurant reviews: create (protected) ----
app.post('/restaurants/:id/reviews', requireAuth, async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);
    const { rating, comment } = req.body;

    if (!Number.isInteger(restaurantId)) return res.status(400).json({ error: 'invalid restaurant id' });

    const r = clampInt(rating, 1, 5);
    if (r === null) return res.status(400).json({ error: 'rating must be 1..5' });

    const userId = req.user.userId;

    const ins = await pool.query(
      `INSERT INTO reviews (restaurant_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, restaurant_id, user_id, rating, comment, created_at`,
      [restaurantId, userId, r, comment || null]
    );

    res.status(201).json(ins.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ---- Dish reviews: list (public) ----
app.get('/dishes/:id/reviews', async (req, res) => {
  try {
    const dishId = Number(req.params.id);
    if (!Number.isInteger(dishId)) return res.status(400).json({ error: 'invalid dish id' });

    const result = await pool.query(
      `SELECT id, dish_id, user_id, rating, comment, created_at
       FROM dish_reviews
       WHERE dish_id = $1
       ORDER BY created_at DESC`,
      [dishId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ---- Dish reviews: create (protected) ----
app.post('/dishes/:id/reviews', requireAuth, async (req, res) => {
  try {
    const dishId = Number(req.params.id);
    const { rating, comment } = req.body;

    if (!Number.isInteger(dishId)) return res.status(400).json({ error: 'invalid dish id' });

    const r = clampInt(rating, 1, 5);
    if (r === null) return res.status(400).json({ error: 'rating must be 1..5' });

    const userId = req.user.userId;

    // ensure dish exists
    const dishResult = await pool.query('SELECT id FROM dishes WHERE id = $1', [dishId]);
    if (dishResult.rows.length === 0) return res.status(404).json({ error: 'dish not found' });

    const ins = await pool.query(
      `INSERT INTO dish_reviews (dish_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, dish_id, user_id, rating, comment, created_at`,
      [dishId, userId, r, comment || null]
    );

    res.status(201).json(ins.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
