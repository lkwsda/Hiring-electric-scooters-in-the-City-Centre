package org.example.controller;

import org.example.model.Scooter;
import org.example.model.ScooterLocationDTO;
import org.example.service.ScooterService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ScooterController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("ScooterController Unit Tests")
class ScooterControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ScooterService scooterService;

    @Nested
    @DisplayName("GET /api/scooters")
    class GetAllScootersTests {
        @Test
        @DisplayName("should return all scooters")
        void shouldReturnAllScooters() throws Exception {
            Scooter s1 = new Scooter();
            s1.setModel("EcoRide X1");
            Scooter s2 = new Scooter();
            s2.setModel("EcoRide X2");
            when(scooterService.getAllScootersList()).thenReturn(Arrays.asList(s1, s2));

            mockMvc.perform(get("/api/scooters"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("POST /api/scooters/add")
    class AddScooterTests {
        @Test
        @DisplayName("should add scooter successfully")
        void shouldAddScooter() throws Exception {
            doNothing().when(scooterService).addScooter(any(Scooter.class));

            mockMvc.perform(post("/api/scooters/add")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"model\":\"EcoRide X1\",\"batteryLevel\":100}"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("added successfully")));
        }
    }

    @Nested
    @DisplayName("GET /api/scooters/{id}")
    class GetScooterByIdTests {
        @Test
        @DisplayName("should return scooter by id")
        void shouldReturnScooter() throws Exception {
            Scooter s = new Scooter();
            s.setId(1);
            s.setModel("EcoRide X1");
            when(scooterService.getScooterById(1)).thenReturn(s);

            mockMvc.perform(get("/api/scooters/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1));
        }
    }

    @Nested
    @DisplayName("DELETE /api/scooters/{id}")
    class DeleteScooterTests {
        @Test
        @DisplayName("should delete scooter")
        void shouldDeleteScooter() throws Exception {
            doReturn(1).when(scooterService).deleteScooter(5);

            mockMvc.perform(delete("/api/scooters/5"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("removed")));
        }
    }

    @Nested
    @DisplayName("GET /api/scooters/locations")
    class GetLocationsTests {
        @Test
        @DisplayName("should return scooter locations")
        void shouldReturnLocations() throws Exception {
            when(scooterService.getAvailableScooterLocations())
                    .thenReturn(Arrays.asList(new ScooterLocationDTO(), new ScooterLocationDTO()));

            mockMvc.perform(get("/api/scooters/locations"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("Error response paths (400 via GlobalExceptionHandler)")
    class ErrorResponseTests {
        @Test
        @DisplayName("should return 400 when addScooter service throws")
        void shouldReturn400OnAddScooterError() throws Exception {
            doThrow(new RuntimeException("Validation Failed: New scooters must have 100% battery level"))
                    .when(scooterService).addScooter(any(Scooter.class));

            mockMvc.perform(post("/api/scooters/add")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"model\":\"EcoRide X1\",\"batteryLevel\":50}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Validation Failed: New scooters must have 100% battery level"));
        }

        @Test
        @DisplayName("should return 400 when getScooterById service throws")
        void shouldReturn400OnGetScooterError() throws Exception {
            when(scooterService.getScooterById(9999))
                    .thenThrow(new RuntimeException("Scooter not found"));

            mockMvc.perform(get("/api/scooters/9999"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Scooter not found"));
        }
    }
}
