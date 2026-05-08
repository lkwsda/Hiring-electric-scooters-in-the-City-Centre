package org.example.controller;

import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;
import org.example.service.ScooterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scooters")
public class ScooterController {

    @Autowired
    private ScooterService scooterService;

    // View all scooters
    @GetMapping
    public List<Scooter> getAllScooters() {
        return scooterService.getAllScootersList();
    }

    // Admin: add a new scooter
    @PostMapping("/add")
    public String addScooter(@RequestBody Scooter scooter) {
        scooterService.addScooter(scooter);
        return "Scooter added successfully: " + scooter.getModel();
    }

    // Lookup scooter by ID: GET http://localhost:8080/api/scooters/1
    @GetMapping("/{id}")
    public org.springframework.http.ResponseEntity<Scooter> getScooter(@PathVariable int id) {
        Scooter scooter = scooterService.getScooterById(id);
        if (scooter == null) {
            return org.springframework.http.ResponseEntity.status(404).body(null);
        }
        return org.springframework.http.ResponseEntity.ok(scooter);
    }

    // Admin: decommission a scooter
    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<String> deleteScooter(@PathVariable int id) {
        int rows = scooterService.deleteScooter(id);
        if (rows == 0) {
            return org.springframework.http.ResponseEntity.status(404)
                    .body("Scooter ID " + id + " not found.");
        }
        return org.springframework.http.ResponseEntity.ok("Scooter ID " + id + " has been removed.");
    }

    // Map: get coordinates of all available scooters
    @GetMapping("/locations")
    public List<ScooterLocationDTO> getAvailableScooterLocations() {
        return scooterService.getAvailableScooterLocations();
    }
}