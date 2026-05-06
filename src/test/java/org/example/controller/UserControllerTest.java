package org.example.controller;

import org.example.model.User;
import org.example.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@DisplayName("UserController Unit Tests")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Nested
    @DisplayName("GET /api/users")
    class GetAllUsersTests {
        @Test
        @DisplayName("should return user list")
        void shouldReturnUserList() throws Exception {
            User u1 = new User();
            u1.setUsername("alice");
            User u2 = new User();
            u2.setUsername("bob");
            when(userService.getAllUsers()).thenReturn(Arrays.asList(u1, u2));

            mockMvc.perform(get("/api/users"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("POST /api/users/register")
    class RegisterUserTests {
        @Test
        @DisplayName("should return success message on valid registration")
        void shouldRegisterSuccessfully() throws Exception {
            doNothing().when(userService).registerUser(any(User.class), eq("password123"));

            mockMvc.perform(post("/api/users/register")
                            .param("confirmPassword", "password123")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"newuser\",\"email\":\"new@test.com\",\"passwordHash\":\"password123\"}"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("Registration Successful")));
        }
    }

    @Nested
    @DisplayName("POST /api/users/login")
    class LoginTests {
        @Test
        @DisplayName("should return user on successful login")
        void shouldLoginSuccessfully() throws Exception {
            User user = new User();
            user.setUsername("testuser");
            when(userService.login("testuser", "password123")).thenReturn(user);

            mockMvc.perform(post("/api/users/login")
                            .param("username", "testuser")
                            .param("password", "password123"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.username").value("testuser"));
        }
    }

    @Nested
    @DisplayName("Error response paths (400 via GlobalExceptionHandler)")
    class ErrorResponseTests {
        @Test
        @DisplayName("should return 400 when register service throws")
        void shouldReturn400OnRegisterError() throws Exception {
            doThrow(new RuntimeException("Validation Failed: Username [existing] is already taken"))
                    .when(userService).registerUser(any(User.class), eq("password123"));

            mockMvc.perform(post("/api/users/register")
                            .param("confirmPassword", "password123")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"existing\",\"email\":\"e@test.com\",\"passwordHash\":\"password123\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Validation Failed: Username [existing] is already taken"));
        }

        @Test
        @DisplayName("should return 400 when login service throws")
        void shouldReturn400OnLoginError() throws Exception {
            when(userService.login("ghost", "wrongpass"))
                    .thenThrow(new RuntimeException("Login Failed: Incorrect username or password!"));

            mockMvc.perform(post("/api/users/login")
                            .param("username", "ghost")
                            .param("password", "wrongpass"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Login Failed: Incorrect username or password!"));
        }
    }
}
