package org.example.controller;

import org.example.dao.UserDAO;
import org.example.model.User;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping("/register")
    public String registerUser(@RequestBody User newUser, @RequestParam String confirmPassword) {
        userService.registerUser(newUser, confirmPassword);
        return "Registration Successful for user: " + newUser.getUsername();
    }

    @PostMapping("/login")
    public java.util.Map<String, String> login(@RequestParam String username, @RequestParam String password) {
        String token = userService.login(username, password);

        // 用 Map 返回，Spring 会自动把它变成完美的 JSON 格式
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("token", token);
        return response;
    }
}