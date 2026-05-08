package org.example.controller;

import org.example.model.RentalPackage;
import org.example.service.PackageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PackageController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("PackageController Unit Tests")
class PackageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PackageService packageService;

    @Nested
    @DisplayName("GET /api/packages")
    class GetAllPackagesTests {
        @Test
        @DisplayName("should return all packages")
        void shouldReturnAllPackages() throws Exception {
            when(packageService.listAllPackages())
                    .thenReturn(Arrays.asList(new RentalPackage(), new RentalPackage()));

            mockMvc.perform(get("/api/packages"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("PUT /api/packages/update/{id}")
    class UpdatePriceTests {
        @Test
        @DisplayName("should update package price")
        void shouldUpdatePrice() throws Exception {
            doNothing().when(packageService).updatePackagePrice(eq(1), any(BigDecimal.class));

            mockMvc.perform(put("/api/packages/update/1")
                            .param("price", "9.99"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("updated")));
        }
    }

    @Nested
    @DisplayName("Error response paths (400 via GlobalExceptionHandler)")
    class ErrorResponseTests {
        @Test
        @DisplayName("should return 400 when updatePrice service throws")
        void shouldReturn400OnUpdatePriceError() throws Exception {
            doThrow(new RuntimeException("Error: Price cannot be negative!"))
                    .when(packageService).updatePackagePrice(eq(1), any(BigDecimal.class));

            mockMvc.perform(put("/api/packages/update/1")
                            .param("price", "-5.00"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Error: Price cannot be negative!"));
        }
    }
}
