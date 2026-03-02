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
        // 老公你看，一行代码就搞定了，不用再写长长的 try-catch 啦！
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

    // “内部小助理”：负责把数据库里的菜装进 User 盒子
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