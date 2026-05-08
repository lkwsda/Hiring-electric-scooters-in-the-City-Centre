package org.example.dao;

import org.example.model.User;
import java.util.List;

// UserDAO Interface - CRUD operations for users
public interface UserDAO {

    // Create: Add a new user to the database
    // Add a new user
    void addUser(User user);

    // Read: Find a user by their unique ID
    // Find user by ID
    User getUserById(int id);

    // Read: Fetch all users from the database
    // List all registered users
    List<User> getAllUsers();

    // Update: Modify an existing user's information
    // Update user info (e.g., email)
    void updateUser(User user);

    // Delete: Remove a user from the system
    // Remove user from the system
    void deleteUser(int id);

    // Check if username already exists
    // Check if username already exists
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    // Find a user by their unique username (for Login)
    // Find user by username (for login)
    User getUserByName(String username);
}