package org.example;

import org.example.dao.UserDAO;
import org.example.model.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


@SpringBootApplication // 这个会自动扫描dao、model等包
public class ScooterApplication {
    public static void main(String[] args) {
        // “启动开关”
        SpringApplication.run(ScooterApplication.class, args);
    }

    // 自动创建admin
    @Bean
    public CommandLineRunner initAdmin(UserDAO userDAO) {
        return args -> {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

            // 检查：如果数据库里查不到 admin
            if (userDAO.getUserByName("admin") == null) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@scooter.com");
                // 设置初始密码 123456 并加密
                admin.setPasswordHash(encoder.encode("123456"));
                admin.setRole("admin");

                userDAO.addUser(admin);
                System.out.println(">>> [System] Initial Admin Account Created: admin / 123456");
            }
        };
    }
}