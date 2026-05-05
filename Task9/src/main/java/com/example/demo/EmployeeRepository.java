package com.example.demo;

import java.util.Map;

import org.springframework.stereotype.Component;

@Component
public class EmployeeRepository {

    private final Map<Integer, Employee> store = Map.of(
            101, new Employee(101, "Anand", "cse"),
            102, new Employee(102, "Ravi", "it"),
            103,new Employee(103,"anand","ece")
    );

    public Employee findById(int id) {
        return store.get(id);
    }
}