package org.example.dao;
import org.example.model.RentalPackage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
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

        List<RentalPackage> result = jdbcTemplate.query(sql, (rs, rowNum) -> {
            RentalPackage p = new RentalPackage();
            p.setId(rs.getInt("id"));
            p.setPackageType(rs.getString("package_type"));
            p.setPrice(rs.getBigDecimal("price"));
            p.setDescription(rs.getString("description"));
            // 别忘了咱们 Sprint2 新加的折扣字段哦！
            p.setDiscountPercent(rs.getInt("discount_percent"));
            return p;
        }, id);

        return result.isEmpty() ? null : result.get(0);
    }
}