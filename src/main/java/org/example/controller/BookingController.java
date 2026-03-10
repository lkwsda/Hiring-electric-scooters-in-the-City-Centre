package org.example.controller;

import org.example.model.Booking;
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
    public String placeBooking(@RequestBody Booking booking) {
        bookingService.placeBooking(booking);
        return "Booking placed successfully!";
    }

    // 查看订单：GET http://localhost:8080/api/bookings/user/1
    @GetMapping("/user/{userId}")
    public List<Booking> getUserBookings(@PathVariable int userId) {
        return bookingService.getUserBookings(userId);
    }
}