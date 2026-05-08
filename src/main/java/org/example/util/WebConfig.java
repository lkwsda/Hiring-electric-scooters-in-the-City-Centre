package org.example.util;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private JwtInterceptor jwtInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtInterceptor)
                //拦截所有路口 (/** 代表所有)
                .addPathPatterns("/**")
                // 排除登录和注册
                .excludePathPatterns("/api/users/login", "/api/users/register"); // 排除登录和注册，不然新客人进不来呀！
    }
}