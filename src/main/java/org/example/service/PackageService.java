package org.example.service;
import org.example.model.RentalPackage;
import java.util.List;
import java.math.BigDecimal;

public interface PackageService {
    // List all packages
    List<RentalPackage> listAllPackages();

    // Update package price
    void updatePackagePrice(int id, BigDecimal price);
}