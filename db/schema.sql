-- ========== DATABASE SETUP FOR FRESHEATS ==========

-- ========== USERS TABLE ==========
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('CUSTOMER', 'OWNER', 'STAFF', 'ADMIN')),
  address VARCHAR(255),
  location_x DECIMAL(10, 6),
  location_y DECIMAL(10, 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== RESTAURANTS TABLE ==========
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cuisine VARCHAR(100),
  address VARCHAR(255),
  cuisine_type VARCHAR(100),
  location_x DECIMAL(10, 6) NOT NULL,
  location_y DECIMAL(10, 6) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  owner_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== DISHES TABLE ==========
CREATE TABLE dishes (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== ORDERS TABLE ==========
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')) DEFAULT 'PENDING',
  delivery_address VARCHAR(255),
  estimated_delivery_minutes INTEGER,
  total_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== ORDER ITEMS TABLE ==========
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id INTEGER NOT NULL REFERENCES dishes(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_cents_at_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (order_id, dish_id)
);

-- ========== RESTAURANT REVIEWS TABLE ==========
CREATE TABLE restaurant_reviews (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewer_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== DISH REVIEWS TABLE ==========
CREATE TABLE dish_reviews (
  id SERIAL PRIMARY KEY,
  dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewer_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== SEED DATA ==========

-- Insert test customers
INSERT INTO users (email, password_hash, full_name, role, address, location_x, location_y) VALUES
('customer1@test.com', '$2b$10$abc', 'John Doe', 'CUSTOMER', 'Herrengasse 42, Klagenfurt', 14.3150, 46.6233),
('customer2@test.com', '$2b$10$abc', 'Jane Smith', 'CUSTOMER', 'Neuer Platz 1, Klagenfurt', 14.3161, 46.6223);

-- Insert restaurants
INSERT INTO restaurants (name, cuisine, cuisine_type, address, location_x, location_y, is_active) VALUES
('Pizza Paradise', 'Italian', 'Italian', 'Karmeliterstraße 7, Klagenfurt', 14.3100, 46.6250, true),
('Sushi House', 'Japanese', 'Japanese', 'Bahnhofstraße 14, Klagenfurt', 14.3200, 46.6200, true),
('Burger King', 'American', 'Fast Food', 'Taunusstraße 5, Klagenfurt', 14.3050, 46.6280, true),
('Thai Palace', 'Thai', 'Thai', 'Villacher Straße 89, Klagenfurt', 14.3300, 46.6150, true);

-- Insert dishes for Pizza Paradise
INSERT INTO dishes (restaurant_id, name, description, price_cents, is_available) VALUES
(1, 'Margherita', 'Classic pizza with tomato and mozzarella', 999, true),
(1, 'Pepperoni', 'Pizza with pepperoni and cheese', 1199, true),
(1, 'Veggie Supreme', 'Pizza with seasonal vegetables', 1099, true);

-- Insert dishes for Sushi House
INSERT INTO dishes (restaurant_id, name, description, price_cents, is_available) VALUES
(2, 'California Roll', 'Crab, cucumber, avocado', 1299, true),
(2, 'Salmon Nigiri', 'Fresh salmon on rice', 1499, true),
(2, 'Spicy Tuna Roll', 'Spicy tuna with jalapeño', 1399, true);

-- Insert dishes for Burger King
INSERT INTO dishes (restaurant_id, name, description, price_cents, is_available) VALUES
(3, 'Whopper', 'Flame-grilled beef patty', 799, true),
(3, 'Double Whopper', 'Two flame-grilled beef patties', 999, true),
(3, 'Chicken Burger', 'Crispy fried chicken breast', 799, true);

-- Insert dishes for Thai Palace
INSERT INTO dishes (restaurant_id, name, description, price_cents, is_available) VALUES
(4, 'Pad Thai', 'Stir-fried rice noodles with shrimp', 1199, true),
(4, 'Green Curry', 'Spicy green curry with chicken', 1299, true),
(4, 'Tom Yum Soup', 'Hot and sour soup', 899, true);

-- ========== INDEXES (for performance) ==========
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_dishes_restaurant_id ON dishes(restaurant_id);
CREATE INDEX idx_reviews_restaurant ON restaurant_reviews(restaurant_id);
CREATE INDEX idx_reviews_dish ON dish_reviews(dish_id);
