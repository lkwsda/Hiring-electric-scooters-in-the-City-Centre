package org.example.dao;

import org.example.model.Booking;
import org.example.model.RevenueReport;
import org.example.model.DailyRevenueReport;

import java.util.List;

public interface BookingDAO {
    // Create a new booking
    void createBooking(Booking booking);

    // Get bookings by user
    List<Booking> getBookingsByUserId(int userId);

    // Get booking status by ID
    String getBookingStatusById(int bookingId);

    // Update booking status (e.g., paid -> canceled)
    void updateBookingStatus(int bookingId, String status);

    java.util.List<RevenueReport> getWeeklyRevenueReport();

    // F10
    void updateEndTime(int bookingId, java.time.LocalDateTime endTime);

    // F11: Update total cost of an existing booking
    void updateBookingCost(int bookingId, java.math.BigDecimal newTotal);
    // Get a single booking by ID
    org.example.model.Booking getBookingById(int bookingId);

    // F20: Daily revenue report
    List<DailyRevenueReport> getDailyRevenueReport();

    // Calculate total rental minutes for a user in the past 7 days
    Integer getTotalRentalMinutesForUserLastWeek(int userId);
}