package org.example.dao;
import java.util.List;
import java.math.BigDecimal;
import org.example.model.RentalPackage;


public interface PackageDAO {
    // 查找所有套餐
    List<RentalPackage> findAll();
    // 修改套餐价格
    void updatePrice(int id, BigDecimal newPrice);
    // 根据 ID 查询套餐
    RentalPackage findById(int id);
//    void deletePackage(int id);
//    void addPackage(RentalPackage rentalPackage);
//    void updatePackage(RentalPackage rentalPackage);
//    void deletePackage(RentalPackage rentalPackage);
}
