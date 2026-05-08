package org.example.dao;

import org.example.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Transactional
@DisplayName("UserDAO Integration Tests")
class UserDAOImplTest {

    @Autowired
    private UserDAO userDAO;

    @MockBean
    private JavaMailSender javaMailSender;

    @Nested
    @DisplayName("getUserById")
    class GetUserByIdTests {
        @Test
        @DisplayName("should return user when ID exists")
        void shouldReturnUserWhenIdExists() {
            User user = userDAO.getUserById(1);
            assertNotNull(user);
            assertEquals("admin", user.getUsername());
            assertEquals("admin@scooter.com", user.getEmail());
            assertEquals("admin", user.getRole());
        }

        @Test
        @DisplayName("should throw exception when ID does not exist")
        void shouldThrowExceptionWhenIdDoesNotExist() {
            assertThrows(Exception.class, () -> userDAO.getUserById(9999));
        }
    }

    @Nested
    @DisplayName("getAllUsers")
    class GetAllUsersTests {
        @Test
        @DisplayName("should return all seeded users")
        void shouldReturnAllSeededUsers() {
            List<User> users = userDAO.getAllUsers();
            assertNotNull(users);
            assertTrue(users.size() >= 4);
        }
    }

    @Nested
    @DisplayName("addUser")
    class AddUserTests {
        @Test
        @DisplayName("should persist new user with all fields")
        void shouldPersistNewUser() {
            User newUser = new User();
            newUser.setUsername("newuser");
            newUser.setEmail("new@test.com");
            newUser.setPasswordHash("secret123");
            newUser.setDateOfBirth(LocalDate.of(2000, 1, 15));
            newUser.setCreditCardNumber("9999888877776666");

            userDAO.addUser(newUser);

            User fetched = userDAO.getUserByName("newuser");
            assertNotNull(fetched);
            assertEquals("new@test.com", fetched.getEmail());
            assertEquals("user", fetched.getRole());
            assertNotNull(fetched.getDateOfBirth());
            assertEquals("9999888877776666", fetched.getCreditCardNumber());
        }
    }

    @Nested
    @DisplayName("existsByUsername")
    class ExistsByUsernameTests {
        @Test
        @DisplayName("should return true for existing username")
        void shouldReturnTrueForExistingUsername() {
            assertTrue(userDAO.existsByUsername("admin"));
        }

        @Test
        @DisplayName("should return false for non-existing username")
        void shouldReturnFalseForNonExistingUsername() {
            assertFalse(userDAO.existsByUsername("nonexistent_user_xyz"));
        }
    }

    @Nested
    @DisplayName("existsByEmail")
    class ExistsByEmailTests {
        @Test
        @DisplayName("should return true for existing email")
        void shouldReturnTrueForExistingEmail() {
            assertTrue(userDAO.existsByEmail("admin@scooter.com"));
        }

        @Test
        @DisplayName("should return false for non-existing email")
        void shouldReturnFalseForNonExistingEmail() {
            assertFalse(userDAO.existsByEmail("noone@nowhere.com"));
        }
    }

    @Nested
    @DisplayName("getUserByName")
    class GetUserByNameTests {
        @Test
        @DisplayName("should return user when username exists")
        void shouldReturnUserWhenUsernameExists() {
            User user = userDAO.getUserByName("student");
            assertNotNull(user);
            assertEquals("student", user.getUsername());
            assertEquals("student@test.com", user.getEmail());
        }

        @Test
        @DisplayName("should return null when username does not exist")
        void shouldReturnNullWhenUsernameDoesNotExist() {
            User user = userDAO.getUserByName("nonexistent");
            assertNull(user);
        }
    }

    @Nested
    @DisplayName("updateUser")
    class UpdateUserTests {
        @Test
        @DisplayName("should update user fields")
        void shouldUpdateUserFields() {
            User user = userDAO.getUserById(4);
            user.setUsername("updatedname");
            user.setEmail("updated@test.com");
            userDAO.updateUser(user);

            User updated = userDAO.getUserById(4);
            assertEquals("updatedname", updated.getUsername());
            assertEquals("updated@test.com", updated.getEmail());
        }
    }

    @Nested
    @DisplayName("deleteUser")
    class DeleteUserTests {
        @Test
        @DisplayName("should remove user from database")
        void shouldRemoveUser() {
            userDAO.deleteUser(4);
            assertThrows(Exception.class, () -> userDAO.getUserById(4));
        }
    }
}
