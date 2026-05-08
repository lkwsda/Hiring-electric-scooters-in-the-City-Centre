package org.example.service;

import org.example.model.Booking;
import org.example.model.RevenueReport;
import org.example.model.DailyRevenueReport;

import java.util.List;

public interface BookingService {
    // F05: Place a new booking
    void placeBooking(Booking booking);
    // F08: Get all bookings for a specific user
    List<Booking> getUserBookings(int userId);

    // F09: Cancel a booking
    void cancelBooking(int bookingId);

    //f7
    void processPayment(int bookingId, String cardNumber, double discountRate);

    // Admin: weekly revenue audit
    List<RevenueReport> getWeeklyRevenue();

    // F10: End a trip
    void endTrip(int bookingId);

    // F11: Extend booking
    void extendBooking(int bookingId, java.math.BigDecimal extraCost);

    // F09: Admin proxy booking
    void adminProxyBooking(Booking booking);

    // F20: Daily revenue report
    List<DailyRevenueReport> getDailyRevenue();

}