package org.example.dao;

import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Transactional
@DisplayName("ScooterDAO Integration Tests")
class ScooterDAOImplTest {

    @Autowired
    private ScooterDAO scooterDAO;

    @Nested
    @DisplayName("getAllScootersList")
    class GetAllScootersTests {
        @Test
        @DisplayName("should return all scooters")
        void shouldReturnAllScooters() {
            List<Scooter> scooters = scooterDAO.getAllScootersList();
            assertNotNull(scooters);
            assertEquals(6, scooters.size());
        }
    }

    @Nested
    @DisplayName("getScooterById")
    class GetScooterByIdTests {
        @Test
        @DisplayName("should return scooter when ID exists")
        void shouldReturnScooterWhenIdExists() {
            Scooter scooter = scooterDAO.getScooterById(1);
            assertNotNull(scooter);
            assertEquals("EcoRide X1", scooter.getModel());
            assertEquals(100, scooter.getBatteryLevel());
            assertEquals("available", scooter.getStatus());
        }

        @Test
        @DisplayName("should throw exception when ID does not exist")
        void shouldThrowExceptionWhenIdDoesNotExist() {
            assertThrows(Exception.class, () -> scooterDAO.getScooterById(9999));
        }
    }

    @Nested
    @DisplayName("addScooter")
    class AddScooterTests {
        @Test
        @DisplayName("should persist new scooter")
        void shouldPersistNewScooter() {
            Scooter scooter = new Scooter();
            scooter.setModel("EcoRide X5");
            scooter.setBatteryLevel(100);
            scooter.setLatitude(new BigDecimal("53.8100"));
            scooter.setLongitude(new BigDecimal("-1.5600"));
            scooter.setStatus("available");

            scooterDAO.addScooter(scooter);

            List<Scooter> scooters = scooterDAO.getAllScootersList();
            assertEquals(7, scooters.size());
        }
    }

    @Nested
    @DisplayName("updateScooterStatus")
    class UpdateScooterStatusTests {
        @Test
        @DisplayName("should change scooter status to rented")
        void shouldChangeStatusToRented() {
            scooterDAO.updateScooterStatus(1, "rented");
            Scooter scooter = scooterDAO.getScooterById(1);
            assertEquals("rented", scooter.getStatus());
        }

        @Test
        @DisplayName("should change scooter status to maintenance")
        void shouldChangeStatusToMaintenance() {
            scooterDAO.updateScooterStatus(2, "maintenance");
            Scooter scooter = scooterDAO.getScooterById(2);
            assertEquals("maintenance", scooter.getStatus());
        }

        @Test
        @DisplayName("should change scooter status to available")
        void shouldChangeStatusToAvailable() {
            scooterDAO.updateScooterStatus(3, "available");
            Scooter scooter = scooterDAO.getScooterById(3);
            assertEquals("available", scooter.getStatus());
        }
    }

    @Nested
    @DisplayName("updateScooter")
    class UpdateScooterTests {
        @Test
        @DisplayName("should update battery level and status")
        void shouldUpdateBatteryAndStatus() {
            Scooter scooter = scooterDAO.getScooterById(1);
            scooter.setBatteryLevel(75);
            scooter.setStatus("maintenance");

            scooterDAO.updateScooter(scooter);

            Scooter updated = scooterDAO.getScooterById(1);
            assertEquals(75, updated.getBatteryLevel());
            assertEquals("maintenance", updated.getStatus());
        }

        @Test
        @DisplayName("should update battery level to 0")
        void shouldUpdateBatteryToZero() {
            Scooter scooter = scooterDAO.getScooterById(2);
            scooter.setBatteryLevel(0);
            scooter.setStatus("available");

            scooterDAO.updateScooter(scooter);

            Scooter updated = scooterDAO.getScooterById(2);
            assertEquals(0, updated.getBatteryLevel());
        }
    }

    @Nested
    @DisplayName("deleteScooter")
    class DeleteScooterTests {
        @Test
        @DisplayName("should remove scooter from database")
        void shouldRemoveScooter() {
            scooterDAO.deleteScooter(6);
            assertThrows(Exception.class, () -> scooterDAO.getScooterById(6));
            List<Scooter> scooters = scooterDAO.getAllScootersList();
            assertEquals(5, scooters.size());
        }
    }

    @Nested
    @DisplayName("findAvailableScootersForMap")
    class FindAvailableScootersForMapTests {
        @Test
        @DisplayName("should return only available scooters with coordinates")
        void shouldReturnOnlyAvailableScooters() {
            List<ScooterLocationDTO> locations = scooterDAO.findAvailableScootersForMap();
            assertNotNull(locations);
            assertTrue(locations.size() >= 5, "Should have at least 5 available scooters");

            for (ScooterLocationDTO dto : locations) {
                assertNotNull(dto.getId());
                assertNotNull(dto.getLatitude());
                assertNotNull(dto.getLongitude());
            }
        }
    }
}
