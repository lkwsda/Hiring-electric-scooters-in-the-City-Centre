package org.example.service;

import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;

import java.util.List;

public interface ScooterService {
    void addScooter(Scooter scooter);
    List<Scooter> getAllScootersList();
    // Manager: lookup scooter by ID
    Scooter getScooterById(int id);
    // Manager: decommission a scooter
    int deleteScooter(int id);

    // Map display: available scooter locations
    List<ScooterLocationDTO> getAvailableScooterLocations();
}