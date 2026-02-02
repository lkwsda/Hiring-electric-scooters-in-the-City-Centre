CREATE DATABASE IF NOT EXISTS scooter_sharing;
USE scooter_sharing;

# Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,             -- Unique ID
    username VARCHAR(50) NOT NULL UNIQUE,          -- Name
    email VARCHAR(100) NOT NULL UNIQUE,            -- Email
    password_hash VARCHAR(255) NOT NULL,           -- Password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Join time
);

# Table: scooters
CREATE TABLE IF NOT EXISTS scooters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model VARCHAR(50) NOT NULL,                -- Model name (型号，比如 "Xiaomi-Pro2")
    battery_level INT DEFAULT 100,             -- Battery 0-100 (电量)
    latitude DECIMAL(10, 8),                   -- GPS Latitude (纬度，用于地图显示)
    longitude DECIMAL(11, 8),                  -- GPS Longitude (经度)
    status ENUM('available', 'in_use', 'charging', 'maintenance') DEFAULT 'available', -- Status (状态：可用、租用、充电、维修)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

#  Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,                      -- Linked to users.id (关联用户)
    scooter_id INT NOT NULL,                   -- Linked to scooters.id (关联车辆)
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Start time (开始时间)
    end_time TIMESTAMP NULL,                   -- End time (结束时间)
    total_cost DECIMAL(10, 2) DEFAULT 0.00,    -- Cost (总费用)
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