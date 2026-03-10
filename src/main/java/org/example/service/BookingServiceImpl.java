package org.example.service;

import org.example.dao.BookingDAO;
import org.example.dao.ScooterDAO;
import org.example.model.Booking;
import org.example.model.Scooter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingDAO bookingDAO; // 呼叫订单

    @Autowired
    private ScooterDAO scooterDAO; // 呼叫车辆

    @Override
    @Transactional // 这是“事务”标签。意思是下面的动作要么全成功，要么全失败，不能只成功一半！
    public void placeBooking(Booking booking) {
        // 检查车子存不存在
        Scooter scooter = scooterDAO.getScooterById(booking.getScooterId());
        if (scooter == null) {
            throw new RuntimeException("Validation Failed: Scooter ID " + booking.getScooterId() + " not found!");
        }

        // 检查车子是不是“空闲”状态 (available)
        if (!"available".equals(scooter.getStatus())) {
            throw new RuntimeException("Validation Failed: Scooter is already in use or under maintenance!");
        }

        // 逻辑通过，创建订单
        bookingDAO.createBooking(booking);

        // 关键动作：把车子锁起来，状态改成 'in_use'
        scooter.setStatus("in_use");
        scooterDAO.updateScooter(scooter);

        System.out.println("[Service] Successfully booked scooter #" + scooter.getId() + " for User #" + booking.getUserId());
    }

    @Override
    public List<Booking> getUserBookings(int userId) {
        return bookingDAO.getBookingsByUserId(userId);
    }
}