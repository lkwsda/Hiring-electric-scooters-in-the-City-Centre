package org.example.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("GlobalExceptionHandler Unit Tests")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Nested
    @DisplayName("handleRuntimeException")
    class HandleRuntimeExceptionTests {
        @Test
        @DisplayName("should return 400 BAD_REQUEST with exception message")
        void shouldReturn400WithMessage() {
            RuntimeException ex = new RuntimeException("Something went wrong");

            ResponseEntity<String> response = handler.handleRuntimeException(ex);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertEquals("Something went wrong", response.getBody());
        }

        @Test
        @DisplayName("should return 400 for validation-style message")
        void shouldReturn400ForValidationMessage() {
            RuntimeException ex = new RuntimeException("Validation Failed: Password must be at least 6 characters long");

            ResponseEntity<String> response = handler.handleRuntimeException(ex);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertTrue(response.getBody().contains("Validation Failed"));
        }

        @Test
        @DisplayName("should handle null message gracefully")
        void shouldHandleNullMessage() {
            RuntimeException ex = new RuntimeException();

            ResponseEntity<String> response = handler.handleRuntimeException(ex);

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertNull(response.getBody());
        }
    }
}
