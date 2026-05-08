package org.example.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice // Global exception handler for all controllers
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class) // Catch all RuntimeExceptions
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        // Return 400 (client error) instead of 500 (server error)
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
}