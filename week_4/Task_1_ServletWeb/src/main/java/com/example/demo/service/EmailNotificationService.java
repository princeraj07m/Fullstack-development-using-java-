package com.example.demo.service;

import org.springframework.stereotype.Service;

@Service("emailService")
public class EmailNotificationService implements NotificationService {

    @Override
    public String sendNotification() {
        return "Email Notification Sent!";
    }
}