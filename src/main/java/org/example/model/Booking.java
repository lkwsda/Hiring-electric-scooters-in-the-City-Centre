package org.example.model;
import java.time.LocalDateTime;
import java.math.BigDecimal;

public class Booking {
    private Integer id;
    private Integer userId;     // Links to User table
    private Integer scooterId;  // Links to Scooter table
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal totalCost;

    private String status;

    private String guestName;
    private String guestPhone;
    private Integer packageId;


    // get set
    public Integer getPackageId() {return packageId;}
    public void setPackageId(Integer packageId) {this.packageId = packageId;}

    public String getStatus() {return status;}
    public void setStatus(String status) {
        this.status = status;
    }
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getScooterId() {
        return scooterId;
    }

    public void setScooterId(Integer scooterId) {
        this.scooterId = scooterId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }

    public String getGuestName() {return guestName;}
    public void setGuestName(String guestName) {this.guestName = guestName;}

    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }

}
