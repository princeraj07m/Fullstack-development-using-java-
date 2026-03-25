package com.example.user_service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class UserController {

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping("/user/shop")
    public String viewProducts() {
        // Notice we don't use localhost:8081! We use the application name "product-service".
        String products = restTemplate.getForObject("http://product-service/products", String.class);
        return "Welcome User! Here are the items from the Product Service: " + products;
    }
}