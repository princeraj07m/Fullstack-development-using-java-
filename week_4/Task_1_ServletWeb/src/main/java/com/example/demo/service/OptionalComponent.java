package com.example.demo.service;

import org.springframework.stereotype.Component;

@Component
public class OptionalComponent {

    public String optionalMessage() {
        return "Optional Component is available!";
    }
}