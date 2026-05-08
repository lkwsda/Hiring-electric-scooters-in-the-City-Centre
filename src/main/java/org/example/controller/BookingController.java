package org.example.controller;

import org.example.model.Booking;
import org.example.model.RevenueReport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.example.service.BookingService;
import org.example.model.DailyRevenueReport;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // Place booking: POST http://localhost:8080/api/bookings/place
    @PostMapping("/place")
    public Booking placeBooking(@RequestBody Booking booking) {
        bookingService.placeBooking(booking);
        return booking;
    }

    // View bookings: GET http://localhost:8080/api/bookings/user/1
    @GetMapping("/user/{userId}")
    public List<Booking> getUserBookings(@PathVariable int userId) {

        return bookingService.getUserBookings(userId);
    }

    // F06: Payment endpoint - receives booking ID and card number
    @PostMapping("/pay/{bookingId}")
    public String pay(@PathVariable int bookingId, @RequestParam String cardNumber,
                      @RequestParam(defaultValue = "0") double discountRate) {
        bookingService.processPayment(bookingId, cardNumber, discountRate);
        return "Payment Success! Your scooter is ready to ride.";
    }

    // Cancel booking: POST http://localhost:8080/api/bookings/cancel/1
    @PostMapping("/cancel/{bookingId}")
    public String cancelBooking(@PathVariable int bookingId) {
        bookingService.cancelBooking(bookingId);
        return "Booking canceled successfully. The scooter is now available for others!";
    }

    // F19: Admin weekly revenue statistics
    // GET http://localhost:8080/api/bookings/admin/revenue
    @GetMapping("/admin/revenue")
    public List<RevenueReport> getWeeklyRevenue() {
        return bookingService.getWeeklyRevenue();
    }

    // F10: End trip http://localhost:8080/api/bookings/end/1
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

    // F09: Admin proxy booking
    @PostMapping("/admin/place")
    public Booking adminPlaceBooking(@RequestBody Booking booking) {
        bookingService.adminProxyBooking(booking);
        return booking;
    }

    // F20: Daily revenue
    @GetMapping("/admin/revenue/daily")
    public List<DailyRevenueReport> getDailyRevenue() {
        return bookingService.getDailyRevenue();
    }
}