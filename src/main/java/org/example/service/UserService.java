package org.example.service;
import org.example.model.User;
import java.util.List;

public interface UserService {
    void registerUser(User user, String confirmPassword);
    List<User> getAllUsers();
    User login(String username, String password);
}