package org.example.service;

import org.example.dao.UserDAO;
import org.example.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserDAO userDAO;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void registerUser(User user,String confirmPassword) {

        // Password length validation (F3 requirement)
        if (user.getPasswordHash() == null || user.getPasswordHash().length() < 6) {
            throw new RuntimeException("Validation Failed: Password must be at least 6 characters long");
        }

        // Check if the two passwords match
        if (!user.getPasswordHash().equals(confirmPassword)) {
            throw new RuntimeException("Validation Failed: Password and confirmation do not match");
        }


        // Check for duplicate username
        if (userDAO.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Validation Failed: Username [" + user.getUsername() + "] is already taken");
        }

        // Check for duplicate email
        if (userDAO.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Validation Failed: Email [" + user.getEmail() + "] is already registered");
        }

        // Card number format validation
        if (user.getCreditCardNumber() != null && !user.getCreditCardNumber().matches("\\d+")) {
            throw new RuntimeException("Validation Failed: Credit card number must contain only digits!");
        }

        // Hash the plain-text password
        String hashedPassword = passwordEncoder.encode(user.getPasswordHash());
        user.setPasswordHash(hashedPassword);

        // Validation passed, save user
        userDAO.addUser(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userDAO.getAllUsers();
    }


    @Override
    public User login(String username, String password) {
        User user = userDAO.getUserByName(username);

        // Verify username and password
        if (user != null && passwordEncoder.matches(password, user.getPasswordHash())) {
            System.out.println("[Service] Simple Login success! Role: " + user.getRole());
            return user;
        }

        throw new RuntimeException("Login Failed: Incorrect username or password!");
    }

    @Override
    public Map<String, Object> getDiscountRate(int userId) {
        User user = userDAO.getUserById(userId);
        if (user == null) {
            throw new RuntimeException("User not found: " + userId);
        }

        double rate = 0;
        String type = "none";
        String reason = "";

        if (user.getDateOfBirth() != null) {
            int age = java.time.Period.between(user.getDateOfBirth(), java.time.LocalDate.now()).getYears();
            if (age >= 60) {
                rate = 0.15;
                type = "senior";
                reason = "Senior discount (60+)";
            } else if (age < 22) {
                rate = 0.10;
                type = "student";
                reason = "Student discount (under 22)";
            }
        }

        Integer bookingCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM bookings WHERE user_id = ?", Integer.class, userId);
        int count = bookingCount != null ? bookingCount : 0;
        if (count >= 20 && rate < 0.20) {
            rate = 0.20;
            type = "high-frequency";
            reason = "High-frequency user discount (20+ bookings)";
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rate", rate);
        result.put("type", type);
        result.put("reason", reason);
        return result;
    }
}