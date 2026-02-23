package org.example.dao;

import org.example.model.User;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * UserDAOImpl - The "Chef" who actually talks to the database.
 * UserDAOImpl - 真正的厨师，负责执行 SQL 语句与数据库沟通。
 */
public class UserDAOImpl implements UserDAO {
    // Database credentials (这里暂时用你 Main.java 里的那套)
    private final String url = "jdbc:mysql://localhost:3306/scooter_sharing?serverTimezone=UTC";
    private final String user = "root";
    private final String password = "123123";

    @Override
    public void addUser(User userEntity) {
        // SQL pattern: INSERT INTO table_name (columns) VALUES (values)
        String sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";

        // Try-with-resources: automatically closes connection and statement
        try (Connection conn = DriverManager.getConnection(url, user, password);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            // Setting values for the "?" placeholders
            // 为 SQL 语句里的问号占位符填入真正的值
            pstmt.setString(1, userEntity.getUsername());
            pstmt.setString(2, userEntity.getEmail());
            pstmt.setString(3, userEntity.getPasswordHash());

            // Execute the update (执行写入操作)
            int rowsAffected = pstmt.executeUpdate();
            if (rowsAffected > 0) {
                System.out.println("User added successfully via DAO!");
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // TODO: 实现其他的 getUserById, getAllUsers 等方法
    @Override
    public User getUserById(int id) { return null; }
    @Override
    public List<User> getAllUsers() { return new ArrayList<>(); }
    @Override
    public void updateUser(User user) { }
    @Override
    public void deleteUser(int id) { }
}