package org.example.model;

import java.math.BigDecimal;

// Admin statistics report
public class RevenueReport {
    private String packageType;    // Package type
    private Integer totalOrders;   // Order count this week
    private BigDecimal totalRevenue; // Revenue this week

    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }
    public Integer getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Integer totalOrders) { this.totalOrders = totalOrders; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
}