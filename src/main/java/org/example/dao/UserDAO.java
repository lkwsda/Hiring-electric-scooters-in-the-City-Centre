package org.example.dao;

import org.example.model.User;
import java.util.List;

/**
 * UserDAO Interface - The Contract for database operations on Users.
 * 用户DAO接口 - 定义了对数据库中用户表的所有操作标准。
 */
public interface UserDAO {

    // 1. Create: Add a new user to the database
    // 【增】把一个新用户存进数据库
    void addUser(User user);

    // 2. Read: Find a user by their unique ID
    // 【查】根据身份证号（ID）找到那个用户
    User getUserById(int id);

    // 3. Read: Fetch all users from the database
    // 【查】把所有注册过的用户都列出来
    List<User> getAllUsers();

    // 4. Update: Modify an existing user's information
    // 【改】修改某个用户的资料（比如改个邮箱什么的）
    void updateUser(User user);

    // 5. Delete: Remove a user from the system
    // 【删】把这个用户从系统里抹掉（注销）
    void deleteUser(int id);
}