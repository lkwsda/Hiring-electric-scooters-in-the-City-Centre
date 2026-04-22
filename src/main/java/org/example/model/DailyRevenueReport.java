package org.example.model;
import java.math.BigDecimal;


/**
 * F20: Daily Revenue Report
 * 每日收入报表
 */
public class DailyRevenueReport {
    private String date;  // 日期 如: 2026-04-01
    private BigDecimal dailyTotal; // 当天总收入

    public DailyRevenueReport() {}
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public BigDecimal getDailyTotal() { return dailyTotal; }
    public void setDailyTotal(BigDecimal dailyTotal) { this.dailyTotal = dailyTotal; }
}
