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
        // 1. Proactive Validation (主动检查)
        if (userDAO.existsByUsername(user.getUsername())) {
            // 2. Throw an exception if duplicate
            // 如果重复了，直接抛出异常，不再执行后面的添加动作
            throw new RuntimeException("Validation Failed: Username [" + user.getUsername() + "] is already taken!");
        }

        // 3. Proceed only if valid (只有不重复才会走到这一步)
        userDAO.addUser(user);
    }

    @Override
    public List<User> getAllUsers() {
        return userDAO.getAllUsers();
    }
}