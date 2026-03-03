package org.example.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice // 这是一个专门抓取 Controller 跑出来的异常的东西的东西
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class) // 只要发生了 RuntimeException，就走这个方法
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        // Return a 400 Bad Request instead of 500 Error
        // 返回 400（客户端错误）而不是 500（服务器崩溃），这更专业！
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
    }
}