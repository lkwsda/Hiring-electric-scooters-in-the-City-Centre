package org.example.dao;

import org.example.model.Scooter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class ScooterDAOImpl implements ScooterDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void addScooter(Scooter scooter) {
        String sql = "INSERT INTO scooters (model, battery_level, latitude, longitude, status) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, scooter.getModel(), scooter.getBatteryLevel(),
                scooter.getLatitude(), scooter.getLongitude(), scooter.getStatus());
        System.out.println("[DAO] New scooter added: " + scooter.getModel());
    }

    @Override
    public List<Scooter> getAllScootersList() {
        String sql = "SELECT * FROM scooters";
        return jdbcTemplate.query(sql, new ScooterRowMapper());
    }

    @Override
    public void updateScooter(Scooter scooter) {
        String sql = "UPDATE scooters SET battery_level = ?, status = ? WHERE id = ?";
        jdbcTemplate.update(sql, scooter.getBatteryLevel(), scooter.getStatus(), scooter.getId());
    }

    // 把数据库里的零件装进 Scooter 盒子
    private static class ScooterRowMapper implements RowMapper<Scooter> {
        @Override
        public Scooter mapRow(ResultSet rs, int rowNum) throws SQLException {
            Scooter s = new Scooter();
            s.setId(rs.getInt("id"));
            s.setModel(rs.getString("model"));
            s.setBatteryLevel(rs.getInt("battery_level"));
            s.setLatitude(rs.getBigDecimal("latitude"));
            s.setLongitude(rs.getBigDecimal("longitude"));
            s.setStatus(rs.getString("status"));
            return s;
        }
    }

    @Override
    public Scooter getScooterById(int id) {
        String sql = "SELECT * FROM scooters WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, new ScooterDAOImpl.ScooterRowMapper(), id);
    }
    @Override
    public void deleteScooter(int id) {
        String sql = "DELETE FROM scooters WHERE id = ?";
        jdbcTemplate.update(sql, id);
        System.out.println("[DAO] Scooter deleted, ID: " + id);
    }
}