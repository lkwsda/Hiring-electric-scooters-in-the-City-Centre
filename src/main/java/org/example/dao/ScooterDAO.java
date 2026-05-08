package org.example.dao;

import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;
import org.example.model.User;

import java.util.List;

// ScooterDAO Interface - defines CRUD operations for scooters
public interface ScooterDAO {
    // 1. Add a new scooter
    void addScooter(Scooter scooter);

    // 2. Get a scooter by ID
    Scooter getScooterById(int id);

    // 3. Get all scooters
    List<Scooter> getAllScootersList();

    // 4. Update scooter info (battery, status, etc.)
    void updateScooter(Scooter scooter);

    // 5. Delete a scooter
    int deleteScooter(int id);

    // 6. Update scooter status (available, rented, maintenance)
    void updateScooterStatus(int id,String status);

    // Show all available scooters on map
    List<ScooterLocationDTO> findAvailableScootersForMap();
}