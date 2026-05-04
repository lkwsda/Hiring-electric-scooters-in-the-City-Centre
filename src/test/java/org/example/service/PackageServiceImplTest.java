package org.example.service;

import org.example.dao.PackageDAO;
import org.example.model.RentalPackage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PackageService Unit Tests")
class PackageServiceImplTest {

    @Mock
    private PackageDAO packageDAO;

    @InjectMocks
    private PackageServiceImpl packageService;

    @Nested
    @DisplayName("listAllPackages")
    class ListAllPackagesTests {
        @Test
        @DisplayName("should return all packages from DAO")
        void shouldReturnAllPackages() {
            List<RentalPackage> packages = Arrays.asList(new RentalPackage(), new RentalPackage());
            when(packageDAO.findAll()).thenReturn(packages);

            List<RentalPackage> result = packageService.listAllPackages();
            assertEquals(2, result.size());
        }
    }

    @Nested
    @DisplayName("updatePackagePrice")
    class UpdatePackagePriceTests {
        @Test
        @DisplayName("should update price with valid value")
        void shouldUpdatePriceWithValidValue() {
            BigDecimal newPrice = new BigDecimal("10.00");
            packageService.updatePackagePrice(1, newPrice);
            verify(packageDAO).updatePrice(1, newPrice);
        }

        @Test
        @DisplayName("should reject negative price")
        void shouldRejectNegativePrice() {
            BigDecimal negativePrice = new BigDecimal("-5.00");

            RuntimeException ex = assertThrows(RuntimeException.class,
                    () -> packageService.updatePackagePrice(1, negativePrice));
            assertTrue(ex.getMessage().contains("negative"));
            verify(packageDAO, never()).updatePrice(anyInt(), any());
        }
    }
}
