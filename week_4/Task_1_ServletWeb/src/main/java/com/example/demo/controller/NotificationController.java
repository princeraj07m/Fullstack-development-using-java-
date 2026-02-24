package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.service.NotificationService;

@RestController
public class NotificationController {

    @Autowired
    @Qualifier("emailService")
    private NotificationService notificationService;

    @GetMapping("/notify")
    public String send() {
        return notificationService.sendNotification();
    }
}