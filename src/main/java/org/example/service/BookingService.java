package org.example.service;

import org.example.model.Booking;
import org.example.model.RevenueReport;

import java.util.List;

public interface BookingService {
    // F05: Place a new booking 下单预订
    void placeBooking(Booking booking);
    // F08: Get all bookings for a specific user 查看用户的预订历史
    List<Booking> getUserBookings(int userId);

    // F09: Cancel a booking 取消预订
    void cancelBooking(int bookingId);

    void processPayment(int bookingId, String cardNumber);

    // 审核
    List<RevenueReport> getWeeklyRevenue();

    // F10: End a trip 结束行程
    void endTrip(int bookingId);

    // f11 延长订单
    void extendBooking(int bookingId, java.math.BigDecimal extraCost);

}