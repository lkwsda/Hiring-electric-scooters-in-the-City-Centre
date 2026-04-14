package org.example.dao;

import org.example.model.Booking;
import org.example.model.RevenueReport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import org.example.model.DailyRevenueReport;

@Repository
public class BookingDAOImpl implements BookingDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void createBooking(Booking booking) {
        String sql = "INSERT INTO bookings (user_id, scooter_id, total_cost, status, guest_name, guest_phone) VALUES (?, ?, ?, ?, ?, ?)";

        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        // 插入数据
        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement ps = connection.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            if (booking.getUserId() != null) {
                ps.setInt(1, booking.getUserId());
            } else {
                ps.setNull(1, java.sql.Types.INTEGER);
            }
            ps.setInt(2, booking.getScooterId());
            ps.setBigDecimal(3, booking.getTotalCost());
            ps.setString(4, booking.getStatus());

            ps.setString(5, booking.getGuestName());
            ps.setString(6, booking.getGuestPhone());
            return ps;
        }, keyHolder);

        // 把领回来的单号塞进 Booking 盒子里
        if (keyHolder.getKey() != null) {
            booking.setId(keyHolder.getKey().intValue());
        }

        System.out.println("[DAO] Booking Created! ID: " + booking.getId() + ", Guest: " + booking.getGuestName());

    }

    @Override
    public List<Booking> getBookingsByUserId(int userId) {
        String sql = "SELECT * FROM bookings WHERE user_id = ?";
        return jdbcTemplate.query(sql, new BookingRowMapper(), userId);
    }

    @Override
    public void updateBookingStatus(int bookingId, String status) {
        // Update the status column for a specific booking ID
        String sql = "UPDATE bookings SET status = ? WHERE id = ?";
        jdbcTemplate.update(sql, status, bookingId);
        System.out.println("[DAO] Booking ID " + bookingId + " status updated to: " + status);
    }

    @Override
    public String getBookingStatusById(int bookingId) {
        String sql = "SELECT status FROM bookings WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, String.class, bookingId);
    }

    @Override
    public List<RevenueReport> getWeeklyRevenueReport() {
        // f19 把订单、车辆、套餐表三表合一，算出每种套餐这周赚了多少钱。
        String sql = "SELECT p.package_type, COUNT(b.id) as order_count, SUM(b.total_cost) as revenue " +
                "FROM bookings b " +
                "JOIN scooters s ON b.scooter_id = s.id " +
                "JOIN packages p ON s.model = p.package_type " + // 这里的关联逻辑可以根据实际业务调整
                "WHERE b.status IN ('paid', 'finished') " +
                "AND b.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
                "GROUP BY p.package_type";

        // 目前数据库表关联很简单，演示 SQL如下
        String simpleSql = "SELECT '1 Hour' as package_type, COUNT(*) as order_count, SUM(total_cost) as revenue " +
                "FROM bookings WHERE status = 'paid' AND start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)";

        return jdbcTemplate.query(simpleSql, (rs, rowNum) -> {
            RevenueReport report = new RevenueReport();
            report.setPackageType(rs.getString("package_type"));
            report.setTotalOrders(rs.getInt("order_count"));
            report.setTotalRevenue(rs.getBigDecimal("revenue"));
            return report;
        });
    }

    @Override
    public void updateEndTime(int bookingId, java.time.LocalDateTime endTime) {
        // Update the end_time column in bookings table
        String sql = "UPDATE bookings SET end_time = ? WHERE id = ?";
        jdbcTemplate.update(sql, endTime, bookingId);
    }

    @Override
    public void updateBookingCost(int bookingId, java.math.BigDecimal newTotal) {
        String sql = "UPDATE bookings SET total_cost = ? WHERE id = ?";
        jdbcTemplate.update(sql, newTotal, bookingId);
    }

    @Override
    public org.example.model.Booking getBookingById(int bookingId) {
        String sql = "SELECT * FROM bookings WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, new BookingRowMapper(), bookingId);
    }

    // f20
    @Override
    public List<DailyRevenueReport> getDailyRevenueReport() {
        // Select date and sum cost, grouped by date, for last 7 days.
        // 提取日期并求和，按天分组，只看最近 7 天。
        String sql = "SELECT DATE(start_time) as sale_date, SUM(total_cost) as daily_sum " +
                "FROM bookings " +
                "WHERE status IN ('paid', 'finished') " + // 只有付过钱的才算收入哦！
                "AND start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
                "GROUP BY sale_date " +
                "ORDER BY sale_date DESC"; // 最近的日期排在上面

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            DailyRevenueReport report = new DailyRevenueReport();
            report.setDate(rs.getString("sale_date"));
            report.setDailyTotal(rs.getBigDecimal("daily_sum"));
            return report;
        });
    }

    // 小票装载
    private static class BookingRowMapper implements RowMapper<Booking> {
        @Override
        public Booking mapRow(ResultSet rs, int rowNum) throws SQLException {
            Booking b = new Booking();
            b.setId(rs.getInt("id"));
            b.setUserId(rs.getInt("user_id"));
            b.setScooterId(rs.getInt("scooter_id"));
            b.setStartTime(rs.getTimestamp("start_time").toLocalDateTime());
            // end_time 可能为空，所以要小心处理
            if (rs.getTimestamp("end_time") != null) {
                b.setEndTime(rs.getTimestamp("end_time").toLocalDateTime());
            }
            b.setTotalCost(rs.getBigDecimal("total_cost"));
            b.setStatus(rs.getString("status"));
            return b;
        }
    }
}