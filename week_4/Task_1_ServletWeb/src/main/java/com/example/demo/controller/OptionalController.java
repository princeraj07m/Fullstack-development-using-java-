package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.service.OptionalComponent;

@RestController
public class OptionalController {

    @Autowired(required = false)
    private OptionalComponent optionalComponent;

    @GetMapping("/optional")
    public String checkOptional() {
        if (optionalComponent != null) {
            return optionalComponent.optionalMessage();
        } else {
            return "Optional Component is NOT available.";
        }
    }
}