package org.example.model;
import java.math.BigDecimal;


// F20: Daily Revenue Report
public class DailyRevenueReport {
    private String date;  // e.g., 2026-04-01
    private BigDecimal dailyTotal; // Total revenue for the day

    public DailyRevenueReport() {}
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public BigDecimal getDailyTotal() { return dailyTotal; }
    public void setDailyTotal(BigDecimal dailyTotal) { this.dailyTotal = dailyTotal; }
}
