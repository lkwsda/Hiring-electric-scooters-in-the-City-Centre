package org.example.config;

import org.example.util.CryptoUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

@Configuration
public class CryptoConfig {

    @Value("${crypto.secret-key}")
    private String secretKey;

    @PostConstruct
    public void init() {
        CryptoUtil.setSecretKey(secretKey);
    }
}
