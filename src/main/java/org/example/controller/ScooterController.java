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

    // 查看所有车辆信息
    @GetMapping
    public List<Scooter> getAllScooters() {
        return scooterService.getAllScootersList();
    }

    // 管理员“进货”新车
    @PostMapping("/add")
    public String addScooter(@RequestBody Scooter scooter) {
        scooterService.addScooter(scooter);
        return "Scooter added successfully: " + scooter.getModel();
    }

    // 增加：通过 ID 查某辆车 http://localhost:8080/api/scooters/1
    @GetMapping("/{id}")
    public Scooter getScooter(@PathVariable int id) {
        return scooterService.getScooterById(id);
    }

    // 增加：报废某辆车
    @DeleteMapping("/{id}")
    public String deleteScooter(@PathVariable int id) {
        scooterService.deleteScooter(id);
        return "Scooter ID " + id + " has been removed.";
    }

    // 地图使用：获取所有可用滑板车的坐标
    @GetMapping("/locations")
    public List<ScooterLocationDTO> getAvailableScooterLocations() {
        return scooterService.getAvailableScooterLocations();
    }
}