package org.example.model;

import java.math.BigDecimal;

//A lightweight box for map display.专门用于地图显示的轻量级坐标盒子
public class ScooterLocationDTO {
    private Integer id;
    private BigDecimal latitude;
    private BigDecimal longitude;

   // get set
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }
}