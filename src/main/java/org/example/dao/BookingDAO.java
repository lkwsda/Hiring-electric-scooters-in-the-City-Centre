package org.example.dao;

import org.example.model.Booking;
import java.util.List;

public interface BookingDAO {
    // Create a new booking 新建预订
    void createBooking(Booking booking);

    // Get bookings by user 查看某个用户的订单
    List<Booking> getBookingsByUserId(int userId);

    // Update booking status 改变预订状态，比如把“已支付”改成“已取消”
    void updateBookingStatus(int bookingId, String status);
}