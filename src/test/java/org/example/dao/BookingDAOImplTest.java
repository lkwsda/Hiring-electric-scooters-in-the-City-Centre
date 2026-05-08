package org.example.dao;

import org.example.model.Booking;
import org.example.model.DailyRevenueReport;
import org.example.model.RevenueReport;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Transactional
@DisplayName("BookingDAO Integration Tests")
class BookingDAOImplTest {

    @Autowired
    private BookingDAO bookingDAO;

    @MockBean
    private JavaMailSender javaMailSender;

    private Booking createTestBooking() {
        Booking booking = new Booking();
        booking.setUserId(1);
        booking.setScooterId(1);
        booking.setTotalCost(new BigDecimal("15.00"));
        booking.setStatus("pending");
        return booking;
    }

    @Nested
    @DisplayName("createBooking")
    class CreateBookingTests {
        @Test
        @DisplayName("should create booking and assign ID")
        void shouldCreateBookingAndAssignId() {
            Booking booking = createTestBooking();
            bookingDAO.createBooking(booking);
            assertNotNull(booking.getId());
            assertTrue(booking.getId() > 0);
        }

        @Test
        @DisplayName("should create booking with guest info for admin proxy")
        void shouldCreateBookingWithGuestInfo() {
            Booking booking = new Booking();
            booking.setScooterId(2);
            booking.setTotalCost(new BigDecimal("5.00"));
            booking.setStatus("paid");
            booking.setGuestName("Walk-in Customer");
            booking.setGuestPhone("07700900123");

            bookingDAO.createBooking(booking);
            assertNotNull(booking.getId());

            Booking fetched = bookingDAO.getBookingById(booking.getId());
            assertEquals("Walk-in Customer", fetched.getGuestName());
            assertEquals("07700900123", fetched.getGuestPhone());
        }
    }

    @Nested
    @DisplayName("getBookingsByUserId")
    class GetBookingsByUserIdTests {
        @Test
        @DisplayName("should return bookings for a specific user")
        void shouldReturnBookingsForUser() {
            Booking b1 = createTestBooking();
            bookingDAO.createBooking(b1);

            Booking b2 = createTestBooking();
            b2.setScooterId(2);
            bookingDAO.createBooking(b2);

            List<Booking> bookings = bookingDAO.getBookingsByUserId(1);
            assertEquals(2, bookings.size());
        }

        @Test
        @DisplayName("should return empty list for user with no bookings")
        void shouldReturnEmptyListForUserWithNoBookings() {
            List<Booking> bookings = bookingDAO.getBookingsByUserId(4);
            assertNotNull(bookings);
            assertTrue(bookings.isEmpty());
        }
    }

    @Nested
    @DisplayName("getBookingStatusById")
    class GetBookingStatusByIdTests {
        @Test
        @DisplayName("should return correct status")
        void shouldReturnCorrectStatus() {
            Booking booking = createTestBooking();
            bookingDAO.createBooking(booking);

            String status = bookingDAO.getBookingStatusById(booking.getId());
            assertEquals("pending", status);
        }
    }

    @Nested
    @DisplayName("updateBookingStatus")
    class UpdateBookingStatusTests {
        @Test
        @DisplayName("should update status from pending to paid")
        void shouldUpdateStatusToPaid() {
            Booking booking = createTestBooking();
            bookingDAO.createBooking(booking);

            bookingDAO.updateBookingStatus(booking.getId(), "paid");
            assertEquals("paid", bookingDAO.getBookingStatusById(booking.getId()));
        }

        @Test
        @DisplayName("should update status to canceled")
        void shouldUpdateStatusToCanceled() {
            Booking booking = createTestBooking();
            bookingDAO.createBooking(booking);

            bookingDAO.updateBookingStatus(booking.getId(), "canceled");
            assertEquals("canceled", bookingDAO.getBookingStatusById(booking.getId()));
        }
    }

    @Nested
    @DisplayName("updateEndTime")
    class UpdateEndTimeTests {
        @Test
        @DisplayName("should set end time on booking")
        void shouldSetEndTime() {
            Booking booking = createTestBooking();
            bookingDAO.createBooking(booking);

            LocalDateTime endTime = LocalDateTime.now().plusHours(2);
            bookingDAO.updateEndTime(booking.getId(), endTime);

            Booking updated = bookingDAO.getBookingById(booking.getId());
            assertNotNull(updated.getEndTime());
        }
    }

    @Nested
    @DisplayName("updateBookingCost")
    class UpdateBookingCostTests {
        @Test
        @DisplayName("should update total cost")
        void shouldUpdateTotalCost() {
            Booking booking = createTestBooking();
            bookingDAO.createBooking(booking);

            BigDecimal newCost = new BigDecimal("25.00");
            bookingDAO.updateBookingCost(booking.getId(), newCost);

            Booking updated = bookingDAO.getBookingById(booking.getId());
            assertEquals(newCost, updated.getTotalCost());
        }
    }

    @Nested
    @DisplayName("getBookingById")
    class GetBookingByIdTests {
        @Test
        @DisplayName("should return booking when ID exists")
        void shouldReturnBookingWhenIdExists() {
            Booking booking = createTestBooking();
            bookingDAO.createBooking(booking);

            Booking fetched = bookingDAO.getBookingById(booking.getId());
            assertNotNull(fetched);
            assertEquals(booking.getScooterId(), fetched.getScooterId());
            assertEquals(booking.getTotalCost(), fetched.getTotalCost());
        }

        @Test
        @DisplayName("should throw exception when ID does not exist")
        void shouldThrowExceptionWhenIdDoesNotExist() {
            assertThrows(Exception.class, () -> bookingDAO.getBookingById(9999));
        }
    }

    @Nested
    @DisplayName("getWeeklyRevenueReport")
    class GetWeeklyRevenueReportTests {
        @Test
        @DisplayName("should return revenue report for recent paid bookings")
        void shouldReturnRevenueReportForRecentPaidBookings() {
            Booking booking = createTestBooking();
            booking.setTotalCost(new BigDecimal("20.00"));
            bookingDAO.createBooking(booking);
            bookingDAO.updateBookingStatus(booking.getId(), "paid");

            List<RevenueReport> reports = bookingDAO.getWeeklyRevenueReport();
            assertNotNull(reports);
            assertFalse(reports.isEmpty());
            assertNull(reports.get(0).getPackageType());
        }
    }

    @Nested
    @DisplayName("getDailyRevenueReport")
    class GetDailyRevenueReportTests {
        @Test
        @DisplayName("should return daily revenue data")
        void shouldReturnDailyRevenueData() {
            Booking booking = createTestBooking();
            booking.setTotalCost(new BigDecimal("30.00"));
            bookingDAO.createBooking(booking);
            bookingDAO.updateBookingStatus(booking.getId(), "paid");

            List<DailyRevenueReport> reports = bookingDAO.getDailyRevenueReport();
            assertNotNull(reports);
            assertFalse(reports.isEmpty());
            assertNotNull(reports.get(0).getDate());
            assertEquals(0, new BigDecimal("30.00").compareTo(reports.get(0).getDailyTotal()));
        }
    }

    @Nested
    @DisplayName("getTotalRentalMinutesForUserLastWeek")
    class GetTotalRentalMinutesTests {
        @Test
        @DisplayName("should return 0 for user with no finished bookings")
        void shouldReturnZeroForUserWithNoFinishedBookings() {
            Integer minutes = bookingDAO.getTotalRentalMinutesForUserLastWeek(1);
            assertNotNull(minutes);
            assertEquals(0, minutes);
        }

        @Test
        @DisplayName("should calculate minutes for finished bookings in last 7 days")
        void shouldCalculateMinutesForFinishedBookings() {
            Booking booking = createTestBooking();
            booking.setStatus("finished");
            bookingDAO.createBooking(booking);
            // Set end_time to 1 hour after start
            bookingDAO.updateEndTime(booking.getId(),
                    java.time.LocalDateTime.now().plusHours(1));

            Integer minutes = bookingDAO.getTotalRentalMinutesForUserLastWeek(1);
            assertTrue(minutes > 0);
        }
    }
}
