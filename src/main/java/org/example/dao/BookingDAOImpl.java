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

@Repository
public class BookingDAOImpl implements BookingDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void createBooking(Booking booking) {
        String sql = "INSERT INTO bookings (user_id, scooter_id, total_cost) VALUES (?, ?, ?)";
        jdbcTemplate.update(sql, booking.getUserId(), booking.getScooterId(), booking.getTotalCost());
        System.out.println("[DAO] Booking record created for User ID: " + booking.getUserId());
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
        // SQL to sum price and count orders, grouped by package type for the last 7 days.
        // 只统计状态为 'paid' (已支付) 的，且是最近 7 天的记录。
        String sql = "SELECT p.package_type, COUNT(b.id) as order_count, SUM(b.total_cost) as revenue " +
                "FROM bookings b " +
                "JOIN scooters s ON b.scooter_id = s.id " +
                "JOIN packages p ON s.model = p.package_type " + // 简化逻辑：这里假设按型号对应套餐
                "WHERE b.status = 'paid' AND b.start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY) " +
                "GROUP BY p.package_type";

        // 现在的数据库表关联比较简化，这里是一个最通用的演示 SQL：
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