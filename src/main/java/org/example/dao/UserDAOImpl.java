package org.example.dao;

import org.example.model.User;
import org.example.util.CryptoUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository // Spring-managed data-access component
public class UserDAOImpl implements UserDAO {

    // Auto-wired JdbcTemplate
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Add: insert user
    @Override
    public void addUser(User user) {
        // SQL statement
        String sql = "INSERT INTO users (username, email, password_hash, role, date_of_birth, credit_card_number) VALUES (?, ?, ?, ?, ?, ?)";

        jdbcTemplate.update(sql,
                user.getUsername(),
                user.getEmail(),
                user.getPasswordHash(),
                "user", // Default role
                user.getDateOfBirth(), // Date of birth
                CryptoUtil.encrypt(user.getCreditCardNumber()) // Credit card number (encrypted storage)
        );
    }

    // Find: get user by ID
    @Override
    public User getUserById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        // queryForObject handles the ResultSet automatically
        return jdbcTemplate.queryForObject(sql, new UserRowMapper(), id);
    }

    // List: get all users
    @Override
    public List<User> getAllUsers() {
        String sql = "SELECT * FROM users";
        return jdbcTemplate.query(sql, new UserRowMapper());
    }

    // Update
    @Override
    public void updateUser(User user) {
        String sql = "UPDATE users SET username = ?, email = ? WHERE id = ?";
        jdbcTemplate.update(sql, user.getUsername(), user.getEmail(), user.getId());
    }

    // Delete
    @Override
    public void deleteUser(int id) {
        String sql = "DELETE FROM users WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public boolean existsByUsername(String username) {
        String sql = "SELECT count(*) FROM users WHERE username = ?";
        // queryForObject returns a single count value
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username);
        return count != null && count > 0;
    }

    @Override
    public boolean existsByEmail(String email) {
        // SQL: Count how many users have this email
        String sql = "SELECT count(*) FROM users WHERE email = ?";

        // Using jdbcTemplate to get the result
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);

        // Return true if count > 0
        return count != null && count > 0;
    }

    @Override
    public User getUserByName(String username) {
        String sql = "SELECT * FROM users WHERE username = ?";

        // Using query with RowMapper returns an empty list if not found, instead of throwing.
        List<User> users = jdbcTemplate.query(sql, new UserRowMapper(), username);

        // If the list is not empty, return the first user; otherwise null
        return users.isEmpty() ? null : users.get(0);
    }

    // Map database row to User object
    private static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getInt("id"));
            user.setUsername(rs.getString("username"));
            user.setEmail(rs.getString("email"));
            user.setPasswordHash(rs.getString("password_hash"));
            user.setRole(rs.getString("role"));

            if (rs.getDate("date_of_birth") != null) {
                // Convert database Date to Java LocalDate
                user.setDateOfBirth(rs.getDate("date_of_birth").toLocalDate());
            }
            if (rs.getString("credit_card_number") != null) {
                user.setCreditCardNumber(CryptoUtil.decrypt(rs.getString("credit_card_number")));
            }

            return user;
        }
    }
}