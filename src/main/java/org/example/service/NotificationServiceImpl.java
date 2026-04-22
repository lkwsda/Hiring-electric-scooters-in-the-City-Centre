package org.example.service;
import org.example.model.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    // 获取一个日志记录器
    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);

    @Override
    public void sendBookingConfirmation(Booking booking) {
        // 准备内容
        String subject = "Your Scooter Booking is Confirmed!";
        String message = String.format(
                "Hello User #%d,\n" +
                        "Your booking for Scooter #%d is confirmed.\n" +
                        "Total cost: %.2f\n" +
                        "Thank you for choosing us",
                booking.getUserId(),
                booking.getScooterId(),
                booking.getTotalCost()
        );

        // F7 ：在日志里发邮件
        // Log the simulated email content for verification
        logger.info("--- SIMULATED EMAIL SENT ---");
        logger.info("Subject: {}", subject);
        logger.info("Body:\n{}", message);
        logger.info("----------------------------");
    }
}