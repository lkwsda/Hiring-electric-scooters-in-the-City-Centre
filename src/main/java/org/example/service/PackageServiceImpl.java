package org.example.service;
import org.example.dao.PackageDAO;
import org.example.model.RentalPackage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class PackageServiceImpl implements PackageService {
    @Autowired
    private PackageDAO packageDAO;

    @Override
    public List<RentalPackage> listAllPackages() {
        return packageDAO.findAll();
    }

    @Override
    public void updatePackagePrice(int id, BigDecimal price) {
        if (price.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Error: Price cannot be negative!");
        }
        packageDAO.updatePrice(id, price);
    }
}