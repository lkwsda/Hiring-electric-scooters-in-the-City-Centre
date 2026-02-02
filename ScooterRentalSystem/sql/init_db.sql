CREATE DATABASE IF NOT EXISTS scooter_sharing;
USE scooter_sharing;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,             -- Unique ID (身份证号)
    username VARCHAR(50) NOT NULL UNIQUE,          -- Name (用户名)
    email VARCHAR(100) NOT NULL UNIQUE,            -- Email (邮箱)
    password_hash VARCHAR(255) NOT NULL,           -- Password (加密后的密码)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Join time (加入时间)
);