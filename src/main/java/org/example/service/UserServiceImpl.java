package org.example.service;

import org.example.dao.UserDAO;
import org.example.model.User;
import org.example.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserDAO userDAO;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    public void registerUser(User user,String confirmPassword) {

        // 密码长度校验 (F3 需求
        if (user.getPasswordHash() == null || user.getPasswordHash().length() < 6) {
            throw new RuntimeException("Validation Failed: Password must be at least 6 characters long");
        }

        // 双重确认校验 Check if the two passwords provided match.
        if (!user.getPasswordHash().equals(confirmPassword)) {
            throw new RuntimeException("Validation Failed: Password and confirmation do not match");
        }


        // 检查用户名重复 (Username Check)
        if (userDAO.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Validation Failed: Username [" + user.getUsername() + "] is already taken");
        }

        // 检查邮箱重复 (Email Check)
        if (userDAO.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Validation Failed: Email [" + user.getEmail() + "] is already registered");
        }

        // 卡号校验
        if (user.getCreditCardNumber() != null && !user.getCreditCardNumber().matches("\\d+")) {
            throw new RuntimeException("Validation Failed: Credit card number must contain only digits!");
        }

        // 隐藏明文
        String hashedPassword = passwordEncoder.encode(user.getPasswordHash());
        user.setPasswordHash(hashedPassword);

        // 校验通过
        userDAO.addUser(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userDAO.getAllUsers();
    }

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public String login(String username, String password) {
        User user = userDAO.getUserByName(username);

        // 验证：账号，密码
        if (user != null && passwordEncoder.matches(password, user.getPasswordHash())) {
            // 登录成功，返回 jwt
            return jwtUtil.generateToken(username);
        }

        throw new RuntimeException("Login Failed: Incorrect username or password!");
    }
}