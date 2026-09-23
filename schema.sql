CREATE DATABASE IF NOT EXISTS item_purchase_db;
USE item_purchase_db;

CREATE TABLE IF NOT EXISTS item_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  item_type_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_available INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_stock CHECK (stock_available >= 0),
  FOREIGN KEY (item_type_id) REFERENCES item_types(id)
);

CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL UNIQUE,
  purchase_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_qty CHECK (quantity > 0),
  FOREIGN KEY (purchase_id) REFERENCES purchases(id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  UNIQUE KEY unique_purchase_item (purchase_id, item_id)
);

-- Sample data
INSERT INTO item_types (type_name) VALUES
  ('Electronics'), ('Furniture'), ('Clothing'), ('Grocery'), ('Stationery');

INSERT INTO items (name, item_type_id, purchase_date, unit_price, stock_available, active) VALUES
  ('Laptop', 1, '2026-01-10', 999.99, 10, TRUE),
  ('Mouse', 1, '2026-01-10', 25.00, 20, TRUE),
  ('Keyboard', 1, '2026-01-10', 45.00, 15, TRUE),
  ('Chair', 2, '2026-02-01', 120.00, 8, TRUE),
  ('Desk', 2, '2026-02-01', 250.00, 5, TRUE);
