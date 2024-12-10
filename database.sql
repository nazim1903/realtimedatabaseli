-- Create database
CREATE DATABASE IF NOT EXISTS ttsubpmy_business_manager;
USE ttsubpmy_business_manager;

-- Customers table
CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    details TEXT,
    gold_karat VARCHAR(10),
    diamond_carat VARCHAR(10),
    diamond_type VARCHAR(50),
    size VARCHAR(20),
    deposit DECIMAL(10,2),
    total_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    deposit_transferred BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Order images table
CREATE TABLE order_images (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Products (Sales) table
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    product VARCHAR(255) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    profit DECIMAL(10,2) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date TIMESTAMP NOT NULL,
    description TEXT,
    type ENUM('incoming', 'outgoing', 'company_payment', 'personal_account', 'deposit') NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    order_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);