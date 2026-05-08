package org.example.service;
import org.example.model.Booking;


// Interface for sending notification
public interface NotificationService {

    // F07: Send a confirmation email after successful payment
    void sendBookingConfirmation(Booking booking);
}
