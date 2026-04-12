package org.example.controller;

import org.example.model.Booking;
import org.example.model.RevenueReport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.example.service.BookingService;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // 下单：POST http://localhost:8080/api/bookings/place
    @PostMapping("/place")
    public Booking placeBooking(@RequestBody Booking booking) {
        bookingService.placeBooking(booking);
        return booking;
    }

    // 查看订单：GET http://localhost:8080/api/bookings/user/1
    @GetMapping("/user/{userId}")
    public List<Booking> getUserBookings(@PathVariable int userId) {

        return bookingService.getUserBookings(userId);
    }

    /**
     * F06: Payment Endpoint
     * 支付接口：接收订单ID和卡号
     */
    @PostMapping("/pay/{bookingId}")
    public String pay(@PathVariable int bookingId, @RequestParam String cardNumber) {
        bookingService.processPayment(bookingId, cardNumber);
        return "Payment Success! Your scooter is ready to ride.";
    }

    // 取消订单：POST http://localhost:8080/api/bookings/cancel/1
    @PostMapping("/cancel/{bookingId}")
    public String cancelBooking(@PathVariable int bookingId) {
        bookingService.cancelBooking(bookingId);
        return "Booking canceled successfully. The scooter is now available for others!";
    }

    // F19: 管理员查看周收入统计
    // GET http://localhost:8080/api/bookings/admin/revenue
    @GetMapping("/admin/revenue")
    public List<RevenueReport> getWeeklyRevenue() {
        return bookingService.getWeeklyRevenue();
    }

    // F10: 结束行程 http://localhost:8080/api/bookings/end/1
    @PostMapping("/end/{bookingId}")
    public String endTrip(@PathVariable int bookingId) {
        bookingService.endTrip(bookingId);
        return "Trip ended successfully! Scooter is now back in the garage.";
    }

    //F11: Extend duration
    @PostMapping("/extend/{bookingId}")
    public String extendBooking(@PathVariable int bookingId, @RequestParam java.math.BigDecimal extraCost) {
        bookingService.extendBooking(bookingId, extraCost);
        return "Booking extended! Additional cost added: " + extraCost;
    }
}