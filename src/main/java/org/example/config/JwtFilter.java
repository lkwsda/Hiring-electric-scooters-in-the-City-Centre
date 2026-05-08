package org.example.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.util.JwtUtil;
import java.io.IOException;
import java.util.Set;

public class JwtFilter implements Filter {

    private static final Set<String> PUBLIC_PATHS = Set.of(
        "/api/users/login",
        "/api/users/register"
    );

    private static boolean isPublic(String path) {
        if (path == null) return true;
        if (path.startsWith("/static/") || path.startsWith("/css/")
                || path.startsWith("/js/") || path.startsWith("/images/")
                || path.startsWith("/favicon") || path.equals("/")
                || path.endsWith(".html") || path.endsWith(".js")
                || path.endsWith(".css") || path.endsWith(".png")) {
            return true;
        }
        for (String publicPath : PUBLIC_PATHS) {
            if (path.equals(publicPath)) return true;
        }
        return false;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        String path = req.getRequestURI();

        if (isPublic(path)) {
            chain.doFilter(request, response);
            return;
        }

        String authHeader = req.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            res.setStatus(401);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Missing or invalid Authorization header\"}");
            return;
        }

        String token = authHeader.substring(7);
        if (!JwtUtil.isTokenValid(token)) {
            res.setStatus(401);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Token expired or invalid\"}");
            return;
        }

        // Store userId in request attribute for controllers
        req.setAttribute("userId", JwtUtil.getUserId(token));
        chain.doFilter(request, response);
    }
}
