package org.example.service;

import org.example.dao.BookingDAO;
import org.example.dao.PackageDAO;
import org.example.dao.ScooterDAO;
import org.example.dao.UserDAO;
import org.example.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BookingService Unit Tests")
class BookingServiceImplTest {

    @Mock
    private BookingDAO bookingDAO;

    @Mock
    private ScooterDAO scooterDAO;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private PackageDAO packageDAO;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserDAO userDAO;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private Booking createBooking() {
        Booking b = new Booking();
        b.setUserId(1);
        b.setScooterId(5);
        b.setPackageId(2);
        b.setTotalCost(new BigDecimal("50.00"));
        return b;
    }

    private Scooter createAvailableScooter() {
        Scooter s = new Scooter();
        s.setId(5);
        s.setStatus("available");
        return s;
    }

    private User createUser(int age) {
        User u = new User();
        u.setId(1);
        u.setDateOfBirth(LocalDate.now().minusYears(age));
        return u;
    }

    private RentalPackage createPackage() {
        RentalPackage p = new RentalPackage();
        p.setId(2);
        p.setPrice(new BigDecimal("50.00"));
        return p;
    }

    @Nested
    @DisplayName("placeBooking")
    class PlaceBookingTests {
        @Test
        @DisplayName("should place booking when all validations pass")
        void shouldPlaceBookingSuccessfully() {
            Booking booking = createBooking();
            Scooter scooter = createAvailableScooter();
            User user = createUser(30);
            RentalPackage pkg = createPackage();

            when(scooterDAO.getScooterById(5)).thenReturn(scooter);
            when(packageDAO.findById(2)).thenReturn(pkg);
            when(userDAO.getUserById(1)).thenReturn(user);
            when(bookingDAO.getTotalRentalMinutesForUserLastWeek(1)).thenReturn(0);

            bookingService.placeBooking(booking);

            verify(bookingDAO).createBooking(booking);
            verify(scooterDAO).updateScooterStatus(5, "rented");
            assertEquals("pending", booking.getStatus());
        }

        @Test
        @DisplayName("should reject non-existent scooter")
        void shouldRejectNonExistentScooter() {
            Booking booking = createBooking();
            when(scooterDAO.getScooterById(5)).thenReturn(null);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.placeBooking(booking));
            assertTrue(ex.getMessage().contains("not found"));
            verify(bookingDAO, never()).createBooking(any());
        }

        @Test
        @DisplayName("should reject unavailable scooter")
        void shouldRejectUnavailableScooter() {
            Booking booking = createBooking();
            Scooter scooter = createAvailableScooter();
            scooter.setStatus("rented");
            when(scooterDAO.getScooterById(5)).thenReturn(scooter);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.placeBooking(booking));
            assertTrue(ex.getMessage().contains("already in use"));
            verify(bookingDAO, never()).createBooking(any());
        }

        @Test
        @DisplayName("should apply 20 percent discount when weekly minutes exceed 480")
        void shouldApplyFrequentUserDiscount() {
            Booking booking = createBooking();
            booking.setTotalCost(null);
            Scooter scooter = createAvailableScooter();
            User user = createUser(30);
            RentalPackage pkg = createPackage();

            when(scooterDAO.getScooterById(5)).thenReturn(scooter);
            when(packageDAO.findById(2)).thenReturn(pkg);
            when(userDAO.getUserById(1)).thenReturn(user);
            when(bookingDAO.getTotalRentalMinutesForUserLastWeek(1)).thenReturn(500);

            bookingService.placeBooking(booking);

            assertEquals(0, booking.getTotalCost().compareTo(new BigDecimal("40.00")));
        }

        @Test
        @DisplayName("should apply student discount for users under 22")
        void shouldApplyStudentDiscount() {
            Booking booking = createBooking();
            booking.setTotalCost(null);
            Scooter scooter = createAvailableScooter();
            User user = createUser(20);
            RentalPackage pkg = createPackage();

            when(scooterDAO.getScooterById(5)).thenReturn(scooter);
            when(packageDAO.findById(2)).thenReturn(pkg);
            when(userDAO.getUserById(1)).thenReturn(user);
            when(bookingDAO.getTotalRentalMinutesForUserLastWeek(1)).thenReturn(0);

            bookingService.placeBooking(booking);

            assertEquals(0, booking.getTotalCost().compareTo(new BigDecimal("45.00")));
        }

        @Test
        @DisplayName("should apply senior discount for users over 60")
        void shouldApplySeniorDiscount() {
            Booking booking = createBooking();
            booking.setTotalCost(null);
            Scooter scooter = createAvailableScooter();
            User user = createUser(65);
            RentalPackage pkg = createPackage();

            when(scooterDAO.getScooterById(5)).thenReturn(scooter);
            when(packageDAO.findById(2)).thenReturn(pkg);
            when(userDAO.getUserById(1)).thenReturn(user);
            when(bookingDAO.getTotalRentalMinutesForUserLastWeek(1)).thenReturn(0);

            bookingService.placeBooking(booking);

            assertEquals(0, booking.getTotalCost().compareTo(new BigDecimal("45.00")));
        }

        @Test
        @DisplayName("should apply only 20 percent discount when both discounts eligible")
        void shouldApplyBestDiscountWhenBothEligible() {
            Booking booking = createBooking();
            booking.setTotalCost(null);
            Scooter scooter = createAvailableScooter();
            User user = createUser(20);
            RentalPackage pkg = createPackage();

            when(scooterDAO.getScooterById(5)).thenReturn(scooter);
            when(packageDAO.findById(2)).thenReturn(pkg);
            when(userDAO.getUserById(1)).thenReturn(user);
            when(bookingDAO.getTotalRentalMinutesForUserLastWeek(1)).thenReturn(500);

            bookingService.placeBooking(booking);

            assertEquals(0, booking.getTotalCost().compareTo(new BigDecimal("40.00")));
        }

        @Test
        @DisplayName("should handle null dateOfBirth gracefully")
        void shouldHandleNullDateOfBirth() {
            Booking booking = createBooking();
            booking.setTotalCost(null);
            Scooter scooter = createAvailableScooter();
            User user = new User();
            user.setId(1);
            RentalPackage pkg = createPackage();

            when(scooterDAO.getScooterById(5)).thenReturn(scooter);
            when(packageDAO.findById(2)).thenReturn(pkg);
            when(userDAO.getUserById(1)).thenReturn(user);
            when(bookingDAO.getTotalRentalMinutesForUserLastWeek(1)).thenReturn(0);

            assertDoesNotThrow(() -> bookingService.placeBooking(booking));
        }
    }

    @Nested
    @DisplayName("endTrip")
    class EndTripTests {
        @Test
        @DisplayName("should end trip and release scooter")
        void shouldEndTripAndReleaseScooter() {
            when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(10)))
                    .thenReturn(5);

            bookingService.endTrip(10);

            verify(scooterDAO).updateScooterStatus(5, "available");
            verify(bookingDAO).updateEndTime(eq(10), any());
        }

        @Test
        @DisplayName("should reject non-existent trip")
        void shouldRejectNonExistentTrip() {
            when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class), eq(99)))
                    .thenReturn(null);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.endTrip(99));
            assertTrue(ex.getMessage().contains("not found"));
        }
    }

    @Nested
    @DisplayName("processPayment")
    class ProcessPaymentTests {
        @Test
        @DisplayName("should process payment for pending booking")
        void shouldProcessPaymentSuccessfully() {
            Booking booking = createBooking();
            booking.setId(10);
            when(bookingDAO.getBookingStatusById(10)).thenReturn("pending");
            when(bookingDAO.getBookingById(10)).thenReturn(booking);

            bookingService.processPayment(10, "4111111111111111", 0.0);

            verify(bookingDAO).updateBookingStatus(10, "paid");
            verify(notificationService).sendBookingConfirmation(booking);
        }

        @Test
        @DisplayName("should reject null card number")
        void shouldRejectNullCardNumber() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.processPayment(10, null, 0.0));
            assertTrue(ex.getMessage().contains("card number"));
            verify(bookingDAO, never()).updateBookingStatus(anyInt(), anyString());
        }

        @Test
        @DisplayName("should reject empty card number")
        void shouldRejectEmptyCardNumber() {
            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.processPayment(10, "   ", 0.0));
            assertTrue(ex.getMessage().contains("card number"));
            verify(bookingDAO, never()).updateBookingStatus(anyInt(), anyString());
        }

        @Test
        @DisplayName("should reject payment for non-pending booking")
        void shouldRejectNonPendingPayment() {
            when(bookingDAO.getBookingById(10)).thenReturn(new Booking());
            when(bookingDAO.getBookingStatusById(10)).thenReturn("paid");

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.processPayment(10, "4111111111111111", 0.0));
            assertTrue(ex.getMessage().contains("PENDING"));
            verify(bookingDAO, never()).updateBookingStatus(anyInt(), anyString());
        }

        @Test
        @DisplayName("should reject payment for canceled booking")
        void shouldRejectCanceledPayment() {
            when(bookingDAO.getBookingById(10)).thenReturn(new Booking());
            when(bookingDAO.getBookingStatusById(10)).thenReturn("canceled");

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.processPayment(10, "4111111111111111", 0.0));
            assertTrue(ex.getMessage().contains("PENDING"));
            verify(bookingDAO, never()).updateBookingStatus(anyInt(), anyString());
        }
    }

    @Nested
    @DisplayName("getUserBookings")
    class GetUserBookingsTests {
        @Test
        @DisplayName("should return user bookings from DAO")
        void shouldReturnUserBookings() {
            List<Booking> bookings = Arrays.asList(createBooking(), createBooking());
            when(bookingDAO.getBookingsByUserId(1)).thenReturn(bookings);

            List<Booking> result = bookingService.getUserBookings(1);
            assertEquals(2, result.size());
        }
    }

    @Nested
    @DisplayName("cancelBooking")
    class CancelBookingTests {
        @Test
        @DisplayName("should cancel booking and release scooter")
        void shouldCancelAndReleaseScooter() {
            java.util.Map<String, Object> bookingData = new java.util.HashMap<>();
            bookingData.put("status", "paid");
            bookingData.put("scooter_id", 5);
            when(jdbcTemplate.queryForMap(anyString(), eq(10))).thenReturn(bookingData);

            bookingService.cancelBooking(10);

            verify(bookingDAO).updateBookingStatus(10, "canceled");
            verify(scooterDAO).updateScooterStatus(5, "available");
        }

        @Test
        @DisplayName("should cancel pending booking and release scooter")
        void shouldCancelPendingBookingAndReleaseScooter() {
            java.util.Map<String, Object> bookingData = new java.util.HashMap<>();
            bookingData.put("status", "pending");
            bookingData.put("scooter_id", 5);
            when(jdbcTemplate.queryForMap(anyString(), eq(10))).thenReturn(bookingData);

            bookingService.cancelBooking(10);

            verify(bookingDAO).updateBookingStatus(10, "canceled");
            verify(scooterDAO).updateScooterStatus(5, "available");
        }

        @Test
        @DisplayName("should reject canceling already canceled booking")
        void shouldRejectDoubleCancel() {
            java.util.Map<String, Object> bookingData = new java.util.HashMap<>();
            bookingData.put("status", "canceled");
            bookingData.put("scooter_id", 5);
            when(jdbcTemplate.queryForMap(anyString(), eq(10))).thenReturn(bookingData);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.cancelBooking(10));
            assertTrue(ex.getMessage().contains("already canceled"));
            verify(bookingDAO, never()).updateBookingStatus(anyInt(), anyString());
        }

        @Test
        @DisplayName("should reject canceling non-existent booking")
        void shouldRejectCancelNonExistent() {
            when(jdbcTemplate.queryForMap(anyString(), eq(99)))
                    .thenThrow(new RuntimeException("EmptyResultDataAccessException"));

            assertThrows(RuntimeException.class,
                    () -> bookingService.cancelBooking(99));
        }
    }

    @Nested
    @DisplayName("getWeeklyRevenue")
    class GetWeeklyRevenueTests {
        @Test
        @DisplayName("should return weekly revenue from DAO")
        void shouldReturnWeeklyRevenue() {
            List<RevenueReport> reports = Arrays.asList(new RevenueReport(), new RevenueReport());
            when(bookingDAO.getWeeklyRevenueReport()).thenReturn(reports);

            List<RevenueReport> result = bookingService.getWeeklyRevenue();
            assertEquals(2, result.size());
        }
    }

    @Nested
    @DisplayName("extendBooking")
    class ExtendBookingTests {
        @Test
        @DisplayName("should extend booking with extra cost")
        void shouldExtendBooking() {
            Booking booking = createBooking();
            booking.setId(10);
            booking.setStatus("paid");
            booking.setTotalCost(new BigDecimal("50.00"));
            when(bookingDAO.getBookingById(10)).thenReturn(booking);

            bookingService.extendBooking(10, new BigDecimal("10.00"));

            verify(bookingDAO).updateBookingCost(10, new BigDecimal("60.00"));
        }

        @Test
        @DisplayName("should reject extending non-existent booking")
        void shouldRejectExtendNonExistent() {
            when(bookingDAO.getBookingById(99)).thenReturn(null);

            assertThrows(RuntimeException.class,
                    () -> bookingService.extendBooking(99, new BigDecimal("10.00")));
        }

        @Test
        @DisplayName("should reject extending non-paid booking")
        void shouldRejectExtendNonPaid() {
            Booking booking = createBooking();
            booking.setId(10);
            booking.setStatus("pending");
            when(bookingDAO.getBookingById(10)).thenReturn(booking);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.extendBooking(10, new BigDecimal("10.00")));
            assertTrue(ex.getMessage().contains("ACTIVE"));
            verify(bookingDAO, never()).updateBookingCost(anyInt(), any());
        }
    }

    @Nested
    @DisplayName("adminProxyBooking")
    class AdminProxyBookingTests {
        @Test
        @DisplayName("should create proxy booking for guest")
        void shouldCreateProxyBooking() {
            Booking booking = createBooking();
            booking.setGuestName("John Doe");
            booking.setGuestPhone("1234567890");
            Scooter scooter = createAvailableScooter();

            when(scooterDAO.getScooterById(5)).thenReturn(scooter);

            bookingService.adminProxyBooking(booking);

            assertEquals("paid", booking.getStatus());
            verify(bookingDAO).createBooking(booking);
            verify(scooterDAO).updateScooterStatus(5, "rented");
        }

        @Test
        @DisplayName("should reject proxy booking without guest name")
        void shouldRejectMissingGuestName() {
            Booking booking = createBooking();

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.adminProxyBooking(booking));
            assertTrue(ex.getMessage().contains("Guest name"));
            verify(bookingDAO, never()).createBooking(any());
        }

        @Test
        @DisplayName("should reject proxy booking with empty guest name")
        void shouldRejectEmptyGuestName() {
            Booking booking = createBooking();
            booking.setGuestName("");

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.adminProxyBooking(booking));
            assertTrue(ex.getMessage().contains("Guest name"));
            verify(bookingDAO, never()).createBooking(any());
        }

        @Test
        @DisplayName("should reject proxy booking when scooter unavailable")
        void shouldRejectProxyUnavailableScooter() {
            Booking booking = createBooking();
            booking.setGuestName("John Doe");
            when(scooterDAO.getScooterById(5)).thenReturn(null);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> bookingService.adminProxyBooking(booking));
            assertTrue(ex.getMessage().contains("not available"));
            verify(bookingDAO, never()).createBooking(any());
        }
    }

    @Nested
    @DisplayName("getDailyRevenue")
    class GetDailyRevenueTests {
        @Test
        @DisplayName("should return 7-day report with all zeros when no data")
        void shouldReturnSevenDayReportWithZeros() {
            when(bookingDAO.getDailyRevenueReport()).thenReturn(Collections.emptyList());

            List<DailyRevenueReport> result = bookingService.getDailyRevenue();
            assertEquals(7, result.size());
            for (DailyRevenueReport r : result) {
                assertEquals(0, r.getDailyTotal().compareTo(BigDecimal.ZERO));
            }
        }

        @Test
        @DisplayName("should fill missing days with zero")
        void shouldFillMissingDaysWithZero() {
            DailyRevenueReport today = new DailyRevenueReport();
            today.setDate(LocalDate.now().toString());
            today.setDailyTotal(new BigDecimal("100.00"));
            when(bookingDAO.getDailyRevenueReport()).thenReturn(Arrays.asList(today));

            List<DailyRevenueReport> result = bookingService.getDailyRevenue();
            assertEquals(7, result.size());
            long zeroCount = result.stream()
                    .filter(r -> r.getDailyTotal().compareTo(BigDecimal.ZERO) == 0)
                    .count();
            assertEquals(6, zeroCount);
        }
    }
}
