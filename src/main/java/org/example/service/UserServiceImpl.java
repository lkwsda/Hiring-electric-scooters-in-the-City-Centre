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
        // 格式校验 (Input Validation)

        // 检查密码长度 (Password Length >= 8)
        if (user.getPasswordHash() == null || user.getPasswordHash().length() < 8) {
            throw new RuntimeException("Validation Failed: Password must be at least 8 characters long!");
        }

        // 数据库唯一性校验 (Uniqueness Validation)

        // 检查用户名重复 (Username Check)
        if (userDAO.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Validation Failed: Username [" + user.getUsername() + "] is already taken!");
        }

        // 检查邮箱重复 (Email Check)
        if (userDAO.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Validation Failed: Email [" + user.getEmail() + "] is already registered!");
        }

        // 校验通过
        userDAO.addUser(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userDAO.getAllUsers();
    }

    @Override
    public User login(String username, String password) {
        // 去数据库里找这个名字的人
        User user = userDAO.getUserByName(username);

        // 验证：账号，密码
        if (user != null && user.getPasswordHash().equals(password)) {
            System.out.println("[Service] Login success! Role: " + user.getRole());
            return user; // 验证成功，把整个用户信息（包含 role）发给前端
        }

        // 验证失败
        throw new RuntimeException("Login Failed: Incorrect username or password!");
    }
}