package org.example.controller;

import org.example.dao.UserDAO;
import org.example.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController // 扫盲：告诉 Spring，“我是一个点餐柜台，我会把结果直接给客人”
@RequestMapping("/api/users") // 告诉客人：想找用户，请走这个“用户专用通道”
public class UserController {

    @Autowired
    private UserDAO userDAO; // 自动呼叫后厨的大厨

    // 客人访问：GET http://localhost:8080/api/users
    @GetMapping // 对应“查”的动作
    public List<User> getAllUsers() {
        System.out.println("[Controller] Someone is asking for user list!");
        return userDAO.getAllUsers(); // 让大厨去数据库搬人，并直接给客人
    }
}