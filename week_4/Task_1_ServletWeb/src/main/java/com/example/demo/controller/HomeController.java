package com.example.demo.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    // 4.1 Root URL
    @GetMapping("/")
    public String home() {
        return "Spring Boot Servlet Application Running Successfully!";
    }

    // 4.2 Simple mapping
    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot!";
    }

    // 4.3 Path Variable
    @GetMapping("/hello/{name}")
    public String greet(@PathVariable String name) {
        return "Hello " + name;
    }
}