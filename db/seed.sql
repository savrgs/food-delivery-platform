INSERT INTO users (email, password_hash, role, full_name, address, location_x, location_y)
VALUES
  ('admin@test.com',  'HASH_ME_LATER', 'ADMIN',    'Admin',  'Admin Street 1', 0, 0),
  ('owner@test.com',  'HASH_ME_LATER', 'OWNER',    'Owner',  'Owner Street 2', 2, 1),
  ('user@test.com',   'HASH_ME_LATER', 'CUSTOMER', 'User',   'User Street 3',  5, 5)
ON CONFLICT (email) DO NOTHING;

INSERT INTO restaurants (owner_id, name, cuisine, cuisine_type, address, location_x, location_y)
VALUES
  ((SELECT id FROM users WHERE email='owner@test.com'), 'Pizza Bella', 'Italian', 'Italian', 'Bahnhofstraße 12, 9020 Klagenfurt', 3, 4),
  ((SELECT id FROM users WHERE email='owner@test.com'), 'Sushi Master', 'Japanese', 'Japanese', 'Herrengasse 8, 9020 Klagenfurt', 6, 7),
  ((SELECT id FROM users WHERE email='owner@test.com'), 'Burger Palace', 'American', 'American', 'Alter Platz 5, 9020 Klagenfurt', 8, 3),
  ((SELECT id FROM users WHERE email='owner@test.com'), 'Thai Garden', 'Asian', 'Thai', 'Paulitschgasse 22, 9020 Klagenfurt', 2, 8),
  ((SELECT id FROM users WHERE email='owner@test.com'), 'Döner König', 'Turkish', 'Turkish', 'Villacher Straße 15, 9020 Klagenfurt', 9, 9),
  ((SELECT id FROM users WHERE email='owner@test.com'), 'Pasta House', 'Italian', 'Italian', 'St. Veiter Ring 3, 9020 Klagenfurt', 4, 2)
ON CONFLICT DO NOTHING;

INSERT INTO dishes (restaurant_id, name, description, price_cents)
VALUES
  ((SELECT id FROM restaurants WHERE name='Pizza Bella'), 'Margherita', 'Classic pizza with tomato and mozzarella', 950),
  ((SELECT id FROM restaurants WHERE name='Pizza Bella'), 'Salami', 'Spicy salami pizza', 1150),
  ((SELECT id FROM restaurants WHERE name='Pizza Bella'), 'Quattro Formaggi', 'Four cheese pizza', 1250),
  ((SELECT id FROM restaurants WHERE name='Sushi Master'), 'Salmon Roll', 'Fresh salmon maki roll (8 pcs)', 1290),
  ((SELECT id FROM restaurants WHERE name='Sushi Master'), 'Dragon Roll', 'Eel and avocado roll', 1490),
  ((SELECT id FROM restaurants WHERE name='Sushi Master'), 'Miso Soup', 'Traditional Japanese soup', 390),
  ((SELECT id FROM restaurants WHERE name='Burger Palace'), 'Classic Burger', 'Beef patty with lettuce and tomato', 1090),
  ((SELECT id FROM restaurants WHERE name='Burger Palace'), 'Cheese Burger', 'With cheddar cheese', 1190),
  ((SELECT id FROM restaurants WHERE name='Burger Palace'), 'Fries', 'Crispy golden fries', 390),
  ((SELECT id FROM restaurants WHERE name='Thai Garden'), 'Pad Thai', 'Stir-fried rice noodles', 1290),
  ((SELECT id FROM restaurants WHERE name='Thai Garden'), 'Green Curry', 'Spicy Thai curry with chicken', 1390),
  ((SELECT id FROM restaurants WHERE name='Thai Garden'), 'Spring Rolls', 'Crispy vegetable rolls', 590),
  ((SELECT id FROM restaurants WHERE name='Döner König'), 'Döner Kebab', 'Classic döner in bread', 790),
  ((SELECT id FROM restaurants WHERE name='Döner König'), 'Döner Box', 'Döner with fries and salad', 990),
  ((SELECT id FROM restaurants WHERE name='Döner König'), 'Lahmacun', 'Turkish pizza', 690),
  ((SELECT id FROM restaurants WHERE name='Pasta House'), 'Spaghetti Carbonara', 'Creamy egg and bacon pasta', 1190),
  ((SELECT id FROM restaurants WHERE name='Pasta House'), 'Penne Arrabbiata', 'Spicy tomato pasta', 1090),
  ((SELECT id FROM restaurants WHERE name='Pasta House'), 'Tiramisu', 'Classic Italian dessert', 590);
