package org.example.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // 这串字符必须够长（至少32位）
    private final String SECRET_STRING = "ThisIsAMySuperSecretKeyForScooterProject2026!@#$";

    // 使用 Keys 工具类把字符串转化成符合 HS256 要求的安全密钥
    private final SecretKey KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());

    private final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10小时过期

    public String generateToken(String username){
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    // 用“钢印”去对比
                    .setSigningKey(KEY)
                    .build()
                    // 如果token是假的或者过期的，这一行会直接抛出异常
                    .parseClaimsJws(token);
            // 没异常，说明是真的
            return true;
        } catch (Exception e) {
            System.out.println("Security Alert: Invalid Token detected! " + e.getMessage());
            // 假token
            return false;
        }
    }
}