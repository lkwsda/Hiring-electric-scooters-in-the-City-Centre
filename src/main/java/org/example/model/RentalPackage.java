package org.example.model;

import java.math.BigDecimal;

/**
 * Entity class for 'packages' table.
 * 租赁套餐实体类 - 对应数据库里的 packages 表
 */
public class RentalPackage {
    private Integer id;
    private String packageType;
    private BigDecimal price;
    private String description;
    // 折扣
    private Integer discountPercent;


    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getPackageType() { return packageType; }
    public void setPackageType(String packageType) { this.packageType = packageType; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(Integer discountPercent) {this.discountPercent = discountPercent;}
}