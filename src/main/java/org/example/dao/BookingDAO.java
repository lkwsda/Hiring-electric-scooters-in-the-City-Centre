package org.example.dao;

import org.example.model.Booking;
import org.example.model.RevenueReport;
import org.example.model.DailyRevenueReport;

import java.util.List;

public interface BookingDAO {
    // Create a new booking 新建预订
    void createBooking(Booking booking);

    // Get bookings by user 查看某个用户的订单
    List<Booking> getBookingsByUserId(int userId);

    // Get booking status by ID 获取预订状态
    String getBookingStatusById(int bookingId);

    // Update booking status 改变预订状态，比如把“已支付”改成“已取消”
    void updateBookingStatus(int bookingId, String status);

    java.util.List<RevenueReport> getWeeklyRevenueReport();

    // F10
    void updateEndTime(int bookingId, java.time.LocalDateTime endTime);

    //f11
    // 更新已有订单的总费用
    void updateBookingCost(int bookingId, java.math.BigDecimal newTotal);
    //查询单个订单
    org.example.model.Booking getBookingById(int bookingId);

    // f20
    List<DailyRevenueReport> getDailyRevenueReport();

    // 计算某用户过去7天租车总时长（分钟）
    Integer getTotalRentalMinutesForUserLastWeek(int userId);
}