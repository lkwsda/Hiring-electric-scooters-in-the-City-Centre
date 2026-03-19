package org.example.service;
import org.example.model.RentalPackage;
import java.util.List;
import java.math.BigDecimal;

public interface PackageService {
    // 列出所有套餐
    List<RentalPackage> listAllPackages();

    // 更新价格
    void updatePackagePrice(int id, BigDecimal price);
}