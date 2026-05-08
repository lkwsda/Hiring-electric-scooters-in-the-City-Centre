package org.example.dao;

import org.example.model.RentalPackage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Transactional
@DisplayName("PackageDAO Integration Tests")
class PackageDAOImplTest {

    @Autowired
    private PackageDAO packageDAO;

    @MockBean
    private JavaMailSender javaMailSender;

    @Nested
    @DisplayName("findAll")
    class FindAllTests {
        @Test
        @DisplayName("should return all 4 packages")
        void shouldReturnAllPackages() {
            List<RentalPackage> packages = packageDAO.findAll();
            assertNotNull(packages);
            assertEquals(4, packages.size());
        }

        @Test
        @DisplayName("should have correct package types")
        void shouldHaveCorrectPackageTypes() {
            List<RentalPackage> packages = packageDAO.findAll();
            assertTrue(packages.stream().anyMatch(p -> "1 Hour".equals(p.getPackageType())));
            assertTrue(packages.stream().anyMatch(p -> "4 Hours".equals(p.getPackageType())));
            assertTrue(packages.stream().anyMatch(p -> "1 Day".equals(p.getPackageType())));
            assertTrue(packages.stream().anyMatch(p -> "1 Week".equals(p.getPackageType())));
        }
    }

    @Nested
    @DisplayName("findById")
    class FindByIdTests {
        @Test
        @DisplayName("should return correct package by ID")
        void shouldReturnCorrectPackage() {
            RentalPackage pkg = packageDAO.findById(1);
            assertNotNull(pkg);
            assertEquals("1 Hour", pkg.getPackageType());
            assertEquals(new BigDecimal("5.00"), pkg.getPrice());
            assertNotNull(pkg.getDescription());
        }

        @Test
        @DisplayName("should return null for non-existing ID")
        void shouldReturnNullForNonExistingId() {
            RentalPackage pkg = packageDAO.findById(9999);
            assertNull(pkg);
        }
    }

    @Nested
    @DisplayName("updatePrice")
    class UpdatePriceTests {
        @Test
        @DisplayName("should update package price")
        void shouldUpdatePackagePrice() {
            BigDecimal newPrice = new BigDecimal("7.50");
            packageDAO.updatePrice(1, newPrice);

            RentalPackage pkg = packageDAO.findById(1);
            assertEquals(newPrice, pkg.getPrice());
        }

        @Test
        @DisplayName("should accept zero price")
        void shouldAcceptZeroPrice() {
            BigDecimal zeroPrice = BigDecimal.ZERO;
            packageDAO.updatePrice(2, zeroPrice);

            RentalPackage pkg = packageDAO.findById(2);
            assertEquals(0, pkg.getPrice().compareTo(BigDecimal.ZERO));
        }
    }
}
