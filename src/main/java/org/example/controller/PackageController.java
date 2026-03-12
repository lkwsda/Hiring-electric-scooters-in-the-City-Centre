package org.example.controller;
import org.example.model.RentalPackage;
import org.example.service.PackageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/packages")
public class PackageController {
    @Autowired
    private PackageService packageService;

    // F04: 用户查看所有套餐
    @GetMapping
    public List<RentalPackage> getAll() {
        return packageService.listAllPackages();
    }

    // F16: 管理员修改套餐价格
    @PutMapping("/update/{id}")
    public String updatePrice(@PathVariable int id, @RequestParam BigDecimal price) {
        packageService.updatePackagePrice(id, price);
        return "Price updated successfully!";
    }
}