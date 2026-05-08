package org.example.dao;

import org.example.model.Booking;
import org.example.model.RevenueReport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
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
        String sql = "INSERT INTO bookings (user_id, scooter_id, package_id, total_cost, status, guest_name, guest_phone) VALUES (?, ?, ?, ?, ?, ?, ?)";

        org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
        // Insert data
        jdbcTemplate.update(connection -> {
            java.sql.PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            if (booking.getUserId() != null) {
                ps.setInt(1, booking.getUserId());
            } else {
                ps.setNull(1, java.sql.Types.INTEGER);
            }
            ps.setInt(2, booking.getScooterId());
            if (booking.getPackageId() != null) {
                ps.setInt(3, booking.getPackageId());
            } else {
                ps.setNull(3, java.sql.Types.INTEGER);
            }
            ps.setBigDecimal(4, booking.getTotalCost());
            ps.setString(5, booking.getStatus());
            ps.setString(6, booking.getGuestName());
            ps.setString(7, booking.getGuestPhone());
            return ps;
        }, keyHolder);


        // Set the generated booking ID back on the object
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
        java.time.LocalDateTime sevenDaysAgo = java.time.LocalDateTime.now().minusDays(7);
        String sql = "SELECT p.package_type, COUNT(b.id) as order_count, SUM(b.total_cost) as revenue " +
                "FROM bookings b " +
                "LEFT JOIN packages p ON b.package_id = p.id " +
                "WHERE b.status IN ('paid', 'finished') AND b.start_time >= ? " +
                "GROUP BY p.package_type";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            RevenueReport report = new RevenueReport();
            report.setPackageType(rs.getString("package_type"));
            report.setTotalOrders(rs.getInt("order_count"));
            BigDecimal revenue = rs.getBigDecimal("revenue");
            report.setTotalRevenue(revenue == null ? BigDecimal.ZERO : revenue);
            return report;
        }, sevenDaysAgo);
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
        java.time.LocalDateTime sevenDaysAgo = java.time.LocalDateTime.now().minusDays(7);
        String sql = "SELECT CAST(start_time AS DATE) as sale_date, SUM(total_cost) as daily_sum " +
                "FROM bookings " +
                "WHERE status IN ('paid', 'finished') " +
                "AND start_time >= ? " +
                "GROUP BY sale_date " +
                "ORDER BY sale_date DESC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            DailyRevenueReport report = new DailyRevenueReport();
            report.setDate(rs.getString("sale_date"));
            report.setDailyTotal(rs.getBigDecimal("daily_sum"));
            return report;
        }, sevenDaysAgo);
    }

    // Calculate total rental minutes for a user in the past 7 days
    @Override
    public Integer getTotalRentalMinutesForUserLastWeek(int userId) {
        java.time.LocalDateTime sevenDaysAgo = java.time.LocalDateTime.now().minusDays(7);
        String sql = "SELECT start_time, end_time FROM bookings " +
                "WHERE user_id = ? AND status = 'finished' " +
                "AND end_time >= ?";

        java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(sql, userId, sevenDaysAgo);
        long totalMinutes = 0;
        for (java.util.Map<String, Object> row : rows) {
            java.sql.Timestamp startTs = (java.sql.Timestamp) row.get("start_time");
            java.sql.Timestamp endTs = (java.sql.Timestamp) row.get("end_time");
            if (startTs != null && endTs != null) {
                totalMinutes += java.time.Duration.between(
                        startTs.toLocalDateTime(), endTs.toLocalDateTime()).toMinutes();
            }
        }
        return (int) totalMinutes;
    }

    // Booking row mapper
    private static class BookingRowMapper implements RowMapper<Booking> {
        @Override
        public Booking mapRow(ResultSet rs, int rowNum) throws SQLException {
            Booking b = new Booking();
            b.setId(rs.getInt("id"));
            b.setUserId(rs.getInt("user_id"));
            b.setScooterId(rs.getInt("scooter_id"));
            b.setStartTime(rs.getTimestamp("start_time").toLocalDateTime());
            // end_time may be null, handle carefully
            if (rs.getTimestamp("end_time") != null) {
                b.setEndTime(rs.getTimestamp("end_time").toLocalDateTime());
            }
            b.setTotalCost(rs.getBigDecimal("total_cost"));
            b.setStatus(rs.getString("status"));
            b.setGuestName(rs.getString("guest_name"));
            b.setGuestPhone(rs.getString("guest_phone"));
            int packageId = rs.getInt("package_id");
            if (!rs.wasNull()) {
                b.setPackageId(packageId);
            }
            return b;
        }
    }
}