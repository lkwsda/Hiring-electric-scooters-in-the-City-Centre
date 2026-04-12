package org.example.service;
import org.example.model.Booking;


// Interface for sending notification
public interface NotificationService {

    // f7 当订单支付成功后，发送一封确认邮件
    void sendBookingConfirmation(Booking booking);
}
