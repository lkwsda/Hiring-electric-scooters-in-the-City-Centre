package org.example.service;

import org.example.dao.ScooterDAO;
import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ScooterService Unit Tests")
class ScooterServiceImplTest {

    @Mock
    private ScooterDAO scooterDAO;

    @InjectMocks
    private ScooterServiceImpl scooterService;

    @Nested
    @DisplayName("addScooter")
    class AddScooterTests {
        @Test
        @DisplayName("should add scooter with 100% battery")
        void shouldAddScooterWithFullBattery() {
            Scooter scooter = new Scooter();
            scooter.setModel("EcoRide X1");
            scooter.setBatteryLevel(100);

            scooterService.addScooter(scooter);
            verify(scooterDAO).addScooter(scooter);
        }

        @Test
        @DisplayName("should reject scooter with less than 100% battery")
        void shouldRejectScooterWithLowBattery() {
            Scooter scooter = new Scooter();
            scooter.setModel("EcoRide X1");
            scooter.setBatteryLevel(99);

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> scooterService.addScooter(scooter));
            assertTrue(ex.getMessage().contains("100% battery"));
            verify(scooterDAO, never()).addScooter(any());
        }
    }

    @Nested
    @DisplayName("getAllScootersList")
    class GetAllScootersTests {
        @Test
        @DisplayName("should return all scooters from DAO")
        void shouldReturnAllScooters() {
            List<Scooter> mockScooters = Arrays.asList(new Scooter(), new Scooter());
            when(scooterDAO.getAllScootersList()).thenReturn(mockScooters);

            List<Scooter> result = scooterService.getAllScootersList();
            assertEquals(2, result.size());
        }
    }

    @Nested
    @DisplayName("getScooterById")
    class GetScooterByIdTests {
        @Test
        @DisplayName("should return scooter from DAO")
        void shouldReturnScooter() {
            Scooter scooter = new Scooter();
            scooter.setId(1);
            when(scooterDAO.getScooterById(1)).thenReturn(scooter);

            Scooter result = scooterService.getScooterById(1);
            assertEquals(1, result.getId());
        }
    }

    @Nested
    @DisplayName("deleteScooter")
    class DeleteScooterTests {
        @Test
        @DisplayName("should delegate to DAO")
        void shouldDelegateToDAO() {
            scooterService.deleteScooter(5);
            verify(scooterDAO).deleteScooter(5);
        }
    }

    @Nested
    @DisplayName("getAvailableScooterLocations")
    class GetAvailableScooterLocationsTests {
        @Test
        @DisplayName("should return locations from DAO")
        void shouldReturnLocations() {
            List<ScooterLocationDTO> locations = Arrays.asList(new ScooterLocationDTO(), new ScooterLocationDTO());
            when(scooterDAO.findAvailableScootersForMap()).thenReturn(locations);

            List<ScooterLocationDTO> result = scooterService.getAvailableScooterLocations();
            assertEquals(2, result.size());
        }
    }
}
