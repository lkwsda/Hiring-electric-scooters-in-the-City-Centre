package org.example.model;

import java.math.BigDecimal;

// A lightweight DTO for map display (id + coordinates only)
public class ScooterLocationDTO {
    private Integer id;
    private BigDecimal latitude;
    private BigDecimal longitude;

   // Getters and setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
}