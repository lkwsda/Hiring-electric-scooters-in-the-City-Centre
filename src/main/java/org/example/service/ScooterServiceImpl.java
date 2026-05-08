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
        // Get battery level of new scooter
        Integer battery = scooter.getBatteryLevel();
        // If not fully charged, reject
        if(battery < 100){
            // Throw validation error
            throw new RuntimeException("Validation Failed: New scooters must have 100% battery level");
        }
        // Validation passed, let DAO persist the data
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