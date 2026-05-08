package org.example;

import org.example.config.JwtFilter;
import org.example.dao.UserDAO;
import org.example.model.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


@SpringBootApplication // Auto-scans dao, model, and other packages
public class ScooterApplication {
    public static void main(String[] args) {
        // Launch switch
        SpringApplication.run(ScooterApplication.class, args);
    }

    @Bean
    public FilterRegistrationBean<JwtFilter> jwtFilterRegistration() {
        FilterRegistrationBean<JwtFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new JwtFilter());
        registration.addUrlPatterns("/api/*");
        registration.setOrder(1);
        return registration;
    }

    // Auto-create admin account on startup (only when UserDAO is available)
    @Bean
    @ConditionalOnBean(UserDAO.class)
    public CommandLineRunner initAdmin(UserDAO userDAO) {
        return args -> {
            BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

            // Check: if admin user doesn't exist in the database
            if (userDAO.getUserByName("admin") == null) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setEmail("admin@scooter.com");
                // Set initial password '123456' and encrypt it
                admin.setPasswordHash(encoder.encode("123456"));
                admin.setRole("admin");

                userDAO.addUser(admin);
                System.out.println(">>> [System] Initial Admin Account Created: admin / 123456");
            }
        };
    }
}