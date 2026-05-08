package org.example.service;
import org.example.model.User;
import java.util.List;
import java.util.Map;

public interface UserService {
    void registerUser(User user, String confirmPassword);
    List<User> getAllUsers();
    User login(String username, String password);
    Map<String, Object> getDiscountRate(int userId);
}