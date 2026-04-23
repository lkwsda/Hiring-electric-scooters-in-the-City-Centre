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
    private BookingDAO bookingDAO; // 呼叫订单

    @Autowired
    private ScooterDAO scooterDAO; // 呼叫车辆

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PackageDAO packageDAO;

    @Autowired
    private NotificationService notificationService; // ：呼叫邮差

    @Autowired
    private UserDAO userDAO;

    @Override
    @Transactional // 这个标签下面的动作要么全成功，要么全失败
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

        // f22
        RentalPackage selectedPackage = packageDAO.findById(booking.getPackageId());
        BigDecimal originalPrice = selectedPackage.getPrice();

        User user = userDAO.getUserById(booking.getUserId());

        BigDecimal discountRate = BigDecimal.ONE;

        // 时长折扣检查：每周超过 8 小时（480分钟）
        int weeklyMinutes = bookingDAO.getTotalRentalMinutesForUserLastWeek(user.getId());
        if (weeklyMinutes > 480) {
            discountRate = new BigDecimal("0.8"); // 8折
            System.out.println("[Service] Frequent User Discount (20%) applied!");
        }

        // 身份折扣检查：学生（<22岁）或老人（>60岁）
        if (user.getDateOfBirth() != null) {
            int age = java.time.Period.between(user.getDateOfBirth(), java.time.LocalDate.now()).getYears();
            if ((age < 22 || age > 60) && discountRate.compareTo(new BigDecimal("0.9")) > 0) {
                // 如果折扣更低，就不覆盖了
                discountRate = new BigDecimal("0.9"); // 9折
                System.out.println("[Service] Student/Senior Discount (10%) applied!");
            }
        }

        // 计算折扣后价格
        BigDecimal finalPrice = originalPrice.multiply(discountRate);

        // 把算好的价格塞回 booking 里
        booking.setTotalCost(finalPrice);
        // 逻辑通过，创建订单
        booking.setStatus("pending");
        bookingDAO.createBooking(booking);

        // F10
        scooterDAO.updateScooterStatus(scooter.getId(), "rented");


        System.out.println("[Service] F10 Sync: Scooter #" + scooter.getId() + " status is now RENTED.");
    }

    // f10结束订单
    @Override
    @Transactional
    public void endTrip(int bookingId) {
        // 找到订单关联的车 ID
        String findScooterSql = "SELECT scooter_id FROM bookings WHERE id = ?";
        Integer scooterId = jdbcTemplate.queryForObject(findScooterSql, Integer.class, bookingId);

        if (scooterId == null) {
            throw new RuntimeException("Error: Trip not found!");
        }

        // 结束时把车变回 'available'
        scooterDAO.updateScooterStatus(scooterId, "available");

        // 记录结束时间
        bookingDAO.updateEndTime(bookingId, java.time.LocalDateTime.now());

        System.out.println("[Service] F10 Sync: Trip #" + bookingId + " ended. Scooter #" + scooterId + " is now AVAILABLE.");
    }

    /**
     * F06: Simulated Payment Process
     * 模拟支付流程
     */
    @Override
    @Transactional
    public void processPayment(int bookingId, String cardNumber) {
        // 卡号不能为空
        if (cardNumber == null || cardNumber.trim().isEmpty()) {
            throw new RuntimeException("Validation Failed: Please enter card number!");
        }

        // 查查订单现在的状态
        // Get current status from database
        String currentStatus = bookingDAO.getBookingStatusById(bookingId);

        // 只有 PENDING 的订单才能付钱
        // 如果是 canceled 或者已经是 paid 了的，不能继续
        if (!"pending".equals(currentStatus)) {
            throw new RuntimeException("Error: You can only pay for PENDING orders. Current status is: " + currentStatus);
        }

        // 状态对，才更新为已支付
        bookingDAO.updateBookingStatus(bookingId, "paid");

        // F07 ：支付成功后，立刻发邮件
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
    @Transactional // 事务保证：改订单和放回车子必须同时成功！
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

        // 如果订单已经是 canceled 了，就直接报错
        // If already canceled, don't allow re-canceling to avoid releasing scooters wrongly.
        if ("canceled".equals(currentStatus)) {
            throw new RuntimeException("Validation Failed: This booking is already canceled!");
        }

        // 2. 只有是 'paid' 状态的订单，才执行取消动作
        bookingDAO.updateBookingStatus(bookingId, "canceled");

        // 3. 释放滑板车
        scooterDAO.updateScooterStatus(scooterId, "available");

        System.out.println("[Service] Order #" + bookingId + " canceled. Scooter #" + scooterId + " is released.");
    }

    @Override
    public List<RevenueReport> getWeeklyRevenue() {
        System.out.println("[Service] Generating weekly revenue report for Admin...");
        return bookingDAO.getWeeklyRevenueReport();
    }

    // f11 延长订单
    @Override
    @Transactional
    public void extendBooking(int bookingId, java.math.BigDecimal extraCost) {
        // 翻出旧账单
        Booking oldBooking = bookingDAO.getBookingById(bookingId);

        if (oldBooking == null) {
            throw new RuntimeException("Error: Booking not found!");
        }

        // 已经付过钱（paid）的订单才能延长
        if (!"paid".equals(oldBooking.getStatus())) {
            throw new RuntimeException("Error: Only ACTIVE (paid) bookings can be extended!");
        }

        // 计算新总价：旧价格 + 额外价格
        // Calculate new total cost using BigDecimal.add()
        java.math.BigDecimal newTotal = oldBooking.getTotalCost().add(extraCost);

        // 更新数据库
        bookingDAO.updateBookingCost(bookingId, newTotal);

        System.out.println("[Service] F11: Booking #" + bookingId + " extended. New total: " + newTotal);
    }

    // f09
    @Override
    @Transactional
    public void adminProxyBooking(Booking booking) {
        // 填写guest姓名或电话
        if (booking.getGuestName() == null || booking.getGuestName().isEmpty()) {
            throw new RuntimeException("Admin Error: Guest name is required for proxy booking!");
        }

        // 检查车子
        Scooter scooter = scooterDAO.getScooterById(booking.getScooterId());
        if (scooter == null || !"available".equals(scooter.getStatus())) {
            throw new RuntimeException("Scooter not available!");
        }

        // 设置状态为已支付（管理员代下，已经付过钱）
        booking.setStatus("paid");
        bookingDAO.createBooking(booking);

        // 锁车
        scooterDAO.updateScooterStatus(scooter.getId(), "rented");

        System.out.println("[Service] Admin successfully booked for: " + booking.getGuestName());
    }

    // f20
    @Override
    public List<DailyRevenueReport> getDailyRevenue() {
        // / 从DAO拿到有收入的那些天的数据
        List<DailyRevenueReport> rawReport = bookingDAO.getDailyRevenueReport();
        // 用Map把数据存起来，方便快速查找
        java.util.Map<String, java.math.BigDecimal> revenueMap = new java.util.HashMap<>();
        for (DailyRevenueReport report : rawReport) {
            revenueMap.put(report.getDate(), report.getDailyTotal());
        }
        // 创建有 7 天记录的报表
        List<DailyRevenueReport> finalReport = new java.util.ArrayList<>();
        java.time.LocalDate today = java.time.LocalDate.now();

        for (int i = 0; i < 7; i++) {
            java.time.LocalDate date = today.minusDays(i);
            String dateString = date.toString();
            // 检查这一天有没有收入
            java.math.BigDecimal revenue = revenueMap.getOrDefault(dateString, java.math.BigDecimal.ZERO);

            // 创建一个记录放进最终报表
            DailyRevenueReport daily = new DailyRevenueReport();
            daily.setDate(dateString);
            daily.setDailyTotal(revenue);
            finalReport.add(daily);
        }
        // 按日期排序传输
        finalReport.sort(java.util.Comparator.comparing(DailyRevenueReport::getDate));

        return finalReport;
    }

}