package org.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication // 这个会自动扫描你的 dao、model 等包
public class ScooterApplication {
    public static void main(String[] args) {
        // “启动开关”
        SpringApplication.run(ScooterApplication.class, args);
    }
}