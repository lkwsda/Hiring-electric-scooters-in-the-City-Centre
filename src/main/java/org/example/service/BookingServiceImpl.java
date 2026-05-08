package org.example.service;

import org.example.dao.BookingDAO;
import org.example.dao.PackageDAO;
import org.example.dao.ScooterDAO;
import org.example.dao.UserDAO;
import org.example.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingDAO bookingDAO; // DAO for bookings

    @Autowired
    private ScooterDAO scooterDAO; // DAO for scooters

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PackageDAO packageDAO;

    @Autowired
    private NotificationService notificationService; // Notification service

    @Autowired
    private UserDAO userDAO;

    @Override
    @Transactional // All-or-nothing transaction
    public void placeBooking(Booking booking) {
        // Booking must include a packageId
        if (booking.getPackageId() == null) {
            throw new RuntimeException("Validation Failed: packageId is required to place a booking!");
        }
        // Check if scooter exists
        Scooter scooter = scooterDAO.getScooterById(booking.getScooterId());
        if (scooter == null) {
            throw new RuntimeException("Validation Failed: Scooter ID " + booking.getScooterId() + " not found!");
        }

        // Check if scooter is "available"
        if (!"available".equals(scooter.getStatus())) {
            throw new RuntimeException("Validation Failed: Scooter is already in use or under maintenance!");
        }

        // f22
        RentalPackage selectedPackage = packageDAO.findById(booking.getPackageId());
        BigDecimal originalPrice = selectedPackage.getPrice();

        User user = userDAO.getUserById(booking.getUserId());

        BigDecimal discountRate = BigDecimal.ONE;

        // Duration discount: if weekly usage exceeds 8 hours (480 minutes)
        int weeklyMinutes = bookingDAO.getTotalRentalMinutesForUserLastWeek(user.getId());
        if (weeklyMinutes > 480) {
            discountRate = new BigDecimal("0.8"); // 20% off
            System.out.println("[Service] Frequent User Discount (20%) applied!");
        }

        // Identity discount: student (<22) or senior (>60)
        if (user.getDateOfBirth() != null) {
            int age = java.time.Period.between(user.getDateOfBirth(), java.time.LocalDate.now()).getYears();
            if ((age < 22 || age > 60) && discountRate.compareTo(new BigDecimal("0.9")) > 0) {
                // Don't override if a better discount is already applied
                discountRate = new BigDecimal("0.9"); // 10% off
                System.out.println("[Service] Student/Senior Discount (10%) applied!");
            }
        }

        // Calculate final price after discount
        BigDecimal finalPrice = originalPrice.multiply(discountRate);

        // Set the calculated price back on the booking
        booking.setTotalCost(finalPrice);
        // Logic passed, create the booking
        booking.setStatus("pending");
        bookingDAO.createBooking(booking);

        // F10
        scooterDAO.updateScooterStatus(scooter.getId(), "rented");


        System.out.println("[Service] F10 Sync: Scooter #" + scooter.getId() + " status is now RENTED.");
    }

    // F10: End trip
    @Override
    @Transactional
    public void endTrip(int bookingId) {
        // Find scooter ID linked to this booking
        String findScooterSql = "SELECT scooter_id FROM bookings WHERE id = ?";
        Integer scooterId = jdbcTemplate.queryForObject(findScooterSql, Integer.class, bookingId);

        if (scooterId == null) {
            throw new RuntimeException("Error: Trip not found!");
        }

        // Set scooter back to 'available'
        scooterDAO.updateScooterStatus(scooterId, "available");

        // Record end time
        bookingDAO.updateEndTime(bookingId, java.time.LocalDateTime.now());

        // Set booking status to 'finished'
        bookingDAO.updateBookingStatus(bookingId, "finished");

        System.out.println("[Service] F10 Sync: Trip #" + bookingId + " has FINISHED.");
    }

    // F06: Simulated payment process
    @Override
    @Transactional
    public void processPayment(int bookingId, String cardNumber, double discountRate) {

        // Null check first
        if (cardNumber == null || cardNumber.trim().isEmpty()) {
            throw new RuntimeException("Validation Failed: Please enter card number!");
        }

        // Look up the booking
        Booking booking = bookingDAO.getBookingById(bookingId);

        // Check if user is admin; proxy bookings default to admin privilege
        boolean isAdmin = false;
        if (booking.getUserId() != null) {
            User user = userDAO.getUserById(booking.getUserId());
            if (user != null && "admin".equals(user.getRole())) {
                isAdmin = true;
            }
        } else {
            // F09: proxy bookings get payment validation bypass
            isAdmin = true;
        }

        if (!isAdmin) {
            if (!cardNumber.matches("\\d+")) {
                throw new RuntimeException("Validation Failed: Card number must contain only digits!");
            }
        }

        // Check current booking status
        String currentStatus = bookingDAO.getBookingStatusById(bookingId);

        // Only PENDING bookings can be paid
        if (!"pending".equals(currentStatus)) {
            throw new RuntimeException("Error: You can only pay for PENDING orders. Current status is: " + currentStatus);
        }

        // Apply discount to total cost
        if (discountRate > 0) {
            java.math.BigDecimal originalCost = booking.getTotalCost();
            java.math.BigDecimal discountFactor = java.math.BigDecimal.valueOf(1 - discountRate);
            java.math.BigDecimal discountedCost = originalCost.multiply(discountFactor);
            bookingDAO.updateBookingCost(bookingId, discountedCost);
            System.out.println("[Service] Discount applied: " + (discountRate * 100) + "%, new total: " + discountedCost);
        }

        // Status is correct, update to 'paid'
        bookingDAO.updateBookingStatus(bookingId, "paid");

        // F07: Send confirmation email after payment
        Booking paidBooking = bookingDAO.getBookingById(bookingId);
        notificationService.sendBookingConfirmation(paidBooking);
        System.out.println("[Service] Payment successful and confirmation email sent (simulated).");

        System.out.println("[Service] Payment processed for order #" + bookingId);
    }

    @Override
    public List<Booking> getUserBookings(int userId) {
        return bookingDAO.getBookingsByUserId(userId);
    }

    @Override
    @Transactional // Ensure status change + scooter release happen atomically
    public void cancelBooking(int bookingId) {
        String checkStatusSql = "SELECT status, scooter_id FROM bookings WHERE id = ?";

        java.util.Map<String, Object> bookingData;
        try {
            bookingData = jdbcTemplate.queryForMap(checkStatusSql, bookingId);
        } catch (Exception e) {
            throw new RuntimeException("Error: Booking ID " + bookingId + " not found!");
        }

        String currentStatus = (String) bookingData.get("status");
        Integer scooterId = (Integer) bookingData.get("scooter_id");

        // If already canceled, don't allow re-canceling
        // If already canceled, don't allow re-canceling to avoid releasing scooters wrongly.
        if ("canceled".equals(currentStatus)) {
            throw new RuntimeException("Validation Failed: This booking is already canceled!");
        }

        // Update status to 'canceled'
        bookingDAO.updateBookingStatus(bookingId, "canceled");

        // Release the scooter
        scooterDAO.updateScooterStatus(scooterId, "available");

        System.out.println("[Service] Order #" + bookingId + " canceled. Scooter #" + scooterId + " is released.");
    }

    @Override
    public List<RevenueReport> getWeeklyRevenue() {
        System.out.println("[Service] Generating weekly revenue report for Admin...");
        return bookingDAO.getWeeklyRevenueReport();
    }

    // F11: Extend booking
    @Override
    @Transactional
    public void extendBooking(int bookingId, java.math.BigDecimal extraCost) {
        // Fetch old booking
        Booking oldBooking = bookingDAO.getBookingById(bookingId);

        if (oldBooking == null) {
            throw new RuntimeException("Error: Booking not found!");
        }

        // Only PAID bookings can be extended
        if (!"paid".equals(oldBooking.getStatus())) {
            throw new RuntimeException("Error: Only ACTIVE (paid) bookings can be extended!");
        }

        // Calculate new total: old price + extra cost
        // Calculate new total cost using BigDecimal.add()
        java.math.BigDecimal newTotal = oldBooking.getTotalCost().add(extraCost);

        // Update database
        bookingDAO.updateBookingCost(bookingId, newTotal);

        System.out.println("[Service] F11: Booking #" + bookingId + " extended. New total: " + newTotal);
    }

    // F09: Admin proxy booking
    @Override
    @Transactional
    public void adminProxyBooking(Booking booking) {
        // Guest name is required
        if (booking.getGuestName() == null || booking.getGuestName().isEmpty()) {
            throw new RuntimeException("Admin Error: Guest name is required for proxy booking!");
        }

        // Check scooter availability
        Scooter scooter = scooterDAO.getScooterById(booking.getScooterId());
        if (scooter == null || !"available".equals(scooter.getStatus())) {
            throw new RuntimeException("Scooter not available!");
        }

        // Set status to 'paid' (admin proxy booking, already paid)
        booking.setStatus("paid");
        bookingDAO.createBooking(booking);

        // Lock the scooter
        scooterDAO.updateScooterStatus(scooter.getId(), "rented");

        System.out.println("[Service] Admin successfully booked for: " + booking.getGuestName());
    }

    // F20: Daily revenue report
    @Override
    public List<DailyRevenueReport> getDailyRevenue() {
        // Fetch daily revenue data from DAO
        List<DailyRevenueReport> rawReport = bookingDAO.getDailyRevenueReport();
        // Store in a map for fast lookup
        java.util.Map<String, java.math.BigDecimal> revenueMap = new java.util.HashMap<>();
        for (DailyRevenueReport report : rawReport) {
            revenueMap.put(report.getDate(), report.getDailyTotal());
        }
        // Create a 7-day report
        List<DailyRevenueReport> finalReport = new java.util.ArrayList<>();
        java.time.LocalDate today = java.time.LocalDate.now();

        for (int i = 0; i < 7; i++) {
            java.time.LocalDate date = today.minusDays(i);
            String dateString = date.toString();
            // Check if there's revenue for this day
            java.math.BigDecimal revenue = revenueMap.getOrDefault(dateString, java.math.BigDecimal.ZERO);

            // Create a record in the final report
            DailyRevenueReport daily = new DailyRevenueReport();
            daily.setDate(dateString);
            daily.setDailyTotal(revenue);
            finalReport.add(daily);
        }
        // Sort by date
        finalReport.sort(java.util.Comparator.comparing(DailyRevenueReport::getDate));

        return finalReport;
    }

}