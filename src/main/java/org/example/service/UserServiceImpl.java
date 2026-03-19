package org.example.service;

import org.example.dao.UserDAO;
import org.example.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service // 贴上这个标签，是“大堂经理”
public class UserServiceImpl implements UserService {

    @Autowired
    private UserDAO userDAO; // 经理指挥厨师

    @Override
    public void registerUser(User user) {
        // --- 1. 格式校验 (Input Validation) ---

        // 检查密码长度 (Password Length >= 8)
        if (user.getPasswordHash() == null || user.getPasswordHash().length() < 8) {
            throw new RuntimeException("Validation Failed: Password must be at least 8 characters long!");
        }

        // --- 2. 数据库唯一性校验 (Uniqueness Validation) ---

        // 检查用户名重复 (Username Check)
        if (userDAO.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Validation Failed: Username [" + user.getUsername() + "] is already taken!");
        }

        // 检查邮箱重复 (Email Check)
        if (userDAO.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Validation Failed: Email [" + user.getEmail() + "] is already registered!");
        }

        // --- 3. 校验通过，放行！ ---
        userDAO.addUser(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userDAO.getAllUsers();
    }
}