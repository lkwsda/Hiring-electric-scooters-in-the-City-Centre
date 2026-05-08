package org.example.dao;
import java.util.List;
import java.math.BigDecimal;
import org.example.model.RentalPackage;


public interface PackageDAO {
    // Find all packages
    List<RentalPackage> findAll();
    // Update package price
    void updatePrice(int id, BigDecimal newPrice);
    // Find package by ID
    RentalPackage findById(int id);
//    void deletePackage(int id);
//    void addPackage(RentalPackage rentalPackage);
//    void updatePackage(RentalPackage rentalPackage);
//    void deletePackage(RentalPackage rentalPackage);
}
