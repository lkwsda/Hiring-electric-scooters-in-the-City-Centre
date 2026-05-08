package org.example.controller;

import org.example.dao.UserDAO;
import org.example.model.User;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import org.example.util.JwtUtil;

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
    public Map<String, Object> login(@RequestParam String username, @RequestParam String password) {
        User user = userService.login(username, password);
        String token = JwtUtil.generateToken(user.getId(), user.getUsername(),
                user.getRole() != null ? user.getRole() : "user");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("token", token);
        result.put("user", user);
        return result;
    }

    @GetMapping("/{userId}/discount-rate")
    public Map<String, Object> getDiscountRate(@PathVariable int userId) {
        return userService.getDiscountRate(userId);
    }
}