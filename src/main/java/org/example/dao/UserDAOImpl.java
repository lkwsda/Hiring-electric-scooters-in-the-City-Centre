package org.example.dao;

import org.example.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository //这个注解告诉 Spring Boot，“我是一名专门负责搬运数据的厨师”
public class UserDAOImpl implements UserDAO {

    // 自动配给你的“全自动洗衣机/厨具”
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 1. 【增】添加用户
    @Override
    public void addUser(User user) {
        String sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";

        jdbcTemplate.update(sql, user.getUsername(), user.getEmail(), user.getPasswordHash());
        System.out.println("[Spring Boot] User added: " + user.getUsername());
    }

    // 2. 【查】通过 ID 找人
    @Override
    public User getUserById(int id) {
        String sql = "SELECT * FROM users WHERE id = ?";
        // queryForObject 会自动帮我们处理托盘（ResultSet）
        return jdbcTemplate.queryForObject(sql, new UserRowMapper(), id);
    }

    // 3. 【查】拿所有人列表
    @Override
    public List<User> getAllUsers() {
        String sql = "SELECT * FROM users";
        return jdbcTemplate.query(sql, new UserRowMapper());
    }

    // 4. 【改】
    @Override
    public void updateUser(User user) {
        String sql = "UPDATE users SET username = ?, email = ? WHERE id = ?";
        jdbcTemplate.update(sql, user.getUsername(), user.getEmail(), user.getId());
    }

    // 5. 【删】
    @Override
    public void deleteUser(int id) {
        String sql = "DELETE FROM users WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public boolean existsByUsername(String username) {
        String sql = "SELECT count(*) FROM users WHERE username = ?";
        // queryForObject returns a single value (返回一个计数值)
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, username);
        return count != null && count > 0;
    }

    @Override
    public boolean existsByEmail(String email) {
        // SQL: Count how many users have this email
        // SQL语句：数一数数据库里有几个人的邮箱是这个
        String sql = "SELECT count(*) FROM users WHERE email = ?";

        // Using jdbcTemplate to get the result
        // 使用 jdbcTemplate 拿到那个计数值
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);

        // Return true if count > 0 (如果数出来大于0，说明已经有人占用了)
        return count != null && count > 0;
    }

    // 负责把数据库里的菜装进 User 盒子
    private static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getInt("id"));
            user.setUsername(rs.getString("username"));
            user.setEmail(rs.getString("email"));
            user.setPasswordHash(rs.getString("password_hash"));
            // 如果需要时间，也可以加：user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            return user;
        }
    }
}