package org.example;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
// import logger
import java.util.logging.Logger;
import java.util.logging.Level;


/*
 java 与 mysql 连接
 */
public class Main {
    // Initialize the Logger for this class
    // 初始化当前类的日志记录器
    private static final Logger logger = Logger.getLogger(Main.class.getName());

    public static void main(String[] args) {
        // Define connection URL with Timezone configuration
        // 定义连接地址，并配置时区, 账户密码
        String url = "jdbc:mysql://localhost:3306/scooter_sharing?serverTimezone=UTC";
        String user = "root";
        String password = "123123";
        logger.info("Attempting to connecting to database...");

        // Use try-with-resources to ensure connection is closed automatically
        // 使用 try-with-resources 确保连接能自动关闭
        try (Connection connection = DriverManager.getConnection(url, user, password)) {
            if (connection != null) {
                logger.info("Database connection established successfully.");
                System.out.println("Result: Connection Success.");
            }
        }
        // Handle database connection errors
        // 处理数据库连接错误
        catch (SQLException e) {

            // Error log with SEVERE level
            // 记录严重级别的错误日志
            logger.log(Level.SEVERE, "Failed to connect to the database!", e);

            // Print the error details (在控制台打印出错误的小报告)
            e.printStackTrace();
        }
    }
}