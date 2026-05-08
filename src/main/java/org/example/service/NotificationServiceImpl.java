package org.example.service;
import org.example.model.Booking;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void sendBookingConfirmation(Booking booking) {
        String userEmail = getUserEmail(booking.getUserId());
        String subject = "Your Scooter Booking is Confirmed!";
        String message = String.format(
                "Hello,\n\n" +
                        "Your booking for Scooter #%d has been confirmed.\n" +
                        "Total cost: $%.2f\n\n" +
                        "Thank you for choosing Scooter Rental!",
                booking.getScooterId(),
                booking.getTotalCost()
        );

        // Always log to console for verification
        logger.info("--- CONFIRMATION EMAIL ---");
        logger.info("To: {}", userEmail != null ? userEmail : "(user email not found)");
        logger.info("Subject: {}", subject);
        logger.info("Body:\n{}", message);
        logger.info("---------------------------");

        if (userEmail != null && !userEmail.isBlank()) {
            try {
                SimpleMailMessage mailMessage = new SimpleMailMessage();
                mailMessage.setTo(userEmail);
                mailMessage.setFrom("noreply@scooter-rental.com");
                mailMessage.setSubject(subject);
                mailMessage.setText(message);
                mailSender.send(mailMessage);
                logger.info("Email sent successfully to {}", userEmail);
            } catch (Exception e) {
                logger.error("Failed to send email: {}", e.getMessage());
            }
        }
    }

    private String getUserEmail(int userId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT email FROM users WHERE id = ?",
                    String.class,
                    userId
            );
        } catch (Exception e) {
            logger.warn("Could not find email for user #{}: {}", userId, e.getMessage());
            return null;
        }
    }
}
