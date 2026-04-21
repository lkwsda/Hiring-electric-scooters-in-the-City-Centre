CREATE DATABASE IF NOT EXISTS scooter_sharing;
USE scooter_sharing;

# make sql clear
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS packages;
DROP TABLE IF EXISTS scooters;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

# Table: users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,             -- Unique ID
    username VARCHAR(50) NOT NULL UNIQUE,          -- Name
    email VARCHAR(100) NOT NULL UNIQUE,            -- Email
    password_hash VARCHAR(255) NOT NULL,           -- Password
    role ENUM('user', 'admin') DEFAULT 'user',     -- 区分普通用户和管理员
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Join time
);

# Table: scooters
CREATE TABLE scooters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model VARCHAR(50) NOT NULL,                -- Model name (型号，比如 "Xiaomi-Pro2")
    battery_level INT DEFAULT 100,             -- Battery 0-100 (电量)
    latitude DECIMAL(10, 8),                   -- GPS Latitude (纬度，用于地图显示)
    longitude DECIMAL(11, 8),                  -- GPS Longitude (经度)
    status ENUM('available', 'rented', 'maintenance') DEFAULT 'available', -- Status (状态：可用、租用、充电、维修)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_type VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    discount_percent INT DEFAULT 0 -- 默认是 0 (不打折)
);

#  Table: bookings
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,                      -- Linked to users.id (关联用户)
    scooter_id INT NOT NULL,                   -- Linked to scooters.id (关联车辆)
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Start time (开始时间)
    end_time TIMESTAMP NULL,                   -- End time (结束时间)
    total_cost DECIMAL(10, 2) DEFAULT 0.00,    -- Cost (总费用)
    status ENUM('pending', 'paid', 'canceled', 'finished') DEFAULT 'pending', -- 订单状态
    guest_name VARCHAR(50),  -- 被代下单的用户名
    guest_phone VARCHAR(20),   -- 被代下单的用户号码
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (scooter_id) REFERENCES scooters(id)
);

# Table:  issues   跟踪用户记录的问题/故障的表格
CREATE TABLE IF NOT EXISTS issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                  -- Who reported it? (谁报修的？)
    scooter_id INT NOT NULL,               -- Which scooter? (哪辆车坏了？)
    description TEXT NOT NULL,             -- What's the problem? (故障描述)
    status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending', -- Status (处理状态)
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',             -- Priority (优先级)
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (scooter_id) REFERENCES scooters(id)
);

/* ==============================================================
   DATA SEEDING (初始化预置数据)
   ============================================================== */

-- 预置管理员账号 (响应测试同学的需求！)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@scooter.com', '123456', 'admin');

-- 预置默认套餐
INSERT INTO packages (package_type, price, description,discount_percent) VALUES
                                                            ('1 Hour', 5.00, 'Basic rental for short trips', 0),
                                                            ('4 Hours', 15.00, 'Discounted half-day rental', 0),
                                                            ('1 Day', 30.00, 'Full day access for city explorers', 0),
                                                            ('1 Week', 120.00, 'Premium weekly pass for commuters', 20); -- 假设一周套餐有 8 折优惠，后续要改套餐折扣这里直接改


-- 预置滑板车数据
INSERT INTO scooters (model, battery_level, latitude, longitude, status) VALUES
     ('1', 100, 53.8012, -1.5485, 'available'),
     ('2', 95, 53.8020, -1.5490, 'available'),
     ('3', 100, 53.8005, -1.5470, 'maintenance'); -- 这辆是坏的，用来测拦截逻辑