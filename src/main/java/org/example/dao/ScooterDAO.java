package org.example.dao;

import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;
import org.example.model.User;

import java.util.List;

/**
 * ScooterDAO Interface
 * 滑板车数据访问接口 - 定义了对车辆的增删改查动作。
 */
public interface ScooterDAO {
    // 1. Add a new scooter (进货新车)
    void addScooter(Scooter scooter);

    // 2. Get a scooter by ID (通过ID找车)
    Scooter getScooterById(int id);

    // 3. Get all scooters (查看车库所有车)
    List<Scooter> getAllScootersList(); // 修正版

    // 4. Update scooter info (修改车辆信息，比如电量、状态)
    void updateScooter(Scooter scooter);

    // 5. Delete a scooter (车辆报废)
    void deleteScooter(int id);

    // 6. Update scooter status (修改车辆状态，比如正在使用、空闲、故障)
    void updateScooterStatus(int id,String status);

    // 在地图上显示所有可用车
    List<ScooterLocationDTO> findAvailableScootersForMap();
}