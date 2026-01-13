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

// ---- Health ----
app.get('/health', (req, res) => res.json({ status: 'ok' }));

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

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, full_name, address, location_x, location_y)
       VALUES ($1, $2, 'CUSTOMER', $3, $4, $5, $6)
       RETURNING id, email, role`,
      [
        email,
        password_hash,
        full_name || null,
        address || null,
        Number.isInteger(location_x) ? location_x : 0,
        Number.isInteger(location_y) ? location_y : 0,
      ]
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

// ---- Orders: Create (protected) ----
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
