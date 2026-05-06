package org.example.service;

import org.example.model.Booking;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("NotificationService Unit Tests")
class NotificationServiceImplTest {

    private final NotificationServiceImpl notificationService = new NotificationServiceImpl();

    @Nested
    @DisplayName("sendBookingConfirmation")
    class SendBookingConfirmationTests {
        @Test
        @DisplayName("should not throw exception for valid booking")
        void shouldNotThrowForValidBooking() {
            Booking booking = new Booking();
            booking.setUserId(1);
            booking.setScooterId(5);
            booking.setTotalCost(new BigDecimal("15.00"));

            assertDoesNotThrow(() -> notificationService.sendBookingConfirmation(booking));
        }

        @Test
        @DisplayName("should handle null booking gracefully")
        void shouldHandleNullBooking() {
            assertThrows(NullPointerException.class,
                    () -> notificationService.sendBookingConfirmation(null));
        }
    }
}
