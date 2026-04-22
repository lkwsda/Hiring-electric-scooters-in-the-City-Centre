package org.example.service;

import org.example.dao.ScooterDAO;
import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ScooterServiceImpl implements ScooterService {

    @Autowired
    private ScooterDAO scooterDAO;

    @Override
    public void addScooter(Scooter scooter) {
        // 获取新车电量
        Integer battery = scooter.getBatteryLevel();
        // 如果不是满电，拒绝入库
        if(battery < 100){
            // 抛出异常‘没充满电’
            throw new RuntimeException("Validation Failed: New scooters must have 100% battery level");
        }
        // 通过验证，让DAO存储数据
        System.out.println("[Service] Logic passed. Calling DAO to save scooter: " + scooter.getModel());
        scooterDAO.addScooter(scooter);
    }

    @Override
    public List<Scooter> getAllScootersList() {
        return scooterDAO.getAllScootersList();
    }

    @Override
    public Scooter getScooterById(int id) {
        return scooterDAO.getScooterById(id);
    }

    @Override
    public void deleteScooter(int id) {
        scooterDAO.deleteScooter(id);
    }

    @Override
    public List<ScooterLocationDTO> getAvailableScooterLocations() {
        System.out.println("[Service] Providing locations for all available scooters...");
        return scooterDAO.findAvailableScootersForMap();
    }
}