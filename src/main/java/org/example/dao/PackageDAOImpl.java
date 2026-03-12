package org.example.dao;
import org.example.model.RentalPackage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.sql.SQLException;
import org.springframework.jdbc.core.JdbcTemplate;

@Repository
public class PackageDAOImpl implements PackageDAO {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public List<RentalPackage> findAll() {
        String sql = "SELECT * FROM packages";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            RentalPackage p = new RentalPackage();
            p.setId(rs.getInt("id"));
            p.setPackageType(rs.getString("package_type"));
            p.setPrice(rs.getBigDecimal("price"));
            p.setDescription(rs.getString("description"));
            return p;
        });
    }

    @Override
    public void updatePrice(int id, BigDecimal newPrice) {
        String sql = "UPDATE packages SET price = ? WHERE id = ?";
        jdbcTemplate.update(sql, newPrice, id);
    }

    @Override
    public RentalPackage findById(int id) {
        String sql = "SELECT * FROM packages WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            RentalPackage p = new RentalPackage();
            p.setId(rs.getInt("id"));
            p.setPackageType(rs.getString("package_type"));
            p.setPrice(rs.getBigDecimal("price"));
            p.setDescription(rs.getString("description"));
            return p;
        }, id);
    }
}