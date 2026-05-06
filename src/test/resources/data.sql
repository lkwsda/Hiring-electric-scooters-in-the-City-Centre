-- Test users
INSERT INTO users (username, email, password_hash, role, date_of_birth, credit_card_number) VALUES
('admin', 'admin@scooter.com', '123456', 'admin', '1990-01-01', NULL),
('student', 'student@test.com', '12345678', 'user', '2005-01-01', '1234567890123456'),
('grandpa', 'grandpa@test.com', '87654321', 'user', '1960-01-01', '6543210987654321'),
('testuser', 'test@test.com', 'password123', 'user', '1995-06-15', '1111222233334444');

-- Test scooters (6 scooters: 5 available + 1 maintenance)
INSERT INTO scooters (model, battery_level, latitude, longitude, status) VALUES
('EcoRide X1', 100, 53.8012, -1.5485, 'available'),
('EcoRide X2', 95, 53.8020, -1.5490, 'available'),
('EcoRide X3', 100, 53.8005, -1.5470, 'maintenance'),
('EcoRide X1', 85, 53.8030, -1.5500, 'available'),
('EcoRide X2', 50, 53.8040, -1.5510, 'available'),
('EcoRide X4', 30, 53.8050, -1.5520, 'available');

-- Test packages
INSERT INTO packages (package_type, price, description, discount_percent) VALUES
('1 Hour', 5.00, 'Basic rental for short trips', 0),
('4 Hours', 15.00, 'Discounted half-day rental', 0),
('1 Day', 30.00, 'Full day access for city explorers', 0),
('1 Week', 120.00, 'Premium weekly pass for commuters', 0);
