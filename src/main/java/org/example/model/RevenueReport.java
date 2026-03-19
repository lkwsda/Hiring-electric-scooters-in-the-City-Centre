package org.example.model;

import java.math.BigDecimal;

/**
 * A special report box for Admin statistics.
 * 管理员统计报告盒子
 */
public class RevenueReport {
    private String packageType;    // 套餐类型
    private Integer totalOrders;   // 这周卖的单数
    private BigDecimal totalRevenue; // 这周赚钱

    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }
    public Integer getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Integer totalOrders) { this.totalOrders = totalOrders; }
    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
}