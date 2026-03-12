package org.example.dao;

import org.example.model.Booking;
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