package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.service.UserService;

@RestController
public class UserController {

    @Autowired   // Field Injection
    private UserService userService;

    @GetMapping("/field")
    public String testFieldInjection() {
        return userService.getUserMessage();
    }
}