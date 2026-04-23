package org.example.service;

import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;

import java.util.List;

public interface ScooterService {
    void addScooter(Scooter scooter);
    List<Scooter> getAllScootersList();
    // 经理查车
    Scooter getScooterById(int id);
    // 经理报废车
    void deleteScooter(int id);

    // 地图显示
    List<ScooterLocationDTO> getAvailableScooterLocations();
}