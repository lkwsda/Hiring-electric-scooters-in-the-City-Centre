package org.example.controller;

import org.example.model.Booking;
import org.example.model.DailyRevenueReport;
import org.example.model.RevenueReport;
import org.example.service.BookingService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookingController.class)
@DisplayName("BookingController Unit Tests")
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BookingService bookingService;

    @Nested
    @DisplayName("POST /api/bookings/place")
    class PlaceBookingTests {
        @Test
        @DisplayName("should place booking and return it")
        void shouldPlaceBooking() throws Exception {
            doNothing().when(bookingService).placeBooking(any(Booking.class));

            mockMvc.perform(post("/api/bookings/place")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"userId\":1,\"scooterId\":5,\"packageId\":2}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId").value(1));
        }
    }

    @Nested
    @DisplayName("GET /api/bookings/user/{userId}")
    class GetUserBookingsTests {
        @Test
        @DisplayName("should return user bookings")
        void shouldReturnUserBookings() throws Exception {
            when(bookingService.getUserBookings(1))
                    .thenReturn(Arrays.asList(new Booking(), new Booking()));

            mockMvc.perform(get("/api/bookings/user/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("POST /api/bookings/pay/{bookingId}")
    class PayTests {
        @Test
        @DisplayName("should process payment")
        void shouldProcessPayment() throws Exception {
            doNothing().when(bookingService).processPayment(eq(10), eq("4111111111111111"));

            mockMvc.perform(post("/api/bookings/pay/10")
                            .param("cardNumber", "4111111111111111"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("Payment Success")));
        }
    }

    @Nested
    @DisplayName("POST /api/bookings/cancel/{bookingId}")
    class CancelBookingTests {
        @Test
        @DisplayName("should cancel booking")
        void shouldCancelBooking() throws Exception {
            doNothing().when(bookingService).cancelBooking(10);

            mockMvc.perform(post("/api/bookings/cancel/10"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("canceled")));
        }
    }

    @Nested
    @DisplayName("GET /api/bookings/admin/revenue")
    class GetWeeklyRevenueTests {
        @Test
        @DisplayName("should return weekly revenue")
        void shouldReturnWeeklyRevenue() throws Exception {
            when(bookingService.getWeeklyRevenue())
                    .thenReturn(Arrays.asList(new RevenueReport(), new RevenueReport()));

            mockMvc.perform(get("/api/bookings/admin/revenue"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("POST /api/bookings/end/{bookingId}")
    class EndTripTests {
        @Test
        @DisplayName("should end trip")
        void shouldEndTrip() throws Exception {
            doNothing().when(bookingService).endTrip(10);

            mockMvc.perform(post("/api/bookings/end/10"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("ended")));
        }
    }

    @Nested
    @DisplayName("POST /api/bookings/extend/{bookingId}")
    class ExtendBookingTests {
        @Test
        @DisplayName("should extend booking")
        void shouldExtendBooking() throws Exception {
            doNothing().when(bookingService).extendBooking(eq(10), any(BigDecimal.class));

            mockMvc.perform(post("/api/bookings/extend/10")
                            .param("extraCost", "15.00"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("extended")));
        }
    }

    @Nested
    @DisplayName("POST /api/bookings/admin/place")
    class AdminPlaceBookingTests {
        @Test
        @DisplayName("should admin proxy book")
        void shouldAdminProxyBook() throws Exception {
            doNothing().when(bookingService).adminProxyBooking(any(Booking.class));

            mockMvc.perform(post("/api/bookings/admin/place")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"guestName\":\"John\",\"scooterId\":5}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.guestName").value("John"));
        }
    }

    @Nested
    @DisplayName("GET /api/bookings/admin/revenue/daily")
    class GetDailyRevenueTests {
        @Test
        @DisplayName("should return daily revenue")
        void shouldReturnDailyRevenue() throws Exception {
            when(bookingService.getDailyRevenue())
                    .thenReturn(Arrays.asList(new DailyRevenueReport(), new DailyRevenueReport()));

            mockMvc.perform(get("/api/bookings/admin/revenue/daily"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("Error response paths (400 via GlobalExceptionHandler)")
    class ErrorResponseTests {
        @Test
        @DisplayName("should return 400 when placeBooking service throws")
        void shouldReturn400OnPlaceBookingError() throws Exception {
            doThrow(new RuntimeException("Validation Failed: Scooter ID 5 not found!"))
                    .when(bookingService).placeBooking(any(Booking.class));

            mockMvc.perform(post("/api/bookings/place")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"userId\":1,\"scooterId\":5,\"packageId\":2}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Validation Failed: Scooter ID 5 not found!"));
        }

        @Test
        @DisplayName("should return 400 when pay service throws")
        void shouldReturn400OnPayError() throws Exception {
            doThrow(new RuntimeException("Error: You can only pay for PENDING orders."))
                    .when(bookingService).processPayment(eq(10), anyString());

            mockMvc.perform(post("/api/bookings/pay/10")
                            .param("cardNumber", "4111111111111111"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Error: You can only pay for PENDING orders."));
        }

        @Test
        @DisplayName("should return 400 when cancelBooking service throws")
        void shouldReturn400OnCancelError() throws Exception {
            doThrow(new RuntimeException("Validation Failed: This booking is already canceled!"))
                    .when(bookingService).cancelBooking(10);

            mockMvc.perform(post("/api/bookings/cancel/10"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Validation Failed: This booking is already canceled!"));
        }

        @Test
        @DisplayName("should return 400 when endTrip service throws")
        void shouldReturn400OnEndTripError() throws Exception {
            doThrow(new RuntimeException("Error: Trip not found!"))
                    .when(bookingService).endTrip(99);

            mockMvc.perform(post("/api/bookings/end/99"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Error: Trip not found!"));
        }

        @Test
        @DisplayName("should return 400 when extendBooking service throws")
        void shouldReturn400OnExtendError() throws Exception {
            doThrow(new RuntimeException("Error: Only ACTIVE (paid) bookings can be extended!"))
                    .when(bookingService).extendBooking(eq(10), any(BigDecimal.class));

            mockMvc.perform(post("/api/bookings/extend/10")
                            .param("extraCost", "15.00"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Error: Only ACTIVE (paid) bookings can be extended!"));
        }

        @Test
        @DisplayName("should return 400 when adminPlaceBooking service throws")
        void shouldReturn400OnAdminPlaceError() throws Exception {
            doThrow(new RuntimeException("Admin Error: Guest name is required for proxy booking!"))
                    .when(bookingService).adminProxyBooking(any(Booking.class));

            mockMvc.perform(post("/api/bookings/admin/place")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"scooterId\":5}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Admin Error: Guest name is required for proxy booking!"));
        }
    }
}
