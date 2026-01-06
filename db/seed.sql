INSERT INTO users (email, password_hash, role, full_name, address, location_x, location_y)
VALUES
  ('admin@test.com',  'HASH_ME_LATER', 'ADMIN',    'Admin',  'Admin Street 1', 0, 0),
  ('owner@test.com',  'HASH_ME_LATER', 'OWNER',    'Owner',  'Owner Street 2', 2, 1),
  ('user@test.com',   'HASH_ME_LATER', 'CUSTOMER', 'User',   'User Street 3',  4, 2)
ON CONFLICT (email) DO NOTHING;

INSERT INTO restaurants (owner_id, name, cuisine, location_x, location_y)
VALUES
  ((SELECT id FROM users WHERE email='owner@test.com'), 'Pizza Bella', 'Italian', 2, 1)
ON CONFLICT DO NOTHING;

INSERT INTO dishes (restaurant_id, name, description, price_cents)
VALUES
  ((SELECT id FROM restaurants WHERE name='Pizza Bella'), 'Margherita', 'Classic pizza', 950),
  ((SELECT id FROM restaurants WHERE name='Pizza Bella'), 'Salami',     'Spicy salami',  1150);
