package org.example.service;

import org.example.dao.UserDAO;
import org.example.model.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceImplTest {

    @Mock
    private UserDAO userDAO;

    @InjectMocks
    private UserServiceImpl userService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private User createUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(username + "@test.com");
        user.setPasswordHash("password123");
        return user;
    }

    private User createUserWithEncodedPassword(String username) {
        User user = createUser(username);
        user.setPasswordHash(passwordEncoder.encode("password123"));
        return user;
    }

    @Nested
    @DisplayName("registerUser")
    class RegisterUserTests {
        @Test
        @DisplayName("should register user when all validations pass")
        void shouldRegisterUserSuccessfully() {
            User user = createUser("newuser");
            when(userDAO.existsByUsername("newuser")).thenReturn(false);
            when(userDAO.existsByEmail("newuser@test.com")).thenReturn(false);

            userService.registerUser(user, "password123");

            verify(userDAO).addUser(user);
        }

        @Test
        @DisplayName("should reject password shorter than 6 characters")
        void shouldRejectShortPassword() {
            User user = createUser("newuser");
            user.setPasswordHash("12345");

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> userService.registerUser(user, "12345"));
            assertTrue(ex.getMessage().contains("at least 6 characters"));
            verify(userDAO, never()).addUser(any());
        }

        @Test
        @DisplayName("should reject mismatched password confirmation")
        void shouldRejectMismatchedConfirmation() {
            User user = createUser("newuser");

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> userService.registerUser(user, "different"));
            assertTrue(ex.getMessage().contains("do not match"));
            verify(userDAO, never()).addUser(any());
        }

        @Test
        @DisplayName("should reject duplicate username")
        void shouldRejectDuplicateUsername() {
            User user = createUser("existing");
            when(userDAO.existsByUsername("existing")).thenReturn(true);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> userService.registerUser(user, "password123"));
            assertTrue(ex.getMessage().contains("already taken"));
            verify(userDAO, never()).addUser(any());
        }

        @Test
        @DisplayName("should reject duplicate email")
        void shouldRejectDuplicateEmail() {
            User user = createUser("newuser");
            when(userDAO.existsByUsername("newuser")).thenReturn(false);
            when(userDAO.existsByEmail("newuser@test.com")).thenReturn(true);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> userService.registerUser(user, "password123"));
            assertTrue(ex.getMessage().contains("already registered"));
            verify(userDAO, never()).addUser(any());
        }

        @Test
        @DisplayName("should reject non-numeric credit card")
        void shouldRejectNonNumericCard() {
            User user = createUser("newuser");
            user.setCreditCardNumber("abcd-efgh-ijkl-mnop");
            when(userDAO.existsByUsername("newuser")).thenReturn(false);
            when(userDAO.existsByEmail("newuser@test.com")).thenReturn(false);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> userService.registerUser(user, "password123"));
            assertTrue(ex.getMessage().contains("digits"));
            verify(userDAO, never()).addUser(any());
        }
    }

    @Nested
    @DisplayName("login")
    class LoginTests {
        @Test
        @DisplayName("should return user when credentials match")
        void shouldReturnUserWhenCredentialsMatch() {
            User user = createUserWithEncodedPassword("testuser");
            when(userDAO.getUserByName("testuser")).thenReturn(user);

            User result = userService.login("testuser", "password123");
            assertNotNull(result);
            assertEquals("testuser", result.getUsername());
        }

        @Test
        @DisplayName("should reject wrong password")
        void shouldRejectWrongPassword() {
            User user = createUserWithEncodedPassword("testuser");
            when(userDAO.getUserByName("testuser")).thenReturn(user);

            assertThrows(RuntimeException.class,
                    () -> userService.login("testuser", "wrongpassword"));
        }

        @Test
        @DisplayName("should reject non-existing username")
        void shouldRejectNonExistingUsername() {
            when(userDAO.getUserByName("ghost")).thenReturn(null);

            assertThrows(RuntimeException.class,
                    () -> userService.login("ghost", "password123"));
        }
    }

    @Nested
    @DisplayName("getAllUsers")
    class GetAllUsersTests {
        @Test
        @DisplayName("should return all users from DAO")
        void shouldReturnAllUsers() {
            List<User> mockUsers = Arrays.asList(createUser("u1"), createUser("u2"));
            when(userDAO.getAllUsers()).thenReturn(mockUsers);

            List<User> result = userService.getAllUsers();
            assertEquals(2, result.size());
            verify(userDAO).getAllUsers();
        }
    }
}
